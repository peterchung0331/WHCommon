# Tasks: Hub SSO Redirect 개선

## Relevant Files

### WBHubManager
- `server/routes/authRoutes.ts` - OAuth 라우트 핸들러 (Google OAuth, callback 처리)
- `server/middleware/jwt.ts` - JWT 생성 및 검증 로직
- `server/types/index.ts` - JWT Payload 타입 정의 (last_hub_id 추가 필요)
- `server/utils/redirect-validator.ts` - redirect_uri whitelist 검증 유틸리티 (신규 생성)
- `server/config/allowed-redirects.ts` - 허용된 리다이렉트 도메인 목록 (신규 생성)

### WBFinHub
- `frontend/app/(auth)/login/page.tsx` - 로그인 화면 (redirect_uri, hub_id 파라미터 추가)
- `frontend/app/(auth)/callback/page.tsx` - OAuth callback 처리 (신규 생성)
- `server/routes/authRoutes.ts` - Auth 라우트 (callback 엔드포인트 추가)
- `.env.template` - 환경변수 템플릿 (HUB_ID, HUB_CALLBACK_URL 추가)

### WBSalesHub
- `frontend/app/(auth)/login/page.tsx` - 로그인 화면 (redirect_uri, hub_id 파라미터 추가)
- `frontend/app/(auth)/callback/page.tsx` - OAuth callback 처리 (신규 생성)
- `server/routes/authRoutes.ts` - Auth 라우트 (callback 엔드포인트 추가)
- `.env.template` - 환경변수 템플릿 (HUB_ID, HUB_CALLBACK_URL 추가)

### 공통
- `WHCommon/기능 PRD/prd-hub-sso-redirect-improvement.md` - PRD 문서
- `WHCommon/tasks/tasks-hub-sso-redirect-improvement.md` - 이 태스크 문서

### Notes
- OAuth state는 JWT로 서명하여 변조 방지
- redirect_uri는 whitelist 검증 필수
- 마지막 접속 허브는 JWT payload에 저장
- 모든 허브에 동일한 패턴으로 구현하여 확장성 확보

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 WBHubManager: `git checkout -b feature/hub-sso-redirect-improvement`
  - [x] 0.2 WBFinHub: `git checkout -b feature/hub-sso-redirect-improvement`
  - [x] 0.3 WBSalesHub: `git checkout -b feature/hub-sso-redirect-improvement`

- [x] 1.0 WBHubManager: redirect_uri whitelist 검증 유틸리티 구현
  - [x] 1.1 `server/config/allowed-redirects.ts` 파일 생성
  - [x] 1.2 허용된 도메인 목록 정의 (workhub.biz, 158.180.95.246, localhost)
  - [x] 1.3 개발/프로덕션 환경별 허용 포트 설정
  - [x] 1.4 `server/utils/redirect-validator.ts` 파일 생성
  - [x] 1.5 `isValidRedirectUri(uri: string): boolean` 함수 구현
  - [x] 1.6 URL 파싱 및 도메인/포트 검증 로직 작성
  - [x] 1.7 에러 케이스 처리 (invalid URL 등)

- [x] 2.0 WBHubManager: OAuth state에 redirect_uri와 hub_id 저장 및 복원
  - [x] 2.1 `server/types/oauth.ts` 생성 - OAuthState 타입 정의
  - [x] 2.2 OAuthState 인터페이스에 `redirect_uri?`, `hub_id?` 필드 추가
  - [x] 2.3 `server/routes/authRoutes.ts` 읽기 - Google OAuth 엔드포인트 확인
  - [x] 2.4 `/auth/google-oauth` 라우트에서 query parameter로 `redirect_uri`, `hub_id` 받기
  - [x] 2.5 받은 `redirect_uri` whitelist 검증 수행
  - [x] 2.6 검증 통과 시 OAuth state 객체에 `redirect_uri`, `hub_id` 포함
  - [x] 2.7 State를 JWT로 서명하여 Google OAuth URL에 전달
  - [x] 2.8 `/google-callback` 라우트에서 state JWT 검증 및 디코딩
  - [x] 2.9 State에서 `redirect_uri`, `hub_id` 복원

- [x] 3.0 WBHubManager: JWT payload에 last_hub_id 추가 및 자동 리다이렉트 로직
  - [x] 3.1 JWT payload에 `last_hub_id?: string` 필드 지원
  - [x] 3.2 `generateHubToken` 함수에 `hub_id` 파라미터 추가
  - [x] 3.3 JWT 생성 시 `hub_id`가 있으면 `last_hub_id`로 저장
  - [x] 3.4 `/google-callback`에서 `redirect_uri`가 있는 경우:
  - [x] 3.5   - JWT 토큰을 query parameter로 추가하여 `redirect_uri`로 리다이렉트
  - [x] 3.6 `/google-callback`에서 `redirect_uri`가 없는 경우:
  - [x] 3.7   - `hub_slug`가 있으면 해당 허브로 리다이렉트 (기존 로직 유지)
  - [x] 3.8   - 둘 다 없으면 허브 선택 화면(`/hubs`)으로 리다이렉트
  - [ ] 3.9   - (TODO 나중에) JWT에서 `last_hub_id` 읽어서 자동 리다이렉트
  - [ ] 3.10 (TODO 나중에) 허브 선택 화면에서 허브 클릭 시 `last_hub_id` 저장

