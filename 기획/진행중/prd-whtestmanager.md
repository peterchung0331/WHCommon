# WHTestManager 설계 문서

**작성일:** 2026-01-01
**목적:** 멀티 프로젝트 테스트 자동화 및 중앙 관리 시스템

---

## 1. 현재 상황 분석

### 1.1 기존 테스트 환경

| 항목 | 현재 방식 | 문제점 |
|------|----------|--------|
| **테스트 시나리오** | MD 파일로 수동 관리 (테스트_정밀.md 등) | 자동화 부족, 시나리오 버전관리 어려움 |
| **테스트 실행** | 프로젝트별 `npm run test:*` | 분산 실행, 통합 뷰 없음 |
| **테스트 결과** | TestReport 폴더에 MD 저장 | PC 꺼지면 테스트 불가 |
| **환경 커버리지** | 로컬 Docker + Railway | 24/7 자동화 없음 |

### 1.2 관리 대상 프로젝트

```
C:\GitHub\
├── WBHubManager/      # Gateway + SSO 인증
├── WBFinHub/          # 재무 관리
├── WBSalesHub/        # 영업 관리
├── WBOnboardingHub/   # 온보딩
└── WorkHubShared/     # 공유 문서/설정
```

### 1.3 기존 테스트 파일 구조

```
WorkHubShared/
├── Docker/
│   ├── 테스트_정밀.md    # 9개 테스트 (Part A)
│   ├── 테스트_일반.md    # 기본 4개 테스트
│   └── 테스트_인증.md    # SSO 7개 테스트
└── TestReport/
    ├── 테스트-리포트-템플릿.md
    └── 2025-12-31-*.md   # 테스트 결과 리포트
```

---

## 2. 결론: 별도 프로젝트가 효율적

### 이유

1. **독립적 스케줄링**: PC 꺼져도 클라우드에서 테스트 실행
2. **중앙 집중화**: 여러 프로젝트 테스트를 한 곳에서 관리
3. **히스토리 추적**: 테스트 결과 DB화, 트렌드 분석 가능
4. **알림 통합**: Slack/Discord/Email로 결과 전달

---

## 3. 기존 사례 & 아키텍처 패턴

### 3.1 GitHub Actions 기반 (무료/간단)

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  WHTestManager                                               │
│  ├── .github/workflows/                                      │
│  │   ├── scheduled-tests.yml (cron: 0 6,18 * * *)           │
│  │   └── on-demand-tests.yml (workflow_dispatch)            │
│  ├── scenarios/                                              │
│  │   ├── wbhubmanager/정밀.json                             │
│  │   ├── wbfinhub/sso.json                                  │
│  │   └── integration/cross-service.json                      │
│  └── results/ (GitHub Pages로 대시보드)                      │
└─────────────────────────────────────────────────────────────┘
```

**장점**: 무료, 설정 간단, PC 꺼져도 실행
**단점**: Railway 접근 시 시크릿 관리 필요

---

### 3.2 Railway 상주 서비스 (추천)

```
┌─────────────────────────────────────────────────────────────┐
│  Railway                                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  WHTestManager Service                                 │  │
│  │  ├── Scheduler (node-cron)                            │  │
│  │  │   - 매일 06:00, 18:00 정기 테스트                   │  │
│  │  │   - 배포 웹훅 트리거 시 즉시 테스트                 │  │
│  │  ├── Test Runner                                       │  │
│  │  │   - Playwright (E2E)                               │  │
│  │  │   - Custom HTTP tests                               │  │
│  │  ├── Results DB (PostgreSQL)                          │  │
│  │  │   - 테스트 히스토리                                 │  │
│  │  │   - 실패 트렌드 분석                                │  │
│  │  └── Notification Service                              │  │
│  │       - Slack/Discord webhook                          │  │
│  │       - Email (SendGrid/Resend)                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐       │
│  │ WBHubManager│ │  WBFinHub   │ │ WBOnboardingHub │       │
│  │   :4090     │ │   :4020     │ │     :4030       │       │
│  └─────────────┘ └─────────────┘ └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**장점**: Railway 내부 네트워크로 직접 테스트, 24/7 가동
**단점**: 약간의 비용 ($5-10/월)

---

### 3.3 하이브리드 (최적)

