# MCP 서버 설정 가이드

이 가이드는 Claude Code에서 MCP (Model Context Protocol) 서버를 설치하고 설정하는 방법을 안내합니다.

**마지막 업데이트**: 2026-01-14
**적용 버전**: Claude Code CLI v2.1.6

---

## 📋 목차

1. [사전 준비](#사전-준비)
2. [Claude CLI 설치](#claude-cli-설치)
3. [MCP 서버 설치](#mcp-서버-설치)
4. [MCP 서버 추가](#mcp-서버-추가)
5. [설정 확인](#설정-확인)
6. [문제 해결](#문제-해결)

---

## 사전 준비

### 필수 요구사항
- Node.js 18 이상 (권장: Node.js 20+)
- VSCode Claude Code Extension 2.1.6 이상
- npm (Node.js 패키지 매니저)

### 환경변수 준비

`~/.bashrc` 또는 `~/.zshrc`에 다음 환경변수 추가:

```bash
# GitHub Personal Access Token
export GITHUB_TOKEN="github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# PostgreSQL 로컬 비밀번호
export POSTGRES_PASSWORD="postgres"
```

환경변수 적용:
```bash
source ~/.bashrc  # 또는 source ~/.zshrc
```

---

## Claude CLI 설치

MCP 서버를 추가하려면 Claude CLI가 필요합니다.

```bash
npm install -g @anthropic-ai/claude-code
```

설치 확인:
```bash
claude --version
```

---

## MCP 서버 설치

### 1. Sequential Thinking MCP (사고 구조화)

```bash
npm install -g @modelcontextprotocol/server-sequential-thinking
```

### 2. Obsidian MCP (문서 저장)

```bash
npm install -g obsidian-mcp
```

**추가 설정**: Obsidian vault 초기화

⚠️ **WSL 환경 주의**: Obsidian MCP는 `/mnt/c/` 마운트 경로를 지원하지 않습니다.
WSL 네이티브 경로에 별도 vault를 생성해야 합니다.

```bash
# WSL 네이티브 경로에 vault 생성
mkdir -p /home/peterchung/WHCommon-vault/.obsidian
cat > /home/peterchung/WHCommon-vault/.obsidian/app.json <<EOF
{
  "livePreview": true,
  "showLineNumber": true
}
EOF
```

### 3. Context7 MCP (라이브러리 문서 조회)

```bash
npm install -g @upstash/context7-mcp
```

### 4. Filesystem MCP (파일 시스템 작업)

```bash
npm install -g @modelcontextprotocol/server-filesystem
```

### 5. PostgreSQL MCP (데이터베이스 쿼리)

```bash
npm install -g @tejasanik/postgres-mcp-server
```

### 6. Playwright MCP (브라우저 자동화)

```bash
npm install -g @playwright/mcp
```

### 7. Code Search MCP (시맨틱 코드 검색)

로컬에서 실행되는 시맨틱 코드 검색 MCP입니다. HuggingFace의 EmbeddingGemma 모델을 사용합니다.

**사전 요구사항**:
- Python 3.10+
- uv (Python 패키지 매니저)

```bash
# uv 설치 (없는 경우)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Claude Context Local 클론
cd ~/.local/share
git clone https://github.com/FarhanAliRaza/claude-context-local.git

# 의존성 설치
cd claude-context-local
uv sync

# HuggingFace 로그인 (EmbeddingGemma 모델 접근용)
source .venv/bin/activate
huggingface-cli login --token $HUGGINGFACE_TOKEN
```

### 8. Sentry MCP (에러 모니터링)

Sentry의 이슈와 이벤트를 조회하고 분석하는 MCP입니다.

```bash
npm install -g @sentry/mcp-server
```

#### Sentry Auth Token 발급 방법

1. **Sentry 로그인**: [sentry.io](https://sentry.io) 접속

2. **Auth Token 페이지 이동**:
   - Settings → Auth Tokens
   - 또는 직접 접속: https://sentry.io/settings/account/api/auth-tokens/

3. **새 토큰 생성**:
   - "Create New Token" 클릭
   - **Name**: `Claude Code MCP`
   - **Scopes** 선택 (필수):
     - `project:read` - 프로젝트 조회
     - `org:read` - 조직 조회
     - `event:read` - 이벤트/이슈 조회
     - `member:read` - 멤버 조회
   - "Create Token" 클릭

4. **토큰 저장**:
   - 생성된 토큰을 복사 (한 번만 표시됨)
   - `WHCommon/.env.doppler` 파일의 `SENTRY_ACCESS_TOKEN`에 저장

### 9. Docker MCP (컨테이너 관리)

Docker 컨테이너, 이미지, 로그를 관리하는 MCP입니다.

```bash
# npx로 자동 다운로드되므로 별도 설치 불필요
```

**참고**: Docker Desktop이 실행 중이어야 합니다.

### 10. Fetch MCP (HTTP 요청)

웹 콘텐츠를 가져와 HTML, JSON, Markdown 등으로 변환하는 MCP입니다.

```bash
# uv로 가상환경 생성 및 설치
cd ~/.local/share
mkdir -p mcp-server-fetch && cd mcp-server-fetch
uv venv
source .venv/bin/activate
uv pip install mcp-server-fetch
```

**참고**: GitHub MCP는 npx로 자동 다운로드되므로 별도 설치 불필요

---

## MCP 서버 추가

`claude mcp add` 명령어를 사용하여 각 MCP 서버를 추가합니다.

### 1. Sequential Thinking

```bash
claude mcp add --scope user sequential-thinking -- \
  /home/peterchung/.nvm/versions/node/v24.12.0/bin/node \
  /home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/@modelcontextprotocol/server-sequential-thinking/dist/index.js
```

### 2. Obsidian

⚠️ **WSL 환경**: `/mnt/c/` 경로 대신 WSL 네이티브 경로 사용 필수

```bash
claude mcp add --scope user obsidian -- \
  /home/peterchung/.nvm/versions/node/v24.12.0/bin/node \
  /home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/obsidian-mcp/build/main.js \
  /home/peterchung/WHCommon-vault
```

### 3. Context7

```bash
claude mcp add --scope user context7 -- \
  /home/peterchung/.nvm/versions/node/v24.12.0/bin/node \
  /home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/@upstash/context7-mcp/dist/index.js
```

### 4. Filesystem

```bash
claude mcp add --scope user filesystem -- \
  /home/peterchung/.nvm/versions/node/v24.12.0/bin/node \
  /home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js \
  /home/peterchung/WBHubManager \
  /home/peterchung/WBSalesHub \
  /home/peterchung/WBFinHub \
  /home/peterchung/WBOnboardingHub \
  /home/peterchung/WHCommon \
  /home/peterchung/HWTestAgent
```

### 5. GitHub (환경변수 포함)

```bash
claude mcp add --scope user github \
  -e GITHUB_TOKEN=your_github_token_here -- \
  npx -y @modelcontextprotocol/server-github
```

### 6. PostgreSQL (환경변수 포함)

```bash
claude mcp add --scope user postgres \
  -e POSTGRES_PASSWORD=postgres -- \
  /home/peterchung/.nvm/versions/node/v24.12.0/bin/node \
  /home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/@tejasanik/postgres-mcp-server/dist/index.js \
  postgresql://postgres:postgres@localhost:5432/wbhubmanager \
  postgresql://postgres:postgres@localhost:5432/wbsaleshub \
  postgresql://postgres:postgres@localhost:5432/wbfinhub \
  postgresql://postgres:postgres@localhost:5432/wbonboardinghub
```

### 7. Playwright

```bash
claude mcp add --scope user playwright -- \
  npx -y @playwright/mcp@latest
```

### 8. Code Search (시맨틱 코드 검색)

```bash
claude mcp add --scope user code-search -- \
  /home/peterchung/.local/bin/uv run \
  --directory /home/peterchung/.local/share/claude-context-local \
  python mcp_server/server.py
```

### 9. Sentry (에러 모니터링) - 선택사항

⚠️ **Sentry 인증 토큰 필요**: 위 "8. Sentry MCP" 설치 섹션의 토큰 발급 방법 참조

```bash
# 토큰을 환경변수로 설정 후 추가
export SENTRY_ACCESS_TOKEN=$(grep "^SENTRY_ACCESS_TOKEN=" /home/peterchung/WHCommon/.env.doppler | cut -d'=' -f2)

claude mcp add --scope user sentry \
  -e SENTRY_ACCESS_TOKEN=$SENTRY_ACCESS_TOKEN -- \
  /home/peterchung/.nvm/versions/node/v24.12.0/bin/node \
  /home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/@sentry/mcp-server/dist/index.js
```

### 10. Docker (컨테이너 관리)

```bash
claude mcp add --scope user docker -- \
  npx -y @expertvagabond/claude-code-docker-mcp
```

### 11. Fetch (HTTP 요청)

```bash
claude mcp add --scope user fetch -- \
  /home/peterchung/.local/share/mcp-server-fetch/.venv/bin/python \
  -m mcp_server_fetch
```

---

## 설정 확인

### MCP 서버 목록 확인

```bash
claude mcp list
```

**예상 출력**:
```
Checking MCP server health...

sequential-thinking: ... - ✓ Connected
obsidian: ... - ✓ Connected
context7: ... - ✓ Connected
filesystem: ... - ✓ Connected
github: ... - ✓ Connected
postgres: ... - ✓ Connected
playwright: ... - ✓ Connected
code-search: ... - ✓ Connected
docker: ... - ✓ Connected
fetch: ... - ✓ Connected
sentry: ... - ✓ Connected
```

### 설정 파일 위치

MCP 설정은 다음 파일에 저장됩니다:
```
/home/peterchung/.claude.json
```

---

## 문제 해결

### 1. MCP 서버 연결 실패

**증상**: `✗ Failed to connect`

**해결 방법**:
1. Node.js 경로 확인:
   ```bash
   which node
   ```
2. 패키지 설치 확인:
   ```bash
   ls -la ~/.nvm/versions/node/v24.12.0/lib/node_modules/
   ```
3. 환경변수 확인:
   ```bash
   echo $GITHUB_TOKEN
   echo $POSTGRES_PASSWORD
   ```

### 2. Obsidian MCP 연결 실패

**원인 1**: Obsidian vault가 초기화되지 않음
**원인 2**: WSL에서 `/mnt/c/` 마운트 경로 사용 (지원 안됨)

**해결** (WSL 네이티브 경로 사용):
```bash
mkdir -p /home/peterchung/WHCommon-vault/.obsidian
cat > /home/peterchung/WHCommon-vault/.obsidian/app.json <<EOF
{
  "livePreview": true,
  "showLineNumber": true
}
EOF
```

**참고**: Obsidian MCP는 보안상 네트워크/원격 파일시스템과 심볼릭 링크를 지원하지 않습니다.

### 3. PostgreSQL 연결 문자열 오류

**확인사항**:
- PostgreSQL이 localhost:5432에서 실행 중인지 확인
- 비밀번호가 올바른지 확인
- 데이터베이스가 존재하는지 확인

```bash
docker ps | grep postgres
psql -h localhost -U postgres -l
```

### 4. "claude: command not found"

**해결**:
```bash
npm install -g @anthropic-ai/claude-code
```

### 5. Node 경로가 다른 경우

`which node` 결과가 다르면 모든 명령어에서 경로를 변경하세요:
```bash
# 예: /usr/local/bin/node
claude mcp add --scope user sequential-thinking -- \
  /usr/local/bin/node \
  /usr/local/lib/node_modules/@modelcontextprotocol/server-sequential-thinking/dist/index.js
```

---

## MCP 서버 제거

특정 MCP 서버를 제거하려면:

```bash
claude mcp remove <server-name>
```

예시:
```bash
claude mcp remove playwright
```

---

## 추가 리소스

- **공식 문서**: [MCP Documentation](https://modelcontextprotocol.io/)
- **Claude Code 문서**: [code.claude.com/docs](https://code.claude.com/docs)
- **설치 완료 안내**: [MCP-설치-완료-안내.md](./MCP-설치-완료-안내.md)

---

## 정리

### 설치된 MCP 서버 (11개)

| MCP 서버 | 용도 | 패키지 | 상태 |
|----------|------|--------|------|
| Sequential Thinking | 사고 구조화 | `@modelcontextprotocol/server-sequential-thinking` | ✅ |
| Obsidian | 문서 저장 | `obsidian-mcp` | ✅ |
| Context7 | 라이브러리 문서 | `@upstash/context7-mcp` | ✅ |
| Filesystem | 파일 작업 | `@modelcontextprotocol/server-filesystem` | ✅ |
| GitHub | Git 관리 | `@modelcontextprotocol/server-github` | ✅ |
| PostgreSQL | DB 쿼리 | `@tejasanik/postgres-mcp-server` | ✅ |
| Playwright | 브라우저 자동화 | `@playwright/mcp` | ✅ |
| Code Search | 시맨틱 코드 검색 | `claude-context-local` (Python) | ✅ |
| Docker | 컨테이너 관리 | `@expertvagabond/claude-code-docker-mcp` | ✅ |
| Fetch | HTTP 요청 | `mcp-server-fetch` (Python) | ✅ |
| Sentry | 에러 모니터링 | `@sentry/mcp-server` | ✅ |

### 토큰 사용량

- **예상 오버헤드**: 23,000-47,000 tokens/세션 (12-24%)
- **남은 컨텍스트**: 153,000-177,000 tokens (200K 중)

---

**문의**: 문제가 발생하면 이 가이드를 참조하거나 설정 파일(`~/.claude.json`)을 확인하세요.

---

## 🗑️ 제거된 MCP 서버 (2026-01-16 토큰 최적화)

**제거 이유**: 세션 토큰 사용량 최적화 (77% 감소 목표)

### 제거된 MCP 서버 목록 (6개)

| MCP 서버 | 토큰 절약 | 사용 빈도 | 대안 | 재설치 명령어 |
|----------|-----------|-----------|------|---------------|
| **Playwright** | ~20,000 | 0% | HWTestAgent 직접 사용 | 위 "7. Playwright" 섹션 참조 |
| **PostgreSQL (로컬)** | ~12,000 | - | `psql` 명령어 | 위 "6. PostgreSQL" 섹션 참조 |
| **Obsidian** | ~12,000 | 0% | WHCommon 마크다운 직접 편집 | 위 "2. Obsidian" 섹션 참조 |
| **Filesystem** | ~18,000 | 1.9% | Read/Write/Edit 기본 도구 | 위 "4. Filesystem" 섹션 참조 |
| **GitHub** | ~8,000 | 3% | `gh` CLI + Bash git 명령 | 위 "5. GitHub" 섹션 참조 |
| **Context7** | ~5,000-8,000 | 0% | WebSearch + 공식 문서 | 위 "3. Context7" 섹션 참조 |

**총 절약**: 75,000-78,000 tokens (77% 감소)

### 유지된 MCP 서버 (6개)

| MCP 서버 | 용도 | 유지 이유 |
|----------|------|----------|
| **Sequential Thinking** | 사고 구조화 | 복잡한 분석 필수, 토큰 오버헤드 최소 (1개 도구) |
| **Code Search** | 시맨틱 코드 검색 | 대규모 코드베이스 검색 필수 |
| **PostgreSQL (오라클)** | 프로덕션 DB 조회 | 오라클 서버 DB 접근 필요 |
| **Docker** | 컨테이너 관리 | Docker 작업 빈번 |
| **Fetch** | HTTP 요청 | 웹 콘텐츠 조회 필수 |
| **Sentry** | 에러 모니터링 | 프로덕션 에러 분석 필수 |

### 재설치 방법

필요 시 위 섹션의 설치 명령어를 참조하여 재설치할 수 있습니다:
- **Playwright**: "7. Playwright" 섹션
- **PostgreSQL**: "6. PostgreSQL" 섹션
- **Obsidian**: "2. Obsidian" 섹션
- **Filesystem**: "4. Filesystem" 섹션
- **GitHub**: "5. GitHub" 섹션
- **Context7**: "3. Context7" 섹션

### 백업 파일 위치

```bash
/home/peterchung/.claude.json.backup-20260116-XXXXXX
```

복원 방법:
```bash
cp /home/peterchung/.claude.json.backup-20260116-XXXXXX /home/peterchung/.claude.json
```

### 예상 효과

- **세션 토큰 사용량**: 97,757 → 22,000-25,000 tokens (77% 감소)
- **세션 수명**: ~100회 → ~400회 상호작용 (4배 증가)
- **컴팩트 후 여유**: 50-70% → 89-90%

**상세 분석**: [radiant-zooming-zephyr.md](../../작업완료/2026-01-16-MCP-token-optimization.md)
