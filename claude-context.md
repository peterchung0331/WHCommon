# Claude Code 컨텍스트

이 파일은 Claude Code와의 대화에서 기억해야 할 중요한 정보를 저장합니다.

## 기본 규칙

### 시간 기준
- **모든 작업의 기준 시간은 한국시간(KST, UTC+9)**
- 표시 형식: `YYYY. MM. DD. HH:MM` (24시간 형식)

### 모던 CLI 도구 사용 규칙
Bash 명령 실행 시 모던 CLI 도구를 우선 사용합니다.

| 기존 명령 | 모던 대안 | Ubuntu 명령어 |
|----------|----------|--------------|
| `grep` | ripgrep | `rg` |
| `cat` | bat | `batcat` |
| `find` | fd | `fdfind` |
| `ls` | eza | `eza` |

**주의**: Ubuntu/WSL에서는 `bat` → `batcat`, `fd` → `fdfind`로 실행

## 프로젝트 정보

### 전체 허브 리스트

| 허브 이름 | 경로 | 개발 포트 (F/B) | 운영 포트 (B) |
|----------|------|----------------|--------------|
| **WBHubManager** | `/home/peterchung/WBHubManager` | 3090 / 4090 | 4090 |
| **WBSalesHub** | `/home/peterchung/WBSalesHub` | 3010 / 4010 | 4010 |
| **WBFinHub** | `/home/peterchung/WBFinHub` | 3020 / 4020 | 4020 |
| **WBOnboardingHub** | `/home/peterchung/WBOnboardingHub` | 3030 / 4030 | 4030 |
| **WBRefHub** | `/home/peterchung/WBHubManager/WBRefHub` | 3040 / 4040 | 4040 |
| **HWTestAgent** | `/home/peterchung/HWTestAgent` | 3080 / 4080 | 4100 |

**포트 체계**:
- 개발: 3000번대 (프론트) / 4000번대 (백엔드)
- 운영: 각 허브별 개별 포트, Nginx가 경로별 프록시
- 프로덕션 URL: `http://workhub.biz/[hub-name]`

### 문서 폴더 구조

| 폴더 | 용도 |
|------|------|
| `문서/가이드/` | 온보딩, 배포, 환경변수 가이드 |
| `기획/진행중/` | 진행중인 PRD |
| `기획/완료/` | 완료된 PRD |
| `작업/진행중/` | 진행중인 Task |
| `작업/완료/` | 완료된 Task |
| `작업기록/진행중/` | 진행중 작업 로그 |
| `작업기록/완료/` | 완료된 작업 로그 |
| `테스트결과/` | 테스트 실행 결과 |
| `규칙/` | 실행 규칙 (실행_기획, 실행_작업) |

### Git 동기화 규칙

**WHCommon 저장소의 모든 작업 문서는 항상 Git에 동기화합니다.**

**필수 동기화 대상**:
- ✅ `기획/진행중/`, `기획/완료/`
- ✅ `작업/진행중/`, `작업/완료/`
- ✅ `작업기록/진행중/`, `작업기록/완료/`, `작업기록/보류/`
- ✅ `claude-context.md`, `규칙/`

**동기화 시점**: PRD/Task 생성 시, 작업 완료 시, 컨텍스트 수정 시 즉시 커밋 및 푸시

## 폴더 참조 규칙
사용자가 폴더 이름을 명시하지 않으면 **WHCommon 폴더**를 의미함
- 예: `/기획/진행중/` → `/home/peterchung/WHCommon/기획/진행중/`

## 언어 설정
새 채팅이나 대화 압축 후 **한국어**를 기본 언어로 사용

## 작업 실행 규칙

### 🚨 플랜모드 종료 후 작업 시 필수 규칙 (CRITICAL)

1. **실행_작업.md 필수 참조** (항상 첫 번째 단계)
   - 위치: `/home/peterchung/WHCommon/규칙/실행_작업.md`
   - ExitPlanMode 호출 직후 반드시 읽어야 함
   - 병렬 실행 그룹, 의존성 분석 필수

