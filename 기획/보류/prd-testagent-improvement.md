# PRD: HWTestAgent 개선 - Playwright 통합 및 Next.js 대시보드

## 1. Introduction/Overview

HWTestAgent는 현재 HTTP API 기반 테스트만 지원하며, 순수 HTML/JS 대시보드를 사용하고 있습니다. 이 PRD는 다음 세 가지 핵심 개선사항을 정의합니다:

1. **Playwright 전체 통합**: 모든 테스트(API + E2E)를 Playwright 기반으로 마이그레이션
2. **병렬 테스트 실행**: Playwright의 workers, sharding 기능을 활용한 병렬 실행
3. **Next.js 대시보드**: WBSalesHub/WBFinHub와 동일한 디자인의 새 대시보드 (포트 3100)

### 해결하려는 문제
- 브라우저 E2E 테스트 부재로 UI 버그 감지 불가
- 순차 테스트 실행으로 인한 긴 실행 시간
- 제한된 대시보드 기능 (시나리오/스위트 CRUD 불가)

---

## 2. Goals

| 목표 | 측정 기준 |
|------|----------|
| Playwright 전체 통합 | 기존 모든 HTTP 테스트 + 새 E2E 테스트가 Playwright로 실행됨 |
| 테스트 실행 시간 50% 단축 | 병렬 실행으로 전체 테스트 시간 절반 이하로 감소 |
| 대시보드 CRUD 기능 | 웹 UI에서 시나리오/스위트 생성, 수정, 삭제 가능 |
| 디자인 일관성 | WBSalesHub/WBFinHub와 동일한 UI/UX |

---

## 3. User Stories

### 3.1 테스트 관리자
- **시나리오 관리**: "웹 대시보드에서 새 테스트 시나리오를 생성하고, 기존 시나리오를 수정/삭제하고 싶다"
- **스위트 관리**: "여러 시나리오를 그룹화한 테스트 스위트를 만들고 관리하고 싶다"
- **병렬 실행**: "테스트를 병렬로 실행하여 결과를 빠르게 확인하고 싶다"

### 3.2 개발자
- **E2E 테스트**: "브라우저에서 실제 사용자 플로우를 테스트하고 싶다"
- **결과 확인**: "테스트 결과와 스크린샷, 트레이스를 대시보드에서 확인하고 싶다"

---

## 4. Functional Requirements

### 4.1 Playwright 통합

| ID | 요구사항 |
|----|----------|
| PW-01 | 기존 HTTP 테스트를 Playwright의 `request` API로 마이그레이션 |
| PW-02 | E2E 브라우저 테스트 지원 (Chromium만 지원) |
| PW-03 | 테스트 실패 시 자동 스크린샷 및 트레이스 저장 |
| PW-04 | `playwright.config.ts` 설정 파일 구성 |
| PW-05 | YAML 시나리오를 Playwright 테스트 코드로 변환하는 어댑터 구현 |

### 4.2 병렬 테스트 실행

| ID | 요구사항 |
|----|----------|
| PR-01 | `fullyParallel: true` 설정으로 모든 테스트 병렬 실행 |
| PR-02 | `workers` 옵션으로 동시 실행 워커 수 설정 (기본값: CPU 코어의 50%) |
| PR-03 | CI 환경에서 `--shard` 옵션으로 테스트 분산 실행 지원 |
| PR-04 | `test.describe.configure({ mode: 'serial' })` 로 순차 실행이 필요한 테스트 지원 |
| PR-05 | 워커별 고유 테스트 데이터 격리 (`test.info().workerIndex` 활용) |

### 4.3 Next.js 대시보드 (포트 3100)

| ID | 요구사항 |
|----|----------|
| DB-01 | Next.js 15 + React 18 + TypeScript + Tailwind CSS 구성 |
| DB-02 | WBSalesHub/WBFinHub와 동일한 사이드바 레이아웃 |
| DB-03 | 테마 색상: 보라색 계열 (`#667eea`, `#764ba2`) - 기존 HWTestAgent 색상 유지 |
| DB-04 | Pretendard 한글 폰트 적용 |
| DB-05 | 반응형 디자인 (모바일 지원) |

### 4.4 대시보드 페이지 구성

