import type { Page, Locator } from '@playwright/test';

/**
 * 추상 베이스 Page Object
 * 모든 Page Object는 이 클래스를 상속
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  protected locator(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  protected async waitForTestId(testId: string, timeout: number = 10_000): Promise<void> {
    await this.page.waitForSelector(`[data-testid="${testId}"]`, { timeout });
  }

  protected async clickTestId(testId: string): Promise<void> {
    await this.locator(testId).click();
  }

  protected async fillTestId(testId: string, value: string): Promise<void> {
    await this.locator(testId).fill(value);
  }

  protected async isTestIdVisible(testId: string): Promise<boolean> {
    return this.locator(testId).isVisible().catch(() => false);
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  async waitForNetworkIdle(timeout: number = 5_000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }
}
