# PRD v1.1 — CRM 메모리 RAG + 다나와 통합 세일즈 인텔리전스 시스템

**버전**: v1.1
**작성일**: 2026. 03. 13.
**대상 레포**: WBSalesHub (`/mnt/c/GitHub/WBSalesHub`)

---

## 1. Context — 왜 이 변경이 필요한가

### 현재 문제
세일즈허브의 고객정보는 `customer_contexts` (JSONB 구조화 프로필) + `customer_knowledge_chunks` (PostgreSQL FTS)로 관리되고 있다. 이 구조의 한계:

1. **키워드 매칭만 가능** — FTS(tsvector)는 "커스터디 수수료"로 검색하면 "보관 수수료"를 못 찾음
2. **시간축 추적 불가** — 고객 입장 변화(1월에는 A, 3월에는 B)를 추적할 수 없음
3. **법률/규제 참조 단절** — 다나와에 인덱싱된 법률+회사 내부 문서를 Reno에서 직접 조회 불가
4. **팀 지식 소실** — 미팅 인사이트가 개인에게 귀속, 인수인계 시 맥락 단절

### 목표 결과
- Reno에게 "BC Card 미팅 준비해줘"라고 하면, **고객 이력 + 법률 근거 + 시간축 변화**를 통합한 브리핑 즉시 생성
- 세일즈허브 대시보드에서 고객별 **메모리 타임라인, 추출된 팩트, 시맨틱 검색** 직접 조회
- 경영진 일간/주간 세일즈 현황 보고 자동 생성

---

## 2. 핵심 결정사항 (사용자 확인 완료)

| 항목 | 결정 |
|------|------|
| 메모리 저장소 | **PostgreSQL + pgvector** (기존 인프라 활용) |
| 다나와 범위 | **법률 + 회사 내부 문서** 모두 연동 |
| Reno 관계 | **기존 RenoAgent 확장** (도구 3개 추가) |
| 우선 시나리오 | 고객 Q&A, 미팅 브리핑, 제안서 초안, 인수인계, 경영진 보고 |
| 접근 제어 | **그룹/팀 기반** ACL + 정보 기밀 등급 |
| 자동 분류 | **계층 상속 + 카테고리 규칙** (AI 감지 없이 규칙 기반) |

---

## 3. 접근 제어 시스템 (Access Control)

### 3-1. 설계 원칙

```
"고객 등록 시 팀 1번 지정, 이후 모든 데이터는 자동 상속. 예외만 수동 오버라이드."
```

- **고객 레벨**: 어떤 팀이 이 고객 정보에 접근 가능한가?
- **정보 레벨**: 이 고객 안에서 기밀 데이터는 어디까지 누가 볼 수 있는가?
- **자동 분류**: 95%+ 데이터는 태깅 불필요 (상속 + 카테고리 규칙)

### 3-2. 데이터 모델

#### 신규 테이블: `access_groups` (팀/그룹 정의)

```sql
-- 마이그레이션 047
CREATE TABLE access_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,  -- '세일즈팀', '임원', 'CS팀'
  description TEXT,
  is_system   BOOLEAN DEFAULT FALSE,         -- 시스템 그룹 (삭제 불가)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 그룹 시드 데이터
INSERT INTO access_groups (name, description, is_system) VALUES
  ('전체', '모든 ACTIVE 사용자', TRUE),
  ('임원', '대표 및 임원진 (MASTER + ADMIN)', TRUE),
  ('세일즈팀', '세일즈 담당자', FALSE),
  ('CS팀', 'CS 매니저', FALSE);
```

#### 신규 테이블: `user_groups` (사용자-그룹 매핑)

```sql
CREATE TABLE user_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  group_id    UUID NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES accounts(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

CREATE INDEX idx_user_groups_user ON user_groups(user_id);
CREATE INDEX idx_user_groups_group ON user_groups(group_id);
```

#### 신규 테이블: `customer_access_groups` (고객-팀 접근 매핑)

```sql
CREATE TABLE customer_access_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  group_id    UUID NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES accounts(id),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, group_id)
);

CREATE INDEX idx_cag_customer ON customer_access_groups(customer_id);
CREATE INDEX idx_cag_group ON customer_access_groups(group_id);
```

#### 고객 테이블 확장

```sql
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS default_confidentiality VARCHAR(20) DEFAULT 'public';
  -- 'public' | 'confidential'
```

### 3-3. 기밀 등급 (Confidentiality Level)

2단계 모델:

| 등급 | 조회 가능 대상 | 설명 |
|------|--------------|------|
| `public` | 해당 고객 접근 권한이 있는 모든 사용자 | 기본값. 대부분의 정보 |
| `confidential` | **임원 그룹** 소속 사용자만 | 수수료, 계약 금액, 민감 협상 내용 |

> MASTER/ADMIN 역할은 **항상 모든 고객 + 모든 기밀 등급** 접근 가능 (시스템 오버라이드)

### 3-4. 자동 분류 규칙 (태깅 불필요)

#### 규칙 1: 고객 기본값 상속

