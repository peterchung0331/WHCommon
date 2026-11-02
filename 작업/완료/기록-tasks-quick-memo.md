# Tasks: 세일즈허브 빠른 메모 기능

## Relevant Files

### Phase 1: HubManager 그룹 관리
- `/home/peterchung/WBHubManager/server/database/migrations/add-group-management.sql` - 그룹 테이블 생성 마이그레이션 (신규)
- `/home/peterchung/WBHubManager/server/routes/groups.ts` - 그룹 관리 API 엔드포인트 (신규)
- `/home/peterchung/WBHubManager/server/services/groupService.ts` - 그룹 비즈니스 로직 (신규)
- `/home/peterchung/WBHubManager/server/middleware/auth.ts:45-120` - JWT 토큰에 그룹 정보 추가
- `/home/peterchung/WBHubManager/frontend/app/(dashboard)/admin/groups/page.tsx` - 그룹 관리 페이지 (신규)

### Phase 2: SalesHub 빠른 메모
- `/home/peterchung/WBSalesHub/server/database/migrations/013_add_quick_memo_support.sql` - 빠른 메모 지원 마이그레이션 (신규)
- `/home/peterchung/WBSalesHub/server/routes/quickMemoRoutes.ts` - 빠른 메모 API 엔드포인트 (신규)
- `/home/peterchung/WBSalesHub/server/services/claudeService.ts:320-490` - extractCustomerName() 함수 추가
- `/home/peterchung/WBSalesHub/server/services/meetingNoteService.ts:1-250` - 그룹 기반 권한 체크 추가
- `/home/peterchung/WBSalesHub/frontend/components/quick-memo/QuickMemoFAB.tsx` - FAB 컴포넌트 (신규)
- `/home/peterchung/WBSalesHub/frontend/components/quick-memo/QuickMemoModal.tsx` - 메모 입력 모달 (신규)
- `/home/peterchung/WBSalesHub/frontend/components/quick-memo/CustomerMatchModal.tsx` - 고객 매칭 모달 (신규)
- `/home/peterchung/WBSalesHub/frontend/components/quick-memo/VisibilitySelector.tsx` - 공개 범위 선택 컴포넌트 (신규)
- `/home/peterchung/WBSalesHub/frontend/app/(dashboard)/layout.tsx:1-100` - FAB 통합

### Notes
- Phase 1 (HubManager 그룹 관리)이 완료되어야 Phase 2 (SalesHub 빠른 메모)를 시작할 수 있습니다.
- Claude API 일일 사용량 제한 (50회/사용자)을 환경변수로 관리합니다.
- 단위 테스트는 `npx jest` 또는 `npm test`로 실행합니다.
- E2E 테스트는 HWTestAgent에서 Playwright로 실행합니다.

## Instructions for Completing Tasks

**IMPORTANT:** 각 작업을 완료하면 `- [ ]`를 `- [x]`로 변경하여 진행 상황을 추적하세요.

예시:
- `- [ ] 1.1 파일 읽기` → `- [x] 1.1 파일 읽기` (완료 후)

서브 작업을 완료할 때마다 파일을 업데이트하세요.

---

## Tasks

### Phase 1: HubManager 그룹 관리 기능 (선행 작업)

- [ ] 0.0 Create feature branch
  - [ ] 0.1 WBHubManager 저장소로 이동: `cd /home/peterchung/WBHubManager`
  - [ ] 0.2 최신 main 브랜치로 업데이트: `git checkout main && git pull`
  - [ ] 0.3 feature 브랜치 생성: `git checkout -b feature/group-management`

- [ ] 1.0 데이터베이스 마이그레이션 (그룹 테이블)
  - [ ] 1.1 마이그레이션 파일 생성: `server/database/migrations/add-group-management.sql`
  - [ ] 1.2 groups 테이블 생성 쿼리 작성 (id, name, description, hub_slug, created_by, created_at, is_active)
  - [ ] 1.3 group_members 테이블 생성 쿼리 작성 (id, group_id, user_id, role, joined_at, UNIQUE 제약)
  - [ ] 1.4 인덱스 생성: idx_groups_hub_slug, idx_group_members_user_id, idx_group_members_group_id
  - [ ] 1.5 마이그레이션 실행: `psql -U postgres -d hubmanager -f server/database/migrations/add-group-management.sql`
  - [ ] 1.6 테이블 생성 확인: `\dt groups* (psql)`

