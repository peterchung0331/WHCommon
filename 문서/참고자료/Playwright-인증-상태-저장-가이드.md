# Playwright 인증 상태 저장 및 재사용 가이드

## 개요

Playwright E2E 테스트에서 Google OAuth 로그인을 **한 번만 수행**하고, 저장된 인증 상태를 모든 테스트에서 재사용하는 시스템입니다.

**적용 대상**: WBHubManager, WBSalesHub, WBFinHub, WBOnboardingHub 등 모든 허브

**HWTestAgent 에러 패턴**: ID 65 (솔루션 ID 53)

---

## 장점

- ✅ **테스트 속도 향상**: OAuth 로그인을 한 번만 수행 (30초+ → 3초)
- ✅ **안정성**: Google OAuth Rate Limit 회피
- ✅ **CI/CD 자동화**: 환경변수로 계정 정보 전달
- ✅ **유지보수성**: 인증 로직 중앙화

---

## 파일 구조

```
프로젝트/
├── playwright.config.ts              # Setup 프로젝트 설정
├── e2e/
│   ├── auth.setup.ts                 # 인증 상태 저장 (1회 실행)
│   ├── production-sso-authenticated.spec.ts  # 인증 사용 테스트
│   ├── production-quick-check.spec.ts        # 인증 불필요 테스트
│   └── README-AUTH.md                # 상세 사용법
├── playwright/.auth/
│   └── user.json                     # 저장된 인증 상태 (Git 제외)
└── .gitignore                        # playwright/.auth/ 추가
```

---

## 구현 단계

### 1. auth.setup.ts 생성

**위치**: `e2e/auth.setup.ts`

**주요 코드**:
```typescript
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HUBMANAGER_URL = 'https://workhub.biz';
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate with Google OAuth', async ({ page, context }) => {
  // 1. 환경변수 확인
  const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL;
  const GOOGLE_PASSWORD = process.env.GOOGLE_PASSWORD;

  if (!GOOGLE_EMAIL || !GOOGLE_PASSWORD) {
    throw new Error('GOOGLE_EMAIL and GOOGLE_PASSWORD environment variables must be set');
  }

  // 2. HubManager 접속
  await page.goto(HUBMANAGER_URL, { waitUntil: 'networkidle' });

  // 3. Google 로그인 버튼 클릭
  const googleLoginButton = page.locator('button:has-text("Google"), button:has-text("구글")');
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    googleLoginButton.click()
  ]);

  // 4. 이메일 입력
  const emailInput = popup.locator('input[type="email"]');
  await emailInput.fill(GOOGLE_EMAIL);
  await popup.locator('button:has-text("Next"), button:has-text("다음")').click();

  // 5. 비밀번호 입력
  await popup.waitForLoadState('networkidle');
  const passwordInput = popup.locator('input[type="password"]');
  await passwordInput.fill(GOOGLE_PASSWORD);
  await popup.locator('button:has-text("Next"), button:has-text("Sign in")').click();

  // 6. 동의 화면 처리 (필요시)
  await page.waitForTimeout(3000);
  const consentButton = popup.locator('button:has-text("Allow"), button:has-text("허용")');
  const consentVisible = await consentButton.isVisible({ timeout: 5000 }).catch(() => false);
  if (consentVisible) {
    await consentButton.click();
  }

  // 7. 인증 상태 저장
  await page.context().storageState({ path: authFile });
  console.log('✅ Authentication state saved');
});
```

**주의사항**:
- ✅ ES 모듈 환경에서 `__dirname` 수동 계산 필수
- ✅ 환경변수 검증 필수
- ✅ 다국어 셀렉터 지원 (한글/영어)

---

### 2. playwright.config.ts 설정

**주요 설정**:
```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,  // 순차 실행 (인증 상태 공유)
  workers: 1,

  projects: [
    // Setup 프로젝트: 인증 상태 저장
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // 테스트 프로젝트: 저장된 인증 사용
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: process.env.CI ? true : false,
        // 저장된 인증 상태 사용 (SKIP_AUTH로 비활성화 가능)
        storageState: process.env.SKIP_AUTH ? undefined : 'playwright/.auth/user.json',
      },
      // setup 프로젝트 먼저 실행
      dependencies: process.env.SKIP_AUTH ? [] : ['setup'],
    },
  ],
});
```

