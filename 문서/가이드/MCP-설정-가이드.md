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
```bash
mkdir -p /home/peterchung/WHCommon/.obsidian
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

```bash
claude mcp add --scope user obsidian -- \
  /home/peterchung/.nvm/versions/node/v24.12.0/bin/node \
  /home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/obsidian-mcp/build/main.js \
  /home/peterchung/WHCommon
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

**원인**: Obsidian vault가 초기화되지 않음

**해결**:
```bash
mkdir -p /home/peterchung/WHCommon/.obsidian
cat > /home/peterchung/WHCommon/.obsidian/app.json <<EOF
{
  "livePreview": true,
  "showLineNumber": true
}
EOF
```

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

### 설치된 MCP 서버 (7개)

| MCP 서버 | 용도 | 패키지 |
|----------|------|--------|
| Sequential Thinking | 사고 구조화 | `@modelcontextprotocol/server-sequential-thinking` |
| Obsidian | 문서 저장 | `obsidian-mcp` |
| Context7 | 라이브러리 문서 | `@upstash/context7-mcp` |
| Filesystem | 파일 작업 | `@modelcontextprotocol/server-filesystem` |
| GitHub | Git 관리 | `@modelcontextprotocol/server-github` |
| PostgreSQL | DB 쿼리 | `@tejasanik/postgres-mcp-server` |
| Playwright | 브라우저 자동화 | `@playwright/mcp` |

### 토큰 사용량

- **예상 오버헤드**: 14,000-30,000 tokens/세션 (7-15%)
- **남은 컨텍스트**: 170,000-186,000 tokens (200K 중)

---

**문의**: 문제가 발생하면 이 가이드를 참조하거나 설정 파일(`~/.claude.json`)을 확인하세요.
