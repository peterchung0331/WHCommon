# Claude Code 컨텍스트

이 파일은 Claude Code의 핵심 규칙을 정의합니다. 상세 아키텍처는 `아키텍처/` 폴더를 참조하세요.

## 아키텍처 참조 가이드

아키텍처 관련 작업 시 다음 파일을 먼저 읽어주세요:
- **전체 구조**: @/home/peterchung/WHCommon/아키텍처/overview.md
- **허브별 상세**:
  - @/home/peterchung/WHCommon/아키텍처/WBHubManager.md
  - @/home/peterchung/WHCommon/아키텍처/WBSalesHub.md
  - @/home/peterchung/WHCommon/아키텍처/WBFinHub.md
- **공용 패키지**: @/home/peterchung/WHCommon/아키텍처/shared-packages.md
- **배포 환경**: @/home/peterchung/WHCommon/아키텍처/deployment.md
- **디자인 시스템**: @/home/peterchung/WHCommon/아키텍처/디자인-시스템/디자인-시스템-v1.0.md

> **프론트엔드 작업 시 디자인 시스템 v1.0을 항상 참고하세요.** 색상, 배지, 테이블, 그림자, 간격 등 모든 UI 규칙이 정의되어 있습니다.

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

### 통합 테스트 계정

| 항목 | 값 |
|------|-----|
| **이메일** | `peter.chung@wavebridge.com` |
| **비밀번호** | `wave1234!!` |
| **역할** | MASTER (어드민) |

> 모든 허브(HubManager, SalesHub, FinHub) 및 E2E 테스트에 동일하게 사용

---

## 🔴 API baseURL 규칙 (CRITICAL)

**모든 허브는 동일한 API baseURL 패턴을 사용합니다.**

### ⚠️ 반복되는 문제
- `/saleshub/api/api/auth/me` - **api가 두 번 반복됨!**
- 원인: baseURL에 `/api`가 포함되어 있는데, API 호출 시 `/api/...` 경로를 또 사용

### ✅ 올바른 패턴 (모든 허브 동일)

#### 1. baseURL 설정 (lib/api-client.ts)
```typescript
// 환경별 baseURL 정적 설정 - 절대 런타임 조작 금지!
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// HubManager
const API_BASE_URL = IS_PRODUCTION ? '/api' : '/api';

// SalesHub
const API_BASE_URL = IS_PRODUCTION ? '/saleshub/api' : '/api';

// FinHub
const API_BASE_URL = IS_PRODUCTION ? '/finhub/api' : '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ❌ interceptor로 경로 조작 절대 금지!
// ❌ window.location.pathname 체크 금지!
```

#### 2. API 호출 시 경로 (lib/api.ts)
```typescript
// ✅ 올바른 방식 - /api 접두사 없이
export const authApi = {
  getMe: () => apiClient.get('/auth/me'),           // ✅ /auth/me
  login: (data) => apiClient.post('/auth/login', data),  // ✅ /auth/login
  logout: () => apiClient.post('/auth/logout'),     // ✅ /auth/logout
};

export const customersApi = {
  getAll: () => api.get('/customers'),              // ✅ /customers
  getById: (id) => api.get(`/customers/${id}`),     // ✅ /customers/:id
};

// ❌ 잘못된 방식 - /api 접두사 중복
authApi.getMe: () => apiClient.get('/api/auth/me')  // ❌ /saleshub/api/api/auth/me
```

#### 3. 최종 API URL 구성

| 환경 | baseURL | API 경로 | 최종 URL |
|------|---------|----------|----------|
| 로컬 개발 | `/api` | `/auth/me` | `/api/auth/me` |
| 프로덕션 (SalesHub) | `/saleshub/api` | `/auth/me` | `/saleshub/api/auth/me` |
| 프로덕션 (FinHub) | `/finhub/api` | `/auth/me` | `/finhub/api/auth/me` |

### 🚫 절대 금지 사항

```typescript
// ❌ interceptor로 경로 동적 조작
apiClient.interceptors.request.use((config) => {
  if (window.location.pathname.startsWith('/saleshub')) {
    config.url = `/saleshub${config.url}`;  // 절대 금지!
  }
});

// ❌ baseURL을 빈 문자열로 설정하고 전체 경로 사용
const apiClient = axios.create({ baseURL: '' });
apiClient.get('/saleshub/api/auth/me');  // 절대 금지!

// ❌ API 경로에 /api 접두사 포함
authApi.getMe: () => apiClient.get('/api/auth/me')  // 중복 발생!
```

### ✅ 검증 방법