2. **TodoWrite로 작업 추적**
   - 병렬 실행 그룹 식별 후 진행 상황 추적

3. **병렬 실행 우선**
   - 의존성 없는 작업은 동시 병렬 수행

### 일반 작업 실행 규칙
- ✅ **모든 구현 작업은 병렬로 진행**: 겹치지 않는 작업은 동시에 병렬 수행
- 📌 **예외**: 순차적 의존성이 있는 작업은 순서대로 진행

### 🔴 에러 패턴 DB 활용 규칙 (CRITICAL)

**HWTestAgent 에러 패턴 DB**: http://workhub.biz/testagent/api/error-patterns

#### 에러 발생 시 자동 솔루션 검색 (최우선)
**모든 에러 발생 시 가장 먼저 실행**:
- 빌드 에러, 테스트 실패, Docker 에러, API 에러 등 **모든 에러**
- 스킬테스터 사용 중 또는 일반 빌드/테스트 환경에서 에러 발생 시
- **에러 메시지가 출력되는 즉시** 다음 프로세스 자동 실행

**자동 실행 프로세스**:
1. **에러 패턴 검색** (필수 첫 단계)
   ```bash
   curl -s "http://workhub.biz/testagent/api/error-patterns?query=에러키워드"
   ```
2. **매칭된 패턴이 있으면**:
   - 솔루션 상세 조회: `GET /api/error-patterns/{id}`
   - 사용자에게 솔루션 제시
   - 솔루션 적용 여부 확인 후 자동 적용
3. **매칭된 패턴이 없으면**:
   - 일반적인 디버깅 진행
   - 해결 후 새로운 패턴으로 DB에 등록

**적용 대상**:
- ✅ `/스킬테스터` 사용 시 테스트 실패
- ✅ `npm run build` 빌드 에러
- ✅ `docker build` 빌드 에러
- ✅ `docker compose up` 실행 에러
- ✅ `git` 명령어 에러
- ✅ 모든 CLI 명령어 에러

#### 트리거 키워드
사용자가 다음 키워드를 말하면 에러 패턴 DB에 기록:
- "에러 패턴 기록해줘", "에러 케이스 기록해줘", "이 에러 저장해줘"
- "디버깅 완료", "버그 수정 완료", "에러 해결했어"

#### 기록 프로세스
1. **중복 체크 (필수)**: 기록 전 기존 DB 검색
   ```bash
   curl -s "http://workhub.biz/testagent/api/error-patterns?query=에러키워드"
   ```
   - 유사한 에러가 이미 존재하면: "이미 등록된 에러 패턴입니다 (ID: X)" 출력 후 스킵
   - 솔루션만 다르면: 기존 패턴에 새 솔루션 추가

2. **에러 패턴 등록** (오라클 서버 PostgreSQL 직접 INSERT)
   ```bash
   ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246 "sudo -u postgres psql -d testagent << 'EOSQL'
   INSERT INTO error_patterns (project_name, error_hash, error_message, error_category, confidence, occurrence_count)
   VALUES ('프로젝트명', md5('에러식별키'), '에러 메시지 설명', '카테고리', 0.9, 1)
   ON CONFLICT (project_name, error_hash) DO UPDATE SET occurrence_count = error_patterns.occurrence_count + 1
   RETURNING id;
   EOSQL"
   ```

3. **솔루션 등록**
   ```bash
   ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246 "sudo -u postgres psql -d testagent << 'EOSQL'
   INSERT INTO error_solutions (error_pattern_id, solution_title, solution_description, solution_steps, files_modified, success_rate)
   VALUES (패턴ID, '솔루션 제목', '상세 설명', ARRAY['단계1', '단계2'], ARRAY['파일1', '파일2'], 100.0)
   RETURNING id;
   EOSQL"
   ```

