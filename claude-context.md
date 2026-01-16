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

### Doppler 동기화
- **3개 환경 동기화**: Development, Staging, Production
- **수동 푸시**: `WHCommon/scripts/push-all-to-doppler.sh`
- **Config 명명**: `dev_wbhubmanager`, `stg_wbhubmanager`, `prd_wbhubmanager`

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

마지막 업데이트: 2026-01-16

**주요 변경 사항**:
- 토큰 사용량 최적화를 위해 파일 크기 50% 축소
- 스킬테스터, MCP 상세 정보를 별도 문서로 분리
- 핵심 규칙과 가이드 참조 링크 중심으로 재구성
