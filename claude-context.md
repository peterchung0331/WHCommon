# Claude Code 컨텍스트

이 파일은 Claude Code와의 대화에서 기억해야 할 중요한 정보를 저장합니다.

## 프로젝트 정보

### 전체 허브 리스트
WorkHub 프로젝트는 다음 5개의 허브로 구성됩니다:

| 허브 이름 | 경로 | 개발 포트 (F/B) | 운영 포트 (B) | 설명 |
|----------|------|----------------|--------------|------|
| **WBHubManager** | `/home/peterchung/WBHubManager` | 3090 / 4090 | 4090 | 허브 관리 및 SSO 인증 서버 |
| **WBSalesHub** | `/home/peterchung/WBSalesHub` | 3010 / 4010 | 4010 | 고객 및 미팅 관리 시스템 |
| **WBFinHub** | `/home/peterchung/WBFinHub` | 3020 / 4020 | 4020 | 재무/트랜잭션 관리 시스템 |
| **WBOnboardingHub** | `/home/peterchung/WBOnboardingHub` | 3030 / 4030 | 4030 | 신규 사용자 온보딩 시스템 |
| **WBRefHub** | `/home/peterchung/WBHubManager/WBRefHub` | 3040 / 4040 | 4040 | 레퍼런스/문서 관리 시스템 (HubManager 하위) |
| **HWTestAgent** | `/home/peterchung/HWTestAgent` | 3080 / 4080 | 4100 | 자동화 테스트 시스템 |

**포트 체계**:
- **개발 환경 (Dev)**: 3000번대 (프론트엔드) / 4000번대 (백엔드, 각 허브별 개별 포트)
- **운영 환경 (Oracle)**: 각 허브별 개별 포트 (4090, 4010, 4020 등), Nginx가 경로별로 프록시
- 프로덕션 모드에서는 프론트엔드가 정적 파일로 백엔드와 동일 포트에서 서빙

**참고**:
- 대부분의 허브는 독립된 Git 저장소로 관리됨
- WBRefHub는 WBHubManager 저장소 내에 위치
- 공용 리소스는 WBHubManager 저장소에서 관리
- 프로덕션 URL: `http://workhub.biz/[hub-name]`

### 문서 폴더 구조 (통합)

| 폴더 | 용도 | 파일명 규칙 |
|------|------|------------|
| `문서/가이드/` | 온보딩, 배포, 환경변수 등 가이드 | `[topic]-가이드.md` |
| `문서/테스트/` | 테스트 관련 가이드 및 로그 | `[test-type]-guide.md` |
| `문서/참고자료/` | 기능 리스트, 참고 자료 | 자유 형식 |
| `기획/진행중/` | 구현 진행중인 PRD | `prd-[feature-name].md` |
| `기획/완료/` | 구현 완료된 PRD | `prd-[feature-name].md` |
| `작업/진행중/` | 진행중인 Task | `tasks-[feature-name].md` |
| `작업/완료/` | 완료된 Task | `tasks-[feature-name].md` |
| `작업기록/진행중/` | 진행중 작업 로그 | `YYYY-MM-DD-[description].md` |
| `작업기록/완료/` | 완료된 작업 로그 | `YYYY-MM-DD-[description].md` |
| `작업기록/보류/` | 보류된 작업 | `YYYY-MM-DD-[description].md` |
| `테스트결과/` | 테스트 실행 결과 리포트 | `YYYY-MM-DD-[type]-[target].md` |
| `규칙/` | 실행 규칙 (실행_기획, 실행_작업) | 고정 파일명 |

### 기록 필수 시점 (자동 준수)

| 작업 단계 | 기록 동작 | 저장 위치 |
|----------|----------|----------|
| 기능 기획 시작 | PRD 파일 생성 | `기획/진행중/` |
| 기능 구현 완료 | PRD 파일 이동 | `기획/완료/` |
| Task 생성 | Task 파일 생성 | `작업/진행중/` |
| Task 완료 | Task 파일 이동 | `작업/완료/` |
| 작업 시작 | 작업 로그 생성 | `작업기록/진행중/` |
| 작업 보류 | 작업 로그 이동 | `작업기록/보류/` |
| 작업 완료 | 작업 로그 이동 | `작업기록/완료/` |
| 테스트 실행 후 | 리포트 생성 | `테스트결과/` |

### 테스트 관련 폴더 (HWTestAgent)
- **TestAgent**: `/home/peterchung/HWTestAgent` - 통합 테스트 에이전트
  - `test-results/reports/` - 테스트 리포트 저장
  - `test-results/guides/` - 테스트 가이드 모음
  - `test-results/logs/` - 테스트 로그
  - `scenarios/` - YAML 테스트 시나리오

### 중요 문서
- **기능 리스트**: `/home/peterchung/WHCommon/문서/참고자료/기능-리스트.md` - 모든 WorkHub 프로젝트의 상세 기능 목록
- **실행 규칙**: `/home/peterchung/WHCommon/규칙/` - PRD 및 Task 생성 규칙

## 폴더 참조 규칙
- 사용자가 **폴더 이름을 명시하지 않고** 경로를 언급하면 **WHCommon 폴더**를 의미함
- 예: `/기획/진행중/` → `/home/peterchung/WHCommon/기획/진행중/`
- 예: `/작업/진행중/` → `/home/peterchung/WHCommon/작업/진행중/`

## 언어 설정
- 새 채팅이나 대화 압축 후 **한국어**를 기본 언어로 사용

## 작업 실행 규칙
- ✅ **모든 구현 작업은 병렬로 진행**: 특별한 언급이 없으면 겹치지 않는 작업은 동시에 병렬 수행
- **긴 태스크**: `실행_작업.md` 참고하여 병렬 실행 그룹 식별 후 진행
- **짧은 태스크**: 의존성이 없는 작업은 즉시 병렬로 수행
- 📌 **예외**: 순차적 의존성이 있는 작업(예: DB 마이그레이션 후 API 구현)은 순서대로 진행

## 세션 시작 규칙
- 새 세션에서 사용자가 처음 입력하는 단어는 **세션 제목용**임
- 첫 입력에 대해 관련 작업을 이어서 하지 말고, 제목으로만 인식하고 간단히 인사만 할 것
- 예: 사용자가 "안녕"이라고 입력하면 → "안녕하세요! 무엇을 도와드릴까요?" 정도로만 응답

## 저장소 관리 규칙

### WHCommon 저장소 (독립 저장소)
WHCommon은 **독립된 Git 저장소**로 관리됩니다:
- 저장소: `git@github.com:peterchung0331/WHCommon.git`
- 경로: `/home/peterchung/WHCommon`
- 관리 항목:
  - ✅ **프로젝트 공용 문서** (배포 가이드, 로컬 환경 세팅 가이드 등)
  - ✅ **컨텍스트 설정 파일** (`claude-context.md`, `.claude/CLAUDE.md`)
  - ✅ **공용 규칙 파일** (`실행_기획.md`, `실행_작업.md` 등)
  - ✅ **공용 스크립트** (Doppler 동기화, SSH 터널링 등)
  - ✅ **공용 환경변수 파일** (`env.doppler`, SSH 키 등)
  - ✅ **기획 문서** (`기획/진행중/`, `기획/완료/`)
  - ✅ **작업 문서** (`작업/진행중/`, `작업/완료/`)
  - ✅ **작업기록** (`작업기록/진행중/`, `작업기록/완료/`, `작업기록/보류/`)

### WBHubManager 저장소 관리 항목
WBHubManager Git 저장소에서 관리하는 항목:
- ✅ **WBHubManager 프로젝트 코드** (서버, 프론트엔드 등)
- ✅ **WBRefHub 코드** (하위 프로젝트)
- ❌ ~~WHCommon 폴더~~ (독립 저장소로 분리됨)
- ❌ ~~워크스페이스 설정 파일~~ (존재하지 않음)

