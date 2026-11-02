# WorkHub Probe — 테스트 아카이브 매니페스트

> 아카이브 날짜: 2026-03-16
> 사유: QA 테스트 시스템 리뉴얼 (WorkHub Probe 구축)

## 아카이브 기준

1. **debug-*, staging-*, oracle-*** — 일회성 디버깅 테스트
2. **JWT/OAuth 관련** — 현재 쿠키 기반 SSO로 전환 완료, JWT 직접 발급/검증 불사용
3. **test-* 루트 레벨** — 구조화되지 않은 임시 테스트
4. **production-*, manual-*** — 수동 검증용 일회성 테스트

---

## HWTestAgent (42 파일 → tests/_archived/)

| 카테고리 | 파일 수 | 대표 파일 | 테스트 대상 |
|----------|---------|----------|------------|
| debug-* | 13 | debug-saleshub-click, debug-network | UI 클릭, 네트워크, 배너 디버깅 |
| staging-* | 15 | staging-click-debug, staging-e2e-* | 스테이징 환경 UI/로그인 검증 |
| oracle-* / e2e-oracle-* | 8 | oracle-production-e2e, oracle-staging-* | 오라클 클라우드 환경 검증 |
| JWT/OAuth | 5 | saleshub-jwt-dashboard, saleshub-oauth-direct, wbfinhub-jwt-auth | JWT 토큰 발급/검증, OAuth 직접 플로우 |
| 기타 | 1 | workhub-production-e2e | 프로덕션 일회성 검증 |

**인사이트**: debug/staging 테스트에서 가장 많이 테스트된 영역은 **허브 카드 클릭 → 리다이렉트** 플로우. 이 영역의 안정적 E2E 테스트 필요.

## WBHubManager (10 파일)

| 위치 | 파일 | 카테고리 | 테스트 대상 |
|------|------|----------|------------|
| tests/_archived/ | debug-404-error.spec.ts | debug | 404 에러 페이지 |
| tests/_archived/ | debug-hubs-page.spec.ts | debug | 허브 목록 페이지 |
| tests/_archived/ | debug-infinite-spinner.spec.ts | debug | 무한 스피너 버그 |
| tests/_archived/ | sso-auto-flow-test.spec.ts | SSO/JWT | SSO 자동 로그인 플로우 |
| tests/_archived/ | sso-direct-api-test.spec.ts | SSO/JWT | SSO API 직접 호출 |
| tests/_archived/ | sso-with-session-test.spec.ts | SSO/JWT | 세션 기반 SSO |
| tests/_archived/ | finhub-dashboard-repeat-test.spec.ts | JWT | FinHub 대시보드 JWT 인증 |
| tests/e2e/_archived/ | auth.spec.ts | JWT | JWT 발급/리프레시/알고리즘 공격 방어 (A-01~A-06, S-01~S-03) |
| tests/e2e/_archived/ | google-oauth-admin.spec.ts | OAuth | Google OAuth 어드민 플로우 |
| server/__tests__/_archived/ | jwt.service.test.ts | JWT 단위 | JWT 페이로드/알고리즘/토큰 크기/해시/만료 검증 |

**인사이트**: auth.spec.ts의 테스트 케이스(JWT 발급, 리프레시, 알고리즘 공격)는 커버한 **엔드포인트 목록**으로 참조 가치 있음: `/api/auth/google-login`, `/api/auth/verify`, `/api/auth/refresh`, `/api/auth/logout`

## WBFinHub (14 파일)

