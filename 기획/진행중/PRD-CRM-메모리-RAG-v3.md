# PRD v3 — 자연어 기반 고객 Knowledge Graph CRM

**버전**: v3.0
**작성일**: 2026. 03. 16.
**이전 버전**: v2.0 (2026. 03. 16.)
**대상 레포**: WBSalesHub (`/mnt/c/GitHub/WBSalesHub`)

---

## 1. v2.0에서 v3로 — 개선 배경

v2.0은 "자연어만 입력하면 AI가 전부 구조화"하는 핵심 패러다임을 확립했다. v3는 v2.0을 **설계 완성도** 측면에서 보강한다. 외부에서 제안된 6개 개선안을 코드베이스와 대조 검토한 결과:

- **채택 4개** — 접근 제어 단순화, 신뢰도 2등급, onboarding 단순화, 대관 문서 유지 (단 일부 조정)
- **추가 발견 4개** — v2.0 설계에 누락된 구현 세부사항
- **기각 2개** — JSONB 통합 (현재 4컬럼 우수), entity_merge_log 제거 (이미 활발 사용 중)

패러다임 전환 없음. v3는 v2.0을 **정제**한 버전이다.

---

## 2. 개선 사항 총괄

| # | 분류 | 항목 | 핵심 내용 |
|:-:|------|------|----------|
| 1 | v2.1 채택 | **접근 제어 단순화** | Access Tier 4단계 + accounts.role 자동 매핑. 기존 ACL Phase 2에서 점진 제거 |
| 2 | v2.1 채택 | **신뢰도 2등급** | 3색 → AUTO/REVIEW 2등급. 금융/규제/deal_status 팩트 강제 REVIEW |
| 3 | v2.1 채택 | **onboarding 단순화** | current_step만 저장 + 별도 `onboarding_step_log` 테이블로 이력 분리 |
| 4 | 추가 개선 | **Relations 저장 로직** | `applyToKG`에서 relations → 시맨틱 팩트 변환 저장 (중복 시 last_confirmed 갱신) |
| 5 | 추가 개선 | **Embedding 모델 추적** | 전 KG 테이블에 `embedding_model` 컬럼 — 모델 변경 시 재생성 범위 식별 |
| 6 | 추가 개선 | **extraction_queue TTL** | `expires_at` 컬럼 + 보관 정책 (auto: 30일, review pending: 90일) |
| 7 | 추가 개선 | **Confidentiality 소급 갱신** | 고객의 기밀 등급 변경 시 산하 KG 데이터 자동 전파 메커니즘 |
| — | 기각 | JSONB 4→1 통합 | 현재 4컬럼 구조가 부분 수정·쿼리·문서화 측면에서 우수 |
| — | 기각 | entity_merge_log 제거 | Migration 054 + `EntityMerger.ts` 이미 활발 사용 중 |
| — | 기각 | regulatory_documents → KG | 크립토/핀테크 규제 감사 대응에 별도 테이블 필수 |

---

## 3. 접근 제어 재설계 (개선안 1)

### 3-1. 문제: 그룹 ACL의 한계

v2.0의 그룹 기반 ACL(`access_groups`, `user_groups`, `customer_access_groups`)은 **수평적 분리** (팀 A vs 팀 B)에 적합하지만, **수직적 분리** (임원급만 열람 가능한 기밀 정보)에 취약하다. 또한 그룹 관리 오버헤드가 크다.

### 3-2. Access Tier 4단계 시스템

```
Tier 4: EXECUTIVE   — CEO, COO (전체 KG 접근)
Tier 3: C_LEVEL     — C레벨, 팀장 + ADMIN (기밀 포함)
Tier 2: TEAM_LEAD   — 팀장급 MANAGER (팀 수준)
Tier 1: ALL         — 일반 직원 (전사 공통만)
```

**accounts.role → 기본 tier 자동 매핑:**

