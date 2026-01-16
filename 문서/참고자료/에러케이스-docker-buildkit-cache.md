# 에러 케이스: Docker BuildKit 캐시 문제

## 발생 날짜
2026-01-16

## 프로젝트
WBSalesHub (Cookie SSO 구현)

## 에러 증상
- TypeScript 소스 코드는 수정되었으나, 컨테이너 안의 컴파일된 JavaScript는 이전 코드가 남아있음
- `git pull` 후 Docker 빌드를 해도 변경사항이 반영되지 않음
- E2E 테스트는 통과했지만, 실제 브라우저 테스트에서 404 에러 발생

## 구체적인 상황
1. 로컬에서 `server/routes/authRoutes.ts` 수정:
   ```typescript
   // 수정 전
   return res.redirect(`${frontendUrl}/login?error=no_token`);

   // 수정 후
   return res.redirect('/login?error=no_token');
   ```

2. Git commit & push 완료 (a8f57d4)

3. 오라클 서버에서 `git pull` 완료 - 소스 코드 확인됨

4. `docker build -t wbsaleshub:staging .` 실행

5. 빌드 로그에서 모든 레이어 CACHED로 표시:
   ```
   #14 [backend-builder 4/7] COPY server ./server
   #14 CACHED

   #19 [backend-builder 7/7] RUN npm run build:server
   #19 CACHED
   ```

6. 컨테이너 시작 후 테스트:
   ```bash
   curl -I http://localhost:4010/auth/sso-complete
   # Location: https://staging.workhub.biz:4400/saleshub/login?error=no_token (이전 코드)
   ```

7. 컨테이너 내부 확인:
   ```bash
   docker exec wbsaleshub-staging grep -A 1 'Redirecting to /login' /app/dist/server/routes/authRoutes.js
   # return res.redirect(`${frontendUrl}/login?error=no_token`); (이전 코드)
   ```

## 근본 원인
- **Docker BuildKit은 파일 내용의 해시를 기준으로 캐시를 판단**
- Git pull로 파일을 가져왔지만, Docker BuildKit의 전역 빌드 캐시가 이전 빌드 결과를 가지고 있음
- `docker rmi` (이미지 삭제)만으로는 빌드 캐시가 삭제되지 않음
- BuildKit 캐시는 **별도 저장소**에 보관됨

## 잘못된 해결 시도

### 1. 컨테이너/이미지 삭제 (❌ 실패)
```bash
docker stop wbsaleshub-staging
docker rm wbsaleshub-staging
docker rmi wbsaleshub:staging
docker build -t wbsaleshub:staging .
# → 여전히 CACHED 레이어 사용
```

**이유**: 빌드 캐시는 이미지와 별도로 관리됨

### 2. `--no-cache` 플래그 사용 (❌ 금지)
```bash
docker build --no-cache -t wbsaleshub:staging .
```

**이유**: Docker 빌드 최적화 가이드에서 **명시적으로 금지**
- BuildKit 캐시 마운트의 효과를 무효화
- 빌드 시간 70-90% 증가
- npm 의존성 다시 다운로드 (네트워크 낭비)

### 3. 파일 수정 타임스탬프 변경 (❌ 실패)
```bash
touch server/routes/authRoutes.ts
docker build -t wbsaleshub:staging .
# → 여전히 CACHED
```

**이유**: BuildKit은 **파일 내용의 해시**를 사용, 타임스탬프 무시

### 4. 더미 주석 추가 후 빌드 (❌ 부분 성공하나 비권장)
```bash
echo '// Cache bust' >> server/routes/authRoutes.ts
docker build -t wbsaleshub:staging .
```

**이유**: Git 커밋하지 않으면 다음 `git pull` 시 충돌 발생

## 올바른 해결 방법

### ✅ 빌드 캐시 삭제 (권장)
```bash
# 빌드 캐시 전체 삭제
docker builder prune -f

# 다시 빌드 (캐시 없이 진행됨)
DOCKER_BUILDKIT=1 docker build -t wbsaleshub:staging .
```

**효과**:
- 빌드 시간: 약 2-3분 (캐시 없이)
- 모든 레이어 재빌드
- 소스 코드 변경사항 확실히 반영

**장점**:
- 가장 확실한 해결 방법
- BuildKit 캐시 마운트 기능은 유지 (npm 다운로드 여전히 빠름)
- `--no-cache`보다 훨씬 빠름 (캐시 마운트는 사용)

### 대안: 특정 빌드 단계만 재실행
```bash
# Dockerfile에 ARG 추가
ARG CACHEBUST=1

# COPY 전에 ARG 사용
ARG CACHEBUST
RUN echo "Cache bust: $CACHEBUST"
COPY server ./server

# 빌드 시 현재 시간으로 CACHEBUST 전달
docker build --build-arg CACHEBUST=$(date +%s) -t wbsaleshub:staging .
```

## 예방 방법

### 1. 빌드 전 캐시 상태 확인
```bash
# 최근 빌드 캐시 크기 확인
docker system df

# 빌드 캐시 상세 정보
docker builder du
```

### 2. 주기적인 캐시 정리
```bash
# 7일 이상 사용하지 않은 캐시 삭제
docker builder prune --filter until=168h -f

# 또는 자동화 스크립트 추가
```

### 3. CI/CD 파이프라인에서 명시적 캐시 무효화
```yaml
# GitHub Actions 예시
- name: Clear Docker build cache
  run: docker builder prune -f

- name: Build Docker image
  run: DOCKER_BUILDKIT=1 docker build -t app:latest .
```

## 학습 포인트

1. **Docker 이미지 ≠ 빌드 캐시**
   - 이미지 삭제만으로는 캐시가 남아있음
   - `docker builder prune`으로 캐시 삭제 필요

2. **BuildKit 캐시는 내용 기반 (Content-Addressable)**
   - 파일 타임스탬프가 아닌 **파일 내용의 해시** 사용
   - Git pull로 파일을 가져와도 내용이 같으면 캐시 사용

3. **`--no-cache`는 최후의 수단**
   - 빌드 최적화 가이드에서 금지
   - `docker builder prune -f`가 훨씬 효율적

4. **E2E 테스트 통과 ≠ 배포 성공**
   - 테스트는 통과했지만 실제 빌드에는 이전 코드가 포함될 수 있음
   - 배포 후 실제 엔드포인트 동작 확인 필요

## 관련 문서
- `/home/peterchung/WHCommon/문서/가이드/Docker-빌드-최적화-가이드.md`
- `/home/peterchung/WHCommon/작업기록/완료/2026-01-16-cookie-sso-implementation.md`

## 태그
`#docker` `#buildkit` `#cache` `#debugging` `#deployment` `#troubleshooting`
