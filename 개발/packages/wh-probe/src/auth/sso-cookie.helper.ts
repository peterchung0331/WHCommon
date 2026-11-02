import type { Page, BrowserContext } from '@playwright/test';
import type { HubName, Environment } from '../config/hub-registry.js';
import { getHubUrl } from '../config/hub-registry.js';
import { TEST_USERS } from '../fixtures/test-users.js';

const COOKIE_DOMAIN = '.workhub.biz';

/**
 * 쿠키 기반 SSO 인증 — JWT/OAuth 미사용
 *
 * 로컬 환경: dev-login 엔드포인트로 쿠키 발급
 * 스테이징/프로덕션: 기존 쿠키를 직접 주입
 */
export async function authenticateForHub(
  page: Page,
  hub: HubName = 'hubmanager',
  env: Environment = 'local',
  userKey: keyof typeof TEST_USERS = 'master'
): Promise<void> {
  const user = TEST_USERS[userKey];
  const baseUrl = getHubUrl(hub, env, 'backend');

  if (env === 'local') {
    // 로컬: dev-login 엔드포인트로 쿠키 자동 발급
    const response = await page.request.post(`${baseUrl}/api/auth/dev-login`, {
      data: { email: user.email },
    });

    if (!response.ok()) {
      throw new Error(`dev-login failed for ${user.email}: ${response.status()}`);
    }
  } else {
    // 스테이징/프로덕션: 실제 로그인 페이지 사용
    const frontendUrl = getHubUrl('hubmanager', env, 'frontend');
    await page.goto(`${frontendUrl}/splash`);
    // 쿠키가 이미 있다면 리다이렉트됨
    // 없다면 로그인 페이지에서 직접 인증 필요
  }

  // 인증 상태 확인
  const meResponse = await page.request.get(`${baseUrl}/api/auth/me`);
  if (!meResponse.ok()) {
    throw new Error(`Authentication verification failed for hub=${hub}, env=${env}`);
  }
}

/**
 * 어드민 패스워드 인증 (HubManager /admin 전용)
 */
export async function adminAuth(page: Page, password: string = '0000'): Promise<void> {
  const modal = page.locator('[data-testid="admin-password-modal"]');
  const isVisible = await modal.isVisible().catch(() => false);

  if (isVisible) {
    await page.locator('[data-testid="admin-password-input"]').fill(password);
    await page.locator('[data-testid="admin-login-button"]').click();
    await page.waitForSelector('[data-testid="admin-password-modal"]', { state: 'hidden', timeout: 5000 });
  }
}

/**
 * 쿠키 직접 주입 (context 레벨)
 * 브라우저 컨텍스트에 SSO 쿠키를 수동으로 설정
 */
export async function injectSSOCookie(
  context: BrowserContext,
  cookieValue: string,
  domain: string = COOKIE_DOMAIN
): Promise<void> {
  await context.addCookies([
    {
      name: 'workhub_session',
      value: cookieValue,
      domain,
      path: '/',
      httpOnly: true,
      secure: domain !== 'localhost',
      sameSite: 'Lax',
    },
  ]);
}

/**
 * 현재 인증 쿠키 삭제 (로그아웃)
 */
export async function clearAuthCookies(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}