| accounts.role | 기본 Tier | 의미 |
|:---:|:---:|------|
| MASTER | 4 | 전체 접근 |
| ADMIN | 3 | C_LEVEL 수준 |
| MANAGER | 2 | TEAM_LEAD 수준 |
| USER | 1 | 일반 접근 |

> **개별 override**: `accounts.access_tier` 컬럼으로 role 기본값 덮어쓰기 가능.
> 예: 특정 시니어 담당자에게 Tier 3 부여.

### 3-3. KG 데이터에 tier 태깅

KG 각 레이어(`crm_episodic_memories`, `crm_semantic_facts`, `customer_knowledge_chunks`)에 `access_tier` 컬럼을 추가한다.

**자동 tier 상향 규칙:**

| fact_category | 자동 부여 최소 tier |
|:---:|:---:|
| `financial` | 3 (C_LEVEL) |
| `regulatory` | 3 (C_LEVEL) |
| 그 외 | NULL (부모 고객 tier 상속) |

**조회 필터 로직:**

```sql
-- COALESCE: 항목 자체 tier가 없으면 부모(고객) tier 사용
WHERE COALESCE(item.access_tier, parent.access_tier) <= :user_tier
```

### 3-4. 기존 ACL 점진 제거 로드맵

Phase 1에서는 **기존 `access_groups` 3테이블을 유지**한다. 일부 API가 여전히 그룹 기반 필터를 사용하므로 즉시 제거 시 서비스 단절 위험이 있다.

| Phase | 기간 | ACL 상태 |
|:-----:|------|---------|
| 1 (현재) | v3 배포 ~ +4주 | Access Tier 신규 도입. 기존 그룹 ACL 병행 유지 |
| 2 | +4주 ~ +8주 | 그룹 ACL 의존 API 순차 마이그레이션 |
| 3 | +8주 이후 | `access_groups`, `user_groups`, `customer_access_groups` 테이블 제거 |

### 3-5. 수평 분리 확장 경로

향후 팀 단위 수평 분리가 필요해질 경우, `accounts`에 `team_id`를 추가하고 KG 데이터에 `owner_team_id`를 태깅하는 방식으로 확장한다. Access Tier가 수직 축, team_id가 수평 축을 담당하는 2축 구조로 자연스럽게 발전 가능.

---

## 4. 신뢰도 등급 단순화 (개선안 2)

### 4-1. v2.0 → v3 변경

v2.0은 신뢰도를 🟢🟡🔴 3등급으로 구분했다. 그러나 황색(70-85%) 처리 방식이 모호하고 UX가 복잡하다. v3에서는 **AUTO / REVIEW 2등급**으로 단순화한다.

| 등급 | 조건 | 처리 |
|:----:|------|------|
| **AUTO** | avg ≥ 85% **AND** min ≥ 70% **AND** 금융 팩트 없음 | 자동 확정 → KG 즉시 반영 |
| **REVIEW** | 위 조건 미충족 | 리뷰 큐 → 담당자 확인 후 KG 반영 |

### 4-2. 금융/규제 팩트 강제 REVIEW override

**다음 카테고리의 팩트가 하나라도 포함되면 confidence 수치에 무관하게 REVIEW로 분류:**

```typescript
const FORCE_REVIEW_CATEGORIES = ['financial', 'regulatory', 'deal_status'];
```

**이유**: 금액, 마감일, 거래 상태는 99% confidence라도 사람이 한 번 더 확인해야 한다. 잘못된 팩트가 KG에 자동 저장되면 비즈니스 의사결정에 직접 영향.

### 4-3. 사용자 체감 변화

```
v2.0: "수수료 0.1% 합의" → 🟢 (92%) → 자동... 맞나? 어디서 결정됐는지 모름
v3:   "수수료 0.1% 합의" → REVIEW (financial 카테고리) → 담당자 확인 탭 뜸

v2.0: "BC카드 참석" → 🟢 자동 / "4월 검토" → 🟡 확인 / "0.1% 합의" → 🟢 자동 (혼란)
v3:   미팅 메타정보 → AUTO / 금융·deal 팩트 → REVIEW (일관성)
```

