# PRD v2 — 자연어 기반 고객 Knowledge Graph CRM

**버전**: v2.0
**작성일**: 2026. 03. 16.
**이전 버전**: v1.1 (2026. 03. 13.)
**대상 레포**: WBSalesHub (`/mnt/c/GitHub/WBSalesHub`)

---

## 1. Context — v1.1에서 무엇이 바뀌는가

### v1.1의 한계

v1.1은 3층 메모리(Knowledge Chunks, Episodic Memory, Semantic Facts)와 하이브리드 검색(RRF)을 도입하여 "고객에 대해 아는 것"을 잘 저장·검색할 수 있게 했다. 그러나:

1. **사람이 여전히 폼을 채움** — 고객 기본정보(회사명, 담당자, 단계 등)는 RDB 폼에 수동 입력. KG는 보조 역할.
2. **CRM 프로세스 관리 부재** — 딜(Deal) 엔티티가 없고, 접촉 빈도 추적이 없고, 파이프라인 이력이 유실됨.
3. **3대 관계 유형 미구분** — 고객, 파트너, 금융당국이 모두 `customers` 테이블에 혼재.
4. **프로젝트에 KG 없음** — 프로젝트 단위 에피소드·팩트 축적 불가.

### v2 핵심 전환

```
v1.1: 사람 → 폼 입력 → RDB → AI가 KG 축적 (보조)
v2:   사람 → 자연어 → AI가 전부 구조화 → KG가 곧 DB → 사람은 리뷰만
```

**사람은 폼을 채우지 않는다.** 미팅 녹취, 메모, 채팅만 입력하면 AI가 엔티티, 관계, 팩트, 타임라인을 자동 구조화한다.

### 목표 결과

- 미팅 녹취 업로드 → AI가 고객 정보, 합의 사항, 다음 액션까지 자동 추출
- "BC Card 미팅 준비해줘" → 고객 이력 + 법률 근거 + 시간축 변화 통합 브리핑
- 고객/파트너/대관 프로젝트를 하나의 KG에서 통합 관리
- 경영진 일간/주간 보고 자동 생성

---

## 2. 핵심 결정사항

| 항목 | v1.1 결정 | v2 변경 |
|------|----------|---------|
| 입력 방식 | 폼 입력 + 메모 | **자연어만** (녹취 전문 1순위) |
| 데이터 구조화 | 사람이 RDB 입력, AI가 KG 보조 | **AI가 전부 구조화**, 사람은 리뷰만 |
| 엔티티 유형 | 구분 없음 (모두 customer) | **client / partner / authority** 3유형 |
| 프로젝트 | KG와 분리 | **KG에 직접 연결** (project_id) |
| 정확도 보장 | N/A | **신뢰도 등급제** (🟢🟡🔴) |
| 정보 출처 추적 | 없음 | **전 KG 레이어에 submitted_by 필수** — 누가 올린 정보인지 100% 추적 |
| 메모리 저장소 | PostgreSQL + pgvector | 유지 |
| 다나와 연동 | 법률 + 내부문서 | 유지 |
| 접근 제어 | 그룹/팀 기반 ACL | 유지 + **입력자(submitted_by) 기반 권한 분리** |

---

## 3. 3대 추적 대상

웨이브릿지의 비즈니스 관계는 세 축으로 구성된다.

### 3-1. 고객 (Client) — entity_type = 'client'

WB Prime 서비스 이용사. 교환, 커스터디 등 딜 기반 서비스.

**추적 대상**: 온보딩 절차, 딜 진행, 계약 조건, 요구사항, 미팅 이력

### 3-2. 파트너 (Partner) — entity_type = 'partner'

WB Korea & Global 협업사. 이니셜 미팅부터 프로젝트 단위 협업.

**추적 대상**: 이니셜 미팅, 협업 프로젝트, 관계 발전 이력

### 3-3. 프로젝트 (Project)

두 가지 유형:
- **BD 프로젝트** (`category = 'bd'`) — 파트너 협업 프로젝트
- **대관 프로젝트** (`category = 'government'`) — 금감원, 금융위 대관

**추적 대상**: 프로젝트별 에피소드, 팩트, 문서(대관), 참여 조직

### 3-4. 하나의 KG, 두 개의 축

