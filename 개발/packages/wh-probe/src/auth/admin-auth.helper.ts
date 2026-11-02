import type { Page } from '@playwright/test';

/**
 * 어드민 패스워드 로그인
 * HubManager /admin 페이지 전용 — 패스워드 모달 자동 처리
 */
export async function loginAsAdmin(page: Page, password: string = '0000'): Promise<void> {
  await page.waitForSelector('[data-testid="admin-password-modal"]', { timeout: 10_000 });
  await page.locator('[data-testid="admin-password-input"]').fill(password);
  await page.locator('[data-testid="admin-login-button"]').click();
  await page.waitForSelector('[data-testid="admin-password-modal"]', { state: 'hidden', timeout: 5_000 });
}

/**
 * 어드민 페이지 이동 + 자동 인증
 */
export async function navigateToAdminPage(
  page: Page,
  path: string,
  password: string = '0000'
): Promise<void> {
  await page.goto(`/admin${path.startsWith('/') ? path : `/${path}`}`);
  await loginAsAdmin(page, password);
}

/**
 * 인증 세션 유효 확인
 */
export async function checkAuthSession(page: Page): Promise<boolean> {
  try {
    const modal = page.locator('[data-testid="admin-password-modal"]');
    const isVisible = await modal.isVisible().catch(() => false);
    return !isVisible;
  } catch {
    return false;
  }
}