```
┌──────────────────┐     ┌──────────────────────────────────┐
│  GitHub Actions  │────▶│  WHTestManager (Railway)         │
│  - 스케줄 트리거  │     │  - 실제 테스트 실행              │
│  - 배포 후 트리거 │     │  - 결과 저장/알림                │
└──────────────────┘     └──────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   Production    │    │   Staging       │    │   Local Docker  │
    │  (Railway)      │    │  (Railway)      │    │  (로컬 PC)      │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 4. 제안 아키텍처: WHTestManager

### 4.1 프로젝트 구조

```
WHTestManager/
├── src/
│   ├── server/
│   │   ├── index.ts              # Express 서버
│   │   ├── scheduler.ts          # node-cron 스케줄러
│   │   └── routes/
│   │       ├── api.ts            # REST API
│   │       └── webhook.ts        # Railway 배포 훅
│   │
│   ├── runner/
│   │   ├── TestRunner.ts         # 테스트 실행 엔진
│   │   ├── scenarios/
│   │   │   ├── ScenarioLoader.ts # JSON/YAML 시나리오 로더
│   │   │   └── ScenarioRunner.ts # 시나리오 순차 실행
│   │   └── adapters/
│   │       ├── HttpAdapter.ts    # REST API 테스트
│   │       ├── PlaywrightAdapter.ts  # E2E 테스트
│   │       └── DockerAdapter.ts  # Docker 컨테이너 테스트
│   │
│   ├── storage/
│   │   ├── ResultsDB.ts          # PostgreSQL 결과 저장
│   │   └── ScenarioStore.ts      # 시나리오 CRUD
│   │
│   └── notification/
│       ├── SlackNotifier.ts
│       ├── DiscordNotifier.ts
│       └── EmailNotifier.ts
│
├── scenarios/                    # 테스트 시나리오
│   ├── wbhubmanager/
│   │   ├── health.yaml
│   │   ├── 정밀테스트.yaml
│   │   └── sso.yaml
│   ├── wbfinhub/
│   │   ├── health.yaml
│   │   └── accounts-crud.yaml
│   └── integration/
│       └── cross-hub-sso.yaml
│
├── frontend/                     # 대시보드 (Next.js)
│   ├── app/
│   │   ├── page.tsx             # 메인 대시보드
│   │   ├── history/             # 테스트 히스토리
│   │   ├── scenarios/           # 시나리오 관리
│   │   └── settings/            # 스케줄/알림 설정
│   └── components/
│       ├── TestResultCard.tsx
│       ├── TrendChart.tsx
│       └── ScenarioEditor.tsx
│
├── prisma/
│   └── schema.prisma
│
├── package.json
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

### 4.2 데이터베이스 스키마

```prisma
// prisma/schema.prisma

model Project {
  id          String   @id @default(cuid())
  name        String   @unique  // WBHubManager, WBFinHub, etc.
  slug        String   @unique
  description String?
  baseUrl     String   // https://wbhub.up.railway.app
  localUrl    String?  // http://localhost:4090
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  scenarios   Scenario[]
  testRuns    TestRun[]
}

model Scenario {
  id          String   @id @default(cuid())
  name        String
  slug        String
  description String?
  type        ScenarioType  // HEALTH, PRECISION, SSO, E2E, INTEGRATION
  content     Json     // YAML parsed to JSON
  schedule    String?  // cron expression
  enabled     Boolean  @default(true)
  timeout     Int      @default(300000)  // 5분
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  testRuns    TestRun[]

  @@unique([projectId, slug])
}

model TestRun {
  id          String    @id @default(cuid())
  status      TestStatus  // PENDING, RUNNING, PASSED, FAILED, ERROR
  environment Environment // PRODUCTION, STAGING, LOCAL
  triggeredBy TriggerType // SCHEDULE, WEBHOOK, MANUAL
  startedAt   DateTime  @default(now())
  finishedAt  DateTime?
  duration    Int?      // milliseconds
  summary     Json?     // { total: 9, passed: 9, failed: 0 }

  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  scenarioId  String
  scenario    Scenario  @relation(fields: [scenarioId], references: [id])

  steps       TestStep[]
  notifications Notification[]
}

model TestStep {
  id          String     @id @default(cuid())
  name        String
  order       Int
  status      TestStatus
  startedAt   DateTime
  finishedAt  DateTime?
  duration    Int?
  error       String?
  output      Json?      // response body, logs, etc.

  testRunId   String
  testRun     TestRun    @relation(fields: [testRunId], references: [id])
}

model Notification {
  id          String   @id @default(cuid())
  channel     NotificationChannel  // SLACK, DISCORD, EMAIL
  status      NotificationStatus   // SENT, FAILED
  sentAt      DateTime @default(now())
  payload     Json
  error       String?

  testRunId   String
  testRun     TestRun  @relation(fields: [testRunId], references: [id])
}

model Schedule {
  id          String   @id @default(cuid())
  name        String
  cron        String   // "0 6,18 * * *"
  enabled     Boolean  @default(true)
  environment Environment
  lastRunAt   DateTime?
  nextRunAt   DateTime?

  scenarioIds String[] // 실행할 시나리오 ID 목록
}

enum ScenarioType {
  HEALTH
  PRECISION
  SSO
  E2E
  INTEGRATION
  PERFORMANCE
}

enum TestStatus {
  PENDING
  RUNNING
  PASSED
  FAILED
  ERROR
  SKIPPED
}

enum Environment {
  PRODUCTION
  STAGING
  LOCAL
}

enum TriggerType {
  SCHEDULE
  WEBHOOK
  MANUAL
}

enum NotificationChannel {
  SLACK
  DISCORD
  EMAIL
}

enum NotificationStatus {
  SENT
  FAILED
}
```

