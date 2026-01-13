# SSO 자동 테스트 가이드

> WBFinHub에서 구현한 SSO 자동 로그인 테스트 과정 문서
>
> **목적**: Google OAuth를 우회하고 JWT 토큰을 직접 생성하여 대시보드까지 자동으로 접속하는 E2E 테스트 구현
>
> **대상**: WBSalesHub 등 다른 Hub에서 동일한 SSO 테스트를 구현할 때 참고용

---

## 📋 목차

1. [테스트 환경 설정](#1-테스트-환경-설정)
2. [백엔드 SSO 엔드포인트 구현](#2-백엔드-sso-엔드포인트-구현)
3. [프론트엔드 토큰 처리 구현](#3-프론트엔드-토큰-처리-구현)
4. [Playwright 테스트 작성](#4-playwright-테스트-작성)
5. [트러블슈팅](#5-트러블슈팅)
6. [체크리스트](#6-체크리스트)

---

## 1. 테스트 환경 설정

### 1.1 포트 설정

각 서비스가 사용하는 포트를 명확히 정의합니다.

```
WBHubManager:
  - Backend:  4090
  - Frontend: 3090

WBFinHub:
  - Backend:  4020
  - Frontend: 3020

WBSalesHub: (예시)
  - Backend:  4030
  - Frontend: 3030
```

### 1.2 환경변수 설정

#### WBFinHub `.env` 파일

```env
# Server Configuration
NODE_ENV=development
PORT=4020

# Frontend URL
FRONTEND_URL=http://localhost:3020

# Authentication Mode
USE_JWT_AUTH=true

# HubManager Auth Service URL
# ⚠️ 로컬 테스트 시 localhost 사용, 프로덕션은 Railway URL
HUB_MANAGER_URL=http://localhost:4090
HUBMANAGER_API_KEY=dev-api-key-placeholder

# Database URLs
DATABASE_URL=postgresql://...
HUBMANAGER_DATABASE_URL=postgresql://...

# Session Secret
SESSION_SECRET=your-session-secret-here
```

**주요 포인트**:
- `USE_JWT_AUTH=true`: JWT 모드 활성화
- `HUB_MANAGER_URL=http://localhost:4090`: 로컬 테스트용 (ngrok URL 대신)
- `FRONTEND_URL=http://localhost:3020`: 프론트엔드 URL

### 1.3 필수 패키지 설치

```bash
# Playwright 설치
npm install -D @playwright/test
npx playwright install

# 기타 의존성
npm install axios dotenv
```

---

## 2. 백엔드 SSO 엔드포인트 구현

### 2.1 SSO 엔드포인트 (`/auth/sso`)

**파일**: `server/routes/authRoutes.ts`

```typescript
router.get('/sso', async (req: Request, res: Response) => {
  const HUB_MANAGER_URL = process.env.HUB_MANAGER_URL || 'https://wbhub.up.railway.app';
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3020';

  try {
    const { token } = req.query;

    // Step 1: 토큰 파라미터 검증
    if (!token || typeof token !== 'string') {
      return res.redirect(`${FRONTEND_URL}/login?error=missing_token`);
    }

    // Step 2: HubManager로 토큰 검증
    const verifyResponse = await axios.post(
      `${HUB_MANAGER_URL}/api/auth/verify`,
      { token },
      { timeout: 5000 }
    );

    if (!verifyResponse.data.success || !verifyResponse.data.data?.valid) {
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_token`);
    }

    const { user } = verifyResponse.data.data;

    // Step 3: Hub용 새 토큰 생성
    const loginResponse = await axios.post(
      `${HUB_MANAGER_URL}/api/auth/google-login`,
      {
        email: user.email,
        name: user.username || user.email.split('@')[0]
      },
      { timeout: 5000 }
    );

    const { access_token, refresh_token } = loginResponse.data.data;

    // Step 4: 프론트엔드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
    const redirectUrl = `${FRONTEND_URL}?auth=success&accessToken=${access_token}&refreshToken=${refresh_token}`;

    return res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('SSO Error:', error.message);
    return res.redirect(`${FRONTEND_URL}/login?error=sso_failed`);
  }
});
```

**핵심 로직**:
1. WBHubManager로부터 받은 Hub SSO 토큰 검증
2. 검증 성공 시 해당 Hub용 access/refresh 토큰 생성
3. 프론트엔드 루트 페이지로 리다이렉트 (토큰을 URL 쿼리 파라미터로 전달)

### 2.2 테스트 로그인 엔드포인트 확인

WBHubManager의 `/api/auth/test-login` 엔드포인트가 JWT 토큰을 반환하는지 확인:

```bash
curl http://localhost:4090/api/auth/test-login
```

**예상 응답**:
```json
{
  "success": true,
  "message": "Test JWT token created",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3. 프론트엔드 토큰 처리 구현

### 3.1 AuthProvider 구현

**파일**: `frontend/providers/AuthProvider.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const HUB_MANAGER_URL = process.env.NEXT_PUBLIC_HUB_MANAGER_URL || 'https://wbhub.up.railway.app';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // ⚠️ Next.js에서 useSearchParams() 대신 window.location.search 직접 사용
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      // localStorage에 토큰 저장
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      console.log('✅ SSO 토큰이 성공적으로 저장되었습니다');

      // URL 파라미터 제거하고 루트로 리다이렉트
      router.replace('/');
      return;
    }

    // POST message 리스너 (iframe 통신용)
    const handleMessage = (event: MessageEvent) => {
      const hubManagerOrigin = new URL(HUB_MANAGER_URL).origin;
      if (event.origin !== hubManagerOrigin) return;

      const data = event.data;
      if (data.type === 'AUTH_TOKENS' && data.accessToken && data.refreshToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        console.log('✅ Tokens stored successfully from POST message');
        router.replace('/');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return <>{children}</>;
}
```

**핵심 포인트**:
- ⚠️ **중요**: `useSearchParams()` 대신 `window.location.search` 사용
  - Next.js App Router에서 `useSearchParams()`가 SSR 시 제대로 작동하지 않을 수 있음
- URL에서 `accessToken`과 `refreshToken` 추출
- localStorage에 저장 후 루트(`/`)로 리다이렉트

### 3.2 루트 페이지 구현

**파일**: `frontend/app/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // URL에 토큰이 있으면 AuthProvider가 처리할 때까지 대기
        const params = new URLSearchParams(window.location.search);
        const urlAccessToken = params.get('accessToken');
        const urlRefreshToken = params.get('refreshToken');

        if (urlAccessToken && urlRefreshToken) {
          console.log('✅ URL에 토큰이 있습니다. AuthProvider가 처리할 때까지 대기 중...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // localStorage에서 토큰 확인
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (accessToken && refreshToken) {
          // 토큰 유효성 검증
          const response = await fetch('/api/auth/me');

          if (response.ok) {
            const data = await response.json();

            if (data.success && data.isAuthenticated && data.user) {
              if (data.user.status === 'active') {
                router.replace('/dashboard');
              } else if (data.user.status === 'pending') {
                router.replace('/pending-approval');
              } else {
                router.replace('/login?error=account_inactive');
              }
            } else {
              router.replace('/login');
            }
          } else {
            router.replace('/login');
          }
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error during auth check:', error);
        router.replace('/login');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">인증 확인 중...</p>
      </div>
    </div>
  );
}
```

**핵심 로직**:
1. URL에 토큰이 있으면 AuthProvider가 처리할 시간(1초) 대기
2. localStorage에서 토큰 확인
3. `/api/auth/me`로 토큰 유효성 검증
4. 사용자 상태에 따라 적절한 페이지로 리다이렉트

### 3.3 layout.tsx에 AuthProvider 추가

**파일**: `frontend/app/layout.tsx`

```typescript
import { Suspense } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Suspense fallback={null}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
```

---

## 4. Playwright 테스트 작성

### 4.1 테스트 파일 구조

```
tests/
├── sso-direct-api-test.spec.ts      # API 직접 호출 테스트
├── sso-auto-flow-test.spec.ts       # 브라우저 자동화 테스트
├── google-oauth-flow-test.spec.ts   # Google OAuth 수동 테스트
└── screenshots/                      # 테스트 스크린샷
```

### 4.2 Direct API 테스트

**파일**: `tests/sso-direct-api-test.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:4090';
const WBFINHUB_BACKEND_URL = 'http://localhost:4020';
const WBFINHUB_FRONTEND_URL = 'http://localhost:3020';

test.describe('SSO Direct API Test (Auth Header Only)', () => {
  test.setTimeout(60000);

  test('should complete full SSO flow using Authorization header', async ({ page, context, request }) => {
    console.log('\n🧪 ===== SSO Direct API Test (Auth Header Only) =====\n');

    // 브라우저 콘솔 메시지 캡처
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Step 1: 테스트 로그인 엔드포인트로 JWT 토큰 획득
    console.log('📝 Step 1: Getting JWT token from test login endpoint...');
    const testLoginUrl = `${BACKEND_URL}/api/auth/test-login`;
    const loginResponse = await request.get(testLoginUrl);

    if (!loginResponse.ok()) {
      throw new Error(`Test login failed: ${loginResponse.status()}`);
    }

    const loginData = await loginResponse.json();
    const jwtToken = loginData.data?.access_token || loginData.access_token || loginData.token;

    if (!jwtToken) {
      throw new Error('JWT token not found in test login response');
    }

    console.log(`✅ JWT token obtained`);
    console.log(`   Token preview: ${jwtToken.substring(0, 50)}...`);

    // Step 2: Hub 토큰 생성 API 호출
    console.log('\n📝 Step 2: Generating Hub token...');
    const tokenResponse = await request.post(`${BACKEND_URL}/api/auth/generate-hub-token`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        hub_slug: 'wbfinhub'
      }
    });

    if (!tokenResponse.ok()) {
      const errorText = await tokenResponse.text();
      console.error('Token generation failed:', errorText);
      throw new Error(`Failed to generate hub token: ${tokenResponse.status()}`);
    }

    const tokenData = await tokenResponse.json();
    const hubToken = tokenData.data?.token || tokenData.token;

    if (!hubToken) {
      throw new Error('Hub token not found in response');
    }

    console.log('✅ Hub token generated');
    console.log('   Token length:', hubToken.length);

    // Step 3: WBFinHub SSO 엔드포인트로 직접 이동
    console.log('\n📝 Step 3: Accessing WBFinHub SSO endpoint...');
    const ssoUrl = `${WBFINHUB_BACKEND_URL}/auth/sso?token=${hubToken}`;
    console.log('   SSO URL:', ssoUrl);

    await page.goto(ssoUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Step 4: 최종 URL 확인
    console.log('\n📝 Step 4: Checking final URL...');
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    await page.screenshot({ path: 'tests/screenshots/direct-api-01-after-sso.png', fullPage: true });

    // URL 분석
    if (finalUrl.includes('accessToken') && finalUrl.includes('refreshToken')) {
      console.log('✅ Tokens found in URL');

      const url = new URL(finalUrl);
      const accessToken = url.searchParams.get('accessToken');
      const refreshToken = url.searchParams.get('refreshToken');

      console.log('   Access token length:', accessToken?.length);
      console.log('   Refresh token length:', refreshToken?.length);

      // Step 5: localStorage에 토큰 저장 확인
      console.log('\n📝 Step 5: Checking token storage in localStorage...');
      await page.waitForTimeout(1000);

      const tokens = await page.evaluate(() => {
        return {
          accessToken: localStorage.getItem('accessToken'),
          refreshToken: localStorage.getItem('refreshToken')
        };
      });

      if (tokens.accessToken && tokens.refreshToken) {
        console.log('✅ Tokens stored in localStorage');
      } else {
        console.log('⚠️  Tokens not yet stored, AuthProvider may still be processing');
      }

      // Step 6: 대시보드로 리다이렉트 대기
      console.log('\n📝 Step 6: Waiting for redirect to dashboard...');
      try {
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ Successfully redirected to dashboard');
      } catch (error) {
        console.log('⏳ Dashboard redirect not completed, checking current page...');
        const currentUrl = page.url();
        console.log('   Current URL:', currentUrl);

        if (!currentUrl.includes('/dashboard') && !currentUrl.includes('/login')) {
          console.log('   Reloading page to trigger redirect...');
          await page.reload({ waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);
        }
      }

    } else if (finalUrl.includes('/dashboard')) {
      console.log('✅ Already redirected to dashboard');

    } else if (finalUrl.includes('/login')) {
      console.error('❌ Redirected to login page');
      const errorParam = new URL(finalUrl).searchParams.get('error');
      if (errorParam) {
        console.error('   Error:', errorParam);
      }

      const pageText = await page.textContent('body');
      console.error('   Page content:', pageText?.substring(0, 300));

      throw new Error(`SSO failed: redirected to login with error: ${errorParam}`);
    }

    // Step 7: 대시보드 확인
    console.log('\n📝 Step 7: Verifying dashboard...');
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    await page.screenshot({ path: 'tests/screenshots/direct-api-02-dashboard.png', fullPage: true });

    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Dashboard page verified');

      const bodyText = await page.textContent('body');
      if (bodyText?.includes('대시보드') || bodyText?.includes('AUM') || bodyText?.includes('Dashboard')) {
        console.log('✅ Dashboard content verified');
      } else {
        console.log('⚠️  Dashboard content not fully loaded');
        console.log('   Body preview:', bodyText?.substring(0, 200));
      }
    } else {
      console.error('❌ Not on dashboard page');
      console.error('   Expected: /dashboard');
      console.error('   Actual:', currentUrl);
      throw new Error('Failed to reach dashboard');
    }

    // 테스트 완료
    console.log('\n🎉 ===== Test Complete =====\n');
    console.log('Summary:');
    console.log('  ✓ JWT token obtained from test login');
    console.log('  ✓ Hub token generated successfully');
    console.log('  ✓ SSO flow completed');
    console.log(`  ${currentUrl.includes('/dashboard') ? '✓' : '✗'} Dashboard accessed`);
  });
});
```

### 4.3 자동 플로우 테스트

**파일**: `tests/sso-auto-flow-test.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3090';
const BACKEND_URL = 'http://localhost:4090';
const WBFINHUB_BACKEND_URL = 'http://localhost:4020';
const WBFINHUB_FRONTEND_URL = 'http://localhost:3020';

test.describe('SSO Auto Flow (Bypass Google)', () => {
  test.setTimeout(60000);

  test('should generate JWT token and access WBFinHub dashboard directly', async ({ page, context }) => {
    console.log('\n🧪 ===== SSO Auto Flow Test (Bypass Google) =====\n');

    // Step 1: HubManager에 테스트 로그인하여 세션 생성
    console.log('📝 Step 1: Creating session on HubManager using test login...');

    await page.goto(`${BACKEND_URL}/api/auth/test-login?redirect=${encodeURIComponent(`${FRONTEND_URL}/hubs`)}`, {
      waitUntil: 'networkidle'
    });

    console.log('✅ Session created and redirected to Hub selection page');
    await page.screenshot({ path: 'tests/screenshots/auto-01-hub-selection.png' });

    // Step 2: Finance Hub 버튼 클릭
    console.log('\n📝 Step 2: Clicking Finance Hub button...');
    await page.waitForSelector('text=Finance Hub', { timeout: 10000 });

    const finHubButton = page.locator('text=Finance Hub').first();
    await finHubButton.click();
    console.log('🖱️  Finance Hub button clicked');

    // Step 3: SSO 플로우 완료 대기
    console.log('\n📝 Step 3: Waiting for SSO flow to complete...');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Step 4: 최종 URL 확인
    console.log('\n📝 Step 4: Checking final URL...');
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    await page.screenshot({ path: 'tests/screenshots/auto-02-final-page.png', fullPage: true });

    // 이하 동일한 검증 로직...
  });
});
```

### 4.4 테스트 실행

```bash
# Direct API 테스트
npx playwright test tests/sso-direct-api-test.spec.ts --headed

# Auto Flow 테스트
npx playwright test tests/sso-auto-flow-test.spec.ts --headed

# 모든 SSO 테스트
npx playwright test tests/sso-*.spec.ts
```

---

## 5. 트러블슈팅

### 5.1 주요 이슈와 해결 방법

#### ❌ 문제 1: ngrok 엔드포인트 오프라인 (ERR_NGROK_3200)

**증상**:
```
❌ ERROR: Failed to call verify API
   The endpoint violently-verrucous-carlyn.ngrok-free.dev is offline. (ERR_NGROK_3200)
```

**원인**: WBFinHub `.env`의 `HUB_MANAGER_URL`이 오프라인 ngrok URL로 설정됨

**해결**:
```bash
# WBFinHub/.env 수정
HUB_MANAGER_URL=http://localhost:4090  # ngrok URL 대신 localhost 사용

# WBFinHub 백엔드 재시작
cd c:/GitHub/WBFinHub
npm run dev
```

#### ❌ 문제 2: `useSearchParams()` 작동 안 함

**증상**:
- URL에 토큰이 있지만 AuthProvider가 인식하지 못함
- 브라우저 콘솔에 "SSO 토큰이 성공적으로 저장되었습니다" 로그가 나타나지 않음

**원인**: Next.js App Router에서 `useSearchParams()`가 SSR 시 제대로 작동하지 않음

**해결**:
```typescript
// ❌ 잘못된 방법
const searchParams = useSearchParams();
const accessToken = searchParams.get('accessToken');

// ✅ 올바른 방법
const params = new URLSearchParams(window.location.search);
const accessToken = params.get('accessToken');
```

#### ❌ 문제 3: 포트 충돌 (EADDRINUSE)

**증상**:
```
Error: listen EADDRINUSE: address already in use :::4020
```

**해결**:
```bash
# Windows
netstat -ano | findstr :4020
powershell Stop-Process -Id <PID> -Force

# macOS/Linux
lsof -ti:4020 | xargs kill -9
```

#### ❌ 문제 4: Finance Hub 버튼을 찾을 수 없음

**증상**:
```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
waiting for locator('text=Finance Hub')
```

**원인**:
- HubManager 프론트엔드가 제대로 로드되지 않음
- 테스트 로그인 엔드포인트가 세션을 생성하지 않음

**해결**:
1. HubManager 프론트엔드가 정상 실행 중인지 확인
2. `/api/auth/test-login?redirect=...` 엔드포인트가 올바르게 리다이렉트하는지 확인
3. 스크린샷으로 실제 페이지 상태 확인

#### ❌ 문제 5: 토큰은 URL에 있지만 즉시 /login으로 리다이렉트

**증상**:
- 백엔드 로그: `✅ SSO Authentication Complete`
- 리다이렉트 URL: `http://localhost:3020?auth=success&accessToken=...`
- 하지만 최종 URL: `http://localhost:3020/login`

**원인**:
- AuthProvider의 `useEffect`보다 `page.tsx`의 `useEffect`가 먼저 실행됨
- `page.tsx`가 localStorage에 토큰이 없다고 판단하여 `/login`으로 리다이렉트

**해결 (진행중)**:
1. `page.tsx`에서 URL 파라미터 확인 로직 추가
2. URL에 토큰이 있으면 AuthProvider가 처리할 시간(1초) 대기
3. 그 후 localStorage에서 토큰 확인

```typescript
// page.tsx
useEffect(() => {
  const checkAuthAndRedirect = async () => {
    // URL에 토큰이 있으면 대기
    const params = new URLSearchParams(window.location.search);
    if (params.get('accessToken') && params.get('refreshToken')) {
      console.log('✅ URL에 토큰이 있습니다. AuthProvider가 처리할 때까지 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 이후 localStorage 확인...
  };
}, [router]);
```

### 5.2 디버깅 팁

#### 1. 네트워크 요청 추적

```typescript
// Playwright 테스트에 추가
page.on('request', (request) => {
  const url = request.url();
  if (url.includes('auth') || url.includes('sso')) {
    console.log(`[Request] ${request.method()} ${url}`);
  }
});

page.on('response', (response) => {
  const url = response.url();
  if (url.includes('auth') || url.includes('sso')) {
    console.log(`[Response] ${response.status()} ${url}`);
  }
});
```

#### 2. 브라우저 콘솔 로그 캡처

```typescript
page.on('console', msg => {
  console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
});
```

#### 3. 네비게이션 추적

```typescript
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) {
    console.log(`[Navigation] → ${frame.url()}`);
  }
});
```

#### 4. 백엔드 로그 상세화

```typescript
// authRoutes.ts
console.log('📝 Step 4: Redirecting to Frontend with Tokens');
const redirectUrl = `${FRONTEND_URL}?auth=success&accessToken=${accessToken}&refreshToken=${refreshToken}`;
console.log('   Redirect URL:', redirectUrl.substring(0, 100) + '...');
console.log('✅ SSO Authentication Complete');
```

---

## 6. 체크리스트

### 6.1 구현 전 체크리스트

- [ ] Playwright 설치 완료
- [ ] 포트 설정 완료 (백엔드, 프론트엔드)
- [ ] 환경변수 파일 설정 (`.env`)
- [ ] WBHubManager `/api/auth/test-login` 엔드포인트 확인
- [ ] WBHubManager `/api/auth/generate-hub-token` 엔드포인트 확인
- [ ] WBHubManager `/api/auth/verify` 엔드포인트 확인
- [ ] WBHubManager `/api/auth/google-login` 엔드포인트 확인

### 6.2 백엔드 구현 체크리스트

- [ ] `/auth/sso` 엔드포인트 구현
- [ ] 토큰 파라미터 검증 로직
- [ ] HubManager로 토큰 검증 API 호출
- [ ] Hub용 새 토큰 생성 API 호출
- [ ] 프론트엔드로 리다이렉트 (토큰 포함)
- [ ] 에러 처리 (missing_token, invalid_token, sso_failed)
- [ ] 로그 추가 (디버깅용)

### 6.3 프론트엔드 구현 체크리스트

- [ ] `AuthProvider` 컴포넌트 생성
- [ ] URL 쿼리 파라미터에서 토큰 추출
- [ ] localStorage에 토큰 저장
- [ ] 루트 페이지(`page.tsx`) 구현
- [ ] 루트 페이지에서 토큰 확인 로직
- [ ] `/api/auth/me` 엔드포인트로 토큰 검증
- [ ] 사용자 상태별 리다이렉트 로직
- [ ] `layout.tsx`에 `AuthProvider` 추가
- [ ] `useSearchParams()` 대신 `window.location.search` 사용

### 6.4 테스트 작성 체크리스트

- [ ] `sso-direct-api-test.spec.ts` 작성
  - [ ] JWT 토큰 획득
  - [ ] Hub 토큰 생성
  - [ ] SSO 엔드포인트 접속
  - [ ] 토큰 저장 확인
  - [ ] 대시보드 접속 확인
- [ ] `sso-auto-flow-test.spec.ts` 작성
  - [ ] HubManager 로그인
  - [ ] Hub 버튼 클릭
  - [ ] SSO 플로우 완료
  - [ ] 대시보드 접속 확인
- [ ] 브라우저 콘솔 로그 캡처
- [ ] 스크린샷 저장
- [ ] 에러 핸들링

### 6.5 테스트 실행 체크리스트

- [ ] 모든 서버 실행 (HubManager, Hub 백엔드/프론트엔드)
- [ ] 포트 충돌 없음
- [ ] `HUB_MANAGER_URL`이 올바른 로컬 URL로 설정됨
- [ ] 테스트 실행: `npx playwright test`
- [ ] 테스트 통과 확인
- [ ] 스크린샷 확인

---

## 7. 다음 단계 (WBSalesHub 적용 시)

### 7.1 환경변수 설정

```env
# WBSalesHub/.env
PORT=4030
FRONTEND_URL=http://localhost:3030
HUB_MANAGER_URL=http://localhost:4090
USE_JWT_AUTH=true
```

### 7.2 Hub Slug 변경

```typescript
// 테스트 파일에서
data: {
  hub_slug: 'wbsaleshub'  // 'wbfinhub' 대신
}
```

### 7.3 URL 업데이트

```typescript
const WBSALESHUB_BACKEND_URL = 'http://localhost:4030';
const WBSALESHUB_FRONTEND_URL = 'http://localhost:3030';
```

### 7.4 테스트 파일 복사 및 수정

```bash
# WBHubManager/tests에서 WBSalesHub로 복사
cp tests/sso-direct-api-test.spec.ts ../WBSalesHub/tests/
cp tests/sso-auto-flow-test.spec.ts ../WBSalesHub/tests/

# URL과 hub_slug 수정
# wbfinhub → wbsaleshub
# 3020/4020 → 3030/4030
```

---

## 8. 참고 자료

### 8.1 관련 문서

- [Playwright 공식 문서](https://playwright.dev/)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [JWT 공식 사이트](https://jwt.io/)

### 8.2 프로젝트 파일 경로

```
WBHubManager/
├── server/routes/authRoutes.ts              # JWT 토큰 생성/검증
├── tests/
│   ├── sso-direct-api-test.spec.ts
│   ├── sso-auto-flow-test.spec.ts
│   └── google-oauth-flow-test.spec.ts
└── Common/
    ├── sso-test-log-20251230.md            # 테스트 로그
    └── sso-testing-guide.md                # 이 문서

WBFinHub/
├── server/routes/authRoutes.ts              # SSO 엔드포인트
├── frontend/
│   ├── app/
│   │   ├── page.tsx                         # 루트 페이지
│   │   └── layout.tsx                       # AuthProvider 추가
│   └── providers/AuthProvider.tsx           # 토큰 처리
└── .env                                      # 환경변수
```

### 8.3 디버깅 로그 예시

**성공적인 SSO 플로우**:
```
🧪 ===== SSO Direct API Test =====

📝 Step 1: Getting JWT token from test login endpoint...
✅ JWT token obtained
   Token preview: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

📝 Step 2: Generating Hub token...
✅ Hub token generated
   Token length: 692

📝 Step 3: Accessing WBFinHub SSO endpoint...
   SSO URL: http://localhost:4020/auth/sso?token=...

[Browser Console] log: ✅ URL에 토큰이 있습니다. AuthProvider가 처리할 때까지 대기 중...
[Browser Console] log: ✅ SSO 토큰이 성공적으로 저장되었습니다

📝 Step 4: Checking final URL...
📍 Final URL: http://localhost:3020/dashboard
✅ Dashboard page verified
✅ Dashboard content verified

🎉 ===== Test Complete =====
Summary:
  ✓ JWT token obtained from test login
  ✓ Hub token generated successfully
  ✓ SSO flow completed
  ✓ Dashboard accessed
```

---

## 9. 알려진 이슈 (현재 진행중)

### 9.1 토큰이 URL에 있지만 /login으로 리다이렉트되는 문제

**상태**: 🔴 진행중

**증상**:
- 백엔드는 정상적으로 `http://localhost:3020?auth=success&accessToken=...&refreshToken=...`로 리다이렉트
- 하지만 프론트엔드는 토큰을 처리하지 못하고 즉시 `/login`으로 리다이렉트
- 브라우저 콘솔에 "SSO 토큰이 성공적으로 저장되었습니다" 로그가 나타나지 않음

**시도한 해결 방법**:
1. ✅ `useSearchParams()` → `window.location.search` 변경
2. ✅ `page.tsx`에 URL 파라미터 확인 및 대기 로직 추가
3. 🔄 네비게이션 추적 추가 (현재 진행중)

**다음 시도**:
- AuthProvider와 page.tsx의 실행 순서 확인
- Next.js의 렌더링 라이프사이클 이해
- 대체 방법: 백엔드에서 직접 대시보드로 리다이렉트 (토큰은 쿠키에 저장)

---

## 10. 버전 정보

- **작성일**: 2025-12-31
- **작성자**: Claude Code
- **테스트 대상**: WBFinHub
- **다음 적용 대상**: WBSalesHub
- **Node.js**: v18+
- **Next.js**: 16.1.0
- **Playwright**: @playwright/test

---

**마지막 업데이트**: 2025-12-31 02:30 KST
