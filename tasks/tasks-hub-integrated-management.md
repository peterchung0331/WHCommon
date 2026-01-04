# Tasks: 허브 통합 관리 - 중앙 계정 권한 관리 시스템

## Relevant Files

### Backend Files (WBHubManager)
- `server/database/migrations/add-hub-integrated-management.sql` - 신규 테이블 생성 마이그레이션 (hub_memberships, hub_role_definitions, audit_logs)
- `server/services/hubPermissions.service.ts` - 허브 권한 관리 비즈니스 로직
- `server/services/auditLog.service.ts` - 감사 로그 생성 및 조회 로직
- `server/services/jwt.service.ts` - JWT 토큰에 hub_permissions 추가 (수정)
- `server/routes/adminIntegratedRoutes.ts` - 통합 관리 API 라우트
- `server/types/hubPermissions.ts` - 타입 정의 (HubMembership, RoleDefinition, AuditLog 등)
- `server/index.ts` - 신규 라우트 등록 (수정)

### Frontend Files (WBHubManager)
- `frontend/components/layout/GlobalNav.tsx` - Tools 메뉴 추가 (수정)
- `frontend/components/admin/IntegratedManagementSidebar.tsx` - 통합 관리 사이드바
- `frontend/app/admin/integrated/accounts/page.tsx` - 계정 권한 관리 페이지
- `frontend/components/admin/AccountList.tsx` - 계정 목록 컴포넌트
- `frontend/components/admin/HubPermissionsPanel.tsx` - 허브별 권한 관리 패널
- `frontend/app/admin/integrated/audit-logs/page.tsx` - 감사 로그 페이지
- `frontend/components/admin/AuditLogFilters.tsx` - 감사 로그 필터
- `frontend/components/admin/AuditLogTable.tsx` - 감사 로그 테이블
- `frontend/lib/api/adminIntegrated.ts` - 통합 관리 API 클라이언트
- `frontend/lib/types/hubPermissions.ts` - 프론트엔드 타입 정의

### Hub Integration Files
- `WBSalesHub/server/middleware/jwt.ts` - JWT 미들웨어 권한 검증 추가 (수정)
- `WBFinHub/server/middleware/jwt.ts` - JWT 미들웨어 권한 검증 추가 (수정)

### Script Files
- `WBHubManager/scripts/backup-hub-accounts.ts` - 기존 허브 accounts 테이블 백업 스크립트
- `WBHubManager/scripts/run-migration.ts` - 마이그레이션 실행 스크립트

### Notes

- 이 작업은 여러 저장소(WBHubManager, WBSalesHub, WBFinHub)에 걸쳐 있으므로 각각 커밋 필요
- 마이그레이션은 프로덕션 배포 전 충분한 테스트 필요
- 기존 accounts 테이블 삭제 전 반드시 백업 완료 확인

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 WBHubManager에서 feature branch 생성 (`git checkout -b feature/hub-integrated-management`)
  - [x] 0.2 WBSalesHub에서 feature branch 생성 (`git checkout -b feature/hub-permission-integration`)
  - [x] 0.3 WBFinHub에서 feature branch 생성 (`git checkout -b feature/hub-permission-integration`)

- [x] 1.0 DB 스키마 생성 및 마이그레이션 준비
  - [x] 1.1 `server/database/migrations/add-hub-integrated-management.sql` 파일 생성
  - [x] 1.2 `hub_memberships` 테이블 스키마 작성 (user_id, hub_id, role, status, granted_by, timestamps)
  - [x] 1.3 `hub_role_definitions` 테이블 스키마 작성 (hub_id, role_name, role_display_name, role_description, permissions JSONB, is_default)
  - [x] 1.4 `audit_logs` 테이블 스키마 작성 (user_id, hub_id, action, entity_type, entity_id, old_value JSONB, new_value JSONB, ip_address, user_agent, created_at)
  - [x] 1.5 각 테이블에 적절한 인덱스 추가 (성능 최적화)
  - [x] 1.6 초기 데이터 INSERT 구문 작성 (WBFinHub, WBSalesHub 역할 정의)
  - [x] 1.7 마이그레이션 실행 스크립트 작성 (`scripts/run-migration.ts`)
  - [x] 1.8 마이그레이션 실행 및 테이블 생성 확인