- [ ] 2.0 Backend: 그룹 서비스 레이어 구현
  - [ ] 2.1 `server/services/groupService.ts` 파일 생성
  - [ ] 2.2 getAllGroups(filter) 함수 구현 (hub_slug 필터링, is_active)
  - [ ] 2.3 getGroupById(id) 함수 구현 (멤버 목록 포함)
  - [ ] 2.4 getMyGroups(userId) 함수 구현 (사용자가 속한 그룹 목록)
  - [ ] 2.5 createGroup(data) 함수 구현 (name, description, hub_slug, created_by)
  - [ ] 2.6 updateGroup(id, data) 함수 구현
  - [ ] 2.7 deleteGroup(id) 함수 구현 (소프트 삭제: is_active=false)
  - [ ] 2.8 addGroupMember(groupId, userId, role) 함수 구현
  - [ ] 2.9 removeGroupMember(groupId, userId) 함수 구현
  - [ ] 2.10 getGroupMembers(groupId) 함수 구현

- [ ] 3.0 Backend: 그룹 API 엔드포인트 구현
  - [ ] 3.1 `server/routes/groups.ts` 파일 생성
  - [ ] 3.2 GET /api/groups - 그룹 목록 조회 (관리자 전용: isAdmin 미들웨어)
  - [ ] 3.3 GET /api/groups/my - 내 그룹 목록 조회
  - [ ] 3.4 GET /api/groups/:id - 그룹 상세 조회
  - [ ] 3.5 POST /api/groups - 그룹 생성 (관리자 전용)
  - [ ] 3.6 PUT /api/groups/:id - 그룹 수정 (관리자 전용)
  - [ ] 3.7 DELETE /api/groups/:id - 그룹 삭제 (관리자 전용)
  - [ ] 3.8 POST /api/groups/:id/members - 멤버 추가 (관리자 전용)
  - [ ] 3.9 DELETE /api/groups/:id/members/:userId - 멤버 제거 (관리자 전용)
  - [ ] 3.10 `server/index.ts`에 그룹 라우트 등록: `app.use('/api', groupRoutes)`

- [ ] 4.0 Backend: JWT 토큰에 그룹 정보 추가
  - [ ] 4.1 `server/middleware/auth.ts` 파일 읽기 (JWT 생성 로직 확인)
  - [ ] 4.2 로그인 시 사용자의 그룹 정보 조회 (groupService.getMyGroups)
  - [ ] 4.3 JWT 페이로드에 groups 필드 추가: `hub_permissions.saleshub.groups = ['group-id1', 'group-id2']`
  - [ ] 4.4 JWT 크기 확인 (4KB 제한 주의)

- [ ] 5.0 Frontend: 그룹 관리 페이지 UI
  - [ ] 5.1 `frontend/app/(dashboard)/admin/groups/page.tsx` 파일 생성
  - [ ] 5.2 그룹 목록 조회 API 연동 (React Query)
  - [ ] 5.3 그룹 생성 폼 컴포넌트 (GroupCreateModal.tsx)
  - [ ] 5.4 그룹 수정 폼 컴포넌트 (GroupEditModal.tsx)
  - [ ] 5.5 그룹 멤버 관리 컴포넌트 (GroupMemberList.tsx)
  - [ ] 5.6 사이드바에 "그룹 관리" 메뉴 추가 (components/layout/Sidebar.tsx, admin 전용)
  - [ ] 5.7 lucide-react 아이콘 사용 (Users 또는 UsersRound 아이콘)

- [ ] 6.0 Phase 1 QA 테스트 및 커밋
  - [ ] 6.1 백엔드 빌드 검증: `cd server && npm run build`
  - [ ] 6.2 프론트엔드 빌드 검증: `cd frontend && npm run build`
  - [ ] 6.3 TypeScript 타입 검사: `npx tsc --noEmit`
  - [ ] 6.4 그룹 생성 기능 수동 테스트 (관리자 계정으로 테스트)
  - [ ] 6.5 그룹 멤버 추가/제거 기능 테스트
  - [ ] 6.6 JWT 토큰에 그룹 정보 포함 여부 확인 (브라우저 개발자 도구)
  - [ ] 6.7 변경 사항 커밋: `git add . && git commit -m "feat(hubmanager): 그룹 관리 기능 추가"`
  - [ ] 6.8 브랜치 푸시: `git push origin feature/group-management`

