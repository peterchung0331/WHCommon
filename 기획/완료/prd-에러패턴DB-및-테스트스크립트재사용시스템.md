# 에러 패턴 DB 및 테스트 스크립트 재사용 시스템 구축 계획

## 📋 프로젝트 개요

### 목표
1. **에러 패턴 데이터베이스**: 과거 에러 → 해결책 매핑, 빠른 검색
2. **테스트 스크립트 재사용**: 템플릿 기반 생성, 80+ 기존 스크립트 활용
3. **스킬테스터 강화**: 자동 호출 빈도 증가, 컨텍스트 대폭 확장

### 핵심 문제
- 반복되는 에러 발생 시 과거 해결책을 찾기 어려움
- 매번 새로운 테스트 스크립트를 작성하여 비효율적
- **스킬테스터 호출 빈도가 낮음** (claude-context.md 내용 부족)

### 사용자 선택사항
- DB: PostgreSQL (HWTestAgent DB)
- 스크립트 재사용: 템플릿 기반
- 검색: 에러 메시지 유사도 + HTTP 코드 + 프로젝트/환경 + 카테고리
- 스킬테스터: 자동 검색 + 제안

---

## 🎯 Phase 1: DB 스키마 설계 및 구축

### 1.1 테이블 설계

#### ErrorPattern 테이블
```sql
CREATE TABLE error_patterns (
  id SERIAL PRIMARY KEY,

  -- 에러 식별
  error_category VARCHAR(50) NOT NULL,  -- 'docker-build', 'sso-auth', 'env-config', 'api-error'
  error_message TEXT NOT NULL,          -- 원본 에러 메시지
  error_code VARCHAR(50),               -- HTTP 상태 코드, Exit 코드 등

  -- 컨텍스트
  project_name VARCHAR(50),             -- 'WBHubManager', 'WBSalesHub', etc.
  environment VARCHAR(20),              -- 'local', 'staging', 'production'
  affected_files TEXT[],                -- 영향받는 파일 경로 배열

  -- 메타데이터
  occurrence_count INT DEFAULT 1,       -- 발생 횟수
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

  -- 검색 최적화
  error_message_vector tsvector,        -- 전문 검색용

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_error_category ON error_patterns(error_category);
CREATE INDEX idx_project_env ON error_patterns(project_name, environment);
CREATE INDEX idx_error_code ON error_patterns(error_code);
CREATE INDEX idx_severity ON error_patterns(severity);
CREATE INDEX idx_error_message_gin ON error_patterns USING gin(error_message_vector);
```

#### ErrorSolution 테이블
```sql
CREATE TABLE error_solutions (
  id SERIAL PRIMARY KEY,
  error_pattern_id INT REFERENCES error_patterns(id) ON DELETE CASCADE,

  -- 해결책 정보
  solution_title VARCHAR(200) NOT NULL,
  solution_description TEXT NOT NULL,
  solution_steps TEXT[] NOT NULL,       -- 해결 단계 배열

  -- 코드 변경사항
  files_modified TEXT[],                -- 수정된 파일 경로
  code_snippets JSONB,                  -- { "file_path": "before/after code" }

  -- 효과 검증
  success_rate DECIMAL(5,2),            -- 해결 성공률 (0-100)
  average_fix_time_minutes INT,        -- 평균 해결 시간
  times_applied INT DEFAULT 0,          -- 적용 횟수

  -- 참고 자료
  reference_docs TEXT[],                -- 참고 문서 링크
  related_commit_hash VARCHAR(40),      -- Git 커밋 해시
  work_log_path TEXT,                   -- 작업기록 파일 경로

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_solution_pattern ON error_solutions(error_pattern_id);
CREATE INDEX idx_success_rate ON error_solutions(success_rate DESC);
```

#### ErrorOccurrence 테이블
```sql
CREATE TABLE error_occurrences (
  id SERIAL PRIMARY KEY,
  error_pattern_id INT REFERENCES error_patterns(id) ON DELETE CASCADE,

  -- 발생 정보
  occurred_at TIMESTAMP DEFAULT NOW(),
  environment VARCHAR(20) NOT NULL,
  project_name VARCHAR(50) NOT NULL,

  -- 상세 정보
  stack_trace TEXT,
  context_info JSONB,                   -- 추가 컨텍스트 정보

  -- 해결 여부
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  solution_applied_id INT REFERENCES error_solutions(id),
  resolution_time_minutes INT,

  -- 테스트 실행 연동
  test_run_id INT REFERENCES test_runs(id),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_occurrence_pattern ON error_occurrences(error_pattern_id);
CREATE INDEX idx_occurrence_date ON error_occurrences(occurred_at DESC);
CREATE INDEX idx_resolved ON error_occurrences(resolved);
```

#### TestScriptTemplate 테이블 (새로 추가)
```sql
CREATE TABLE test_script_templates (
  id SERIAL PRIMARY KEY,

  -- 템플릿 식별
  template_name VARCHAR(100) UNIQUE NOT NULL,
  template_type VARCHAR(20) NOT NULL,  -- 'e2e', 'integration', 'unit'
  description TEXT,

  -- 템플릿 내용
  script_content TEXT NOT NULL,        -- Playwright/Jest 스크립트
  variables JSONB NOT NULL,            -- { "PROJECT_NAME": "string", "BASE_URL": "string" }

  -- 사용 통계
  times_used INT DEFAULT 0,
  success_rate DECIMAL(5,2),
  average_execution_time_seconds INT,

  -- 적용 범위
  applicable_projects TEXT[],          -- ['WBHubManager', 'WBSalesHub']
  applicable_environments TEXT[],      -- ['local', 'staging', 'production']

  -- 태그
  tags TEXT[],                         -- ['sso', 'oauth', 'navigation']

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_template_type ON test_script_templates(template_type);
CREATE INDEX idx_template_tags ON test_script_templates USING gin(tags);
```