---

## 5. YAML 시나리오 정의 형식

### 5.1 기본 구조

```yaml
# 메타데이터 섹션
name: "테스트 이름"
slug: "unique-id"
description: "설명"
type: PRECISION          # 테스트 종류
schedule: "0 6 * * *"    # 실행 스케줄 (cron)
timeout: 30m             # 전체 타임아웃
notify_on: [failure]     # 알림 조건

# 환경별 변수
variables:
  production:
    TARGET_URL: "https://wbhub.up.railway.app"
  local:
    TARGET_URL: "http://localhost:4090"

# 테스트 단계들
steps:
  - name: "Step 1"
    type: http
    # ...세부 설정
```

### 5.2 정밀 테스트 시나리오 예시

```yaml
# scenarios/wbhubmanager/정밀테스트.yaml
name: "WBHubManager Docker 정밀 테스트"
slug: "precision"
description: "Railway 배포 전 필수 테스트 (Part A 9개 항목)"
type: PRECISION
environment:
  - production
  - local
schedule: "0 6 * * *"  # 매일 06:00
timeout: 30m
notify_on:
  - failure
  - recovery

variables:
  production:
    TARGET_URL: "https://wbhub.up.railway.app"
    DB_CHECK: false
  local:
    TARGET_URL: "http://localhost:4090"
    DB_CHECK: true

steps:
  - name: "Test 1: TypeScript 타입 체크"
    type: docker
    condition: "{{environment}} == 'local'"
    image: node:20-alpine
    working_dir: /app/WBHubManager
    commands:
      - "npx tsc --noEmit"
      - "cd frontend && npx tsc --noEmit"
    expect:
      exit_code: 0
    timeout: 5m

  - name: "Test 2: Docker 빌드"
    type: docker
    condition: "{{environment}} == 'local'"
    dockerfile: Dockerfile.test
    context: /app/WBHubManager
    expect:
      build_success: true
    timeout: 10m

  - name: "Test 3: 런타임 테스트"
    type: docker
    condition: "{{environment}} == 'local'"
    image: "wbhub-build-test"
    env_file: ".env.docker-test"
    ports:
      - "14090:4090"
    wait: 10s
    expect:
      container_running: true

  - name: "Test 4: Health Check"
    type: http
    url: "{{TARGET_URL}}/api/health"
    method: GET
    expect:
      status: 200
      json:
        success: true
    retry:
      count: 3
      delay: 5s

  - name: "Test 5: Frontend 라우트 테스트"
    type: http
    critical: true
    requests:
      - name: "루트 페이지"
        url: "{{TARGET_URL}}/"
        expect:
          status: 200
          body_contains: "<!DOCTYPE html>"
      - name: "Hub 선택 페이지"
        url: "{{TARGET_URL}}/hubs/"
        expect:
          status: 200
          body_contains: "<!DOCTYPE html>"
      - name: "문서 페이지"
        url: "{{TARGET_URL}}/docs"
        expect:
          status: 200
          body_contains: "<!DOCTYPE html>"
    on_failure:
      message: "Frontend Static Export 문제! 배포 전 반드시 해결 필요"

  - name: "Test 6: API 엔드포인트"
    type: http
    requests:
      - url: "{{TARGET_URL}}/api/hubs"
        method: GET
        expect:
          status: 200
          json:
            success: true
      - url: "{{TARGET_URL}}/api/auth/me"
        method: GET
        expect:
          status_in: [200, 401]

  - name: "Test 7: 환경변수 검증"
    type: docker
    condition: "{{environment}} == 'local'"
    container: "wbhub-test"
    commands:
      - "env | grep DATABASE_URL"
      - "env | grep SESSION_SECRET"
      - "env | grep JWT_PRIVATE_KEY"
      - "env | grep JWT_PUBLIC_KEY"
      - "env | grep JWT_SECRET"
      - "env | grep GOOGLE_CLIENT_ID"
      - "env | grep GOOGLE_CLIENT_SECRET"
      - "env | grep APP_URL"
    expect:
      output_not_empty: true

  - name: "Test 8: 데이터베이스 연결"
    type: docker
    condition: "{{DB_CHECK}} == true"
    container: "wbhub-test"
    command: "cat /proc/1/fd/1 | grep -i 'PostgreSQL\\|Database connection'"
    expect:
      output_contains: "connected"

  - name: "Test 9: 리소스 사용량"
    type: docker
    condition: "{{environment}} == 'local'"
    container: "wbhub-test"
    command: "docker stats --no-stream --format '{{.CPUPerc}} {{.MemUsage}}'"
    expect:
      cpu_percent_lt: 50
      memory_mb_lt: 1024
```