---

### Phase 2: SalesHub 빠른 메모 기능 (메인 작업)

- [ ] 7.0 Create feature branch (SalesHub)
  - [ ] 7.1 WBSalesHub 저장소로 이동: `cd /home/peterchung/WBSalesHub`
  - [ ] 7.2 최신 main 브랜치로 업데이트: `git checkout main && git pull`
  - [ ] 7.3 feature 브랜치 생성: `git checkout -b feature/quick-memo`

- [ ] 8.0 데이터베이스 마이그레이션 (빠른 메모)
  - [ ] 8.1 마이그레이션 파일 생성: `server/database/migrations/013_add_quick_memo_support.sql`
  - [ ] 8.2 meeting_note_source_type enum에 'QUICK_MEMO' 추가
  - [ ] 8.3 meeting_notes 테이블에 visibility_group_id 컬럼 추가 (TEXT, nullable)
  - [ ] 8.4 인덱스 생성: idx_meeting_notes_visibility_group
  - [ ] 8.5 컬럼 주석 추가: COMMENT ON COLUMN
  - [ ] 8.6 마이그레이션 실행: `psql -U postgres -d saleshub -f server/database/migrations/013_add_quick_memo_support.sql`
  - [ ] 8.7 테이블 변경 확인: `\d meeting_notes (psql)`

- [ ] 9.0 Backend: Claude 서비스 확장 (고객명 추출)
  - [ ] 9.1 `server/services/claudeService.ts` 파일 읽기
  - [ ] 9.2 extractCustomerName(content: string) 함수 추가
  - [ ] 9.3 Claude API 프롬프트 작성 (메모 내용에서 고객명 추출, JSON 응답)
  - [ ] 9.4 claude-3-5-haiku-20241022 모델 사용 (빠르고 저렴)
  - [ ] 9.5 일일 사용량 체크 로직 적용 (checkAndUpdateUsage)
  - [ ] 9.6 에러 핸들링 (API 실패 시 null 반환)

- [ ] 10.0 Backend: 빠른 메모 서비스 레이어
  - [ ] 10.1 `server/routes/quickMemoRoutes.ts` 파일 생성
  - [ ] 10.2 POST /api/quick-memos/suggest-customer 엔드포인트 구현
    - 요청: { content: string }
    - Claude API로 고객명 추출 (extractCustomerName)
    - 고객 DB 매칭 (suggestCustomer 재사용)
    - 유사 고객 목록 반환 (customerService.search)
  - [ ] 10.3 POST /api/quick-memos 엔드포인트 구현
    - 요청: { content, customer_id, visibility_group_id, is_private }
    - meeting_notes 테이블에 저장 (source='QUICK_MEMO')
    - author_id = user.id
    - client_name = customer.company_name (customer_id가 있으면)
  - [ ] 10.4 GET /api/quick-memos/recent 엔드포인트 구현 (최근 20개, author_id 필터)
  - [ ] 10.5 `server/index.ts`에 빠른 메모 라우트 등록: `app.use('/api', quickMemoRoutes)`

- [ ] 11.0 Backend: 권한 체크 로직 추가 (그룹 기반)
  - [ ] 11.1 `server/services/meetingNoteService.ts` 파일 읽기
  - [ ] 11.2 getAll() 함수에 그룹 권한 체크 추가
    - JWT에서 user.hub_permissions.saleshub.groups 추출
    - visibility_group_id가 있으면 사용자 그룹 목록과 비교
  - [ ] 11.3 getById() 함수에 그룹 권한 체크 추가
  - [ ] 11.4 에러 메시지: "이 메모를 볼 권한이 없습니다."