- [x] 4.0 WBFinHub: 로그인 화면에서 redirect_uri, hub_id 파라미터 전달
  - [x] 4.1 `.env.template` 읽기
  - [x] 4.2 `HUB_ID=finhub` 추가
  - [x] 4.3 `HUB_CALLBACK_URL=http://workhub.biz/finhub/auth/callback` 추가 (프로덕션)
  - [x] 4.4 `.env.local`에도 동일하게 추가 (개발용은 localhost:3020)
  - [x] 4.5 `frontend/providers/AuthProvider.tsx` 수정
  - [x] 4.6 `login()` 함수 수정:
  - [x] 4.7   - Base URL: `${HUB_MANAGER_URL}/api/auth/google-oauth`
  - [x] 4.8   - Query params: `?redirect_uri=${HUB_CALLBACK_URL}&hub_id=${HUB_ID}`
  - [x] 4.9 환경변수를 클라이언트에서 사용할 수 있도록 설정 (NEXT_PUBLIC_*)

- [x] 5.0 WBFinHub: OAuth callback 엔드포인트 구현
  - [x] 5.1 `frontend/app/(auth)/callback/page.tsx` 파일 생성
  - [x] 5.2 Query parameter에서 `token` 읽기
  - [x] 5.3 토큰을 localStorage에 저장 (`accessToken` key)
  - [x] 5.4 토큰 검증 API 호출 (`/api/auth/me`)
  - [x] 5.5 검증 성공 시 대시보드(`/`)로 리다이렉트
  - [x] 5.6 검증 실패 시 로그인 화면(`/login`)으로 리다이렉트 (에러 메시지 포함)
  - [x] 5.7 로딩 상태 UI 추가 (스피너 등)

- [x] 6.0 WBSalesHub: 로그인 화면에서 redirect_uri, hub_id 파라미터 전달
  - [x] 6.1 `.env.example` 읽기
  - [x] 6.2 `HUB_ID=saleshub` 추가
  - [x] 6.3 `HUB_CALLBACK_URL=http://workhub.biz/saleshub/auth/callback` 추가 (프로덕션)
  - [x] 6.4 개발/프로덕션 환경변수 추가 완료
  - [x] 6.5 `frontend/lib/api-client.ts` 수정
  - [x] 6.6 `getLoginUrl()` 함수 수정
  - [x] 6.7   - Base URL: `${HUB_MANAGER_URL}/api/auth/google-oauth`
  - [x] 6.8   - Query params: `?redirect_uri=${HUB_CALLBACK_URL}&hub_id=${HUB_ID}`
  - [x] 6.9 환경변수 설정 완료

- [x] 7.0 WBSalesHub: OAuth callback 엔드포인트 구현
  - [x] 7.1 `frontend/app/(auth)/callback/page.tsx` 파일 수정
  - [x] 7.2 Query parameter에서 `token` 읽기
  - [x] 7.3 토큰을 localStorage에 저장 (`setTokens()` 사용)
  - [x] 7.4 기존 토큰 검증 플로우 유지
  - [x] 7.5 검증 성공 시 대시보드(`/`)로 리다이렉트
  - [x] 7.6 검증 실패 시 로그인 화면(`/login`)으로 리다이렉트
  - [x] 7.7 로딩 상태 UI (기존 유지)

- [ ] 8.0 통합 테스트 및 QA
  - [ ] 8.1 로컬 빌드 테스트 (WBHubManager, WBFinHub, WBSalesHub)
  - [ ] 8.2 시나리오 1: FinHub URL 직접 접근 → OAuth → FinHub 대시보드 도착 확인
  - [ ] 8.3 시나리오 2: SalesHub URL 직접 접근 → OAuth → SalesHub 대시보드 도착 확인
  - [ ] 8.4 시나리오 3: HubManager 메인 접근 → OAuth → 마지막 허브로 자동 리다이렉트 확인
  - [ ] 8.5 시나리오 4: 최초 로그인 (last_hub_id 없음) → 허브 선택 화면 표시 확인
  - [ ] 8.6 시나리오 5: 잘못된 redirect_uri 전달 → 검증 실패 및 에러 처리 확인
  - [ ] 8.7 시나리오 6: 허브 선택 화면에서 허브 선택 → last_hub_id 저장 확인
  - [ ] 8.8 Playwright E2E 테스트 스크립트 작성 (선택사항)
  - [ ] 8.9 모든 시나리오 통과 확인

- [ ] 9.0 배포 및 문서화
  - [ ] 9.1 WBHubManager 변경사항 커밋 및 푸시
  - [ ] 9.2 WBFinHub 변경사항 커밋 및 푸시
  - [ ] 9.3 WBSalesHub 변경사항 커밋 및 푸시
  - [ ] 9.4 오라클 서버에 WBHubManager 배포
  - [ ] 9.5 오라클 서버에 WBFinHub 배포
  - [ ] 9.6 오라클 서버에 WBSalesHub 배포
  - [ ] 9.7 프로덕션 환경에서 전체 플로우 테스트
  - [ ] 9.8 `WHCommon/온보딩-가이드.md`에 SSO 플로우 업데이트
  - [ ] 9.9 PR 생성 및 코드 리뷰 요청
  - [ ] 9.10 메인 브랜치 머지

---

**세부 태스크 생성 완료!**

총 10개의 상위 태스크, 90개의 서브태스크가 생성되었습니다. 이제 구현을 시작할 준비가 되었습니다!
