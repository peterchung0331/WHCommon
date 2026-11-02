# Claude Code 핵심 규칙

아키텍처: `아키텍처/` 폴더 | 상세 규칙: `규칙/` 폴더 | 각 레포 CLAUDE.md 참조

## 기본 설정
- **시간**: KST (UTC+9), 형식 `YYYY. MM. DD. HH:MM`
- **언어**: 한국어 기본 (새 채팅/대화 압축 후)
- **CLI**: rg (grep), batcat (cat), fdfind (find), eza (ls)

> **프론트엔드 작업 시** 디자인 시스템 v1.0 참고: 아키텍처/디자인-시스템/디자인-시스템-v1.0.md
> **KG(Knowledge Graph) 작업 시** 3층 구조 참고: 아키텍처/KG-메모리-구조.md

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
1. 에러 패턴 DB 먼저 검색: `curl -s "http://workhub.biz/probe/api/error-patterns?query=키워드"`
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
| 다나와 (danawa) | 내부 서비스 검색 (10.10.10.235:8989) — SalesHub 컨텍스트 작성 시 참조 |

---

## 상세 규칙 참조 (on-demand)
- **Reno 봇**: 규칙/reno-bot-rules.md
- **환경변수/Doppler**: 규칙/env-management.md
- **디버깅 체크리스트**: 규칙/debugging-guide.md
- **기획 실행**: 규칙/실행_기획.md
- **작업 실행**: 규칙/실행_작업.md
- **PDF 출력**: 매뉴얼/PDF-Export-가이드.md (Pandoc + WeasyPrint, 설정: 개발/pandoc/)

## URL 체계
- **로컬**: localhost:3090 (HubManager), localhost:3010 (SalesHub)
- **스테이징**: staging.workhub.biz:4400
- **프로덕션**: workhub.biz
- **SSH**: `ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246`

## WHCommon 경로 규칙
- 저장소: `git@github.com:peterchung0331/WHCommon.git`
- 폴더명만 명시 시 WHCommon 의미: `기획/진행중/` → `/mnt/c/GitHub/WHCommon/기획/진행중/`
- Git 동기화 필수: 기획, 작업, 규칙
- 회사 정보: 회사-정보/웨이브릿지-회사-정보.md

## WHCommon 폴더 구조

```
WHCommon/
├── 기획/                    # 모든 기획 문서
│   ├── 진행중/              # 진행 중인 PRD
│   ├── 보류/                # 보류된 PRD
│   ├── 완료/                # 완료된 PRD
│   └── 별도/                # 독립 기획 (주제별 하위폴더)
├── 작업/                    # 작업 태스크 + 작업기록 통합
│   ├── 진행중/              # tasks-* + 기록-* 파일
│   ├── 보류/
│   └── 완료/
├── 매뉴얼/                  # 사람용 매뉴얼 (환경 세팅, 배포, MCP 등)
├── 문서/                    # 참고자료, 테스트 문서
│   ├── 참고자료/            # 기술 참고, 데이터 샘플
│   ├── 테스트/              # 테스트 가이드
│   └── 리포트/              # overnight 등 정기 리포트
├── 아키텍처/                # 시스템 아키텍처 문서
│   └── 디자인-시스템/
├── 규칙/                    # Claude 실행 규칙, 디버깅 가이드
├── 에이전트/                # AI 에이전트 프로필, 이미지
├── 회사-정보/               # 회사 정보, 소개자료, 로고
├── 마스터플랜/              # 워크허브 마스터플랜
├── 인프라/                  # 개발 인프라
│   ├── docker/              # Docker 테스트 문서
│   ├── scripts/             # 빌드, 배포, 백업 스크립트
│   ├── env/                 # 환경변수 파일
│   ├── ssh-keys/            # SSH 키
│   └── mobile/              # Firebase 등 모바일 설정
├── 개발/                    # 개발 공유 자산
│   ├── packages/            # wh-probe 등 공유 패키지
│   ├── components/          # 공유 컴포넌트
│   ├── templates/           # 코드/문서 템플릿
│   ├── skills/              # Claude Code 스킬 정의
│   └── pandoc/              # PDF 변환 설정
├── 테스트/                  # 테스트 결과/아카이브
│   ├── 결과/
│   └── 아카이브/
└── assets/                  # 이미지 등 공유 에셋
```

**파일 구분 규칙**: `작업/` 폴더에서 `tasks-*`는 태스크 목록, `기록-*`는 작업 실행 로그

---

마지막 업데이트: 2026-03-17

**주요 변경 사항**:
- WHCommon 폴더 구조 대규모 개편 (25개 → 12개 루트 폴더)
- `기능 PRD/`, `별도 기획/` → `기획/` 통합
- `작업기록/` → `작업/` 통합 (접두사 `기록-`로 구분)
- `OnProgress/`, `진행중/`, `tasks/` → `작업/` 통합
- 인프라(Docker, scripts, SSHkey, env, mobile) → `인프라/` 통합
- 개발(packages, components, templates, skills, pandoc) → `개발/` 통합
- 리포트, 참고자료, 테스트결과, test-archive → `문서/`, `테스트/` 통합