```
축 1: 조직 (WHO) — 고객 / 파트너 / 기관
축 2: 프로젝트 (WHAT) — BD / 대관

모든 에피소드·팩트가 customer_id(조직) + project_id(프로젝트) 양쪽에 귀속 가능.
"3월 5일 A사 미팅"은 A사(조직) + ETF 프로젝트(프로젝트) 양쪽에 연결.
```

---

## 4. 자연어 입력 파이프라인

### 4-1. 입력 소스 (우선순위)

| 순위 | 소스 | AI 추출 정확도 | 비고 |
|:----:|------|:-------------:|------|
| 1 | 🎙️ 미팅 녹취 전문 | **92%+** | RTZR STT → 화자 구분 → 맥락 파악 최적 |
| 2 | 📝 상세 미팅 메모 | 85% | 담당자가 정리한 요약 |
| 3 | 💬 Slack / 채팅 | 80% | 실시간 대화에서 자동 수집 |
| 4 | 📋 한줄 자연어 노트 | 70% | 간단한 메모 |

### 4-2. 녹취 전문이 정확도를 높이는 이유

| 항목 | 메모 기반 | 녹취 전문 기반 |
|------|:---------:|:-------------:|
| 합의 vs 제안 구분 | 65% | **93%+** |
| 금액/수수료 정확도 | 70% | **92%+** |
| 경쟁사 정보 포착 | 50% | **85%+** |
| 참석자 발언 귀속 | 불가 | **95%+** |
| 숨은 맥락 (본인도 인식 못한 중요 정보) | 유실 | **포착 가능** |

메모는 "담당자가 중요하다고 판단한 것"만 포함. 녹취 전문은 본인이 빠뜨린 정보까지 포함.

### 4-3. AI 구조화 파이프라인

```
자연어 입력 (녹취/메모/채팅)
    │
    ▼
① 엔티티 인식 — 회사, 사람, 프로젝트명 추출
    │
    ▼
② 엔티티 병합 — "BC카드" = "비씨카드" = "BC Card" 동일 인식
    │
    ▼
③ 관계 추출 — "A사가 B사를 소개", "김부장이 이 건 담당"
    │
    ▼
④ 팩트 추출 + 신뢰도 — "수수료 0.1% 합의" (confidence: 92)
    │
    ▼
⑤ 이벤트/타임라인 — 에피소딕 메모리 자동 생성
    │
    ▼
⑥ 중요 항목 플래그 — 금액, 마감일, 단계 변경 표시
    │
    ▼
KG 자동 저장 + 신뢰도 등급별 처리
```

### 4-4. 신뢰도 등급제

AI 추출 결과를 신뢰도에 따라 3등급으로 분류.

| 등급 | 신뢰도 | 처리 | 해당 항목 |
|:----:|:------:|------|----------|
| 🟢 | 85%+ | **자동 확정** — 사람 확인 불필요 | 미팅 요약, 감정, 요구조건, 관계, 참석자 |
| 🟡 | 70-85% | **추출 + 확인 요청** — 알림으로 간단 확인 | 엔티티 병합, 팩트 분류 |
| 🔴 | <70% | **추출 + 반드시 확인** — 승인 전 미반영 | 금액, 마감일, 파이프라인 단계 |

**녹취 전문 있을 때**: 🟢 9개 / 🟡 1개 / 🔴 거의 없음
**메모만 있을 때**: 🟢 6개 / 🟡 2개 / 🔴 2개

사용자 체감: 미팅 녹취 올리면 → AI가 10개 항목 추출 → 7개 자동 저장 → 2개 "맞나요?" 탭 확인 → 1개 금액 확인. **폼 입력 제로.**

### 4-5. 정보 출처 추적 (Provenance Tracking)

KG에 저장되는 **모든 정보는 "누가 올린 것인지" 100% 추적 가능**해야 한다. 이는 단순 로깅이 아니라 **접근 제어의 핵심 기반**이다.

#### 왜 중요한가