- [x] 2.0 백엔드 타입 정의 및 서비스 구현
  - [x] 2.1 `server/types/hubPermissions.ts` 파일 생성 및 인터페이스 정의
    - [x] 2.1.1 HubMembership 인터페이스
    - [x] 2.1.2 RoleDefinition 인터페이스
    - [x] 2.1.3 AuditLog 인터페이스
    - [x] 2.1.4 AuditAction enum (LOGIN, LOGOUT, PERMISSION_GRANTED, PERMISSION_REVOKED, ROLE_CHANGED, HUB_ACCESSED)
  - [x] 2.2 `server/services/hubPermissions.service.ts` 구현
    - [x] 2.2.1 getUserHubPermissions(userId) 메서드 - 사용자의 모든 허브 권한 조회
    - [x] 2.2.2 grantHubPermission(userId, hubId, role, grantedBy) 메서드 - 권한 부여/변경
    - [x] 2.2.3 revokeHubPermission(userId, hubId) 메서드 - 권한 취소
    - [x] 2.2.4 verifyHubPermission(userId, hubSlug) 메서드 - 특정 허브 권한 확인
    - [x] 2.2.5 getHubRoleDefinitions(hubId) 메서드 - 허브별 역할 정의 조회
  - [x] 2.3 `server/services/auditLog.service.ts` 구현
    - [x] 2.3.1 createLog() 메서드 - 감사 로그 생성
    - [x] 2.3.2 getLogs(filters) 메서드 - 감사 로그 조회 (필터링, 페이지네이션)
    - [x] 2.3.3 getHubLogs(hubSlug, filters) 메서드 - 특정 허브 감사 로그

- [ ] 3.0 JWT 서비스 수정 (권한 정보 포함)
  - [ ] 3.1 `server/services/jwt.service.ts` 파일 읽기
  - [ ] 3.2 AccessTokenPayload 인터페이스에 `hub_permissions` 필드 추가
  - [ ] 3.3 generateAccessToken() 함수 수정
    - [ ] 3.3.1 hub_memberships 테이블 조회 쿼리 추가
    - [ ] 3.3.2 hubPermissions 객체 생성 (허브 슬러그 → 역할/상태 매핑)
    - [ ] 3.3.3 JWT payload에 hub_permissions 추가
  - [ ] 3.4 JWT 토큰 생성 테스트 (토큰 디코딩하여 hub_permissions 확인)

- [ ] 4.0 관리자 API 라우트 구현
  - [ ] 4.1 `server/routes/adminIntegratedRoutes.ts` 파일 생성
  - [ ] 4.2 GET /api/admin/accounts 구현 - 모든 사용자 목록 조회
  - [ ] 4.3 GET /api/admin/accounts/:userId/hub-permissions 구현 - 사용자의 허브별 권한 조회
  - [ ] 4.4 POST /api/admin/accounts/:userId/hub-permissions 구현 - 권한 부여/변경
    - [ ] 4.4.1 요청 바디 검증 (hubId, role 필수)
    - [ ] 4.4.2 hubPermissions.service.grantHubPermission() 호출
    - [ ] 4.4.3 감사 로그 생성 (PERMISSION_GRANTED 또는 ROLE_CHANGED)
  - [ ] 4.5 DELETE /api/admin/accounts/:userId/hub-permissions/:hubId 구현 - 권한 취소
    - [ ] 4.5.1 hubPermissions.service.revokeHubPermission() 호출
    - [ ] 4.5.2 감사 로그 생성 (PERMISSION_REVOKED)
  - [ ] 4.6 GET /api/auth/verify-hub-permission 구현 - 허브별 권한 검증 (각 허브에서 호출)
    - [ ] 4.6.1 쿼리 파라미터 검증 (hub_slug, user_id)
    - [ ] 4.6.2 hubPermissions.service.verifyHubPermission() 호출
    - [ ] 4.6.3 hasAccess, role, status 응답
  - [ ] 4.7 GET /api/admin/hubs/:hubId/role-definitions 구현 - 허브별 역할 정의 조회
  - [ ] 4.8 GET /api/admin/audit-logs 구현 - 감사 로그 조회
    - [ ] 4.8.1 쿼리 파라미터 파싱 (userId, hubId, action, dateFrom, dateTo, page, limit)
    - [ ] 4.8.2 auditLog.service.getLogs() 호출
    - [ ] 4.8.3 페이지네이션 응답
  - [ ] 4.9 GET /api/admin/audit-logs/hub/:hubSlug 구현 - 특정 허브 감사 로그
  - [ ] 4.10 `server/index.ts`에 adminIntegratedRoutes 등록