### 각 Hub 저장소 관리 항목 (WBFinHub, WBSalesHub 등)
- ✅ 각 Hub의 **고유 프로젝트 코드만** 관리
- ❌ 공용 문서나 설정은 관리하지 않음 (WHCommon에서 관리)

### 정리
- **WHCommon**: 모든 프로젝트 간 공유되는 문서, 설정, 스크립트 관리 (독립 저장소)
- **각 Hub**: 각자의 프로젝트 코드만 관리 (독립 저장소)
- **신규 PC 설정 시**: WBHubManager, WBSalesHub, WBFinHub, WBOnboardingHub, **WHCommon**을 모두 별도로 클론 필요

---

## 스킬 (Skills)

### 스킬테스터
테스트 자동화를 위한 Claude Code 스킬입니다. "스킬테스터"라고 하면 이 스킬을 사용합니다.

- **위치**: `~/.claude/skills/스킬테스터/`
- **호출**: `/스킬테스터 [명령]`
- **서브 스킬**:
  | 스킬 | 용도 | 예시 |
  |------|------|------|
  | 스킬테스터-단위 | Jest/Vitest 단위 테스트 | `/스킬테스터 세일즈허브 단위` |
  | 스킬테스터-통합 | API 통합 테스트 | `/스킬테스터 허브매니저->핀허브 통합` |
  | 스킬테스터-E2E | Playwright E2E 테스트 | `/스킬테스터 오라클에서 E2E` |

- **자연어 지원**: "스킬테스터 허브매니저 단위 테스트 해줘" 형태로 사용 가능
- **결과 저장**: `HWTestAgent/test-results/MyTester/`
- **기본 테스트 도구**: 특별한 언급 없이 "테스트 해줘"라고 요청하면 스킬테스터를 사용

---

## MCP (Model Context Protocol) 서버 설정

### 도입된 MCP 서버

#### 핵심 MCP 서버 (설치 완료)
| MCP 서버 | 용도 | 우선순위 | 설치 날짜 |
|----------|------|----------|----------|
| **Sequential Thinking** | 실시간 사고 구조화 및 의사결정 과정 추적 | 최고 | 2026-01-14 ✅ |
| **Obsidian** | PRD, 의사결정 로그, 문서 영구 저장 (WHCommon vault) | 최고 | 2026-01-14 ✅ |
| **Context7** | 라이브러리/프레임워크 최신 문서 조회 | 높음 | 2026-01-14 ✅ |
| **Filesystem** | 안전한 파일 시스템 작업 (6개 프로젝트 디렉토리) | 높음 | 2026-01-14 ✅ |
| **GitHub** | GitHub 저장소 관리 (Issue/PR/커밋) | 높음 | 2026-01-14 ✅ |
| **PostgreSQL** | 데이터베이스 쿼리 (4개 로컬 DB) | 높음 | 2026-01-14 ✅ |
| **Playwright** | 브라우저 자동화 및 E2E 테스트 | 높음 | 2026-01-14 ✅ |

**총 7개 MCP 서버 설치 완료**

### MCP 서버별 상세 정보

#### 1. Filesystem MCP
- **기능**: 파일 읽기, 쓰기, 편집, 검색, 디렉토리 관리
- **장점**: Bash의 cat/echo 대체, gitignore 패턴 자동 적용, 경로 검증
- **허용 디렉토리**:
  - `/home/peterchung/WBHubManager`
  - `/home/peterchung/WBSalesHub`
  - `/home/peterchung/WBFinHub`
  - `/home/peterchung/WBOnboardingHub`
  - `/home/peterchung/WHCommon`
  - `/home/peterchung/HWTestAgent`

#### 2. GitHub MCP
- **기능**: Issue 조회/생성, PR 관리, 커밋 분석, CI/CD 트리거
- **인증**: GitHub Personal Access Token 필요
- **권한**: repo, workflow, write:packages
- **사용 예시**: "GitHub MCP로 WBHubManager의 최근 Issue 10개 조회해줘"

#### 3. PostgreSQL MCP
- **기능**: DB 쿼리, 스키마 조회, 테이블 분석, 마이그레이션 검증
- **연결 대상**:
  - 로컬 DB: localhost:5432 (wbhubmanager, wbsaleshub, wbfinhub, wbonboardinghub)
  - 스테이징 DB: localhost:5433 (SSH 터널링)
  - 프로덕션 DB: localhost:5434 (SSH 터널링, 읽기 전용)
- **사용 예시**: "PostgreSQL MCP로 local-hubmanager의 accounts 테이블 스키마 보여줘"

#### 4. Playwright MCP
- **기능**: 브라우저 자동화, 웹 스크래핑, E2E 테스트 실행
- **지원 브라우저**: Chromium, Firefox, WebKit
- **특징**: 접근성 트리 기반 상호작용 (스크린샷 불필요, 빠르고 경량)
- **사용 예시**: "Playwright로 http://localhost:3090 접속해서 로그인 폼 확인해줘"

### MCP 사용 규칙

#### 파일 작업
- **Filesystem MCP 우선**: 파일 읽기/쓰기는 Filesystem MCP 사용
- **Bash는 보조**: 시스템 명령(git, docker, npm)은 Bash 사용

#### Git/GitHub 작업
- **GitHub MCP 우선**: Issue/PR 관리는 GitHub MCP 사용
- **Bash는 로컬 Git**: 로컬 git 명령은 Bash 사용

#### DB 작업
- **PostgreSQL MCP 필수**: 모든 DB 쿼리는 PostgreSQL MCP 사용
- **쿼리 최적화**: 큰 결과셋은 LIMIT 절 사용 (토큰 절약)

#### 토큰 관리
- **모니터링**: `/context` 명령어로 주기적 확인
- **예상 오버헤드**: 14,000-30,000 tokens/세션 (7개 MCP 기준)
- **남은 여유**: 170,000-186,000 tokens (200K 윈도우 기준)
- **컨텍스트 소비율**: 7-15% (허용 가능 범위)

### Sequential Thinking + Obsidian 워크플로우
1. **실시간 사고**: Sequential Thinking으로 문제 분석 및 의사결정 과정 구조화
2. **영구 저장**: 완성된 문서를 Obsidian에 저장하여 장기 지식 베이스 구축
3. **검색 및 재사용**: Obsidian에서 과거 의사결정 로그 검색 및 재참조

### MCP 관련 명령어
```bash
# 현재 연결된 MCP 서버 확인
/mcp

# 컨텍스트 사용량 확인
/context

# MCP 서버 목록 보기 (CLI)
claude mcp list
```

### MCP 설정 파일 위치
- **설정 파일**: VSCode 명령 팔레트 → "MCP: Open User Configuration"
- **상세 가이드**: `/home/peterchung/WHCommon/문서/가이드/MCP-설정-가이드.md`

### 오라클 DB 접근 (SSH 터널링 필요)
```bash
# 스테이징 DB 터널링
ssh -L 5433:localhost:5432 -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246 -N &

# 프로덕션 DB 터널링
ssh -L 5434:localhost:5432 -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246 -N &

# 또는 자동화 스크립트 사용
/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh
```

---

## 개발 및 문서 관리 규칙

### 빌드 환경
- **모든 로컬/운영 빌드는 Docker Compose 사용**
  - 개발 환경: `docker-compose.dev.yml`
  - 운영 환경: `docker-compose.prod.yml`

- **BuildKit 캐시 사용 (필수)**
  - 모든 프로젝트 Dockerfile에서 BuildKit 캐시 마운트 사용
  - npm 설치 시: `RUN --mount=type=cache,target=/root/.npm npm ci`
  - 효과: npm 다운로드 시간 70-90% 감소, 네트워크 타임아웃 방지
  - 적용 프로젝트: WBHubManager, WBSalesHub, WBFinHub, WBOnboardingHub (전체)
  - 빌드 시 환경변수: `export DOCKER_BUILDKIT=1`