| 이유 | 설명 |
|------|------|
| **권한 분리의 기반** | 조회 권한은 "누가 올린 정보인가"에 따라 결정됨. A팀이 올린 고객 메모를 B팀이 볼 수 있는지는 입력자의 소속·권한에서 파생 |
| **책임 소재** | AI가 잘못 추출한 팩트 → 원본 입력자를 추적하여 검증 요청 가능 |
| **감사 추적** | 규제 관련 정보는 "누가 언제 입력했는지" 감사 대상 |
| **신뢰도 보정** | 같은 정보도 입력자에 따라 신뢰도가 달라질 수 있음 (담당자 직접 입력 vs 간접 전달) |

#### 추적 체계

```
모든 입력 → submitted_by (입력자 accounts.id) 필수 태깅

입력 채널별 자동 태깅:
  🎙️ 녹취 업로드     → 업로드한 사용자의 accounts.id
  📝 웹 메모 입력     → 작성한 사용자의 accounts.id
  💬 Slack 수집 (Reno) → 메시지 작성자의 accounts.id (Slack user → accounts 매핑)
  🤖 AI 자동 추출      → submitted_by = 원본 입력자 (AI는 중개자, 출처는 사람)
```

#### 전파 규칙

```
원본 입력 (녹취/메모/채팅)
    │ submitted_by = 입력자
    ▼
extraction_queue
    │ submitted_by = 입력자 (그대로 전파)
    ▼
┌───────────┬───────────────┬──────────────┐
│ Episodic  │ Semantic Fact │ Knowledge    │
│ Memory    │               │ Chunk        │
│           │               │              │
│ submitted_by = 입력자      │ submitted_by = 입력자     │
└───────────┴───────────────┴──────────────┘

핵심: AI가 추출한 결과물도 원본 입력자가 submitted_by.
      AI는 도구일 뿐, 정보의 출처는 항상 사람.
```

#### 접근 제어와의 관계

기존 접근 제어(그룹/기밀등급)에 **입력자 기반 필터**가 추가된다:

```
조회 시 접근 판정:
  1. 그룹 기반 ACL (v1.1) → 해당 고객에 접근 가능한가?
  2. 기밀 등급 (v1.1) → public/confidential 어디까지 볼 수 있는가?
  3. 입력자 기반 (v2 신규) → 입력자가 속한 팀의 정보를 볼 권한이 있는가?

예시:
  - A팀 담당자가 올린 미팅 메모 → A팀원 + 매니저 조회 가능
  - B팀 담당자가 올린 같은 고객 메모 → B팀원 + 매니저 조회 가능
  - MASTER 권한 → 전체 조회
```

---

## 5. 데이터 모델

### 5-1. 기존 테이블 변경

#### customers 테이블에 entity_type 추가

```sql
-- 마이그레이션 050
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'client';
  -- 'client' | 'partner' | 'authority'

CREATE INDEX idx_customers_entity_type ON customers(entity_type);

-- 기존 데이터 매핑 (category_level1 기반)
UPDATE customers SET entity_type = 'client' WHERE entity_type IS NULL;
-- partner, authority는 수동 분류 필요
```

#### projects 테이블 확장

```sql
-- 마이그레이션 051
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS lead_owner_id UUID REFERENCES accounts(id),
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
  -- priority: 'high' | 'medium' | 'low'
```

#### H-KG 3층에 project_id + submitted_by 추가

```sql
-- 마이그레이션 052
-- project_id 추가
ALTER TABLE crm_episodic_memories
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

ALTER TABLE crm_semantic_facts
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

ALTER TABLE customer_knowledge_chunks
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- submitted_by 추가 (정보 출처 추적 — KG 전 레이어 필수)
ALTER TABLE crm_episodic_memories
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES accounts(id);

ALTER TABLE crm_semantic_facts
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES accounts(id);

ALTER TABLE customer_knowledge_chunks
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES accounts(id);

CREATE INDEX idx_episodic_project ON crm_episodic_memories(project_id);
CREATE INDEX idx_facts_project ON crm_semantic_facts(project_id);
CREATE INDEX idx_chunks_project ON customer_knowledge_chunks(project_id);
CREATE INDEX idx_episodic_submitted ON crm_episodic_memories(submitted_by);
CREATE INDEX idx_facts_submitted ON crm_semantic_facts(submitted_by);
CREATE INDEX idx_chunks_submitted ON customer_knowledge_chunks(submitted_by);
```

