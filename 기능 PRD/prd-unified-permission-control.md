# PRD: WorkHub 통합 권한 제어 시스템

## 1. Introduction/Overview

### 배경
현재 WBHubManager, WBSalesHub, WBFinHub는 각각 독립적인 계정 및 권한 관리 시스템을 운영하고 있습니다. 이로 인해 다음과 같은 문제가 발생하고 있습니다:

- 사용자가 각 허브마다 별도의 계정을 가지고 있어 관리가 분산됨
- 권한 변경 시 각 허브에서 개별적으로 수정해야 함
- 통합 감사 로그 부재로 전체 시스템의 사용자 활동 추적 어려움
- 관리자가 허브별로 각각 로그인하여 사용자 관리 필요

### 목표
WBHubManager를 중앙 인증 및 권한 관리 시스템으로 확장하여, 모든 허브의 계정과 권한을 통합 관리하는 시스템을 구축합니다.

### 핵심 가치
- **통합 관리**: 모든 허브의 사용자 계정과 권한을 하나의 관리 화면에서 제어
- **일관성**: JWT 토큰에 역할 및 Entity 정보를 포함하여 각 허브에 전달
- **투명성**: 통합 감사 로그를 통해 모든 허브의 사용자 활동 추적
- **확장성**: 허브별 커스텀 역할을 지원하여 유연한 권한 체계 구축

---

## 2. Goals

### 주요 목표
1. **중앙화된 계정 관리**: 각 허브의 Account 테이블 제거, WBHubManager만 사용자 정보 관리
2. **통합 권한 제어**: 허브별 커스텀 역할 지원, 사용자별 허브별 역할 할당
3. **Entity 통합**: WBFinHub의 법인(Entity) 개념을 WBHubManager로 이동
4. **통합 감사 로그**: 모든 허브의 사용자 활동 로그를 WBHubManager에 집중
5. **관리자 UI**: "Work Hub 관리" 페이지 신설 (대시보드, 계정 관리, 감사 로그)

### 성공 지표
- 모든 허브의 계정 정보가 WBHubManager로 통합 이전 완료
- 관리자가 단일 화면에서 모든 허브의 사용자 권한 제어 가능
- 통합 감사 로그를 통해 전체 시스템의 사용자 활동 추적 가능
- JWT 토큰에 역할 및 Entity 정보가 포함되어 각 허브로 전달됨

---

## 3. User Stories

### US-1: 관리자 - 통합 계정 관리
**As a** Work Hub 관리자
**I want to** 모든 허브의 사용자 계정을 하나의 화면에서 조회하고 관리하고 싶습니다
**So that** 여러 허브를 일일이 접속하지 않고 효율적으로 사용자를 관리할 수 있습니다

**Acceptance Criteria:**
- 모든 사용자의 이메일, 이름, 허브별 역할, Entity 할당 정보를 테이블로 표시
- 검색, 필터링(허브별, 상태별) 기능 제공
- 사용자 클릭 시 상세 정보 조회 및 수정 가능

### US-2: 관리자 - 역할 할당 및 변경
**As a** Work Hub 관리자
**I want to** 특정 사용자의 허브별 역할을 변경하고 싶습니다
**So that** 조직 변경이나 업무 변경 시 권한을 즉시 조정할 수 있습니다

**Acceptance Criteria:**
- 사용자 편집 화면에서 각 허브별 역할 선택 가능
- 역할 변경 시 감사 로그에 자동 기록
- 변경 즉시 JWT 토큰에 반영되어 다음 로그인 시 적용

### US-3: 관리자 - Entity 할당 (FinHub)
**As a** Work Hub 관리자
**I want to** 특정 사용자에게 법인(Entity)을 할당하고 싶습니다
**So that** FinHub에서 해당 사용자가 자신의 법인 데이터만 조회할 수 있도록 격리할 수 있습니다

**Acceptance Criteria:**
- Entity 선택 UI에서 여러 Entity 선택 가능 (다중 선택)
- 주 Entity(Primary Entity) 지정 가능
- Entity 할당 시 감사 로그에 자동 기록

### US-4: 관리자 - 통합 감사 로그 조회
**As a** Work Hub 관리자
**I want to** 모든 허브의 사용자 활동 로그를 한 곳에서 조회하고 싶습니다
**So that** 시스템 전체의 보안 및 감사 요구사항을 충족할 수 있습니다

**Acceptance Criteria:**
- 모든 허브의 로그를 시간순으로 표시
- 사용자별, 허브별, 액션별 필터링 가능
- 로그 상세 정보 (IP 주소, User Agent, 변경 전/후 값) 조회 가능

### US-5: 일반 사용자 - 허브 접근 시 자동 권한 적용
**As a** 일반 사용자
**I want to** 허브에 로그인하면 내 역할에 맞는 권한이 자동으로 적용되기를 원합니다
**So that** 별도의 권한 설정 없이 바로 업무를 수행할 수 있습니다

**Acceptance Criteria:**
- WBHubManager에서 Google OAuth 로그인 후 허브 선택
- JWT 토큰에 역할 및 Entity 정보가 포함되어 허브로 전달
- 허브에서 토큰 검증 후 역할 기반 접근 제어 적용

### US-6: 관리자 - 대시보드 통계 조회
**As a** Work Hub 관리자
**I want to** 전체 사용자 수, 허브별 사용자 분포, 최근 활동 통계를 한눈에 보고 싶습니다
**So that** 시스템 사용 현황을 파악하고 의사결정에 활용할 수 있습니다

**Acceptance Criteria:**
- 총 사용자 수, 최근 24시간 로그인 수, 최근 감사 로그 수 표시
- 허브별 사용자 수 차트 (프로그레스 바)
- 역할별 사용자 분포 (FinHub 기준)

---

## 4. Functional Requirements

### FR-1: 데이터베이스 스키마
**FR-1.1** 시스템은 다음 테이블을 생성해야 합니다:
- `entities`: 법인 정보 (id, name, code, currency, timezone, is_active)
- `hub_roles`: 허브별 역할 정의 (id, hub_id, role_name, role_display_name, description, permissions, is_active)
- `user_hub_roles`: 사용자별 허브별 역할 할당 (id, user_id, hub_id, role_id, status, created_at, created_by)
- `user_entities`: 사용자별 Entity 할당 (id, user_id, entity_id, is_primary)
- `audit_logs`: 통합 감사 로그 (id, user_id, hub_id, action, resource_type, resource_id, old_value, new_value, metadata, ip_address, user_agent, created_at)

**FR-1.2** 시스템은 기존 `users` 테이블에 다음 컬럼을 추가해야 합니다:
- `avatar_url`, `google_id`, `last_login_at`, `primary_entity_id`

**FR-1.3** 시스템은 기존 `user_permissions` 테이블에 다음 컬럼을 추가해야 합니다:
- `granted_at`, `granted_by`

