# 세일즈허브 "빠른 메모" 기능 구현 계획

## 1. 프로젝트 개요

### 목표
세일즈허브에 모바일 친화적인 "빠른 메모" 기능을 추가하여 이동 중이나 미팅 직후 짧은 메모를 빠르게 입력할 수 있도록 합니다.

### 핵심 요구사항
- ✅ 모바일 FAB(Floating Action Button)을 통한 빠른 접근
- ✅ 기존 meeting_notes 테이블 재사용 (source='QUICK_MEMO')
- ✅ Claude AI 자연어 고객명 자동 매칭 (저장 시 1회 호출)
- ✅ 그룹 기반 공개 범위 설정
- ✅ 매칭 실패 시 드롭다운 검색 + 신규 고객 생성 옵션

---

## 2. 데이터 모델 설계

### 2.1 SalesHub: meeting_notes 테이블 확장

**마이그레이션**: `013_add_quick_memo_support.sql`

```sql
-- 1. source enum에 'QUICK_MEMO' 추가
ALTER TYPE meeting_note_source_type ADD VALUE IF NOT EXISTS 'QUICK_MEMO';

-- 2. 그룹 기반 공개 범위 컬럼 추가
ALTER TABLE meeting_notes
ADD COLUMN IF NOT EXISTS visibility_group_id TEXT;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_meeting_notes_visibility_group
ON meeting_notes(visibility_group_id);

COMMENT ON COLUMN meeting_notes.visibility_group_id IS
'HubManager groups.id - 특정 그룹만 공개. NULL이면 전체/비공개(is_private 기준)';
```

**공개 범위 로직**:
- `is_private=true` → 본인만
- `is_private=false, visibility_group_id=null` → 전체 공개
- `is_private=false, visibility_group_id='group-123'` → 특정 그룹만

### 2.2 HubManager: 그룹 관리 시스템 (신규)

```sql
-- groups 테이블
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY DEFAULT ('group-' || gen_random_uuid()::text),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  hub_slug VARCHAR(50), -- 허브 전용 그룹 (NULL=전체)
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- group_members 테이블
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- 인덱스
CREATE INDEX idx_groups_hub_slug ON groups(hub_slug);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
```

**JWT 토큰 확장**:
```typescript
hub_permissions: {
  'saleshub': {
    role: 'admin',
    groups: ['group-abc123', 'group-def456'] // 신규
  }
}
```

---

## 3. API 설계

### 3.1 HubManager: 그룹 관리 API (신규)

```
GET    /api/groups                          - 그룹 목록 (관리자)
GET    /api/groups/my                       - 내 그룹 목록
POST   /api/groups                          - 그룹 생성 (관리자)
PUT    /api/groups/:id                      - 그룹 수정 (관리자)
DELETE /api/groups/:id                      - 그룹 삭제 (관리자)
POST   /api/groups/:id/members              - 멤버 추가 (관리자)
DELETE /api/groups/:id/members/:user_id    - 멤버 제거 (관리자)
```

### 3.2 SalesHub: 빠른 메모 API (신규)

```
POST   /api/quick-memos/suggest-customer    - 고객명 추출+매칭 (저장 전)
POST   /api/quick-memos                     - 빠른 메모 생성
GET    /api/quick-memos/recent              - 최근 내 메모 목록
```

**POST /api/quick-memos/suggest-customer**:
```typescript
// 요청
{ content: "오늘 삼성전자 김과장님과 미팅" }

// 응답
{
  success: true,
  data: {
    extracted_client_name: "삼성전자",
    suggested_customer: {
      customer_id: "uuid-123",
      company_name: "삼성전자",
      confidence: "high"
    },
    alternatives: [ /* 유사 고객 목록 */ ]
  }
}
```

---

## 4. 프론트엔드 컴포넌트

### 4.1 QuickMemoFAB (Floating Action Button)
- **위치**: 우하단 고정 (z-50)
- **크기**: Mobile 14×14, Desktop 16×16
- **아이콘**: `<Plus>` (lucide-react)
- **동작**: 클릭 시 QuickMemoModal 슬라이드업

### 4.2 QuickMemoModal (메모 입력 모달)
- **필드**:
  - Textarea: 메모 내용 (최대 10,000자)
  - VisibilitySelector: 전체 공개 / 그룹 선택 / 비공개
- **저장 버튼**: Claude API 호출 → CustomerMatchModal 표시

### 4.3 CustomerMatchModal (고객 매칭 결과)
- **AI 추천 고객 표시**: 회사명 + 신뢰도 (high/medium/low)
- **버튼**:
  - ✅ "맞음" → 메모 저장
  - ❌ "아님" → CustomerSearchList 표시
- **CustomerSearchList**:
  - 유사 고객 드롭다운 (검색 가능)
  - "신규 고객 생성" 버튼
  - "고객 연동 안함" 버튼

---

## 5. 구현 단계 (Phase 1 → Phase 2)

### Phase 1: HubManager 그룹 관리 (선행 작업)

#### 작업 항목
1. **DB 마이그레이션**: groups, group_members 테이블 생성
2. **Backend API**: `/api/groups` CRUD 구현
3. **JWT 확장**: 로그인 시 사용자 그룹 정보를 JWT에 포함
4. **Frontend**: `/admin/groups` 페이지 (그룹 관리 UI)