**귀속 규칙**:
- `customer_id`만 → 조직 수준 (일반 활동)
- `project_id`만 → 프로젝트 전용 (내부 논의)
- 둘 다 → 교차 귀속 (A사와의 미팅이 X프로젝트 관련)

### 5-2. 신규 테이블

#### 온보딩 추적 (고객 전용)

```sql
-- 마이그레이션 053
CREATE TABLE onboarding_tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_type    VARCHAR(30) NOT NULL,
    -- 'exchange' | 'custody' | 'otc' | 'csp' | 'escrow'
  status          VARCHAR(20) DEFAULT 'not_started',
    -- 'not_started' | 'in_progress' | 'completed' | 'suspended'
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  current_step    VARCHAR(100),
  steps_completed JSONB DEFAULT '[]',
    -- [{ "step": "KYC 접수", "completed_at": "...", "note": "..." }]
  assigned_to     UUID REFERENCES accounts(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_customer ON onboarding_tracks(customer_id);
CREATE INDEX idx_onboarding_status ON onboarding_tracks(status);
```

#### 대관 문서 추적 (대관 프로젝트 전용)

```sql
-- 마이그레이션 054
CREATE TABLE regulatory_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  authority_id    UUID REFERENCES customers(id),
    -- entity_type='authority'인 기관
  doc_type        VARCHAR(30) NOT NULL,
    -- 'submission' | 'response' | 'inquiry' | 'approval' | 'memo'
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  submitted_at    TIMESTAMPTZ,
  received_at     TIMESTAMPTZ,
  deadline        DATE,
  status          VARCHAR(20) DEFAULT 'draft',
    -- 'draft' | 'submitted' | 'acknowledged' | 'responded' | 'closed'
  file_path       VARCHAR(500),
  created_by      UUID REFERENCES accounts(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regdoc_project ON regulatory_documents(project_id);
CREATE INDEX idx_regdoc_authority ON regulatory_documents(authority_id);
CREATE INDEX idx_regdoc_status ON regulatory_documents(status);
```

#### Semantic Facts 카테고리 확장

```sql
-- 마이그레이션 055
-- fact_category에 신규 값 허용 (VARCHAR이므로 DDL 변경 불필요)
-- 코드 레벨에서 타입 추가:
--   기존: preference, constraint, relationship, history, technical, financial, regulatory
--   추가: deal_status, requirement
```

#### AI 추출 큐 (신뢰도 등급제 핵심)

```sql
-- 마이그레이션 056
CREATE TABLE extraction_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type       VARCHAR(30) NOT NULL,
    -- 'transcript' | 'memo' | 'slack' | 'note'
  source_id         UUID,
  submitted_by      UUID NOT NULL REFERENCES accounts(id),
    -- 정보 출처: 녹취 업로더, 메모 작성자, Slack 메시지 작성자
  raw_text          TEXT NOT NULL,
  extracted_entities JSONB DEFAULT '[]',
    -- [{ "type": "organization|person|project", "name": "...", "confidence": 85 }]
  extracted_facts   JSONB DEFAULT '[]',
    -- [{ "category": "...", "text": "...", "confidence": 90 }]
  extracted_relations JSONB DEFAULT '[]',
    -- [{ "from": "...", "to": "...", "type": "소개|소속|참여", "confidence": 80 }]
  extracted_events  JSONB DEFAULT '[]',
    -- [{ "type": "meeting|call|...", "summary": "...", "occurred_at": "..." }]
  confidence_level  VARCHAR(10) NOT NULL DEFAULT 'yellow',
    -- 'green' | 'yellow' | 'red'
  review_status     VARCHAR(20) DEFAULT 'pending',
    -- 'pending' | 'auto_approved' | 'approved' | 'modified' | 'rejected'
  reviewed_by       UUID REFERENCES accounts(id),
  reviewed_at       TIMESTAMPTZ,
  applied_at        TIMESTAMPTZ,
    -- KG에 실제 반영된 시점
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extraction_status ON extraction_queue(review_status);
CREATE INDEX idx_extraction_confidence ON extraction_queue(confidence_level);
CREATE INDEX idx_extraction_submitted ON extraction_queue(submitted_by);
```

#### 엔티티 병합 이력