- [ ] 5.0 프론트엔드 타입 및 API 클라이언트 구현
  - [ ] 5.1 `frontend/lib/types/hubPermissions.ts` 파일 생성
    - [ ] 5.1.1 HubMembership 타입 정의
    - [ ] 5.1.2 RoleDefinition 타입 정의
    - [ ] 5.1.3 AuditLog 타입 정의
  - [ ] 5.2 `frontend/lib/api/adminIntegrated.ts` 파일 생성
    - [ ] 5.2.1 getAllAccounts() 함수
    - [ ] 5.2.2 getUserHubPermissions(userId) 함수
    - [ ] 5.2.3 grantHubPermission(userId, hubId, role) 함수
    - [ ] 5.2.4 revokeHubPermission(userId, hubId) 함수
    - [ ] 5.2.5 getHubRoleDefinitions(hubId) 함수
    - [ ] 5.2.6 getAuditLogs(filters) 함수
    - [ ] 5.2.7 getHubAuditLogs(hubSlug, filters) 함수

- [ ] 6.0 GlobalNav에 Tools 메뉴 추가
  - [ ] 6.1 `frontend/components/layout/GlobalNav.tsx` 파일 읽기
  - [ ] 6.2 Tools 드롭다운 상태 추가 (isToolsOpen)
  - [ ] 6.3 Settings 아이콘 추가 (lucide-react)
  - [ ] 6.4 Tools 버튼 및 드롭다운 메뉴 구현
    - [ ] 6.4.1 Accounts 링크 (/admin/integrated/accounts)
    - [ ] 6.4.2 Audit Logs 링크 (/admin/integrated/audit-logs)
  - [ ] 6.5 관리자 권한(is_admin) 체크하여 Tools 메뉴 표시

- [ ] 7.0 통합 관리 사이드바 구현
  - [ ] 7.1 `frontend/components/admin/IntegratedManagementSidebar.tsx` 파일 생성
  - [ ] 7.2 네비게이션 아이템 정의 (Accounts, Audit Logs)
  - [ ] 7.3 현재 경로 하이라이트 (usePathname)
  - [ ] 7.4 각 아이템에 아이콘 추가 (Users, FileText)
  - [ ] 7.5 사이드바 스타일링 (w-60, border-r, 기존 허브 스타일과 일관성)

- [ ] 8.0 계정 권한 관리 페이지 구현
  - [ ] 8.1 `frontend/app/admin/integrated/accounts/page.tsx` 파일 생성
  - [ ] 8.2 페이지 레이아웃 구성 (사이드바 + 메인 컨텐츠)
  - [ ] 8.3 상태 관리 (accounts, selectedAccount, selectedHub, hubs)
  - [ ] 8.4 useEffect로 계정 목록 및 허브 목록 로드
  - [ ] 8.5 AccountList 컴포넌트 렌더링
  - [ ] 8.6 HubPermissionsPanel 컴포넌트 렌더링 (selectedAccount가 있을 때만)
  - [ ] 8.7 로딩 상태 및 에러 처리

- [ ] 9.0 AccountList 컴포넌트 구현
  - [ ] 9.1 `frontend/components/admin/AccountList.tsx` 파일 생성
  - [ ] 9.2 Props 타입 정의 (accounts, selectedAccount, onSelect)
  - [ ] 9.3 계정 목록 테이블 구현
    - [ ] 9.3.1 테이블 헤더 (이메일, 이름, 관리자 여부)
    - [ ] 9.3.2 테이블 바디 (각 계정 행, 클릭 시 onSelect 호출)
    - [ ] 9.3.3 선택된 계정 하이라이트
  - [ ] 9.4 검색 기능 추가 (이메일/이름 필터)

