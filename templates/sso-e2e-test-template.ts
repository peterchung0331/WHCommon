/**
 * SSO E2E 테스트 템플릿 (Google OAuth 자동 로그인)
 *
 * 이 템플릿은 모든 WorkHub 프로젝트의 SSO 통합 테스트에 사용됩니다.
 *
 * 사용 방법:
 * 1. 이 파일을 각 프로젝트의 e2e/ 폴더에 복사
 * 2. PROJECT_NAME, FRONTEND_URL, BACKEND_URL 수정
 * 3. 환경변수에 TEST_GOOGLE_EMAIL, TEST_GOOGLE_PASSWORD 설정
 * 4. npm run test:e2e 실행
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
// 프로젝트별 설정 (필수 수정)
// ============================================================
const PROJECT_NAME = 'WBRefHub'; // WBFinHub, WBSalesHub, WBOnboardingHub 등
const FRONTEND_URL = 'http://localhost:3099';
const BACKEND_URL = 'http://localhost:4099';
const HUB_MANAGER_URL = 'http://localhost:4090';

// ============================================================
// 스크린샷 설정
// ============================================================
const SCREENSHOT_DIR = `/home/peterchung/HWTestAgent/test-results/MyTester/screenshots/${new Date().toISOString().split('T')[0]}-${PROJECT_NAME}-SSO`;

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function saveScreenshot(page: Page, name: string) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

// ============================================================
// Google 테스트 계정 정보
// ============================================================
const GOOGLE_EMAIL = process.env.TEST_GOOGLE_EMAIL;
const GOOGLE_PASSWORD = process.env.TEST_GOOGLE_PASSWORD;

if (!GOOGLE_EMAIL || !GOOGLE_PASSWORD) {
  throw new Error('TEST_GOOGLE_EMAIL 또는 TEST_GOOGLE_PASSWORD가 .env 파일에 정의되지 않았습니다.');
}

// ============================================================
// HubManager 허브 선택 헬퍼 함수
// ============================================================
/**
 * HubManager 허브 선택 페이지에서 특정 허브를 선택하는 함수
 *
 * @param page - Playwright Page 객체
 * @param hubName - 선택할 허브 이름 (예: 'RefHub', 'FinHub', 'SalesHub')
 * @param hubCardText - 허브 카드에서 찾을 텍스트 (예: 'Cookie SSO Reference')
 * @param isRefHub - RefHub 여부 (RefHub는 개발 환경에서 자동으로 표시되므로 특별 처리)
 */