```sql
-- 마이그레이션 057
CREATE TABLE entity_merge_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity   VARCHAR(255) NOT NULL,
    -- 병합 전 이름 ("비씨카드")
  target_entity_id UUID NOT NULL,
    -- 병합 대상 customers.id
  target_entity_name VARCHAR(255) NOT NULL,
    -- 병합 대상 이름 ("BC카드")
  merge_type      VARCHAR(20) NOT NULL,
    -- 'auto' | 'user_confirmed' | 'user_rejected'
  confidence      SMALLINT,
  merged_by       UUID REFERENCES accounts(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5-3. v1.1 테이블 유지

다음 테이블은 v1.1에서 그대로 유지:
- `customer_knowledge_chunks` (+ project_id 추가)
- `crm_episodic_memories` (+ project_id 추가)
- `crm_semantic_facts` (+ project_id 추가)
- `access_groups`, `user_groups`, `customer_access_groups`

접근 제어 시스템(v1.1 섹션 3)은 전체 유지.

---

## 6. 시스템 아키텍처

```
사용자 (Slack / 웹)
    │
    ├── 🎙️ 녹취 업로드 (RTZR STT → 전문)
    ├── 📝 메모 입력
    ├── 💬 Slack 대화
    │
    ▼
EntityExtractor (Claude)
    ├── 엔티티 인식 + 병합
    ├── 관계 추출
    ├── 팩트 추출 + 신뢰도
    ├── 이벤트 구성
    │
    ▼
ExtractionReviewService
    ├── 🟢 자동 확정 → KG 즉시 반영
    ├── 🟡 확인 요청 → Slack 알림 / 웹 리뷰 큐
    └── 🔴 반드시 확인 → 웹 리뷰 큐 (승인 전 미반영)
    │
    ▼
KG (PostgreSQL + pgvector)
    ├── Knowledge Chunks (FTS + vector)
    ├── Episodic Memory (시간순 이벤트)
    ├── Semantic Facts (추출된 사실)
    │
    ▼
MemoryOrchestrator
    ├── HybridSearchService (FTS + vector RRF)
    ├── DanawaClient (법률/내부문서)
    └── 접근 제어 (MemoryAccessService)
    │
    ▼
RenoAgent (Claude) → 응답 생성
```

### KG 노드/엣지 구조

```
노드 유형:
  Organization (entity_type: client|partner|authority)
  Person (담당자, 참석자)
  Project (category: bd|government)
  Event (미팅, 통화, 제출 등) → crm_episodic_memories
  Fact (추출된 사실) → crm_semantic_facts
  Document (대관 문서, 계약서) → regulatory_documents

공통 속성 (모든 노드):
  submitted_by — 이 정보를 입력한 사람 (accounts.id)
  source_type  — 입력 채널 (transcript|memo|slack|note)
  created_at   — 생성 시점

엣지 유형:
  소속 (Person → Organization)
  참여 (Organization → Project)
  발생 (Event → Organization, Event → Project)
  근거 (Fact → Event)
  모순 (Fact ⟶ Fact, contradicted_by)
  제출 (Document → Organization)
```

---

## 7. 백엔드 컴포넌트

### 7-1. 신규 파일

```
server/modules/reno/memory/
├── EntityExtractor.ts          # 자연어 → 엔티티/관계/팩트 추출 (Claude)
├── EntityMerger.ts             # "BC카드"="비씨카드" 엔티티 병합
├── ExtractionReviewService.ts  # 신뢰도 등급 판정 + 확인 큐 관리
└── (기존 파일 유지)

server/services/
├── onboardingService.ts        # 온보딩 CRUD + 단계 변경 → 에피소드 자동 생성
├── regulatoryDocService.ts     # 대관 문서 CRUD + 제출/수신 → 에피소드 자동 생성
└── extractionQueueService.ts   # 추출 큐 관리 + 리뷰 API