- [ ] 10.0 HubPermissionsPanel 컴포넌트 구현
  - [ ] 10.1 `frontend/components/admin/HubPermissionsPanel.tsx` 파일 생성
  - [ ] 10.2 Props 타입 정의 (account, selectedHub, onHubSelect, onUpdate)
  - [ ] 10.3 상태 관리 (memberships, availableRoles, currentRole, currentStatus, isLoading)
  - [ ] 10.4 선택된 계정의 허브별 권한 로드
  - [ ] 10.5 허브 선택 탭 구현
    - [ ] 10.5.1 각 허브 버튼 (핀허브, 세일즈허브 등)
    - [ ] 10.5.2 선택된 허브 하이라이트
  - [ ] 10.6 선택된 허브의 역할 정의 로드
  - [ ] 10.7 역할 선택 드롭다운 구현
    - [ ] 10.7.1 역할 표시명과 설명 표시
    - [ ] 10.7.2 현재 역할 선택 상태 표시
  - [ ] 10.8 상태 선택 드롭다운 구현 (ACTIVE, INACTIVE, SUSPENDED)
  - [ ] 10.9 저장 버튼 구현
    - [ ] 10.9.1 grantHubPermission API 호출
    - [ ] 10.9.2 성공 토스트 메시지
    - [ ] 10.9.3 에러 처리
  - [ ] 10.10 권한 취소 버튼 구현
    - [ ] 10.10.1 확인 다이얼로그
    - [ ] 10.10.2 revokeHubPermission API 호출
    - [ ] 10.10.3 성공 토스트 메시지

- [ ] 11.0 감사 로그 페이지 구현
  - [ ] 11.1 `frontend/app/admin/integrated/audit-logs/page.tsx` 파일 생성
  - [ ] 11.2 페이지 레이아웃 (사이드바 + 메인 컨텐츠)
  - [ ] 11.3 상태 관리 (logs, filters, pagination, isLoading)
  - [ ] 11.4 AuditLogFilters 컴포넌트 렌더링
  - [ ] 11.5 AuditLogTable 컴포넌트 렌더링
  - [ ] 11.6 페이지네이션 구현
  - [ ] 11.7 필터 변경 시 로그 재조회

- [ ] 12.0 AuditLogFilters 컴포넌트 구현
  - [ ] 12.1 `frontend/components/admin/AuditLogFilters.tsx` 파일 생성
  - [ ] 12.2 Props 타입 정의 (filters, onFiltersChange)
  - [ ] 12.3 허브 선택 드롭다운
  - [ ] 12.4 액션 선택 드롭다운 (LOGIN, LOGOUT, PERMISSION_GRANTED 등)
  - [ ] 12.5 날짜 범위 선택 (dateFrom, dateTo)
  - [ ] 12.6 사용자 검색 입력
  - [ ] 12.7 필터 리셋 버튼

- [ ] 13.0 AuditLogTable 컴포넌트 구현
  - [ ] 13.1 `frontend/components/admin/AuditLogTable.tsx` 파일 생성
  - [ ] 13.2 Props 타입 정의 (logs, isLoading)
  - [ ] 13.3 테이블 헤더 (시간, 사용자, 허브, 액션, 상세, IP 주소)
  - [ ] 13.4 테이블 바디
    - [ ] 13.4.1 각 로그 행 렌더링
    - [ ] 13.4.2 날짜/시간 포맷팅
    - [ ] 13.4.3 액션 타입별 색상 구분
    - [ ] 13.4.4 상세 정보 표시 (old_value, new_value)
  - [ ] 13.5 로딩 스피너
  - [ ] 13.6 빈 상태 메시지

- [ ] 14.0 WBSalesHub JWT 미들웨어 수정
  - [ ] 14.1 `WBSalesHub/server/middleware/jwt.ts` 파일 읽기
  - [ ] 14.2 환경 변수 추가 (HUB_SLUG='wbsaleshub')
  - [ ] 14.3 authenticateJWT 함수 수정
    - [ ] 14.3.1 JWT 디코딩 후 hub_permissions 필드 확인
    - [ ] 14.3.2 현재 허브 슬러그에 해당하는 권한 추출
    - [ ] 14.3.3 권한 없으면 HubManager API 호출 (/api/auth/verify-hub-permission)
    - [ ] 14.3.4 권한 캐싱 로직 추가 (5분 TTL)
    - [ ] 14.3.5 req.user에 hubRole, hubStatus 추가
    - [ ] 14.3.6 권한 없으면 403 Forbidden 응답
  - [ ] 14.4 감사 로그 생성 함수 구현 (createAuditLog)
    - [ ] 14.4.1 HubManager API POST /api/internal/audit-logs 호출
    - [ ] 14.4.2 HUB_ACCESSED 액션 기록
  - [ ] 14.5 authenticateJWT에서 감사 로그 생성 호출 (비동기)

