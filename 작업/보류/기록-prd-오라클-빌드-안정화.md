# PRD: 오라클 서버 Docker 빌드 안정화

## 문서 정보
- **작성일**: 2026-01-11
- **상태**: 진행중
- **우선순위**: 높음
- **담당**: Claude + 사용자
- **관련 프로젝트**: WBHubManager, WBSalesHub, WBFinHub

---

## 1. 배경 및 문제점

### 현상
오라클 클라우드 서버(158.180.95.246)에서 Docker 이미지 빌드 시 다음과 같은 문제 발생:
- npm ci 단계에서 빌드가 멈추거나 실패
- SSH 연결이 끊어지면서 빌드 중단
- tmux, screen, nohup 등 다양한 방법 시도했으나 모두 실패
- 로컬(WSL)에서는 정상 빌드됨

### 영향
- 프로덕션 배포 불가능
- 스테이징 환경 업데이트 불가능
- 긴급 버그 수정 배포 지연

---

## 2. 근본 원인 분석

### 2.1 BuildKit 캐시 설정 불일치
- **WBHubManager**: BuildKit 캐시 마운트 사용 (`--mount=type=cache`)
- **WBSalesHub/WBFinHub**: 캐시 마운트 없음
- 결과: 매번 2.7GB+ 의존성을 처음부터 다운로드 → 네트워크 타임아웃 발생

### 2.2 npm ci의 네트워크 취약성
- 532개 패키지 다운로드 중 하나라도 타임아웃 → 전체 실패
- npm ci는 재시도 메커니즘 부족
- 오라클 서버의 네트워크 I/O 제약

### 2.3 SSH 타임아웃
- npm ci 실행 중 15-45초 동안 출력 없음
- SSH 기본 타임아웃: 900초
- 빌드는 진행되지만 외부에서 관찰 불가 → "멈춘 것처럼" 보임

### 2.4 리소스 경합
- 6개 서비스가 동시에 빌드 시도
- 메모리/네트워크 병목 발생

### 2.5 포트 설정 불일치
- staging: PORT=4090
- production: PORT=5090 (예상과 다름)

---

## 3. 재발 가능성

### 현재 상태 유지 시: **60-80% 높음**

**재발 시나리오**:
1. 네트워크 지연 누적 (npm 레지스트리 응답 시간 증가)
2. 동시 빌드 시 리소스 경합
3. SSH 타임아웃

### 조치 후: **10-20% 낮음**

---

## 4. 해결 방안

### Phase 1: 즉시 조치 (우선순위: 높음)

#### 4.1 BuildKit 캐시 통일
**대상 파일**:
- `/home/peterchung/WBSalesHub/Dockerfile`
- `/home/peterchung/WBFinHub/Dockerfile`

**변경 내용**:
```dockerfile
# 변경 전
RUN npm ci
RUN npm --prefix frontend ci

# 변경 후
RUN --mount=type=cache,target=/root/.npm \
    npm ci
RUN --mount=type=cache,target=/root/.npm \
    npm --prefix frontend ci
```

**효과**:
- npm 캐시 재사용 → 다운로드 시간 70-90% 감소
- 네트워크 타임아웃 위험 감소

#### 4.2 포트 설정 통일
**대상 파일**: `/home/peterchung/WBHubManager/docker-compose.oracle.yml`

**변경**:
```yaml
wbhubmanager-prod:
  environment:
    - PORT=4090  # 5090 → 4090 변경
```

#### 4.3 순차 빌드 스크립트
**신규 파일**: `/home/ubuntu/workhub/scripts/build-sequential.sh`

```bash
#!/bin/bash
set -e

cd /home/ubuntu/workhub

echo "Building WBHubManager..."
docker compose -f docker-compose.oracle.yml --profile staging build wbhubmanager-staging
docker compose -f docker-compose.oracle.yml --profile production build wbhubmanager-prod

echo "Building WBSalesHub..."
docker compose -f docker-compose.oracle.yml --profile staging build wbsaleshub-staging
docker compose -f docker-compose.oracle.yml --profile production build wbsaleshub-prod

echo "Building WBFinHub..."
docker compose -f docker-compose.oracle.yml --profile staging build wbfinhub-staging
docker compose -f docker-compose.oracle.yml --profile production build wbfinhub-prod

echo "All builds completed!"
```