```
고객 등록/수정 시:
  customers.default_confidentiality = 'public' (기본)

이후 생성되는 모든 데이터:
  에피소딕 메모리 → 고객 기본값 상속
  시맨틱 팩트    → 고객 기본값 상속
  지식 청크      → 고객 기본값 상속
```

#### 규칙 2: 카테고리별 자동 승격

특정 카테고리는 고객 기본값과 무관하게 **항상 CONFIDENTIAL**:

```typescript
const AUTO_CONFIDENTIAL_RULES = {
  // 시맨틱 팩트 카테고리
  fact_category: ['financial', 'regulatory'],

  // 지식 청크 타입
  chunk_type: ['caution'],

  // 에피소딕 에피소드 타입
  episode_type: ['deal_milestone', 'issue'],
};
```

```
적용 예시:
- fact_category='financial' ("수수료 0.1% 합의")    → 자동 CONFIDENTIAL
- fact_category='preference' ("규제 리스크에 민감")  → 고객 기본값 따름
- chunk_type='caution' ("법적 분쟁 가능성 있음")    → 자동 CONFIDENTIAL
- chunk_type='contact' ("김OO 부장 연락처")          → 고객 기본값 따름
- episode_type='deal_milestone' ("계약 서명 완료")   → 자동 CONFIDENTIAL
- episode_type='meeting' ("3월 미팅 일반 논의")      → 고객 기본값 따름
```

#### 규칙 3: 수동 오버라이드 (예외)

```
드물게 필요한 경우만:
- Slack: "이 메모 기밀로 저장해줘" → Reno가 confidentiality='confidential' 태깅
- 웹 UI: 에피소드/팩트 카드에 🔒 토글 버튼
```

### 3-5. 메모리 테이블 스키마 변경

기존 PRD의 3개 테이블에 `confidentiality` 컬럼 추가:

```sql
-- customer_knowledge_chunks (마이그레이션 044에 포함)
ALTER TABLE customer_knowledge_chunks
  ADD COLUMN IF NOT EXISTS confidentiality VARCHAR(20) DEFAULT 'public';

-- crm_episodic_memories (마이그레이션 045에 포함)
-- 테이블 정의에 추가:
  confidentiality VARCHAR(20) DEFAULT 'public',

-- crm_semantic_facts (마이그레이션 046에 포함)
-- 테이블 정의에 추가:
  confidentiality VARCHAR(20) DEFAULT 'public',
```

인덱스 추가 (성능 최적화):
```sql
CREATE INDEX idx_chunks_conf ON customer_knowledge_chunks(customer_id, confidentiality);
CREATE INDEX idx_episodic_conf ON crm_episodic_memories(customer_id, confidentiality);
CREATE INDEX idx_facts_conf ON crm_semantic_facts(customer_id, confidentiality);
```

### 3-6. 접근 제어 적용 흐름

#### 조회 시 (검색/대시보드/Reno)

```
사용자 요청
    │
    ▼
MemoryAccessService.getAccessibleScope(userId)
    │
    ├── 1. 사용자의 그룹 목록 조회
    │     SELECT group_id FROM user_groups WHERE user_id = $1
    │
    ├── 2. 접근 가능한 고객 ID 목록 조회
    │     SELECT customer_id FROM customer_access_groups
    │     WHERE group_id IN (사용자 그룹들)
    │     → MASTER/ADMIN은 이 단계 스킵 (전체 접근)
    │
    └── 3. 기밀 등급 필터 결정
          사용자가 '임원' 그룹 소속?
          → YES: confidentiality IN ('public', 'confidential')
          → NO:  confidentiality = 'public' 만
    │
    ▼
HybridSearchService.search(query, { customerIds, maxConfidentiality })
    → WHERE customer_id IN (...) AND confidentiality <= maxLevel
```

#### 저장 시 (에피소드 생성/팩트 추출)

```
데이터 입력
    │
    ▼
ConfidentialityResolver.resolve(customerId, dataType, categoryOrType)
    │
    ├── 1. 카테고리 규칙 체크
    │     AUTO_CONFIDENTIAL_RULES에 매칭?
    │     → YES: return 'confidential'
    │
    └── 2. 고객 기본값 상속
          SELECT default_confidentiality FROM customers WHERE id = $1
          → return 해당 값
    │
    ▼
데이터 저장 (confidentiality 컬럼에 결정된 값)
```

### 3-7. RAG 성능 영향 분석

**결론: 성능 저하 무시 가능**

| 연산 | 추가 비용 | 이유 |
|------|----------|------|
| 고객 접근 권한 조회 | ~1ms | `user_groups` + `customer_access_groups` JOIN, 인덱스 적용 |
| 벡터 검색 + 권한 필터 | ~0ms 추가 | `WHERE customer_id IN (...)` 는 기존에도 customer_id 필터 사용 중 |
| 기밀 등급 필터 | ~0ms 추가 | `AND confidentiality = 'public'` 은 단순 VARCHAR 비교 |
| 저장 시 자동 분류 | ~0ms | 규칙 기반 (if/else), AI 호출 없음 |

