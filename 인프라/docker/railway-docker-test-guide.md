# Railway 배포 환경 Docker 테스트 가이드

**Created:** 2025-12-31
**Purpose:** Railway 프로덕션 환경과 동일한 설정으로 로컬 Docker 테스트

## 개요

이 가이드는 Railway 프로덕션 배포 환경을 로컬 Docker에서 완벽하게 재현하여 테스트하는 방법을 설명합니다.

### 테스트 범위
- **WBHubManager**: Gateway 역할의 Hub 관리 시스템
- **WBFinHub**: 재무 관리 Hub
- **PostgreSQL**: 각 Hub별 독립된 데이터베이스
- **SSO 인증**: JWT 기반 Hub 간 인증 플로우

### 제외 항목
- WBSalesHub, OnboardingHub: Railway 실제 서비스로 프록시

---

## Railway vs Docker 환경 비교

| 항목 | Railway | Docker 로컬 | 비고 |
|------|---------|-------------|------|
| **빌드 방식** | Nixpacks | docker-compose build | 동일한 Node.js 20, 멀티 스테이지 빌드 |
| **환경변수** | Railway UI | .env.railway-test | railway-env.md에서 자동 추출 |
| **데이터베이스** | Railway PostgreSQL | postgres:16-alpine | 동일한 PostgreSQL 16 |
| **네트워크** | Railway 내부 DNS | Docker bridge | 내부 통신 방식 동일 |
| **포트** | 자동 할당 | 4090, 3020, 4020 | 명시적 매핑 |
| **SSL/TLS** | 자동 HTTPS | HTTP | 개발 환경이므로 영향 낮음 |
| **도메인** | up.railway.app | localhost | 테스트 가능 |
| **재시작 정책** | ON_FAILURE (최대 10회) | unless-stopped | 동작 유사 |

---

## 사전 준비

### 1. 필수 저장소 클론
```bash
cd c:/GitHub
git clone <WBHubManager-repo>
git clone <WBFinHub-repo>
```

### 2. Docker Desktop 실행
- Docker Desktop이 실행 중이어야 합니다
- 최소 메모리: 4GB 권장
- 포트 확인: 4090, 3020, 4020, 5433, 5434

### 3. Railway 환경변수 최신화
`Common/railway-env.md` 파일에 Railway 대시보드의 최신 환경변수가 저장되어 있는지 확인:
```bash
# Railway 대시보드에서 환경변수 확인
# Variables 탭 → 모든 환경변수 복사
# Common/railway-env.md의 ```env 블록에 붙여넣기
```

---

## 실행 방법

### 자동 실행 (권장)

```bash
cd c:/GitHub/WBHubManager
npm run test:railway
```

**자동으로 수행되는 작업:**
1. `railway-env.md`에서 환경변수 추출
2. `.env.railway-test` 파일 생성
3. Docker 이미지 빌드 (WBHubManager, WBFinHub)
4. PostgreSQL 컨테이너 시작 (2개)
5. 애플리케이션 컨테이너 시작
6. Health check 수행
7. 테스트 완료 후 로그 출력

### 수동 실행

#### 1단계: 환경변수 파일 생성
```bash
# railway-env.md에서 env 블록을 복사하여 .env.railway-test 생성
# 또는 직접 편집
cp Common/railway-env.md .env.railway-test
```

#### 2단계: Docker Compose 빌드
```bash
docker-compose -f docker-compose.railway.yml build
```

예상 빌드 시간: 5-10분 (최초 빌드)

#### 3단계: 컨테이너 실행
```bash
docker-compose -f docker-compose.railway.yml up -d
```

#### 4단계: Health Check
```bash
# WBHubManager
curl http://localhost:4090/api/health

# WBFinHub Backend
curl http://localhost:4020/api/health

# WBFinHub Frontend
curl http://localhost:3020
```

#### 5단계: 로그 확인
```bash
# 전체 로그
docker-compose -f docker-compose.railway.yml logs -f

# 특정 서비스
docker logs railway-wbhubmanager -f
docker logs railway-wbfinhub -f
```

#### 6단계: 정리
```bash
# 컨테이너 중지 및 제거
docker-compose -f docker-compose.railway.yml down

# 볼륨까지 제거 (데이터 초기화)
docker-compose -f docker-compose.railway.yml down -v