#### 카테고리 목록
- `database`: DB 연결, 쿼리, 마이그레이션 에러
- `git`: Git 명령어, 브랜치, 병합 에러
- `docker`: Docker 빌드, 네트워크, 컨테이너 에러
- `nginx`: Nginx 설정, 프록시, 라우팅 에러
- `api`: API 호출, 인증, 응답 에러
- `build`: 빌드, 컴파일, 타입 에러
- `test`: 테스트 실행, 단언 에러

#### 작업 완료 시 자동 기록
디버깅 또는 구현 작업이 완료되면:
1. ❌ 테스트 리포트 파일 생성 **금지**
2. ✅ 발생한 에러와 해결 방법을 에러 패턴 DB에 기록
3. 사용자에게 등록된 에러 패턴 ID 알림

#### 에러 패턴 DB 현황 (2026-01-17 기준)
**총 15개 패턴 등록 완료** (모든 패턴에 솔루션 포함)

| 카테고리 | 개수 | 주요 패턴 |
|----------|------|----------|
| docker | 5개 | Exit 137 (OOM), Exit 255 (Compose 버그), npm cache 충돌, 재시작 vs 재생성, ECONNREFUSED |
| nginx | 3개 | 프록시 실패, HTTPS 거부, 400 Bad Request |
| git | 2개 | unrelated histories, untracked files |
| authentication | 2개 | SSO 무한 리디렉트, JWT invalid signature |
| typescript | 1개 | ES Modules __dirname |
| nextjs | 1개 | Network Error (환경변수) |
| security | 1개 | 암호화폐 채굴 악성코드 |

**API 엔드포인트**:
- 패턴 검색: `GET /api/error-patterns?query=키워드`
- 패턴 상세: `GET /api/error-patterns/:id`
- 패턴 등록: `POST /api/error-patterns/record`
- 솔루션 등록: `POST /api/error-patterns/:id/solutions`

### 🟢 디버깅 체크리스트 활용 규칙 (RECOMMENDED)

**HWTestAgent 디버깅 체크리스트**: http://workhub.biz/testagent/api/debugging-checklists

에러 패턴 DB를 분석하여 생성된 **코드 컨벤션 및 구현/디버깅 체크리스트**입니다.

#### 트리거 키워드 (자동 체크리스트 조회)
다음 작업 시 해당 카테고리 체크리스트를 **자동으로 조회**하여 참조:

| 키워드 | 카테고리 | API |
|--------|----------|-----|
| SSO, OAuth, 인증, 로그인, 쿠키, 토큰 | sso | `GET /api/debugging-checklists/category/sso` |
| Docker, 컨테이너, 빌드, OOM, Exit | docker | `GET /api/debugging-checklists/category/docker` |
| DB, 데이터베이스, 마이그레이션, PostgreSQL | database | `GET /api/debugging-checklists/category/database` |
| Nginx, 프록시, 리버스프록시, 404 | nginx | `GET /api/debugging-checklists/category/nginx` |

#### 체크리스트 사용 시점

1. **구현 전**: 체크리스트 조회 → 필수 항목 사전 확인 (critical, high 우선)
2. **디버깅 시**: 에러 패턴 검색 → 연결된 체크리스트 항목 참조
3. **코드 리뷰**: 체크리스트 기준으로 검증

#### 체크리스트 API 엔드포인트

```bash
# 전체 목록
GET /api/debugging-checklists

# 카테고리별 조회 (아이템 포함)
GET /api/debugging-checklists/category/sso
GET /api/debugging-checklists/category/docker

# 상세 조회
GET /api/debugging-checklists/:id

# 에러 패턴 연결 항목 조회
GET /api/debugging-checklists/by-error-pattern/:patternId

# 키워드 검색
GET /api/debugging-checklists/search?keyword=쿠키
```

#### 현재 등록된 체크리스트 (2026-01-17 기준)

