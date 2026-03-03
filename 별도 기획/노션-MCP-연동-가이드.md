# Notion MCP 연동 가이드

Claude Code에서 Notion 워크스페이스를 읽고 쓸 수 있도록 MCP(Model Context Protocol) 서버를 연동하는 가이드입니다.

**작성일**: 2026-02-26
**대상**: 사업본부 팀원 (Mac / Windows / WSL, VS Code 사용)

---

## 연결 대상 Notion 페이지

| 페이지 | URL |
|--------|-----|
| Memo | https://www.notion.so/wavebridge/Memo-313d045b26f280b3be4cfc55a1871f22 |
| 데이터베이스 | https://www.notion.so/wavebridge/313d045b26f2809f8f70f16fa8da63fd?v=313d045b26f2806bafc3000c89e89bde |

---

## Part 1: 사전 준비 (직접 수행)

이 섹션은 Notion 웹에서 직접 수행해야 합니다.

### Step 1. Notion Integration 생성

1. https://www.notion.so/my-integrations 접속
2. **"+ 새 통합"** 클릭
3. 설정 입력:
   - **이름**: `Claude Code MCP` (자유롭게 설정 가능)
   - **연결된 워크스페이스**: `wavebridge` 선택
   - **유형**: 내부 통합
4. **제출** 클릭
5. **구성** 탭에서 **내부 통합 시크릿** 복사 (`ntn_` 으로 시작하는 토큰)

> 이 토큰은 개인별로 생성하며, 타인과 공유하지 마세요.

### Step 2. 대상 페이지에 Integration 연결

연결할 각 Notion 페이지에서 아래 절차를 수행합니다.

#### 방법: 페이지 메뉴에서 연결 추가

1. 연결할 Notion 페이지를 엽니다
2. 우측 상단 **`···`** 메뉴를 클릭합니다
3. 메뉴를 **맨 아래까지 스크롤**합니다
4. 하단에 **"연결"** 항목이 보입니다 (숫자가 표시될 수 있음) → 클릭합니다

> **"연결" 항목은 메뉴 최하단에 있습니다.** "알림 받기" 아래, "Windows 앱에서 열기" 바로 위에 위치합니다. 스크롤하지 않으면 보이지 않을 수 있습니다.

5. "연결" 클릭 시 **활성화된 연결 목록**이 나타납니다
6. **"+ 연결 추가하기"** 버튼을 클릭합니다
7. Step 1에서 만든 Integration 이름(예: `WB_peter`)을 검색하여 선택합니다

> 상위 페이지에 연결하면 하위 페이지에도 자동으로 권한이 부여됩니다. Business Dept. 팀스페이스의 상위 페이지에 연결하면 하위의 Memo, 데이터베이스 등에 모두 접근 가능합니다.

> **주의:** "연결 추가"는 팀스페이스 설정이 아닌, **개별 페이지의 ··· 메뉴 → 연결**에서 수행합니다. 팀스페이스 설정(멤버/보안)에는 연결 메뉴가 없습니다.

**연결할 페이지:**
- Memo 페이지
- 데이터베이스 페이지

---

## Part 2: Claude Code에서 MCP 설정 (자동 실행)

아래 내용을 Claude Code에 복사-붙여넣기하면 자동으로 설정됩니다.

> **사용법**: 아래 코드 블록 안의 내용을 복사하여 Claude Code 채팅에 붙여넣기 하세요.
> `ntn_여기에_본인_토큰_입력`을 Part 1에서 복사한 토큰으로 교체하세요.

---

### Mac / Linux (WSL 포함)

```
내 환경에 Notion MCP 서버를 설정해줘.

아래 명령어를 터미널에서 실행해:

claude mcp add --scope user notion -e NOTION_TOKEN=ntn_여기에_본인_토큰_입력 -- npx -y @notionhq/notion-mcp-server

실행 후 claude mcp list 로 notion 서버가 추가되었는지 확인해줘.
```

### Windows (WSL 미사용, CMD/PowerShell)

```
내 환경에 Notion MCP 서버를 설정해줘.

아래 명령어를 터미널에서 실행해:

claude mcp add --scope user --env NOTION_TOKEN=ntn_여기에_본인_토큰_입력 notion -- cmd /c npx -y @notionhq/notion-mcp-server

실행 후 claude mcp list 로 notion 서버가 추가되었는지 확인해줘.
```

### 설정 확인

설정이 완료되면 Claude Code 내에서:
1. `/mcp` 명령어 입력 → notion 서버가 `connected` 상태인지 확인
2. "Notion에서 Memo 페이지를 검색해줘" 라고 요청하여 정상 동작 확인

---

## Part 3: 사용 예시

설정 완료 후 Claude Code에서 아래와 같이 활용할 수 있습니다.

### 페이지 검색/조회

```
Notion에서 "주간 회의" 관련 메모를 검색해줘
```

```
이 Notion 페이지 내용을 읽어줘: https://www.notion.so/wavebridge/Memo-313d045b26f280b3be4cfc55a1871f22
```

### 데이터베이스 조회

```
Notion 데이터베이스에서 최근 항목 10개를 조회해줘:
https://www.notion.so/wavebridge/313d045b26f2809f8f70f16fa8da63fd?v=313d045b26f2806bafc3000c89e89bde
```

### 새 메모 작성

```
Notion Memo 페이지 하위에 새 페이지를 만들어줘.
제목: "2026-02-26 회의록"
내용: (회의 내용)
```

### 페이지 수정

```
이 Notion 페이지에 아래 내용을 추가해줘:
(페이지 URL)
추가할 내용: ...
```

---

## Part 4: 문제 해결

### "Connection closed" 오류

**원인**: Windows 네이티브 환경에서 npx 실행 문제

**해결**: `cmd /c`로 래핑된 명령어 사용 (Part 2의 Windows 섹션 참고)

```bash
claude mcp remove notion
claude mcp add --scope user notion -e NOTION_TOKEN=ntn_토큰 -- cmd /c npx -y @notionhq/notion-mcp-server
```

### "Could not find page" 또는 권한 오류

**원인**: 대상 페이지에 Integration이 연결되지 않음

**해결**: Part 1의 Step 2를 다시 수행하여 해당 페이지에 Integration 연결 확인

### npx 패키지 다운로드 실패

**원인**: 네트워크 또는 npm 캐시 문제

**해결**:
```bash
npx -y @notionhq/notion-mcp-server --version   # 수동 다운로드 확인
npm cache clean --force                          # 캐시 초기화 후 재시도
```

### MCP 서버 재설정

기존 설정을 삭제하고 다시 추가:
```bash
claude mcp remove notion
# Part 2의 명령어를 다시 실행
```

### 토큰 변경

Integration 토큰을 변경해야 할 경우:
```bash
claude mcp remove notion
claude mcp add --scope user notion -e NOTION_TOKEN=ntn_새토큰 -- npx -y @notionhq/notion-mcp-server
```

---

## 참고

- **Notion MCP 패키지**: [@notionhq/notion-mcp-server](https://www.npmjs.com/package/@notionhq/notion-mcp-server)
- **Notion Integration 관리**: https://www.notion.so/my-integrations
- **MCP 설정은 user 범위**로 저장되어 모든 프로젝트에서 Notion 접근 가능
- 설정 파일 위치: `~/.claude.json`