- **npm 타임아웃 설정 (필수)**
  - 모든 Dockerfile에서 npm 설치 전에 타임아웃 설정
  ```dockerfile
  RUN npm config set fetch-timeout 120000 && \
      npm config set fetch-retry-mintimeout 20000 && \
      npm config set fetch-retry-maxtimeout 120000
  ```
  - 네트워크 불안정 시 자동 재시도

### 로컬 서버 설정
- **로컬 서버 장시간 유지**: 서버 띄운 후 일정 시간이 지나도 자동 종료되지 않도록 설정
  - `timeout` 설정 해제 또는 충분히 긴 값으로 설정
  - 개발 중 서버 재시작 최소화

### Docker 환경 원칙 (스테이징)
- ✅ **Docker는 항상 프로덕션 모드**: 오라클 클라우드와 동일한 환경 유지
  - `NODE_ENV: production` 설정 필수
  - dev-login 엔드포인트 비활성화
  - Google OAuth만 사용
- ✅ **localhost + 단일 포트 사용**: 스테이징/운영 환경은 Nginx 리버스 프록시로 라우팅
  - 스테이징: http://localhost:4400 (모든 허브)
  - 운영: http://localhost:4500 (모든 허브)
- ✅ **환경 일관성**:
  - 로컬 개발 (4000번대): `npm run dev` (개발 모드, dev-login 사용 가능, 각 허브별 개별 포트)
  - Docker 스테이징 (4400): 프로덕션 모드 (Google OAuth만, 모든 허브 공유)
  - Oracle 운영 (4500): 프로덕션 모드 (Google OAuth만, 모든 허브 공유)

### Docker 빌드 최적화 가이드 (필수)

Docker 이미지 빌드 시 반드시 다음 체크리스트를 확인하세요.

#### 1. Dockerfile 필수 요소

**기본 구조** (멀티스테이지 빌드):
```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS base

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

# npm 타임아웃 설정 (필수)
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# BuildKit 캐시 마운트로 의존성 설치 (필수)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
# ⚠️ 주의: npm cache clean --force는 BuildKit 캐시와 충돌하므로 사용 금지!

# Stage 2: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 메모리 제한 설정 (권장)
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN npm run build:server
RUN npm run build:frontend

# Stage 3: Runner (프로덕션)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# 비root 사용자 생성 (보안)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# 프로덕션 의존성만 설치 (필수)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts
# ⚠️ 주의: npm cache clean --force는 BuildKit 캐시와 충돌하므로 사용 금지!

# 빌드 산출물만 복사
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/frontend/out ./frontend/out

USER appuser

# 헬스체크 (권장)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://localhost:${PORT}/api/health || exit 1

EXPOSE ${PORT}
CMD ["node", "dist/server/index.js"]
```

#### 2. package.json 의존성 분리 규칙

**dependencies (프로덕션에 포함)**:
- express, cors, dotenv (서버 런타임)
- pg, @prisma/client (데이터베이스)
- jsonwebtoken, bcryptjs (인증)
- @anthropic-ai/sdk, @slack/bolt (외부 API)
- zod (런타임 검증)

**devDependencies (빌드 시에만)**:
- 모든 `@types/*` 패키지
- typescript, tsx, esbuild
- next, react, react-dom (Static Export 모드일 때)
- tailwindcss, postcss, autoprefixer
- eslint, prettier, jest, playwright
- nodemon, concurrently

#### 3. 빌드 전 체크리스트

Docker 빌드 전 다음을 확인:

- [ ] **package.json 검증**: `@types/*`가 devDependencies에 있는가?
- [ ] **Dockerfile 검증**: BuildKit 캐시 마운트 사용하는가?
- [ ] **Dockerfile 검증**: `npm ci --omit=dev` 사용하는가?
- [ ] **npm 타임아웃**: 타임아웃 설정이 있는가?
- [ ] **용량 목표**: 허브별 목표 용량 이내인가?

#### 4. 빌드 명령어 규칙

**올바른 빌드 명령어**:
```bash
# 표준 빌드 (BuildKit 캐시 활용)
DOCKER_BUILDKIT=1 docker build -t <hub-name>:<tag> .

# 스테이징 배포 빌드
DOCKER_BUILDKIT=1 docker build -t <hub-name>:staging .
```

**금지된 빌드 명령어**:
```bash
# ❌ --no-cache 사용 금지 (BuildKit 캐시 무효화)
docker build --no-cache -t <hub-name>:<tag> .

# ❌ npm cache clean --force 금지 (BuildKit 캐시와 충돌)
RUN npm ci && npm cache clean --force
```

**이유**:
- `--no-cache`: BuildKit 캐시 마운트의 효과를 무효화하여 빌드 시간 70-90% 증가
- `npm cache clean --force`: BuildKit 캐시와 동시 접근 시 ENOTEMPTY 에러 발생

**실제 검증 (2026-01-12)**:
- WBHubManager에서 가이드 위반 사항 제거 후:
  - 빌드 성공률: 50% → 95%+ (+45%p)
  - 빌드 시간: 4.5분 → 3.1분 (-31%)
  - 네트워크 트래픽: 350MB → 10MB/빌드 (-97%)
- 상세 내역: `/home/peterchung/WHCommon/작업완료/2026-01-12-docker-build-optimization.md`

#### 5. 허브별 목표 용량

| 허브 | 목표 용량 | 경고 임계값 | 비고 |
|------|----------|-----------|------|
| WBHubManager | 300-350MB | 400MB | SSO 인증 서버 |
| WBSalesHub | 250-300MB | 350MB | CRM (이미 최적화됨) |
| WBFinHub | 300-350MB | 400MB | 재무 관리 |
| WBOnboardingHub | 350-400MB | 450MB | 온보딩 + Vision API |

**참고**: 300MB 내외는 업계 표준 상위 30% 수준 (Next.js + Express 기준)

#### 5. 용량 확인 명령어

```bash
# 이미지 용량 확인
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 레이어별 분석
docker history <image-name>

# 빌드 후 용량 검증
DOCKER_BUILDKIT=1 docker build -t <hub-name>:test .
docker images <hub-name>:test --format "{{.Size}}"
```

#### 6. 메모리 최적화

