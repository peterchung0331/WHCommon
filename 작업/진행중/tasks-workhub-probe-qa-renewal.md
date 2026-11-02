## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 10일 (80 WU) |
| 파일 수 | ~30개 신규/수정 |
| 예상 LOC | ~1,500줄 |
| 복잡도 | 높음 |

## Relevant Files

- `WHCommon/packages/wh-probe/` — 공유 테스트 패키지 (신규)
- `WHCommon/test-archive/manifest.md` — 아카이브 매니페스트
- `WHCommon/test-archive/insights-report.md` — 인사이트 리포트
- `HWTestAgent/src/runner/adapters/PlaywrightAdapter.ts` — Playwright 어댑터 (신규)
- `HWTestAgent/src/server/routes/api.ts:1059-1130` — POST /api/results/playwright (추가)
- 각 허브 `playwright.config.ts` — hwtest-reporter 연동 (수정 예정)

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`.

## Tasks

- [x] 0.0 Phase 0: 현황 분석 및 아카이브
  - [x] 0.1 5개 레포 테스트 파일 인벤토리 작성
  - [x] 0.2 아카이브 기준 적용 (debug/staging/oracle/JWT/OAuth)
  - [x] 0.3 `git mv`로 78파일 아카이브 (히스토리 보존)
  - [x] 0.4 아카이브 매니페스트 생성 (`WHCommon/test-archive/manifest.md`)

- [x] 1.0 Phase 1: 인사이트 추출
  - [x] 1.1 API 커버리지 갭 분석 (394 라우트 중 28개 커버 = 7%)
  - [x] 1.2 페이지 커버리지 갭 분석 (68 페이지 중 19개 커버 = 28%)
  - [x] 1.3 인사이트 리포트 작성 (`WHCommon/test-archive/insights-report.md`)

- [x] 2.0 Phase 2: @workhub/probe 공유 패키지
  - [x] 2.1 패키지 초기화 (`WHCommon/packages/wh-probe/`)
  - [x] 2.2 쿠키 기반 SSO 인증 헬퍼 (`sso-cookie.helper.ts`)
  - [x] 2.3 어드민 인증 헬퍼 (`admin-auth.helper.ts`)
  - [x] 2.4 테스트 사용자 픽스처 (`test-users.ts`)
  - [x] 2.5 허브 레지스트리 + 환경 설정 (`hub-registry.ts`, `environments.ts`)
  - [x] 2.6 DB 시드 매니저 (`seed-manager.ts`)
  - [x] 2.7 Page Object 패턴 (`BasePage`, `AdminAuthPage`, `HubSelectorPage`)
  - [x] 2.8 HWTestAgent 연동 리포터 (`hwtest-reporter.ts`)
  - [x] 2.9 TypeScript 빌드 성공 확인

- [x] 3.0 Phase 3: HWTestAgent v2
  - [x] 3.1 PlaywrightAdapter 작성 (`src/runner/adapters/PlaywrightAdapter.ts`)
  - [x] 3.2 결과 수집 API 추가 (`POST /api/results/playwright`)
  - [x] 3.3 대시보드 Cross-Hub 테스트 개요 페이지
  - [x] 3.4 Slack 알림에 알려진 해결책 포함

- [x] 4.0 Phase 4: Cross-Hub SSO 테스트
  - [x] 4.1 `cross-hub-sso.spec.ts` 작성 (5개 테스트 케이스)
  - [x] 4.2 ProbeScheduler 스케줄 등록

- [x] 5.0 Phase 5: 내테스터 스킬 리뉴얼
  - [x] 5.1 기존 스킬 4개 아카이브 (`_archived/`)
  - [x] 5.2 신규 디스패처 스킬 작성 (`@workhub/probe` 기반)
  - [x] 5.3 신규 단위 테스트 스킬 작성
  - [x] 5.4 신규 통합 테스트 스킬 작성
  - [x] 5.5 신규 E2E 테스트 스킬 작성

- [x] 6.0 허브별 playwright.config.ts에 probe-reporter 연동
  - [x] 6.1 WBHubManager playwright.config.ts 수정
  - [x] 6.2 WBSalesHub playwright.config.ts 수정
  - [x] 6.3 WBFinHub playwright.config.ts 수정
  - [x] 6.4 WBOnboardingHub playwright.config.ts 수정