### 5.3 SSO 테스트 시나리오

```yaml
# scenarios/wbhubmanager/sso.yaml
name: "WBHubManager SSO 인증 테스트"
slug: "sso"
description: "Hub 간 SSO 인증 플로우 검증"
type: SSO
environment:
  - production
schedule: "0 6,18 * * *"
timeout: 15m
notify_on:
  - failure

variables:
  production:
    HUB_MANAGER_URL: "https://wbhub.up.railway.app"
    FINHUB_URL: "https://wbfinhub.up.railway.app"

steps:
  - name: "SSO-1: JWT 공개키 조회"
    type: http
    url: "{{HUB_MANAGER_URL}}/api/auth/public-key"
    method: GET
    expect:
      status: 200
      json:
        success: true
        data:
          publicKey: "^-----BEGIN PUBLIC KEY-----"
    save:
      PUBLIC_KEY: "$.data.publicKey"

  - name: "SSO-2: 토큰 검증 (토큰 없음)"
    type: http
    url: "{{HUB_MANAGER_URL}}/api/auth/verify"
    method: POST
    expect:
      status: 401

  - name: "SSO-3: Google 로그인 엔드포인트"
    type: http
    url: "{{HUB_MANAGER_URL}}/api/auth/google"
    method: GET
    expect:
      status_in: [302, 200]

  - name: "SSO-4: FinHub에서 HubManager 공개키 조회"
    type: http
    url: "{{FINHUB_URL}}/api/auth/verify"
    method: POST
    headers:
      Authorization: "Bearer invalid-token"
    expect:
      status: 401
      json:
        error: true

  - name: "SSO-5: Rate Limiting 테스트"
    type: http
    url: "{{HUB_MANAGER_URL}}/api/auth/google-login"
    method: POST
    repeat: 15
    body:
      idToken: "invalid"
    expect:
      final_status: 429

  - name: "SSO-6: 알고리즘 혼동 공격 방어"
    type: http
    url: "{{HUB_MANAGER_URL}}/api/auth/verify"
    method: POST
    headers:
      Authorization: "Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0."
    expect:
      status: 401

  - name: "SSO-7: 과대 토큰 거부"
    type: http
    url: "{{HUB_MANAGER_URL}}/api/auth/verify"
    method: POST
    headers:
      Authorization: "Bearer {{LARGE_TOKEN}}"
    expect:
      status_in: [400, 401, 413]
```