server/routes/
├── onboardingRoutes.ts         # /api/onboarding/*
├── regulatoryDocRoutes.ts      # /api/regulatory-docs/*
└── extractionRoutes.ts         # /api/extractions/*
```

### 7-2. 수정 파일

| 파일 | 변경 |
|------|------|
| `server/modules/reno/memory/types.ts` | FactCategory에 `'deal_status' \| 'requirement'` 추가, 전 인터페이스에 `project_id` + `submitted_by` 추가, ExtractionResult 타입 정의 |
| `server/modules/reno/memory/HybridSearchService.ts` | project_id 필터 지원, entity_type 필터 지원 |
| `server/modules/reno/memory/SemanticFactExtractor.ts` | 새 카테고리 반영, 신뢰도 등급 반환 |
| `server/modules/reno/memory/EpisodicMemoryManager.ts` | project_id 지원, `createFromTranscript()` 메서드 추가 |
| `server/modules/reno/memory/MemoryOrchestrator.ts` | 프로젝트 단위 검색 + 엔티티 타입 필터 |
| `server/modules/reno/agent/RenoAgent.ts` | 신규 도구 추가 (extract_from_transcript, review_extraction) |

### 7-3. EntityExtractor 핵심 로직

```typescript
// 입력: 녹취 전문 또는 메모
// 출력: 엔티티, 관계, 팩트, 이벤트 + 각각의 신뢰도
// submitted_by는 추출 결과 전체에 전파 (원본 입력자 = 정보 출처)

interface ExtractionResult {
  submitted_by: string;  // 원본 입력자 accounts.id — KG 저장 시 모든 레이어에 전파
  entities: Array<{
    type: 'organization' | 'person' | 'project';
    name: string;
    confidence: number;
    attributes?: Record<string, string>;  // 직책, 부서 등
  }>;
  facts: Array<{
    category: FactCategory;
    text: string;
    confidence: number;
    related_entity?: string;  // 어떤 조직/프로젝트에 귀속
  }>;
  relations: Array<{
    from: string;
    to: string;
    type: string;  // '소개', '소속', '경쟁', '협업'
    confidence: number;
  }>;
  events: Array<{
    type: EpisodeType;
    summary: string;
    key_facts: string[];
    participants: string[];
    sentiment: Sentiment;
    importance: number;
    occurred_at: string;
  }>;
}
```

### 7-4. 신규 API 엔드포인트

#### 추출 관련

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/extractions/transcript` | 녹취 전문 업로드 → AI 추출 시작 |
| POST | `/api/extractions/memo` | 메모 텍스트 → AI 추출 시작 |
| GET | `/api/extractions/queue` | 리뷰 대기 큐 목록 |
| PUT | `/api/extractions/:id/approve` | 추출 결과 승인 → KG 반영 |
| PUT | `/api/extractions/:id/modify` | 수정 후 승인 |
| PUT | `/api/extractions/:id/reject` | 거부 (KG 미반영) |

#### 온보딩 관련

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/onboarding/:customerId` | 고객의 온보딩 트랙 목록 |
| POST | `/api/onboarding` | 온보딩 트랙 생성 |
| PUT | `/api/onboarding/:id/step` | 단계 진행 (→ 에피소드 자동 생성) |

#### 대관 문서 관련

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/regulatory-docs/project/:projectId` | 프로젝트의 대관 문서 목록 |
| POST | `/api/regulatory-docs` | 문서 등록 (→ 에피소드 자동 생성) |
| PUT | `/api/regulatory-docs/:id/status` | 문서 상태 변경 |

---

## 8. 사용 시나리오

### 시나리오 A — 미팅 녹취 업로드 (핵심 시나리오)

```
담당자: BC Card 미팅 녹취 파일 업로드

시스템 내부:
1. RTZR STT → 전문 텍스트 생성 (화자 구분 포함)
2. EntityExtractor → Claude로 분석:
   - 엔티티: BC Card(기관), 김OO(사람/부장), 이OO(사람/실무자)
   - 팩트: "수수료 0.1% 합의" (financial, 92%), "4월 법무 검토 예정" (deal_status, 88%)
   - 관계: "김OO → BC Card 소속" (95%)
   - 이벤트: meeting, positive, importance 85

3. ExtractionReviewService:
   - 🟢 자동: 미팅 요약, 참석자, 감정, 관계 → 즉시 KG 반영
   - 🟡 확인: "BC카드 = 기존 BC Card 맞나요?" → Slack 알림
   - 🟢 자동(녹취라서): "수수료 0.1% 합의" → 맥락 충분, 자동 반영

담당자 체감: 파일 올리고 끝. 알림 하나 탭으로 확인.
```

### 시나리오 B — 파트너 협업 프로젝트 추적

