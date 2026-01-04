# Claude Code 컨텍스트

이 파일은 Claude Code와의 대화에서 기억해야 할 중요한 정보를 저장합니다.

## 프로젝트 정보

### 전체 허브 리스트
WorkHub 프로젝트는 다음 5개의 허브로 구성됩니다:

| 허브 이름 | 경로 | 개발 포트 (F/B) | 스테이징 포트 (B) | 운영 포트 (B) | 설명 |
|----------|------|----------------|------------------|--------------|------|
| **WBHubManager** | `/home/peterchung/WBHubManager` | 3090 / 4090 | 4290 | 4490 | 허브 관리 및 SSO 인증 서버 |
| **WBSalesHub** | `/home/peterchung/WBSalesHub` | 3010 / 4010 | 4210 | 4410 | 고객 및 미팅 관리 시스템 |
| **WBFinHub** | `/home/peterchung/WBFinHub` | 3020 / 4020 | 4220 | 4420 | 재무/트랜잭션 관리 시스템 |
| **WBOnboardingHub** | `/home/peterchung/WBOnboardingHub` | 3030 / 4030 | 4230 | 4430 | 신규 사용자 온보딩 시스템 |
| **WBRefHub** | `/home/peterchung/WBHubManager/WBRefHub` | 3040 / 4040 | 4240 | 4440 | 레퍼런스/문서 관리 시스템 (HubManager 하위) |
| **HWTestAgent** | `/home/peterchung/HWTestAgent` | 3080 / 4080 | 4280 | 4480 | 자동화 테스트 시스템 |

**포트 체계**:
- **개발 환경 (Dev)**: 3000번대 (프론트엔드) / 4000번대 (백엔드)
- **스테이징 환경 (Docker)**: 4200번대 (백엔드만, 프로덕션 모드)
- **운영 환경 (Oracle)**: 4400번대 (백엔드만, 프로덕션 모드)
- 프로덕션 모드에서는 프론트엔드가 정적 파일로 제공되므로 별도 포트 불필요

**참고**:
- 대부분의 허브는 독립된 Git 저장소로 관리됨
- WBRefHub는 WBHubManager 저장소 내에 위치
- 공용 리소스는 WBHubManager 저장소에서 관리
- 프로덕션 URL: `http://workhub.biz/[hub-name]`

### 폴더 구조
- **공용폴더**: `C:\GitHub\WHCommon` - 프로젝트 간 공유되는 문서 및 리소스
- **테스트에이전트**: `C:\GitHub\HWTestAgent` - 자동화 테스트 시스템
- **테스트리포트폴더**: `C:\GitHub\HWTestAgent\TestReport` - 테스트 결과 및 리포트 저장
- **작업중폴더**: `C:\GitHub\WHCommon\OnProgress` - 진행 중인 작업 상태 기록

### 테스트 관련 폴더 (HWTestAgent)
- **TestAgent**: `/home/peterchung/HWTestAgent` - 통합 테스트 에이전트
  - `test-results/reports/` - 테스트 리포트 저장
  - `test-results/guides/` - 테스트 가이드 모음
  - `test-results/guides/docker/` - Docker 테스트 가이드
  - `test-results/logs/` - 테스트 로그
  - `test-plans/templates/` - 테스트 템플릿
  - `scenarios/` - YAML 테스트 시나리오

### 중요 문서
- **기능 리스트**: `C:\GitHub\WHCommon\기능-리스트.md` - 모든 WorkHub 프로젝트의 상세 기능 목록 (도입일 포함)
- **테스트리포트포맷**: `C:\GitHub\HWTestAgent\TestReport\테스트-리포트-템플릿.md` - 테스트 리포트 작성 시 사용하는 표준 템플릿
- **테스트PRD폴더**: `C:\GitHub\HWTestAgent\테스트_작성` - 테스트 시나리오 PRD 문서
- **기능PRD폴더**: `C:\GitHub\WHCommon\기능 PRD` - 기능 개발 PRD 문서