async function selectHubFromManager(
  page: Page,
  hubName: string,
  hubCardText: string,
  isRefHub: boolean = false
) {
  console.log('\n========================================');
  console.log(`🏢 HubManager에서 ${hubName} 선택`);
  console.log('========================================\n');

  // Step 1: HubManager 허브 선택 페이지 접근
  console.log('Step 1: HubManager 허브 선택 페이지 접근');
  await page.goto(`${HUB_MANAGER_URL.replace(':4090', ':3090')}/hubs`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await saveScreenshot(page, `00-hub-selection-page`);

  // Step 2: 허브 카드가 나타날 때까지 대기 (RefHub는 개발 환경에서 자동 표시)
  console.log(`Step 2: ${hubName} 카드 대기`);

  if (isRefHub) {
    // RefHub는 개발 환경에서 자동으로 표시되므로 먼저 대기
    try {
      await page.waitForSelector(`text=${hubCardText}`, { timeout: 10000 });
      console.log(`✅ ${hubName} 카드가 화면에 나타남 (자동 표시)`);
    } catch (error) {
      console.log(`⚠️ ${hubName} 카드가 자동으로 나타나지 않음, Tools 메뉴에서 수동 활성화 시도`);

      // Tools 메뉴 열기
      const toolsButton = page.locator('button:has-text("Tools")');
      if ((await toolsButton.count()) > 0) {
        await toolsButton.click();
        await page.waitForTimeout(1000);
        await saveScreenshot(page, `00-tools-menu-opened`);

        // RefHub 토글이 OFF 상태(bg-gray-300)인지 확인
        const toggleOff = (await page.locator('.bg-gray-300').count()) > 0;
        if (toggleOff) {
          const refHubToggle = page.locator('button').filter({ hasText: /RefHub|개발용/ });
          if ((await refHubToggle.count()) > 0) {
            console.log('✅ RefHub 토글을 ON으로 변경');
            await refHubToggle.click();
            await page.waitForTimeout(1000);
            await saveScreenshot(page, `00-refhub-toggle-on`);
            await page.waitForSelector(`text=${hubCardText}`, { timeout: 5000 });
          }
        } else {
          console.log('✅ RefHub 토글이 이미 ON 상태');
        }

        // 메뉴 닫기
        await page.locator('body').click({ position: { x: 0, y: 0 } });
        await page.waitForTimeout(500);
      }
    }
  } else {
    // 일반 허브는 바로 대기
    await page.waitForSelector(`text=${hubCardText}`, { timeout: 10000 });
    console.log(`✅ ${hubName} 카드가 화면에 나타남`);
  }

  await saveScreenshot(page, `00-before-${hubName.toLowerCase()}-click`);

  // Step 3: 허브 카드 선택 및 클릭
  console.log(`Step 3: ${hubName} 카드 클릭`);

  // HubCard는 div[role="button"]이므로 getByRole('button')로 찾기
  const hubCard = page.getByRole('button').filter({ hasText: new RegExp(hubCardText) }).first();
  const cardCount = await hubCard.count();

  if (cardCount === 0) {
    throw new Error(`${hubName} 카드를 찾을 수 없습니다.`);
  }

  console.log(`✅ ${hubName} 카드 발견`);

  const isVisible = await hubCard.isVisible();
  if (!isVisible) {
    throw new Error(`${hubName} 카드가 보이지 않습니다.`);
  }

  // 클릭 전 네비게이션 프로미스 설정
  const navigationPromise = page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
    console.log('⚠️ 네비게이션 타임아웃 (15초)');
  });

  await hubCard.click();
  console.log(`🖱️ ${hubName} 카드 클릭 완료`);

  await navigationPromise;
  await page.waitForTimeout(2000);

  console.log(`✅ ${hubName} 선택 완료`);
  console.log(`현재 URL: ${page.url()}`);
  console.log('========================================\n');
}