**핵심 이유**: pgvector HNSW 검색은 이미 `customer_id`로 필터링되고 있음. `confidentiality` 필터는 같은 WHERE 절에 추가되는 것이므로 추가 비용이 거의 없음. 복합 인덱스 `(customer_id, confidentiality)`로 커버.

검증용 EXPLAIN ANALYZE:
```sql
-- 기존 (권한 없음)
WHERE customer_id = $1

-- 추가 후 (권한 있음)
WHERE customer_id IN (uuid1, uuid2, ...) AND confidentiality = 'public'
```

수백 고객, 수천 청크 규모에서 두 쿼리의 실행 계획 차이는 측정 불가 수준 (<1ms).

### 3-8. 프론트엔드 UI 변경

#### 고객 등록/수정 모달

```
┌─ 고객 접근 설정 ──────────────────────────┐
│                                            │
│  접근 가능 팀:  [✓ 세일즈팀] [✓ CS팀] [임원] │
│                                            │
│  기본 기밀 등급: ○ 공개  ● 기밀              │
│                                            │
│  💡 기밀 등급 고객의 모든 정보는 임원만        │
│     조회 가능합니다. 공개 등급에서도 수수료,    │
│     계약금액 등은 자동으로 기밀 처리됩니다.     │
│                                            │
└────────────────────────────────────────────┘
```

#### 메모리 인텔리전스 탭 기밀 표시

```
에피소딕 타임라인:
  ● 2026-03-12 미팅  🔒           ← 기밀 아이콘
    "수수료 0.1% 최종 합의"

팩트 카드:
  ┌──────────────────────┐
  │ 🔒 재무: 수수료 0.1%  │    ← 기밀 뱃지
  │ 거래 건당 합의         │
  └──────────────────────┘
```

권한 없는 사용자에게는 기밀 데이터가 **완전히 숨겨짐** (마스킹 아닌 미노출).

#### 팀/그룹 관리 UI (어드민 전용)

새 라우트: `/admin/access-groups` (ADMIN 이상)

```
┌─ 접근 그룹 관리 ───────────────────────────┐
│                                            │
│  세일즈팀 (4명)           [편집]            │
│    peter.chung, john.moon, ...             │
│                                            │
│  임원 (2명)              [편집]            │
│    peter.chung, ceo                        │
│                                            │
│  CS팀 (3명)              [편집]            │
│    cs1, cs2, cs3                           │
│                                            │
│  [+ 새 그룹 추가]                          │
└────────────────────────────────────────────┘
```

### 3-9. Reno 에이전트 접근 제어

Slack에서 Reno를 통해 질문할 때도 동일한 권한 적용:

```
담당자 (세일즈팀): "VIP Client 수수료 현황 알려줘"

Reno 내부:
1. 사용자 권한 확인: 세일즈팀 → VIP Client 접근 불가
2. 응답: "해당 고객 정보에 대한 접근 권한이 없습니다."

임원: "VIP Client 수수료 현황 알려줘"

Reno 내부:
1. 사용자 권한 확인: 임원 → VIP Client 접근 가능 + 기밀 조회 가능
2. search_crm_memory → 기밀 포함 전체 결과 반환
3. 통합 응답 생성
```

### 3-10. 신규 API 엔드포인트 (접근 제어)

`server/routes/accessRoutes.ts` (신규):

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/access/groups` | ADMIN | 그룹 목록 |
| POST | `/api/access/groups` | ADMIN | 그룹 생성 |
| PUT | `/api/access/groups/:id` | ADMIN | 그룹 수정 |
| DELETE | `/api/access/groups/:id` | ADMIN | 그룹 삭제 (시스템 그룹 불가) |
| GET | `/api/access/groups/:id/members` | ADMIN | 그룹 멤버 목록 |
| POST | `/api/access/groups/:id/members` | ADMIN | 멤버 추가 |
| DELETE | `/api/access/groups/:id/members/:userId` | ADMIN | 멤버 제거 |
| GET | `/api/access/customers/:customerId/groups` | ADMIN | 고객의 접근 그룹 |
| PUT | `/api/access/customers/:customerId/groups` | ADMIN | 고객 접근 그룹 설정 |

### 3-11. 신규 백엔드 파일

```
server/modules/access/                ← NEW 디렉토리
├── MemoryAccessService.ts            # 접근 권한 조회 (캐싱 포함)
├── ConfidentialityResolver.ts        # 자동 기밀 등급 결정
├── AccessGroupService.ts             # 그룹 CRUD
└── types.ts                          # 접근 제어 타입
```

### 3-12. 로드맵 반영

접근 제어는 **Phase 1에 포함** (벡터 기반 구축과 동시):
- 마이그레이션 047: access_groups, user_groups, customer_access_groups
- 고객 테이블 default_confidentiality 추가
- MemoryAccessService + ConfidentialityResolver 구현
- 이후 Phase의 모든 데이터 저장/조회에 자동 적용

---

## 4. 시스템 아키텍처

```
사용자 (Slack / 웹 대시보드)
    │
    ▼