| 카테고리 | 체크리스트 | 항목 수 | Critical |
|----------|-----------|---------|----------|
| sso | 허브 간 SSO 인증 체크리스트 | 12 | 4 |
| docker | Docker 빌드 및 배포 체크리스트 | 5 | 1 |

**프론트엔드 UI**: http://workhub.biz/testagent/debugging-checklists

### 🟣 오라클 스테이징 환경 E2E 테스트 규칙 (IMPORTANT)

**자동 적용 조건**:
- 사용자가 "오라클", "스테이징", "staging" 키워드를 포함하여 E2E 테스트 요청
- URL에 `staging.workhub.biz` 포함

**Google OAuth 자동 스킵**:
오라클 스테이징 환경에서는 Google OAuth 로그인을 **자동으로 스킵**하고 JWT 토큰을 직접 주입합니다.

**JWT 토큰 발급 방법**:
1. `/api/auth/dev-login` 엔드포인트 호출 (HubManager 연동)
2. 리다이렉트 URL에서 `accessToken`, `refreshToken` 파싱
3. 쿠키(`wbhub_access_token`) 또는 localStorage에 저장

**필수 테스트 시나리오**:
- ✅ dev-login 자동 로그인 플로우
- ✅ 쿠키 기반 SSO 완료 플로우
- ✅ 페이지 새로고침 후 인증 유지
- ✅ 토큰 없이 대시보드 접근 (로그인 페이지 리다이렉트)

**테스트 헬퍼 위치**:
- `e2e/helpers/jwt-helper.ts`: JWT 토큰 발급 및 주입
- `e2e/helpers/api-helper.ts`: API 응답 검증

**인증 플로우 검증 항목**:
1. JWT 토큰 발급 성공
2. 쿠키에 `wbhub_access_token` 설정
3. JWT 미들웨어가 쿠키에서 토큰 읽기
4. `/api/auth/me` 호출 성공
5. 대시보드 정상 렌더링
6. 무한 리디렉션 없음
7. 페이지 새로고침 후 인증 유지

**예시 명령어**:
```bash
# 자동으로 Google OAuth 스킵 + JWT 토큰 주입 테스트 실행
/스킬테스터 오라클에서 허브매니저->세일즈허브 E2E
/스킬테스터 스테이징 환경 세일즈허브 E2E 테스트
```

**주의사항**:
- 개발 모드(`localhost`)에서는 Google OAuth 정상 실행
- 오라클 스테이징(`staging.workhub.biz`)에서만 자동 스킵
- 프로덕션(`workhub.biz`)에서는 실제 Google OAuth 사용

## 세션 시작 규칙
- 새 세션에서 사용자가 처음 입력하는 단어는 **세션 제목용**
- 첫 입력에 대해 제목으로만 인식하고 간단히 인사만 할 것

## 저장소 관리 규칙

### WHCommon 저장소 (독립 저장소)
- 저장소: `git@github.com:peterchung0331/WHCommon.git`
- 경로: `/home/peterchung/WHCommon`
- 관리 항목: 프로젝트 공용 문서, 컨텍스트 설정, 규칙 파일, 기획/작업 문서

### 각 Hub 저장소
- 각 Hub의 **고유 프로젝트 코드만** 관리
- 공용 문서는 WHCommon에서 관리

---

## 스킬 (Skills)

### 스킬테스터
테스트 자동화를 위한 Claude Code 스킬. 에러 패턴 DB 연동.

- **위치**: `~/.claude/skills/스킬테스터/`
- **호출**: `/스킬테스터 [명령]`
- **서브 스킬**: 단위(Jest/Vitest), 통합(API), E2E(Playwright)
- **에러 DB 연동**: 테스트 실패 시 자동 기록 및 유사 솔루션 제안

**자동 트리거 키워드**: "테스트", "빌드 실패", "Docker 에러", "API 에러", "OAuth 실패", "DB 연결 실패" 등

