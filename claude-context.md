# Claude Code 컨텍스트

이 파일은 Claude Code의 핵심 규칙을 정의합니다. 상세 아키텍처는 `아키텍처/` 폴더를 참조하세요.

## 아키텍처 참조 가이드

아키텍처 관련 작업 시 다음 파일을 먼저 읽어주세요:
- **전체 구조**: @/home/peterchung/WHCommon/아키텍처/overview.md
- **허브별 상세**: @/home/peterchung/WHCommon/아키텍처/WBHubManager.md, WBSalesHub.md, WBFinHub.md
- **공용 패키지**: @/home/peterchung/WHCommon/아키텍처/shared-packages.md
- **배포 환경**: @/home/peterchung/WHCommon/아키텍처/deployment.md

---

## 기본 규칙

### 시간 기준
- **모든 작업의 기준 시간은 한국시간(KST, UTC+9)**
- 표시 형식: `YYYY. MM. DD. HH:MM` (24시간 형식)

### 언어 설정
새 채팅이나 대화 압축 후 **한국어**를 기본 언어로 사용

### 모던 CLI 도구
| 기존 | 모던 | Ubuntu |
|------|------|--------|
| grep | ripgrep | `rg` |
| cat | bat | `batcat` |
| find | fd | `fdfind` |
| ls | eza | `eza` |

---

## 🚨 인증 및 SSO 규칙 (CRITICAL)

**모든 허브의 인증은 반드시 쿠키 기반 SSO를 사용합니다.**

### 필수 사항
- ✅ **쿠키 기반 SSO만 사용** - URL 쿼리 파라미터 방식 금지
- ✅ **프론트엔드 AuthProvider는 항상 `/api/auth/me` 호출**
- ✅ **axios `withCredentials: true` 필수**
- ✅ **COOKIE_DOMAIN=.workhub.biz** (프로덕션)

### AuthProvider 패턴
```typescript
// ✅ 올바른 방식
const refreshUser = async () => {
  const response = await authApi.getMe(); // 쿠키 자동 전송
  if (response.success) setUser(response.user);
};

// ❌ 잘못된 방식 - localStorage 체크 금지
```

---

## 프로젝트 정보

### 허브 리스트

| 허브 | 경로 | 로컬 (F/B) | 역할 |
|------|------|-----------|------|
| **WBHubManager** | `/home/peterchung/WBHubManager` | 3090/4090 | 메인 관리 허브 |
| **WBSalesHub** | `/home/peterchung/WBSalesHub` | 3010/4010 | 영업 CRM, Reno AI |
| **WBFinHub** | `/home/peterchung/WBFinHub` | 3020/4020 | 재무 관리 |
| **HWTestAgent** | `/home/peterchung/HWTestAgent` | 3080/4080 | 테스트/에러 패턴 DB |

### URL 체계
- **로컬**: `localhost:3090`, `localhost:3010/saleshub`
- **스테이징**: `staging.workhub.biz:4400`
- **프로덕션**: `workhub.biz`

### 문서 폴더 구조
| 폴더 | 용도 |
|------|------|
| `기획/진행중/`, `기획/완료/` | PRD 문서 |
| `작업/진행중/`, `작업/완료/` | Task 문서 |
| `작업기록/` | 작업 로그 |
| `규칙/` | 실행_기획.md, 실행_작업.md |
| `아키텍처/` | 시스템 아키텍처 문서 |

---

## 🔴 에러 패턴 DB 활용 규칙 (CRITICAL)

**URL**: http://workhub.biz/testagent/api/error-patterns

### 에러 발생 시 자동 검색 (최우선)
모든 에러 발생 시 **가장 먼저** 에러 패턴 DB 검색:
```bash
curl -s "http://workhub.biz/testagent/api/error-patterns?query=에러키워드"
```

### 적용 대상
빌드 에러, 테스트 실패, Docker 에러, API 에러, git 에러 등 **모든 CLI 에러**

### 프로세스
1. 에러 패턴 검색 → 매칭 시 솔루션 적용
2. 매칭 없으면 일반 디버깅 → 해결 후 DB에 등록

### API 엔드포인트
- 검색: `GET /api/error-patterns?query=키워드`
- 상세: `GET /api/error-patterns/:id`
- 등록: `POST /api/error-patterns/record`

---

## 🟢 디버깅 체크리스트

**URL**: http://workhub.biz/testagent/api/debugging-checklists

