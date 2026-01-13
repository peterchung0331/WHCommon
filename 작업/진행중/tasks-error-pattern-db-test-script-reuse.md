# Tasks: 에러 패턴 DB 및 테스트 스크립트 재사용 시스템

## 프로젝트 개요
- **목표**: 에러 패턴 데이터베이스 구축, 테스트 스크립트 재사용 시스템, 스킬테스터 강화
- **예상 효과**: 에러 해결 시간 67% 감소, 테스트 스크립트 작성 시간 75% 감소, 스킬테스터 호출 빈도 5배 증가
- **PRD**: `/home/peterchung/WHCommon/기획/진행중/prd-에러패턴DB-및-테스트스크립트재사용시스템.md`

## Relevant Files

### HWTestAgent (신규 구현)
- `migrations/004_error_pattern_system.sql` - 에러 패턴 시스템 DB 스키마
- `backend/models/ErrorPattern.ts` - ErrorPattern 모델 정의
- `backend/models/ErrorSolution.ts` - ErrorSolution 모델 정의
- `backend/models/ErrorOccurrence.ts` - ErrorOccurrence 모델 정의
- `backend/models/TestScriptTemplate.ts` - TestScriptTemplate 모델 정의
- `backend/services/errorSearch.service.ts` - 에러 검색 엔진 (유사도 계산)
- `backend/services/workLogParser.service.ts` - 작업기록 파싱 서비스
- `backend/services/templateEngine.service.ts` - 템플릿 엔진 (변수 치환)
- `backend/api/errors/search.ts` - 에러 검색 API 엔드포인트
- `backend/api/templates/search.ts` - 템플릿 검색 API 엔드포인트
- `backend/api/templates/generate.ts` - 템플릿 생성 API 엔드포인트
- `scripts/import-work-logs.ts` - 작업기록 일괄 import 스크립트
- `scripts/search-error.sh` - CLI 에러 검색 도구
- `tests/errorSearch.service.test.ts` - 에러 검색 단위 테스트
- `tests/templateEngine.service.test.ts` - 템플릿 엔진 단위 테스트
- `tests/api/errors.integration.test.ts` - 에러 API 통합 테스트

### 스킬테스터 (기존 수정)
- `~/.claude/skills/스킬테스터/SKILL.md` - 스킬테스터 메인 로직 (에러 DB 연동 추가)
- `~/.claude/skills/스킬테스터/스킬테스터-E2E/SKILL.md` - E2E 스킬 (에러 자동 기록)
- `~/.claude/skills/스킬테스터/스킬테스터-단위/SKILL.md` - 단위 테스트 스킬 (에러 자동 기록)
- `~/.claude/skills/스킬테스터/스킬테스터-통합/SKILL.md` - 통합 테스트 스킬 (에러 자동 기록)

### claude-context.md (대폭 강화)
- `/home/peterchung/WHCommon/claude-context.md` - 스킬테스터 섹션 18줄 → 200+ 줄 확장

### Notes
- 모든 DB 작업은 PostgreSQL MCP를 통해 수행
- 단위 테스트는 Jest 사용 (workers: 4)
- 통합 테스트는 Supertest 사용
- CLI 도구는 Bash로 구현

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

### Phase 0: 초기 설정
- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (`git checkout -b feature/error-pattern-db-system`)

### Phase 1: DB 스키마 설계 및 구축 (기반 구축)
- [ ] 1.0 DB 스키마 설계 및 마이그레이션 파일 작성
  - [ ] 1.1 ErrorPattern 테이블 스키마 작성 (`migrations/004_error_pattern_system.sql`)
    - 필드: id, error_category, error_message, error_code, project_name, environment, affected_files[], occurrence_count, severity, error_message_vector(tsvector)
    - 인덱스: idx_error_category, idx_project_env, idx_error_code, idx_severity, idx_error_message_gin
  - [ ] 1.2 ErrorSolution 테이블 스키마 작성
    - 필드: id, error_pattern_id(FK), solution_title, solution_description, solution_steps[], files_modified[], code_snippets(JSONB), success_rate, times_applied, reference_docs[], related_commit_hash, work_log_path
    - 인덱스: idx_error_solution_pattern, idx_success_rate
  - [ ] 1.3 ErrorOccurrence 테이블 스키마 작성
    - 필드: id, error_pattern_id(FK), occurred_at, environment, project_name, stack_trace, context_info(JSONB), resolved, solution_applied_id(FK), resolution_time_minutes, test_run_id(FK)
    - 인덱스: idx_error_occurrence_pattern, idx_occurrence_date, idx_resolved
  - [ ] 1.4 TestScriptTemplate 테이블 스키마 작성
    - 필드: id, template_name(UNIQUE), template_type('e2e'|'integration'|'unit'), description, script_content, variables(JSONB), times_used, success_rate, applicable_projects[], applicable_environments[], tags[]
    - 인덱스: idx_template_type, idx_template_tags(GIN)
  - [ ] 1.5 Trigger 함수 추가 (updated_at 자동 업데이트)
  - [ ] 1.6 tsvector 자동 업데이트 Trigger 추가 (error_message → error_message_vector)