---

## 5. onboarding_tracks 단순화 (개선안 3)

### 5-1. v2.0의 문제

v2.0의 `onboarding_tracks`는 `steps_completed JSONB[]`에 완료 단계 이력을 직접 저장한다. 이는:
- JSONB 배열 append가 락 경합 유발 (다수 사용자 동시 업데이트 시)
- 단계별 검색/통계 쿼리가 JSONB 언팩 필요
- 취소→재시작 등 복잡한 이력 표현 어려움

### 5-2. v3 구조

**`onboarding_tracks`: 현재 상태만 저장**

```sql
-- 마이그레이션 059 (v2.0 053 대체)
CREATE TABLE onboarding_tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_type    VARCHAR(30) NOT NULL,
    -- 'exchange' | 'custody' | 'otc' | 'csp' | 'escrow'
  status          VARCHAR(20) DEFAULT 'not_started',
    -- 'not_started' | 'in_progress' | 'completed' | 'suspended'
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  current_step    VARCHAR(100),          -- 현재 단계명만 저장
  assigned_to     UUID REFERENCES accounts(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_customer ON onboarding_tracks(customer_id);
CREATE INDEX idx_onboarding_status ON onboarding_tracks(status);
```

> `steps_completed JSONB` 컬럼 **제거** — 이력은 `onboarding_step_log`로 분리.

**`onboarding_step_log`: 이력 전용 테이블 (신규)**

```sql
CREATE TABLE onboarding_step_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id        UUID NOT NULL REFERENCES onboarding_tracks(id) ON DELETE CASCADE,
  step_name       VARCHAR(100) NOT NULL,
  action          VARCHAR(20) NOT NULL,
    -- 'started' | 'completed' | 'skipped' | 'reverted'
  note            TEXT,
  performed_by    UUID REFERENCES accounts(id),
  occurred_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_step_log_track ON onboarding_step_log(track_id);
CREATE INDEX idx_step_log_occurred ON onboarding_step_log(occurred_at);
```

### 5-3. 에피소딕 메모리 연동

`onboardingService.ts`의 단계 진행 로직:

```
단계 완료 시:
  1. onboarding_step_log에 INSERT (이력)
  2. onboarding_tracks.current_step 업데이트 (현재 상태)
  3. crm_episodic_memories에 episode_type='deal_milestone' 자동 생성
     → KG에서 온보딩 이력을 시간순으로 검색 가능
```

---

## 6. 추가 개선: Relations 저장 로직

### 6-1. v2.0 누락 사항

v2.0 `extraction_queue.extracted_relations` JSONB에 관계 데이터를 저장하지만, `applyToKG` 로직에서 relations를 KG에 반영하는 명확한 방법이 정의되어 있지 않았다.

### 6-2. v3 구현 방식

**Relations → `crm_semantic_facts` 변환 저장:**

```
relation: { from: "A사", to: "B사", type: "소개", confidence: 85 }
→ fact: { category: "relationship", text: "A사 → B사 (소개)", confidence: 85 }
```

**중복 처리 규칙:**
- 같은 고객의 동일 relationship 팩트가 이미 존재하면 → `last_confirmed` + `confidence` 갱신 (INSERT 아님)
- 이력이 아닌 **"현재 유효한 관계"**를 유지하는 방식

**이유**: Relations를 별도 테이블로 분리하면 조회 시 JOIN 복잡도 증가. `crm_semantic_facts`의 FTS + vector 검색을 그대로 활용하는 것이 효율적.

---

## 7. 추가 개선: Embedding 모델 추적

### 7-1. 문제

KG에 저장된 embedding 벡터가 어떤 모델로 생성됐는지 기록이 없다. 모델 업그레이드 시 (예: `text-embedding-ada-002` → `text-embedding-3-small`) 재생성이 필요한 레코드를 식별할 수 없다.