## 폴더 참조 규칙
- 사용자가 **폴더 이름을 명시하지 않고** 경로를 언급하면 **WHCommon 폴더**를 의미함
- 예: `/기능 PRD/` → `C:\GitHub\WHCommon\기능 PRD/`
- 예: `/tasks/` → `C:\GitHub\WHCommon\tasks/`

## 언어 설정
- 새 채팅이나 대화 압축 후 **한국어**를 기본 언어로 사용

## 세션 시작 규칙
- 새 세션에서 사용자가 처음 입력하는 단어는 **세션 제목용**임
- 첫 입력에 대해 관련 작업을 이어서 하지 말고, 제목으로만 인식하고 간단히 인사만 할 것
- 예: 사용자가 "안녕"이라고 입력하면 → "안녕하세요! 무엇을 도와드릴까요?" 정도로만 응답

## 저장소 관리 규칙

### WBHubManager 저장소 관리 항목
WBHubManager Git 저장소에서 다음 항목들을 관리합니다:
- ✅ **워크스페이스 설정 파일** (`.code-workspace` 등)
- ✅ **WHCommon 공용 폴더** 전체
  - Docker 테스트 가이드 (`WHCommon/Docker/*.md`)
  - 공용 규칙 파일 (`WHCommon/ppPrd.md`, `ppTask.md`, `claude-context.md` 등)
  - 기타 프로젝트 간 공유 문서 및 설정
- ✅ **WBHubManager 프로젝트 코드** (서버, 프론트엔드 등)

### 각 Hub 저장소 관리 항목 (WBFinHub, WBSalesHub 등)
- ✅ 각 Hub의 **고유 프로젝트 코드만** 관리
- ❌ 워크스페이스 설정이나 공용 폴더는 관리하지 않음

### 정리
모든 공용/공유 자원은 **WBHubManager 저장소 하나로 집중 관리**하고, 각 Hub는 자신의 코드만 관리하는 구조입니다.

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

### 필수 MCP 서버
다음 MCP 서버를 항상 로드하고 우선적으로 사용합니다:

| MCP 서버 | 용도 | 우선순위 |
|----------|------|----------|
| **Sequential Thinking** | 실시간 사고 구조화 및 의사결정 과정 추적 | 최고 |
| **Obsidian** | PRD, 의사결정 로그, 문서 영구 저장 | 최고 |
| **Context7** | 라이브러리/프레임워크 최신 문서 조회 | 높음 |

### MCP 사용 규칙
- **사고 과정 시각화**: Sequential Thinking MCP를 사용하여 복잡한 문제 해결 시 단계별 사고 과정을 구조화
- **문서 영구 저장**: Obsidian MCP를 사용하여 완성된 PRD, 의사결정 로그, 회의록 등을 체계적으로 저장
- **문서 조회 시**: Context7 MCP를 통해 최신 라이브러리 문서를 먼저 확인
- **코드 작성 시**: Context7에서 제공하는 최신 API와 베스트 프랙티스를 참고
- **MCP 도구 우선**: 동일한 기능이 있다면 일반 웹 검색보다 MCP 도구를 우선 사용

### Sequential Thinking + Obsidian 워크플로우
1. **실시간 사고**: Sequential Thinking으로 문제 분석 및 의사결정 과정 구조화
2. **영구 저장**: 완성된 문서를 Obsidian에 저장하여 장기 지식 베이스 구축
3. **검색 및 재사용**: Obsidian에서 과거 의사결정 로그 검색 및 재참조

### MCP 관련 명령어
```bash
# 현재 연결된 MCP 서버 확인
/mcp

# MCP 서버 목록 보기
claude mcp list
```

---

## 개발 및 문서 관리 규칙

### 빌드 환경
- **모든 로컬/운영 빌드는 Docker Compose 사용**
  - 개발 환경: `docker-compose.dev.yml`
  - 운영 환경: `docker-compose.prod.yml`