### FR-2: 백엔드 API
**FR-2.1** 시스템은 다음 관리자 API 엔드포인트를 제공해야 합니다:
- `GET /api/admin/accounts`: 계정 목록 조회 (페이지네이션, 검색, 필터링)
- `GET /api/admin/accounts/:id`: 특정 계정 상세 조회
- `PUT /api/admin/accounts/:id/hub-role`: 허브별 역할 변경
- `PUT /api/admin/accounts/:id/entities`: Entity 할당 변경
- `PUT /api/admin/accounts/:id/status`: 계정 활성화/비활성화
- `GET /api/admin/hub-roles/:hubSlug`: 특정 허브의 역할 목록 조회
- `POST /api/admin/hub-roles`: 새 역할 생성 (커스텀 역할)
- `GET /api/admin/audit-logs`: 감사 로그 조회 (페이지네이션, 필터링)
- `GET /api/admin/dashboard/stats`: 대시보드 통계
- `GET /api/admin/entities`: Entity 목록 조회

**FR-2.2** 시스템은 모든 관리자 API 요청에 대해 다음을 검증해야 합니다:
- 세션 인증 (requireAuth 미들웨어)
- 관리자 권한 (requireHubAdmin 미들웨어, is_admin = true)

**FR-2.3** 시스템은 JWT 토큰 생성 시 다음 정보를 포함해야 합니다:
- 기존: sub, email, username, full_name, is_admin, type, jti, iat, exp
- 추가: hub_role (허브별 역할), hub_permissions (권한 객체), entities (Entity 배열), primary_entity (주 Entity 코드)

### FR-3: 프론트엔드 UI
**FR-3.1** 시스템은 `/admin/management` 경로에 "Work Hub 관리" 페이지를 제공해야 합니다

**FR-3.2** "Work Hub 관리" 페이지는 다음 레이아웃을 따라야 합니다:
- 좌측 사이드바 (256px 고정, DocsSidebar 패턴)
- 메뉴 항목: Dashboard, 계정 관리, Audit Logs
- 우측 메인 콘텐츠 영역

**FR-3.3** Dashboard 탭은 다음 정보를 표시해야 합니다:
- 총 사용자 수, 최근 24시간 로그인 수, 최근 감사 로그 수 (통계 카드)
- 허브별 사용자 수 (프로그레스 바 차트)
- 역할별 사용자 분포 (FinHub 기준, 그리드 카드)

**FR-3.4** 계정 관리 탭은 다음 기능을 제공해야 합니다:
- 사용자 테이블 (이메일, 이름, 허브 역할, Entity, 상태, 최근 로그인, 작업)
- 검색 (이메일, 이름)
- 필터링 (허브별, 상태별)
- 페이지네이션 (20개씩)
- 사용자 편집 모달 (역할 변경, Entity 할당, 활성화/비활성화)

**FR-3.5** Audit Logs 탭은 다음 기능을 제공해야 합니다:
- 로그 테이블 (시간, 사용자, 허브, 액션, 리소스, IP 주소)
- 필터링 (허브별, 액션별, 날짜 범위)
- 페이지네이션 (50개씩)
- 액션별 배지 색상 (CREATE: 녹색, UPDATE: 파란색, DELETE: 빨간색, LOGIN: 보라색)

**FR-3.6** 허브 선택 화면의 Tools 드롭다운에서 다음 항목이 활성화되어야 합니다:
- "Accounts" 버튼 → `/admin/management?tab=accounts`로 이동
- "Audit Log" 버튼 → `/admin/management?tab=audit-logs`로 이동

### FR-4: 각 허브 수정
**FR-4.1** WBSalesHub는 다음 테이블을 제거해야 합니다:
- `Account`, `HubMembership`, `AuditLog` (Prisma 스키마에서 삭제)

**FR-4.2** WBFinHub는 다음 테이블을 제거해야 합니다:
- `Account`, `Entity`, `AuditLog` (Prisma 스키마에서 삭제)

**FR-4.3** WBFinHub는 Entity 참조를 FK에서 code로 변경해야 합니다:
- `TradingDesk.entityCode`, `Wallet.entityCode`, `Transaction.entityCode`, `Deal.entityCode` (String 타입)

**FR-4.4** 각 허브는 JWT 검증 시 다음 정보를 사용해야 합니다:
- `user.hub_role`: 허브별 역할 (ADMIN, FINANCE, TRADING, EXECUTIVE, VIEWER)
- `user.primary_entity`: 주 Entity 코드 (KR, HK, EU)
- `user.entities`: Entity 배열

**FR-4.5** 각 허브는 @wavebridge/hub-auth 패키지의 미들웨어를 사용해야 합니다:
- `createAuthMiddleware(authService)`: JWT 검증
- `requireHubRoles(...allowedRoles)`: 역할 기반 접근 제어
- `requireEntity()`: Entity 할당 확인 (FinHub용)

### FR-5: 데이터 마이그레이션
**FR-5.1** 시스템은 WBSalesHub의 Account 데이터를 WBHubManager의 users 테이블로 이전해야 합니다:
- 이메일 중복 체크, 없는 사용자만 INSERT
- HubMembership의 역할 정보를 user_hub_roles로 이전

**FR-5.2** 시스템은 WBFinHub의 Account 데이터를 WBHubManager의 users 테이블로 이전해야 합니다:
- Entity 정보를 entities 테이블로 이전
- Account의 역할 정보를 user_hub_roles로 이전
- Entity 할당 정보를 user_entities로 이전

**FR-5.3** 시스템은 각 허브의 AuditLog를 WBHubManager의 audit_logs로 이전해야 합니다 (선택적)

**FR-5.4** 시스템은 마이그레이션 검증 쿼리를 실행하여 데이터 일관성을 확인해야 합니다

### FR-6: @wavebridge/hub-auth 패키지 수정
**FR-6.1** 패키지는 JWTPayload 타입을 확장해야 합니다:
- `hub_role?: string | null`
- `hub_permissions?: any`
- `entities?: Array<{ code: string; name: string; is_primary: boolean }>`
- `primary_entity?: string | null`

**FR-6.2** 패키지는 SessionUser 타입을 확장해야 합니다:
- `hub_role`, `hub_permissions`, `entities`, `primary_entity`, `is_hub_admin`

**FR-6.3** 패키지는 역할 기반 미들웨어를 제공해야 합니다:
- `requireHubRoles(...allowedRoles)`: 지정된 역할 중 하나를 가진 사용자만 허용
- `requireEntity()`: Entity가 할당된 사용자만 허용 (FinHub용)

**FR-6.4** 패키지는 AccountAdapter 인터페이스를 제거하거나 Optional로 변경해야 합니다

