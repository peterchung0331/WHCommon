# 신규 유저 승인 대기 플로우 개선

## Relevant Files

### WBHubManager
- `/home/peterchung/WBHubManager/server/database/migrations/add-user-approval-flow.sql` - 신규 마이그레이션: users 테이블 확장
- `/home/peterchung/WBHubManager/server/routes/authRoutes.ts` - Google OAuth 콜백 수정 (signup_hub_id 저장)
- `/home/peterchung/WBHubManager/server/routes/adminRoutes.ts` - Pending 유저 관리 API 추가
- `/home/peterchung/WBHubManager/frontend/app/admin/accounts/page.tsx` - 계정 관리 페이지 (Pending 섹션 추가)
- `/home/peterchung/WBHubManager/frontend/components/admin/PendingUsersTable.tsx` - Pending 유저 목록 컴포넌트 (신규)
- `/home/peterchung/WBHubManager/frontend/components/admin/ApprovalModal.tsx` - 승인 모달 컴포넌트 (신규)

### WBSalesHub
- `/home/peterchung/WBSalesHub/server/routes/authRoutes.ts` - SSO 처리 로직 수정 (WBHubManager 상태 확인)
- `/home/peterchung/WBSalesHub/server/services/authService.ts` - findOrCreateAccountFromGoogle 수정
- `/home/peterchung/WBSalesHub/frontend/app/(auth)/pending-approval/page.tsx` - 승인 대기 페이지 (허브명 표시)

### WBFinHub
- `/home/peterchung/WBFinHub/server/modules/accounts/accounts.routes.ts` - SSO 처리 로직 수정
- `/home/peterchung/WBFinHub/server/services/authService.ts` - findOrCreateAccountFromGoogle 수정
- `/home/peterchung/WBFinHub/frontend/app/(auth)/pending-approval/page.tsx` - 승인 대기 페이지 (허브명 표시)

### WBOnboardingHub
- `/home/peterchung/WBOnboardingHub/server/routes/authRoutes.ts` - SSO 처리 로직 수정
- `/home/peterchung/WBOnboardingHub/frontend/app/(auth)/pending-approval/page.tsx` - 승인 대기 페이지 (허브명 표시)

## Instructions for Completing Tasks

**IMPORTANT:** 각 작업을 완료한 후 반드시 체크박스를 업데이트하세요 (`- [ ]` → `- [x]`).

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch `feature/user-approval-flow`

- [x] 1.0 WBHubManager: 데이터베이스 마이그레이션
  - [x] 1.1 마이그레이션 파일 생성 (`add-user-approval-flow.sql`)
  - [x] 1.2 users 테이블에 status, signup_hub_id, approved_by, approved_at, rejected_at, rejection_reason 필드 추가
  - [x] 1.3 인덱스 생성 (idx_users_status, idx_users_signup_hub)
  - [x] 1.4 기존 사용자를 active 상태로 마이그레이션
  - [x] 1.5 마이그레이션 실행 및 검증

- [x] 2.0 WBHubManager: Google OAuth 플로우 수정
  - [x] 2.1 authRoutes.ts의 upsertUserFromGoogle 함수 수정
  - [x] 2.2 신규 유저 생성 시 status='pending' 설정
  - [x] 2.3 state 파라미터에서 hubSlug 추출하여 signup_hub_id 저장
  - [x] 2.4 마스터 계정(peter.chung)은 자동 active 처리

- [x] 3.0 WBHubManager: Pending 유저 관리 API 구현
  - [x] 3.1 adminRoutes.ts에 GET /api/admin/users/pending 엔드포인트 추가
  - [x] 3.2 PATCH /api/admin/users/:id/approve 엔드포인트 추가
  - [x] 3.3 PATCH /api/admin/users/:id/reject 엔드포인트 추가
  - [x] 3.4 승인 시 hub_memberships 자동 생성 로직 구현
  - [x] 3.5 audit_logs 기록 로직 추가

- [x] 4.0 WBHubManager: 프론트엔드 - Pending 유저 관리
  - [x] - [ ] 4.1 PendingUsersTable 컴포넌트 생성
  - [x] - [ ] 4.2 ApprovalModal 컴포넌트 생성 (허브별 권한 선택)
  - [x] - [ ] 4.3 /admin/accounts 페이지에 Pending 섹션 추가
  - [x] - [ ] 4.4 가입 출처 허브 표시 (signup_hub_name)
  - [x] - [ ] 4.5 승인/거부 버튼 및 API 연동