RenoAgent (Claude Sonnet Tool Use)
    │
    ├── 기존 도구 12개 (유지)
    │
    ├── [NEW] search_crm_memory ─── HybridSearchService
    │     ├── customer_knowledge_chunks (FTS + vector)
    │     ├── crm_episodic_memories (에피소딕)
    │     └── crm_semantic_facts (시맨틱)
    │
    ├── [NEW] search_legal_reference ─── DanawaClient
    │     └── 10.10.10.235:8989 (MCP SSE)
    │
    └── [NEW] store_episodic_memory ─── EpisodicMemoryManager
          └── Claude 자동 팩트 추출 → crm_semantic_facts
```

### 데이터 흐름

```
[입력] 미팅 메모 / Slack 대화 / 수동 입력
    │
    ▼
EpisodicMemoryManager.create()
    ├── 에피소딕 메모리 저장 (crm_episodic_memories)
    ├── EmbeddingService.embed() → vector 생성
    └── SemanticFactExtractor.extract() → 팩트 추출
         └── crm_semantic_facts에 저장 (중복/모순 감지)

[조회] "BC Card 현황 알려줘"
    │
    ▼
MemoryOrchestrator.search()
    ├── HybridSearchService.search() → FTS + vector RRF
    │     ├── knowledge_chunks 결과
    │     ├── episodic_memories 결과
    │     └── semantic_facts 결과
    ├── DanawaClient.search() → 법률/내부문서 (필요시)
    └── 결과 병합 → Claude 응답 생성
```

---

## 4. 데이터 모델

### 4-1. 기존 테이블 확장: `customer_knowledge_chunks`

```sql
-- 마이그레이션 044
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE customer_knowledge_chunks
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'text-embedding-3-small',
  ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
  ON customer_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 4-2. 신규 테이블: `crm_episodic_memories`

미팅, 통화, 이메일 등 **시간 기반 상호작용 기록**. 기존 `customer_activities`와 다른 점: AI가 요약·분석한 인사이트 + 벡터 임베딩 포함.

```sql
-- 마이그레이션 045
CREATE TABLE crm_episodic_memories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  episode_type    VARCHAR(50) NOT NULL,
    -- 'meeting' | 'call' | 'email_exchange' | 'deal_milestone' | 'issue' | 'relationship_change'
  summary         TEXT NOT NULL,           -- AI 요약
  key_facts       JSONB DEFAULT '[]',      -- 추출된 구조화 팩트
  participants    TEXT[],                   -- 참석자
  sentiment       VARCHAR(20),             -- 'positive' | 'neutral' | 'negative' | 'mixed'
  importance      SMALLINT DEFAULT 50,     -- 0-100
  source_type     VARCHAR(50) NOT NULL,    -- 'meeting_notes' | 'activity' | 'slack' | 'manual'
  source_id       UUID,                    -- 원본 참조 (meetings.id 등)
  occurred_at     TIMESTAMPTZ NOT NULL,
  embedding       vector(1536),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expired_at      TIMESTAMPTZ              -- NULL = 여전히 유효
);

CREATE INDEX idx_episodic_customer_time ON crm_episodic_memories(customer_id, occurred_at DESC);
CREATE INDEX idx_episodic_embedding ON crm_episodic_memories USING hnsw (embedding vector_cosine_ops);
```

### 4-3. 신규 테이블: `crm_semantic_facts`

에피소딕 메모리에서 **추출·축적된 고객 팩트**. 시간에 따라 변하면 이전 팩트를 무효화하고 새 팩트로 대체.

```sql
-- 마이그레이션 046
CREATE TABLE crm_semantic_facts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  fact_category   VARCHAR(50) NOT NULL,
    -- 'preference' | 'constraint' | 'relationship' | 'history' | 'technical' | 'financial' | 'regulatory'
  fact_text       TEXT NOT NULL,
  confidence      SMALLINT DEFAULT 70,     -- 0-100
  source_episodes UUID[],                  -- 근거 에피소딕 메모리 ID
  first_observed  TIMESTAMPTZ NOT NULL,
  last_confirmed  TIMESTAMPTZ NOT NULL,
  contradicted_by UUID,                    -- 모순되는 새 팩트 ID
  is_active       BOOLEAN DEFAULT TRUE,
  embedding       vector(1536),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facts_customer_active ON crm_semantic_facts(customer_id) WHERE is_active = TRUE;
CREATE INDEX idx_facts_embedding ON crm_semantic_facts USING hnsw (embedding vector_cosine_ops);
```

---

## 5. 백엔드 컴포넌트

### 5-1. 신규 파일 구조

```
server/modules/reno/memory/          ← NEW 디렉토리
├── EmbeddingService.ts              # OpenAI text-embedding-3-small 래퍼
├── HybridSearchService.ts           # FTS + vector RRF 하이브리드 검색
├── EpisodicMemoryManager.ts         # 에피소딕 메모리 CRUD + 자동 임베딩
├── SemanticFactExtractor.ts         # Claude로 팩트 추출 + 모순 감지
├── DanawaClient.ts                  # MCP SSE 클라이언트 (다나와 연동)
├── MemoryOrchestrator.ts            # 모든 메모리 레이어 통합 검색
├── ReportGenerator.ts               # 경영진 일간/주간 보고 생성
└── types.ts                         # 메모리 관련 타입 정의
```