### 5.4 통합 테스트 시나리오

```yaml
# scenarios/integration/cross-hub-sso.yaml
name: "Cross-Hub SSO 통합 테스트"
slug: "cross-hub-sso"
description: "HubManager에서 발급한 JWT로 FinHub 접근 테스트"
type: INTEGRATION
environment:
  - production
schedule: "0 7 * * *"
timeout: 20m
notify_on:
  - failure
  - success

dependencies:
  - wbhubmanager/health
  - wbfinhub/health

variables:
  production:
    HUB_MANAGER_URL: "https://wbhub.up.railway.app"
    FINHUB_URL: "https://wbfinhub.up.railway.app"

steps:
  - name: "INT-1: HubManager Health Check"
    type: http
    url: "{{HUB_MANAGER_URL}}/api/health"
    expect:
      status: 200

  - name: "INT-2: FinHub Health Check"
    type: http
    url: "{{FINHUB_URL}}/api/health"
    expect:
      status: 200

  - name: "INT-3: HubManager JWT 공개키 조회"
    type: http
    url: "{{HUB_MANAGER_URL}}/api/auth/public-key"
    expect:
      status: 200
    save:
      PUBLIC_KEY: "$.data.publicKey"

  - name: "INT-4: E2E SSO 플로우"
    type: playwright
    browser: chromium
    headless: true
    script: |
      await page.goto('{{HUB_MANAGER_URL}}/auth/login');
      await page.waitForSelector('[data-testid="google-login-btn"]');

      const loginBtn = await page.$('[data-testid="google-login-btn"]');
      expect(loginBtn).toBeTruthy();

      await page.goto('{{FINHUB_URL}}');
      const url = page.url();
      expect(url).toContain('/auth');
    expect:
      assertions_passed: true
```

---

## 6. Step 타입별 설명

### 6.1 HTTP 타입 - API 테스트

```yaml
- name: "API 테스트"
  type: http
  url: "{{TARGET_URL}}/api/endpoint"
  method: GET                    # GET, POST, PUT, DELETE
  headers:
    Authorization: "Bearer {{TOKEN}}"
  body:
    key: "value"
  expect:
    status: 200
    status_in: [200, 201]
    json:
      success: true
    body_contains: "text"
  timeout: 10s
  retry:
    count: 3
    delay: 5s
  save:
    RESULT: "$.data.id"
```

### 6.2 Docker 타입 - 컨테이너 테스트

```yaml
- name: "Docker 테스트"
  type: docker
  image: node:20-alpine
  dockerfile: Dockerfile.test
  container: "existing-container"
  working_dir: /app
  commands:
    - "npm run build"
  expect:
    exit_code: 0
    build_success: true
    container_running: true
    output_contains: "success"
```

### 6.3 Playwright 타입 - E2E 테스트

```yaml
- name: "E2E 테스트"
  type: playwright
  browser: chromium
  headless: true
  script: |
    await page.goto('{{URL}}');
    await page.click('button');
    expect(await page.title()).toBe('Expected');
  expect:
    assertions_passed: true
  artifacts:
    - "screenshot.png"
```

---

## 7. 결과 알림 형식

### 7.1 Slack 알림 템플릿

```
🧪 WHTestManager 테스트 결과

📦 WBHubManager - Production
✅ 정밀 테스트: 9/9 통과 (2m 34s)
✅ SSO 테스트: 7/7 통과 (1m 12s)

📦 WBFinHub - Production
✅ Health Check: 통과
⚠️ Accounts CRUD: 4/5 통과
   └─ ❌ Test #3: DELETE /api/accounts/1 - 403 Forbidden

📊 트렌드: 지난 7일 평균 성공률 98.5%
🕐 실행 시간: 2026-01-01 06:00:00 KST
🔗 대시보드: https://whtestmanager.up.railway.app
```

### 7.2 실패 시 상세 알림

