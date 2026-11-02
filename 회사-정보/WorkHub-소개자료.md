# WorkHub 플랫폼 소개

> 웨이브릿지의 통합 업무 플랫폼

---

## 목차

1. [WorkHub란?](#workhub란)
2. [시스템 연결 구조](#시스템-연결-구조)
3. [각 Hub 소개](#각-hub-소개)
4. [사용자 흐름](#사용자-흐름)
5. [PM/개발팀용 기술 부록](#pm개발팀용-기술-부록)

---

## WorkHub란?

WorkHub는 웨이브릿지의 **통합 업무 플랫폼**입니다. 여러 개의 전문화된 시스템(Hub)을 하나의 계정으로 사용할 수 있도록 연결해주는 플랫폼입니다.

### 왜 WorkHub인가?

기존에는 각 팀마다 별도의 시스템을 사용했습니다:
- 영업팀은 영업 관리 시스템
- 재무팀은 금융 관리 시스템
- 각 시스템마다 별도 로그인 필요

**WorkHub의 해결책:**
- 한 번의 Google 로그인으로 모든 시스템 접근
- 통합된 사용자 경험
- 데이터 연동 및 공유 가능

---

## 시스템 연결 구조

### 전체 아키텍처

```
                    ┌─────────────────────────────────────────┐
                    │           사용자 (웹 브라우저)            │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │              workhub.biz                │
                    │         (Nginx 리버스 프록시)            │
                    └────────────────────┬────────────────────┘
                                         │
         ┌───────────────┬───────────────┼───────────────┬───────────────┐
         │               │               │               │               │
         ▼               ▼               ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │   Hub   │    │  Sales  │    │   Fin   │    │Onboard- │    │  Test   │
    │ Manager │    │   Hub   │    │   Hub   │    │   ing   │    │  Agent  │
    │  :3090  │    │  :3010  │    │  :3020  │    │  :3040  │    │  :3100  │
    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
         │               │               │               │               │
         │               ▼               ▼               ▼               │
         │          ┌─────────────────────────────────────┐              │
         │          │      SSO 인증 (JWT 토큰 검증)        │              │
         │          │    모든 Hub는 HubManager에서        │              │
         └──────────│       발급한 토큰으로 인증           │──────────────┘
                    └─────────────────────────────────────┘
```

### Hub 간 연결 관계

| 구분 | Hub 이름 | 역할 | 접속 주소 |
|------|----------|------|-----------|
| 중앙 | **WBHubManager** | 통합 로그인, Hub 게이트웨이 | workhub.biz |
| 업무 | **WBSalesHub** | 영업/고객 관리 (CRM) | workhub.biz/saleshub |
| 업무 | **WBFinHub** | 금융/자산 관리 | workhub.biz/finhub |
| 지원 | **WBOnboardingHub** | 신규 사용자 온보딩 | workhub.biz/onboarding |
| 도구 | **HWTestAgent** | 자동화 테스트 시스템 | workhub.biz/testagent |
| 문서 | **Hub Docs** | 사용 가이드 문서 | workhub.biz/docs |

### SSO (Single Sign-On) 인증 흐름

**"한 번 로그인하면 모든 Hub를 사용할 수 있습니다"**

```
1. 사용자가 workhub.biz 접속
   └─→ Google 로그인 버튼 클릭

2. Google 계정으로 인증
   └─→ @wavebridge.com 이메일만 허용

3. HubManager가 인증 토큰 발급
   └─→ JWT 토큰 (보안 인증서) 생성

4. Hub 선택 화면 표시
   └─→ 사용자가 원하는 Hub 클릭

5. 선택한 Hub로 자동 로그인
   └─→ 토큰이 쿠키에 저장되어 재로그인 불필요
```

---

## 각 Hub 소개

### 1. WBHubManager (중앙 관리 허브)

**역할:** 모든 Hub의 관문 역할을 하는 중앙 관리 시스템

**주요 기능:**
- Google 계정으로 통합 로그인
- Hub 선택 화면 제공 (데스크톱: 카드형, 모바일: 스와이프)
- 사용자 권한 관리
- 공용 문서 제공 (Hub Docs)

**사용자 화면:**
- 로그인 후 Hub 카드를 클릭하여 원하는 시스템으로 이동
- Tools 메뉴에서 테스트/봇 등 부가 기능 접근 가능

---

### 2. WBSalesHub (영업 관리)

**역할:** 고객 관계 관리(CRM) 및 영업 활동 추적

**주요 기능:**

| 기능 | 설명 |
|------|------|
| 고객 관리 | 고객 정보, 담당자, 카테고리 관리 |
| 미팅 관리 | 미팅 일정 및 참석자 관리 |
| 미팅 노트 | 미팅 기록 작성 및 팀 공유 |
| 영업 파이프라인 | 잠재고객 → 회원가입 → 대기 → 액티브 단계 관리 |
| 활동 기록 | 전화, 이메일, 미팅, 제안, 계약 활동 추적 |

**연동 서비스:**
- Slack: 미팅 노트 자동 공유
- Claude AI: 미팅 노트 요약
- Fireflies: 음성 녹음 자동 전사

---

### 3. WBFinHub (금융 관리)

**역할:** 암호화폐 자산 및 고객 딜(계약) 관리

**주요 기능:**

| 기능 | 설명 |
|------|------|
| 딜 관리 | 고객 계약 생성, 상태 추적, 수익 분석 |
| 지갑 관리 | 암호화폐 지갑 및 잔고 조회 |
| 트랜잭션 | 입출금 거래 내역 추적 |
| 대시보드 | 손익 차트, 자산 분포, 거래 통계 |
| 리포트 | 일일/주간/월간 자동 리포트 생성 |
| 법인 관리 | 웨이브릿지, WB HK, WB EU 등 다중 법인 |

**권한 구분:**
- ADMIN: 전체 관리 권한
- FINANCE: 재무 데이터 접근
- TRADING: 트레이딩 데이터 접근
- EXECUTIVE: 경영진 조회 권한
- VIEWER: 읽기 전용

---

### 4. WBOnboardingHub (온보딩)

**역할:** 신규 사용자 가이드 및 초기 설정

**주요 기능:**
- 단계별 온보딩 플로우
- 각 Hub 사용법 안내
- 프로필 초기 설정

---

### 5. HWTestAgent (테스트 자동화)

**역할:** 시스템 품질 보증을 위한 자동화 테스트

**주요 기능:**

| 기능 | 설명 |
|------|------|
| E2E 테스트 | 전체 시스템 통합 테스트 |
| SSO 테스트 | 각 Hub 로그인 플로우 검증 |
| 다중 환경 | 로컬/스테이징/프로덕션 테스트 |
| 테스트 대시보드 | 테스트 결과 시각화 |

**테스트 시나리오 (ISTQB 표준):**
- Smoke: 배포 전 최소 검증
- Core-API-P0: 시스템 장애 수준 (Critical)
- Core-API-P1: 핵심 기능 오류 (High)
- Core-API-P2: 부가 기능 오류 (Medium)

---

### 6. Hub Docs (문서)

**역할:** 모든 Hub의 사용 가이드 및 API 문서

**주요 기능:**
- Stripe 스타일 3-컬럼 레이아웃
- Markdown 기반 문서
- 사이드바 네비게이션
- 목차 자동 생성

---

## 사용자 흐름

### 1. 처음 접속하는 경우

```
workhub.biz 접속
    │
    ▼
Google 로그인 (@wavebridge.com)
    │
    ▼
Hub 선택 화면
    │
    ├─→ SalesHub 클릭 → 고객/영업 관리
    ├─→ FinHub 클릭 → 금융/자산 관리
    ├─→ Onboarding 클릭 → 사용법 안내
    └─→ Docs 클릭 → 문서 조회
```

### 2. 이미 로그인된 경우

```
workhub.biz 접속
    │
    ▼
Hub 선택 화면 (자동)
    │
    ▼
원하는 Hub 클릭 → 바로 이동 (재로그인 불필요)
```

### 3. 권한에 따른 접근

| 권한 | 접근 가능 Hub |
|------|---------------|
| 일반 사용자 | SalesHub, Docs |
| 재무팀 | FinHub, SalesHub, Docs |
| 관리자 | 모든 Hub |
| 테스트팀 | TestAgent, 모든 Hub |

---

## PM/개발팀용 기술 부록

### 기술 스택 요약

| 구분 | 기술 |
|------|------|
| **Frontend** | Next.js 15~16, React 18~19, TypeScript |
| **Backend** | Express.js 4~5, Node.js 18+ |
| **Database** | PostgreSQL 15 |
| **ORM** | Prisma (FinHub, SalesHub) / 직접 SQL (HubManager) |
| **인증** | JWT (RS256), Google OAuth 2.0 |
| **스타일링** | Tailwind CSS 3~4 |
| **아이콘** | lucide-react |
| **상태 관리** | Zustand, React Query |
| **테스트** | Playwright |
| **배포** | Oracle Cloud, PM2, Nginx |
| **환경변수** | Doppler |

---

### DB 테이블 구조

#### WBHubManager

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 계정 (email, name, is_admin, last_login_at) |
| `hubs` | Hub 메타데이터 (slug, name, url, icon, is_active) |
| `user_permissions` | 사용자-Hub 접근 권한 매핑 |
| `session` | Express 세션 데이터 |
| `documents` | Docs Hub 문서 저장 |
| `refresh_tokens` | JWT Refresh 토큰 관리 |
| `token_blacklist` | 해지된 토큰 블랙리스트 |
| `oauth_accounts` | Google OAuth 계정 연결 |

#### WBSalesHub

| 테이블 | 설명 |
|--------|------|
| `customers` | 고객 정보 (회사명, 담당자, 영업단계, 카테고리) |
| `customer_contacts` | 고객사 담당자 (책임자/실무자) |
| `customer_activities` | 영업 활동 기록 (전화/미팅/이메일 등) |
| `customer_documents` | 고객별 문서 자료 |
| `meetings` | 미팅 일정 및 참석자 |
| `meeting_notes` | 미팅 기록 노트 |
| `accounts` | 사용자 계정 (상태: PENDING/APPROVED/REJECTED) |
| `category_importance` | 카테고리 중요도 |

#### WBFinHub

| 테이블 | 설명 |
|--------|------|
| `Account` | 사용자 계정 (역할: ADMIN/FINANCE/TRADING 등) |
| `Entity` | 법인 정보 (웨이브릿지, WB HK, WB EU) |
| `Customer` | 거래 고객 |
| `Deal` | 딜/계약 정보 (유형: EARN/BOOSTER_RANGE 등) |
| `DealTransaction` | 딜 입출금 거래 |
| `Asset` | 암호화폐 자산 (BTC, ETH, USDT) |
| `Wallet` | 지갑 (유형: TRADING/TREASURY/CLIENT) |
| `WalletBalance` | 지갑 잔고 |
| `Transaction` | 블록체인 트랜잭션 |
| `Report` | 일일/주간/월간 리포트 |
| `AuditLog` | 감사 로그 (모든 변경사항 추적) |
| `ExchangeRate` | 환율 정보 |

---

### 배포 환경 정보

| 항목 | 값 |
|------|-----|
| **서버** | Oracle Cloud (158.180.95.246) |
| **도메인** | workhub.biz |
| **프로세스 관리** | PM2 |
| **리버스 프록시** | Nginx |
| **SSL** | Let's Encrypt |
| **DB** | Oracle Cloud PostgreSQL |

#### 포트 체계

| Hub | Frontend | Backend |
|-----|----------|---------|
| HubManager | 3090 | 4090 |
| SalesHub | 3010 | 4010 |
| FinHub | 3020 | 4020 |
| OnboardingHub | 3040 | 4040 |
| TestAgent | 3100 | 4100 |

#### Nginx 라우팅

```
workhub.biz/           → HubManager (3090)
workhub.biz/saleshub/  → SalesHub (3010)
workhub.biz/finhub/    → FinHub (3020)
workhub.biz/onboarding/→ OnboardingHub (3040)
workhub.biz/testagent/ → TestAgent (3100)
workhub.biz/docs/      → HubManager Docs
```

---

### 주요 API 엔드포인트

#### 인증 (HubManager)

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/auth/google-oauth` | Google OAuth 시작 |
| `GET /api/auth/google-callback` | OAuth 콜백 처리 |
| `POST /api/auth/refresh` | 토큰 갱신 |
| `GET /api/auth/public-key` | 공개키 조회 (Hub용) |

#### Hub 관리 (HubManager)

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/hubs` | Hub 목록 조회 |
| `GET /api/hubs/:slug` | Hub 상세 조회 |

---

## 업데이트 이력

- **2026-01-05**: 초기 작성
  - 기능 리스트 기반 종합 소개자료 작성
  - 시스템 연결 구조 다이어그램 추가
  - PM용 기술 부록 추가

---

*이 문서는 WorkHub 플랫폼의 비개발자 대상 소개자료입니다.*
*기술적인 상세 내용은 [기능-리스트.md](./기능-리스트.md)를 참조하세요.*