### FR-7: 감사 로그
**FR-7.1** 시스템은 다음 액션에 대해 감사 로그를 기록해야 합니다:
- `LOGIN`, `LOGOUT`: 로그인/로그아웃
- `ROLE_ASSIGN`, `ROLE_CHANGE`: 역할 할당/변경
- `ENTITY_ASSIGN`: Entity 할당
- `ACTIVATE_USER`, `DEACTIVATE_USER`: 계정 활성화/비활성화
- `CREATE_ROLE`: 새 역할 생성

**FR-7.2** 감사 로그는 다음 정보를 포함해야 합니다:
- user_id, hub_id, action, resource_type, resource_id
- old_value (변경 전 값, JSON)
- new_value (변경 후 값, JSON)
- metadata (추가 메타데이터, JSON)
- ip_address, user_agent, created_at

---

## 5. Non-Goals (Out of Scope)

### NG-1: 실시간 권한 동기화
- 이미 발급된 JWT 토큰의 실시간 갱신은 지원하지 않습니다
- 권한 변경은 다음 로그인 시 적용됩니다
- 긴급한 권한 변경이 필요한 경우 토큰 블랙리스트 기능 활용 (기존 기능)

### NG-2: 세밀한 권한 제어 (Fine-grained Permissions)
- 초기 버전에서는 역할 기반 접근 제어(RBAC)만 지원합니다
- 리소스별 세밀한 권한 (예: 특정 딜만 조회) 제어는 향후 확장으로 고려합니다

### NG-3: SSO 외부 IdP 통합
- 현재는 Google OAuth만 지원합니다
- SAML, Azure AD 등 외부 IdP 통합은 향후 확장으로 고려합니다

### NG-4: 다중 Entity 동시 접근 (FinHub)
- 사용자는 하나의 주 Entity에만 접근할 수 있습니다
- 여러 Entity에 동시 접근하는 기능은 향후 확장으로 고려합니다

### NG-5: 역할 계층 구조 (Role Hierarchy)
- 역할 간 상속 관계는 지원하지 않습니다
- 각 역할은 독립적으로 관리됩니다

---

## 6. Design Considerations

### UI/UX 참고
- **사이드바 레이아웃**: `/mnt/c/GitHub/WBHubManager/frontend/components/docs/DocsSidebar.tsx` 패턴 활용
- **아이콘**: lucide-react 라이브러리 사용 (LayoutDashboard, Users, ScrollText, Edit, UserCheck, UserX 등)
- **색상 체계**: Tailwind CSS 기본 색상 팔레트 (blue, green, purple, red, gray)
- **애니메이션**: Tailwind CSS 애니메이션 (animate-spin, hover:-translate-y-2 등)

### 테이블 UI
- **페이지네이션**: 하단에 "이전/다음" 버튼 및 "페이지 X / Y" 표시
- **필터링**: 상단에 검색 및 드롭다운 필터
- **액션 버튼**: 각 행의 우측에 편집, 활성화/비활성화 아이콘 버튼

### 모달 UI
- **계정 편집 모달**: 중앙 팝업, 배경 오버레이, ESC 키로 닫기
- **폼 검증**: 역할 선택 필수, Entity 선택 시 주 Entity 필수
- **저장 버튼**: 파란색, "변경사항 저장" 텍스트

---

## 7. Technical Considerations

### 데이터베이스
- **PostgreSQL**: 기존 WBHubManager 데이터베이스 활용
- **트랜잭션**: 역할 변경, Entity 할당 등 중요한 작업은 트랜잭션으로 처리
- **인덱스**: 자주 조회되는 컬럼 (user_id, hub_id, created_at 등)에 인덱스 생성

### 백엔드
- **Express + TypeScript**: 기존 WBHubManager 서버 구조 유지
- **세션 관리**: express-session + connect-pg-simple (기존 방식)
- **JWT**: RS256 알고리즘, 공개/개인 키 쌍 사용 (기존 방식)

### 프론트엔드
- **Next.js 14 (App Router)**: 기존 WBHubManager 프론트엔드 구조 유지
- **React 18**: 함수형 컴포넌트 + Hooks
- **Tailwind CSS**: 스타일링
- **Axios**: API 통신

### 공유 패키지
- **@wavebridge/hub-auth**: JWT 검증 및 미들웨어 제공
- **Monorepo**: 패키지는 `/mnt/c/GitHub/WBHubManager/packages/hub-auth`에 위치
- **버전 관리**: 패키지 수정 시 버전 업그레이드 필요

### 마이그레이션
- **백업**: 마이그레이션 전 각 허브의 데이터베이스 백업
- **테스트**: Staging 환경에서 먼저 마이그레이션 실행 및 검증
- **롤백 계획**: 마이그레이션 실패 시 백업으로 복구

---

## 8. Success Metrics

### 기능적 지표
- **계정 통합률**: 각 허브의 Account 데이터가 100% WBHubManager로 이전됨
- **권한 관리 효율성**: 관리자가 평균 1분 내에 사용자 역할 변경 완료
- **감사 로그 커버리지**: 모든 권한 변경 및 로그인 이벤트가 100% 기록됨

### 운영적 지표
- **관리 시간 단축**: 사용자 권한 관리에 소요되는 시간 50% 감소
- **권한 오류 감소**: 잘못된 권한 할당으로 인한 지원 요청 80% 감소
- **보안 감사 대응**: 감사 요청 시 로그 조회 시간 90% 단축

### 기술적 지표
- **API 응답 시간**: 계정 목록 조회 API 응답 시간 < 500ms (20개 항목 기준)
- **JWT 토큰 크기**: 확장된 페이로드 포함 시 토큰 크기 < 2KB
- **데이터 일관성**: 마이그레이션 후 데이터 일치율 100%

---

## 9. Implementation Plan

### Phase 1: 데이터베이스 및 백엔드 (1-2주)
1. 데이터베이스 스키마 생성 (1-2일)
2. 백엔드 API 구현 (3-4일)
3. @wavebridge/hub-auth 패키지 수정 (2-3일)
4. 테스트 (2-3일)

### Phase 2: 프론트엔드 (1-2주)
5. 관리자 페이지 구현 (4-5일)
6. 모달 및 폼 구현 (2-3일)
7. API 클라이언트 구현 (1일)
8. Tools 드롭다운 수정 (1일)

### Phase 3: 각 허브 수정 (1-2주)
9. WBSalesHub 수정 (3-4일)
10. WBFinHub 수정 (3-4일)

### Phase 4: 데이터 마이그레이션 (3-5일)
11. 마이그레이션 스크립트 실행 (1-2일)
12. 각 허브에서 구 테이블 삭제 (1일)

### Phase 5: 통합 테스트 및 배포 (3-5일)
13. 통합 테스트 (2-3일)
14. 문서화 (1일)
15. 배포 (1일)

**총 예상 기간**: 4-6주

---

## 10. Critical Files

