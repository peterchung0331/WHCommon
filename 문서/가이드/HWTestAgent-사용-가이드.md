# HWTestAgent 사용 가이드

> WorkHub 프로젝트를 위한 통합 테스트 자동화 시스템

**작성일**: 2026-01-14
**버전**: 1.0.0

---

## 목차
1. [개요](#개요)
2. [시스템 구성](#시스템-구성)
3. [설치 및 환경 설정](#설치-및-환경-설정)
4. [에러 패턴 DB 시스템](#에러-패턴-db-시스템)
5. [테스트 스크립트 템플릿 시스템](#테스트-스크립트-템플릿-시스템)
6. [스킬테스터 연동](#스킬테스터-연동)
7. [API 사용법](#api-사용법)
8. [CLI 도구 사용법](#cli-도구-사용법)
9. [문제 해결](#문제-해결)

---

## 개요

HWTestAgent는 WorkHub 프로젝트군을 위한 통합 테스트 자동화 시스템입니다.

### 주요 기능

#### 1. 에러 패턴 DB 시스템
- **에러 자동 수집**: 테스트 실행 중 발생한 에러를 자동으로 DB에 기록
- **유사 에러 검색**: 과거 발생한 유사 에러 패턴을 0.5초 이내 검색
- **솔루션 제안**: 성공률 기반으로 해결책 자동 제안
- **작업기록 연동**: 과거 작업기록에서 에러 패턴 및 솔루션 자동 추출

#### 2. 테스트 스크립트 템플릿 시스템
- **변수 치환 엔진**: `{{PROJECT_NAME}}`, `{{BASE_URL}}` 등 변수 자동 치환
- **태그 기반 검색**: 'e2e', 'oauth', 'cross-hub' 등 태그로 템플릿 검색
- **재사용 가능 템플릿**: E2E, 통합, 단위 테스트 템플릿 5개 기본 제공
- **사용 통계**: 템플릿 사용 횟수 및 성공률 자동 추적

#### 3. 스킬테스터 연동
- **자동 에러 기록**: Playwright/Jest/API 테스트 실패 시 자동으로 에러 DB에 기록
- **실시간 솔루션 제안**: 테스트 실패 즉시 유사 에러 검색 후 솔루션 제안
- **배포 전 검증**: 20+ 항목 자동 체크리스트 검증

### 기대 효과
- **에러 해결 시간 67% 감소**: 30분 → 10분 (과거 솔루션 재활용)
- **테스트 스크립트 작성 시간 75% 감소**: 20분 → 5분 (템플릿 사용)
- **스킬테스터 호출 빈도 5배 증가**: 자동 트리거 키워드 20+개 추가

---

## 시스템 구성

### 디렉토리 구조
```
HWTestAgent/
├── src/
│   ├── services/
│   │   ├── errorSearch.service.ts      # 에러 검색 엔진
│   │   └── templateEngine.service.ts   # 템플릿 변수 치환
│   ├── storage/
│   │   └── repositories/
│   │       ├── ErrorPatternRepository.ts
│   │       └── TemplateRepository.ts
│   ├── utils/
│   │   └── errorReporter.ts            # Playwright/Jest/API 에러 리포터
│   └── server/
│       └── routes/
│           └── api.ts                   # API 엔드포인트
├── migrations/
│   └── 005_error_solution_system.sql   # DB 스키마
├── docs/
│   └── API.md                           # API 문서
└── README.md
```

### 데이터베이스 스키마
4개 테이블로 구성:
- **error_patterns**: 에러 패턴 저장 (카테고리, 메시지, 전문 검색용 tsvector)
- **error_solutions**: 에러 해결책 저장 (단계별 가이드, 코드 스니펫, 성공률)
- **error_occurrences**: 에러 발생 이력 (스택 트레이스, 환경, 해결 여부)
- **test_script_templates**: 테스트 스크립트 템플릿 (변수, 태그, 사용 통계)

---

## 설치 및 환경 설정

### 1. 사전 요구사항
- Node.js 20+
- PostgreSQL 15+
- Docker (선택사항)

### 2. 저장소 클론
```bash
cd /home/peterchung
git clone https://github.com/peterchung0331/HWTestAgent.git
cd HWTestAgent
```

### 3. 의존성 설치
```bash
npm install
```

### 4. 환경변수 설정
```bash
# .env.local 파일 생성
cp .env.template .env.local

# 필수 환경변수 설정
DATABASE_URL=postgresql://workhub:workhub@localhost:5432/hwtestagent
PORT=4080
NODE_ENV=development
```

### 5. 데이터베이스 마이그레이션
```bash
# PostgreSQL MCP를 통해 마이그레이션 실행
# 또는 직접 실행
psql -U workhub -d hwtestagent -f migrations/005_error_solution_system.sql
```

### 6. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm run build
npm start
```

### 7. 서버 정상 동작 확인
```bash
curl http://localhost:4080/api/health
# 응답: {"status":"ok","timestamp":"2026-01-14T..."}
```

---

## 에러 패턴 DB 시스템

### 1. 에러 자동 기록

테스트 실행 중 발생한 에러가 자동으로 DB에 기록됩니다.

**예시: Playwright 테스트 실패 시**
```typescript
// src/utils/errorReporter.ts 자동 호출
import { reportPlaywrightError } from './errorReporter';

try {
  await page.click('button[type="submit"]');
} catch (error) {
  // 자동으로 에러 DB에 기록
  await reportPlaywrightError('WBSalesHub', error, 'staging', testRunId);
}
```

**기록되는 정보**:
- 에러 메시지 (정규화됨)
- 에러 카테고리 (자동 분류: docker-build, sso-auth, api-error 등)
- 심각도 (critical, high, medium, low)
- 스택 트레이스
- 환경 (local, staging, production)
- 프로젝트명 (WBHubManager, WBSalesHub 등)

### 2. 유사 에러 검색

에러 발생 시 과거 유사 에러를 자동으로 검색합니다.

**API 호출 예시**:
```bash
curl -X POST http://localhost:4080/api/error-patterns/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Connection refused",
    "filters": {
      "project_name": "WBHubManager",
      "environment": "production"
    },
    "limit": 5
  }'
```

**응답 예시**:
```json
{
  "patterns": [
    {
      "id": 1,
      "error_message": "Error: connect ECONNREFUSED ::1:5432",
      "error_category": "DATABASE",
      "severity": "critical",
      "occurrence_count": 12,
      "relevance_score": 0.87,
      "solutions": [
        {
          "solution_title": "DATABASE_URL 설정 수정",
          "success_rate": 95.5,
          "solution_steps": [
            "1. .env.local 파일 열기",
            "2. DATABASE_URL 확인: postgresql://workhub:workhub@localhost:5432/...",
            "3. 서버 재시작"
          ]
        }
      ]
    }
  ],
  "total": 3
}
```

### 3. 솔루션 자동 제안

유사 에러 발견 시 성공률 높은 솔루션을 자동으로 제안합니다.

**솔루션 정보**:
- **solution_title**: 해결책 제목
- **solution_steps**: 단계별 가이드
- **code_snippets**: 수정이 필요한 코드 스니펫
- **files_modified**: 수정 대상 파일 목록
- **success_rate**: 성공률 (0-100%)
- **reference_docs**: 참고 문서 링크
- **related_commit_hash**: 관련 Git 커밋 해시

### 4. 작업기록 파싱

과거 작업기록에서 에러 패턴 및 솔루션을 자동으로 추출합니다.

**작업기록 형식 예시**:
```markdown
# 작업기록: Docker 빌드 최적화

## 발생한 문제
- Docker 빌드 중 OOM (Out of Memory) 에러 발생
- 에러 메시지: `JavaScript heap out of memory`

## 해결 방법
1. BuildKit 캐시 마운트 추가
2. NODE_OPTIONS="--max-old-space-size=2048" 설정
3. npm ci 대신 --mount=type=cache 사용

## 결과
- 빌드 시간 4.5분 → 3.1분 (31% 감소)
- 메모리 사용량 3.5GB → 2.1GB (40% 감소)
```

**파싱 스크립트 실행**:
```bash
# WHCommon/작업기록/완료/*.md 파일 일괄 import
cd /home/peterchung/HWTestAgent
npm run import-work-logs

# 결과:
# ✓ 5개 파일 파싱 완료
# ✓ 23개 에러 패턴 추출
# ✓ 47개 솔루션 매핑
```

---

## 테스트 스크립트 템플릿 시스템

### 1. 템플릿 검색

태그, 타입, 프로젝트로 템플릿을 검색할 수 있습니다.

**API 호출 예시**:
```bash
curl -X GET "http://localhost:4080/api/templates?type=e2e&tags=oauth&project=WBSalesHub"
```

**응답 예시**:
```json
{
  "templates": [
    {
      "id": 1,
      "template_name": "e2e-google-oauth-login",
      "template_type": "e2e",
      "description": "Google OAuth 자동 로그인 테스트",
      "variables": {
        "BASE_URL": "기본 URL (예: http://localhost:3010)",
        "TEST_USER_EMAIL": "테스트 계정 이메일",
        "TEST_USER_PASSWORD": "테스트 계정 비밀번호"
      },
      "tags": ["oauth", "google", "authentication"],
      "times_used": 47,
      "success_rate": 92.5
    }
  ]
}
```

### 2. 템플릿 생성

변수를 입력하여 실행 가능한 테스트 스크립트를 생성합니다.

**API 호출 예시**:
```bash
curl -X POST http://localhost:4080/api/templates/1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "BASE_URL": "http://localhost:3010",
      "TEST_USER_EMAIL": "biz.dev@wavebridge.com",
      "TEST_USER_PASSWORD": "wave1234!!"
    }
  }'
```

**응답 예시**:
```json
{
  "script": "import { test, expect } from '@playwright/test';\n\ntest('Google OAuth login', async ({ page }) => {\n  await page.goto('http://localhost:3010');\n  await page.click('button:has-text(\"Google Login\")');\n  await page.fill('input[type=\"email\"]', 'biz.dev@wavebridge.com');\n  await page.click('button:has-text(\"Next\")');\n  await page.fill('input[type=\"password\"]', 'wave1234!!');\n  await page.click('button:has-text(\"Sign in\")');\n  await expect(page).toHaveURL(/dashboard/);\n});\n",
  "template_name": "e2e-google-oauth-login"
}
```

**생성된 스크립트 저장 및 실행**:
```bash
# 스크립트 저장
echo "$SCRIPT" > tests/oauth-login.spec.ts

# Playwright 실행
npx playwright test tests/oauth-login.spec.ts
```

### 3. 기본 제공 템플릿

| 템플릿명 | 타입 | 설명 | 변수 |
|----------|------|------|------|
| **e2e-google-oauth-login** | E2E | Google OAuth 자동 로그인 | BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD |
| **e2e-cross-hub-navigation** | E2E | 허브 간 네비게이션 테스트 | BASE_URL, SOURCE_HUB, TARGET_HUB |
| **integration-api-crud** | 통합 | API CRUD 테스트 | API_BASE_URL, ENTITY_NAME, AUTH_TOKEN |
| **integration-auth-flow** | 통합 | 인증 플로우 테스트 | API_BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD |
| **unit-service-test** | 단위 | 서비스 레이어 테스트 | SERVICE_NAME, METHOD_NAME |

---

## 스킬테스터 연동

### 1. 자동 에러 기록

스킬테스터 실행 시 테스트 실패가 자동으로 에러 DB에 기록됩니다.

**트리거 조건**:
- Playwright 테스트 실패
- Jest 단위 테스트 실패
- Supertest API 테스트 실패

**자동 기록 정보**:
- 에러 메시지
- 스택 트레이스
- 스크린샷 (Playwright의 경우)
- HTTP 응답 (API 테스트의 경우)
- 테스트 실행 ID (test_run_id)

### 2. 실시간 솔루션 제안

테스트 실패 즉시 유사 에러를 검색하여 솔루션을 제안합니다.

**워크플로우**:
```
1. 테스트 실행 → 실패
2. 에러 메시지 추출 및 정규화
3. 에러 DB 검색 (유사 패턴)
4. 유사 패턴 발견?
   ├─ YES → 솔루션 제안 (성공률 순 정렬)
   │         ↓
   │         솔루션 적용 및 재테스트
   │         ↓
   │         해결 시 → ErrorOccurrence 업데이트 (resolved: true)
   │
   └─ NO → 새 에러 패턴 기록
            ↓
            수동 해결 후 솔루션 등록
```

### 3. 배포 전 체크리스트

스킬테스터는 배포 전 20+ 항목을 자동으로 검증합니다.

**빌드 검증** (자동):
- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] Docker 빌드 성공 (`DOCKER_BUILDKIT=1 docker build`)
- [ ] TypeScript 타입 에러 없음 (`tsc --noEmit`)
- [ ] ESLint 에러 없음 (`npm run lint`)

**테스트 검증** (자동):
- [ ] 단위 테스트 통과 (`npm test`)
- [ ] E2E 테스트 통과 (`npx playwright test`)
- [ ] 통합 테스트 통과 (`/스킬테스터 허브매니저->세일즈허브 통합`)

**환경 검증** (자동):
- [ ] 환경변수 모두 설정 (`.env.local`, `.env.staging`, `.env.prd`)
- [ ] 데이터베이스 마이그레이션 완료
- [ ] Docker 이미지 용량 확인 (< 400MB)

**인프라 검증** (자동):
- [ ] Nginx 설정 검증 (`nginx -t`)
- [ ] Health check 엔드포인트 정상 (`curl /api/health`)
- [ ] 포트 충돌 없음 (`netstat -tulpn`)

**인증 검증** (자동):
- [ ] Google OAuth 테스트 계정 로그인 성공
- [ ] 크로스 허브 네비게이션 동작 확인
- [ ] SSO 세션 유지 확인

**최종 검증** (자동):
- [ ] 오라클 스테이징 배포 테스트 (`https://staging.workhub.biz:4400`)
- [ ] 에러 패턴 DB에 신규 에러 없음 확인

---

## API 사용법

### 1. 에러 검색 API

**엔드포인트**: `POST /api/error-patterns/search`

**Request Body**:
```json
{
  "query": "Connection refused",
  "filters": {
    "project_name": "WBHubManager",
    "environment": "production",
    "severity": "critical"
  },
  "limit": 10,
  "offset": 0
}
```

**Response**:
```json
{
  "patterns": [
    {
      "id": 1,
      "error_message": "Error: connect ECONNREFUSED",
      "error_category": "DATABASE",
      "severity": "critical",
      "occurrence_count": 12,
      "last_seen_at": "2026-01-14T10:30:00Z",
      "relevance_score": 0.87
    }
  ],
  "total": 3
}
```

### 2. 에러 기록 API

**엔드포인트**: `POST /api/error-patterns/record`

**Request Body**:
```json
{
  "error_message": "Error: connect ECONNREFUSED ::1:5432",
  "error_code": "ECONNREFUSED",
  "project_name": "WBHubManager",
  "environment": "local",
  "stack_trace": "at Connection.open (/app/node_modules/pg/lib/client.js:123:10)",
  "context": {
    "database_url": "postgresql://...",
    "timestamp": "2026-01-14T10:30:00Z"
  }
}
```

**Response**:
```json
{
  "occurrence_id": 42,
  "similar_patterns": [
    {
      "id": 1,
      "error_message": "Error: connect ECONNREFUSED",
      "similarity_score": 0.92,
      "solutions": [...]
    }
  ]
}
```

### 3. 솔루션 조회 API

**엔드포인트**: `GET /api/error-patterns/:id/solutions`

**Response**:
```json
{
  "pattern": {
    "id": 1,
    "error_message": "Error: connect ECONNREFUSED",
    "error_category": "DATABASE"
  },
  "solutions": [
    {
      "id": 1,
      "solution_title": "DATABASE_URL 설정 수정",
      "solution_steps": [
        "1. .env.local 파일 열기",
        "2. DATABASE_URL 확인",
        "3. 서버 재시작"
      ],
      "success_rate": 95.5,
      "times_applied": 23
    }
  ]
}
```

### 4. 템플릿 검색 API

**엔드포인트**: `GET /api/templates?type=e2e&tags=oauth&project=WBSalesHub`

**Response**:
```json
{
  "templates": [
    {
      "id": 1,
      "template_name": "e2e-google-oauth-login",
      "template_type": "e2e",
      "description": "Google OAuth 자동 로그인",
      "variables": {
        "BASE_URL": "기본 URL",
        "TEST_USER_EMAIL": "테스트 계정 이메일"
      },
      "tags": ["oauth", "google"],
      "times_used": 47,
      "success_rate": 92.5
    }
  ],
  "total": 1
}
```

### 5. 템플릿 생성 API

**엔드포인트**: `POST /api/templates/:id/generate`

**Request Body**:
```json
{
  "variables": {
    "BASE_URL": "http://localhost:3010",
    "TEST_USER_EMAIL": "biz.dev@wavebridge.com",
    "TEST_USER_PASSWORD": "wave1234!!"
  }
}
```

**Response**:
```json
{
  "script": "import { test, expect } from '@playwright/test';\n\ntest('Google OAuth login', async ({ page }) => {\n  // 생성된 테스트 스크립트\n});\n",
  "template_name": "e2e-google-oauth-login"
}
```

---

## CLI 도구 사용법

### 1. 에러 검색 CLI

**스크립트**: `scripts/search-error.sh`

**사용법**:
```bash
# 기본 검색
./scripts/search-error.sh "Connection refused"

# 프로젝트 필터
./scripts/search-error.sh "Connection refused" --project=WBHubManager

# 환경 필터
./scripts/search-error.sh "Connection refused" --env=production

# 솔루션 자동 표시
./scripts/search-error.sh "Connection refused" --show-solutions
```

**출력 예시**:
```
🔍 Searching for errors matching: "Connection refused"

┌────┬────────────────────────────────┬──────────┬──────────┬───────┬─────────────┐
│ ID │ Error Message                  │ Category │ Severity │ Count │ Last Seen   │
├────┼────────────────────────────────┼──────────┼──────────┼───────┼─────────────┤
│ 1  │ Error: connect ECONNREFUSED    │ DATABASE │ critical │ 12    │ 2026-01-14  │
│ 2  │ ECONNREFUSED ::1:5432          │ DATABASE │ high     │ 8     │ 2026-01-13  │
└────┴────────────────────────────────┴──────────┴──────────┴───────┴─────────────┘

💡 Top Solution (95.5% success rate):
   DATABASE_URL 설정 수정
   1. .env.local 파일 열기
   2. DATABASE_URL 확인: postgresql://workhub:workhub@localhost:5432/...
   3. 서버 재시작
```

### 2. 작업기록 Import CLI

**스크립트**: `scripts/import-work-logs.ts`

**사용법**:
```bash
# 전체 작업기록 import
npm run import-work-logs

# 특정 폴더만 import
npm run import-work-logs -- --folder=/home/peterchung/WHCommon/작업기록/완료
```

**출력 예시**:
```
📂 Scanning work logs: /home/peterchung/WHCommon/작업기록/완료
✓ Found 5 markdown files

📄 Processing: 2026-01-12-docker-build-optimization.md
   ✓ Extracted 4 error patterns
   ✓ Mapped 7 solutions

📄 Processing: 2026-01-11-oracle-deployment.md
   ✓ Extracted 3 error patterns
   ✓ Mapped 5 solutions

...

✅ Import completed!
   - Files processed: 5
   - Error patterns extracted: 23
   - Solutions mapped: 47
   - Duplicates merged: 8
```

---

## 문제 해결

### 1. 서버 실행 안됨

**증상**: `npm run dev` 실행 시 에러 발생

**해결 방법**:
1. 포트 확인:
   ```bash
   netstat -tulpn | grep 4080
   # 포트 사용 중이면 프로세스 종료
   kill -9 <PID>
   ```

2. 환경변수 확인:
   ```bash
   cat .env.local
   # DATABASE_URL, PORT 값 확인
   ```

3. 데이터베이스 연결 확인:
   ```bash
   psql -U workhub -d hwtestagent -c "SELECT 1"
   ```

### 2. 에러 검색 API 느림

**증상**: 에러 검색 API가 0.5초 이상 소요

**해결 방법**:
1. 인덱스 확인:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'error_patterns';
   ```

2. EXPLAIN ANALYZE 실행:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM error_patterns
   WHERE error_message_vector @@ to_tsquery('connection & refused');
   ```

3. 인덱스 재생성 (필요 시):
   ```sql
   REINDEX TABLE error_patterns;
   ```

### 3. 템플릿 생성 실패

**증상**: 템플릿 생성 API가 400 에러 반환

**해결 방법**:
1. 필수 변수 확인:
   ```bash
   curl -X GET http://localhost:4080/api/templates/1
   # variables 필드에서 필수 변수 목록 확인
   ```

2. 변수 형식 확인:
   ```json
   {
     "variables": {
       "BASE_URL": "http://localhost:3010",  // ✅ 올바름
       "TEST_USER_EMAIL": "biz.dev@wavebridge.com"  // ✅ 올바름
     }
   }
   ```

3. 템플릿 ID 확인:
   ```bash
   curl -X GET http://localhost:4080/api/templates
   # 존재하는 템플릿 ID인지 확인
   ```

### 4. 스킬테스터 연동 안됨

**증상**: 테스트 실패 시 에러 DB에 기록 안됨

**해결 방법**:
1. HWTestAgent 서버 실행 확인:
   ```bash
   curl http://localhost:4080/api/health
   ```

2. errorReporter.ts import 확인:
   ```typescript
   import { reportPlaywrightError } from '@/utils/errorReporter';
   ```

3. 환경변수 확인:
   ```bash
   echo $HWTESTAGENT_API_URL
   # 출력: http://localhost:4080
   ```

---

## 추가 리소스

### 문서
- [API 문서](/home/peterchung/HWTestAgent/docs/API.md)
- [README](/home/peterchung/HWTestAgent/README.md)
- [PRD 문서](/home/peterchung/WHCommon/기획/완료/prd-에러패턴DB-및-테스트스크립트재사용시스템.md)

### GitHub
- [HWTestAgent 저장소](https://github.com/peterchung0331/HWTestAgent)
- [PR #1: 에러 패턴 DB 시스템](https://github.com/peterchung0331/HWTestAgent/pull/1)

### 지원
- 문의: WorkHub 개발팀
- 버그 리포트: GitHub Issues

---

**최종 업데이트**: 2026-01-14
**작성자**: Claude Sonnet 4.5