### 5-2. 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `server/modules/reno/agent/RenoAgent.ts` | 도구 3개 추가 + executeToolCall 핸들러 |
| `server/modules/reno/context/CustomerContextManager.ts` | `syncKnowledgeChunks()`에 임베딩 큐 연동 |
| `server/modules/reno/init.ts` | 메모리 서비스 초기화 + DanawaClient 연결 |
| `server/modules/reno/features/meeting-prep/MeetingPrepGenerator.ts` | MemoryOrchestrator 활용 |

### 5-3. Reno 신규 도구 상세

**도구 1: `search_crm_memory`**
```typescript
{
  name: 'search_crm_memory',
  description: '고객 관련 심층 검색 (시맨틱). 키워드 매칭을 넘어 의미 기반으로 지식청크, 에피소딕 메모리, 시맨틱 팩트를 통합 검색합니다.',
  input_schema: {
    properties: {
      customer_name: { type: 'string', description: '고객사명 (퍼지 매칭)' },
      query: { type: 'string', description: '검색 질문' },
      memory_types: { type: 'array', items: { enum: ['knowledge', 'episodic', 'facts'] } },
      time_range: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } } }
    },
    required: ['query']
  }
}
```

**도구 2: `search_legal_reference`**
```typescript
{
  name: 'search_legal_reference',
  description: '다나와를 통해 법률, 규제, 회사 내부 문서를 검색합니다. 특금법, 자본시장법, 회사 내규, 제품 가이드라인 등.',
  input_schema: {
    properties: {
      query: { type: 'string', description: '검색 질문' },
      document_types: { type: 'array', items: { enum: ['법률', '규제', '내규', '가이드라인', '제품'] } }
    },
    required: ['query']
  }
}
```

**도구 3: `store_episodic_memory`**
```typescript
{
  name: 'store_episodic_memory',
  description: '고객 상호작용을 에피소딕 메모리로 저장합니다. 미팅 요약, 통화 내용, 주요 이슈 등.',
  input_schema: {
    properties: {
      customer_name: { type: 'string' },
      episode_type: { enum: ['meeting', 'call', 'email_exchange', 'deal_milestone', 'issue'] },
      summary: { type: 'string', description: '상호작용 요약' },
      key_facts: { type: 'array', items: { type: 'string' }, description: '핵심 사실 목록' },
      occurred_at: { type: 'string', description: 'ISO 날짜' }
    },
    required: ['customer_name', 'summary']
  }
}
```

### 5-4. 하이브리드 검색 (RRF)

```sql
-- FTS + Vector Reciprocal Rank Fusion
WITH fts AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(tsvec, plainto_tsquery('simple', $2)) DESC) AS pos
  FROM customer_knowledge_chunks
  WHERE customer_id = $1 AND tsvec @@ plainto_tsquery('simple', $2)
  LIMIT 20
),
vec AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> $3::vector) AS pos
  FROM customer_knowledge_chunks
  WHERE customer_id = $1 AND embedding IS NOT NULL
  ORDER BY embedding <=> $3::vector
  LIMIT 20
)
SELECT ck.*,
  COALESCE(1.0/(60+fts.pos), 0) + COALESCE(1.0/(60+vec.pos), 0) AS rrf_score
FROM customer_knowledge_chunks ck
LEFT JOIN fts ON ck.id = fts.id
LEFT JOIN vec ON ck.id = vec.id
WHERE fts.id IS NOT NULL OR vec.id IS NOT NULL
ORDER BY rrf_score DESC LIMIT $4;
```

**핵심**: `embedding`이 NULL인 행(백필 전)은 FTS로만 검색. 기존 기능 무중단.

### 5-5. 다나와 클라이언트

```typescript
// @modelcontextprotocol/sdk 사용
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export class DanawaClient {
  private client: Client;

  async connect() {
    const transport = new SSEClientTransport(new URL(process.env.DANAWA_MCP_URL));
    await this.client.connect(transport);
  }

  async search(query: string, documentTypes?: string[]) {
    return this.client.callTool({ name: 'search', arguments: { query, documentTypes } });
  }
}
```

### 5-6. 신규 API 엔드포인트

