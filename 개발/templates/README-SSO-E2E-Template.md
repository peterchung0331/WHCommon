# SSO E2E 테스트 템플릿 가이드

## 개요

이 템플릿은 모든 WorkHub 프로젝트에서 Google OAuth SSO 로그인을 자동화하여 E2E 테스트를 수행하기 위한 표준 템플릿입니다.

## 파일 위치

- **템플릿 파일**: `/home/peterchung/WHCommon/templates/sso-e2e-test-template.ts`
- **이 가이드**: `/home/peterchung/WHCommon/templates/README-SSO-E2E-Template.md`

## 사용 방법

### 1. 템플릿 복사

```bash
# 예: WBFinHub 프로젝트에 적용
cp /home/peterchung/WHCommon/templates/sso-e2e-test-template.ts \
   /home/peterchung/WBFinHub/e2e/sso-login.spec.ts
```

### 2. 프로젝트별 설정 수정

복사한 파일에서 다음 부분을 수정:

```typescript
// ============================================================
// 프로젝트별 설정 (필수 수정)
// ============================================================
const PROJECT_NAME = 'WBFinHub'; // 프로젝트 이름
const FRONTEND_URL = 'http://localhost:3020'; // 프론트엔드 URL
const BACKEND_URL = 'http://localhost:4020'; // 백엔드 URL
const HUB_MANAGER_URL = 'http://localhost:4090'; // HubManager URL (고정)
```

### 3. 환경변수 설정

각 프로젝트의 `.env` 파일에 다음 추가:

```env
# Google 테스트 계정 (SSO E2E 테스트용)
TEST_GOOGLE_EMAIL=biz.dev@wavebridge.com
TEST_GOOGLE_PASSWORD=wave1234!!
```

### 4. 테스트 실행

```bash
# 일반 실행
npm run test:e2e -- e2e/sso-login.spec.ts

# Headed 모드 (브라우저 보이기 - 권장)
npm run test:e2e:headed -- e2e/sso-login.spec.ts

# UI 모드 (인터랙티브)
npm run test:e2e:ui
```

## 템플릿 구조

### 핵심 기능

1. **Google 자동 로그인 헬퍼 함수** (`loginWithGoogle`)
   - 로그인 페이지 접근
   - Google 버튼 클릭
   - 이메일 입력
   - 비밀번호 입력
   - 리다이렉트 대기
   - 인증 완료 확인

2. **5가지 기본 테스트 케이스**
   - SSO 로그인 플로우 전체 테스트
   - 로그인 후 메인 페이지 접근
   - 사용자 정보 표시 확인
   - 로그아웃 테스트
   - 화면 렌더링 반복 테스트

3. **스크린샷 자동 저장**
   - 각 단계마다 스크린샷 저장
   - 저장 위치: `/home/peterchung/HWTestAgent/test-results/MyTester/screenshots/`

4. **네트워크 모니터링**
   - 모든 auth 관련 요청/응답 로깅
   - 콘솔 에러 자동 감지

## 프로젝트별 포트 정보

| 프로젝트 | Frontend | Backend |
|---------|----------|---------|
| WBHubManager | 3090 | 4090 |
| WBSalesHub | 3010 | 4010 |
| WBFinHub | 3020 | 4020 |
| WBOnboardingHub | 3030 | 4030 |
| WBRefHub | 3099 | 4099 |

## 주의사항

### 1. Google 테스트 계정 요구사항

- ✅ 실제 Google 계정 필요 (테스트 전용 계정 사용)
- ❌ 2단계 인증(2FA) 비활성화 필수
- ❌ "보안 수준이 낮은 앱 액세스" 허용 필요할 수 있음
- ⚠️ **CAPTCHA 제한**: Google은 자동화된 로그인을 감지하여 CAPTCHA를 요구합니다
  - Playwright로 CAPTCHA 우회는 거의 불가능
  - **권장**: JWT Mock 토큰 사용 (실제 OAuth 대신)

### 2. Headless 모드 제한

Google은 봇 감지 시스템이 있어 headless 모드에서 로그인이 차단될 수 있습니다.