### 백엔드 (WBHubManager)
- `/mnt/c/GitHub/WBHubManager/server/routes/adminRoutes.ts` (신규) - 관리자 API 엔드포인트
- `/mnt/c/GitHub/WBHubManager/server/routes/authRoutes.ts` (수정) - JWT 페이로드 확장
- `/mnt/c/GitHub/WBHubManager/server/services/auditService.ts` (신규) - 감사 로그 서비스
- `/mnt/c/GitHub/WBHubManager/server/middleware/adminAuth.ts` (신규) - 관리자 권한 미들웨어
- `/mnt/c/GitHub/WBHubManager/server/database/init.ts` (수정) - 테이블 생성 SQL
- `/mnt/c/GitHub/WBHubManager/server/database/migrations/migrate-hub-accounts.sql` (신규) - 마이그레이션 스크립트

### 프론트엔드 (WBHubManager)
- `/mnt/c/GitHub/WBHubManager/frontend/app/admin/management/page.tsx` (신규) - 관리 페이지
- `/mnt/c/GitHub/WBHubManager/frontend/components/admin/ManagementSidebar.tsx` (신규) - 사이드바
- `/mnt/c/GitHub/WBHubManager/frontend/components/admin/tabs/DashboardTab.tsx` (신규) - 대시보드
- `/mnt/c/GitHub/WBHubManager/frontend/components/admin/tabs/AccountsTab.tsx` (신규) - 계정 관리
- `/mnt/c/GitHub/WBHubManager/frontend/components/admin/tabs/AuditLogsTab.tsx` (신규) - 감사 로그
- `/mnt/c/GitHub/WBHubManager/frontend/lib/api/admin.ts` (신규) - Admin API 클라이언트
- `/mnt/c/GitHub/WBHubManager/frontend/app/hubs/page.tsx` (수정) - Tools 드롭다운 활성화

### 공유 패키지
- `/mnt/c/GitHub/WBHubManager/packages/hub-auth/src/types/jwt.types.ts` (수정) - JWT Payload 타입 확장
- `/mnt/c/GitHub/WBHubManager/packages/hub-auth/src/types/auth.types.ts` (수정) - SessionUser 타입 확장
- `/mnt/c/GitHub/WBHubManager/packages/hub-auth/src/middleware/authenticateJWT.ts` (수정) - 역할 기반 미들웨어

### 각 허브
- `/mnt/c/GitHub/WBSalesHub/hubmanager/prisma/schema.prisma` (수정) - Account 모델 삭제
- `/mnt/c/GitHub/WBFinHub/prisma/schema.prisma` (수정) - Account, Entity 모델 삭제

---

## 11. Open Questions

### Q1: 역할 변경 시 기존 세션 처리
- **질문**: 사용자의 역할이 변경되었을 때, 이미 발급된 JWT 토큰을 즉시 무효화해야 하는가?
- **옵션**:
  - A. 토큰 블랙리스트에 추가하여 즉시 무효화 (보안 우선)
  - B. 토큰 만료(24시간)까지 기존 권한 유지 (사용자 경험 우선)
- **권장**: A (긴급한 권한 변경 대응 가능)

### Q2: Entity 없는 사용자의 FinHub 접근
- **질문**: Entity가 할당되지 않은 사용자가 FinHub에 접근하려 할 때 어떻게 처리하는가?
- **옵션**:
  - A. 403 Forbidden 에러 반환
  - B. Entity 선택 화면으로 리다이렉트
- **권장**: A (관리자가 명시적으로 Entity 할당 후 접근 허용)

### Q3: 마이그레이션 중 다운타임
- **질문**: 마이그레이션 실행 중 시스템 다운타임이 발생하는가?
- **옵션**:
  - A. 다운타임 없이 점진적 마이그레이션 (복잡도 높음)
  - B. 짧은 다운타임(1-2시간) 허용하고 일괄 마이그레이션 (단순함)
- **권장**: B (Staging에서 충분히 테스트 후 주말에 실행)

### Q4: 감사 로그 보관 기간
- **질문**: 감사 로그를 얼마나 보관할 것인가?
- **옵션**:
  - A. 90일 (기본 권장)
  - B. 1년 (규정 준수)
  - C. 영구 보관 (추후 아카이빙)
- **권장**: A (자동 정리 스크립트 포함)

### Q5: 커스텀 역할 생성 권한
- **질문**: 누가 커스텀 역할을 생성할 수 있는가?
- **옵션**:
  - A. Hub Manager Admin만 가능
  - B. 각 허브의 Admin 역할도 가능
- **권장**: A (초기에는 중앙 관리, 향후 확장 고려)

---

## 12. Test Plan

### 12.1 테스트 전략

#### 테스트 레벨
1. **단위 테스트 (Unit Test)**: 개별 함수 및 메서드 테스트
2. **통합 테스트 (Integration Test)**: API 엔드포인트 및 데이터베이스 상호작용 테스트
3. **E2E 테스트 (End-to-End Test)**: 사용자 플로우 전체 테스트
4. **마이그레이션 테스트**: 데이터 이전 및 일관성 검증

#### 테스트 환경
- **로컬 개발 환경**: Docker PostgreSQL (포트 5432)
- **Staging 환경**: 오라클 클라우드 테스트 인스턴스
- **Production 환경**: 오라클 클라우드 프로덕션 인스턴스

---

### 12.2 백엔드 API 테스트

#### TC-BE-001: 계정 목록 조회
**목적**: 관리자가 모든 사용자 계정을 조회할 수 있는지 확인

**전제조건**:
- 관리자 계정으로 로그인 (is_admin = true)
- 테스트 사용자 10명 이상 존재

**테스트 단계**:
1. GET /api/admin/accounts 호출
2. 응답 상태 코드 확인: 200
3. 응답 데이터 검증:
   - accounts 배열 존재
   - 각 계정에 hub_roles, entities 포함
   - pagination 정보 포함 (page, limit, total, total_pages)

