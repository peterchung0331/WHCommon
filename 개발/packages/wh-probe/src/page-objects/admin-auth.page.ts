import { BasePage } from './base.page.js';

/**
 * 어드민 인증 모달 Page Object
 * HubManager /admin 페이지의 패스워드 인증 모달
 */
export class AdminAuthPage extends BasePage {

  async enterPassword(password: string): Promise<void> {
    await this.fillTestId('admin-password-input', password);
  }

  async clickLogin(): Promise<void> {
    await this.clickTestId('admin-login-button');
  }

  async expectPasswordModal(): Promise<void> {
    await this.waitForTestId('admin-password-modal');
  }

  async expectAuthSuccess(): Promise<void> {
    await this.page.waitForSelector('[data-testid="admin-password-modal"]', { state: 'hidden', timeout: 5_000 });
  }

  async expectErrorMessage(message?: string): Promise<void> {
    await this.waitForTestId('admin-password-error');
    if (message) {
      const errorText = await this.locator('admin-password-error').textContent();
      if (!errorText?.includes(message)) {
        throw new Error(`Expected error "${message}", got "${errorText}"`);
      }
    }
  }

  async login(password: string = '0000'): Promise<void> {
    await this.expectPasswordModal();
    await this.enterPassword(password);
    await this.clickLogin();
    await this.expectAuthSuccess();
  }
}
