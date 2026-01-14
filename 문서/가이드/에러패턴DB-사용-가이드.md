# 에러 패턴 DB 사용 가이드

## 개요

에러 패턴 DB 시스템은 WorkHub 프로젝트에서 발생하는 에러를 자동으로 수집, 분석하고 솔루션을 제안하는 시스템입니다.

- **위치**: HWTestAgent (`/home/peterchung/HWTestAgent`)
- **API 엔드포인트**: `http://localhost:4100/api`
- **연동 스킬**: 스킬테스터-단위, 스킬테스터-E2E, 스킬테스터-통합

---

## 1. 시스템 구성

### 1.1 핵심 컴포넌트

| 컴포넌트 | 파일 위치 | 역할 |
|----------|----------|------|
| Error Pattern API | `src/server/routes/api.ts` | REST API 엔드포인트 |
| Error Search Service | `src/services/errorSearch.service.ts` | 에러 검색 및 기록 |
| Template Engine | `src/services/templateEngine.service.ts` | 템플릿 변수 치환 |
| Error Reporter | `src/utils/errorReporter.ts` | 클라이언트 유틸리티 |

### 1.2 데이터베이스 스키마

```sql
-- 에러 패턴 테이블
error_patterns (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(100),
  error_hash VARCHAR(64),
  error_message TEXT,
  error_category VARCHAR(50),
  occurrence_count INTEGER,
  first_seen TIMESTAMP,
  last_seen TIMESTAMP
)

-- 에러 발생 기록 테이블
error_occurrences (
  id SERIAL PRIMARY KEY,
  error_pattern_id INTEGER REFERENCES error_patterns(id),
  environment VARCHAR(50),
  stack_trace TEXT,
  context_info JSONB,
  resolved BOOLEAN,
  created_at TIMESTAMP
)

-- 솔루션 테이블
error_solutions (
  id SERIAL PRIMARY KEY,
  error_pattern_id INTEGER REFERENCES error_patterns(id),
  solution_title VARCHAR(200),
  solution_description TEXT,
  solution_steps JSONB,
  success_rate DECIMAL(5,2),
  times_applied INTEGER
)
```

---

## 2. API 사용법

### 2.1 에러 검색

```bash
# 에러 메시지로 검색
curl "http://localhost:4100/api/error-patterns?query=Connection%20refused"

# 프로젝트별 검색
curl "http://localhost:4100/api/error-patterns?project=WBHubManager"

# 카테고리별 검색
curl "http://localhost:4100/api/error-patterns?category=NETWORK"

# 복합 조건
curl "http://localhost:4100/api/error-patterns?query=timeout&project=WBSalesHub&category=TIMEOUT&limit=10"
```

### 2.2 에러 상세 조회 (솔루션 포함)

```bash
curl "http://localhost:4100/api/error-patterns/1"

# 응답 예시
{
  "success": true,
  "data": {
    "pattern": {
      "id": 1,
      "project_name": "WBHubManager",
      "error_message": "Connection refused at localhost:5432",
      "error_category": "NETWORK",
      "occurrence_count": 5
    },
    "solutions": [
      {
        "id": 1,
        "solution_title": "PostgreSQL 서버 실행 확인",
        "solution_description": "PostgreSQL 서버가 실행 중인지 확인합니다.",
        "solution_steps": [
          "docker ps로 PostgreSQL 컨테이너 확인",
          "실행 중이 아니면: docker-compose up -d postgres",
          "DATABASE_URL 환경변수 확인"
        ],
        "success_rate": 95.0,
        "times_applied": 10
      }
    ]
  }
}
```

### 2.3 에러 기록

```bash
curl -X POST http://localhost:4100/api/error-patterns/record \
  -H "Content-Type: application/json" \
  -d '{
    "error_message": "ECONNREFUSED 127.0.0.1:5432",
    "error_hash": "abc123def456",
    "project_name": "WBHubManager",
    "environment": "local",
    "error_category": "DATABASE",
    "stack_trace": "Error: connect ECONNREFUSED...",
    "context_info": {
      "test_type": "e2e",
      "browser": "chromium"
    }
  }'
```

### 2.4 에러 통계 조회

```bash
# 전체 통계
curl "http://localhost:4100/api/error-patterns/stats"

# 프로젝트별 통계
curl "http://localhost:4100/api/error-patterns/stats?project=WBHubManager"

# 응답 예시
{
  "success": true,
  "data": {
    "total_patterns": 25,
    "total_occurrences": 150,
    "by_category": {
      "NETWORK": 10,
      "TIMEOUT": 8,
      "AUTH": 5,
      "DATABASE": 2
    },
    "by_project": {
      "WBHubManager": 12,
      "WBSalesHub": 8,
      "WBFinHub": 5
    }
  }
}
```

---

## 3. 스킬테스터 연동

### 3.1 자동 에러 기록 (errorReporter.ts)

스킬테스터 서브 스킬에서 에러 발생 시 자동으로 에러 패턴 DB에 기록됩니다.