- [x] - [ ] 5.0 WBSalesHub: SSO 처리 로직 수정
  - [x] - [ ] 5.1 authRoutes.ts의 GET /auth/sso 엔드포인트 수정
  - [x] - [ ] 5.2 WBHubManager users.status 확인 로직 추가
  - [x] - [ ] 5.3 pending 상태면 /pending-approval?hub=wbsaleshub 리다이렉트
  - [x] - [ ] 5.4 active 상태면 로컬 accounts 생성 후 대시보드 리다이렉트
  - [x] - [ ] 5.5 authService.ts의 findOrCreateAccountFromGoogle 수정 (hub_memberships 기반 역할 부여)

- [x] - [ ] 6.0 WBSalesHub: 승인 대기 페이지 수정
  - [x] - [ ] 6.1 pending-approval/page.tsx 수정
  - [x] - [ ] 6.2 URL 쿼리에서 hub 파라미터 추출
  - [x] - [ ] 6.3 "WBSalesHub 접근 승인 대기 중" 메시지 표시
  - [x] - [ ] 6.4 주기적 상태 확인 로직 유지

- [x] - [ ] 7.0 WBFinHub: SSO 처리 로직 수정
  - [x] - [ ] 7.1 accounts.routes.ts의 GET /auth/sso 엔드포인트 수정
  - [x] - [ ] 7.2 WBHubManager users.status 확인 로직 추가
  - [x] - [ ] 7.3 pending 상태면 /pending-approval?hub=wbfinhub 리다이렉트
  - [x] - [ ] 7.4 active 상태면 로컬 accounts 생성 후 대시보드 리다이렉트
  - [x] - [ ] 7.5 authService.ts의 findOrCreateAccountFromGoogle 수정

- [x] - [ ] 8.0 WBFinHub: 승인 대기 페이지 수정
  - [x] - [ ] 8.1 pending-approval/page.tsx 수정
  - [x] - [ ] 8.2 URL 쿼리에서 hub 파라미터 추출
  - [x] - [ ] 8.3 "WBFinHub 접근 승인 대기 중" 메시지 표시

- [x] - [ ] 9.0 WBOnboardingHub: SSO 처리 로직 수정
  - [x] - [ ] 9.1 authRoutes.ts의 GET /auth/sso 엔드포인트 수정
  - [x] - [ ] 9.2 WBHubManager users.status 확인 로직 추가
  - [x] - [ ] 9.3 pending 상태면 /pending-approval?hub=wbonboardinghub 리다이렉트
  - [x] - [ ] 9.4 active 상태면 로컬 accounts 생성 후 대시보드 리다이렉트

- [x] - [ ] 10.0 WBOnboardingHub: 승인 대기 페이지 수정
  - [x] - [ ] 10.1 pending-approval/page.tsx 수정
  - [x] - [ ] 10.2 URL 쿼리에서 hub 파라미터 추출
  - [x] - [ ] 10.3 "WBOnboardingHub 접근 승인 대기 중" 메시지 표시

- [ ] 11.0 통합 테스트
  - [ ] 11.1 신규 유저 Google OAuth 가입 테스트 (pending 상태 확인)
  - [ ] 11.2 WBHubManager /admin/accounts에서 가입 출처 허브 표시 확인
  - [ ] 11.3 각 허브 pending-approval 페이지에서 허브명 표시 확인
  - [ ] 11.4 WBHubManager에서 승인 후 모든 허브 접근 가능 확인
  - [ ] 11.5 거부 시 access-denied 페이지 확인
  - [ ] 11.6 마스터 계정(peter.chung) 자동 승인 확인

- [ ] 12.0 빌드 및 QA 검증
  - [ ] 12.1 WBHubManager 백엔드 빌드 성공 확인
  - [ ] 12.2 WBHubManager 프론트엔드 빌드 성공 확인
  - [ ] 12.3 WBSalesHub 백엔드 빌드 성공 확인
  - [ ] 12.4 WBSalesHub 프론트엔드 빌드 성공 확인
  - [ ] 12.5 WBFinHub 백엔드 빌드 성공 확인
  - [ ] 12.6 WBFinHub 프론트엔드 빌드 성공 확인
  - [ ] 12.7 WBOnboardingHub 백엔드 빌드 성공 확인
  - [ ] 12.8 WBOnboardingHub 프론트엔드 빌드 성공 확인

- [ ] 13.0 커밋 및 브랜치 정리
  - [ ] 13.1 변경사항 커밋
  - [ ] 13.2 feature 브랜치를 main에 병합