# 환경변수 파일 삭제
rm .env.railway-test
```

---

## 테스트 시나리오

### 1. 빌드 검증

**목적**: Railway Nixpacks 빌드와 동일한 결과 확인

**확인 항목:**
- ✅ TypeScript 컴파일 성공 (`dist/server/index.js` 생성)
- ✅ Next.js 빌드 성공 (`frontend/.next` 생성)
- ✅ Prisma Client 생성 성공
- ✅ 빌드 시간 10분 이내

**실행:**
```bash
docker-compose -f docker-compose.railway.yml build --no-cache
```

### 2. 환경변수 검증

**목적**: JWT 키 등 Railway 환경변수 정상 로드 확인

**확인 항목:**
- ✅ JWT Private/Public 키 로드 성공
- ✅ DB 연결 문자열 정상
- ✅ Google OAuth Client ID/Secret 설정
- ✅ Session Secret 설정

**실행:**
```bash
# WBHubManager 로그 확인
docker logs railway-wbhubmanager 2>&1 | grep "JWT"

# 예상 출력:
# ✅ JWT keys loaded from environment variables
```

### 3. 데이터베이스 연결

**목적**: 각 Hub별 독립된 DB 연결 확인

**확인 항목:**
- ✅ WBHubManager → `postgres-hubmanager:5432`
- ✅ WBFinHub → `postgres-finhub:5432`
- ✅ DB 마이그레이션 성공
- ✅ 테이블 생성 완료

**실행:**
```bash
# PostgreSQL 컨테이너 접속
docker exec -it railway-postgres-hubmanager psql -U postgres -d railway

# 테이블 목록 확인
\dt

# WBFinHub DB 확인
docker exec -it railway-postgres-finhub psql -U postgres -d railway
\dt
```

### 4. SSO 인증 플로우

**목적**: Hub 간 JWT SSO 토큰 생성 및 검증

**시나리오:**
1. WBHubManager에서 `/api/auth/generate-hub-token` 호출
2. JWT 토큰 생성 (RS256, Private Key 사용)
3. WBFinHub로 토큰 전달
4. WBFinHub에서 Public Key로 검증

**수동 테스트:**
```bash
# 1. Google OAuth 로그인 (브라우저)
open http://localhost:4090

# 2. Hub 선택 페이지에서 WBFinHub 클릭

# 3. SSO 토큰으로 WBFinHub 리다이렉션 확인
# 예상 URL: http://localhost:3020/auth/sso?token=eyJhbGciOiJSUzI1NiIs...

# 4. WBFinHub 대시보드 로드 성공
```

### 5. API 엔드포인트 테스트

**WBHubManager:**
```bash
# Health check
curl http://localhost:4090/api/health

# Hub 목록
curl http://localhost:4090/api/hubs

# 인증 상태 (세션 필요)
curl http://localhost:4090/api/auth/me \
  -H "Cookie: connect.sid=..."
```

**WBFinHub:**
```bash
# Health check
curl http://localhost:4020/api/health

# 인증 상태 (JWT 토큰 필요)
curl http://localhost:4020/api/auth/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Railway 특화 설정

### JWT 키 포맷

Railway 환경변수는 멀티라인을 지원합니다:

```env
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwgg...
...
-----END PRIVATE KEY-----
```

Docker `.env` 파일에서도 동일하게 사용:
- `\n`으로 줄바꿈하지 **않음**
- PEM 포맷 그대로 여러 줄로 작성
- `-----BEGIN`과 `-----END` 포함 필수

### Database URL 포맷

**Railway PostgreSQL:**
```
DATABASE_URL=postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway
```

**Docker (로컬):**
```
DATABASE_URL=postgresql://postgres:PASSWORD@postgres-hubmanager:5432/railway
```

차이점:
- 호스트: Railway 프록시 → Docker 컨테이너명
- 포트: Railway 동적 포트 → 고정 5432
- DB 이름: 동일 (`railway`)

### 네트워크 통신

**Railway (프로덕션):**
```
WBFinHub URL: https://wbfinhub.up.railway.app
```

**Docker (로컬):**
```
WBFinHub Backend: http://wbfinhub:4020 (내부 네트워크)
WBFinHub Frontend: http://localhost:3020 (외부 접근)
```

---

## 문제 해결

### JWT 키 로드 실패

**증상:**
```
Error: JWT keys from environment variables are not in correct format
```

**원인:** PEM 포맷이 손상되었거나 BEGIN/END가 누락됨

**해결:**
1. `Common/railway-env.md` 열기
2. ```env 블록에서 `JWT_PRIVATE_KEY` 확인
3. `-----BEGIN PRIVATE KEY-----`로 시작하는지 확인
4. `-----END PRIVATE KEY-----`로 끝나는지 확인
5. 줄바꿈이 제대로 되어 있는지 확인

### DB 연결 실패

**증상:**
```
Error: connect ECONNREFUSED postgres:5432
```

**원인:** PostgreSQL 컨테이너가 아직 준비되지 않음

**해결:**
1. `depends_on` 확인 (docker-compose.railway.yml)
2. Health check 대기 시간 증가:
   ```yaml
   healthcheck:
     start_period: 60s  # 40s → 60s
   ```
3. 수동으로 대기 후 재시작:
   ```bash
   docker-compose -f docker-compose.railway.yml up -d postgres-hubmanager
   sleep 10
   docker-compose -f docker-compose.railway.yml up -d wbhubmanager
   ```

### 포트 충돌

**증상:**
```
Error: bind: address already in use
```

**원인:** 이미 실행 중인 서비스가 포트 사용 중

**해결:**
```bash
# 포트 사용 확인 (Windows)
netstat -ano | findstr :4090
netstat -ano | findstr :3020
netstat -ano | findstr :4020