**예상 결과**:
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": 1,
        "email": "user@example.com",
        "username": "user1",
        "hub_roles": [
          {
            "hub_slug": "wbfinhub",
            "hub_name": "WBFinHub",
            "role_name": "ADMIN",
            "role_display_name": "관리자",
            "status": "ACTIVE"
          }
        ],
        "entities": [
          {
            "entity_code": "KR",
            "entity_name": "웨이브릿지 (한국)",
            "is_primary": true
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

**실패 케이스**:
- 비로그인 사용자: 401 Unauthorized
- 일반 사용자 (is_admin = false): 403 Forbidden

---

#### TC-BE-002: 계정 검색 및 필터링
**목적**: 검색 및 필터링 기능이 정상 작동하는지 확인

**테스트 케이스**:
1. **이메일 검색**: `?search=test@example.com`
   - 해당 이메일을 포함한 사용자만 반환
2. **허브 필터**: `?hub_slug=wbfinhub`
   - FinHub에 역할이 할당된 사용자만 반환
3. **상태 필터**: `?status=active`
   - is_active = true인 사용자만 반환
4. **복합 조건**: `?search=test&hub_slug=wbfinhub&status=active`
   - 모든 조건을 만족하는 사용자만 반환

**예상 결과**: 각 필터 조건에 맞는 사용자만 반환

---

#### TC-BE-003: 역할 변경
**목적**: 사용자의 허브별 역할을 변경할 수 있는지 확인

**전제조건**:
- 테스트 사용자 존재 (user_id = 100)
- WBFinHub에 VIEWER 역할 할당됨

**테스트 단계**:
1. PUT /api/admin/accounts/100/hub-role
   ```json
   {
     "hub_slug": "wbfinhub",
     "role_name": "ADMIN",
     "status": "ACTIVE"
   }
   ```
2. 응답 상태 코드 확인: 200
3. 데이터베이스 검증:
   - user_hub_roles 테이블에서 role_id 변경 확인
   - 기존 VIEWER → 새로운 ADMIN
4. 감사 로그 확인:
   - action = 'ROLE_CHANGE'
   - old_value = { role_name: 'VIEWER' }
   - new_value = { role_name: 'ADMIN' }

**예상 결과**: 역할이 성공적으로 변경되고 감사 로그에 기록됨

**실패 케이스**:
- 존재하지 않는 hub_slug: 404 Not Found
- 존재하지 않는 role_name: 400 Bad Request

---

#### TC-BE-004: Entity 할당
**목적**: 사용자에게 Entity를 할당할 수 있는지 확인

**전제조건**:
- 테스트 사용자 존재 (user_id = 100)
- Entity 존재 (KR, HK, EU)

**테스트 단계**:
1. PUT /api/admin/accounts/100/entities
   ```json
   {
     "entity_codes": ["KR", "HK"],
     "primary_entity_code": "KR"
   }
   ```
2. 응답 상태 코드 확인: 200
3. 데이터베이스 검증:
   - user_entities 테이블에 2개 행 존재
   - KR은 is_primary = true
   - HK는 is_primary = false
4. 감사 로그 확인:
   - action = 'ENTITY_ASSIGN'
   - new_value = { entity_codes: ['KR', 'HK'], primary_entity_code: 'KR' }

**예상 결과**: Entity가 성공적으로 할당되고 주 Entity가 설정됨

**실패 케이스**:
- 존재하지 않는 entity_code: 400 Bad Request
- entity_codes 빈 배열: 400 Bad Request

---

#### TC-BE-005: 계정 활성화/비활성화
**목적**: 계정을 활성화/비활성화할 수 있는지 확인

**테스트 단계**:
1. PUT /api/admin/accounts/100/status
   ```json
   { "is_active": false }
   ```
2. 응답 상태 코드 확인: 200
3. 데이터베이스 검증:
   - users.is_active = false
4. 감사 로그 확인:
   - action = 'DEACTIVATE_USER'

**예상 결과**: 계정이 비활성화되고 다음 로그인 시도 시 실패

---

#### TC-BE-006: 감사 로그 조회
**목적**: 감사 로그를 필터링하여 조회할 수 있는지 확인

**테스트 케이스**:
1. **전체 조회**: GET /api/admin/audit-logs
2. **허브 필터**: `?hub_slug=wbfinhub`
3. **액션 필터**: `?action=ROLE_CHANGE`
4. **사용자 필터**: `?user_id=100`
5. **날짜 범위**: `?start_date=2026-01-01&end_date=2026-01-02`

**예상 결과**: 각 필터 조건에 맞는 로그만 반환

---

#### TC-BE-007: 대시보드 통계
**목적**: 대시보드 통계 API가 정확한 데이터를 반환하는지 확인

**테스트 단계**:
1. GET /api/admin/dashboard/stats
2. 응답 데이터 검증:
   - total_users: 전체 활성 사용자 수 (데이터베이스 COUNT와 일치)
   - hub_users: 각 허브별 사용자 수
   - recent_logins_24h: 최근 24시간 로그인 수
   - role_distribution: 역할별 사용자 분포

**예상 결과**: 통계가 데이터베이스 실제 값과 일치

---

#### TC-BE-008: JWT 토큰 생성 (역할 포함)
**목적**: JWT 토큰에 역할 및 Entity 정보가 포함되는지 확인

**전제조건**:
- 사용자에게 WBFinHub ADMIN 역할 할당
- 사용자에게 KR Entity 할당 (primary)

**테스트 단계**:
1. POST /api/auth/generate-hub-token
   ```json
   { "hub_slug": "wbfinhub" }
   ```
2. 응답에서 token 추출
3. JWT 디코딩 (jwt.decode)
4. 페이로드 검증:
   ```json
   {
     "sub": "100",
     "email": "user@example.com",
     "hub_role": "ADMIN",
     "entities": [
       {
         "code": "KR",
         "name": "웨이브릿지 (한국)",
         "is_primary": true
       }
     ],
     "primary_entity": "KR",
     "aud": ["wbfinhub"]
   }
   ```

**예상 결과**: JWT 페이로드에 역할 및 Entity 정보 포함

---

### 12.3 프론트엔드 UI 테스트

#### TC-FE-001: 관리 페이지 접근 제어
**목적**: 관리자만 관리 페이지에 접근할 수 있는지 확인

**테스트 케이스**:
1. **비로그인 사용자**: /admin/management 접근 시 /hubs로 리다이렉트
2. **일반 사용자**: 로그인 후 /admin/management 접근 시 /hubs로 리다이렉트
3. **관리자**: 로그인 후 /admin/management 정상 접근

**예상 결과**: 관리자만 접근 가능

---

#### TC-FE-002: 계정 목록 표시
**목적**: 계정 목록이 정상적으로 표시되는지 확인

**테스트 단계**:
1. 관리자로 로그인
2. /admin/management?tab=accounts 접근
3. 테이블 렌더링 확인:
   - 사용자 이메일, 이름 표시
   - 허브별 역할 표시 (예: "WBFinHub: 관리자")
   - Entity 표시 (예: "KR (주)")
   - 상태 배지 (활성/비활성)
   - 최근 로그인 날짜

**예상 결과**: 모든 정보가 올바르게 표시됨

---

#### TC-FE-003: 계정 검색 및 필터링
**목적**: UI에서 검색 및 필터링이 작동하는지 확인

**테스트 단계**:
1. 검색창에 "test@example.com" 입력
2. 1초 대기 (디바운스)
3. 테이블이 필터링된 결과로 업데이트됨
4. 허브 드롭다운에서 "WBFinHub" 선택
5. 테이블이 다시 필터링됨

**예상 결과**: 각 필터 조건에 따라 테이블이 실시간으로 업데이트

---

#### TC-FE-004: 계정 편집 모달
**목적**: 계정 편집 모달이 정상 작동하는지 확인

**테스트 단계**:
1. 계정 행의 편집 버튼 클릭
2. 모달 오픈 확인
3. 현재 역할 및 Entity 정보 표시 확인
4. WBFinHub 역할을 "ADMIN"에서 "FINANCE"로 변경
5. "저장" 버튼 클릭
6. API 호출 확인 (Network 탭)
7. 성공 메시지 표시
8. 테이블에 변경사항 반영 확인

**예상 결과**: 역할이 성공적으로 변경되고 UI에 즉시 반영

---

#### TC-FE-005: Entity 할당 UI
**목적**: Entity 할당 UI가 정상 작동하는지 확인

**테스트 단계**:
1. 계정 편집 모달 오픈
2. Entity 선택 UI 확인
3. "KR", "HK" 체크박스 선택
4. 주 Entity로 "KR" 라디오 버튼 선택
5. "저장" 버튼 클릭
6. API 호출 확인
7. 테이블에 Entity 표시 확인: "KR (주), HK"

**예상 결과**: Entity가 성공적으로 할당되고 주 Entity 표시

---

#### TC-FE-006: 계정 활성화/비활성화
**목적**: 활성화/비활성화 버튼이 작동하는지 확인

**테스트 단계**:
1. 활성 계정의 비활성화 버튼 (UserX 아이콘) 클릭
2. 확인 다이얼로그 표시
3. "확인" 클릭
4. API 호출 확인
5. 상태 배지가 "비활성"으로 변경
6. 버튼 아이콘이 UserCheck (활성화)로 변경

**예상 결과**: 계정 상태가 토글되고 UI에 즉시 반영

---

#### TC-FE-007: Dashboard 통계 표시
**목적**: 대시보드가 통계를 올바르게 표시하는지 확인

**테스트 단계**:
1. /admin/management?tab=dashboard 접근
2. 통계 카드 확인:
   - 전체 사용자: 50
   - 최근 24시간 로그인: 15
   - 최근 감사 로그: 120
3. 허브별 사용자 차트 확인:
   - WBSalesHub: 30명 (프로그레스 바 60%)
   - WBFinHub: 25명 (프로그레스 바 50%)
4. 역할별 분포 확인

**예상 결과**: 모든 통계가 올바르게 표시됨

---

#### TC-FE-008: Audit Logs 표시
**목적**: 감사 로그가 올바르게 표시되는지 확인

**테스트 단계**:
1. /admin/management?tab=audit-logs 접근
2. 로그 테이블 확인:
   - 시간 (내림차순 정렬)
   - 사용자 이메일
   - Hub 이름
   - 액션 (배지 색상 확인)
   - IP 주소
3. 허브 필터 선택: "WBFinHub"
4. 테이블이 필터링된 결과로 업데이트

**예상 결과**: 로그가 시간순으로 표시되고 필터링 작동

---

#### TC-FE-009: Tools 드롭다운 활성화
**목적**: 허브 선택 화면의 Tools 드롭다운이 작동하는지 확인

**테스트 단계**:
1. /hubs 페이지 접근
2. Tools 버튼 클릭
3. 드롭다운 메뉴 오픈 확인
4. "Accounts" 버튼 클릭
5. /admin/management?tab=accounts로 이동 확인
6. 뒤로가기 → /hubs
7. Tools → "Audit Log" 클릭
8. /admin/management?tab=audit-logs로 이동 확인

**예상 결과**: 각 버튼이 올바른 경로로 이동

---

### 12.4 각 허브 통합 테스트

#### TC-HUB-001: WBSalesHub 역할 기반 접근 제어
**목적**: SalesHub에서 역할 기반 접근 제어가 작동하는지 확인

**전제조건**:
- 사용자에게 WBSalesHub VIEWER 역할 할당

**테스트 단계**:
1. HubManager에서 Google OAuth 로그인
2. WBSalesHub 선택
3. JWT 토큰에 hub_role: 'VIEWER' 포함 확인
4. SalesHub 대시보드 접근 → 성공
5. 고객 생성 시도 (ADMIN 권한 필요) → 403 Forbidden
6. 고객 조회 → 성공

**예상 결과**: VIEWER 역할에 맞게 조회만 가능

---

#### TC-HUB-002: WBFinHub Entity 기반 데이터 격리
**목적**: FinHub에서 Entity 기반 데이터 격리가 작동하는지 확인

**전제조건**:
- 사용자에게 WBFinHub FINANCE 역할, KR Entity 할당

**테스트 단계**:
1. HubManager에서 Google OAuth 로그인
2. WBFinHub 선택
3. JWT 토큰에 primary_entity: 'KR' 포함 확인
4. 딜 목록 조회 API 호출
5. 응답에 entityCode = 'KR'인 딜만 포함 확인
6. entityCode = 'HK'인 딜은 포함되지 않음 확인

**예상 결과**: 자신의 Entity 데이터만 조회 가능

---

#### TC-HUB-003: 역할 변경 후 재로그인
**목적**: 역할 변경 후 다음 로그인 시 새 역할이 적용되는지 확인

**테스트 단계**:
1. 사용자 역할을 VIEWER → ADMIN으로 변경 (HubManager 관리 페이지)
2. 사용자가 로그아웃
3. 다시 Google OAuth 로그인
4. WBFinHub 선택
5. JWT 토큰에 hub_role: 'ADMIN' 포함 확인
6. 관리자 기능 (예: 사용자 관리) 접근 → 성공

**예상 결과**: 새 역할이 즉시 적용됨

---

#### TC-HUB-004: Entity 없는 사용자의 FinHub 접근
**목적**: Entity가 할당되지 않은 사용자가 FinHub 접근 시 거부되는지 확인

**전제조건**:
- 사용자에게 WBFinHub FINANCE 역할만 할당 (Entity 없음)

**테스트 단계**:
1. HubManager에서 Google OAuth 로그인
2. WBFinHub 선택
3. JWT 토큰에 primary_entity: null 확인
4. FinHub 대시보드 접근 시도
5. requireEntity() 미들웨어가 403 Forbidden 반환

**예상 결과**: Entity 없이는 FinHub 접근 불가

---

### 12.5 데이터 마이그레이션 테스트

#### TC-MIG-001: SalesHub 계정 마이그레이션
**목적**: SalesHub의 Account 데이터가 HubManager로 정확히 이전되는지 확인

**테스트 단계**:
1. 마이그레이션 전 SalesHub accounts 테이블 행 수 확인 (예: 30개)
2. 마이그레이션 스크립트 실행
3. HubManager users 테이블에 30개 이메일이 존재하는지 확인
4. user_hub_roles 테이블에 역할 할당 확인
5. 감사 로그 마이그레이션 확인 (선택적)

**검증 쿼리**:
```sql
-- SalesHub 사용자 중 HubManager에 없는 사용자 확인
SELECT sa.email
FROM saleshub_accounts sa
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = sa.email
);
-- 결과: 0 rows (모두 이전됨)
```

**예상 결과**: 모든 계정이 누락 없이 이전됨

---

#### TC-MIG-002: FinHub 계정 및 Entity 마이그레이션
**목적**: FinHub의 Account 및 Entity 데이터가 정확히 이전되는지 확인

**테스트 단계**:
1. 마이그레이션 전 FinHub accounts 테이블 행 수 확인 (예: 25개)
2. 마이그레이션 스크립트 실행
3. HubManager users 테이블에 25개 이메일 확인
4. entities 테이블에 KR, HK, EU 존재 확인
5. user_entities 테이블에 Entity 할당 확인
6. user_hub_roles 테이블에 역할 할당 확인

**검증 쿼리**:
```sql
-- Entity 할당 확인
SELECT
  u.email,
  e.code as entity_code,
  ue.is_primary
FROM users u
JOIN user_entities ue ON u.id = ue.user_id
JOIN entities e ON ue.entity_id = e.id
ORDER BY u.email;
```

**예상 결과**: 모든 계정과 Entity가 정확히 이전됨

---

#### TC-MIG-003: 역할 매핑 정확성
**목적**: 각 허브의 역할이 올바르게 매핑되는지 확인

**테스트 케이스**:
1. SalesHub ADMIN → HubManager hub_roles (wbsaleshub, ADMIN)
2. FinHub FINANCE → HubManager hub_roles (wbfinhub, FINANCE)
3. FinHub TRADING → HubManager hub_roles (wbfinhub, TRADING)

**검증 쿼리**:
```sql
-- 역할 매핑 확인
SELECT
  h.slug as hub,
  hr.role_name,
  COUNT(uhr.user_id) as user_count
FROM user_hub_roles uhr
JOIN hub_roles hr ON uhr.role_id = hr.id
JOIN hubs h ON hr.hub_id = h.id
WHERE uhr.status = 'ACTIVE'
GROUP BY h.slug, hr.role_name
ORDER BY h.slug, hr.role_name;
```

**예상 결과**: 역할 매핑이 정확함

---

#### TC-MIG-004: 데이터 일관성 검증
**목적**: 마이그레이션 후 데이터 일관성이 유지되는지 확인

**검증 항목**:
1. **고아 레코드 확인**:
   ```sql
   -- user_hub_roles에서 존재하지 않는 user_id 확인
   SELECT * FROM user_hub_roles uhr
   WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = uhr.user_id);
   -- 결과: 0 rows
   ```

2. **중복 역할 확인**:
   ```sql
   -- 동일 사용자/허브에 여러 역할 할당 확인
   SELECT user_id, hub_id, COUNT(*) as count
   FROM user_hub_roles
   GROUP BY user_id, hub_id
   HAVING COUNT(*) > 1;
   -- 결과: 0 rows
   ```

3. **주 Entity 검증**:
   ```sql
   -- 여러 주 Entity를 가진 사용자 확인
   SELECT user_id, COUNT(*) as count
   FROM user_entities
   WHERE is_primary = true
   GROUP BY user_id
   HAVING COUNT(*) > 1;
   -- 결과: 0 rows
   ```

**예상 결과**: 모든 일관성 검증 통과

---

### 12.6 성능 테스트

#### TC-PERF-001: 계정 목록 조회 성능
**목적**: 대량의 사용자 데이터 조회 시 성능 확인

**테스트 데이터**:
- 1000명의 사용자
- 각 사용자는 평균 2개 허브에 역할 할당
- 각 사용자는 평균 1.5개 Entity 할당

**테스트 단계**:
1. GET /api/admin/accounts?page=1&limit=20 호출
2. 응답 시간 측정
3. 데이터베이스 쿼리 실행 계획 확인 (EXPLAIN ANALYZE)

**성능 목표**:
- 응답 시간 < 500ms
- 데이터베이스 쿼리 실행 시간 < 200ms
- N+1 쿼리 문제 없음 (단일 JOIN 쿼리)

**예상 결과**: 성능 목표 충족

---

#### TC-PERF-002: JWT 토큰 생성 성능
**목적**: JWT 토큰 생성 시간 확인

**테스트 단계**:
1. 100번 반복: POST /api/auth/generate-hub-token
2. 평균 응답 시간 측정
3. 토큰 크기 확인

**성능 목표**:
- 평균 응답 시간 < 100ms
- 토큰 크기 < 2KB

**예상 결과**: 성능 목표 충족

---

#### TC-PERF-003: 감사 로그 조회 성능
**목적**: 대량의 감사 로그 조회 시 성능 확인

**테스트 데이터**:
- 100,000개의 감사 로그

**테스트 단계**:
1. GET /api/admin/audit-logs?page=1&limit=50 호출
2. 응답 시간 측정
3. 인덱스 활용 확인 (EXPLAIN ANALYZE)

**성능 목표**:
- 응답 시간 < 1000ms
- created_at 인덱스 활용 확인

**예상 결과**: 성능 목표 충족

---

### 12.7 보안 테스트

#### TC-SEC-001: 관리자 권한 우회 시도
**목적**: 일반 사용자가 관리자 API에 접근할 수 없는지 확인

**테스트 단계**:
1. 일반 사용자 (is_admin = false)로 로그인
2. GET /api/admin/accounts 호출
3. 응답 상태 코드 확인: 403 Forbidden

**예상 결과**: 접근 거부

---

#### TC-SEC-002: JWT 토큰 변조 시도
**목적**: 변조된 JWT 토큰이 거부되는지 확인

**테스트 단계**:
1. 정상 JWT 토큰 생성
2. 페이로드의 hub_role을 'ADMIN'으로 수동 변경
3. 변조된 토큰으로 FinHub API 호출
4. 응답 상태 코드 확인: 401 Unauthorized

**예상 결과**: 서명 검증 실패로 거부

---

#### TC-SEC-003: SQL Injection 방어
**목적**: SQL Injection 공격이 차단되는지 확인

**테스트 단계**:
1. GET /api/admin/accounts?search=' OR '1'='1 호출
2. 응답 확인: 모든 사용자가 반환되지 않음
3. 데이터베이스 쿼리가 파라미터화된 쿼리 사용 확인

**예상 결과**: SQL Injection 방어됨

---

#### TC-SEC-004: CSRF 방어
**목적**: CSRF 공격이 차단되는지 확인

**테스트 단계**:
1. 외부 사이트에서 관리자 API 호출 시도
2. CORS 정책으로 차단 확인

**예상 결과**: CORS 에러로 차단

---

### 12.8 E2E 테스트 (Playwright)

#### TC-E2E-001: 전체 관리자 플로우
**목적**: 관리자가 사용자 권한을 변경하는 전체 플로우 테스트

**테스트 시나리오**:
```typescript
test('관리자 권한 변경 플로우', async ({ page }) => {
  // 1. 관리자 로그인
  await page.goto('http://localhost:3090/hubs');
  await page.click('button:has-text("Google로 로그인")');
  // ... OAuth 플로우 ...

  // 2. Tools → Accounts 접근
  await page.click('button:has-text("Tools")');
  await page.click('text=Accounts');
  await expect(page).toHaveURL('/admin/management?tab=accounts');

  // 3. 사용자 검색
  await page.fill('input[placeholder*="검색"]', 'test@example.com');
  await page.waitForTimeout(1000); // 디바운스 대기

  // 4. 편집 버튼 클릭
  await page.click('button[title="편집"]');

  // 5. 역할 변경
  await page.selectOption('select[name="role"]', 'ADMIN');

  // 6. 저장
  await page.click('button:has-text("저장")');

  // 7. 성공 메시지 확인
  await expect(page.locator('text=성공')).toBeVisible();

  // 8. 테이블에 변경사항 반영 확인
  await expect(page.locator('td:has-text("관리자")')).toBeVisible();
});
```

**예상 결과**: 전체 플로우가 성공적으로 완료됨

---

#### TC-E2E-002: 역할 변경 후 허브 접근
**목적**: 역할 변경 후 허브에서 새 권한이 적용되는지 E2E 테스트

**테스트 시나리오**:
```typescript
test('역할 변경 후 허브 접근', async ({ page }) => {
  // 1. 관리자가 사용자 역할을 VIEWER → ADMIN으로 변경
  // ... (TC-E2E-001과 동일) ...

  // 2. 사용자로 로그아웃/재로그인
  await page.click('button:has-text("로그아웃")');
  // ... 사용자로 재로그인 ...

  // 3. WBFinHub 선택
  await page.click('text=WBFinHub');

  // 4. 관리자 기능 접근 시도 (예: 사용자 관리)
  await page.goto('http://localhost:3020/admin/users');

  // 5. 접근 성공 확인 (403 아님)
  await expect(page.locator('h1:has-text("사용자 관리")')).toBeVisible();
});
```

**예상 결과**: 새 역할로 관리자 기능 접근 가능

---

### 12.9 회귀 테스트 (Regression Test)

#### TC-REG-001: 기존 Google OAuth 플로우
**목적**: 기존 로그인 플로우가 여전히 작동하는지 확인

**테스트 단계**:
1. /hubs 페이지 접근
2. WBSalesHub 카드 클릭
3. Google OAuth 리다이렉트
4. 로그인 완료 후 SalesHub 대시보드 표시

**예상 결과**: 기존 플로우 정상 작동

---

#### TC-REG-002: 기존 Hub 간 전환
**목적**: Hub 간 전환이 여전히 작동하는지 확인

**테스트 단계**:
1. WBSalesHub 접속
2. 글로벌 네비게이션에서 WBFinHub 클릭
3. 스플래시 화면 → FinHub 대시보드

**예상 결과**: Hub 전환 정상 작동

---

### 12.10 테스트 자동화

#### 자동화 도구
- **Backend API**: Jest + Supertest
- **Frontend**: React Testing Library + Jest
- **E2E**: Playwright
- **Load Testing**: Apache JMeter 또는 k6

#### CI/CD 통합
```yaml
# GitHub Actions 예시
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run E2E tests
        run: npm run test:e2e
```

---

### 12.11 테스트 체크리스트

#### 배포 전 필수 테스트
- [ ] 모든 백엔드 API 엔드포인트 테스트 (TC-BE-001 ~ TC-BE-008)
- [ ] 프론트엔드 UI 기본 플로우 테스트 (TC-FE-001 ~ TC-FE-009)
- [ ] 각 허브 통합 테스트 (TC-HUB-001 ~ TC-HUB-004)
- [ ] 데이터 마이그레이션 검증 (TC-MIG-001 ~ TC-MIG-004)
- [ ] 성능 테스트 (TC-PERF-001 ~ TC-PERF-003)
- [ ] 보안 테스트 (TC-SEC-001 ~ TC-SEC-004)
- [ ] E2E 테스트 (TC-E2E-001 ~ TC-E2E-002)
- [ ] 회귀 테스트 (TC-REG-001 ~ TC-REG-002)

#### Staging 환경 테스트
- [ ] 실제 데이터로 마이그레이션 테스트
- [ ] 100명 이상의 사용자 데이터로 성능 테스트
- [ ] 실제 Google OAuth 플로우 테스트
- [ ] 각 허브에서 실제 데이터 접근 테스트

#### Production 배포 후 스모크 테스트
- [ ] 관리자 로그인 → 계정 목록 조회
- [ ] 사용자 역할 변경 → 저장 확인
- [ ] 감사 로그 조회 → 로그 기록 확인
- [ ] 일반 사용자 로그인 → Hub 접근 확인

---

## 13. Appendix

### A. 역할 정의 (WBSalesHub, WBFinHub 공통)

| 역할 | 영문 | 설명 | 권한 |
|------|------|------|------|
| 관리자 | ADMIN | 전체 접근 및 관리 권한 | 모든 기능 접근, 사용자 관리 |
| 재무팀 | FINANCE | 재무 데이터 조회 및 수정 권한 | 거래, 지갑, 딜 조회/수정 |
| 트레이딩팀 | TRADING | 트레이딩 데스크 관리 권한 | 트레이딩 데스크, 거래 조회/수정 (FinHub만) |
| 경영진 | EXECUTIVE | 대시보드 및 리포트 조회 권한 | 통계, 대시보드 조회만 |
| 조회자 | VIEWER | 읽기 전용 권한 | 모든 데이터 조회만 가능 |

### B. Entity 정의 (FinHub)

| Entity 코드 | 이름 | 통화 | 시간대 |
|-------------|------|------|---------|
| KR | 웨이브릿지 (한국) | KRW | Asia/Seoul |
| HK | WB Hong Kong | HKD | Asia/Hong_Kong |
| EU | WB Europe | EUR | Europe/London |

### C. 감사 로그 액션 정의

| 액션 | 설명 | resource_type | old_value | new_value |
|------|------|---------------|-----------|-----------|
| LOGIN | 로그인 | - | - | { method: 'google' } |
| LOGOUT | 로그아웃 | - | - | - |
| ROLE_ASSIGN | 역할 최초 할당 | USER_HUB_ROLE | null | { role_name, status } |
| ROLE_CHANGE | 역할 변경 | USER_HUB_ROLE | { role_name, status } | { role_name, status } |
| ENTITY_ASSIGN | Entity 할당 | USER_ENTITIES | null | { entity_codes, primary_entity_code } |
| ACTIVATE_USER | 계정 활성화 | USER | { is_active: false } | { is_active: true } |
| DEACTIVATE_USER | 계정 비활성화 | USER | { is_active: true } | { is_active: false } |
| CREATE_ROLE | 새 역할 생성 | HUB_ROLE | - | { role_name, role_display_name } |

---

**문서 버전**: 1.0
**작성일**: 2026-01-02
**작성자**: Claude Code (AI Assistant)
**PRD 파일 위치**: `/mnt/c/GitHub/WHCommon/기능 PRD/prd-unified-permission-control.md`