| 위치 | 파일 | 카테고리 | 테스트 대상 |
|------|------|----------|------------|
| tests/_archived/ | test-dashboard.spec.ts | debug | 대시보드 기본 로드 |
| tests/_archived/ | test-finhub-dashboard.spec.ts | debug | FinHub 대시보드 |
| tests/_archived/ | test-finhub-debug.spec.ts | debug | FinHub 디버깅 |
| tests/_archived/ | test-finhub-detailed.spec.ts | debug | FinHub 상세 검증 |
| tests/_archived/ | test-finhub-frontend.spec.ts | debug | 프론트엔드 로드 |
| tests/_archived/ | test-finhub-hub-selection.spec.ts | debug | 허브 선택 UI |
| tests/_archived/ | test-finhub-sso-simple.spec.ts | SSO | SSO 간단 검증 |
| tests/_archived/ | test-finhub-static-files.spec.ts | debug | 정적 파일 서빙 |
| tests/_archived/ | test-manual-click.spec.ts | debug | 수동 클릭 테스트 |
| tests/_archived/ | test-sso-google-login.spec.ts | OAuth | Google 로그인 |
| tests/_archived/ | test-sso-integration.spec.ts | SSO/JWT | SSO 통합 테스트 |
| tests/_archived/ | finhub-sso-prod.spec.ts | SSO | 프로덕션 SSO |
| playwright/tests/e2e/_archived/ | auth-flow.spec.ts | OAuth | Oracle 스테이징 인증 플로우 |
| playwright/tests/e2e/_archived/ | sso-callback.spec.ts | SSO | SSO 콜백 처리 |

**인사이트**: FinHub의 테스트는 대부분 **루트 레벨 산재 + SSO 중심**. 구조화된 테스트가 거의 없음 → 새 테스트 작성 우선순위 높음.

## WBSalesHub (10 파일)

| 위치 | 파일 | 카테고리 | 테스트 대상 |
|------|------|----------|------------|
| e2e/_archived/ | context-add-debug.spec.ts | debug | 컨텍스트 추가 디버깅 |
| e2e/_archived/ | context-add-staging.spec.ts | staging | 스테이징 컨텍스트 |
| e2e/_archived/ | debug-loading.spec.ts | debug | 로딩 상태 디버깅 |
| e2e/_archived/ | staging-login-debug.spec.ts | staging | 스테이징 로그인 |
| e2e/_archived/ | staging-verification.spec.ts | staging | 스테이징 검증 |
| e2e/_archived/ | manual-auth-save.spec.ts | manual | 인증 상태 저장 |
| e2e/_archived/ | manual-context-test.spec.ts | manual | 컨텍스트 수동 테스트 |
| e2e/_archived/ | production-clean-test.spec.ts | production | 프로덕션 클린 테스트 |
| e2e/_archived/ | production-quick-check.spec.ts | production | 프로덕션 빠른 확인 |
| frontend/e2e/_archived/ | staging-login.spec.ts | staging | 스테이징 로그인 |

**인사이트**: SalesHub는 JWT/OAuth 테스트가 적음. debug/staging/production 환경별 일회성이 주로 아카이브됨.

## WBOnboardingHub (2 파일)

| 위치 | 파일 | 카테고리 | 테스트 대상 |
|------|------|----------|------------|
| tests/_archived/ | sso-flow.spec.ts | SSO/JWT | HubManager→OnboardingHub SSO 플로우 |
| server/__tests__/_archived/ | integration.test.ts | SSO/JWT | JWT 토큰 검증 통합 테스트 |

**인사이트**: 깔끔한 레포에서 유일하게 SSO/JWT 의존 테스트 2개만 아카이브.

---

## 전체 요약

| Repo | 아카이브 | 활성 유지 | 아카이브율 |
|------|---------|----------|-----------|
| HWTestAgent | 42 | ~38 | 53% |
| WBHubManager | 10 | ~22 | 31% |
| WBFinHub | 14 | ~0 | 100% |
| WBSalesHub | 10 | ~14 | 42% |
| WBOnboardingHub | 2 | 7 | 22% |
| **전체** | **78** | **~81** | **49%** |

## 엔드포인트 커버리지 참조 (아카이브 테스트에서 추출)

아카이브된 JWT/OAuth 테스트가 커버한 API 엔드포인트 (새 쿠키 기반 테스트로 대체 필요):
- `POST /api/auth/google-login` → 쿠키 기반 로그인으로 대체
- `POST /api/auth/verify` → `/api/auth/me` (쿠키) 로 대체
- `POST /api/auth/refresh` → 쿠키 자동 갱신으로 대체
- `POST /api/auth/logout` → 쿠키 삭제로 대체
- `GET /api/auth/public-key` → 더 이상 사용하지 않음
