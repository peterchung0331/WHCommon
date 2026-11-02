# WorkHub Probe — 인사이트 리포트

> 분석일: 2026-03-16
> 아카이브 후 활성 테스트 기준 분석

## 1. 커버리지 갭 매트릭스

| Hub | API 라우트 | 테스트 커버 | API 커버리지 | 페이지 수 | 테스트 커버 | 페이지 커버리지 |
|-----|-----------|------------|-------------|----------|------------|----------------|
| HubManager | 74 | ~15 | **20%** | 14 | 4 | **29%** |
| SalesHub | 195 | ~10 | **5%** | 16 | 12 | **75%** |
| FinHub | 40 | 0 | **0%** | 27 | 0 | **0%** |
| OnboardingHub | 85 | ~3 | **4%** | 11 | 3 | **27%** |
| **전체** | **394** | **~28** | **7%** | **68** | **19** | **28%** |

## 2. 위험도 기반 우선순위

### CRITICAL — 즉시 테스트 필요
1. **FinHub 전체** — 금융 데이터 처리 허브, 테스트 커버리지 0%
   - 트랜잭션/월렛 API (14 라우트)
   - Fireblocks 연동
2. **SalesHub 딜 파이프라인** — CRM 핵심 로직, 20+ 라우트 미테스트
3. **Cross-Hub SSO 플로우** — 가장 빈번한 장애 경로, 테스트 0건

### HIGH — 다음 스프린트
4. **HubManager AI 페르소나** — 13 라우트 중 대부분 미테스트
5. **OnboardingHub 문서 업로드/승인** — GCP Vision OCR 파이프라인
6. **SalesHub 미팅 트랜스크립트** — 15+ 라우트

### MEDIUM — 점진적 확대
7. HubManager 문서 관리 (6 라우트)
8. SalesHub Slack 연동 (10 라우트)
9. OnboardingHub 리포트 생성 (8 라우트)

## 3. 아카이브 테스트에서 추출한 교훈

### 엔드포인트 커버리지 참조
아카이브된 JWT/OAuth 테스트가 **실제로 커버한** API 경로 (새 쿠키 기반 테스트로 대체 필요):

| 엔드포인트 | 아카이브 테스트 | 새 테스트 방식 |
|-----------|---------------|--------------|
| `POST /api/auth/google-login` | auth.spec.ts | 쿠키 주입 (mock) |
| `POST /api/auth/verify` | auth.spec.ts | `GET /api/auth/me` (쿠키) |
| `POST /api/auth/refresh` | auth.spec.ts | 쿠키 자동 갱신 |
| `POST /api/auth/logout` | auth.spec.ts | 쿠키 삭제 |
| `GET /api/auth/public-key` | auth.spec.ts | 사용 안 함 |

### 반복 실패 패턴 (debug 테스트에서 추출)
1. **허브 카드 클릭 → 리다이렉트 실패** — debug-saleshub-click, staging-click-* 등 15+ 파일
   - 근본 원인: `pointer-events: none` CSS, 이벤트 버블링 이슈
2. **SSO 리다이렉트 루프** — sso-auto-flow, sso-with-session 등
   - 근본 원인: 쿠키 도메인 불일치, `withCredentials` 누락
3. **무한 스피너** — debug-infinite-spinner
   - 근본 원인: AuthProvider `/api/auth/me` 호출 실패 시 무한 로딩

### 패턴/안티패턴

**좋은 패턴 (재사용)**:
- Page Object 패턴 (HubManager admin/) — 셀렉터 중앙화, 유지보수 용이
- DB seed/cleanup 패턴 (database.helper.ts) — 테스트 데이터 격리
- data-testid 기반 셀렉터 — CSS 변경에 강건

**안티패턴 (피할 것)**:
- Google OAuth UI 자동화 — 불안정, CAPTCHA/MFA로 자주 실패
- 하드코딩된 timeout — `page.waitForTimeout(3000)` 대신 selector wait 사용
- 루트 레벨 산재 테스트 — FinHub의 `test-*.spec.ts` 패턴, 구조화 필요

## 4. 활성 테스트 인벤토리 (아카이브 후)

### HubManager (13 파일)
- `tests/e2e/admin/admin-auth.spec.ts` — 어드민 인증 (TC-AUTH-01~06)
- `tests/e2e/admin/admin-accounts.spec.ts` — 계정 관리
- `tests/e2e/admin/admin-banners.spec.ts` — 배너 CRUD
- `tests/e2e/admin/admin-monitoring-api.spec.ts` — AI 모니터링
- `tests/e2e/api.spec.ts` — API 헬스/허브/문서
- `tests/e2e/pages.spec.ts` — 페이지 렌더링
- `tests/e2e/*.smoke.spec.ts` — 스모크 테스트 (3 파일)
- `tests/e2e/seed.spec.ts` — 시드 데이터

### SalesHub (14 파일)
- `e2e/context/` — 컨텍스트 CRUD (4 파일)
- `e2e/local/` — 로컬 인증/리다이렉트 (4 파일)
- `e2e/voice/` — 음성 업로드
- `e2e/signup.spec.ts` — 회원가입
- `frontend/e2e/customer-detail-tabs.spec.ts` — 고객 상세
- `frontend/e2e/reno-ai-tab.spec.ts` — Reno AI
- `tests/reno/reno.test.ts` — Reno 시나리오 (Vitest)
- `tests/voice/voice-upload-api.test.ts` — Voice API (Vitest)

### FinHub (0 파일) — CRITICAL
- 모든 테스트 아카이브됨
- 새 테스트 작성 최우선

### OnboardingHub (7 파일)
- `e2e/dashboard.spec.ts` — 대시보드
- `e2e/onboarding-create.spec.ts` — 온보딩 생성
- `e2e/onboarding-list.spec.ts` — 온보딩 목록
- `server/__tests__/auditLogService.test.ts` — 감사 로그
- `server/__tests__/workflow.test.ts` — 워크플로우
- `server/services/__tests__/` — 서비스 단위 테스트 (2 파일)