#### 주요 파일
- `/home/peterchung/WBHubManager/server/database/migrations/add-group-management.sql`
- `/home/peterchung/WBHubManager/server/routes/groups.ts` (신규)
- `/home/peterchung/WBHubManager/server/services/groupService.ts` (신규)
- `/home/peterchung/WBHubManager/server/middleware/auth.ts` (JWT 확장)

**예상 소요**: 3-4일

---

### Phase 2: SalesHub 빠른 메모 (메인 작업)

#### 작업 항목
1. **DB 마이그레이션**: visibility_group_id 추가, QUICK_MEMO enum 추가
2. **Backend API**: `/api/quick-memos` 구현
3. **Claude 서비스**: extractCustomerName() 함수 추가
4. **Frontend 컴포넌트**: QuickMemoFAB, QuickMemoModal, CustomerMatchModal
5. **레이아웃 통합**: MainLayout에 FAB 추가

#### 주요 파일
- `/home/peterchung/WBSalesHub/server/database/migrations/013_add_quick_memo_support.sql`
- `/home/peterchung/WBSalesHub/server/routes/quickMemoRoutes.ts` (신규)
- `/home/peterchung/WBSalesHub/server/services/claudeService.ts` (확장)
- `/home/peterchung/WBSalesHub/frontend/components/quick-memo/QuickMemoFAB.tsx` (신규)
- `/home/peterchung/WBSalesHub/frontend/components/quick-memo/QuickMemoModal.tsx` (신규)
- `/home/peterchung/WBSalesHub/frontend/components/quick-memo/CustomerMatchModal.tsx` (신규)

**예상 소요**: 5-6일

---

## 6. Claude API 비용 분석

### 호출 구조
1. **고객명 추출** (Haiku, 500 토큰): ~$0.0004
2. **고객 매칭** (Haiku, 500 토큰): ~$0.0006

**빠른 메모 1건당 비용**: ~$0.001

### 월간 예상 비용 (10명 기준)
- 일일 사용량: 10회 / 사용자
- 월간 총 사용량: 10명 × 10회 × 30일 = 3,000회
- **월간 비용**: $3.00

### 사용량 제한
- 일일 제한: 50회 / 사용자 (CLAUDE_DAILY_LIMIT)
- Rate Limiting: 1분당 최대 5회
- Fallback: API 실패 시 수동 검색 옵션

---

## 7. 보안 및 권한

### 권한 체크 로직
```typescript
// meeting_notes 조회 권한
if (note.is_private && note.author_id !== user.id) {
  throw new Error('권한 없음');
}

if (note.visibility_group_id) {
  const userGroups = user.hub_permissions['saleshub']?.groups || [];
  if (!userGroups.includes(note.visibility_group_id)) {
    throw new Error('권한 없음');
  }
}
```

### 입력 검증
- content: 최대 10,000자, HTML 태그 제거
- visibility_group_id: 사용자가 속한 그룹인지 검증

---

## 8. 테스트 전략

### E2E 테스트 시나리오 (Playwright)
1. **기본 빠른 메모**: FAB → 메모 입력 → 저장 → 고객 매칭 확인 → 저장 완료
2. **고객 수동 선택**: FAB → 메모 입력 → "다른 고객 선택" → 드롭다운 검색 → 선택
3. **신규 고객 생성**: FAB → 메모 입력 → "신규 고객 생성" → 폼 작성 → 저장
4. **그룹 공개**: FAB → 메모 입력 → "그룹 선택" → 저장 → 다른 계정에서 권한 확인

---

## 9. 의존성 및 제약사항

### 선행 의존성
```
Phase 1: HubManager 그룹 관리
    ↓
Phase 2: SalesHub 빠른 메모
```

### 기술 제약
1. **Claude API 일일 제한**: 50회 / 사용자
2. **JWT 크기**: 그룹 정보로 인한 토큰 크기 증가 (4KB 제한 주의)
3. **Cross-DB 참조**: HubManager groups 테이블을 SalesHub에서 직접 JOIN 불가 (JWT 또는 API 호출)

---

## 10. 핵심 파일 목록

### Phase 1: HubManager (그룹 관리)
- `server/database/migrations/add-group-management.sql` - 마이그레이션
- `server/routes/groups.ts` - API 엔드포인트 (신규)
- `server/services/groupService.ts` - 비즈니스 로직 (신규)
- `server/middleware/auth.ts` - JWT 확장 (기존)

### Phase 2: SalesHub (빠른 메모)
- `server/database/migrations/013_add_quick_memo_support.sql` - 마이그레이션
- `server/routes/quickMemoRoutes.ts` - API 엔드포인트 (신규)
- `server/services/claudeService.ts` - extractCustomerName() 추가 (기존)
- `frontend/components/quick-memo/QuickMemoFAB.tsx` - FAB (신규)
- `frontend/components/quick-memo/QuickMemoModal.tsx` - 모달 (신규)
- `frontend/components/quick-memo/CustomerMatchModal.tsx` - 매칭 모달 (신규)
- `frontend/app/(dashboard)/layout.tsx` - FAB 통합 (기존)

---

## 11. 다음 단계

1. ✅ **PRD 작성 완료** (현재 문서)
2. ⏳ **Phase 1 시작**: HubManager 그룹 관리 구현
3. ⏳ **Phase 2 시작**: SalesHub 빠른 메모 구현
4. ⏳ **E2E 테스트**: HWTestAgent로 통합 테스트
5. ⏳ **배포**: 스테이징 → 프로덕션