- [ ] 12.0 Frontend: QuickMemoFAB 컴포넌트
  - [ ] 12.1 `frontend/components/quick-memo/QuickMemoFAB.tsx` 파일 생성
  - [ ] 12.2 Floating Action Button UI 구현 (우하단 고정, z-50)
  - [ ] 12.3 Plus 아이콘 사용 (lucide-react)
  - [ ] 12.4 모바일 반응형: w-14 h-14 (mobile), w-16 h-16 (desktop)
  - [ ] 12.5 클릭 시 QuickMemoModal 열기 (useState)
  - [ ] 12.6 호버 효과: hover:scale-110

- [ ] 13.0 Frontend: QuickMemoModal 컴포넌트
  - [ ] 13.1 `frontend/components/quick-memo/QuickMemoModal.tsx` 파일 생성
  - [ ] 13.2 슬라이드업 모달 UI 구현 (모바일 하단에서 올라오는 애니메이션)
  - [ ] 13.3 Textarea: 메모 내용 입력 (최대 10,000자, placeholder: "미팅 메모를 입력하세요...")
  - [ ] 13.4 VisibilitySelector 컴포넌트 임베드
  - [ ] 13.5 저장 버튼 클릭 시:
    - POST /api/quick-memos/suggest-customer 호출
    - CustomerMatchModal 열기 (매칭 결과 전달)
  - [ ] 13.6 취소 버튼: 모달 닫기

- [ ] 14.0 Frontend: VisibilitySelector 컴포넌트
  - [ ] 14.1 `frontend/components/quick-memo/VisibilitySelector.tsx` 파일 생성
  - [ ] 14.2 라디오 버튼 그룹:
    - "전체 공개" (is_private=false, visibility_group_id=null)
    - "그룹 공개" (is_private=false, visibility_group_id 선택)
    - "비공개" (is_private=true)
  - [ ] 14.3 "그룹 공개" 선택 시 드롭다운 표시 (GET /api/groups/my)
  - [ ] 14.4 lucide-react 아이콘 사용 (Globe, Users, Lock)

- [ ] 15.0 Frontend: CustomerMatchModal 컴포넌트
  - [ ] 15.1 `frontend/components/quick-memo/CustomerMatchModal.tsx` 파일 생성
  - [ ] 15.2 AI 추천 고객 표시:
    - 회사명 (company_name)
    - 카테고리 (category_level1, category_level2)
    - 신뢰도 배지 (high=초록, medium=노랑, low=빨강)
  - [ ] 15.3 "맞음" 버튼: POST /api/quick-memos 호출 (customer_id 포함)
  - [ ] 15.4 "아님" 버튼: CustomerSearchList 표시
  - [ ] 15.5 저장 성공 시: 토스트 메시지, 모달 닫기, 메모 목록 갱신

- [ ] 16.0 Frontend: CustomerSearchList 컴포넌트
  - [ ] 16.1 `frontend/components/quick-memo/CustomerSearchList.tsx` 파일 생성
  - [ ] 16.2 검색 input: GET /api/customers/search?q=keyword
  - [ ] 16.3 유사 고객 목록 표시 (alternatives에서 전달받음)
  - [ ] 16.4 고객 선택 시: POST /api/quick-memos 호출
  - [ ] 16.5 "신규 고객 생성" 버튼: NewCustomerForm 표시
  - [ ] 16.6 "고객 연동 안함" 버튼: customer_id=null로 저장

- [ ] 17.0 Frontend: 레이아웃 통합
  - [ ] 17.1 `frontend/app/(dashboard)/layout.tsx` 파일 읽기
  - [ ] 17.2 QuickMemoFAB 컴포넌트 임포트
  - [ ] 17.3 레이아웃 하단에 QuickMemoFAB 추가 (children 아래)
  - [ ] 17.4 사이드바와 겹치지 않도록 z-index 조정 (FAB: z-50, Sidebar: z-40)
  - [ ] 17.5 모바일에서 햄버거 메뉴와 겹치지 않는지 확인