// ============================================================
// Google 자동 로그인 헬퍼 함수
// ============================================================
async function loginWithGoogle(page: Page) {
  console.log('\n========================================');
  console.log('🔐 Google SSO 자동 로그인 시작');
  console.log('========================================\n');

  // Step 1: 로그인 페이지 접근
  console.log('Step 1: 로그인 페이지 접근');
  await page.goto(`${FRONTEND_URL}/login`);
  await page.waitForLoadState('networkidle');
  await saveScreenshot(page, '01-login-page');

  // Step 2: Google 로그인 버튼 클릭
  console.log('Step 2: Google 로그인 버튼 클릭');
  const googleButton = page.locator('button, a').filter({ hasText: /Google|계정|로그인/i }).first();

  if ((await googleButton.count()) === 0) {
    throw new Error('Google 로그인 버튼을 찾을 수 없습니다.');
  }

  await googleButton.click();
  console.log('✅ Google 로그인 버튼 클릭 완료');

  // Step 3: Google OAuth 페이지 대기
  console.log('Step 3: Google OAuth 페이지 대기');
  await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await saveScreenshot(page, '02-google-oauth-page');
  console.log('✅ Google OAuth 페이지 로드');

  // Step 4: 이메일 입력
  console.log('Step 4: 이메일 입력');
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(GOOGLE_EMAIL!);
  await saveScreenshot(page, '03-email-entered');
  console.log(`✅ 이메일 입력: ${GOOGLE_EMAIL}`);

  // Next 버튼 클릭
  const nextButton = page.locator('button').filter({ hasText: /Next|다음/ }).first();
  await nextButton.click();
  await page.waitForTimeout(2000);

  // Step 5: 비밀번호 입력
  console.log('Step 5: 비밀번호 입력');
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(GOOGLE_PASSWORD!);
  await saveScreenshot(page, '04-password-entered');
  console.log('✅ 비밀번호 입력');

  // Next 버튼 클릭
  await nextButton.click();
  await page.waitForTimeout(3000);

  // Step 6: 로그인 완료 후 리다이렉트 대기
  console.log('Step 6: 로그인 완료 대기');

  // HubManager 콜백 또는 원래 앱으로 리다이렉트될 때까지 대기
  await page.waitForURL(
    (url) => {
      const urlString = url.toString();
      return (
        urlString.includes('localhost:4090') || // HubManager callback
        urlString.includes(FRONTEND_URL) || // 원래 앱으로 복귀
        urlString.includes('callback')
      );
    },
    { timeout: 15000 }
  );

  await page.waitForTimeout(2000);
  await saveScreenshot(page, '05-redirected-back');

  // Step 7: 최종 앱 페이지 확인
  console.log('Step 7: 최종 페이지 확인');

  // 만약 아직 원래 앱이 아니면 한 번 더 대기
  if (!page.url().includes(FRONTEND_URL)) {
    await page.waitForURL((url) => url.toString().includes(FRONTEND_URL), { timeout: 10000 });
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await saveScreenshot(page, '06-final-authenticated-page');

  console.log('\n========================================');
  console.log('✅ Google SSO 자동 로그인 완료');
  console.log('현재 URL:', page.url());
  console.log('========================================\n');
}

// ============================================================
// 테스트 케이스
// ============================================================

test.describe(`${PROJECT_NAME} SSO E2E 테스트 (Google 자동 로그인)`, () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);

    // 네트워크 요청 모니터링
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('auth') || url.includes('google') || url.includes('callback')) {
        console.log('📤 Request:', request.method(), url);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('auth') || url.includes('google') || url.includes('callback')) {
        console.log('📥 Response:', response.status(), url);
      }
    });

    // 콘솔 에러 모니터링
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
      }
    });
  });

  test('01. Google SSO 로그인 플로우 전체 테스트', async ({ page }) => {
    // Google 자동 로그인 실행
    await loginWithGoogle(page);

    // 인증 상태 확인
    const response = await page.request.get(`${BACKEND_URL}/auth/me`);
    const authData = await response.json();

    console.log('\n인증 상태:', JSON.stringify(authData, null, 2));

    expect(authData.success).toBe(true);
    expect(authData.isAuthenticated).toBe(true);
    expect(authData.user).toBeDefined();
    expect(authData.user.email).toBe(GOOGLE_EMAIL);
  });

  test('02. 로그인 후 메인 페이지 접근', async ({ page }) => {
    await loginWithGoogle(page);

    // 메인 페이지로 이동
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await saveScreenshot(page, 'main-page-authenticated');

    // 페이지가 정상적으로 렌더링되었는지 확인
    const bodyContent = await page.locator('body').innerHTML();
    expect(bodyContent.length).toBeGreaterThan(100);

    console.log('✅ 메인 페이지 정상 렌더링');
  });

  test('03. 로그인 후 사용자 정보 표시 확인', async ({ page }) => {
    await loginWithGoogle(page);

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await saveScreenshot(page, 'user-info-displayed');

    // 사용자 이메일이나 이름이 페이지에 표시되는지 확인
    const pageContent = await page.content();
    const hasUserInfo = pageContent.includes(GOOGLE_EMAIL!) || pageContent.includes('로그아웃');

    expect(hasUserInfo).toBe(true);
    console.log('✅ 사용자 정보 표시 확인');
  });

  test('04. 로그아웃 테스트', async ({ page }) => {
    await loginWithGoogle(page);

    // 로그아웃 API 호출
    const logoutResponse = await page.request.post(`${BACKEND_URL}/auth/logout`);
    const logoutData = await logoutResponse.json();

    console.log('Logout 응답:', JSON.stringify(logoutData, null, 2));

    expect(logoutData.success).toBe(true);

    // 로그아웃 후 인증 상태 확인
    const authResponse = await page.request.get(`${BACKEND_URL}/auth/me`);
    const authData = await authResponse.json();

    expect(authData.isAuthenticated).toBe(false);
    console.log('✅ 로그아웃 성공');
  });

  test('05. 화면 정상 렌더링 반복 테스트', async ({ page }) => {
    await loginWithGoogle(page);

    let retries = 0;
    const maxRetries = 3;
    let success = false;

    while (retries < maxRetries && !success) {
      retries++;
      console.log(`\n🔄 렌더링 확인 시도 ${retries}/${maxRetries}`);

      try {
        await page.goto(FRONTEND_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const bodyContent = await page.locator('body').innerHTML();

        if (bodyContent.length > 500) {
          success = true;
          await saveScreenshot(page, `rendering-success-attempt-${retries}`);
          console.log(`✅ 성공! (${retries}번째 시도에서 화면 정상 렌더링)`);
        } else {
          console.log(`⚠️ 시도 ${retries} 실패: 콘텐츠 길이 ${bodyContent.length}`);
          await saveScreenshot(page, `rendering-retry-${retries}`);
        }
      } catch (error: any) {
        console.error(`❌ 시도 ${retries} 에러:`, error.message);
      }

      if (!success && retries < maxRetries) {
        await page.waitForTimeout(2000);
      }
    }

    expect(success).toBe(true);
  });
});