| ID | 페이지 | 요구사항 |
|----|--------|----------|
| PG-01 | 대시보드 홈 (`/`) | 전체 통계, 최근 테스트 결과, 성공률 차트 |
| PG-02 | 시나리오 목록 (`/scenarios`) | 모든 시나리오 테이블, 환경별 필터, 검색 |
| PG-03 | 시나리오 상세 (`/scenarios/[id]`) | 시나리오 정보, 스텝 목록, 실행 이력 |
| PG-04 | 시나리오 생성 (`/scenarios/new`) | YAML 에디터로 시나리오 생성 |
| PG-05 | 시나리오 수정 (`/scenarios/[id]/edit`) | 기존 시나리오 YAML 수정 |
| PG-06 | 스위트 목록 (`/suites`) | 테스트 스위트 테이블, CRUD |
| PG-07 | 스위트 상세 (`/suites/[id]`) | 스위트에 포함된 시나리오 목록, 일괄 실행 |
| PG-08 | 테스트 결과 (`/results`) | 테스트 실행 결과 목록, 상세 보기 |
| PG-09 | 결과 상세 (`/results/[id]`) | 개별 테스트 결과, 스텝별 상태, 스크린샷, 트레이스 |
| PG-10 | 설정 (`/settings`) | API 키 관리, 알림 설정, 스케줄 설정 |

### 4.5 시나리오 CRUD

| ID | 요구사항 |
|----|----------|
| SC-01 | 시나리오 목록 조회 (프로젝트/환경/타입별 필터링) |
| SC-02 | 시나리오 상세 조회 (메타데이터 + 스텝 목록) |
| SC-03 | 시나리오 생성 (YAML 에디터 + 실시간 검증) |
| SC-04 | 시나리오 수정 (YAML 에디터 + 변경사항 미리보기) |
| SC-05 | 시나리오 삭제 (확인 다이얼로그 + 관련 결과 보존 옵션) |
| SC-06 | 시나리오 복제 기능 |
| SC-07 | 시나리오 개별 실행 (환경 선택 가능) |

### 4.6 스위트 CRUD

| ID | 요구사항 |
|----|----------|
| SU-01 | 스위트 목록 조회 |
| SU-02 | 스위트 생성 (이름, 설명, 시나리오 선택) |
| SU-03 | 스위트 수정 (시나리오 추가/제거) |
| SU-04 | 스위트 삭제 |
| SU-05 | 스위트 일괄 실행 (병렬/순차 선택) |
| SU-06 | 스위트 스케줄 설정 (cron 표현식) |

### 4.7 API 엔드포인트 (백엔드 확장)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/scenarios` | 시나리오 목록 |
| GET | `/api/scenarios/:id` | 시나리오 상세 |
| POST | `/api/scenarios` | 시나리오 생성 |
| PUT | `/api/scenarios/:id` | 시나리오 수정 |
| DELETE | `/api/scenarios/:id` | 시나리오 삭제 |
| POST | `/api/scenarios/:id/run` | 시나리오 실행 |
| GET | `/api/suites` | 스위트 목록 |
| GET | `/api/suites/:id` | 스위트 상세 |
| POST | `/api/suites` | 스위트 생성 |
| PUT | `/api/suites/:id` | 스위트 수정 |
| DELETE | `/api/suites/:id` | 스위트 삭제 |
| POST | `/api/suites/:id/run` | 스위트 실행 |
| GET | `/api/results/:id/trace` | 트레이스 파일 조회 |
| GET | `/api/results/:id/screenshots` | 스크린샷 조회 |

---

## 5. Non-Goals (Out of Scope)

- 시각적 회귀 테스트 (Visual Regression Testing)
- 테스트 코드 자동 생성 (Codegen)
- 다중 사용자 권한 관리 (현재는 단일 API 키)
- 테스트 환경 프로비저닝 (Docker 컨테이너 자동 생성 등)
- 모바일 앱 테스트

---

## 6. Design Considerations

### 6.1 사이드바 네비게이션
```
HWTestAgent (로고: 보라색 #667eea)
├── 대시보드 (LayoutDashboard)
├── 시나리오 (FileCode)
├── 스위트 (FolderTree)
├── 테스트 결과 (CheckCircle)
├── 스케줄 (Calendar)
└── 설정 (Settings)
```

### 6.2 색상 팔레트
- **Primary**: `#667eea` (보라색)
- **Primary Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Success**: `#28a745` (초록)
- **Danger**: `#dc3545` (빨강)
- **Warning**: `#ffc107` (노랑)
- **Info**: `#007bff` (파랑)

### 6.3 UI 컴포넌트 (WBSalesHub에서 복사)
- Button, Card, Input, Badge, Table
- Dialog, AlertDialog, Select, DropdownMenu
- Tabs, Checkbox, Label, Separator
- Skeleton (로딩 상태)

### 6.4 YAML 에디터
- Monaco Editor 또는 CodeMirror 사용
- YAML 구문 강조
- 실시간 유효성 검증
- 자동 완성 (시나리오 스키마 기반)

---

## 7. Technical Considerations

