# KG(Knowledge Graph) 메모리 구조

> **위치**: WBSalesHub — `server/modules/reno/memory/`
> **마이그레이션**: `server/database/migrations/043~056`

---

## 3층 메모리 구조

```
customer_knowledge_chunks   (RAG 레이어 — FTS + 벡터 검색)
crm_episodic_memories       (에피소딕 메모리 — 사건/대화 기록)
crm_semantic_facts          (시맨틱 팩트 — 정제된 사실)
```

모두 `customer_id`로 고객에 연결. 고객당 N개.

---

## 테이블 상세

### 1. `customer_knowledge_chunks` (RAG 레이어)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | FK → customers |
| chunk_type | VARCHAR(50) | 아래 목록 참조 |
| title | VARCHAR(255) | 선택적 제목 |
| content | TEXT | 청크 본문 (필수) |
| source | VARCHAR(50) | `structured_profile` / `activity` / `narrative_notes` |
| source_key | VARCHAR(100) | 중복 방지 키 (UNIQUE with customer_id) |
| relevance_score | SMALLINT | 0-100 (기본 50) |
| tsvec | TSVECTOR | FTS 생성 컬럼 |
| embedding | vector(1536) | OpenAI text-embedding-3-small |
| embedded_at | TIMESTAMPTZ | NULL = 미임베딩 |
| confidentiality | VARCHAR(20) | `public` / `confidential` |
| access_tier | SMALLINT | 1-4 |
| project_id | UUID | 프로젝트 FK (선택) |

**chunk_type 목록**:
- `sales_status` — 영업 현황
- `contact` — 주요 연락처
- `business_need` — 비즈니스 니즈
- `caution` — 주의사항 (자동 confidential)
- `opportunity` — 기회
- `service_history` — 서비스 이력
- `milestone` — 마일스톤
- `activity` — 활동 기록
- `narrative` — 서술형 메모
- `custom` — 기타

**source_key 예시**:
- `salesStatus`, `businessNeeds[0]`, `keyContacts[1]`
- `activities/{activityId}`, `narrative`

---

### 2. `crm_episodic_memories` (에피소딕 메모리)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | FK |
| episode_type | VARCHAR(50) | `meeting` / `call` / `email_exchange` / `deal_milestone` / `issue` / `relationship_change` / `slack` |
| summary | TEXT | 에피소드 요약 |
| key_facts | JSONB | 주요 팩트 배열 (기본 `[]`) |
| participants | TEXT[] | 참석자 |
| sentiment | VARCHAR(20) | `positive` / `neutral` / `negative` / `mixed` |
| importance | SMALLINT | 0-100 (기본 50) |
| source_type | VARCHAR(50) | `meeting_notes` / `activity` / `slack` / `manual` / `transcript` |
| source_id | UUID | 원본 레코드 ID (멱등성) |
| occurred_at | TIMESTAMPTZ | 발생 시각 |
| embedding | vector(1536) | NULL = 미임베딩 |
| access_tier | SMALLINT | 1-4 |

---

### 3. `crm_semantic_facts` (시맨틱 팩트)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | FK |
| fact_category | VARCHAR(50) | `preference` / `constraint` / `relationship` / `history` / `technical` / `financial` / `regulatory` / `deal_status` / `requirement` |
| fact_text | TEXT | 팩트 내용 |
| confidence | SMALLINT | 0-100 (기본 70) |
| source_episodes | UUID[] | 출처 에피소드 IDs |
| first_observed | TIMESTAMPTZ | 최초 관찰 시각 |
| last_confirmed | TIMESTAMPTZ | 마지막 확인 시각 |
| contradicted_by | UUID | 모순 팩트 ID |
| is_active | BOOLEAN | 활성 여부 |
| embedding | vector(1536) | NULL = 미임베딩 |
| access_tier | SMALLINT | 1-4 |

---

## 청크 생성 흐름

```
structured_profile 업데이트
  └─ CustomerContextManager.syncProfileChunks()
       └─ UPSERT customer_knowledge_chunks (source: structured_profile)

activity 생성
  └─ CustomerContextManager.createActivity()  [비동기 setImmediate]
       └─ INSERT customer_knowledge_chunks (source: activity, chunk_type: activity)

narrative_notes 업데이트
  └─ CustomerContextManager.upsertNarrativeNotes()  [비동기 setImmediate]
       └─ UPSERT customer_knowledge_chunks (source: narrative_notes, chunk_type: narrative)

에피소드 생성 (EpisodicMemoryManager)
  └─ INSERT crm_episodic_memories
       └─ [비동기] 벡터 임베딩 생성
       └─ [비동기] SemanticFactExtractor → crm_semantic_facts

백필 스크립트 (수동)
  └─ Phase A: structured_profile → crm_semantic_facts (AI 없음)
  └─ Phase B: customer_activities → episodic + semantic (AI 사용)
  └─ Phase C: knowledge_chunks → crm_episodic_memories (AI 없음)
```

---

## 접근 제어 (Tier)

| Tier | 대상 역할 | 설명 |
|------|----------|------|
| 4 (EXECUTIVE) | CEO, COO | 전체 KG 접근 |
| 3 (C_LEVEL) | C레벨, ADMIN | 기밀 정보 포함 |
| 2 (TEAM_LEAD) | 팀장, MANAGER | 팀 수준 |
| 1 (ALL) | 일반 직원 | 전사 공통만 |

**자동 기밀 분류**:
- `chunk_type: caution` → `confidential`
- `fact_category: financial, regulatory` → `confidential` + `access_tier ≥ 3`
- `episode_type: deal_milestone, issue` → `confidential`

---

## 백필 스크립트 / API

### CLI 스크립트
```bash
# WBSalesHub
npx ts-node server/scripts/backfill-kg.ts \
  --phase A|B|C|all \
  --dry-run \
  --limit N \
  --customer-id <uuid>
```

### API 엔드포인트 (관리자 전용)
```
POST /api/memory/backfill-key-facts
  body: { limit: 200 }
  → 에피소드에서 key_facts 백필

POST /api/memory/backfill-semantic-embeddings
  body: { batchSize: 100 }
  → embedding NULL 인 레코드 임베딩 생성
  → remaining: 'more' | 'done'
```

### Slack KG 백필
```
WBSalesHub/server/services/slackKgBackfillService.ts
  → Slack 채널 히스토리 → crm_episodic_memories (episode_type: 'slack')
```

---

## 관련 파일 (WBSalesHub)

| 파일 | 역할 |
|------|------|
| `server/modules/reno/memory/EpisodicMemoryManager.ts` | 에피소드 생성/조회/관리 |
| `server/modules/reno/memory/SemanticFactExtractor.ts` | Claude API로 팩트 추출 |
| `server/modules/reno/memory/EmbeddingService.ts` | OpenAI 임베딩 생성 |
| `server/modules/reno/memory/ConfidentialityResolver.ts` | 기밀 등급 자동 판정 |
| `server/modules/reno/memory/types.ts` | 메모리 타입 정의 |
| `server/routes/memoryRoutes.ts` | 백필 API 라우트 |
| `server/scripts/backfill-kg.ts` | 대량 백필 CLI |
| `server/services/slackKgBackfillService.ts` | Slack 히스토리 백필 |

---

마지막 업데이트: 2026-03-17
