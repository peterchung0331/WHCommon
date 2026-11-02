---
name: 스킬테스터-E2E
description: Playwright 기반 E2E 테스트, Google 로그인, 스크린샷 분석, 자동 수정
---

# 스킬테스터-E2E (End-to-End Test)

## 개요
Playwright를 사용하여 브라우저 기반 E2E 테스트를 실행하고,
스크린샷을 분석하여 실패 시 자동으로 코드를 수정합니다.

## 특징
| 항목 | 값 |
|------|-----|
| 브라우저 | ✅ Playwright (Chromium) |
| Google 로그인 | ✅ 실제 로그인 |
| 스크린샷 | ✅ 단계별 캡처 |
| 속도 | 느림 (1~3분) |
| 도구 | Playwright |
| 대상 | 전체 UI 플로우 |

## 필수 환경변수
```bash
GOOGLE_TEST_EMAIL=test@wavebridge.kr
GOOGLE_TEST_PASSWORD=your_password
TEST_URL_LOCAL=http://localhost:3090
TEST_URL_ORACLE=https://wbhub.oracle.cloud
```

## 환경별 설정

### 로컬 환경 (Fast Mode)
```typescript
{
  timeout: 15000,        // 15초
  workers: 4,            // 병렬 4개
  retries: 0,            // 재시도 없음
  headless: true,
  screenshot: 'only-on-failure',
  video: 'off',
}
```

### Oracle 환경 (Stable Mode)
```typescript
{
  timeout: 90000,        // 90초
  workers: 2,            // 병렬 2개
  retries: 3,            // 재시도 3회
  headless: true,
  screenshot: 'on',
  video: 'retain-on-failure',
}
```

## 작업 순서

### 1단계: 환경 설정
```
├─ .env에서 GOOGLE_TEST_EMAIL/PASSWORD 로드
├─ playwright.config.ts 확인 (로컬/Oracle)
├─ baseURL 결정
└─ 브라우저 컨텍스트 설정
```

### 2단계: 브라우저 실행 + Google 로그인
```
├─ Chromium 브라우저 실행
├─ accounts.google.com 접속
├─ 📸 스크린샷: 01-google-login.png
├─ 이메일 입력 → 📸 02-email-entered.png
├─ 비밀번호 입력 → 📸 03-password-entered.png
└─ 로그인 완료 확인 → 📸 04-login-complete.png
```

### 3단계: E2E 테스트 실행
```
플로우 예시: HubManager → SalesHub

1. HubManager 접속
   ├─ baseURL 접속
   ├─ 📸 05-hubmanager-home.png
   └─ Hub 선택 페이지 이동

2. SalesHub 네비게이션
   ├─ "Sales Hub" 버튼 클릭
   ├─ 📸 06-saleshub-dashboard.png
   └─ 대시보드 요소 확인
```

### 4단계: 목표 화면 확인 + 반복 디버깅 (최대 3회)
```
목표 화면 판별:
├─ targetSelector: '[data-testid="dashboard"]'
└─ targetURL: '/dashboard'

❌ 목표 미도달 시:
  ├─ 📸 현재 화면 스크린샷 캡처
  ├─ 에러 원인 분석 (스크린샷 + 로그)
  ├─ 🔧 코드 수정 적용
  ├─ ⏳ 2초 대기
  └─ 🔁 재시도 (1/3)

❌ 재시도 1 실패:
  ├─ 📸 스크린샷 + 네트워크 로그 분석
  ├─ 🔧 다른 접근법으로 수정
  ├─ ⏳ 4초 대기
  └─ 🔁 재시도 (2/3)

❌ 재시도 2 실패:
  ├─ 📸 전체 페이지 스크린샷 + DOM 덤프
  ├─ 🔧 근본 원인 분석 후 수정
  ├─ ⏳ 6초 대기
  └─ 🔁 최종 재시도 (3/3)

❌ 최종 실패 → 상세 리포트 생성
✅ 성공 → 수정사항 기록 + 리포트 생성
```