**권장**: Headed 모드 사용

```bash
npm run test:e2e:headed
```

### 3. 타임아웃 설정

네트워크 상황에 따라 타임아웃이 발생할 수 있습니다. 필요시 다음 값을 조정:

```typescript
page.setDefaultTimeout(30000); // 기본 30초
await page.waitForURL(..., { timeout: 15000 }); // URL 대기 15초
```

### 4. CI/CD 환경 및 CAPTCHA 제한

**⚠️ 중요**: Google OAuth 자동화는 CAPTCHA로 인해 실제 환경에서 사용하기 어렵습니다.

CI/CD 파이프라인 및 로컬 테스트에서 권장하는 방법:

- **Option 1 (권장)**: **Mock JWT 토큰 사용** - Google OAuth 건너뛰기
  - HubManager에서 테스트용 JWT 토큰 생성
  - Cookie로 직접 설정하여 인증 상태 시뮬레이션
  - CAPTCHA 우회 가능, 안정적인 테스트
  - 예시: `refhub-jwt-auth.spec.ts` 참조

- **Option 2**: Playwright의 `storageState`로 인증 상태 저장/재사용
  - 한 번 수동으로 로그인 후 상태 저장
  - 이후 테스트에서 재사용
  - CAPTCHA 한 번만 통과하면 됨

- **Option 3**: Google OAuth Playground로 토큰 미리 발급
  - 실제 Google OAuth 토큰 발급
  - 환경변수에 저장하여 사용
  - 토큰 만료 시 재발급 필요

## 고급 사용법

### 인증 상태 저장 (재사용)

한 번 로그인한 상태를 저장하여 다른 테스트에서 재사용:

```typescript
// 첫 번째 테스트에서 로그인 후 저장
await page.context().storageState({ path: 'auth-state.json' });

// 다른 테스트에서 재사용
const context = await browser.newContext({ storageState: 'auth-state.json' });
```

### 커스텀 스크린샷 디렉토리

```typescript
const SCREENSHOT_DIR = `/custom/path/screenshots/${PROJECT_NAME}`;
```

### 추가 테스트 케이스 작성

템플릿에 포함된 5개 테스트 외에 프로젝트별 테스트 추가:

```typescript
test('06. 대시보드 접근 테스트', async ({ page }) => {
  await loginWithGoogle(page);

  await page.goto(`${FRONTEND_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  // 대시보드 UI 확인
  const dashboardTitle = await page.locator('h1').textContent();
  expect(dashboardTitle).toContain('Dashboard');
});
```

## 트러블슈팅

### 문제: Google 로그인 버튼을 찾을 수 없음

**원인**: 셀렉터가 프로젝트마다 다를 수 있음

**해결**:
```typescript
const googleButton = page.locator('button:has-text("Google 계정으로 로그인")');
// 또는
const googleButton = page.locator('[data-testid="google-login-button"]');
```

### 문제: "봇 감지됨" 에러

**원인**: Google이 자동화된 로그인 감지

**해결**:
1. Headed 모드 사용
2. User-Agent 설정
3. 느린 타이핑 시뮬레이션

```typescript
await emailInput.fill(GOOGLE_EMAIL!, { delay: 100 }); // 100ms delay per character
```

### 문제: 리다이렉트 후 페이지 로드 안 됨

**원인**: 네트워크 지연 또는 SSO 플로우 문제

**해결**:
```typescript
// 타임아웃 증가
await page.waitForURL(..., { timeout: 30000 });

// 또는 여러 조건 체크
await page.waitForFunction(() => {
  return document.readyState === 'complete' &&
         document.body.innerHTML.length > 500;
});
```

## 업데이트 이력

- **2026-01-04**: 초기 템플릿 생성
  - Google OAuth 자동 로그인 기능
  - 5가지 기본 테스트 케이스
  - 스크린샷 자동 저장
  - 네트워크 모니터링

## 문의

템플릿 개선 제안이나 문제 발생 시:
- GitHub Issue 등록
- 또는 WHCommon/OnProgress에 문서 작성