### 로컬 서버 설정
- **로컬 서버 장시간 유지**: 서버 띄운 후 일정 시간이 지나도 자동 종료되지 않도록 설정
  - `timeout` 설정 해제 또는 충분히 긴 값으로 설정
  - 개발 중 서버 재시작 최소화

### Docker 환경 원칙 (스테이징)
- ✅ **Docker는 항상 프로덕션 모드**: 오라클 클라우드와 동일한 환경 유지
  - `NODE_ENV: production` 설정 필수
  - dev-login 엔드포인트 비활성화
  - Google OAuth만 사용
- ✅ **localhost + 4200번대 포트 사용**: 개발 환경과 포트 충돌 방지
  - HubManager: http://localhost:4290
  - SalesHub: http://localhost:4210
  - FinHub: http://localhost:4220
  - OnboardingHub: http://localhost:4230
  - TestAgent: http://localhost:4280
- ✅ **환경 일관성**:
  - 로컬 개발 (4000번대): `npm run dev` (개발 모드, dev-login 사용 가능)
  - Docker 스테이징 (4200번대): 프로덕션 모드 (Google OAuth만)
  - Oracle 운영 (4400번대): 프로덕션 모드 (Google OAuth만)

### PRD 문서 관리
- PRD는 `WHCommon/계획_PRD.md` 규칙에 따라 작성
- 작성 완료된 PRD는 **기능 PRD 폴더**에 저장: `WHCommon/PRD/prd-[feature-name].md`
- **사용 시 알림**: `계획_PRD.md` 사용하여 작업 시작할 때 사용자에게 알려주기

### 테스크 및 커밋 규칙
- `WHCommon/계획_테스크.md`로 작성된 테스크는 **중간중간 커밋 진행**
- 각 주요 마일스톤 완료 시 커밋하여 작업 이력 관리
- **사용 시 알림**: `계획_테스크.md` 사용하여 작업 시작할 때 사용자에게 알려주기

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
- ✅ **프로덕션 배포**: `.env.prd` 파일 사용
  - 프로덕션 배포 시 애플리케이션이 `.env.prd` 파일에서 환경변수 로드
  - Git에 커밋되지 않음 (`.gitignore`에 포함)
  - 오라클 서버 배포 시 Git Hook이 자동으로 Doppler에서 `.env.prd` 생성
- ✅ **Doppler 동기화**: Git Hook을 통한 자동 동기화
  - **커밋 전** (`pre-commit`): `.env.local`의 환경변수를 Doppler Development 설정에 업로드
  - **Pull 후** (`post-merge`): Doppler에서 최신 환경변수를 다운로드하여 `.env.local` 업데이트
  - **배포 전** (`pre-push`): Doppler Production 설정에서 `.env.prd` 생성
- ❌ **실시간 Doppler 연동 금지**: 애플리케이션 실행 시 Doppler API를 직접 호출하지 않음
- 📌 **Doppler 토큰 파일 위치**: `C:\GitHub\WHCommon\env\.env.doppler`
  - 모든 프로젝트의 Development/Production Doppler 토큰이 저장됨
  - Git Hook 스크립트가 이 파일에서 토큰을 읽어 사용
  - 예시: `DOPPLER_TOKEN_HUBMANAGER_DEV`, `DOPPLER_TOKEN_HUBMANAGER_PRD`
- 📌 **신규 개발자 온보딩**: `C:\GitHub\WHCommon\온보딩-가이드.md` 참조

### 로컬 개발 데이터베이스 환경
- ✅ **Docker PostgreSQL 사용**: 모든 로컬 개발 환경은 Docker로 실행된 PostgreSQL 사용
  - 컨테이너 이름: `hwtestagent-postgres`
  - 이미지: `postgres:15`
  - 포트: `5432`
  - 사용자/비밀번호: `postgres/postgres`
  - 실행 명령어: `sudo docker run -d --name hwtestagent-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hwtestagent -p 5432:5432 postgres:15`