# 프로세스 종료
taskkill /PID <PID> /F

# 또는 Docker 컨테이너 정리
docker-compose -f docker-compose.railway.yml down
```

### 빌드 타임아웃

**증상:**
```
Error: failed to solve: executor failed running [/bin/sh -c npm run build]: exit code 137
```

**원인:** Docker Desktop 메모리 부족

**해결:**
1. Docker Desktop → Settings → Resources
2. Memory: 최소 4GB로 증가 (권장: 8GB)
3. Swap: 2GB로 증가
4. Apply & Restart

### TypeScript 컴파일 오류

**증상:**
```
error TS2304: Cannot find name 'xyz'
```

**원인:** 로컬 `node_modules`와 Docker 빌드 환경 불일치

**해결:**
```bash
# 로컬에서 빌드 테스트
cd c:/GitHub/WBHubManager
npm ci
npm run build

# 성공하면 Docker 빌드
docker-compose -f docker-compose.railway.yml build --no-cache
```

---

## Railway와의 차이점

### 영향도별 분류

#### 낮음 (무시 가능)
- **SSL/TLS**: Railway는 자동 HTTPS, Docker는 HTTP
  - 로컬 테스트에는 영향 없음
- **도메인**: Railway는 `up.railway.app`, Docker는 `localhost`
  - 환경변수로 URL 조정 가능
- **재시작 정책**: Railway는 `ON_FAILURE`, Docker는 `unless-stopped`
  - 동작 방식 유사

#### 중간 (인지 필요)
- **로그 수집**: Railway는 대시보드, Docker는 `docker logs`
  - 로그 확인 방법만 다름
- **환경변수 주입**: Railway는 UI, Docker는 `.env` 파일
  - 자동화 스크립트로 해결

#### 높음 (테스트 불가)
- **스케일링**: Railway는 수평 확장, Docker 로컬은 단일 인스턴스
  - 부하 테스트 불가
  - 다중 인스턴스 동작 검증 불가

### 보완 방법

스케일링 테스트가 필요한 경우:
1. Railway Staging 환경 활용
2. Docker Swarm 또는 Kubernetes 로컬 클러스터
3. Railway Preview 환경 (PR별 자동 배포)

---

## 자동화 스크립트 상세

### railway-docker-test.cjs 동작 방식

```
📂 scripts/railway-docker-test.cjs
├─ parseRailwayEnv()      # railway-env.md 파싱
├─ createEnvFile()        # .env.railway-test 생성
├─ buildDockerImages()    # docker-compose build
├─ startContainers()      # docker-compose up -d
├─ healthCheck()          # curl로 Health check
├─ showLogs()             # 컨테이너 로그 출력
└─ cleanup()              # 컨테이너 정리 (Ctrl+C 시)
```

### 사용 가능한 npm 스크립트

```bash
# 전체 자동 테스트 (권장)
npm run test:railway

# 빌드만 실행
npm run test:railway:build

# 컨테이너만 시작 (빌드 제외)
npm run test:railway:up

# 컨테이너 중지
npm run test:railway:down

# 실시간 로그
npm run test:railway:logs

# 완전 정리 (볼륨 포함)
npm run test:railway:clean
```

---

## 참고 자료

### 관련 문서
- [`Common/railway-env.md`](./railway-env.md) - Railway 환경변수 저장소
- [`docker-compose.railway.yml`](../docker-compose.railway.yml) - Docker Compose 설정
- [`scripts/railway-docker-test.cjs`](../scripts/railway-docker-test.cjs) - 자동화 스크립트
- [`tasks/railway-env-setup.md`](../tasks/railway-env-setup.md) - Railway 환경변수 설정 가이드
- [`Common/docker-test-guide.md`](./docker-test-guide.md) - 일반 Docker 테스트 가이드

### Railway 공식 문서
- [Railway Deployment](https://docs.railway.app/deploy/deployments)
- [Nixpacks](https://nixpacks.com/docs)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

### Docker 공식 문서
- [Docker Compose](https://docs.docker.com/compose/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Health checks](https://docs.docker.com/engine/reference/builder/#healthcheck)

---

## 버전 히스토리

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-12-31 | 초기 버전 작성 | Claude Code |

---

## 라이선스

이 문서는 WBHubManager 프로젝트의 일부입니다.