`server/routes/memoryRoutes.ts` (신규):

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/memory/:customerId/episodes` | 에피소딕 메모리 목록 (페이지네이션, 타입 필터) |
| GET | `/api/memory/:customerId/facts` | 시맨틱 팩트 목록 (카테고리 필터, active only) |
| GET | `/api/memory/:customerId/search` | 하이브리드 검색 (query param) |
| GET | `/api/memory/:customerId/timeline` | 통합 타임라인 (에피소딕 + 활동 + 변경로그 병합) |
| POST | `/api/memory/:customerId/episodes` | 수동 에피소딕 메모리 추가 |
| PUT | `/api/memory/facts/:factId/confirm` | 팩트 확인 (last_confirmed 갱신) |
| PUT | `/api/memory/facts/:factId/invalidate` | 팩트 무효화 |
| GET | `/api/memory/reports/daily` | 일간 세일즈 현황 보고 |
| GET | `/api/memory/reports/weekly` | 주간 세일즈 현황 보고 |

---

## 6. 프론트엔드 — 메모리 대시보드 UI

### 6-1. 고객 상세 페이지 탭 확장

**현재 구조** (2탭):
```
고객 컨텍스트 | 히스토리 & 관계
```

**변경 후** (3탭):
```
고객 컨텍스트 | 메모리 인텔리전스 [NEW] | 히스토리 & 관계
```

### 6-2. "메모리 인텔리전스" 탭 구성

```
┌─────────────────────────────────────────────────────────────────┐
│ [시맨틱 검색바]                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔍 "이 고객의 수수료 관련 논의 이력은?"        [검색] [법률참조] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────── 2열 그리드 ──────────────────────────────────┐ │
│ │                              │                              │ │
│ │  [좌] 에피소딕 타임라인       │  [우] 시맨틱 팩트 카드        │ │
│ │                              │                              │ │
│ │  ● 2026-03-12 미팅           │  ┌──────────────────────┐   │ │
│ │    BC Card 김OO              │  │ 선호: 규제 리스크에   │   │ │
│ │    "예산 재검토, 계약 보류"   │  │ 민감하게 반응         │   │ │
│ │    😐 neutral  중요도 75     │  │ 확인: 2026-03-12     │   │ │
│ │                              │  │ 신뢰도: 85%          │   │ │
│ │  ● 2026-02-03 미팅           │  └──────────────────────┘   │ │
│ │    BC Card 김OO              │                              │ │
│ │    "수수료 확정, 법무 검토"   │  ┌──────────────────────┐   │ │
│ │    😊 positive  중요도 80    │  │ 제약: 의사결정권      │   │ │
│ │                              │  │ 상위 결재 필요        │   │ │
│ │  ● 2026-01-15 미팅           │  │ 확인: 2026-02-03     │   │ │
│ │    BC Card 김OO              │  │ 신뢰도: 90%          │   │ │
│ │    "커스터디 수수료 구조 협의" │  └──────────────────────┘   │ │
│ │    😊 positive  중요도 60    │                              │ │
│ │                              │  ┌──────────────────────┐   │ │
│ │  [+ 메모리 추가]             │  │ 💰 재무: 예산 재검토   │   │ │
│ │                              │  │ 중 (3월 기준)         │   │ │
│ │                              │  │ 확인: 2026-03-12     │   │ │
│ │                              │  └──────────────────────┘   │ │
│ │                              │                              │ │
│ └──────────────────────────────┘──────────────────────────────┘ │
│                                                                 │
│ ┌─────────────── 검색 결과 (검색 시 표시) ────────────────────┐ │
│ │  📄 지식청크: "수수료 구조 — 거래 건당 0.1% 기본..."        │ │
│ │  🧠 에피소딕: "2026-02-03 — 수수료 확정, 법무 검토 요청"   │ │
│ │  💡 팩트: "BC Card — 거래 건당 수수료 0.1% 합의"            │ │
│ │  📚 법률: "특금법 제7조 — 가상자산사업자 수수료 고시 의무"   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 6-3. 컴포넌트 구조

```
frontend/components/customers/memory/     ← NEW 디렉토리
├── MemoryIntelligenceTab.tsx             # 탭 메인 (검색 + 2열 레이아웃)
├── SemanticSearchBar.tsx                 # 시맨틱 검색 입력 + 법률참조 토글
├── EpisodicTimeline.tsx                  # 좌측 타임라인 (무한스크롤)
├── SemanticFactCards.tsx                 # 우측 팩트 카드 목록
├── FactCard.tsx                          # 개별 팩트 카드 (확인/무효화 액션)
├── EpisodeCard.tsx                       # 개별 에피소드 (감정, 중요도 뱃지)
├── SearchResults.tsx                     # 통합 검색 결과 (소스별 그룹핑)
├── AddEpisodeModal.tsx                   # 수동 에피소드 추가 모달
└── MemoryStats.tsx                       # 메모리 통계 (에피소드 수, 팩트 수, 마지막 업데이트)
```

### 6-4. 고객 목록 페이지 확장

기존 `CustomerTable`에 메모리 관련 열 추가:

| 열 | 내용 |
|---|------|
| 메모리 상태 | 에피소드 수 + 마지막 에피소드 날짜 (아이콘 뱃지) |
| AI 인사이트 | 가장 최근 시맨틱 팩트 1줄 프리뷰 |

### 6-5. 경영진 보고 페이지

새 라우트: `/reports` (또는 기존 대시보드 내 섹션)