- ✅ **로컬 DB 연결 정보**:
  - **WBHubManager**: `postgresql://postgres:postgres@localhost:5432/hubmanager?schema=public`
  - **WBSalesHub**: `postgresql://postgres:postgres@localhost:5432/saleshub?schema=public`
  - **WBFinHub**: `postgresql://postgres:postgres@localhost:5432/finhub?schema=public`
  - **WBOnboardingHub**: `postgresql://postgres:postgres@localhost:5432/onboardinghub?schema=public`
  - **HWTestAgent**: `postgresql://postgres:postgres@localhost:5432/hwtestagent`
- ❌ **로컬에서 오라클 DB 직접 연결 금지**: 로컬 개발 시 오라클 클라우드 DB에 직접 연결하지 않음
  - 이유: 네트워크 레이턴시, 방화벽 설정, 프로덕션 데이터 격리
  - 로컬 개발은 항상 로컬 Docker PostgreSQL 사용

### 프로덕션 배포 환경
- **오라클 클라우드**: 메인 프로덕션 환경 (4400번대 포트 사용)
  - WBHubManager: `http://workhub.biz` (Backend: 4490)
  - WBSalesHub: `http://workhub.biz/saleshub` (Backend: 4410)
  - WBFinHub: `http://workhub.biz/finhub` (Backend: 4420)
  - WBOnboardingHub: `http://workhub.biz/onboarding` (Backend: 4430)
  - WBRefHub: `http://workhub.biz/refhub` (Backend: 4440)
  - HWTestAgent: `http://workhub.biz/testagent` (Backend: 4480)
  - SSH 접속: `ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246`
  - SSH 키 위치: `C:\GitHub\WHCommon\SSHkey\ssh-key-2026-01-01.key` (WSL에서는 `~/.ssh/oracle-cloud.key`로 복사 후 사용)
- ❌ **Railway 배포 안함**: 오라클 클라우드로 완전 마이그레이션 완료

### 오라클 클라우드 배포 원칙
- ❌ **로컬 Docker 빌드 금지**: 로컬에서 Docker 이미지를 빌드하지 않음
- ✅ **오라클에서 직접 빌드**: 오라클 클라우드 서버에서 GitHub에서 코드를 받아 빌드
- ✅ **GitHub SSH 키 공유**: 로컬 WSL의 GitHub SSH 키(`~/.ssh/github_key`)를 오라클 서버에 복사하여 사용
- 📌 **배포 방법**:
  1. 각 프로젝트의 `deploy-oracle.sh` 스크립트 실행
  2. 스크립트가 자동으로 코드를 GitHub에 푸시
  3. 오라클 서버에서 Git pull 후 Docker 빌드 및 배포
- 📌 **배포 가이드**: `C:\GitHub\WHCommon\배포-가이드-오라클.md` 참조
- 📌 **신규 프로젝트**: 배포 가이드의 "신규 프로젝트 생성 시 체크리스트" 따라 설정

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
- ❌ **각 프로젝트에서 직접 Playwright 실행 금지**: WBSalesHub, WBHubManager 등 개별 프로젝트에서 테스트 스크립트를 작성하지 않음
- 📌 **테스트 실행 방법**:
  ```bash
  cd /home/peterchung/HWTestAgent
  npx playwright test tests/[test-name].spec.ts
  ```
- 📌 **테스트 스크립트 명명 규칙**:
  - 프로젝트별 테스트: `tests/wbsaleshub-[feature].spec.ts`
  - 통합 테스트: `tests/integration-[feature].spec.ts`
  - E2E 테스트: `tests/e2e-[scenario].spec.ts`

---
마지막 업데이트: 2026-01-04

**주요 변경 사항**:
- 전체 허브 리스트 섹션 추가 (WBOnboardingHub 포함)
- 로컬 DB 연결 정보에 WBOnboardingHub 추가
- 프로덕션 배포 환경에 WBOnboardingHub 추가
- HWTestAgent 테스트 대상 프로젝트에 WBOnboardingHub 추가