- [ ] 18.0 [PARALLEL GROUP: qa-validation] Phase 2 QA 테스트
  - [ ] 18.1 백엔드 빌드 검증 (Sub-Agent A): `cd server && npm run build`
  - [ ] 18.2 프론트엔드 빌드 검증 (Sub-Agent B): `cd frontend && npm run build`
  - [ ] 18.3 TypeScript 타입 검사 (Sub-Agent C): `npx tsc --noEmit`
  - [ ] 18.4 통합 테스트 (Sequential after 18.1-18.3):
    - FAB 버튼 표시 확인 (데스크톱 + 모바일)
    - 빠른 메모 입력 및 저장 테스트
    - 고객 자동 매칭 결과 확인
    - 그룹 공개 범위 설정 테스트
    - 권한 체크 (다른 계정에서 그룹 메모 조회)

- [ ] 19.0 E2E 테스트 (HWTestAgent)
  - [ ] 19.1 HWTestAgent 저장소로 이동: `cd /home/peterchung/HWTestAgent`
  - [ ] 19.2 테스트 시나리오 파일 생성: `tests/wbsaleshub-quick-memo.spec.ts`
  - [ ] 19.3 시나리오 1: 기본 빠른 메모 작성
    - FAB 클릭 → 메모 입력 → 저장 → 고객 매칭 확인 → 저장 완료
  - [ ] 19.4 시나리오 2: 고객 수동 선택
    - FAB 클릭 → 메모 입력 → "다른 고객 선택" → 검색 → 선택
  - [ ] 19.5 시나리오 3: 그룹 공개
    - FAB 클릭 → 메모 입력 → "그룹 공개" 선택 → 저장
  - [ ] 19.6 Playwright 테스트 실행: `npx playwright test tests/wbsaleshub-quick-memo.spec.ts`
  - [ ] 19.7 스크린샷 확인: `test-results/` 폴더

- [ ] 20.0 Phase 2 커밋 및 PR 생성
  - [ ] 20.1 변경 사항 커밋: `git add . && git commit -m "feat(saleshub): 빠른 메모 기능 추가\n\n- FAB(Floating Action Button)로 모바일 접근성 개선\n- Claude AI 고객명 자동 매칭\n- 그룹 기반 공개 범위 설정"`
  - [ ] 20.2 브랜치 푸시: `git push origin feature/quick-memo`
  - [ ] 20.3 GitHub PR 생성: `gh pr create --title "feat(saleshub): 빠른 메모 기능 추가" --body "$(cat <<'EOF'
## Summary
- FAB(Floating Action Button)를 통한 빠른 메모 입력
- Claude AI 기반 고객명 자동 매칭
- 그룹 기반 공개 범위 설정

## Test plan
- [x] 백엔드 빌드 검증
- [x] 프론트엔드 빌드 검증
- [x] FAB 버튼 표시 확인 (데스크톱 + 모바일)
- [x] 고객 자동 매칭 기능 테스트
- [x] 그룹 공개 범위 설정 테스트
- [x] E2E 테스트 (Playwright)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"`

---

## 환경별 테스트 전략

이 섹션은 `/home/peterchung/WHCommon/실행_작업.md`의 "QA Testing & Server Management > 2. 환경별 테스트 전략" 섹션을 참조합니다.

### Local Development (빠른 피드백)
- **단위 테스트**: timeout 15s, workers: 4, retries: 0
- **E2E 테스트**: timeout 30s, workers: 4, retries: 1

### Docker Staging (안정성 우선)
- **단위 테스트**: timeout 30s, workers: 2, retries: 1
- **E2E 테스트**: timeout 60s, workers: 2, retries: 2

### Oracle Production (최고 안정성)
- **단위 테스트**: timeout 60s, workers: 2, retries: 3
- **E2E 테스트**: timeout 90s, workers: 1, retries: 3

---

## 프론트엔드 실행 전 보장 체크리스트

- [ ] 프론트엔드 빌드 성공 확인 (`npm run build`)
- [ ] 백엔드 빌드 성공 확인 (`npm run build`)
- [ ] 백엔드 서버 정상 구동 확인 (포트 4010)
- [ ] 프론트엔드 서버 정상 구동 확인 (포트 3010)
- [ ] 데이터베이스 연결 확인
- [ ] SSO 로그인 기능 정상 동작 확인
- [ ] 주요 페이지 로딩 에러 없음 확인

**중요:** 위 체크리스트 중 하나라도 실패하면 문제를 해결한 후 다시 검증해야 합니다.
