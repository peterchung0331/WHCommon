# 테스트 환경 가이드

## 개요
WBHubManager 프로젝트의 로컬 및 프로덕션 E2E 테스트 환경 설정 가이드입니다.

---

## 1. 테스트 환경 종류

### 로컬 테스트 (Local)
- **대상**: `http://localhost:4090` (백엔드 개발 서버)
- **용도**: 개발 중 기능 검증
- **실행 명령**: `npm run test:local`
- **설정 파일**: `playwright.local.config.ts`

### 프로덕션 테스트 (Production)
- **대상**: `https://wbhub.up.railway.app` (Railway 배포 서버)
- **용도**: 배포 후 전체 기능 검증
- **실행 명령**: `npm run test:prod`
- **설정 파일**: `playwright.prod.config.ts`

---

## 2. 필수 의존성 설치

```bash
# Playwright 및 Chromium 설치
npm install -D @playwright/test
npx playwright install chromium
```

---

## 3. 테스트 설정 파일

### playwright.local.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/local.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:4090',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  timeout: 30000,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

### playwright.prod.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1, // 프로덕션 테스트는 순차 실행
  reporter: [
    ['html', { outputFolder: 'test-results/html-report-prod' }],
    ['json', { outputFile: 'test-results/prod.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PROD_URL || 'https://wbhub.up.railway.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  timeout: 60000, // 프로덕션은 네트워크 지연 고려하여 60초
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results/screenshots-prod',
});
```

---

## 4. 테스트 스크립트 (package.json)

```json
{
  "scripts": {
    "test:local": "npx playwright test --config=playwright.local.config.ts && node tests/utils/log-results.cjs local",
    "test:prod": "npx playwright test --config=playwright.prod.config.ts && node tests/utils/log-results.cjs prod"
  }
}
```

---

## 5. 테스트 구조

```
tests/
├── e2e/
│   ├── pages.spec.ts       # P-01~05: 페이지 렌더링 테스트
│   ├── api.spec.ts         # API-01~06: API 엔드포인트 테스트
│   └── auth.spec.ts        # A-01~06, S-01~03: JWT 인증 및 보안 테스트
└── utils/
    └── log-results.cjs     # 테스트 결과 히스토리 기록
```

---

## 6. 테스트 케이스 목록

### 페이지 렌더링 (5개)
- **P-01**: `/` (root) - API 서버 상태 확인
- **P-02**: `/hubs` - Hub 선택 화면 렌더링
- **P-03**: `/splash` - Splash 페이지 렌더링
- **P-04**: `/docs` - 문서 목록 렌더링
- **P-05**: `/api/health` - API 상태 확인

### API 엔드포인트 (6개)
- **API-01**: `GET /api/health` - 서버 상태 확인
- **API-02**: `GET /api/hubs` - Hub 목록 조회
- **API-03**: `GET /api/documents` - 문서 목록 조회
- **API-04**: `GET /api/auth/public-key` - JWT 공개키 조회
- **API-05**: `POST /api/auth/verify` - 토큰 검증 (토큰 없음)
- **API-06**: `POST /api/auth/refresh` - 토큰 갱신 (토큰 없음)

### JWT 인증 (6개)
- **A-01**: `POST /api/auth/google-login` - JWT 토큰 발급
- **A-02**: `POST /api/auth/verify` - Access Token 검증
- **A-03**: `POST /api/auth/refresh` - 토큰 갱신
- **A-04**: `POST /api/auth/jwt-logout` - 로그아웃
- **A-05**: `POST /api/auth/verify` - 잘못된 토큰 검증
- **A-06**: Rate Limiting - 로그인 요청 제한

### JWT 보안 (3개)
- **S-01**: 알고리즘 혼동 공격 - none 알고리즘 거부
- **S-02**: 알고리즘 제한 - HS256 거부
- **S-03**: 토큰 크기 제한 - 과대 토큰 거부

**총 20개 테스트**

---

## 7. 로컬 테스트 실행 방법

### 1단계: 백엔드 개발 서버 실행
```bash
npm run dev
```

### 2단계: 로컬 테스트 실행 (새 터미널)
```bash
npm run test:local
```

### 예상 결과
```
Running 20 tests using 1 worker
  ✓ 20 passed (30s)
```

---

## 8. 프로덕션 테스트 실행 방법

### 전제조건
1. Railway에 배포 완료
2. 환경변수 설정 완료 (아래 참조)

### 실행
```bash
npm run test:prod
```

### 예상 결과
```
Running 20 tests using 1 worker
  ✓ 20 passed (29.6s)
```

---

## 9. Railway 환경변수 설정

### 필수 환경변수

#### JWT 키 (Base64 인코딩 방식 - 권장)

**로컬에서 base64 인코딩:**
```bash
# Private Key
cat server/keys/private.pem | base64 -w 0

# Public Key
cat server/keys/public.pem | base64 -w 0
```

**Railway 환경변수:**
- `JWT_PRIVATE_KEY`: base64로 인코딩된 RSA 개인키
- `JWT_PUBLIC_KEY`: base64로 인코딩된 RSA 공개키

#### JWT 설정 (선택사항)
- `JWT_ISSUER`: 기본값 `wbhubmanager`
- `JWT_AUDIENCE`: 기본값 `wbsaleshub,wbfinhub`
- `ACCESS_TOKEN_EXPIRES_IN`: 기본값 `15m`
- `REFRESH_TOKEN_EXPIRES_IN`: 기본값 `7d`

---

## 10. JWT 키 로딩 방식

코드는 두 가지 형식을 자동 감지합니다:

### 방식 1: Base64 인코딩 (권장)
```bash
# Railway 환경변수에 base64 문자열 저장
JWT_PRIVATE_KEY=LS0tLS1CRUdJTi...
JWT_PUBLIC_KEY=LS0tLS1CRUdJTi...
```

### 방식 2: Plain Text (이스케이프된 개행)
```bash
# Railway 환경변수에 \n으로 개행 표시
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvwIBAD...\n-----END PRIVATE KEY-----\n
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIjANBg...\n-----END PUBLIC KEY-----\n
```

### 방식 3: 파일 (로컬 개발용)
환경변수가 없으면 자동으로 파일에서 로드:
- `server/keys/private.pem`
- `server/keys/public.pem`

구현 위치: [server/config/jwt.config.ts](../server/config/jwt.config.ts#L22-L65)

---

## 11. 테스트 결과 히스토리

### 자동 로깅
테스트 실행 후 자동으로 `test-results/history.md`에 기록됩니다.

### 히스토리 파일 형식
```markdown
### 2025-12-29 13:46:07 | prod | PASS
- 전체 통과 (20건)

### 2025-12-29 12:30:00 | local | PASS
- 전체 통과 (20건)
```

### JSON 요약
```json
{
  "status": "PASS",
  "environment": "prod",
  "timestamp": "2025-12-29 13:46:07",
  "summary": {
    "total": 20,
    "passed": 20,
    "failed": 0
  },
  "failures": []
}
```

---

## 12. 디버깅

### 테스트 실패 시
```bash
# HTML 리포트 확인
npx playwright show-report test-results/html-report-prod

# 특정 테스트만 실행
npx playwright test --config=playwright.prod.config.ts -g "A-01"

# Trace 확인
npx playwright show-trace test-results/screenshots-prod/.../trace.zip
```

### Railway 로그 확인
```bash
# Railway CLI 설치 후
railway logs
```

---

## 13. 트러블슈팅

### 문제 1: JWT 키 로딩 실패
**증상**: `JWT private key not loaded`

**해결책**:
1. Railway 환경변수 확인
2. base64 인코딩이 올바른지 확인
3. Railway 로그에서 `✅ JWT keys loaded from environment variables` 확인

### 문제 2: 로컬 테스트에서 P-01 실패
**증상**: `404 on root path`

**해결책**:
- 로컬 테스트는 백엔드만 테스트합니다 (포트 4090)
- P-01은 `/api/health` 엔드포인트를 확인하도록 수정되었습니다

### 문제 3: Rate Limiting 테스트 실패
**증상**: A-06 테스트 실패

**해결책**:
- Rate Limit은 IP 기반이므로 테스트 간 간격을 두고 실행
- 필요시 `server/middleware/rateLimit.ts`에서 제한 완화

---

## 14. 최근 테스트 결과 (2025-12-29)

### 로컬 테스트
- **결과**: ✅ 20/20 통과
- **실행 시간**: ~30초

### 프로덕션 테스트
- **결과**: ✅ 20/20 통과
- **실행 시간**: ~29.6초
- **URL**: https://wbhub.up.railway.app

---

## 15. 참고 문서

- [ppQA.md](./ppQA.md) - QA 테스트 전체 명세
- [Playwright 공식 문서](https://playwright.dev)
- [Railway 환경변수 가이드](https://docs.railway.app/develop/variables)