```bash
# 브라우저 개발자 도구 Network 탭 확인
# ✅ 올바른 URL
GET /saleshub/api/auth/me          # 프로덕션
GET /api/auth/me                   # 로컬

# ❌ 잘못된 URL
GET /saleshub/api/api/auth/me      # api 중복!
GET /api/api/auth/me               # api 중복!
```

### 📝 체크리스트 (새 허브 생성 시)

- [ ] `lib/api-client.ts`: baseURL에 `/api` 포함 (프로덕션: `/허브명/api`)
- [ ] `lib/api.ts`: 모든 API 경로에서 `/api` 접두사 제거
- [ ] interceptor로 경로 조작하지 않음
- [ ] 로컬/스테이징/프로덕션에서 Network 탭 확인
- [ ] `/api/api/...` 중복 없음 확인

---

## 프로젝트 정보

### 회사 정보
- **웨이브릿지 프로필**: @/home/peterchung/WHCommon/회사-정보/웨이브릿지-회사-정보.md

> 웨이브릿지 관련 기획 시 이 문서를 참고하세요.

### 허브 리스트

| 허브 | 경로 | 로컬 (F/B) | 역할 |
|------|------|-----------|------|
| **WBHubManager** | `/home/peterchung/WBHubManager` | 3090/4090 | 메인 관리 허브 |
| **WBSalesHub** | `/home/peterchung/WBSalesHub` | 3010/4010 | 영업 CRM, Reno AI |
| **WBFinHub** | `/home/peterchung/WBFinHub` | 3020/4020 | 재무 관리 |
| **HWTestAgent** | `/home/peterchung/HWTestAgent` | 3080/4080 | 테스트/에러 패턴 DB |

### Orbit AAM (개인 프로젝트) — OrbitAI

**AI 에이전트 기반 퀀트 자산배분 포트폴리오 시스템 (오르빗AI 자산운용)** (WorkHub와 별도)

- **상세 컨텍스트**: @/home/peterchung/orbit-alpha/docs/오르빗-컨텍스트.md
- **정식명칭**: Orbit AI Asset Management (Orbit AAM)
- **프로젝트 내부 지칭**: OrbitAI
- **경로**: `/home/peterchung/orbit-alpha`
- **리포**: `git@github.com:peterchung0331/OrbitAlpha.git`
- **기술스택**: Python 3.11+ / FastAPI / Dash(Plotly) / PostgreSQL / Redis+Celery
- **PRD 문서**: `orbit-alpha/시스템 기획/` (리포 내)
- **디자인 시스템**: `orbit-alpha/시스템 기획/OrbitAI-브랜드-디자인시스템-v1.0.md`

| 서브시스템 | 내부코드 | 역할 | 포트 |
|-----------|---------|------|------|
| **Orbit Base** | `base` | 데이터 수집 & 시뮬레이션 | :8001 |
| **Orbit Lab** | `lab` | 모델 리서치 & 설계 (AI 에이전트) | :8002 |
| **Orbit Bay** | `bay` | 자동 리밸런싱 & 거래 실행 | :8003 |
| **Orbit Deck** | `deck` | 대시보드 & 리포트 (3단계 접근 제어) | :443 |

> **네이밍 주의**: PRD 원본은 구 이름 사용 (Pulse→Base, Forge→Lab, Navigator→Deck, Pilot→Bay)
> **이름 변경**: Orbit Alpha → Orbit AAM (Orbit AI Asset Management), 내부 지칭: OrbitAI, 한국어: 오르빗AI 자산운용
> **오르빗 작업 시**: 반드시 `오르빗-컨텍스트.md`를 먼저 참조 (시스템 아키텍처, DB 스키마, 마스터 전략, 코드 경로 등 포함)

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

### 슬랙 포맷팅 (CRITICAL)
**❌ 마크다운 금지** → **✅ 플레인 텍스트**
- 제목: `[제목]` 대괄호
- 불렛: `• ` 또는 `- `
- **❌ `**볼드**` 절대 금지** - Slack에서 렌더링 안됨
- **❌ `*이탤릭*` 금지**
- **❌ `` `코드` `` 최소화**

### 🚀 배포 규칙 (필수)
**리노봇 관련 코드 수정 시 스테이징 배포를 기본으로 함께 진행**
```bash
# WBSalesHub 스테이징 배포
cd /home/peterchung/WBSalesHub && ./scripts/deploy-staging.sh
```
- 코드 수정 → 빌드 검증 → 스테이징 배포까지 한 세트로 진행
- 배포 완료 후 Slack에서 테스트 가능

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