```
┌─────────────────────────────────────────────────────────────┐
│  📊 세일즈 인텔리전스 보고                                    │
│                                                             │
│  [일간] [주간]                        날짜: 2026-03-13      │
│                                                             │
│  ┌─ 핵심 요약 ─────────────────────────────────────────────┐│
│  │ • 신규 에피소드 12건 (미팅 8, 통화 3, 이슈 1)           ││
│  │ • 주요 변화: BC Card 계약 보류, A증권 온보딩 완료        ││
│  │ • 주의 필요: D자산운용 헬스스코어 40 이하 진입           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ 고객별 주요 변화 ──────────────────────────────────────┐│
│  │ BC Card     │ 계약보류 → 예산 재검토 │ 중요도 ■■■■□   ││
│  │ A증권       │ 온보딩 완료           │ 중요도 ■■■□□   ││
│  │ D자산운용   │ 헬스스코어 하락       │ 중요도 ■■■■■   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ 파이프라인 현황 ───────────────────────────────────────┐│
│  │ 잠재 → 진행중 → 완료 → 액티브  (단계별 고객 수 + 변동)  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 6-6. 프론트엔드 hooks

```
frontend/hooks/
├── useMemory.ts                  ← NEW
│   ├── useEpisodicMemories()     # 에피소딕 메모리 목록
│   ├── useSemanticFacts()        # 시맨틱 팩트 목록
│   ├── useMemorySearch()         # 하이브리드 검색
│   ├── useMemoryTimeline()       # 통합 타임라인
│   ├── useAddEpisode()           # 에피소드 추가 mutation
│   ├── useConfirmFact()          # 팩트 확인 mutation
│   └── useInvalidateFact()       # 팩트 무효화 mutation
│
└── useReports.ts                 ← NEW
    ├── useDailyReport()          # 일간 보고
    └── useWeeklyReport()         # 주간 보고
```

---

## 7. 임베딩 전략

### 모델
- **OpenAI `text-embedding-3-small`** (1536차원, $0.02/1M 토큰)
- llm-connector에 이미 OpenAI 키 존재, 비용 추적 인프라 활용

### 인덱싱 정책
- **쓰기 시**: CustomerContextManager.syncKnowledgeChunks() 후 비동기 임베딩 큐
- **에피소드 생성 시**: 즉시 임베딩 (텍스트가 짧아 지연 미미)
- **팩트 생성 시**: 추출과 동시에 임베딩
- **배치 백필**: 기존 knowledge_chunks 일괄 임베딩 (1회성, ~$0.01)

---

## 8. 사용 시나리오 상세

### 시나리오 A — 고객 Q&A (Slack)
```
담당자: "BC Card 수수료 관련 최근 논의 상황은?"

Reno 내부:
1. search_crm_memory(customer_name="BC Card", query="수수료 논의", memory_types=["episodic", "facts"])
2. 에피소딕: 3건 매칭 (1월 협의, 2월 확정, 3월 보류)
3. 팩트: "거래 건당 0.1% 합의" (2월 확인), "예산 재검토로 보류" (3월 확인)
4. 통합 응답 생성

Reno: "BC Card 수수료 논의 현황입니다:
- 1월: 커스터디 수수료 구조 협의 시작
- 2월: 거래 건당 0.1% 기본 수수료로 합의, 법무 검토 요청
- 3월: 예산 재검토 지시로 계약 보류 상태
현재 김OO 부장 측에서 예산 재승인을 기다리고 있습니다."
```

### 시나리오 B — 미팅 전 브리핑
```
담당자: "내일 BC Card 미팅 브리핑해줘. 커스터디 제안 가져가야 해."

Reno 내부:
1. search_crm_memory → 고객 이력 + 현재 상태
2. search_legal_reference(query="가상자산 커스터디 규제") → 다나와에서 특금법 조항
3. 통합 브리핑 생성

Reno: "[고객 현황] BC Card 김OO 부장 — 계약 보류(3월), 규제 리스크 우려 강함
[오늘 핵심] 특금법 제7조 충족 현황 먼저 제시 → Fireblocks 기술적 요건 충족 설명
[관련 법령] 특금법 제7조 (가상자산사업자 신고), 시행령 제10조..."
```

### 시나리오 C — 제안서 초안 생성
```
담당자: "싱가포르 MAS 규정과 한국 특금법 비교해서 크로스보더 제안서 법령 섹션 써줘"

Reno 내부:
1. search_legal_reference(query="MAS Payment Services Act 가상자산", document_types=["법률"])
2. search_legal_reference(query="특금법 가상자산사업자", document_types=["법률"])
3. 비교표 + 컴플라이언스 근거 생성
```

### 시나리오 D — 팀 인수인계
```
신규 담당자: "A증권사 계정 전체 현황 알려줘"

Reno 내부:
1. search_crm_memory(customer_name="A증권", memory_types=["knowledge", "episodic", "facts"])
2. 전체 맥락 요약: 프로젝트 현황, 담당자 성향, 미팅 이력, 주의사항
```

### 시나리오 E — 경영진 일간/주간 보고
```
경영진: "/report weekly" (Slack) 또는 웹 대시보드 조회