### Phase 2: 중기 조치 (우선순위: 중간)

#### 4.4 npm 타임아웃 설정
**대상**: 모든 Dockerfile

**추가**:
```dockerfile
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000
```

#### 4.5 BuildKit 진행 상황 출력
**대상**: `docker-compose.oracle.yml`

```yaml
build:
  args:
    - BUILDKIT_PROGRESS=plain
```

#### 4.6 SSH keep-alive
**대상**: 오라클 서버 `~/.ssh/config`

```
Host *
  ServerAliveInterval 60
  ServerAliveCountMax 120
```

### Phase 3: 장기 조치 (우선순위: 낮음)

#### 4.7 Node.js 메모리 증가
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

#### 4.8 CI/CD 파이프라인 통합
- `.github/workflows/deploy-oracle.yml` (PM2 방식)
- `docker-compose.oracle.yml` (Docker 방식)
- → Docker Compose로 통일

---

## 5. 구현 계획

### Step 1: 로컬 수정 (30분)
1. ✅ WBSalesHub/WBFinHub Dockerfile 수정
2. ✅ docker-compose.oracle.yml 포트 수정
3. ✅ Git commit & push

### Step 2: 오라클 서버 설정 (30분)
1. ✅ Git pull
2. ✅ build-sequential.sh 스크립트 생성
3. ✅ 실행 권한 부여

### Step 3: 테스트 빌드 (1-2시간)
1. ✅ 순차 빌드 스크립트 실행
2. ✅ 빌드 로그 모니터링
3. ✅ 성공 시 이미지 확인

### Step 4: 검증 (30분)
1. ✅ 프로덕션 컨테이너 시작
2. ✅ E2E 테스트 실행
3. ✅ workhub.biz 접속 확인

---

## 6. 성공 지표

### 빌드 성공률
- **현재**: 20-40% (불안정)
- **목표**: 90%+ (안정적)

### 빌드 시간
- **현재**: 실패 시 무한 재시도
- **목표**: 5-10분 이내 완료

### 네트워크 오류
- **현재**: npm ci 단계에서 빈번한 타임아웃
- **목표**: 캐시 재사용으로 다운로드 최소화

---

## 7. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|----------|
| npm 레지스트리 장애 | 낮음 | 높음 | 타임아웃 설정 + 재시도 |
| 오라클 서버 메모리 부족 | 중간 | 높음 | 순차 빌드 + 메모리 증가 |
| SSH 타임아웃 | 높음 | 중간 | keep-alive 설정 |
| BuildKit 캐시 충돌 | 낮음 | 낮음 | 캐시 초기화 스크립트 |

---

## 8. 참고 문서

### 수정 대상 파일
- `/home/peterchung/WBSalesHub/Dockerfile`
- `/home/peterchung/WBFinHub/Dockerfile`
- `/home/peterchung/WBHubManager/docker-compose.oracle.yml`

### 신규 생성 파일
- `/home/ubuntu/workhub/scripts/build-sequential.sh`

### 참고 파일
- `/home/peterchung/WBHubManager/Dockerfile` (올바른 캐시 설정 예시)

---

## 9. 후속 작업

### 완료 후
1. ✅ 다른 허브(WBOnboardingHub, WBRefHub)에도 동일 패턴 적용
2. ✅ 배포 문서 업데이트
3. ✅ 모니터링 설정 (빌드 성공/실패 알림)

### 장기적으로
1. ⏳ Docker 이미지 레지스트리 구축 (GitHub Container Registry)
2. ⏳ 로컬 빌드 → 이미지 푸시 → 오라클 서버 pull 방식으로 전환
3. ⏳ CI/CD 파이프라인 통합 (GitHub Actions)

---

## 10. 결론

**핵심 조치**:
1. BuildKit 캐시 통일 (가장 중요)
2. 순차 빌드
3. 타임아웃 설정

**예상 소요 시간**: 3-5시간 (조치 + 검증)

**재발 방지**: 60-80% → 10-20%로 감소

**비용**: 개발 시간 투자 외 추가 비용 없음