| 키워드 | 카테고리 |
|--------|----------|
| SSO, OAuth, 인증, 쿠키 | sso |
| Docker, 컨테이너, OOM | docker |
| DB, 마이그레이션 | database |
| Nginx, 프록시 | nginx |

---

## 작업 실행 규칙

### 플랜 실행 시 필수 프로세스
1. ExitPlanMode 직후 → `실행_작업.md` 읽기
2. 병렬 실행 그룹 식별
3. TodoWrite로 작업 추적
4. 단일 메시지로 병렬 Tool 호출

### 병렬 실행 가능
- ✅ 독립적인 파일 수정
- ✅ 다른 리포지토리
- ✅ 프론트엔드 + 백엔드 (API 계약 정의 후)

### 순차 실행 필수
- ❌ DB 마이그레이션 → 스키마 사용
- ❌ 의존성 설치 → 빌드

---

## 🤖 Reno AI 봇 규칙

### 페르소나 관리
**❌ YAML 직접 수정 금지** → **✅ DB 기반 관리 사용**
- API: `/api/ai-admin/personas/*`
- 테이블: `ai_personas`, `ai_persona_change_logs`

### 페르소나 차이점
| 구분 | Internal (직원) | External (고객) |
|------|----------------|-----------------|
| 이모지 | O | **X (절대 금지)** |
| 어투 | 반말/친근 | 격식체만 |

### 슬랙 포맷팅
**❌ 마크다운 금지** → **✅ 플레인 텍스트**
- 제목: `[제목]` 대괄호
- 불렛: `• ` 또는 `- `

### 상세 정보
@/home/peterchung/WHCommon/아키텍처/WBSalesHub.md 참조

---

## 환경변수 관리 규칙

### 파일 구조
```
.env.template   # Git 포함 (키만)
.env.local      # 로컬 개발
.env.staging    # 스테이징
.env.prd        # 프로덕션
```

### Doppler 규칙
**❌ 자동 실행 금지**: package.json, Dockerfile에서 Doppler CLI 사용 금지
**✅ 수동 동기화만 허용**: 사용자 명시적 요청 시

### JWT 키
- Base64 인코딩 필수
- 환경변수: `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`

### 상세 정보
@/home/peterchung/WHCommon/아키텍처/deployment.md 참조

---

## API 규칙

### Trailing Slash
- ✅ **모든 API는 trailing slash 없이**
- ✅ **Next.js `trailingSlash: false`**

### DB Enum
- ✅ **소문자 사용**: `'pending'`, `'active'`, `'admin'`

---

## MCP 서버

| MCP 서버 | 용도 |
|----------|------|
| Sequential Thinking | 복잡한 분석 (필수) |
| Obsidian | 문서 저장 |
| Context7 | 라이브러리 문서 |
| PostgreSQL | DB 쿼리 |
| Playwright | E2E 테스트 |

### Sequential Thinking 필수 상황
- 원인 분석 (OOM, 빌드 실패)
- 아키텍처 설계
- 다단계 문제 해결

---

## 스킬 (Skills)

### 스킬테스터
- **호출**: `/스킬테스터 [명령]`
- **서브 스킬**: 단위(Jest/Vitest), 통합(API), E2E(Playwright)
- **상세**: `~/.claude/skills/스킬테스터/README.md`

---

## 저장소 관리

### WHCommon
- 저장소: `git@github.com:peterchung0331/WHCommon.git`
- 경로: `/home/peterchung/WHCommon`
- **Git 동기화 필수**: 기획, 작업, 작업기록, 규칙

### 폴더 참조 규칙
폴더 이름만 명시하면 WHCommon 의미
- 예: `/기획/진행중/` → `/home/peterchung/WHCommon/기획/진행중/`

---

## 참고 문서

- **배포 가이드**: `문서/가이드/배포-가이드-오라클.md`
- **로컬 환경**: `문서/가이드/로컬-환경-세팅-가이드.md`
- **MCP 설정**: `문서/가이드/MCP-설정-가이드.md`

### 오라클 클라우드
- **SSH**: `ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246`
- **스테이징**: `https://staging.workhub.biz:4400`
- **프로덕션**: `https://workhub.biz`

---

마지막 업데이트: 2026-01-27

**주요 변경 사항**:
- ✅ 아키텍처 문서 분리 (토큰 최적화)
- ✅ 상세 내용은 `아키텍처/` 폴더 참조