**환경변수**:
- `SKIP_AUTH=true`: 인증 없이 테스트 실행 (헬스체크용)
- `CI=true`: CI/CD에서 headless 모드 강제

---

### 3. .gitignore 수정

**필수 추가**:
```gitignore
# Playwright 인증 상태 (Git 제외)
playwright/.auth/
```

**이유**: 인증 토큰/쿠키가 평문으로 저장되므로 Git에 커밋하면 보안 위험

---

## 사용 방법

### 로컬 환경

#### 1. 환경변수 설정

**Linux/Mac**:
```bash
export GOOGLE_EMAIL="biz.dev@wavebridge.com"
export GOOGLE_PASSWORD="your_password_here"
```

**Windows (PowerShell)**:
```powershell
$env:GOOGLE_EMAIL="biz.dev@wavebridge.com"
$env:GOOGLE_PASSWORD="your_password_here"
```

**또는 `.env.local` 파일**:
```bash
GOOGLE_EMAIL=biz.dev@wavebridge.com
GOOGLE_PASSWORD=your_password_here
```

#### 2. Setup 실행 (인증 상태 저장)

```bash
# Setup 프로젝트만 실행
npx playwright test --project=setup

# Headed 모드로 확인
npx playwright test --project=setup --headed
```

**결과**: `playwright/.auth/user.json` 파일 생성

#### 3. 테스트 실행 (저장된 인증 사용)

```bash
# 모든 테스트 실행 (setup 자동 실행)
npx playwright test

# 특정 테스트만
npx playwright test production-sso-authenticated.spec.ts

# Headed 모드
npx playwright test --headed
```

#### 4. 인증 없이 테스트 (헬스체크)

```bash
# SKIP_AUTH로 setup 건너뛰기
SKIP_AUTH=true npx playwright test production-quick-check.spec.ts
```

---

### CI/CD 환경

#### GitHub Actions 예시

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        env:
          GOOGLE_EMAIL: ${{ secrets.GOOGLE_EMAIL }}
          GOOGLE_PASSWORD: ${{ secrets.GOOGLE_PASSWORD }}
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**GitHub Secrets 설정**:
1. Repository → Settings → Secrets and variables → Actions
2. `GOOGLE_EMAIL` 추가
3. `GOOGLE_PASSWORD` 추가

---

## 테스트 시나리오 예시

### 인증 사용 테스트

**파일**: `e2e/production-sso-authenticated.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const HUBMANAGER_URL = 'https://workhub.biz';
const SALESHUB_URL = 'https://workhub.biz/saleshub';

test.describe('Production SSO with Saved Auth State', () => {
  test('should complete HubManager → SalesHub SSO flow', async ({ page, context }) => {
    // 1. HubManager 접근 (이미 인증됨)
    await page.goto(HUBMANAGER_URL, { waitUntil: 'networkidle' });
    expect(page.url()).not.toContain('/login');

    // 2. SSO 쿠키 확인
    const cookies = await context.cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'wbhub_access_token');
    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.domain).toBe('.workhub.biz');

    // 3. SalesHub 접근
    await page.goto(SALESHUB_URL, { waitUntil: 'networkidle' });

    // 4. 무한 리디렉션 없이 대시보드 표시
    expect(page.url()).toContain('/saleshub');
    expect(page.url()).not.toContain('/hubs');

    // 5. 페이지 새로고침 후 인증 유지
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/saleshub');
  });
});
```

### 인증 불필요 테스트

**파일**: `e2e/production-quick-check.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const SALESHUB_URL = 'https://workhub.biz/saleshub';

test.describe('Production Health Check', () => {
  test('should access SalesHub and see login page', async ({ page }) => {
    await page.goto(SALESHUB_URL, { waitUntil: 'networkidle' });

    // /hubs 리디렉션 루프 없음
    expect(page.url()).not.toContain('/hubs');
  });

  test('should verify API health endpoint', async ({ request }) => {
    const response = await request.get(`${SALESHUB_URL}/api/health`);
    expect(response.status()).toBe(200);
  });
});
```