**자세한 사용법**: `~/.claude/skills/스킬테스터/README.md` 참조

---

## MCP (Model Context Protocol) 서버 설정

### 도입된 MCP 서버 (7개)

| MCP 서버 | 용도 | 우선순위 |
|----------|------|----------|
| **Sequential Thinking** | 실시간 사고 구조화 | 최고 |
| **Obsidian** | 문서 영구 저장 (WHCommon vault) | 최고 |
| **Context7** | 라이브러리/프레임워크 문서 조회 | 높음 |
| **Filesystem** | 안전한 파일 시스템 작업 | 높음 |
| **GitHub** | GitHub 저장소 관리 | 높음 |
| **PostgreSQL** | 데이터베이스 쿼리 | 높음 |
| **Playwright** | 브라우저 자동화 및 E2E 테스트 | 높음 |

### MCP 사용 규칙

- **파일 작업**: Filesystem MCP 우선
- **Git/GitHub**: GitHub MCP 우선, 로컬 git은 Bash
- **DB 작업**: PostgreSQL MCP 필수
- **토큰 관리**: `/context` 명령어로 주기적 확인

### 🚨 복잡한 분석 작업 (Sequential Thinking 필수)
다음 상황에서는 **반드시** Sequential Thinking MCP 사용:
- 원인 분석 (OOM, 빌드 실패, 버그 추적)
- 아키텍처 설계
- 다단계 문제 해결 (3단계 이상)
- 트레이드오프 분석

**상세 설정**: `/home/peterchung/WHCommon/문서/가이드/MCP-설정-가이드.md` 참조

---

## 개발 규칙

### 빌드 환경
- **모든 빌드는 Docker Compose 사용**
- **BuildKit 캐시 필수**: `RUN --mount=type=cache,target=/root/.npm npm ci`
- **npm 타임아웃 설정 필수**: 모든 Dockerfile에 타임아웃 설정 추가

### Docker 빌드 최적화 (필수)

**Dockerfile 필수 요소**:
1. 멀티스테이지 빌드 (deps, builder, runner)
2. BuildKit 캐시 마운트
3. npm 타임아웃 설정
4. 프로덕션 의존성 분리 (`npm ci --omit=dev`)
5. 비root 사용자 사용