- [ ] 15.0 WBFinHub JWT 미들웨어 수정 (WBSalesHub와 유사)
  - [ ] 15.1 `WBFinHub/server/middleware/jwt.ts` 파일 읽기
  - [ ] 15.2 환경 변수 추가 (HUB_SLUG='wbfinhub')
  - [ ] 15.3 authenticateJWT 함수 수정 (14.3과 동일한 로직)
  - [ ] 15.4 감사 로그 생성 함수 구현
  - [ ] 15.5 authenticateJWT에서 감사 로그 생성 호출

- [ ] 16.0 백업 및 마이그레이션 스크립트 작성
  - [ ] 16.1 `WBHubManager/scripts/backup-hub-accounts.ts` 파일 생성
  - [ ] 16.2 WBFinHub accounts 테이블 백업 로직
    - [ ] 16.2.1 DB 연결 (WBFinHub DB)
    - [ ] 16.2.2 SELECT * FROM accounts 쿼리
    - [ ] 16.2.3 JSON 파일로 저장 (/home/peterchung/backups/wbfinhub-accounts-backup.json)
  - [ ] 16.3 WBSalesHub accounts 테이블 백업 로직 (동일)
  - [ ] 16.4 백업 스크립트 실행 및 파일 확인
  - [ ] 16.5 백업 완료 로그 출력

- [ ] 17.0 통합 테스트 (Phase 1: API 테스트)
  - [ ] 17.1 HubManager 서버 재시작
  - [ ] 17.2 관리자 계정으로 로그인하여 JWT 토큰 획득
  - [ ] 17.3 POST /api/admin/accounts/:userId/hub-permissions 테스트
    - [ ] 17.3.1 핀허브 ADMIN 역할 부여
    - [ ] 17.3.2 세일즈허브 USER 역할 부여
    - [ ] 17.3.3 응답 확인
  - [ ] 17.4 GET /api/admin/accounts/:userId/hub-permissions 테스트
    - [ ] 17.4.1 부여된 권한 조회
    - [ ] 17.4.2 memberships 배열 확인
  - [ ] 17.5 GET /api/auth/verify-hub-permission 테스트
    - [ ] 17.5.1 핀허브 권한 검증
    - [ ] 17.5.2 hasAccess=true, role='ADMIN' 확인
  - [ ] 17.6 DELETE /api/admin/accounts/:userId/hub-permissions/:hubId 테스트
    - [ ] 17.6.1 권한 취소
    - [ ] 17.6.2 다시 조회하여 제거 확인
  - [ ] 17.7 GET /api/admin/audit-logs 테스트
    - [ ] 17.7.1 PERMISSION_GRANTED 액션 필터
    - [ ] 17.7.2 로그 데이터 확인

- [ ] 18.0 통합 테스트 (Phase 2: 프론트엔드 테스트)
  - [ ] 18.1 HubManager 프론트엔드 서버 시작
  - [ ] 18.2 브라우저에서 허브매니저 접속 및 로그인
  - [ ] 18.3 GlobalNav에 Tools 메뉴 표시 확인
  - [ ] 18.4 Tools → Accounts 클릭하여 페이지 이동
  - [ ] 18.5 계정 목록 로드 확인
  - [ ] 18.6 계정 선택 후 허브별 권한 패널 표시 확인
  - [ ] 18.7 핀허브 탭 선택 → 역할 드롭다운에 ADMIN, FINANCE 등 표시 확인
  - [ ] 18.8 역할 변경 후 저장 → 성공 토스트 메시지 확인
  - [ ] 18.9 Tools → Audit Logs 클릭하여 페이지 이동
  - [ ] 18.10 감사 로그 목록 로드 확인
  - [ ] 18.11 필터링 (액션별, 허브별) 동작 확인

