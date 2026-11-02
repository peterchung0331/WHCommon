import { BasePage } from './base.page.js';
import type { HubName } from '../config/hub-registry.js';

/**
 * 허브 선택 페이지 Page Object
 * HubManager 메인 페이지의 허브 카드 선택
 */
export class HubSelectorPage extends BasePage {

  async selectHub(hub: HubName): Promise<void> {
    const hubCard = this.page.locator(`[data-testid="hub-card-${hub}"], a[href*="${hub}"]`).first();
    await hubCard.waitFor({ state: 'visible', timeout: 10_000 });
    await hubCard.click();
  }

  async expectHubListVisible(): Promise<void> {
    await this.page.waitForSelector('[data-testid="hub-list"], .hub-cards', { timeout: 10_000 });
  }

  async getVisibleHubs(): Promise<string[]> {
    const cards = this.page.locator('[data-testid^="hub-card-"]');
    const count = await cards.count();
    const hubs: string[] = [];
    for (let i = 0; i < count; i++) {
      const testId = await cards.nth(i).getAttribute('data-testid');
      if (testId) hubs.push(testId.replace('hub-card-', ''));
    }
    return hubs;
  }
}
