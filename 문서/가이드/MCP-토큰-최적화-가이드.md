# MCP 토큰 최적화 가이드

## 문제 상황
7개 MCP 서버가 모두 로드되면 세션당 50,000-70,000 토큰을 소비합니다.
일반 개발 작업 시 모든 MCP가 필요하지 않으므로, 필요한 MCP만 활성화하여 토큰을 절약할 수 있습니다.

## 권장 MCP 구성

### 기본 구성 (일반 개발 작업)
**활성화 (4개)**: ~20,000-25,000 토큰
- ✅ Sequential Thinking - 복잡한 분석
- ✅ Filesystem - 안전한 파일 작업
- ✅ PostgreSQL - DB 쿼리
- ✅ GitHub - 저장소 관리

**비활성화 (3개)**: ~30,000-40,000 토큰 절감
- ❌ Sentry - 오류 분석 전용 (필요 시에만)
- ❌ Docker - Bash로 대체 가능
- ❌ Playwright - E2E 테스트 시에만

### 특수 작업 구성

**Issue 분석 작업**:
- 기본 구성 + Sentry MCP 활성화

**E2E 테스트 작업**:
- 기본 구성 + Playwright MCP 활성화

## VSCode에서 MCP 비활성화 방법

### 1. VSCode 설정 열기
- `Ctrl+Shift+P` (Windows/Linux) 또는 `Cmd+Shift+P` (Mac)
- "MCP: Open User Configuration" 입력

### 2. MCP 설정 파일 수정
`settings.json` 파일에서 MCP 서버 목록을 수정합니다.

**비활성화 방법**: 해당 MCP 서버 항목을 주석 처리하거나 삭제

```json
{
  "mcp": {
    "servers": {
      "sequential-thinking": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
      },
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/peterchung"]
      },
      "postgres": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."]
      },
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
        }
      }
      // Sentry, Docker, Playwright는 주석 처리 또는 삭제
      // "sentry": { ... },
      // "docker": { ... },
      // "playwright": { ... }
    }
  }
}
```

### 3. VSCode 재시작
- 설정 변경 후 VSCode를 재시작하여 MCP 서버 목록을 갱신합니다.

### 4. 검증
새 Claude Code 세션 시작 후:
```
/mcp
```
명령어로 활성화된 MCP 서버 목록 확인

## 예상 효과

### 토큰 사용량 비교

| 구성 | MCP 개수 | 토큰 오버헤드 | 남은 여유 (200K 기준) |
|------|----------|--------------|----------------------|
| **전체 (현재)** | 7개 | 50,000-70,000 | 130,000-150,000 |
| **기본 (권장)** | 4개 | 20,000-25,000 | 175,000-180,000 |
| **절감 효과** | -3개 | **-30,000~45,000** | **+30,000~45,000** |

### 세션 컴팩트 후 비교

| 항목 | 전체 MCP | 기본 MCP | 절감 |
|------|----------|----------|------|
| MCP 오버헤드 | 60,000 | 22,000 | -38,000 |
| claude-context.md | 12,000 | 1,500 | -10,500 |
| 시스템 프롬프트 | 18,000 | 18,000 | 0 |
| **총 기본 토큰** | **90,000 (45%)** | **41,500 (21%)** | **-48,500** |

## 작업별 권장 MCP 구성

### 일반 개발 (80% 작업)
```
✅ Sequential Thinking
✅ Filesystem
✅ PostgreSQL
✅ GitHub
```
**토큰**: ~22,000 (11%)

### Issue 분석
```
✅ 기본 구성 (4개)
✅ Sentry
```
**토큰**: ~40,000 (20%)

### E2E 테스트
```
✅ 기본 구성 (4개)
✅ Playwright
```
**토큰**: ~60,000 (30%)

### Docker 작업
```
✅ 기본 구성 (4개)
✅ Docker (선택)
```
**토큰**: ~25,000 (12.5%)
**참고**: Docker 명령은 Bash로도 충분히 가능

## 권장 워크플로우

1. **평상시**: 기본 구성 (4개 MCP)으로 작업
2. **Issue 분석 필요 시**: Sentry MCP 임시 활성화
3. **E2E 테스트 시**: Playwright MCP 임시 활성화
4. **작업 완료 후**: 다시 기본 구성으로 복원

## 빠른 전환 팁

### 설정 프로필 만들기
VSCode 설정 프로필을 여러 개 만들어 빠르게 전환:
- `기본-개발` 프로필: 4개 MCP
- `Issue-분석` 프로필: 5개 MCP (+ Sentry)
- `E2E-테스트` 프로필: 5개 MCP (+ Playwright)

### 설정 프로필 전환
1. `Ctrl+Shift+P` → "Profiles: Switch Profile"
2. 원하는 프로필 선택
3. VSCode 재시작

---

마지막 업데이트: 2026-01-16