### 7-2. v3 컬럼 추가

전 KG 테이블에 `embedding_model VARCHAR(100)` 컬럼 추가:

```sql
-- 마이그레이션 060
ALTER TABLE crm_episodic_memories
  ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);

ALTER TABLE crm_semantic_facts
  ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);

ALTER TABLE customer_knowledge_chunks
  ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);
```

**저장 규칙:**
- 임베딩 생성 시 `EmbeddingService`가 사용한 모델명을 함께 저장
- 예: `'text-embedding-3-small'`, `'text-embedding-ada-002'`
- 임베딩이 없는 레코드: `NULL`

**활용:**

```sql
-- 구버전 모델 레코드 재생성 대상 조회
SELECT COUNT(*) FROM crm_semantic_facts
WHERE embedding_model != 'text-embedding-3-small'
  AND embedding IS NOT NULL;
```

---

## 8. 추가 개선: extraction_queue TTL

### 8-1. 문제

`extraction_queue`는 모든 추출 이력을 무한 보관한다. 수개월 후 리뷰 불필요한 `auto_approved` 항목들이 테이블을 비대화시킨다.

### 8-2. v3 보관 정책

```sql
-- 마이그레이션 061
ALTER TABLE extraction_queue
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
```

**TTL 규칙:**

| review_status | 보관 기간 | 이유 |
|:---:|:---:|------|
| `auto_approved` | 30일 | 자동 처리됨, 감사 최소 기간 |
| `approved` / `modified` | 90일 | 사람이 리뷰한 항목, 분쟁 대비 |
| `rejected` | 90일 | 거부 사유 추적 |
| `pending` | 무제한 | 미결 항목은 삭제 불가 |

**자동 만료 처리 (daily cron):**

```sql
DELETE FROM extraction_queue
WHERE expires_at IS NOT NULL
  AND expires_at < NOW()
  AND review_status != 'pending';
```

**expires_at 자동 설정 (enqueue 시):**

```typescript
const ttlDays = autoApprove ? 30 : 90;
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + ttlDays);
```

---

## 9. 추가 개선: Confidentiality 소급 갱신

### 9-1. 문제

고객의 기밀 등급이 `public` → `confidential`로 변경될 때, 이미 저장된 KG 데이터들(에피소딕 메모리, 시맨틱 팩트, 청크)은 기존 등급을 유지한다. 결과적으로 기밀 상향 후에도 일반 직원이 이전 데이터를 조회할 수 있는 보안 허점이 발생한다.

### 9-2. v3 전파 메커니즘

**트리거 기반 자동 전파:**

```sql
-- 마이그레이션 062
CREATE OR REPLACE FUNCTION propagate_confidentiality_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.default_confidentiality IS DISTINCT FROM OLD.default_confidentiality THEN
    -- 기밀 상향 시: 해당 고객의 모든 KG 데이터를 새 등급으로 갱신
    -- 단, 이미 더 높은 등급('confidential')은 유지
    UPDATE crm_episodic_memories
      SET confidentiality = NEW.default_confidentiality
    WHERE customer_id = NEW.id
      AND confidentiality != 'confidential';

    UPDATE crm_semantic_facts
      SET confidentiality = NEW.default_confidentiality
    WHERE customer_id = NEW.id
      AND confidentiality != 'confidential';

    UPDATE customer_knowledge_chunks
      SET confidentiality = NEW.default_confidentiality
    WHERE customer_id = NEW.id
      AND confidentiality != 'confidential';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_confidentiality
AFTER UPDATE OF default_confidentiality ON customers
FOR EACH ROW EXECUTE FUNCTION propagate_confidentiality_change();
```

**적용 규칙:**
- 등급 **상향** (`public` → `confidential`): 모든 KG 데이터에 전파
- 등급 **하향** (`confidential` → `public`): 전파 **없음** — 개별 항목의 더 높은 기밀 등급은 유지
- `financial`, `regulatory` 카테고리 팩트는 `AUTO_TIER_RULES`로 이미 보호 (중복 처리 불필요)