---

## 문제 해결

### 1. "Access token cookie not found" 에러

**원인**: 인증 상태가 만료되었거나 저장되지 않음

**해결**:
```bash
rm playwright/.auth/user.json
npx playwright test --project=setup
```

### 2. "Google login button not found" 에러

**원인**: HubManager 로그인 페이지 구조 변경

**해결**: `e2e/auth.setup.ts`의 셀렉터 수정
```typescript
const googleLoginButton = page.locator(
  'button:has-text("Google"), button:has-text("구글"), a:has-text("Google"), [aria-label="Google"]'
);
```

### 3. OAuth 팝업이 닫히지 않음

**원인**: Google OAuth 동의 화면 처리 실패

**해결**: Headed 모드로 실행하여 수동 확인
```bash
npx playwright test --project=setup --headed
```

### 4. ES Module `__dirname` 에러

**증상**:
```
ReferenceError: __dirname is not defined in ES module scope
```

**해결**: `fileURLToPath` 사용
```typescript
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

---

## 보안 주의사항

1. **`playwright/.auth/user.json` Git 제외 (필수)**
   - `.gitignore`에 `playwright/.auth/` 추가됨
   - 절대 Git에 커밋하지 말 것

2. **환경변수 관리**
   - `.env.local` 사용 (Git 제외)
   - CI/CD에서는 Secrets 사용
   - 비밀번호 평문 노출 금지

3. **테스트 계정 사용**
   - 프로덕션 계정 사용 금지
   - `biz.dev@wavebridge.com` 전용 테스트 계정 사용
   - 권한 최소화

4. **인증 상태 유효기간**
   - 쿠키 만료 시 자동으로 setup 재실행
   - 주기적으로 인증 상태 갱신 권장 (1일 1회)

---

## 다른 허브에 적용하기

### 1. WBFinHub 예시

**1단계**: 파일 복사
```bash
# WBSalesHub에서 WBFinHub로 복사
cp -r /home/peterchung/WBSalesHub/e2e/auth.setup.ts \
      /home/peterchung/WBFinHub/e2e/
cp -r /home/peterchung/WBSalesHub/e2e/README-AUTH.md \
      /home/peterchung/WBFinHub/e2e/
```

**2단계**: playwright.config.ts 수정
```typescript
export default defineConfig({
  testDir: './e2e',
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        storageState: process.env.SKIP_AUTH ? undefined : 'playwright/.auth/user.json',
      },
      dependencies: process.env.SKIP_AUTH ? [] : ['setup'],
    },
  ],
});
```

**3단계**: .gitignore 추가
```bash
echo "playwright/.auth/" >> .gitignore
```

**4단계**: 테스트 작성
```typescript
// e2e/production-finhub-sso.spec.ts
test('should complete HubManager → FinHub SSO flow', async ({ page }) => {
  await page.goto('https://workhub.biz/finhub');
  expect(page.url()).toContain('/finhub');
  expect(page.url()).not.toContain('/hubs');
});
```

---

## HWTestAgent 에러 패턴 정보

**에러 패턴 ID**: 65
**솔루션 ID**: 53
**카테고리**: test

**검색 방법**:
```bash
curl "http://workhub.biz/testagent/api/error-patterns?query=playwright+google+oauth"
```

**적용 프로젝트**:
- WBSalesHub ✅
- WBHubManager ✅
- WBFinHub (적용 예정)
- WBOnboardingHub (적용 예정)

---

## 참고 자료

- [Playwright Authentication 공식 문서](https://playwright.dev/docs/auth)
- [storageState API](https://playwright.dev/docs/api/class-browsercontext#browser-context-storage-state)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- WBSalesHub `e2e/README-AUTH.md` (상세 사용법)

---

마지막 업데이트: 2026-01-18
작성자: Claude Code (HWTestAgent 연동)
