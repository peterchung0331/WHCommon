# grep 대안 도구 사용 가이드

최종 업데이트: 2026-01-14

## 설치된 도구

| 도구 | 버전 | 상태 | 용도 |
|------|------|------|------|
| **ripgrep** | 14.1.0 | ✅ 설치 완료 | 빠른 텍스트 검색 (grep 대비 30배↑) |
| **ast-grep** | 0.40.5 | ✅ 설치 완료 | AST 기반 코드 구조 검색 |
| **Claude Context Local** | - | ⏳ HF 권한 대기 | 시맨틱 자연어 검색 (로컬) |

---

## 1. ripgrep (rg) - 빠른 텍스트 검색

### 기본 사용법

```bash
# 기본 검색
rg "searchTerm"

# 대소문자 무시 (스마트 모드)
rg -S "error"

# 특정 파일 타입만
rg "useState" --type ts
rg "console.log" --type js

# 여러 파일 타입
rg "API_KEY" --type ts --type js

# 숨긴 파일 포함
rg --hidden "config"

# 특정 디렉토리에서만
rg "Auth" server/

# 파일명만 출력
rg "function.*Auth" -l

# 컨텍스트 포함 (앞뒤 3줄)
rg "error" -C 3
```

### 고급 사용법

```bash
# 정규식 패턴
rg "log\\..*Error"

# 단어 단위 매칭
rg -w "test"

# 특정 확장자 제외
rg "TODO" -g '!*.min.js'

# JSON 출력 (스크립트 처리용)
rg "error" --json

# 통계 정보
rg "function" --stats
```

### 실전 예시

```bash
# WBHubManager에서 Auth 관련 함수 찾기
cd /home/peterchung/WBHubManager
rg "function.*Auth" --type ts -l

# 모든 허브에서 환경변수 사용처 찾기
cd /home/peterchung
rg "process\.env\." --type ts WBHubManager/ WBSalesHub/ WBFinHub/

# API 엔드포인트 찾기
rg "app\.(get|post|put|delete)" --type ts

# TODO 주석 찾기
rg "TODO|FIXME" --type ts --type js
```

---

## 2. ast-grep (sg) - 구조적 코드 검색

### 기본 사용법

```bash
# 함수 정의 찾기
sg -p 'function $NAME($$$) { $$$ }' --lang typescript

# async 함수 찾기
sg -p 'async function $NAME($$$) { $$$ }' --lang ts

# React useState 패턴
sg -p 'const [$STATE, $SETTER] = useState($INIT)' --lang tsx

# 클래스 메서드 찾기
sg -p 'class $CLASS { $METHOD($$$) { $$$ } }' --lang ts

# import 문 찾기
sg -p 'import { $NAME } from "$MODULE"' --lang ts
```

### 패턴 변수

| 변수 | 의미 | 예시 |
|------|------|------|
| `$NAME` | 단일 식별자 | `$FUNC`, `$VAR` |
| `$$$` | 0개 이상의 인자/문장 | `function($$$)`, `{ $$$ }` |
| `$$` | 1개 이상의 문장 | `if (cond) { $$ }` |

### 코드 치환 (리팩토링)

```bash
# console.log → logger.info
sg -p 'console.log($MSG)' -r 'logger.info($MSG)' --lang ts

# var → const
sg -p 'var $NAME = $INIT' -r 'const $NAME = $INIT' --lang js

# 파일에 직접 적용 (주의!)
sg -p 'console.log($MSG)' -r 'logger.info($MSG)' --lang ts --update-all
```

### 실전 예시

```bash
# WBHubManager에서 모든 async 함수 찾기
cd /home/peterchung/WBHubManager
sg -p 'async function $NAME($$$) { $$$ }' --lang ts

# Express 라우트 핸들러 찾기
sg -p 'router.$METHOD($PATH, async ($REQ, $RES) => { $$$ })' --lang ts

# useState 초기값이 null인 경우 찾기
sg -p 'const [$STATE, $SETTER] = useState(null)' --lang tsx

# try-catch 없는 async 함수 찾기 (위험!)
sg -p 'async function $NAME($$$) { $$$ }' --lang ts | rg -v "try"
```

---

## 3. Claude Context Local - 시맨틱 검색 (HF 권한 대기 중)

### 현재 상태
- ✅ 설치 완료
- ✅ HuggingFace 로그인 완료 (토큰: `workhub`)
- ⏳ EmbeddingGemma 모델 접근 권한 대기 중

### 권한 요청 방법
1. https://huggingface.co/google/embeddinggemma-300m 접속
2. "Accept license and access repository" 버튼 클릭
3. 승인 즉시 (보통 자동) 사용 가능