---

## 10. 데이터 모델 전체 마이그레이션 목록 (v3 기준)

| 번호 | 내용 | v2.0 대비 | Phase |
|:----:|------|:--------:|:-----:|
| 050 | customers.entity_type | 유지 | 1 |
| 051 | projects 확장 | 유지 | 2 |
| 052 | KG 3층 project_id + submitted_by | 유지 | 2 |
| ~~053~~ | ~~onboarding_tracks (v2.0 원안)~~ | **059로 대체** | — |
| 054 | regulatory_documents | 유지 | 3 |
| 055 | fact 카테고리 확장 (deal_status, requirement) | 유지 | 1 |
| 056 | extraction_queue | 유지 | 1 |
| 057 | entity_merge_log | 유지 | 1 |
| **058** | accounts.access_tier + KG access_tier 컬럼 | **v3 신규** | 1 |
| **059** | onboarding_tracks (단순화) + onboarding_step_log | **v3 신규** | 3 |
| **060** | KG 테이블 embedding_model 컬럼 | **v3 신규** | 1 |
| **061** | extraction_queue.expires_at | **v3 신규** | 1 |
| **062** | customers.default_confidentiality + 전파 트리거 | **v3 신규** | 2 |

---

## 11. 백엔드 변경 사항 (v2.0 대비)

### 11-1. 수정 파일

| 파일 | v2.0 → v3 변경 |
|------|--------------|
| `memory/types.ts` | `AccessTier` 타입 + `FORCE_REVIEW_CATEGORIES` + `AUTO_TIER_RULES` 추가. `EpisodicMemory`에 `access_tier`, `embedding_model` 필드 추가 |
| `memory/MemoryAccessService.ts` | Access Tier 기반 완전 재작성. `buildAccessTierFilter()` 신규. 기존 `buildAccessFilter()`는 `@deprecated` 유지 (Phase 2 제거) |
| `memory/ExtractionReviewService.ts` | `determineConfidenceLevel()` 3→2등급. `applyToKG()`에 `saveRelationAsFact()` 추가 |
| `memory/EmbeddingService.ts` | 임베딩 저장 시 `embedding_model` 컬럼도 함께 저장 |
| `services/onboardingService.ts` | `steps_completed` 제거. `onboarding_step_log` INSERT + `current_step` UPDATE로 교체 |

### 11-2. 신규 파일

```
server/jobs/
└── extractionQueueCleaner.ts  # TTL 만료 항목 정기 삭제 (daily cron)
```

### 11-3. 변경 없는 파일

v2.0에서 정의한 다음 파일들은 v3에서 변경 없음:
- `EntityExtractor.ts`, `EntityMerger.ts` — v2.0 설계 그대로
- `HybridSearchService.ts`, `MemoryOrchestrator.ts` — Access Tier 필터는 `MemoryAccessService` 내부에서 처리
- `regulatoryDocService.ts`, `extractionQueueService.ts` — API 계약 유지
- 전 라우터 파일 — API 경로 변경 없음

---

## 12. 로드맵 (v3 수정)

### Phase 1 — 자연어 입력 파이프라인 + Access Tier (Week 1-2)

- [ ] 마이그레이션 050: customers.entity_type
- [ ] 마이그레이션 055: fact 카테고리 확장
- [ ] 마이그레이션 056: extraction_queue
- [ ] 마이그레이션 057: entity_merge_log
- [ ] 마이그레이션 058: accounts.access_tier + KG access_tier 컬럼
- [ ] 마이그레이션 060: embedding_model 컬럼
- [ ] 마이그레이션 061: extraction_queue.expires_at
- [ ] `EntityExtractor.ts` 구현 (Claude 기반 추출)
- [ ] `EntityMerger.ts` 구현 (엔티티 병합)
- [ ] `ExtractionReviewService.ts` — 2등급 판정 + Relations 저장
- [ ] `MemoryAccessService.ts` — Access Tier 기반 재작성
- [ ] `extractionQueueCleaner.ts` — TTL 정기 삭제 배치
- **검증**: 녹취 업로드 → 추출 → AUTO는 즉시 KG 반영, REVIEW는 리뷰 큐 대기. 금융 팩트 → 반드시 REVIEW 분류