**package.json 의존성 분리**:
- `dependencies`: 런타임 필수 (express, pg, @prisma/client 등)
- `devDependencies`: 빌드 시에만 (typescript, @types/*, next 등)

**허브별 목표 용량**:
- WBHubManager: 300-350MB
- WBSalesHub: 250-300MB
- WBFinHub: 300-350MB
- WBOnboardingHub: 350-400MB

**상세 가이드**: 컨텍스트 백업 파일의 "Docker 빌드 최적화 가이드" 섹션 참조

### 작업량 표기 규칙
**모든 작업에는 반드시 작업량 추정 포함**
- 형식: `작업량: 0.5일 (4 WU)`
- 1 WU = 초급 개발자 1시간 작업량

### PRD 및 Task 생성 규칙
- **PRD**: `WHCommon/규칙/실행_기획.md` 자동 참조
- **Task**: `WHCommon/규칙/실행_작업.md` 자동 참조
- **트리거 키워드**: "PRD", "기획", "Task", "작업 목록" 등

---

## 환경변수 관리 규칙

### 환경변수 파일
- ✅ `.env.template`: Git 커밋 (구조만)
- ✅ `.env.local`: 로컬 개발 (Git 제외)
- ✅ `.env.staging`: Docker 스테이징 (Git 제외, `DOCKER_PORT=4400`)
- ✅ `.env.prd`: 프로덕션 (Git 제외, `DOCKER_PORT=4500`)

### Doppler 사용 금지 (CRITICAL)
- ❌ **모든 빌드 환경에서 Doppler 사용 금지**
- ❌ DOPPLER_TOKEN 하드코딩 금지
- ❌ Doppler CLI 사용 금지
- ✅ `.env` 파일만 사용
- ✅ Docker Compose `env_file` 사용

**이유**:
- 토큰 평문 노출 보안 이슈
- 배포 복잡도 증가
- multiline 환경변수 파싱 문제
- 일관성 없는 환경변수 관리

### JWT 키 관리 규칙
- ✅ **Base64 인코딩 필수** (multiline 문제 회피)
- ✅ 환경변수 우선: `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`
- ✅ 파일 fallback: `server/keys/private.pem`, `server/keys/public.pem`
- ✅ Docker Compose `env_file`로 자동 로드

**인코딩 명령어**:
```bash
cat server/keys/private.pem | base64 -w 0  # JWT_PRIVATE_KEY
cat server/keys/public.pem | base64 -w 0   # JWT_PUBLIC_KEY
```

**배포 체크리스트**:
1. `.env.staging`에 Base64 인코딩된 JWT 키 확인
2. `docker-compose.staging.yml`에서 `env_file: .env.staging` 확인
3. 배포 후 컨테이너에서 JWT 키 길이 검증 (200+ 정상)

### 환경변수 추가 규칙
- ❌ `NEXT_PUBLIC_*` 사용 금지 (빌드 시점 하드코딩)
- ✅ 상대경로 `/api` + Nginx 프록시 사용
- ✅ `NODE_ENV`로 개발/프로덕션 구분
- ❌ 디버깅용 환경변수 금지 (코드로 처리)

### 데이터베이스 환경변수
**단일 환경변수만 사용**:
```bash
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
HUBMANAGER_DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/wbhubmanager
```

**로컬 개발 DB**:
- 호스트: `localhost:5432`
- 사용자: `workhub` / 비밀번호: `workhub`
- DB: `wbhubmanager`, `wbsaleshub`, `wbfinhub`, `wbonboardinghub`

---

## API 규칙

### Trailing Slash 규칙
- ✅ **모든 API는 trailing slash 없이 정의**
- ✅ **프론트엔드도 trailing slash 없이 호출**
- ✅ **Next.js `trailingSlash: false` 명시**

예시:
```typescript
// ✅ 올바른 방식
router.get('/api/customers', handler)
fetch('/api/auth/me')

// ❌ 잘못된 방식
router.get('/api/customers/', handler)
fetch('/api/auth/me/')
```

### 데이터베이스 Enum 규칙
- ✅ **소문자 사용**: PostgreSQL enum과 TypeScript 타입 모두 소문자
- 예: `'pending'`, `'active'`, `'admin'`, `'user'`

---

## 참고 문서

### 주요 가이드
- **배포 가이드**: `/home/peterchung/WHCommon/문서/가이드/배포-가이드-오라클.md`
- **로컬 환경 세팅**: `/home/peterchung/WHCommon/문서/가이드/로컬-환경-세팅-가이드.md`
- **MCP 설정**: `/home/peterchung/WHCommon/문서/가이드/MCP-설정-가이드.md`
- **기능 리스트**: `/home/peterchung/WHCommon/문서/참고자료/기능-리스트.md`

### 오라클 클라우드
- **SSH 접속**: `ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246`
- **스테이징**: `https://staging.workhub.biz:4400`
- **프로덕션**: `https://workhub.biz`
- **배포 스크립트**: `./scripts/deploy-staging.sh`, `./scripts/promote-production.sh`

---

---

마지막 업데이트: 2026-01-17 00:30

**주요 변경 사항**:
- ✅ 에러 패턴 DB 기록 규칙 추가 (HWTestAgent 연동)
- ✅ 에러 발생 시 자동 솔루션 검색 규칙 추가 (최우선 실행)
- ✅ 15개 에러 패턴 및 솔루션 등록 완료
- ✅ 디버깅/구현 완료 시 테스트 리포트 대신 에러 패턴 DB 기록으로 변경