### 7.1 Playwright 설정
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: process.env.TARGET_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### 7.2 폴더 구조
```
HWTestAgent/
├── src/                      # 기존 백엔드 (Express)
├── frontend/                 # 새 Next.js 대시보드
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # 대시보드 홈
│   │   │   ├── scenarios/
│   │   │   │   ├── page.tsx       # 시나리오 목록
│   │   │   │   ├── new/page.tsx   # 시나리오 생성
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # 시나리오 상세
│   │   │   │       └── edit/page.tsx
│   │   │   ├── suites/
│   │   │   │   ├── page.tsx       # 스위트 목록
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── results/
│   │   │   │   ├── page.tsx       # 결과 목록
│   │   │   │   └── [id]/page.tsx  # 결과 상세
│   │   │   └── settings/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── ui/                # WBSalesHub에서 복사
│   │   ├── dashboard/
│   │   ├── scenarios/
│   │   ├── suites/
│   │   └── results/
│   ├── lib/
│   ├── hooks/
│   ├── store/
│   └── types/
├── tests/                    # Playwright 테스트
│   ├── api/                  # API 테스트
│   └── e2e/                  # E2E 테스트
├── playwright.config.ts
└── scenarios/                # 기존 YAML 시나리오
```

### 7.3 데이터베이스 스키마 추가
```sql
-- 테스트 스위트 테이블
CREATE TABLE test_suites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 스위트-시나리오 매핑
CREATE TABLE suite_scenarios (
  id SERIAL PRIMARY KEY,
  suite_id INTEGER REFERENCES test_suites(id) ON DELETE CASCADE,
  scenario_slug VARCHAR(255) NOT NULL,
  project_name VARCHAR(100) NOT NULL,
  execution_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 시나리오 메타데이터 (YAML 외 추가 정보)
CREATE TABLE scenario_metadata (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(100) NOT NULL,
  scenario_slug VARCHAR(255) NOT NULL,
  last_run_at TIMESTAMP,
  last_status VARCHAR(20),
  run_count INTEGER DEFAULT 0,
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_name, scenario_slug)
);
```

### 7.4 포트 구성
- **백엔드 API**: 4100 (기존 유지)
- **Next.js 대시보드**: 3100 (새로 추가)

### 7.5 배포 환경
- **프로덕션**: Oracle Cloud만 사용 (Railway 사용 안 함)
- **Oracle Cloud 서버**: `158.180.95.246`
- **SSH 접속**: `ssh -i C:\GitHub\WHCommon\SSHkey\ssh-key-2026-01-01.key [username]@158.180.95.246`

### 7.6 의존성 추가
```json
// HWTestAgent/package.json (백엔드)
{
  "dependencies": {
    "@playwright/test": "^1.40.0"
  }
}

// HWTestAgent/frontend/package.json (프론트엔드)
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.300.0",
    "@radix-ui/react-*": "latest",
    "@monaco-editor/react": "^4.6.0",
    "js-yaml": "^4.1.0"
  }
}
```

---

## 8. Success Metrics

| 지표 | 목표 |
|------|------|
| 테스트 실행 시간 | 기존 대비 50% 이상 단축 |
| E2E 테스트 커버리지 | 주요 사용자 플로우 80% 이상 |
| 대시보드 사용률 | 테스트 관리 작업의 90% 이상이 대시보드에서 수행 |
| 시나리오 CRUD 성공률 | 100% (에러 없이 생성/수정/삭제) |

---

## 9. Open Questions

1. **트레이스 파일 저장**: 로컬 파일 시스템 vs 클라우드 스토리지 (S3 등)?
2. **YAML vs DB**: 시나리오를 YAML 파일로 유지할지, DB로 마이그레이션할지?
3. **인증**: 현재 API 키 방식 유지 vs SSO 통합?
4. **알림 확장**: 현재 Slack만 지원, 이메일/Teams 추가 필요?

---

## 10. Implementation Priority

### Phase 1: Playwright 기반 구축
1. `playwright.config.ts` 설정
2. 기존 HTTP 테스트 마이그레이션 (HttpAdapter → Playwright request)
3. 병렬 실행 설정 (workers, fullyParallel)

### Phase 2: Next.js 대시보드 기본
1. Next.js 프로젝트 초기화 (포트 3100)
2. UI 컴포넌트 복사 (WBSalesHub)
3. 사이드바 + 레이아웃 구현
4. 대시보드 홈 페이지

### Phase 3: 시나리오 관리
1. 시나리오 목록/상세 페이지
2. YAML 에디터 통합
3. 시나리오 CRUD API 및 UI

### Phase 4: 스위트 및 결과
1. 스위트 CRUD
2. 테스트 결과 상세 (스크린샷, 트레이스)
3. 스케줄 설정 UI

---

## References

- [Playwright Parallel Testing](https://playwright.dev/docs/test-parallel)
- [Playwright Sharding](https://playwright.dev/docs/test-sharding)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [BrowserStack - Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices)
