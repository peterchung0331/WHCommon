/**
 * Cross-Hub SSO 테스트
 * 쿠키 기반 SSO 인증이 전 허브에서 정상 동작하는지 검증
 *
 * 이 테스트는 WorkHub에서 가장 크리티컬한 경로를 커버:
 * HubManager 인증 → SalesHub 접근 → FinHub 접근 → 로그아웃
 */

import { test, expect } from '@playwright/test';

const ENV = (process.env.PROBE_ENV as 'local' | 'staging' | 'production') || 'local';

const URLS = {
  local: {
    hubmanager: 'http://localhost:3090',
    saleshub: 'http://localhost:3010',
    finhub: 'http://localhost:3020',
  },
  staging: {
    hubmanager: 'https://staging.workhub.biz:4400',
    saleshub: 'https://staging.workhub.biz:4400',
    finhub: 'https://staging.workhub.biz:4400',
  },
  production: {
    hubmanager: 'https://workhub.biz',
    saleshub: 'https://workhub.biz',
    finhub: 'https://workhub.biz',
  },
}[ENV];

const API_PATHS = {
  local: {
    hubmanager: '/api/auth/me',
    saleshub: '/api/auth/me',
    finhub: '/api/auth/me',
  },
  staging: {
    hubmanager: '/api/auth/me',
    saleshub: '/saleshub/api/auth/me',
    finhub: '/finhub/api/auth/me',
  },
  production: {
    hubmanager: '/api/auth/me',
    saleshub: '/saleshub/api/auth/me',
    finhub: '/finhub/api/auth/me',
  },
}[ENV];

test.describe('Cross-Hub SSO 플로우', () => {
  test.describe.configure({ mode: 'serial' });

  test('SSO-01: HubManager 인증 상태 확인', async ({ page }) => {
    // 로컬: dev-login으로 쿠키 발급
    if (ENV === 'local') {
      const response = await page.request.post(`${URLS.hubmanager}/api/auth/dev-login`, {
        data: { email: 'peter.chung@wavebridge.com' },
      });
      expect(response.ok()).toBeTruthy();
    }

    // /api/auth/me 호출로 인증 확인
    const meResponse = await page.request.get(`${URLS.hubmanager}${API_PATHS.hubmanager}`);
    expect(meResponse.ok()).toBeTruthy();

    const data = await meResponse.json();
    expect(data.user || data.data?.user).toBeTruthy();
  });

  test('SSO-02: SalesHub에서 동일 쿠키로 인증 확인', async ({ page }) => {
    // 먼저 HubManager에서 인증
    if (ENV === 'local') {
      await page.request.post(`${URLS.hubmanager}/api/auth/dev-login`, {
        data: { email: 'peter.chung@wavebridge.com' },
      });
    }

    // SalesHub /api/auth/me — 같은 SSO 쿠키가 공유되어야 함
    const meResponse = await page.request.get(`${URLS.saleshub}${API_PATHS.saleshub}`);
    expect(meResponse.ok()).toBeTruthy();

    const data = await meResponse.json();
    expect(data.user || data.data?.user).toBeTruthy();
  });

  test('SSO-03: FinHub에서 동일 쿠키로 인증 확인', async ({ page }) => {
    // 먼저 HubManager에서 인증
    if (ENV === 'local') {
      await page.request.post(`${URLS.hubmanager}/api/auth/dev-login`, {
        data: { email: 'peter.chung@wavebridge.com' },
      });
    }

    // FinHub /api/auth/me
    const meResponse = await page.request.get(`${URLS.finhub}${API_PATHS.finhub}`);
    expect(meResponse.ok()).toBeTruthy();

    const data = await meResponse.json();
    expect(data.user || data.data?.user).toBeTruthy();
  });

  test('SSO-04: 쿠키 제거 후 전 허브 인증 해제 확인', async ({ context, page }) => {
    // 먼저 인증
    if (ENV === 'local') {
      await page.request.post(`${URLS.hubmanager}/api/auth/dev-login`, {
        data: { email: 'peter.chung@wavebridge.com' },
      });
    }

    // 쿠키 제거
    await context.clearCookies();

    // 모든 허브에서 인증 해제 확인
    const hubManagerMe = await page.request.get(`${URLS.hubmanager}${API_PATHS.hubmanager}`);
    expect(hubManagerMe.ok()).toBeFalsy();

    const salesHubMe = await page.request.get(`${URLS.saleshub}${API_PATHS.saleshub}`);
    expect(salesHubMe.ok()).toBeFalsy();

    const finHubMe = await page.request.get(`${URLS.finhub}${API_PATHS.finhub}`);
    expect(finHubMe.ok()).toBeFalsy();
  });

  test('SSO-05: 허브 메인 페이지 로드 검증', async ({ page }) => {
    // 인증
    if (ENV === 'local') {
      await page.request.post(`${URLS.hubmanager}/api/auth/dev-login`, {
        data: { email: 'peter.chung@wavebridge.com' },
      });
    }

    // HubManager 메인 페이지
    await page.goto(URLS.hubmanager);
    await expect(page).not.toHaveURL(/error|500|404/);

    // SalesHub 메인 페이지
    await page.goto(URLS.saleshub + (ENV === 'local' ? '' : '/saleshub'));
    await expect(page).not.toHaveURL(/error|500|404/);

    // FinHub 메인 페이지
    await page.goto(URLS.finhub + (ENV === 'local' ? '' : '/finhub'));
    await expect(page).not.toHaveURL(/error|500|404/);
  });
});