### 5단계: 리포트 생성
```
템플릿: /home/peterchung/WHCommon/TestReport/테스트-리포트-템플릿.md

리포트 구조:
├─ 📊 테스트 결과 요약
├─ 📸 스크린샷 갤러리 (단계별)
│   └─ ![01-google-login](screenshots/01-google-login.png)
├─ 🔧 수정사항 (코드 변경 내역)
├─ 🔍 발견된 문제점
└─ 📝 결론 및 권장사항
```

### 6단계: 결과 저장
```
리포트: /home/peterchung/HWTestAgent/test-results/MyTester/reports/
        YYYY-MM-DD-[시작]-[목표]-E2E-테스트.md

스크린샷: /home/peterchung/HWTestAgent/test-results/MyTester/screenshots/
          YYYY-MM-DD-[시작]-[목표]/
          ├─ 01-google-login.png
          ├─ 02-email-entered.png
          └─ ...
```

## 스크린샷 전략

| 시점 | 파일명 패턴 | 설명 |
|------|------------|------|
| 페이지 로드 | `01-{페이지명}.png` | 초기 상태 캡처 |
| 액션 전 | `02-before-{액션}.png` | 클릭/입력 직전 |
| 액션 후 | `03-after-{액션}.png` | 클릭/입력 직후 |
| 에러 발생 | `error-{timestamp}.png` | 실패 시 자동 캡처 |
| 최종 결과 | `final-{테스트명}.png` | fullPage 캡처 |

## Google 로그인 자동화
```typescript
async function loginWithGoogle(page: Page) {
  const email = process.env.GOOGLE_TEST_EMAIL;
  const password = process.env.GOOGLE_TEST_PASSWORD;

  await page.goto('https://accounts.google.com');
  await page.screenshot({ path: 'screenshots/01-google-login.png' });

  await page.fill('input[type="email"]', email);
  await page.click('button:has-text("다음")');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/02-email-entered.png' });

  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("다음")');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/03-password-entered.png' });

  await page.waitForURL('**/myaccount.google.com/**', { timeout: 30000 });
  await page.screenshot({ path: 'screenshots/04-login-complete.png' });
}
```

## 자동 수정 대상
| 오류 유형 | 수정 방법 |
|----------|----------|
| 셀렉터 미발견 | 셀렉터 업데이트 또는 대기 시간 증가 |
| 타임아웃 | waitForSelector 타임아웃 조정 |
| 네비게이션 실패 | URL 패턴 또는 라우팅 수정 |
| 인증 실패 | OAuth 플로우 수정 |
| UI 요소 변경 | 테스트 코드 업데이트 |

## 사용 예시
```
/스킬테스터 허브매니저->세일즈허브 E2E 테스트
/스킬테스터 오라클에서 HubManager->FinHub E2E
/스킬테스터 --headed E2E 테스트   # 브라우저 표시 모드
```

## 파싱 정보 (메인에서 전달)
```typescript
interface E2ETestConfig {
  env: 'local' | 'oracle' | 'railway';
  startProject: string;    // 시작 프로젝트
  targetProject: string;   // 목표 프로젝트
  startPath: string;       // 시작 프로젝트 경로
  targetPath: string;      // 목표 프로젝트 경로
  headed: boolean;         // 브라우저 표시 여부
  maxRetries: number;      // 최대 재시도 횟수 (기본: 3)
  targetSelector?: string; // 목표 화면 셀렉터
  targetURL?: string;      // 목표 URL 패턴
}
```

## 참조 파일
- Auth helpers: `/home/peterchung/WBFinHub/playwright/helpers/auth-helpers.ts`
- OAuth test: `/home/peterchung/WBHubManager/tests/google-oauth-flow-test.spec.ts`
- Local config: `/home/peterchung/WBHubManager/playwright.local.config.ts`
- Prod config: `/home/peterchung/WBHubManager/playwright.prod.config.ts`