```
🚨 WHTestManager 테스트 실패 알림

📦 WBHubManager - Production
❌ 정밀 테스트: 7/9 실패

실패한 테스트:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Test 5: Frontend 라우트 테스트
   - URL: https://wbhub.up.railway.app/hubs/
   - Expected: status 200
   - Actual: status 404
   - Error: Static file not found

❌ Test 6: API 엔드포인트
   - URL: https://wbhub.up.railway.app/api/hubs
   - Expected: status 200
   - Actual: status 500
   - Error: Database connection failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 가능한 원인:
1. Next.js static export 실패
2. PostgreSQL 연결 문제
3. 최근 배포 변경사항 확인 필요

🔗 상세 로그: https://whtestmanager.up.railway.app/runs/abc123
```

---

## 8. 대시보드 UI 설계

### 8.1 메인 대시보드

```
┌─────────────────────────────────────────────────────────────────────┐
│  WHTestManager                                    🔔 Settings       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📊 Overview                                      Last 7 days       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │    156     │ │    152     │ │     4      │ │   97.4%    │       │
│  │ Total Runs │ │   Passed   │ │   Failed   │ │Success Rate│       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│                                                                     │
│  📈 Success Rate Trend                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  100% ─────────────────●────●────●────●────●────●────●      │   │
│  │   95% ────●────●───────                                     │   │
│  │   90%                                                        │   │
│  │        Mon   Tue   Wed   Thu   Fri   Sat   Sun              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📦 Projects                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ WBHubManager          ✅ All passing      Last: 2m ago      │   │
│  │ └─ 정밀테스트 9/9    └─ SSO 7/7         └─ Health ✅        │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ WBFinHub              ⚠️ 1 failing       Last: 2m ago       │   │
│  │ └─ Health ✅          └─ CRUD 4/5 ❌                        │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ WBSalesHub            ✅ All passing      Last: 2m ago      │   │
│  │ └─ Health ✅                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📅 Upcoming Schedules                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 06:00  정밀 테스트 (All Projects)           in 4h 23m       │   │
│  │ 18:00  SSO 테스트 (HubManager, FinHub)      in 16h 23m      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. 비교 요약

| 방식 | 비용 | 복잡도 | 24/7 | 내부 네트워크 | 추천 |
|-----|------|-------|------|--------------|------|
| GitHub Actions만 | 무료 | 낮음 | ✅ | ❌ | △ |
| Oracle Cloud 상주 | 무료 | 중간 | ✅ | ✅ | ⭐ |
| 하이브리드 | 무료 | 높음 | ✅ | ✅ | ◎ |

---

## 10. 구현 로드맵

### Phase 1: 기본 인프라 (1주)
- [ ] 프로젝트 초기화 (TypeScript, Express, Prisma)
- [ ] 데이터베이스 스키마 구현
- [ ] 기본 API 라우트 구현
- [ ] Oracle Cloud 배포 설정

### Phase 2: 테스트 러너 (1주)
- [ ] YAML 시나리오 로더 구현
- [ ] HTTP 어댑터 구현 (REST API 테스트)
- [ ] 기존 테스트_정밀.md → YAML 마이그레이션
- [ ] 결과 저장 로직 구현

### Phase 3: 스케줄러 & 알림 (1주)
- [ ] node-cron 스케줄러 구현
- [ ] Slack 알림 구현
- [ ] 배포 웹훅 트리거 구현
- [ ] 수동 실행 API 구현

### Phase 4: 대시보드 (1주)
- [ ] Next.js 프론트엔드 설정
- [ ] 메인 대시보드 구현
- [ ] 테스트 히스토리 페이지
- [ ] 시나리오 관리 페이지

### Phase 5: 고급 기능 (선택)
- [ ] Playwright 어댑터 (E2E 테스트)
- [ ] Docker 어댑터 (컨테이너 테스트)
- [ ] 성능 테스트 지원
- [ ] 멀티 환경 (Production/Staging/Local) 지원

---

## 11. 다음 단계

1. [ ] WHTestManager 프로젝트 초기 구조 생성
2. [ ] 핵심 기능 (Scheduler, TestRunner, Results DB) 구현
3. [ ] 기존 테스트_정밀.md를 YAML 시나리오로 마이그레이션
4. [ ] Oracle Cloud 배포 및 스케줄 설정
5. [ ] Slack 알림 연동

---

**문서 버전:** 1.1
**작성:** Claude Code
**최종 수정:** 2026-01-01
**변경 사항:** Oracle Cloud 배포로 변경 (Railway → Oracle)