### Phase 2 — 프로젝트 KG + Confidentiality 전파 (Week 2-3)

- [ ] 마이그레이션 051: projects 확장
- [ ] 마이그레이션 052: KG project_id + submitted_by
- [ ] 마이그레이션 062: confidentiality 전파 트리거
- [ ] HybridSearchService — project_id 필터 + Access Tier 통합
- [ ] MemoryOrchestrator — 프로젝트 단위 검색
- [ ] 교차 귀속 (customer_id + project_id)
- **검증**: 프로젝트별 KG 검색. 기밀 등급 변경 → KG 데이터 자동 전파 확인

### Phase 3 — 온보딩 + 대관 문서 (Week 3-4)

- [ ] 마이그레이션 054: regulatory_documents
- [ ] 마이그레이션 059: onboarding_tracks 단순화 + onboarding_step_log
- [ ] `onboardingService.ts` — step_log 방식으로 재작성
- [ ] `regulatoryDocService.ts` — 에피소드 자동 생성
- **검증**: 온보딩 단계 진행 → step_log 기록 + 에피소드 생성. 취소→재시작 시나리오 테스트

### Phase 4 — 리뷰 UI + Access Tier 관리 (Week 4-5)

- [ ] 리뷰 큐 프론트엔드 (REVIEW 항목 확인/수정/승인)
- [ ] Access Tier 설정 UI (사용자별 tier override)
- [ ] 엔티티 병합 UI ("BC카드 = 비씨카드?" 확인)
- [ ] 프로젝트 KG 뷰 (프로젝트별 에피소드/팩트/문서)
- **검증**: Tier 3 사용자: financial 팩트 접근 가능. Tier 1 사용자: 접근 불가 확인

### Phase 5 — 그룹 ACL 제거 + 보고 최적화 (Week 5-8)

- [ ] 그룹 ACL 의존 API 순차 마이그레이션 (access_groups → Access Tier)
- [ ] `access_groups`, `user_groups`, `customer_access_groups` 테이블 제거
- [ ] ReportGenerator — 엔티티 타입별 현황 + Access Tier 기반 필터 적용
- [ ] 전체 E2E 시나리오 테스트 (A~E)
- **검증**: 5개 시나리오 + Access Tier 기반 접근 제어 완전 동작 + 그룹 ACL 코드 완전 제거

---

## 13. v2.0 대비 변경 요약

| 영역 | v2.0 | v3 |
|------|------|-----|
| 접근 제어 | 그룹 ACL + 기밀 등급 | **Access Tier 4단계** + role 자동 매핑. 그룹 ACL Phase 5에서 제거 |
| 신뢰도 | 🟢🟡🔴 3등급 | **AUTO/REVIEW 2등급** + 금융/규제/deal_status 강제 REVIEW |
| onboarding | current_step + steps_completed JSONB | **current_step만** + 별도 onboarding_step_log 테이블 |
| Relations | extraction_queue에 저장만 | **applyToKG에서 semantic facts 변환 저장** (중복 시 갱신) |
| Embedding | 벡터만 저장 | **embedding_model 컬럼** 추가 — 재생성 대상 식별 가능 |
| extraction_queue | 무한 보관 | **TTL 30/90일** + daily cron 삭제 |
| 기밀 등급 변경 | 이후 데이터에만 적용 | **기존 KG 데이터 자동 전파** 트리거 |
| 마이그레이션 | 050~057 | **058~062 추가** (053 → 059로 대체) |

---

## 14. 기각된 v2.1 제안 및 사유

투명성을 위해 채택하지 않은 제안과 코드 근거를 기록한다.