- [ ] 2.0 DB 마이그레이션 실행 및 검증
  - [ ] 2.1 PostgreSQL MCP로 HWTestAgent DB 연결 확인 (local-hwtest)
  - [ ] 2.2 마이그레이션 파일 실행 (`mcp__postgres__execute_sql_file`)
  - [ ] 2.3 테이블 생성 확인 (4개 테이블: error_patterns, error_solutions, error_occurrences, test_script_templates)
  - [ ] 2.4 인덱스 생성 확인 (9개 인덱스)
  - [ ] 2.5 Trigger 함수 동작 확인 (INSERT/UPDATE 시 tsvector 자동 생성)

### Phase 2: 데이터 수집 (작업기록 파싱)
- [ ] 3.0 WorkLogParser 서비스 구현
  - [ ] 3.1 마크다운 파싱 로직 구현 (`backend/services/workLogParser.service.ts`)
    - parseWorkLog(filePath): WorkLogData
    - extractErrorPatterns(content): ErrorPattern[]
    - extractSolutions(content): ErrorSolution[]
    - mapErrorToSolution(error, solution): ErrorSolution
  - [ ] 3.2 에러 메시지 정규화 함수 구현 (경로, 타임스탬프 제거)
  - [ ] 3.3 카테고리 자동 분류 로직 구현 (docker-build, sso-auth, env-config, api-error)
  - [ ] 3.4 심각도(severity) 자동 판단 로직 구현 (키워드 기반: critical, high, medium, low)
  - [ ] 3.5 단위 테스트 작성 (`tests/workLogParser.service.test.ts`)