```
담당자: "A사와 ETF 인덱스 공동개발 미팅 메모" 입력

시스템:
1. EntityExtractor → A사(partner), ETF 인덱스 프로젝트(bd)
2. 에피소드: project_id=ETF프로젝트 + customer_id=A사 (교차 귀속)
3. 팩트: "A사 데이터 API 6월 제공 예정" (deal_status)

Reno: "A사 ETF 프로젝트 현황" 질문 →
  project_id 기반 에피소드 + 팩트 + A사 조직 정보 통합 답변
```

### 시나리오 C — 대관 프로젝트

```
담당자: "금감원에 VASP 신고서 제출함" 메모

시스템:
1. EntityExtractor → 금감원(authority), VASP 신고(government 프로젝트)
2. regulatory_documents 자동 생성 (doc_type: submission, status: submitted)
3. 에피소드: project_id=VASP대관 + customer_id=금감원
4. 팩트: "VASP 신고서 2026-03-16 제출 완료" (regulatory, 95%)

Reno: "금감원 대관 진행상황" →
  대관 프로젝트별 문서 목록 + 에피소드 + 마감일 정리
```

### 시나리오 D~E (v1.1 유지)

- 시나리오 D (팀 인수인계): v1.1과 동일
- 시나리오 E (경영진 보고): v1.1과 동일 + 엔티티 타입별 현황 추가

---

## 9. 접근 제어

v1.1의 접근 제어 시스템(섹션 3) 전체 유지.

### 9-1. 기존 ACL (유지)

- 그룹/팀 기반 고객 접근 권한
- 정보별 기밀 등급 (public / confidential)
- 자동 기밀 분류 규칙 (financial, regulatory → 자동 confidential)

### 9-2. 입력자 기반 접근 제어 (v2 신규)

**submitted_by가 접근 제어의 핵심 축으로 추가된다.**

```
조회 시 3단계 접근 판정:

  ① 그룹 ACL  — 해당 고객/프로젝트에 접근 가능한 그룹인가?
  ② 기밀 등급 — public/confidential 중 어디까지 볼 수 있는가?
  ③ 입력자 팀 — 입력자가 속한 팀의 정보를 볼 권한이 있는가?  ← v2 추가
```

**정책 규칙:**

| 조회자 역할 | 접근 범위 |
|-------------|----------|
| MASTER | 전체 KG 조회 가능 |
| ADMIN | 자기 팀 + 하위 팀 입력자의 정보 |
| MANAGER | 자기 팀 입력자의 정보 |
| USER | 본인이 입력한 정보 + 팀 공유 정보 |

**Slack 수집 시 매핑:**

Reno가 Slack에서 자동 수집한 메시지는 **Slack 메시지 작성자**를 submitted_by로 태깅한다:
- Slack user ID → accounts 매핑 테이블 (기존 Slack 연동에서 관리)
- 매핑 실패 시 → submitted_by = null, 기밀 등급 자동 상향 (confidential)

### 9-3. 테이블별 추가 사항

- `extraction_queue` 리뷰 권한: 해당 고객/프로젝트 접근 권한이 있는 사용자만
- `regulatory_documents`: 기본 confidential (대관 문서는 민감)
- `onboarding_tracks`: 고객 기본 기밀 등급 상속
- **모든 KG 테이블**: submitted_by NOT NULL 제약 (마이그레이션 시 기존 데이터는 created_by로 backfill)

---

## 10. 단계별 로드맵

### Phase 1 — 자연어 입력 파이프라인 (Week 1-2)

v1.1 Phase 1~4 완료 상태에서 시작.

- [ ] 마이그레이션 050: customers에 entity_type 추가
- [ ] 마이그레이션 056: extraction_queue 테이블
- [ ] 마이그레이션 057: entity_merge_log 테이블
- [ ] `EntityExtractor.ts` 구현 (Claude 기반 추출)
- [ ] `EntityMerger.ts` 구현 (엔티티 병합)
- [ ] `ExtractionReviewService.ts` 구현 (신뢰도 등급제)
- [ ] 녹취 전문 업로드 → 추출 → 리뷰 큐 E2E
- **검증**: 녹취 업로드 → 엔티티/팩트 자동 추출 → 신뢰도별 분류 확인