### 1.2 마이그레이션 파일

**파일**: `/home/peterchung/HWTestAgent/migrations/004_error_pattern_system.sql`

자세한 내용은 플랜 파일 참조.

---

## 📥 Phase 2-7: 상세 구현 계획

각 Phase별 상세 구현 계획은 다음과 같습니다:

- **Phase 2**: 기존 데이터 수집 (WorkLogParser, 작업기록 파싱)
- **Phase 3**: 에러 검색 시스템 (ErrorSearchEngine, 유사도 계산)
- **Phase 4**: 테스트 스크립트 템플릿 시스템
- **Phase 5**: 스킬테스터 통합 (에러 DB 연동)
- **Phase 6**: claude-context.md 스킬테스터 섹션 대폭 강화 (18줄 → 200+줄)
- **Phase 7**: 검증 및 최적화

전체 상세 내용은 `/home/peterchung/.claude/plans/splendid-questing-squirrel.md` 참조.

---

## 📋 구현 우선순위

### Phase 1: 기반 구축 (1-2일)
- [ ] DB 스키마 설계 및 마이그레이션 파일 작성
- [ ] ErrorPattern, ErrorSolution, ErrorOccurrence 테이블 생성
- [ ] TestScriptTemplate 테이블 생성
- [ ] 인덱스 및 트리거 함수 추가

### Phase 2: 데이터 수집 (1일)
- [ ] WorkLogParser 구현 (마크다운 파싱)
- [ ] import-work-logs.ts 스크립트 작성
- [ ] WHCommon/작업기록/완료/*.md 파싱 및 DB 저장
- [ ] 초기 데이터 검증 (5개 완료 작업 → ~20개 에러 패턴)

### Phase 3: 검색 시스템 (2일)
- [ ] ErrorSearchEngine 구현 (텍스트 유사도, Levenshtein 거리)
- [ ] API 엔드포인트 추가 (/api/errors/search)
- [ ] CLI 도구 작성 (search-error.sh)
- [ ] 검색 성능 테스트 (인덱스 최적화)

### Phase 4: 템플릿 시스템 (2일)
- [ ] TemplateEngine 구현 (변수 치환)
- [ ] 5개 초기 템플릿 작성 (E2E, 통합, 단위)
- [ ] API 엔드포인트 추가 (/api/templates/search, /api/templates/generate)
- [ ] 템플릿 생성 테스트

### Phase 5: 스킬테스터 통합 (1일)
- [ ] 스킬테스터 SKILL.md 수정 (에러 DB 연동 로직)
- [ ] HWTestAgent API 호출 코드 추가
- [ ] 테스트 결과 자동 저장 로직
- [ ] E2E 테스트 (스킬테스터 → HWTestAgent API)

### Phase 6: claude-context.md 개선 (1일)
- [ ] 스킬테스터 섹션 200+ 줄로 확장
- [ ] 자동 트리거 조건 추가 (키워드 + 상황 기반)
- [ ] 20+ 사용 예시 작성
- [ ] 에러 발생 시 워크플로우 문서화
- [ ] 배포 전 체크리스트 추가

### Phase 7: 검증 및 최적화 (1일)
- [ ] 전체 시스템 E2E 테스트
- [ ] 성능 테스트 (검색 속도, DB 쿼리 최적화)
- [ ] 문서화 (README, API 문서)
- [ ] 사용자 가이드 작성

---

## 📊 예상 효과

### 정량적 효과
1. **에러 해결 시간 단축**: 평균 30분 → 10분 (67% 감소)
2. **테스트 스크립트 작성 시간**: 20분 → 5분 (75% 감소)
3. **스킬테스터 호출 빈도**: 현재 대비 **5배 증가**
4. **에러 재발 방지**: 과거 해결책 재활용으로 재발률 80% 감소

### 정성적 효과
1. **지식 축적**: 모든 에러-해결책이 DB에 영구 저장
2. **학습 효과**: 과거 패턴 학습으로 점진적 개선
3. **일관성**: 템플릿 기반 테스트로 코드 품질 향상
4. **자동화**: 스킬테스터 자동 제안으로 테스트 누락 방지

---

## ✅ 완료 조건

다음 조건을 모두 만족하면 구현 완료:

- [ ] DB에 20+ 에러 패턴 저장됨
- [ ] 에러 검색 API가 0.5초 이내 응답
- [ ] 템플릿으로 테스트 스크립트 생성 가능
- [ ] 스킬테스터가 에러 DB 조회 및 제안
- [ ] claude-context.md 스킬테스터 섹션 200+ 줄
- [ ] 스킬테스터 호출 빈도 5배 증가 확인
- [ ] 전체 시스템 E2E 테스트 통과

---

**작성일**: 2026-01-14
**작성자**: Claude (Plan Mode)
**예상 구현 기간**: 7-10일
**상세 플랜**: `/home/peterchung/.claude/plans/splendid-questing-squirrel.md`