// ============================================================
// 사용 예시 및 주의사항
// ============================================================

/**
 * 환경변수 설정 (.env 파일):
 *
 * # Google 테스트 계정
 * TEST_GOOGLE_EMAIL=biz.dev@wavebridge.com
 * TEST_GOOGLE_PASSWORD=wave1234!!
 *
 * 실행 방법:
 * npm run test:e2e -- e2e/sso-login.spec.ts
 *
 * 주의사항:
 * 1. Google OAuth는 실제 계정이 필요하므로 테스트 전용 계정 사용
 * 2. 2단계 인증(2FA)이 활성화된 계정은 사용 불가
 * 3. Google이 봇 감지를 할 수 있으므로 headless 모드에서 실패할 수 있음
 *    (headed 모드 권장: npm run test:e2e:headed)
 * 4. 네트워크 지연이나 Google OAuth 페이지 로딩 시간으로 인해
 *    타임아웃이 발생할 수 있음 (필요시 timeout 값 증가)
 *
 * ============================================================
 * HubManager 허브 선택 헬퍼 함수 사용 예시
 * ============================================================
 *
 * // RefHub 선택 (개발 환경에서 자동 표시)
 * await selectHubFromManager(page, 'RefHub', 'Cookie SSO Reference', true);
 *
 * // FinHub 선택
 * await selectHubFromManager(page, 'FinHub', 'Financial Hub', false);
 *
 * // SalesHub 선택
 * await selectHubFromManager(page, 'SalesHub', 'Sales Management', false);
 *
 * // OnboardingHub 선택
 * await selectHubFromManager(page, 'OnboardingHub', 'User Onboarding', false);
 *
 * 주의사항:
 * - hubCardText는 허브 카드에서 고유하게 식별 가능한 텍스트를 사용
 * - RefHub는 개발/Docker 환경에서 자동으로 표시되므로 isRefHub=true 설정
 * - 일반 허브는 항상 표시되므로 isRefHub=false (기본값)
 * - HubCard는 div[role="button"]으로 구현되어 있으므로 getByRole('button') 사용
 */