### Phase 2 — 프로젝트 KG 통합 (Week 2-3)

- [ ] 마이그레이션 051: projects 확장
- [ ] 마이그레이션 052: H-KG 3층에 project_id 추가
- [ ] HybridSearchService에 project_id 필터 추가
- [ ] MemoryOrchestrator에 프로젝트 단위 검색 추가
- [ ] 에피소드·팩트의 교차 귀속 (customer_id + project_id)
- **검증**: 프로젝트 기반 검색 → 해당 프로젝트 에피소드/팩트만 반환

### Phase 3 — 온보딩 + 대관 (Week 3-4)

- [ ] 마이그레이션 053: onboarding_tracks
- [ ] 마이그레이션 054: regulatory_documents
- [ ] 마이그레이션 055: fact 카테고리 확장 (deal_status, requirement)
- [ ] onboardingService + 단계 변경 → 에피소드 자동 생성
- [ ] regulatoryDocService + 제출/수신 → 에피소드 자동 생성
- **검증**: 온보딩 단계 진행 → 에피소드 기록, 대관 문서 등록 → 팩트 추출

### Phase 4 — 리뷰 UI + 통합 (Week 4-5)

- [ ] 리뷰 큐 프론트엔드 (추출 결과 확인/수정/승인)
- [ ] 엔티티 병합 UI ("BC카드 = 비씨카드?" 확인)
- [ ] 엔티티 타입별 고객 목록 필터
- [ ] 프로젝트 KG 뷰 (프로젝트별 에피소드/팩트/문서)
- **검증**: 리뷰 큐에서 승인 → KG 반영, 엔티티 병합 정상 동작

### Phase 5 — 보고 + 최적화 (Week 5-6)

- [ ] ReportGenerator에 엔티티 타입별 현황 추가
- [ ] 대관 프로젝트 현황 보고 자동 생성
- [ ] 전체 E2E 시나리오 테스트 (A~E)
- **검증**: 5개 시나리오 + 엔티티 타입별 검색 + 프로젝트별 검색

---

## 11. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| STT 전사 오류 | 엔티티명 오인식 | AI가 문맥 보정 + 엔티티 병합으로 커버 |
| 엔티티 병합 실패 | 동일 조직이 중복 노드 | 🟡 등급으로 사람 확인 요청 + 수동 병합 UI |
| 팩트 추출 오류 | 잘못된 사실 KG에 저장 | 신뢰도 등급제 + confidence 점수 + 무효화 UI |
| 금액/날짜 오판 | 비즈니스 의사결정 오류 | 🔴 등급 → 사람 확인 필수 (승인 전 미반영) |
| 대관 문서 기밀 유출 | 법적 리스크 | regulatory_documents 기본 confidential + 접근 제어 |
| v1.1 → v2 마이그레이션 | 기존 데이터 정합성 | ALTER TABLE 추가만 (기존 컬럼 변경 없음) |

---

## 12. v1.1 대비 변경 요약

| 영역 | v1.1 | v2 |
|------|------|-----|
| 입력 | 폼 + 메모 | **자연어만** (녹취 1순위) |
| 구조화 | 사람이 RDB, AI가 KG | **AI가 전부**, 사람은 리뷰 |
| 엔티티 | 구분 없음 | **3유형** (client/partner/authority) |
| 프로젝트 | KG와 분리 | **KG에 직접 연결** |
| 정확도 보장 | confidence 점수만 | **신뢰도 등급제** (🟢🟡🔴) |
| 정보 출처 추적 | created_by (부분적) | **submitted_by 전 레이어 필수** + 입력자 기반 접근 제어 |
| 온보딩 | 없음 | **전용 추적 테이블** |
| 대관 문서 | 없음 | **전용 추적 테이블** |
| 팩트 카테고리 | 7개 | **9개** (+deal_status, +requirement) |
| 신규 마이그레이션 | 043~049 | **050~057** |

---

## 13. 비용 추정

| 항목 | 월 비용 (예상) |
|------|--------------|
| OpenAI 임베딩 | ~$5 (v1.1과 동일) |
| Claude API (EntityExtractor 추가) | ~$10 추가 (녹취 전문 분석) |
| 인프라 | 추가 없음 (기존 PostgreSQL) |
| **합계** | **~$15/월 추가** |
