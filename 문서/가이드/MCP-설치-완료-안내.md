# MCP 서버 설치 완료 안내

## ✅ 완료된 작업

### 1. 설치된 MCP 서버 패키지

| MCP 서버 | 패키지 이름 | 설치 경로 | 상태 |
|---------|-----------|---------|------|
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | `/home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/` | ✅ 설치 완료 |
| **GitHub** | `@modelcontextprotocol/server-github` | npx로 자동 다운로드 | ✅ 설정 완료 |
| **PostgreSQL** | `@tejasanik/postgres-mcp-server` | `/home/peterchung/.nvm/versions/node/v24.12.0/lib/node_modules/` | ✅ 설치 완료 |

### 2. 환경변수 설정

다음 환경변수가 `~/.bashrc`에 추가되었습니다:

```bash
export GITHUB_TOKEN="your_github_token_here"
export POSTGRES_PASSWORD="postgres"
```

**환경변수 적용**:
```bash
source ~/.bashrc
```

**✅ GitHub Token 저장 위치**:
- `/home/peterchung/WHCommon/env.doppler` 파일에 안전하게 저장됨
- 생성일: 2026-01-14
- 권한: repo, workflow, write:packages
- 용도: Claude Code MCP GitHub integration

### 3. MCP 설정 템플릿 생성

**파일 위치**: `/home/peterchung/WHCommon/문서/가이드/mcp-settings-template.json`

이 파일에는 다음이 포함되어 있습니다:
- ✅ Filesystem MCP 설정 (6개 프로젝트 디렉토리 허용)
- ✅ GitHub MCP 설정 (Personal Access Token 포함)
- ✅ PostgreSQL MCP 설정 (4개 로컬 DB 연결)

---

## 📋 다음 단계 (사용자가 직접 수행)

### Step 1: VSCode에서 MCP 설정 열기

1. VSCode 실행
2. 명령 팔레트 열기:
   - Windows/Linux: `Ctrl + Shift + P`
   - Mac: `Cmd + Shift + P`
3. "MCP: Open User Configuration" 입력 및 선택

### Step 2: MCP 설정 복사

다음 중 하나의 방법 선택:

#### 방법 A: 템플릿 파일 내용 복사 (권장)

```bash
cat /home/peterchung/WHCommon/문서/가이드/mcp-settings-template.json
```

출력된 JSON을 복사하여 VSCode MCP 설정 파일에 붙여넣기

#### 방법 B: 파일 직접 열기

VSCode에서:
```
File → Open File → /home/peterchung/WHCommon/문서/가이드/mcp-settings-template.json
```

내용을 복사하여 MCP 설정에 붙여넣기

### Step 3: VSCode 재시작

MCP 설정 적용을 위해 VSCode 재시작

### Step 4: MCP 서버 확인

Claude Code 세션 시작 후:
```
/mcp
```

다음 서버들이 표시되어야 합니다:
- ✅ filesystem
- ✅ github
- ✅ postgres

### Step 5: 컨텍스트 사용량 확인

```
/context
```

예상 토큰 사용량: 12,000-26,000 tokens/세션

---

## 🧪 테스트 방법

### Filesystem MCP 테스트

Claude Code에서 다음 요청:
```
"Filesystem MCP를 사용하여 /home/peterchung/WHCommon/test-mcp.txt 파일을 생성하고 'MCP Test' 내용을 작성해줘"
```

### GitHub MCP 테스트

```
"GitHub MCP로 peterchung0331/WHCommon 저장소의 최근 커밋 5개를 조회해줘"
```

### PostgreSQL MCP 테스트

먼저 로컬 PostgreSQL이 실행 중인지 확인:
```bash
docker ps | grep postgres
```

Claude Code에서:
```
"PostgreSQL MCP로 local-hubmanager 연결의 테이블 목록을 보여줘"
```

---

## ⚠️ 문제 해결

### 1. MCP 서버가 시작되지 않음

**증상**: `/mcp` 명령어에서 서버가 표시되지 않음

**해결**:
1. VSCode 개발자 도구 열기 (F12)
2. Console 탭에서 에러 로그 확인
3. MCP 설정 JSON 문법 확인 (쉼표, 중괄호 등)

### 2. Filesystem MCP 권한 에러

**증상**: "Directory not allowed" 에러

**해결**:
- `allowedDirectories` 배열에 접근하려는 디렉토리가 포함되어 있는지 확인
- 절대 경로를 사용하고 있는지 확인

### 3. GitHub MCP 인증 실패

**증상**: "Authentication failed" 에러

**해결**:
```bash
# 토큰 확인
echo $GITHUB_TOKEN

# 토큰이 비어있으면 다시 설정
export GITHUB_TOKEN="your_github_token_here"
```

### 4. PostgreSQL MCP 연결 실패

**증상**: "Connection refused" 에러

**해결**:
```bash
# PostgreSQL 컨테이너 상태 확인
docker ps | grep postgres

# PostgreSQL이 없으면 시작
docker-compose -f docker-compose.dev.yml up -d postgres
```

---

## 📊 예상 성능 영향

### 토큰 사용량

| 항목 | 값 |
|------|-----|
| 세션 시작 오버헤드 | 12,000-26,000 tokens |
| 남은 컨텍스트 | 174,000-187,600 tokens (200K 중) |
| 영향도 | **6-13%** (허용 가능) |

### 권장 사항

1. **모니터링**: 주기적으로 `/context` 명령어로 확인
2. **쿼리 최적화**: PostgreSQL 쿼리 시 `LIMIT` 절 사용
3. **파일 읽기**: 큰 파일은 부분 읽기 (offset + limit)
4. **GitHub API**: 최근 10개 항목만 조회

---

## 🔗 참고 문서

- **상세 설정 가이드**: `/home/peterchung/WHCommon/문서/가이드/MCP-설정-가이드.md`
- **컨텍스트 파일**: `/home/peterchung/WHCommon/claude-context.md`
- **계획 문서**: `/home/peterchung/.claude/plans/optimized-baking-sutherland.md`

---

## 📞 지원

문제가 발생하면:
1. VSCode 개발자 도구 (F12) → Console 탭 확인
2. MCP 설정 JSON 문법 검증
3. 환경변수 설정 확인 (`echo $GITHUB_TOKEN`)

---

마지막 업데이트: 2026-01-14