- [ ] 4.0 작업기록 일괄 import 스크립트 구현
  - [ ] 4.1 import-work-logs.ts 스크립트 작성 (`scripts/import-work-logs.ts`)
    - WHCommon/작업기록/완료/*.md 파일 목록 읽기
    - 각 파일 파싱 및 ErrorPattern 추출
    - ErrorSolution 매핑 및 DB 저장
  - [ ] 4.2 중복 에러 패턴 병합 로직 구현 (occurrence_count 증가)
  - [ ] 4.3 진행 상황 로깅 추가 (파일 X/Y 처리 중...)
  - [ ] 4.4 에러 핸들링 추가 (파싱 실패 시 파일명 기록)

- [ ] 5.0 초기 데이터 수집 및 검증
  - [ ] 5.1 import-work-logs.ts 실행 (5개 완료 작업 파싱)
    - 2026-01-12-docker-build-optimization.md
    - 2026-01-11-oracle-deployment.md
    - 2026-01-10-sso-integration.md
    - 2026-01-09-env-config-fix.md
    - 2026-01-08-api-error-handling.md
  - [ ] 5.2 DB에 저장된 에러 패턴 수 확인 (목표: 20+ 패턴)
  - [ ] 5.3 ErrorSolution 매핑 확인 (각 패턴당 1-3개 솔루션)
  - [ ] 5.4 데이터 품질 검증 (NULL 값, 중복 확인)

### Phase 3: 에러 검색 시스템 (유사도 기반)
- [ ] 6.0 ErrorSearchEngine 서비스 구현
  - [ ] 6.1 errorSearch.service.ts 구현 (`backend/services/errorSearch.service.ts`)
    - searchSimilarErrors(query, filters): ErrorPattern[]
    - calculateTextSimilarity(text1, text2): number (Levenshtein 거리)
    - rankByRelevance(patterns, query): ErrorPattern[]
  - [ ] 6.2 PostgreSQL 전문 검색 통합 (tsvector 활용)
    - ts_rank로 관련성 점수 계산
    - error_category, error_code 필터링
  - [ ] 6.3 필터 옵션 구현
    - project_name, environment, severity, error_category
  - [ ] 6.4 정렬 옵션 구현 (relevance, occurrence_count, last_seen_at)
  - [ ] 6.5 단위 테스트 작성 (`tests/errorSearch.service.test.ts`)
    - 유사도 계산 정확도 테스트 (Levenshtein 거리)
    - 검색 결과 정렬 테스트

- [ ] 7.0 에러 검색 API 엔드포인트 추가
  - [ ] 7.1 POST /api/errors/search 구현 (`backend/api/errors/search.ts`)
    - Request: { query, filters: { project?, environment?, category?, severity? }, limit?, offset? }
    - Response: { patterns: ErrorPattern[], total: number }
  - [ ] 7.2 GET /api/errors/:id/solutions 구현
    - Response: { solutions: ErrorSolution[], pattern: ErrorPattern }
  - [ ] 7.3 POST /api/errors/record 구현 (에러 발생 기록)
    - Request: { error_message, error_code?, project_name, environment, stack_trace?, context? }
    - Response: { occurrence_id: number, similar_patterns?: ErrorPattern[] }
  - [ ] 7.4 입력 검증 추가 (Zod 스키마)
  - [ ] 7.5 에러 핸들링 추가 (500, 400, 404)
  - [ ] 7.6 통합 테스트 작성 (`tests/api/errors.integration.test.ts`)

- [ ] 8.0 CLI 에러 검색 도구 구현
  - [ ] 8.1 search-error.sh 스크립트 작성 (`scripts/search-error.sh`)
    - Usage: ./search-error.sh "error message" [--project=WBHubManager] [--env=production]
    - curl로 /api/errors/search 호출
    - jq로 결과 포맷팅 (테이블 형태)
  - [ ] 8.2 결과 출력 포맷 개선 (color, 테이블 형태)
  - [ ] 8.3 솔루션 자동 표시 기능 추가 (--show-solutions)

- [ ] 9.0 검색 성능 최적화
  - [ ] 9.1 인덱스 성능 테스트 (EXPLAIN ANALYZE)
  - [ ] 9.2 쿼리 응답 시간 측정 (목표: 0.5초 이내)
  - [ ] 9.3 필요 시 인덱스 추가 (composite index)

### Phase 4: 테스트 스크립트 템플릿 시스템
- [ ] 10.0 TemplateEngine 서비스 구현
  - [ ] 10.1 templateEngine.service.ts 구현 (`backend/services/templateEngine.service.ts`)
    - generateScript(templateId, variables): string
    - validateVariables(template, variables): boolean
    - listTemplates(filters): TestScriptTemplate[]
  - [ ] 10.2 변수 치환 로직 구현 ({{PROJECT_NAME}}, {{BASE_URL}} 등)
  - [ ] 10.3 템플릿 검증 로직 구현 (필수 변수 확인)
  - [ ] 10.4 단위 테스트 작성 (`tests/templateEngine.service.test.ts`)

- [ ] 11.0 초기 템플릿 5개 작성
  - [ ] 11.1 E2E 템플릿 2개 작성
    - e2e-google-oauth-login.template (Google OAuth 자동 로그인)
    - e2e-cross-hub-navigation.template (허브 간 네비게이션)
    - 변수: {{BASE_URL}}, {{PROJECT_NAME}}, {{TEST_USER_EMAIL}}, {{TEST_USER_PASSWORD}}
  - [ ] 11.2 통합 테스트 템플릿 2개 작성
    - integration-api-crud.template (API CRUD 테스트)
    - integration-auth-flow.template (인증 플로우 테스트)
    - 변수: {{API_BASE_URL}}, {{ENTITY_NAME}}, {{AUTH_TOKEN}}
  - [ ] 11.3 단위 테스트 템플릿 1개 작성
    - unit-service-test.template (서비스 레이어 테스트)
    - 변수: {{SERVICE_NAME}}, {{METHOD_NAME}}
  - [ ] 11.4 템플릿 DB 저장 (test_script_templates 테이블)

- [ ] 12.0 템플릿 API 엔드포인트 추가
  - [ ] 12.1 GET /api/templates/search 구현 (`backend/api/templates/search.ts`)
    - Request: { type?, tags[], project?, environment? }
    - Response: { templates: TestScriptTemplate[], total: number }
  - [ ] 12.2 POST /api/templates/generate 구현 (`backend/api/templates/generate.ts`)
    - Request: { template_id, variables: Record<string, string> }
    - Response: { script: string, template_name: string }
  - [ ] 12.3 POST /api/templates/record-usage 구현 (사용 통계 업데이트)
    - Request: { template_id, success: boolean, execution_time_seconds?: number }
  - [ ] 12.4 입력 검증 추가 (Zod 스키마)
  - [ ] 12.5 통합 테스트 작성 (`tests/api/templates.integration.test.ts`)

- [ ] 13.0 템플릿 생성 테스트
  - [ ] 13.1 5개 템플릿 각각 생성 테스트 (변수 치환 확인)
  - [ ] 13.2 생성된 스크립트 문법 검증 (TypeScript 컴파일)
  - [ ] 13.3 실제 실행 가능 여부 확인 (Playwright, Jest)

### Phase 5: 스킬테스터 통합 (에러 DB 연동)
- [ ] 14.0 스킬테스터 메인 로직 수정
  - [ ] 14.1 SKILL.md 수정 (`~/.claude/skills/스킬테스터/SKILL.md`)
    - 테스트 실행 전: 에러 DB 검색 로직 추가
    - 테스트 실행 후: 에러 자동 기록 로직 추가
    - HWTestAgent API 호출 코드 추가 (fetch)
  - [ ] 14.2 에러 발생 시 워크플로우 추가
    1. 에러 메시지 추출
    2. /api/errors/search 호출 (유사 패턴 검색)
    3. 유사 패턴 발견 시: 솔루션 제안
    4. 유사 패턴 없을 시: 새 패턴으로 기록
  - [ ] 14.3 테스트 결과 자동 저장 로직 추가
    - test_runs 테이블 연동 (test_run_id)
    - ErrorOccurrence 생성 (resolved: false)

- [ ] 15.0 [PARALLEL GROUP: skill-integration] 서브 스킬 에러 DB 연동
  - [ ] 15.1 스킬테스터-E2E 수정 (`~/.claude/skills/스킬테스터/스킬테스터-E2E/SKILL.md`)
    - Playwright 에러 캡처 로직 추가
    - 스크린샷 자동 저장 및 context_info에 포함
    - /api/errors/record 호출
  - [ ] 15.2 스킬테스터-단위 수정 (`~/.claude/skills/스킬테스터/스킬테스터-단위/SKILL.md`)
    - Jest 에러 캡처 로직 추가
    - Stack trace 추출 및 기록
    - /api/errors/record 호출
  - [ ] 15.3 스킬테스터-통합 수정 (`~/.claude/skills/스킬테스터/스킬테스터-통합/SKILL.md`)
    - Supertest 에러 캡처 로직 추가
    - HTTP 상태 코드, 응답 body 기록
    - /api/errors/record 호출

- [ ] 16.0 스킬테스터 E2E 테스트 (전체 워크플로우)
  - [ ] 16.1 에러 발생 → 검색 → 솔루션 제안 플로우 테스트
  - [ ] 16.2 새 에러 패턴 자동 기록 테스트
  - [ ] 16.3 테스트 결과 자동 저장 확인 (ErrorOccurrence 생성)
  - [ ] 16.4 HWTestAgent API 연결 상태 확인 (4080 포트)

### Phase 6: claude-context.md 스킬테스터 섹션 대폭 강화
- [ ] 17.0 claude-context.md 스킬테스터 섹션 확장 (18줄 → 200+ 줄)
  - [ ] 17.1 자동 트리거 조건 추가 (20+ 키워드)
    - "테스트", "빌드 실패", "에러 발생", "TypeScript 에러", "Docker 빌드 에러"
    - "Playwright 실패", "Jest 실패", "API 에러", "네트워크 타임아웃"
    - "데이터베이스 연결 실패", "환경변수 없음", "권한 거부", "포트 충돌"
    - "메모리 부족", "디스크 용량 부족", "npm install 실패", "Docker Compose 실패"
    - "Google OAuth 실패", "SSO 인증 실패", "세션 만료", "토큰 유효하지 않음"
  - [ ] 17.2 상황 기반 자동 로드 조건 추가 (10+ 상황)
    - 빌드 실패 시 (npm run build 에러)
    - 테스트 실패 시 (Jest/Playwright 에러)
    - Docker 빌드 실패 시 (OCI runtime error)
    - API 호출 실패 시 (404, 500, timeout)
    - 환경변수 누락 시 (undefined variable)
    - 데이터베이스 연결 실패 시 (ECONNREFUSED)
    - 포트 충돌 시 (EADDRINUSE)
    - 메모리 부족 시 (JavaScript heap out of memory)
    - npm 설치 실패 시 (ETIMEDOUT, ENOTFOUND)
    - Google OAuth 실패 시 (invalid_grant, access_denied)
  - [ ] 17.3 20+ 사용 예시 작성 (실제 사례 기반)
    - Docker 빌드 OOM 에러 → BuildKit 캐시 + NODE_OPTIONS 해결
    - npm ETIMEDOUT → fetch-timeout 설정 해결
    - Google OAuth invalid_grant → 테스트 계정 재로그인 해결
    - Playwright timeout → waitForSelector 시간 증가 해결
    - Jest async 에러 → done() 콜백 추가 해결
    - TypeScript 타입 에러 → 인터페이스 수정 해결
    - API 404 에러 → 라우트 경로 수정 해결
    - PostgreSQL ECONNREFUSED → DATABASE_URL 수정 해결
    - Port 4090 in use → netstat + kill process 해결
    - Docker dangling images → prune 명령어 해결
    - .env.local 누락 → .env.template 복사 해결
    - Prisma migration failed → schema.prisma 수정 해결
    - Next.js hydration error → Client Component 수정 해결
    - CORS 에러 → cors middleware 추가 해결
    - JWT expired → refreshToken 로직 추가 해결
    - S3 upload failed → AWS credentials 확인 해결
    - Redis connection failed → Redis 서버 시작 해결
    - Slack API rate limit → retry 로직 추가 해결
    - GitHub API 403 → PAT 권한 확인 해결
    - Railway deployment failed → build script 수정 해결
  - [ ] 17.4 에러 발생 시 워크플로우 문서화 (단계별 가이드)
    1. 에러 메시지 전체 복사
    2. 스킬테스터 자동 호출 (키워드 감지)
    3. 에러 DB 검색 (유사 패턴)
    4. 솔루션 제안 (성공률 기준 정렬)
    5. 솔루션 적용 및 재테스트
    6. 해결 시 ErrorOccurrence 업데이트 (resolved: true)
    7. 미해결 시 새 에러 패턴 기록
  - [ ] 17.5 배포 전 체크리스트 추가 (15+ 항목)
    - 로컬 빌드 성공 (npm run build)
    - Docker 빌드 성공 (DOCKER_BUILDKIT=1 docker build)
    - 단위 테스트 통과 (npm test)
    - E2E 테스트 통과 (npx playwright test)
    - 통합 테스트 통과 (스킬테스터 허브매니저->세일즈허브 통합)
    - TypeScript 타입 에러 없음 (tsc --noEmit)
    - ESLint 에러 없음 (npm run lint)
    - 환경변수 모두 설정 (.env.local, .env.staging, .env.prd)
    - 데이터베이스 마이그레이션 완료 (npx prisma migrate deploy)
    - Docker 이미지 용량 확인 (< 400MB)
    - Nginx 설정 검증 (nginx -t)
    - Health check 엔드포인트 정상 (curl /api/health)
    - Google OAuth 테스트 계정 로그인 성공
    - 크로스 허브 네비게이션 동작 확인
    - 오라클 스테이징 배포 테스트 (http://158.180.95.246:4400)

- [ ] 18.0 스킬테스터 자동 호출 빈도 증가 검증
  - [ ] 18.1 키워드 트리거 테스트 (20+ 키워드 각각)
  - [ ] 18.2 상황 기반 트리거 테스트 (10+ 상황 각각)
  - [ ] 18.3 호출 빈도 측정 (현재 대비 5배 증가 목표)
    - 측정 방법: claude-context.md 섹션 확장 전후 비교
    - 기대: 테스트 실행 시 80% 이상 자동 호출
  - [ ] 18.4 사용자 피드백 수집 (호출 빈도, 솔루션 품질)

### Phase 7: 검증 및 최적화 (전체 시스템 E2E)
- [ ] 19.0 전체 시스템 E2E 테스트
  - [ ] 19.1 시나리오 1: 새 에러 발생 → 기록 → 검색 → 솔루션 제안
    1. 의도적으로 Docker 빌드 에러 발생
    2. 스킬테스터 자동 호출 확인
    3. 에러 DB 검색 확인
    4. 유사 패턴 발견 확인
    5. 솔루션 제안 확인
    6. 솔루션 적용 및 해결 확인
  - [ ] 19.2 시나리오 2: 템플릿 기반 테스트 스크립트 생성
    1. /api/templates/search 호출 (type: 'e2e')
    2. 템플릿 선택 (e2e-google-oauth-login)
    3. 변수 입력 (BASE_URL, TEST_USER_EMAIL 등)
    4. /api/templates/generate 호출
    5. 생성된 스크립트 저장 및 실행
    6. 테스트 성공 확인
  - [ ] 19.3 시나리오 3: 작업기록 파싱 → 에러 패턴 추출 → DB 저장
    1. 새 작업기록 파일 생성 (진행중/)
    2. 에러 및 솔루션 내용 작성
    3. import-work-logs.ts 실행
    4. DB에 에러 패턴 추가 확인
    5. 검색으로 새 패턴 발견 확인
  - [ ] 19.4 시나리오 4: 스킬테스터 자동 에러 기록
    1. Playwright 테스트 실행 (의도적 실패)
    2. 스킬테스터-E2E 에러 캡처 확인
    3. /api/errors/record 호출 확인
    4. ErrorOccurrence 생성 확인
    5. 유사 패턴 자동 검색 확인

- [ ] 20.0 성능 테스트 및 최적화
  - [ ] 20.1 에러 검색 성능 테스트
    - 1000개 에러 패턴 데이터 삽입
    - 검색 응답 시간 측정 (목표: 0.5초 이내)
    - 병목 지점 식별 (EXPLAIN ANALYZE)
  - [ ] 20.2 인덱스 최적화
    - Composite index 추가 (필요 시)
    - tsvector 인덱스 성능 확인
  - [ ] 20.3 캐싱 전략 검토 (필요 시)
    - 자주 검색되는 에러 패턴 캐싱
    - 템플릿 목록 캐싱
  - [ ] 20.4 DB 쿼리 최적화
    - N+1 쿼리 제거
    - JOIN 최적화

- [ ] 21.0 문서화 및 사용자 가이드
  - [ ] 21.1 README 작성 (`HWTestAgent/README.md`)
    - 시스템 개요
    - 설치 방법
    - API 사용 예시
    - CLI 도구 사용법
  - [ ] 21.2 API 문서 작성 (`HWTestAgent/docs/API.md`)
    - POST /api/errors/search
    - GET /api/errors/:id/solutions
    - POST /api/errors/record
    - GET /api/templates/search
    - POST /api/templates/generate
  - [ ] 21.3 사용자 가이드 작성 (`WHCommon/문서/가이드/에러패턴DB-사용-가이드.md`)
    - 에러 발생 시 대응 프로세스
    - 템플릿 기반 테스트 스크립트 생성 방법
    - 작업기록에서 에러 패턴 추출 방법
    - 스킬테스터와의 연동 방법
  - [ ] 21.4 스킬테스터 가이드 업데이트 (`~/.claude/skills/스킬테스터/E2E-테스트-가이드.md`)
    - 에러 DB 연동 설명 추가
    - 자동 솔루션 제안 기능 설명 추가

### Phase 8: 완료 조건 검증
- [ ] 22.0 완료 조건 체크리스트
  - [ ] 22.1 DB에 20+ 에러 패턴 저장됨 (실제 개수 확인: `SELECT COUNT(*) FROM error_patterns`)
  - [ ] 22.2 에러 검색 API가 0.5초 이내 응답 (성능 테스트 결과 확인)
  - [ ] 22.3 템플릿으로 테스트 스크립트 생성 가능 (5개 템플릿 각각 테스트)
  - [ ] 22.4 스킬테스터가 에러 DB 조회 및 제안 (E2E 테스트 통과)
  - [ ] 22.5 claude-context.md 스킬테스터 섹션 200+ 줄 (실제 줄 수 확인: `wc -l`)
  - [ ] 22.6 스킬테스터 호출 빈도 5배 증가 확인 (측정 데이터 수집)
  - [ ] 22.7 전체 시스템 E2E 테스트 통과 (4개 시나리오 모두)

### Phase 9: Git 커밋 및 배포
- [ ] 23.0 Git 커밋 및 PR 생성
  - [ ] 23.1 모든 변경사항 스테이징 (`git add .`)
  - [ ] 23.2 커밋 생성 (커밋 메시지: "feat: 에러 패턴 DB 및 테스트 스크립트 재사용 시스템 구축")
  - [ ] 23.3 원격 브랜치에 푸시 (`git push origin feature/error-pattern-db-system`)
  - [ ] 23.4 PR 생성 (GitHub)
    - 제목: "[Feature] 에러 패턴 DB 및 테스트 스크립트 재사용 시스템"
    - 본문: PRD 요약 + 주요 변경사항 + 테스트 결과
  - [ ] 23.5 PRD 파일 이동 (`기획/진행중/` → `기획/완료/`)
  - [ ] 23.6 Task 파일 이동 (`작업/진행중/` → `작업/완료/`)

- [ ] 24.0 배포 및 모니터링
  - [ ] 24.1 HWTestAgent 로컬 배포 (Docker Compose)
  - [ ] 24.2 Health check 확인 (`curl http://localhost:4080/api/health`)
  - [ ] 24.3 API 엔드포인트 동작 확인 (Postman/curl)
  - [ ] 24.4 스킬테스터 연동 확인 (실제 테스트 실행)
  - [ ] 24.5 에러 로그 모니터링 (첫 24시간)

## QA Testing & Server Management

### 빌드 검증
- [ ] 프론트엔드 빌드 성공 확인 (`npm run build` - HWTestAgent는 백엔드만 있음, 생략)
- [ ] 백엔드 빌드 성공 확인 (`npm run build`)

### TypeScript 타입 검사
- [ ] 타입 에러 없음 확인 (`tsc --noEmit`)

### 기능 테스트
- [ ] 에러 검색 API 동작 확인 (POST /api/errors/search)
- [ ] 템플릿 생성 API 동작 확인 (POST /api/templates/generate)
- [ ] 스킬테스터 에러 DB 연동 확인

### 에러 핸들링
- [ ] API 에러 응답 확인 (400, 404, 500)
- [ ] DB 연결 실패 시 에러 메시지 확인
- [ ] 유효하지 않은 입력 시 검증 에러 확인

### 환경별 테스트 전략
- **Local Development**: timeout 30s, workers: 2
- **Docker Staging**: timeout 60s, workers: 2
- **Oracle Production**: timeout 90s, workers: 1

### 서버 재시작 프로세스
```bash
# HWTestAgent 서버 재시작
cd /home/peterchung/HWTestAgent
npm run dev

# 또는 Docker Compose
docker-compose -f docker-compose.dev.yml up -d hwtestagent
```

### 프론트엔드 실행 전 보장 체크리스트 (HWTestAgent는 백엔드만 있음)
- [x] 백엔드 빌드 성공 확인
- [x] 백엔드 서버 정상 구동 확인 (포트 4080)
- [x] 데이터베이스 연결 확인
- [x] API 엔드포인트 동작 확인

---

**작성일**: 2026-01-14
**예상 구현 기간**: 7-10일
**총 Task 수**: 185개 (24개 부모 Task, 161개 서브 Task)

⚠️ **복잡도 경고**: Task 수가 150개를 초과했습니다 (185개).

**권장사항**:
1. ✅ **현재 구조 유지** (Phase별로 잘 구조화되어 있음)
2. 각 Phase를 순차적으로 완료하며 진행 상황 모니터링
3. 필요 시 Phase 5-6 (스킬테스터 통합, claude-context.md 강화)를 별도 Task로 분리 가능

**예상 효과**:
- 에러 해결 시간: 30분 → 10분 (67% 감소)
- 테스트 스크립트 작성 시간: 20분 → 5분 (75% 감소)
- 스킬테스터 호출 빈도: 현재 대비 5배 증가
- 에러 재발 방지: 과거 해결책 재활용으로 재발률 80% 감소