```typescript
// Playwright E2E 테스트 에러
import { reportPlaywrightError } from 'HWTestAgent/src/utils/errorReporter';

try {
  await page.goto('http://localhost:3090');
  await page.click('#login-button');
} catch (error) {
  // 에러 자동 기록 + 유사 솔루션 검색
  const patternId = await reportPlaywrightError(
    'WBHubManager',      // 프로젝트명
    error,               // Error 객체
    'local',             // 환경
    testRunId            // 테스트 실행 ID (옵션)
  );
}

// Jest/Vitest 단위 테스트 에러
import { reportJestError } from 'HWTestAgent/src/utils/errorReporter';

try {
  const result = await someFunction();
  expect(result).toBe(expected);
} catch (error) {
  await reportJestError('WBSalesHub', error, testRunId);
}

// API 통합 테스트 에러
import { reportApiError } from 'HWTestAgent/src/utils/errorReporter';

try {
  const response = await fetch('/api/customers');
} catch (error) {
  await reportApiError(
    'WBFinHub',          // 프로젝트명
    error,               // Error 객체
    'GET',               // HTTP 메서드
    '/api/customers',    // 엔드포인트
    500,                 // 상태 코드
    'staging',           // 환경
    testRunId            // 테스트 실행 ID (옵션)
  );
}
```

### 3.2 유사 에러 검색

```typescript
import { searchSimilarErrors, getErrorSolutions } from 'HWTestAgent/src/utils/errorReporter';

// 유사 에러 검색
const similarErrors = await searchSimilarErrors(
  'Connection refused',   // 에러 메시지
  'WBHubManager'          // 프로젝트명 (옵션)
);

// 솔루션 조회
if (similarErrors.length > 0) {
  const solutions = await getErrorSolutions(similarErrors[0].id);
  console.log('추천 솔루션:', solutions);
}
```

---

## 4. 템플릿 시스템

### 4.1 템플릿 검색

```bash
# 타입별 검색
curl "http://localhost:4100/api/templates?type=e2e"

# 태그별 검색
curl "http://localhost:4100/api/templates?tags=oauth&tags=login"
```

### 4.2 스크립트 생성

```bash
curl -X POST http://localhost:4100/api/templates/1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "BASE_URL": "http://localhost:3090",
      "TEST_USER_EMAIL": "biz.dev@wavebridge.com",
      "TEST_USER_PASSWORD": "wave1234!!"
    }
  }'

# 응답 예시
{
  "success": true,
  "data": {
    "script": "import { test } from '@playwright/test';\n\ntest('Google OAuth Login', async ({ page }) => {\n  await page.goto('http://localhost:3090');\n  // ...\n});",
    "template_name": "e2e-google-oauth-login"
  }
}
```

---

## 5. 에러 카테고리 분류

### 5.1 자동 분류 기준

| 카테고리 | 키워드 | 상태 코드 |
|----------|--------|----------|
| TIMEOUT | timeout, Timeout | - |
| NETWORK | Navigation, net::, ECONNREFUSED, ENOTFOUND | - |
| AUTH | invalid_grant, access_denied | 401, 403 |
| API | - | 500, 502, 503 |
| DATABASE | PostgreSQL, Prisma, ECONNREFUSED (5432) | - |
| VALIDATION | Validation, invalid, required | 400 |
| RUNTIME | TypeError, ReferenceError, SyntaxError | - |
| UNKNOWN | (기타) | - |

### 5.2 커스텀 카테고리 지정

```typescript
await reportError({
  project_name: 'WBHubManager',
  error_message: 'Custom error message',
  error_category: 'DATABASE',  // 명시적 지정
  environment: 'local'
});
```

---

## 6. 워크플로우

### 6.1 에러 발생 시 자동 워크플로우

```
1. 테스트 실패 감지
   ↓
2. errorReporter 호출
   ↓
3. 에러 해시 생성 (중복 방지)
   ↓
4. POST /api/error-patterns/record
   ↓
5. 기존 패턴 존재?
   ├─ YES → occurrence_count 증가 + 솔루션 반환
   └─ NO → 새 패턴 생성
   ↓
6. 유사 패턴 검색
   ↓
7. 솔루션 제안 (성공률 순 정렬)
   ↓
8. 해결 시 → error_occurrences.resolved = true
```

### 6.2 솔루션 등록 워크플로우

```
1. 새 에러 해결
   ↓
2. 해결 방법 문서화
   ↓
3. POST /api/error-solutions
   ↓
4. 다음 발생 시 자동 제안
   ↓
5. 적용 후 성공률 업데이트
```

---

## 7. 주의사항

### 7.1 환경변수

```bash
# HWTestAgent API URL
HWTESTAGENT_API_URL=http://localhost:4100/api
```

### 7.2 API 서버 실행

```bash
cd /home/peterchung/HWTestAgent
npm run dev  # 또는 npm start
```

### 7.3 데이터베이스 마이그레이션

```bash
cd /home/peterchung/HWTestAgent
npm run db:migrate
```

---

## 8. 문제 해결

### 8.1 API 연결 실패

```bash
# API 서버 상태 확인
curl http://localhost:4100/api/health

# 서버 로그 확인
cd /home/peterchung/HWTestAgent
npm run dev
```

### 8.2 에러 기록 실패

- `HWTESTAGENT_API_URL` 환경변수 확인
- 네트워크 연결 상태 확인
- API 서버 실행 여부 확인

### 8.3 솔루션 조회 실패

- 에러 패턴 ID 유효성 확인
- 해당 패턴에 등록된 솔루션 존재 여부 확인

---

## 9. 관련 문서

- [HWTestAgent API 문서](file:///home/peterchung/HWTestAgent/docs/API.md)
- [스킬테스터 가이드](file:///home/peterchung/.claude/skills/스킬테스터/)
- [claude-context.md 스킬테스터 섹션](file:///home/peterchung/WHCommon/claude-context.md)

---

마지막 업데이트: 2026-01-14
