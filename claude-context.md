# Claude Code 핵심 규칙

아키텍처: `아키텍처/` 폴더 | 상세 규칙: `규칙/` 폴더 | 각 레포 CLAUDE.md 참조

## 기본 설정
- **시간**: KST (UTC+9), 형식 `YYYY. MM. DD. HH:MM`
- **언어**: 한국어 기본 (새 채팅/대화 압축 후)
- **CLI**: rg (grep), batcat (cat), fdfind (find), eza (ls)

> **프론트엔드 작업 시** 디자인 시스템 v1.0 참고: 아키텍처/디자인-시스템/디자인-시스템-v1.0.md

---

## 인증 SSO 규칙 (CRITICAL)
- 쿠키 기반 SSO만 사용. URL 쿼리 파라미터 금지.
- `axios withCredentials: true` 필수
- COOKIE_DOMAIN=.workhub.biz
- AuthProvider는 `/api/auth/me` 호출 (localStorage 체크 금지)

## API baseURL 규칙 (CRITICAL)

| 환경 | HubManager | SalesHub | FinHub |
|------|-----------|----------|--------|
| 로컬 | `/api` | `/api` | `/api` |
| 프로덕션 | `/api` | `/saleshub/api` | `/finhub/api` |

- API 경로에 `/api` 접두사 절대 불포함 (예: `/auth/me`, `/customers`)
- interceptor로 경로 조작 금지
- 위반 시 `/saleshub/api/api/auth/me` 같은 중복 발생

## 테스트 계정

| 이메일 | 비밀번호 | 역할 |
|--------|---------|------|
| peter.chung@wavebridge.com | wave1234!! | MASTER |

## API 규칙
- Trailing slash 없음 (`trailingSlash: false`)
- DB enum 소문자 ('pending', 'active', 'admin')

---

## 에러 발생 시
1. 에러 패턴 DB 먼저 검색: `curl -s "http://workhub.biz/testagent/api/error-patterns?query=키워드"`
2. 매칭 없으면 디버깅 → 해결 후 DB 등록

## 작업 실행 규칙
- ExitPlanMode 직후 → `규칙/실행_작업.md` 읽기
- **병렬 가능**: 독립 파일 수정, 다른 리포, FE+BE (API 계약 후)
- **순차 필수**: DB 마이그레이션→스키마 사용, 의존성→빌드

## MCP 서버

| 서버 | 용도 |
|------|------|
| Sequential Thinking | 복잡 분석 (OOM, 아키텍처, 다단계) |
| PostgreSQL | DB 쿼리 |
| Playwright | E2E 테스트 |

---

## 상세 규칙 참조 (on-demand)
- **Reno 봇**: 규칙/reno-bot-rules.md
- **환경변수/Doppler**: 규칙/env-management.md
- **디버깅 체크리스트**: 규칙/debugging-guide.md
- **기획 실행**: 규칙/실행_기획.md
- **작업 실행**: 규칙/실행_작업.md

## URL 체계
- **로컬**: localhost:3090 (HubManager), localhost:3010 (SalesHub)
- **스테이징**: staging.workhub.biz:4400
- **프로덕션**: workhub.biz
- **SSH**: `ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246`

## WHCommon 경로 규칙
- 저장소: `git@github.com:peterchung0331/WHCommon.git`
- 폴더명만 명시 시 WHCommon 의미: `기획/진행중/` → `/mnt/c/GitHub/WHCommon/기획/진행중/`
- Git 동기화 필수: 기획, 작업, 작업기록, 규칙
- 회사 정보: 회사-정보/웨이브릿지-회사-정보.md

---

마지막 업데이트: 2026-02-26

**주요 변경 사항**:
- 각 레포 CLAUDE.md 생성 (Context Mesh 패턴)
- .claudeignore 추가 (검색 속도 개선)
- Reno봇/환경변수/디버깅 규칙을 `규칙/` 폴더로 분리
- 코드 예시 제거, 핵심 규칙만 유지 (425줄 → ~85줄)
- Orbit AAM 섹션 제거 (별도 프로젝트 — orbit-alpha 레포의 오르빗-컨텍스트.md 참조)