**빌드 시 메모리 제한** (Dockerfile):
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=2048"
```

**런타임 메모리 제한** (docker-compose.yml):
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

**Next.js 빌드 메모리 최적화** (next.config.ts/js - 안전한 옵션만):
```typescript
const nextConfig: NextConfig = {
  // 1. 프로덕션 소스맵 비활성화 (메모리 30-40% 감소, 부작용 없음)
  productionBrowserSourceMaps: false,

  // 2. Webpack 메모리 최적화 (Next.js 15+ 공식 기능)
  experimental: {
    webpackMemoryOptimizations: true,
    // 기존 설정 유지...
  },
};
```

**안전한 최적화 vs 위험한 최적화**:
| 설정 | 효과 | 부작용 | 권장 |
|------|------|--------|------|
| `productionBrowserSourceMaps: false` | 메모리 30-40% 감소 | 없음 | ✅ 적용 |
| `webpackMemoryOptimizations: true` | 메모리 20-30% 감소 | 없음 | ✅ 적용 |
| `NODE_OPTIONS="--max-old-space-size=2048"` | OOM 방지 | 없음 | ✅ 적용 |
| `config.cache = false` | 메모리 감소 | 빌드 시간 2-3배 증가 | ❌ 비권장 |
| `ignoreBuildErrors: true` | 빌드 성공률 증가 | 타입 에러 미검출 | ❌ 비권장 |

**예상 효과**: 안전한 최적화만으로 빌드 메모리 ~40% 감소 (3GB → 1.8GB)

#### 7. 프론트엔드 빌드 모드

| 모드 | 설정 | 용량 영향 | 사용 허브 |
|------|------|----------|----------|
| **Static Export** | `output: 'export'` | ~300MB (out/) | HubManager, **SalesHub**, FinHub, OnboardingHub |
| **Standalone** | `output: 'standalone'` | ~500MB | - |
| **Server Mode** | `output: undefined` | ~1.3GB (.next/) | ❌ 사용 금지 (프론트엔드 node_modules 포함) |

**Static Export 필수 (권장)**:
- Nginx가 API 프록시 담당 (`/saleshub/api/*` → `localhost:4010/api/*`)
- 프론트엔드는 정적 파일만 서빙 (out/ 폴더)
- Docker 이미지 크기 70% 이상 감소 (1.3GB → 300MB)

**Static Export 설정 방법**:
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',  // Static Export 모드 (필수)
  // rewrites 제거 - Nginx가 API 프록시 담당
};
```

**Dockerfile 수정** (Static Export용):
```dockerfile
# ❌ Server Mode (프론트엔드 node_modules 포함 - 600MB+)
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
RUN npm --prefix frontend ci --omit=dev  # 이 줄이 600MB 추가!

# ✅ Static Export (out/ 폴더만 복사 - 2MB)
COPY --from=frontend-builder /app/frontend/out ./frontend/out
COPY --from=frontend-builder /app/frontend/public ./frontend/public
# node_modules 설치 불필요!
```

**Static Export 불가능한 경우** (피해야 할 기능):
- `getServerSideProps` 사용
- API rewrites/redirects (Next.js 내장)
- Dynamic routes with `fallback: true`
- Middleware 사용

### 작업 크기 측정 기준 (Work Units)

플랜 작성 시 각 작업의 크기를 측정하는 표준 지표입니다.

#### 기본 단위: WU (Work Units)
**1 WU = 초급 개발자 1시간 작업량 (1-3년 경력)**
**1일 = 8 WU**

#### 작업 크기 환산표

| WU | 일수 | 시간 | 파일 수 | LOC | 크기 | WorkHub 실제 예시 |
|----|------|------|---------|-----|------|-------------------|
| **1** | **0.1일** | 1시간 | 1개 | 5-10 | Micro | 환경변수 1개 추가, `.gitignore` 수정 |
| **2** | **0.3일** | 2시간 | 1-2개 | 10-30 | Tiny | 오타 수정, 간단한 설정 변경 |
| **3** | **0.4일** | 3시간 | 2-3개 | 30-50 | Small | Enum 소문자 변경, 간단한 버그 수정 |
| **4** | **0.5일** | 반나절 | 3-4개 | 50-100 | Medium-S | Trailing slash 규칙 적용, 타입 정의 추가 |
| **6** | **0.8일** | 6시간 | 4-5개 | 100-150 | Medium | API 엔드포인트 1개, 단순 UI 컴포넌트 |
| **8** | **1.0일** | 1일 | 5-7개 | 150-250 | Medium-L | OAuth 콜백 수정, 새 페이지 추가 |
| **12** | **1.5일** | 1.5일 | 7-10개 | 250-400 | Large | SSO 세션 검증, DB 스키마 수정 |
| **16** | **2.0일** | 2일 | 10-15개 | 400-600 | X-Large | Docker BuildKit 최적화, 허브 간 API 연동 |
| **24** | **3.0일** | 3일 | 15-20개 | 600-1000 | XX-Large | DB 마이그레이션 + API 재설계 |
| **32** | **4.0일** | 4일 | 20-30개 | 1000-1500 | XXX-Large | 허브 간 SSO 통합 전체 |
| **40** | **5.0일** | 5일 | 30-40개 | 1500-2000 | Epic | 새 허브 추가, 전체 인증 시스템 재설계 |
| **80+** | **10.0일+** | 10일+ | 50개+ | 3000+ | Mega | 전체 프로젝트 아키텍처 재설계 |

#### 플랜 작성 예시

```markdown
### Task 1: OAuth 콜백 경로 수정
- **작업량**: 1.0일 (8 WU)
- 파일: 5개
- LOC: ~180줄
- 복잡도: 중간

### Task 2: SSO 세션 검증 로직 추가
- **작업량**: 1.5일 (12 WU)
- 파일: 9개
- LOC: ~320줄
- 복잡도: 높음
- 의존성: Task 1 완료 후

### 전체 작업량
- 총 일수: 1.0일 + 1.5일 = **2.5일**
- 총 WU: 8 + 12 = **20 WU**
- 초급 개발자 기준 약 2.5일 소요 예상
```

#### WU 계산 공식 (참고)

```
WU = (파일 수 × 0.7) + (LOC ÷ 40) + 복잡도 보정

복잡도 보정:
- 단순 (설정, 환경변수): ×0.5
- 보통 (API, UI): ×1.2
- 복잡 (인증, DB): ×1.8
- 매우 복잡 (아키텍처): ×2.5
```

#### 초급 개발자 특성 반영

초급 개발자(1-3년 경력)는 다음 특성을 고려하여 WU가 산정됩니다:
- **학습 시간 포함**: 새로운 개념/라이브러리 학습 시간 +20-30%
- **디버깅 시간**: 중급 대비 1.5배 더 소요
- **코드 리뷰 수정**: 1-2회 추가 수정 반영
- **문서 참조**: 공식 문서, 예제 코드 탐색 시간 포함

**중급 개발자 대비 작업 속도**: 약 0.6-0.7배 (30-40% 더 소요)

#### 주의사항

⚠️ **이 일수는 초급 개발자(1-3년 경력) 기준 참고용 지표이며, 실제 작업 시간은 다음에 따라 달라집니다**:
- 개발자 숙련도 (신입: +50%, 중급: -30%, 시니어: -50%)
- 프로젝트 친숙도 (처음: +40%, 익숙함: -20%)
- 예상치 못한 문제 (디버깅, 환경 이슈 등)
- 멘토링 가능 여부 (시니어 도움 여부에 따라 ±20%)

**실제 일정은 사용자가 직접 결정하시면 됩니다.**

### 작업량 표기 규칙 (IMPORTANT)

모든 작업(플랜 모드, 짧은 작업, 즉시 실행 포함)에는 **반드시 작업량 추정을 포함**해야 합니다.

#### 필수 표기 형식

```markdown
- **작업량**: 0.5일 (4 WU)
- 파일: 2개
- LOC: ~50줄
- 복잡도: 단순
```

#### 적용 범위

- ✅ **플랜 모드**: Task 작성 시 각 작업별 작업량 명시
- ✅ **짧은 작업**: 1-2개 파일 수정하는 간단한 작업도 작업량 표기
- ✅ **즉시 실행**: 사용자 요청에 바로 작업할 때도 작업 시작 전 작업량 알림
- ✅ **TODO 작성**: TodoWrite로 작업 추가 시 작업량 함께 기록

#### 예시

**플랜 모드 작업**:
```markdown
### Task 1: OAuth 콜백 경로 수정
- **작업량**: 1.0일 (8 WU)
- 파일: 5개
- LOC: ~180줄
- 복잡도: 중간
```

**짧은 작업**:
```markdown
사용자: .gitignore에 .env.staging 추가해줘

Claude:
- **작업량**: 0.1일 (1 WU)
- 파일: 1개
- LOC: ~5줄
- 복잡도: 단순

.gitignore 파일에 .env.staging을 추가하겠습니다.
```

**TODO 작성 시**:
```markdown
TodoWrite:
- content: "OAuth 콜백 경로 수정 (1.0일, 8 WU)"
- activeForm: "OAuth 콜백 경로 수정 중 (1.0일, 8 WU)"
```

#### 작업량 생략 불가

⚠️ **다음 상황에서도 작업량 표기 필수**:
- "간단한 작업이니까 생략" → ❌ 금지
- "1줄만 수정하니까 생략" → ❌ 금지
- "설정 파일 수정이니까 생략" → ❌ 금지

**모든 작업은 작업량 추정을 포함해야 합니다.**

---

### PRD 및 Task 생성 규칙 (중요)

#### PRD 생성 규칙 (실행_기획.md 자동 로드)
- **참조 문서**: `WHCommon/규칙/실행_기획.md`
- **저장 위치**: `WHCommon/기획/진행중/prd-[feature-name].md`
- **완료 시**: `WHCommon/기획/완료/`로 이동
- **구조**: 14개 섹션 포함 (NFR, Security Requirements, Test Strategy 등)
- **WorkHub 특화**: Appendix에 환경별 구성, 허브 간 통신, 보안 체크리스트 포함

**트리거 키워드** (다음 단어 감지 시 자동 참조):
- PRD, 기획, 설계, 요구사항, 스펙
- "새 기능 만들어줘", "기능 추가해줘"
- "어떻게 구현할지 계획해줘"
- "요구사항 정리해줘", "기획서 작성해줘"

**상황 기반 자동 로드** (키워드 없이도 적용):
- 사용자가 "왜", "목적", "요구사항"을 묻는 경우
- 새로운 기능/시스템 설계가 필요한 작업
- User Story, 성공 기준, 테스트 전략 정의가 필요한 경우
- 여러 허브에 걸친 변경 작업

#### Task 생성 규칙 (실행_작업.md 자동 로드)
- **참조 문서**: `WHCommon/규칙/실행_작업.md`
- **저장 위치**: `WHCommon/작업/진행중/tasks-[feature-name].md`
- **완료 시**: `WHCommon/작업/완료/`로 이동
- **특징**: 병렬 실행 그룹 식별, 템플릿 기반 생성, 복잡도 자동 경고 (150개 초과 시)
- **커밋 규칙**: 테스크 작업 시 중간중간 커밋 진행, 주요 마일스톤 완료 시 커밋

**트리거 키워드** (다음 단어 감지 시 자동 참조):
- Task, 태스크, 작업 목록, 할 일, 체크리스트
- "이거 구현해줘", "개발해줘", "만들어줘"
- "작업 순서 정리해줘", "단계별로 진행해줘"
- PRD 작성 완료 후 구현 단계 진입 시

**상황 기반 자동 로드** (키워드 없이도 적용):
- 3개 이상 파일 수정이 예상되는 작업
- 순차적/병렬 실행 판단이 필요한 작업
- 데이터베이스 마이그레이션 포함 작업
- Docker 빌드/배포 관련 작업
- 여러 단계로 나눠 진행해야 하는 작업

#### 작업 완료 후 결과 기록 규칙 (필수)
- **기능 구현 완료 시**: PRD 파일을 `기획/완료/`로 이동
  - 파일명: `prd-[feature-name].md`
  - 시점: 기능 개발 완료 및 테스트 통과 후

- **작업(Task) 완료 시**: Task 파일을 `작업/완료/`로 이동
  - 파일명: `tasks-[feature-name].md`
  - 시점: 모든 Task 완료 후

- **작업기록 저장**:
  - 작업 시작 시: `작업기록/진행중/YYYY-MM-DD-[description].md` 생성
  - 작업 보류 시: `작업기록/보류/`로 이동
  - 작업 완료 시: `작업기록/완료/`로 이동

- **필수 작업 흐름**:
  1. 작업 시작: PRD/Task 파일 생성 → `기획/진행중/` 또는 `작업/진행중/`
  2. 작업 진행: TodoWrite로 진행 상태 추적
  3. **작업 완료: 파일을 `완료/` 폴더로 이동**
  4. Git 커밋: 결과 파일 포함하여 커밋

#### 자동 감지 및 알림 규칙 (필수 준수)
- **트리거 감지 시**: 작업 시작 **전** 다음 메시지 출력:
  ```
  📋 실행_기획.md / 실행_작업.md 규칙을 적용합니다.
  ```
- **복잡도 평가**: 수정 예상 파일 수, 영향 범위 기준
  - 복잡도 Medium 이상 (3개+ 파일) → 실행_작업.md 자동 참조 제안
  - 새 기능 요청 → 실행_기획.md 자동 참조 제안
- **대규모 구현 작업**: 자동으로 Task 파일 생성 제안
- **완료 시 기록**: 작업 완료 후 반드시 파일을 `완료/` 폴더로 이동

### 마크다운 문서 Git 관리
- **로컬에서 작성된 모든 `.md` 파일은 Git에서 관리**
- 특히 **WHCommon 폴더**의 모든 마크다운은 반드시 Git 추적
- `.gitignore`에서 `.md` 파일 제외하지 않도록 주의

### Docker 리소스 자동 관리
- **자동 정리 스크립트**: `WBHubManager/scripts/docker-cleanup.sh`
- **정리 조건**:
  1. Exit 상태 컨테이너 즉시 삭제
  2. 30일 이상 사용하지 않은 이미지 삭제
  3. 빌드 캐시 50GB 초과 시 오래된 캐시 정리
  4. Dangling 이미지 및 볼륨 자동 정리

- **사용 방법**:
  ```bash
  # docker-compose로 빌드 + 자동 정리
  docker-compose --profile cleanup up -d

  # Makefile 사용 (권장)
  make build-clean   # 빌드 + 정리
  make up-clean      # 실행 + 정리
  make clean-docker  # 수동 정리
  ```

- **정리 주기**:
  - 매 빌드 후 자동 (--profile cleanup 사용 시)
  - 개발자 판단에 따라 수동 실행 가능
  - WSL 안정성을 위해 주기적 실행 권장

---

## 세션 시작 시 필수 동작

세션의 **첫 번째 응답**에서 반드시 다음을 수행:

1. **컨텍스트 로드 확인 메시지** 출력
2. **현재 로드된 MCP 서버 목록** 출력 (`/mcp` 명령어 결과를 바탕으로)

### 출력 형식 예시
```
✓ 컨텍스트 파일 로드 완료 (WHCommon/claude-context.md)
  - 기본 언어: 한국어
  - 프로젝트 규칙 및 폴더 구조 적용됨

✓ 현재 로드된 MCP 서버:
  - Sequential Thinking: 실시간 사고 구조화 및 의사결정 과정 추적
  - Obsidian: PRD, 의사결정 로그, 문서 영구 저장
  - Context7: 라이브러리/프레임워크 최신 문서 조회
```

**주의**: 실제 출력 시에는 `/mcp` 명령어를 통해 현재 세션에서 실제로 로드된 MCP 서버 목록을 확인하여 표시할 것.

---

## 기타 설정 및 규칙

### Railway 배포 제약사항
- ❌ **Railway CLI 사용 불가**: 이 워크스페이스에서는 Railway CLI 명령어를 실행할 수 없음
- ✅ **대안**: Railway 대시보드의 웹 UI를 통해서만 작업 가능
  - DB 마이그레이션: Railway 대시보드 → 서비스 → ⋮ → "Run a Command"
  - 환경변수 설정: Railway 대시보드 → Variables 탭
  - 로그 확인: Railway 대시보드 → Logs 탭
- 📌 Railway 관련 작업 시 항상 사용자에게 웹 UI를 통한 수동 작업을 요청해야 함

### 환경변수 관리 규칙
- ✅ **환경변수 템플릿**: `.env.template` 파일 사용
  - 각 프로젝트의 루트에 `.env.template` 파일 제공
  - 신규 개발자는 이 파일을 복사하여 `.env.local` 생성
  - 명령어: `cp .env.template .env.local`
  - Git에 커밋됨 (민감 정보 없이 구조만 제공)
- ✅ **로컬 개발**: `.env.local` 파일 사용
  - 로컬 개발 시 애플리케이션이 `.env.local` 파일에서 환경변수 로드
  - Git에 커밋되지 않음 (`.gitignore`에 포함)
  - 필수 항목(*) 표시된 환경변수는 반드시 값 입력 필요
- ✅ **스테이징 환경**: `.env.staging` 파일 사용
  - Docker 스테이징 환경에서 `.env.staging` 파일에서 환경변수 로드
  - `DOCKER_PORT=4400` 설정
  - Git에 커밋되지 않음 (`.gitignore`에 포함)
  - 각 프로젝트(WBHubManager, WBSalesHub, WBFinHub)에 `.env.staging` 파일 존재
  - Docker 실행 시: `docker run --env-file .env.staging ...`
  - **⚠️ 오라클 환경은 항상 HTTPS 사용**: 모든 URL은 `https://staging.workhub.biz` 형태 (포트 번호 없음)
  - SSL 인증서: Let's Encrypt (staging.workhub.biz)
  - nginx-staging이 포트 443(HTTPS)으로 SSL 터미네이션 수행
- ✅ **프로덕션 배포**: `.env.prd` 파일 사용
  - 프로덕션 배포 시 애플리케이션이 `.env.prd` 파일에서 환경변수 로드
  - `DOCKER_PORT=4500` 설정
  - Git에 커밋되지 않음 (`.gitignore`에 포함)
  - 오라클 서버 배포 시 Git Hook이 자동으로 Doppler에서 `.env.prd` 생성
  - **⚠️ 오라클 환경은 항상 HTTPS 사용**: 모든 URL은 `https://workhub.biz` 형태 (포트 번호 없음)
  - SSL 인증서: Let's Encrypt (workhub.biz, *.workhub.biz)
  - nginx-prod가 포트 443(HTTPS)으로 SSL 터미네이션 수행
- ✅ **Doppler 동기화**: 3개 환경에 각각 동기화
  - **Development 환경**: `.env.local` 파일을 Doppler Development 설정과 동기화 (로컬 개발용)
  - **Staging 환경**: `.env.staging` 파일을 Doppler Staging 설정과 동기화 (Docker 스테이징용)
  - **Production 환경**: `.env.prd` 파일을 Doppler Production 설정과 동기화 (오라클 운영용)
  - **수동 푸시**: `WHCommon/scripts/push-all-to-doppler.sh` 스크립트 실행
  - Git Hook을 통한 자동 동기화는 현재 비활성화됨
  - **Doppler Config 명명 규칙**:
    - Development: `dev_wbhubmanager`, `dev_wbsaleshub`, `dev_wbfinhub`
    - Staging: `stg_wbhubmanager`, `stg_wbsaleshub`, `stg_wbfinhub`
    - Production: `prd_wbhubmanager`, `prd_wbsaleshub`, `prd_wbfinhub`
- ❌ **실시간 Doppler 연동 금지**: 애플리케이션 실행 시 Doppler API를 직접 호출하지 않음
- 📌 **Docker 포트 환경변수**: `DOCKER_PORT` 하나로 통일
  - 스테이징: `DOCKER_PORT=4400` (.env.staging 파일)
  - 운영: `DOCKER_PORT=4500` (.env.prd 파일)
  - 개별 허브별 포트 변수(DOCKER_HUBMANAGER_PORT 등)는 사용하지 않음
- 📌 **Doppler 토큰 파일 위치**: `/home/peterchung/WHCommon/env.doppler`
  - 모든 프로젝트의 Development/Staging/Production Doppler 토큰이 저장됨
  - 스크립트가 이 파일에서 토큰을 읽어 사용
  - 예시: `DOPPLER_TOKEN_HUBMANAGER_DEV`, `DOPPLER_TOKEN_HUBMANAGER_STG`, `DOPPLER_TOKEN_HUBMANAGER_PRD`
- 📌 **신규 PC 세팅**: `/home/peterchung/WHCommon/문서/가이드/로컬-환경-세팅-가이드.md` 참조 (14단계 전체 세팅 가이드)

### 환경변수 추가 규칙 (중요)

#### 1. NEXT_PUBLIC_* 사용 금지
- ❌ **금지**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_HUB_MANAGER_URL` 등
- ✅ **대안**: 상대경로 `/api` + Nginx 프록시
- **이유**:
  - 빌드 시점 하드코딩 → 환경별 재빌드 필요
  - Docker 캐시 재활용 불가
  - 디버깅 시 재빌드 필요 (5-10분 vs 환경변수 수정 10초)

#### 2. 개발/프로덕션 모드 구분
- ✅ **NODE_ENV 사용** (표준):
  ```typescript
  const isDev = process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production';
  ```
- ✅ **DEPLOY_ENV 사용** (환경 구분 필요 시):
  ```bash
  DEPLOY_ENV=local      # 로컬 개발
  DEPLOY_ENV=staging    # Docker 스테이징
  DEPLOY_ENV=production # 오라클 프로덕션
  ```
- ❌ **금지된 방식**:
  - `AUTH_ENABLED=true/false` → `NODE_ENV`로 대체
  - `DEBUG_LOGGING=true` → `NODE_ENV === 'development'`로 대체
  - `USE_JWT_AUTH=true` → 항상 true (삭제)
  - `NEXT_PUBLIC_AUTO_AUTH` → `NODE_ENV`로 대체

#### 3. 디버깅용 환경변수 금지
- ❌ **원칙**: 디버깅을 위해 새 환경변수를 만들지 않는다
- **잘못된 방식 vs 올바른 방식**:
  | 상황 | ❌ 잘못된 방식 | ✅ 올바른 방식 |
  |------|---------------|---------------|
  | API URL 변경 | `DEBUG_API_URL` 추가 | Nginx 설정 변경 또는 상대경로 |
  | 기능 ON/OFF | `ENABLE_NEW_FEATURE` 추가 | 코드 조건문 후 제거 |
  | 로깅 활성화 | `DEBUG_LOGGING=true` 추가 | `NODE_ENV === 'development'` |
  | 인증 우회 | `AUTH_ENABLED=false` 추가 | dev-login 엔드포인트 사용 |

#### 4. 환경변수 추가 전 체크리스트
새 환경변수 추가 시 반드시 확인:
- [ ] 기존 변수로 해결 가능한가? (`NODE_ENV`, `PORT` 등)
- [ ] 코드 로직으로 해결 가능한가?
- [ ] 3개 이상의 허브에서 필요한가? (아니면 하드코딩)
- [ ] 프로덕션에서도 필요한가? (아니면 추가하지 않음)
- [ ] `.env.template`에 문서화했는가?

#### 5. 허용되는 환경변수 카테고리
| 카테고리 | 예시 | 허용 |
|----------|------|------|
| **인프라** | `DATABASE_URL`, `PORT` | ✅ 필수 |
| **보안** | `JWT_SECRET`, `SESSION_SECRET` | ✅ 필수 |
| **외부 서비스** | `SLACK_BOT_TOKEN`, `ANTHROPIC_API_KEY` | ✅ 허용 |
| **기능 플래그** | `ENABLE_*`, `USE_*` | ❌ 금지 (코드로 처리) |
| **디버깅** | `DEBUG_*`, `LOG_*` | ❌ 금지 (`NODE_ENV`로 판단) |

### 데이터베이스 환경변수 규칙 (2026-01-14 통일)

#### 환경변수 명명 규칙
모든 WorkHub 프로젝트에서 다음 환경변수만 사용:

```bash
# 메인 데이터베이스 (각 허브의 DB)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# HubManager 데이터베이스 (SSO 인증용, WBHubManager 제외한 모든 허브)
HUBMANAGER_DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/wbhubmanager
```

#### ❌ 제거된 환경변수
다음 환경변수는 더 이상 사용하지 않음:
- `ORACLE_DATABASE_URL`, `AWS_DATABASE_URL`, `RAILWAY_DATABASE_URL`
- `FINHUB_DATABASE_URL`, `SALESHUB_DATABASE_URL`, `ONBOARDINGHUB_DATABASE_URL`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD` (이미 DATABASE_URL에 포함)
- `DB_PROVIDER` (Oracle/AWS/Railway 선택 로직 제거)
- Connection pool URL 파라미터 (`?connection_limit=3&pool_timeout=20`)

#### 로컬 개발 데이터베이스 환경
- ✅ **로컬 Docker PostgreSQL 사용** (포트 5432로 통일):
  - 호스트: `localhost:5432`
  - 사용자: `workhub` / 비밀번호: `workhub`
  - 데이터베이스:
    - WBHubManager: `wbhubmanager`
    - WBSalesHub: `wbsaleshub`
    - WBFinHub: `wbfinhub`
    - WBOnboardingHub: `wbonboardinghub`
  - Docker Compose: `docker-compose -f docker-compose.dev.yml up -d postgres`

- 📌 **환경별 DATABASE_URL 형식**:
  ```bash
  # 로컬 개발 (.env.local)
  DATABASE_URL=postgresql://workhub:workhub@localhost:5432/[db_name]

  # 스테이징 (.env.staging)
  DATABASE_URL=postgresql://workhub:Wnsgh22dml2026@host.docker.internal:5432/[db_name]

  # 프로덕션 (.env.prd)
  DATABASE_URL=postgresql://workhub:Wnsgh22dml2026@158.180.95.246:5432/[db_name]
  ```

- ℹ️ **오라클 개발 DB 접근** (필요 시):
  - SSH 터널링을 통해 일시적으로 접근 가능
  - 스크립트: `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh`
  - 데이터 마이그레이션: `/home/peterchung/WHCommon/scripts/migrate-oracle-to-local.sh`
  - 용도: 데이터 마이그레이션, 프로덕션 데이터 확인 등

### 프로덕션 배포 환경
- **오라클 클라우드**: 메인 프로덕션 환경 (각 허브별 개별 포트, Nginx 리버스 프록시)
  - WBHubManager: `http://workhub.biz` (Backend: 4090)
  - WBSalesHub: `http://workhub.biz/saleshub` (Backend: 4010)
  - WBFinHub: `http://workhub.biz/finhub` (Backend: 4020)
  - WBOnboardingHub: `http://workhub.biz/onboarding` (Backend: 4030)
  - WBRefHub: `http://workhub.biz/refhub` (Backend: 4040)
  - HWTestAgent: `http://workhub.biz/testagent` (Backend: 4100)
  - SSH 접속: `ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246`
  - SSH 키 위치: `C:\GitHub\WHCommon\SSHkey\ssh-key-2026-01-01.key` (WSL에서는 `~/.ssh/oracle-cloud.key`로 복사 후 사용)
- ❌ **Railway 배포 안함**: 오라클 클라우드로 완전 마이그레이션 완료

### 오라클 클라우드 배포 원칙 (2026-01-11 변경)
- ✅ **오라클 서버에서 빌드**: Git pull 후 Docker Compose로 직접 빌드
- ✅ **스테이징/프로덕션 동시 운영**: 4400(스테이징), 4500(프로덕션)
- ✅ **이미지 태그 관리**: staging, production, rollback
- ❌ **로컬 빌드 후 전송**: 더 이상 사용하지 않음

- 📌 **배포 방법**:
  1. 로컬에서 코드 수정 후 Git push
  2. 오라클 서버 SSH 접속: `ssh oracle-cloud`
  3. 스테이징 배포: `./scripts/deploy-staging.sh`
  4. 스테이징 테스트: `http://158.180.95.246:4400`
  5. 프로덕션 승격: `./scripts/promote-production.sh`
  6. 롤백 (필요시): `./scripts/rollback-production.sh`

- 📌 **오라클 서버 디렉토리 구조**:
  ```
  /home/ubuntu/workhub/
  ├── WBHubManager/           # Git clone
  ├── WBSalesHub/             # Git clone
  ├── WBFinHub/               # Git clone
  ├── WBOnboardingHub/        # Git clone
  ├── config/
  │   ├── .env.common         # 공통 (DB, OAuth)
  │   ├── .env.staging        # 스테이징 (PORT=4400)
  │   ├── .env.production     # 프로덕션 (PORT=4500)
  │   └── keys/               # JWT 키 파일
  ├── docker-compose.yml      # 통합 설정
  ├── nginx/nginx.conf        # 4400/4500 라우팅
  └── scripts/                # 배포 스크립트
  ```

- 📌 **배포 가이드**: `C:\GitHub\WHCommon\배포-가이드-오라클.md` 참조

### GitHub SSH 설정 (WSL)
- **등록된 SSH 키**: `WSL Ubuntu_Home` (GitHub에 등록됨)
  - 핑거프린트: `SHA256:40SmkVG7LVOoq50pEe2FyhQ0dJL1EYGiAIpbO6Mjix8`
  - 등록일: 2026-01-01
- **WSL SSH 설정 파일**: `~/.ssh/config`
  ```
  Host github.com
      HostName github.com
      User git
      IdentityFile ~/.ssh/github_key
      IdentitiesOnly yes

  Host oracle-cloud
      HostName 158.180.95.246
      User ubuntu
      IdentityFile ~/.ssh/oracle-cloud.key
      IdentitiesOnly yes
  ```
- **WSL에서 Git push 명령어**: `git push origin <branch>`
- 📌 **주의**: WSL에서 GitHub SSH 키가 없으면 새로 생성 후 GitHub Settings > SSH keys에 등록 필요

### WSL 우선 원칙
- ⚠️ **WSL 우선**: 작업이 안 될 경우 설치, 설정 등으로 WSL에서 해결하는 방법을 우선 시도
- ⚠️ **Windows는 최후 수단**: WSL에서 도저히 해결 불가능한 경우에만 Windows에서 진행
- 예시:
  - SSH 키 없음 → WSL에서 `ssh-keygen`으로 새로 생성 후 GitHub에 등록
  - 패키지 없음 → `apt install` 또는 `npm install`로 설치
  - 권한 문제 → `chmod`로 권한 수정

### WSL sudo 설정
- ✅ **sudo 비밀번호 없이 사용 가능**: `/etc/sudoers.d/peterchung` 파일에 설정됨
- 설정 방법 (이미 완료됨):
  ```powershell
  # Windows PowerShell (관리자 권한)에서 실행
  wsl -u root bash -c "echo 'peterchung ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers.d/peterchung && chmod 0440 /etc/sudoers.d/peterchung"
  ```
- 확인: `sudo whoami` → `root` 출력 (비밀번호 요구 없음)

### HWTestAgent 테스트 시나리오
- **ISTQB 표준 기반 4종 시나리오**:
  - Smoke: 배포 전 최소 검증 (4시간마다)
  - Core-API-P0: 시스템 장애 수준 Critical (6시간마다)
  - Core-API-P1: 핵심 기능 오류 수준 High (하루 2회)
  - Core-API-P2: 부가 기능 오류 수준 Medium (매일 정오)
- **대상 프로젝트**: WBHubManager, WBSalesHub, WBFinHub, WBOnboardingHub
- **지원 환경**: production, development, docker

### UI 아이콘 렌더링 규칙
- ✅ **lucide-react 라이브러리 사용**: 모든 프로젝트에서 UI 아이콘은 `lucide-react`의 SVG 아이콘을 사용
- ❌ **이모지 사용 금지**: 이모지(🤖🔧👤🔒 등)는 사용하지 않음
- 📌 **예시**: WBSalesHub 대시보드, WBHubManager 허브 선택 페이지 등
- 📌 **설치**: `npm install lucide-react`
- 📌 **사용법**:
  ```tsx
  import { FlaskConical, Bot, Users, ShieldCheck } from 'lucide-react';

  <FlaskConical className="w-5 h-5 text-blue-600" />
  ```

### Playwright 반복 디버깅 (플라반복디버깅)
사용자가 "플라반복디버깅" 또는 "플레이라이트 반복 디버깅"이라고 요청하면, Playwright를 활용하여 화면이 제대로 나올 때까지 반복적으로 디버깅을 수행합니다.

**수행 절차**:
1. **현재 상태 확인**
   - 페이지 접속 시도 및 스크린샷 캡처
   - 네트워크 요청/응답 모니터링
   - 콘솔 에러 확인

2. **문제 진단**
   - HTTP 상태 코드 확인 (404, 500 등)
   - API 엔드포인트 연결 상태 확인
   - 프론트엔드/백엔드 서버 실행 상태 확인
   - 환경변수 및 설정 파일 검증

3. **문제 해결**
   - 발견된 문제에 대한 수정 적용
   - 서버 재시작 (필요시)
   - 코드 수정 (필요시)

4. **재검증**
   - 수정 후 다시 Playwright로 테스트
   - 화면이 정상적으로 표시될 때까지 1-3단계 반복

5. **완료 보고**
   - 최종 스크린샷 제공
   - 수정한 내용 요약
   - 접속 URL 및 상태 정보 제공

**테스트 스크립트 예시**:
```typescript
import { test, expect } from '@playwright/test';

test('debug page until success', async ({ page }) => {
  // 네트워크 및 콘솔 모니터링
  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('❌ Console Error:', msg.text());
  });

  // 페이지 접속
  await page.goto('http://localhost:3090/hubs');

  // 스크린샷 저장
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

  // 상태 확인
  const response = await page.goto('http://localhost:3090/hubs');
  console.log('Status:', response?.status());
});
```

### SSO 테스트 계정
- **Google 테스트 계정**:
  - Email: biz.dev@wavebridge.com
  - Password: wave1234!!
- **환경변수**:
  - `TEST_GOOGLE_EMAIL=biz.dev@wavebridge.com`
  - `TEST_GOOGLE_PASSWORD=wave1234!!`
- **사용처**: WBSalesHub, WBFinHub, WBOnboardingHub SSO 통합 테스트
- **주의**: SSO 테스트 시 항상 이 테스트 계정을 사용할 것
- 📌 **테스트 방법**:
  1. 환경변수에서 `TEST_GOOGLE_EMAIL`, `TEST_GOOGLE_PASSWORD` 읽기
  2. Playwright로 Google OAuth 자동 로그인 구현
  3. 토큰 전달 및 인증 상태 검증
  4. 대시보드 접근 확인

### Playwright 테스트 실행 규칙
- ✅ **HWTestAgent를 통합 테스트 허브로 사용**: 모든 Playwright 테스트는 HWTestAgent에서 실행
  - 이유: 각 프로젝트마다 독립적인 `node_modules`를 가지므로 Playwright를 매번 설치해야 하는 문제 방지
  - HWTestAgent에는 이미 Playwright 설치되어 있음
  - 테스트 스크립트 위치: `/home/peterchung/HWTestAgent/tests/`
  - 테스트 결과 저장: `/home/peterchung/HWTestAgent/test-results/`
  - **E2E 테스트 가이드**: `~/.claude/skills/스킬테스터/E2E-테스트-가이드.md` (Google OAuth 자동 로그인, 크로스 허브 네비게이션 등)
- ❌ **각 프로젝트에서 직접 Playwright 실행 금지**: WBSalesHub, WBHubManager 등 개별 프로젝트에서 테스트 스크립트를 작성하지 않음
- 📌 **테스트 실행 방법**:
  ```bash
  cd /home/peterchung/HWTestAgent
  npx playwright test tests/[test-name].spec.ts
  ```
- 📌 **테스트 스크립트 명명 규칙**:
  - 환경별 E2E 테스트: `tests/e2e-[환경]-[프로젝트]-[기능].spec.ts`
    - 예: `e2e-oracle-staging-authenticated.spec.ts`
  - 프로젝트별 테스트: `tests/wbsaleshub-[feature].spec.ts`
  - 통합 테스트: `tests/integration-[feature].spec.ts`
- 📌 **Google OAuth 자동 로그인**:
  - 헬퍼 위치: `tests/helpers/google-oauth-helper.ts`
  - 테스트 계정: `biz.dev@wavebridge.com` / `wave1234!!`
  - 사용 예시:
    ```typescript
    import { loginWithGoogle, getTestGoogleCredentials } from './helpers/google-oauth-helper';

    const { email, password } = getTestGoogleCredentials();
    await loginWithGoogle(page, {
      email,
      password,
      loginUrl: 'http://158.180.95.246:4400',
      redirectPath: '/hubs'
    });
    ```

### 데이터베이스 Enum 값 규칙
- ✅ **소문자 사용**: PostgreSQL enum 값과 TypeScript 타입은 모두 소문자로 통일
- **AccountStatus**: `'pending'`, `'active'`, `'rejected'`, `'inactive'`
- **AccountRole**: `'admin'`, `'user'`, `'master'`, `'finance'`, `'trading'`, `'executive'`, `'viewer'`
- 📌 **이유**: PostgreSQL 공식 문서 및 대부분의 Node.js/TypeScript 프로젝트에서 enum 값을 소문자로 사용하는 것이 표준
- 📌 **적용 범위**: WBHubManager, WBSalesHub, WBFinHub, WBOnboardingHub 모든 허브

### API 엔드포인트 Trailing Slash 규칙

#### 원칙
- ✅ **모든 API 엔드포인트는 trailing slash 없이 정의** (RESTful API 표준)
- ✅ **프론트엔드는 trailing slash 없이 호출** (일관성)
- ✅ **Next.js는 trailingSlash: false 명시** (모든 허브)

#### 백엔드 (Express)
```typescript
// ✅ 올바른 방식 (trailing slash 없음)
router.get('/api/customers', handler)
router.get('/api/customers/:id', handler)
router.post('/api/customers', handler)

// ❌ 잘못된 방식 (trailing slash 사용)
router.get('/api/customers/', handler)
```

#### 프론트엔드 (API 호출)
```typescript
// ✅ 올바른 방식
api.get('/customers')
api.get(`/customers/${id}`)
fetch('/api/auth/me')

// ❌ 잘못된 방식
api.get('/customers/')
fetch('/api/auth/me/')
```

#### Next.js 설정 (필수)
```typescript
// next.config.ts - 모든 허브에서 명시적 설정
const nextConfig: NextConfig = {
  trailingSlash: false,  // 명시적으로 false 설정
  // ...
};
```

#### API URL 경로 구성
```bash
# 환경변수 (.env.local)
NEXT_PUBLIC_API_URL=/api      # ✅ 절대 경로 (슬래시로 시작)

# 프론트엔드 API 클라이언트
const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

// ✅ 올바른 호출
fetch(`${apiUrl}/auth/me`)  # → /api/auth/me

// ❌ 잘못된 호출 (중복 /api)
fetch(`${apiUrl}/api/auth/me`)  # → /api/api/auth/me
```

#### Nginx 설정
```nginx
# HubManager nginx.conf - trailing slash 정규화
location /saleshub {
    rewrite ^/saleshub/?(.*)$ /$1 break;  # trailing slash 선택적 제거
    proxy_pass http://saleshub;
}

# API는 정확히 매칭
location /api/ {
    proxy_pass http://hubmanager;
}
```

#### 체크리스트 (신규 API 추가 시)
- [ ] 엔드포인트 경로에 trailing slash 없는가?
- [ ] 프론트엔드 호출 시 trailing slash 없는가?
- [ ] `${apiUrl}/api/*` 중복 경로 아닌가?
- [ ] RESTful 규칙 준수하는가? (`/customers` not `/customers/`)

### 스테이징 환경 접근 포트 (중요)
- ✅ **스테이징 URL**: `https://staging.workhub.biz:4400` (포트 번호 필수)
- ✅ **프로덕션 URL**: `https://workhub.biz` (포트 번호 없음)
- 📌 **이유**: 스테이징 Nginx는 4400 포트에서 SSL 리스닝, 프로덕션은 443 포트
- 📌 **환경변수**: 스테이징 환경변수에는 `:4400` 포함하지 않음 (Nginx 내부 라우팅용)
- 📌 **브라우저 접속**: 반드시 `https://staging.workhub.biz:4400` 형식으로 접속

---
마지막 업데이트: 2026-01-14

**주요 변경 사항**:
- 작업 실행 규칙 추가: 모든 구현 작업 병렬 진행 원칙
- 오라클 클라우드 배포 원칙 변경: 로컬 빌드 → 이미지 전송 방식으로 전환
- 데이터베이스 Enum 값 규칙 추가 (소문자 통일)
- AccountStatus, AccountRole 타입 정의 소문자로 변경
- **API 엔드포인트 Trailing Slash 규칙 추가 (2026-01-14)**
- **스테이징 환경 접근 포트 규칙 추가 (2026-01-14)**: 4400 포트 필수