ReportGenerator 내부:
1. 지난 1주일 신규 에피소딕 메모리 집계
2. 헬스스코어 변동 고객 추출
3. 파이프라인 단계별 변동 계산
4. Claude로 경영진 요약 보고서 생성
```

---

## 9. 단계별 로드맵

### Phase 1 — 벡터 기반 + 접근 제어 기반 구축 (Week 1-2)
- [ ] pgvector 확장 설치 + 마이그레이션 044 실행 (벡터 + confidentiality 컬럼)
- [ ] 마이그레이션 047 실행 (access_groups, user_groups, customer_access_groups)
- [ ] 고객 테이블 default_confidentiality 컬럼 추가
- [ ] `MemoryAccessService.ts` 구현 (권한 조회 + 캐싱)
- [ ] `ConfidentialityResolver.ts` 구현 (상속 + 카테고리 규칙)
- [ ] `EmbeddingService.ts` 구현
- [ ] `HybridSearchService.ts` 구현 (권한 필터 포함)
- [ ] 기존 knowledge_chunks 백필
- [ ] `search_crm_memory` 도구를 RenoAgent에 추가 (knowledge 타입 + 권한 적용)
- [ ] 팀/그룹 관리 API + 어드민 UI
- **검증**: 기존 FTS 검색 정상 + 시맨틱 검색 + 권한별 결과 차이 확인

### Phase 2 — 에피소딕 메모리 (Week 3)
- [ ] 마이그레이션 045 실행
- [ ] `EpisodicMemoryManager.ts` 구현
- [ ] `store_episodic_memory` 도구 추가
- [ ] 미팅노트 → 에피소드 자동 생성 연동
- [ ] 프론트엔드: `MemoryIntelligenceTab` + `EpisodicTimeline` 구현
- **검증**: Slack에서 에피소드 저장 → 대시보드에서 조회

### Phase 3 — 시맨틱 팩트 + 대시보드 (Week 4)
- [ ] 마이그레이션 046 실행
- [ ] `SemanticFactExtractor.ts` 구현 (Claude 팩트 추출 + 모순 감지)
- [ ] 프론트엔드: `SemanticFactCards`, `SearchResults`, `SemanticSearchBar`
- [ ] 고객 목록 테이블에 메모리 상태 열 추가
- **검증**: 에피소드 → 팩트 자동 추출, 대시보드에서 팩트 확인/무효화

### Phase 4 — 다나와 연동 (Week 4-5)
- [ ] `@modelcontextprotocol/sdk` 설치
- [ ] `DanawaClient.ts` 구현 + 연결 테스트
- [ ] `search_legal_reference` 도구 추가
- [ ] 검색바에 "법률참조" 토글 추가
- **검증**: Reno에서 법률 질문 → 다나와 결과 반환

### Phase 5 — 보고 + 통합 (Week 5-6)
- [ ] `ReportGenerator.ts` 구현
- [ ] 경영진 보고 API + 프론트엔드 페이지
- [ ] `MemoryOrchestrator.ts` 완성 (모든 소스 통합)
- [ ] MeetingPrepGenerator 리팩토링 (MemoryOrchestrator 활용)
- [ ] 전체 E2E 시나리오 테스트
- **검증**: 5개 시나리오 모두 동작 확인

---

## 10. 설정 / 환경변수

```env
# 임베딩 (기존 OPENAI_API_KEY 활용)
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BATCH_SIZE=100

# 다나와
DANAWA_MCP_URL=http://10.10.10.235:8989/sse
DANAWA_ENABLED=true

# 메모리
MEMORY_HYBRID_SEARCH_ENABLED=true
```

---

## 11. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| pgvector 미설치 | 마이그레이션 실패 | `CREATE EXTENSION` 전 권한 확인, 실패 시 FTS fallback |
| 임베딩 API 지연 | 쓰기 경로 느려짐 | 비동기 큐로 처리, 사용자 응답 차단 없음 |
| 다나와 서버 다운 | 법률 검색 불가 | graceful fallback ("참조 서비스 연결 불가"), Reno 나머지 기능 정상 |
| 한국어 임베딩 품질 | 검색 정확도 저하 | text-embedding-3-small 한국어 성능 우수, 부족 시 -large 전환 |
| 팩트 추출 오류 | 잘못된 팩트 저장 | confidence 점수 + 사용자 확인/무효화 UI로 보정 |
| 기밀 데이터 누출 | 권한 없는 사용자 조회 | 모든 조회 경로에 MemoryAccessService 필수 적용. Reno 포함 |
| 그룹 미할당 사용자 | 데이터 접근 불가 | 신규 사용자 기본 그룹 자동 할당 (e.g., '전체') |
| 자동 분류 오류 | 공개 데이터가 기밀로 또는 반대 | 카테고리 규칙은 보수적 (의심 시 기밀). 수동 오버라이드 UI 제공 |

---

## 12. 비용 추정

| 항목 | 월 비용 (예상) |
|------|--------------|
| OpenAI 임베딩 | ~$5 (현재 규모 기준) |
| Claude API (팩트 추출, 보고서) | 기존 사용량 내 (llm-connector 관리) |
| 인프라 | 추가 없음 (기존 PostgreSQL) |
| **합계** | **~$5/월 추가** |

---

## 13. 검증 계획

1. **단위 테스트**: HybridSearchService RRF 정확도, SemanticFactExtractor 모순 감지
2. **통합 테스트**: Reno 도구 호출 → DB 저장/조회 E2E
3. **Slack 테스트**: 각 시나리오별 실제 대화 테스트
4. **대시보드 테스트**: 메모리 탭 UI 조회/검색/팩트 관리
5. **성능 테스트**: 1000+ 청크에서 하이브리드 검색 응답시간 < 500ms