- [ ] 19.0 통합 테스트 (Phase 3: 허브 통합 테스트)
  - [ ] 19.1 WBSalesHub 서버 재시작
  - [ ] 19.2 권한이 부여된 계정으로 세일즈허브 접근
    - [ ] 19.2.1 허브매니저에서 세일즈허브 버튼 클릭
    - [ ] 19.2.2 자동 로그인 확인
    - [ ] 19.2.3 req.user.hubRole이 올바르게 설정되었는지 확인 (서버 로그)
  - [ ] 19.3 권한이 없는 계정으로 세일즈허브 접근 시도
    - [ ] 19.3.1 403 Forbidden 응답 확인
    - [ ] 19.3.2 명확한 에러 메시지 표시 확인
  - [ ] 19.4 WBFinHub 동일하게 테스트
  - [ ] 19.5 허브매니저 Audit Logs에서 HUB_ACCESSED 로그 확인

- [ ] 20.0 JWT 토큰 검증
  - [ ] 20.1 허브매니저에서 로그인하여 새 토큰 발급
  - [ ] 20.2 브라우저 개발자 도구에서 accessToken 복사
  - [ ] 20.3 jwt.io에서 토큰 디코딩
  - [ ] 20.4 payload에 hub_permissions 필드 존재 확인
  - [ ] 20.5 hub_permissions 구조 확인 (WBFINHUB: {role, status}, WBSALESHUB: {role, status})

- [ ] 21.0 성능 및 캐싱 테스트
  - [ ] 21.1 각 허브에서 동일한 권한 검증 API 10회 연속 호출
  - [ ] 21.2 첫 번째 호출은 HubManager API 호출 확인 (서버 로그)
  - [ ] 21.3 이후 호출은 캐시 히트 확인 (API 호출 없음)
  - [ ] 21.4 5분 대기 후 다시 호출하여 캐시 만료 확인

- [ ] 22.0 QA 테스트 (빌드 및 타입 검사)
  - [ ] 22.1 WBHubManager 프론트엔드 빌드 (`cd frontend && npm run build`)
  - [ ] 22.2 WBHubManager 백엔드 빌드 (`npm run build`)
  - [ ] 22.3 WBSalesHub 백엔드 빌드
  - [ ] 22.4 WBFinHub 백엔드 빌드
  - [ ] 22.5 TypeScript 타입 에러 확인 및 수정
  - [ ] 22.6 ESLint 경고 확인 및 수정

- [ ] 23.0 커밋 및 정리
  - [ ] 23.1 WBHubManager 변경사항 커밋
    - [ ] 23.1.1 git add .
    - [ ] 23.1.2 git commit -m "feat: 허브 통합 관리 시스템 구현 - 중앙 계정 권한 관리"
  - [ ] 23.2 WBSalesHub 변경사항 커밋
    - [ ] 23.2.1 git add .
    - [ ] 23.2.2 git commit -m "feat: 허브매니저 권한 시스템 통합"
  - [ ] 23.3 WBFinHub 변경사항 커밋 (동일)
  - [ ] 23.4 각 저장소에서 git push origin feature/...

- [ ] 24.0 기존 accounts 테이블 제거 (선택적 - 백업 확인 후)
  - [ ] 24.1 백업 파일 존재 확인 (/home/peterchung/backups/)
  - [ ] 24.2 백업 파일 내용 검증
  - [ ] 24.3 WBFinHub DB 접속
  - [ ] 24.4 DROP TABLE IF EXISTS accounts CASCADE 실행
  - [ ] 24.5 WBSalesHub DB 접속
  - [ ] 24.6 DROP TABLE IF EXISTS accounts CASCADE 실행
  - [ ] 24.7 테이블 삭제 확인

- [ ] 25.0 문서화 및 최종 확인
  - [ ] 25.1 README 업데이트 (새 기능 설명)
  - [ ] 25.2 API 문서 작성 (adminIntegratedRoutes 엔드포인트)
  - [ ] 25.3 환경 변수 설정 가이드 (HUB_SLUG 등)
  - [ ] 25.4 배포 체크리스트 작성
  - [ ] 25.5 관리자 사용 가이드 작성 (Accounts, Audit Logs 사용법)