### 승인 후 사용 방법
```bash
# MCP 서버 등록
claude mcp add code-search --scope user -- uv run --directory ~/.local/share/claude-context-local python mcp_server/server.py

# Claude Code에서 사용
claude
> index this codebase
> 사용자 인증 처리하는 함수 찾아줘
> JWT 토큰 검증하는 미들웨어는 어디에 있어?
```

---

## 4. 용도별 도구 선택 가이드

| 상황 | 추천 도구 | 명령어 예시 |
|------|----------|-------------|
| 빠른 텍스트 검색 | ripgrep | `rg "searchTerm"` |
| 특정 파일 타입 검색 | ripgrep | `rg "pattern" --type ts` |
| 함수 정의 찾기 | ast-grep | `sg -p 'function $NAME'` |
| React 패턴 찾기 | ast-grep | `sg -p 'const [$S, $SET] = useState'` |
| 대규모 리팩토링 | ast-grep | `sg -p 'old' -r 'new'` |
| 정규식 검색 | ripgrep | `rg "log.*Error"` |
| 자연어 검색 | Context Local | "~하는 함수 찾아줘" |

---

## 5. 성능 비교

| 작업 | grep | ripgrep | 속도 향상 |
|------|------|---------|----------|
| 40,000 파일 검색 | 30초 | 1초 | **30배** |
| TypeScript 파일만 | 15초 | 0.5초 | **30배** |
| 정규식 매칭 | 45초 | 1.5초 | **30배** |

---

## 6. 팁과 트릭

### ripgrep 설정 파일

`~/.config/ripgrep/config` 파일 생성:
```
# 기본 옵션
--smart-case
--hidden
--glob=!.git/
--glob=!node_modules/
--glob=!dist/
--glob=!.next/
```

### ast-grep 별칭 설정

`~/.bashrc` 또는 `~/.zshrc`에 추가:
```bash
alias sgf='sg -p "function $NAME($$$) { $$$ }"'
alias sga='sg -p "async function $NAME($$$) { $$$ }"'
alias sgr='sg -p "router.$METHOD($PATH, $HANDLER)"'
```

### 조합 사용

```bash
# ripgrep으로 파일 찾고 ast-grep으로 정밀 검색
rg "Auth" -l | xargs sg -p 'function $NAME(req, res) { $$$ }'

# ast-grep으로 함수 찾고 ripgrep으로 내용 검색
sg -p 'async function $NAME($$$) { $$$ }' | rg "try.*catch"
```

---

## 7. 문제 해결

### ripgrep이 .gitignore 파일 무시
```bash
# 모든 파일 검색
rg "pattern" --no-ignore

# 숨긴 파일 포함
rg "pattern" --hidden
```

### ast-grep 언어 감지 실패
```bash
# 명시적으로 언어 지정
sg -p 'pattern' --lang typescript

# 지원 언어 확인
sg --list-langs
```

### Claude Context Local 설치 실패
```bash
# 설치 로그 확인
cat ~/.local/share/claude-context-local/install.log

# 수동 설치
cd ~/.local/share/claude-context-local
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 8. 참고 자료

- [ripgrep GitHub](https://github.com/BurntSushi/ripgrep)
- [ast-grep 공식 문서](https://ast-grep.github.io/)
- [Claude Context Local](https://github.com/FarhanAliRaza/claude-context-local)
- [ripgrep vs grep 성능 비교](https://burntsushi.net/ripgrep/)

---

## 9. HuggingFace 토큰 정보

**저장 위치**: `/home/peterchung/.cache/huggingface/token`

**토큰 이름**: `workhub`

**권한**: Fine-grained
- ✅ Read access to public gated repos
- ✅ Read access to personal namespace repos

**재로그인**:
```bash
cd ~/.local/share/claude-context-local
source .venv/bin/activate
huggingface-cli login --token your_huggingface_token_here
```

---

## 10. 다음 단계

### 즉시 사용 가능
- ✅ ripgrep으로 텍스트 검색
- ✅ ast-grep으로 코드 구조 검색

### HF 권한 승인 후
1. https://huggingface.co/google/embeddinggemma-300m 에서 권한 승인
2. 모델 다운로드:
   ```bash
   cd ~/.local/share/claude-context-local
   source .venv/bin/activate
   python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('google/embeddinggemma-300m', cache_folder='/home/peterchung/.claude_code_search/models')"
   ```
3. MCP 서버 등록:
   ```bash
   claude mcp add code-search --scope user -- uv run --directory ~/.local/share/claude-context-local python mcp_server/server.py
   ```
4. Claude Code에서 `index this codebase` 실행

---

마지막 업데이트: 2026-01-14
작성자: Claude Code Assistant