### 기각 1: JSONB 4컬럼 → 1컬럼 통합

**제안**: `extracted_entities`, `extracted_facts`, `extracted_relations`, `extracted_events`를 단일 `extracted_data JSONB`로 통합.

**기각 이유**:
1. **부분 수정** — 팩트만 수정 시 `extracted_facts = $1` 한 컬럼만 UPDATE 가능. 통합 시 전체 JSONB 읽기→수정→쓰기 필요
2. **쿼리** — `confidence_level`, `review_status` 집계 쿼리가 현재 컬럼 기준으로 최적화됨
3. **문서화** — 각 컬럼의 JSONB 스키마가 명확히 분리됨 (타입 가독성 우수)

### 기각 2: regulatory_documents → KG 통합

**제안**: `regulatory_documents` 테이블을 제거하고 대관 문서 정보를 KG(semantic facts + knowledge chunks)에만 저장.

**기각 이유**:
- 크립토/핀테크 사업자는 금감원·금융위 대관 이력을 **감사 가능한 형태**로 보관해야 함
- KG의 JSONB 기반 팩트는 감사 추적에 적합하지 않음 (구조화된 `submitted_at`, `received_at`, `deadline`, `status` 필드 필요)
- `regulatory_documents`는 대관 문서의 **법적 장부** 역할. KG는 검색/브리핑 역할. 두 역할은 분리되어야 함

### 기각 3: entity_merge_log 제거

**제안**: `entity_merge_log` 테이블 및 `EntityMerger.ts`를 제거하고 엔티티 병합 처리를 단순화.

**기각 이유**:
- `server/database/migrations/054_entity_merge_log.sql` 이미 적용됨
- `EntityMerger.ts`가 엔티티 병합 이력을 활발히 기록 중
- 병합 이력 없이는 "BC카드 = 비씨카드 = BC Card" 관계를 매번 재추론해야 하므로 오히려 복잡도 증가

---

## 15. 리스크 & 대응 (v3 갱신)

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Access Tier 전환 중 그룹 ACL 충돌 | 특정 사용자 접근 범위 오동작 | Phase 1-2 병행 운영 + `buildAccessFilter()` @deprecated 유지 |
| REVIEW 큐 적체 | 팩트 반영 지연 | 미결 항목 대시보드 + 담당자 Slack 알림 |
| onboarding 마이그레이션 (053 → 059) | 기존 steps_completed 데이터 유실 | 059 마이그레이션에 기존 JSONB → step_log 변환 스크립트 포함 |
| confidentiality 전파 성능 | 대규모 KG에서 트리거 지연 | 레코드 수 > 10,000 시 배치 처리로 전환 |
| embedding_model NULL 기존 레코드 | 모델 업그레이드 시 재생성 범위 불명확 | 058 마이그레이션에서 기존 레코드에 현재 모델명 backfill |
| STT 오류 + REVIEW override 누락 | 잘못된 팩트 자동 저장 | FORCE_REVIEW_CATEGORIES에 새 고위험 카테고리 추가 경로 확보 |

---

## 16. v2.0 유지 항목

다음은 v3에서 변경 없이 유지:

- **자연어 입력 파이프라인** (4-1~4-5절) — 입력 소스, 구조화 파이프라인, submitted_by 전파
- **3대 추적 대상** (3절) — client/partner/authority + BD/대관 프로젝트
- **KG 3층 구조** — Knowledge Chunks, Episodic Memory, Semantic Facts
- **HybridSearch (RRF)** — FTS + vector 검색, 하이브리드 랭킹
- **다나와 연동** — 법률/내부 문서 검색
- **regulatory_documents** 테이블 (기각 2 참조)
- **entity_merge_log** 테이블 (기각 3 참조)
- **비용 추정** — ~$15/월 추가 (변동 없음)
- **5개 사용 시나리오** (A~E) — 내부 동작은 Access Tier 필터 추가되나 사용자 체감 동일
