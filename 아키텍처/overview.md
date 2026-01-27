# WorkHub 시스템 아키텍처 개요

## 시스템 구성

WorkHub는 **모노레포 기반 멀티허브 엔터프라이즈 시스템**으로, 각 허브가 독립적으로 배포되면서 공용 패키지와 인증을 공유합니다.

```
                    ┌─────────────────────────────────────┐
                    │         Nginx (리버스 프록시)         │
                    │   workhub.biz / staging.workhub.biz │
                    └─────────────┬───────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ WBHubManager  │       │  WBSalesHub   │       │   WBFinHub    │
│   (메인 허브)   │◄─────►│  (영업 CRM)    │◄─────►│  (재무 관리)   │
│   :4090       │  SSO  │   :4010       │  SSO  │   :4020       │
└───────┬───────┘       └───────┬───────┘       └───────────────┘
        │                       │
        │ 공용 패키지            │ Reno AI
        ▼                       ▼
┌───────────────────────────────────────────────────────────────┐
│                    공용 패키지 (Monorepo)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │  hub-auth   │  │llm-connector│  │   ai-agent-core     │    │
│  │ (쿠키 SSO)  │  │(Claude/GPT) │  │  (Reno AI 프레임워크) │    │
│  └─────────────┘  └─────────────┘  └─────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (공용 DB)      │
                    └─────────────────┘
```

## 허브 목록

| 허브 | 경로 | 역할 | 상태 |
|------|------|------|------|
| **WBHubManager** | `/home/peterchung/WBHubManager` | 메인 관리 허브, SSO 중심 | 활성 |
| **WBSalesHub** | `/home/peterchung/WBSalesHub` | 영업 CRM, Reno AI 봇 | 활성 |
| **WBFinHub** | `/home/peterchung/WBFinHub` | 재무/거래 관리 | 활성 |
| **WBOnboardingHub** | `/home/peterchung/WBOnboardingHub` | 온보딩 플로우 | 비활성 |
| **HWTestAgent** | `/home/peterchung/HWTestAgent` | 테스트 자동화, 에러 패턴 DB | 활성 |

## 포트 체계

| 환경 | HubManager | SalesHub | FinHub | Nginx |
|------|-----------|----------|--------|-------|
| 로컬 (FE) | 3090 | 3010 | 3020 | - |
| 로컬 (BE) | 4090 | 4010 | 4020 | 4400 |
| 스테이징 | 내부 | 내부 | 내부 | 4400 (HTTPS) |
| 프로덕션 | 4090 | 4010 | 4020 | 80/443 |

## 기술 스택

### 백엔드
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Raw SQL (pg) / Prisma (일부)
- **Cache**: Redis (BullMQ 작업 큐)
- **Auth**: JWT + Cookie-based SSO

### 프론트엔드
- **Framework**: Next.js 15+ (App Router)
- **UI**: React 19, Tailwind CSS
- **State**: Context API
- **Build**: 정적 내보내기 (next export)

### AI/ML
- **LLM**: Claude (주), OpenAI/Gemini (폴백)
- **Framework**: ai-agent-core (자체 개발)
- **Integration**: Slack Bot (Bolt)

### 인프라
- **Container**: Docker + Docker Compose
- **Proxy**: Nginx (경로 기반 라우팅)
- **Cloud**: Oracle Cloud (스테이징/프로덕션)
- **CI/CD**: 수동 배포 스크립트

## 인증 흐름 (Cookie SSO)

```
1. 사용자 → HubManager 로그인
2. HubManager → JWT 발급 → 쿠키 설정 (wbhub_access_token)
3. 쿠키 도메인: .workhub.biz (모든 허브 공유)
4. 다른 허브 접근 → 쿠키 자동 전송 → JWT 검증
5. 각 허브 /api/auth/me 호출로 사용자 정보 확인
```

## 주요 의존성 관계

```
WBHubManager
├── packages/hub-auth (인증)
├── packages/ai-agent-core (페르소나 관리 API)
└── packages/llm-connector (LLM 비용 관리)

WBSalesHub
├── packages/hub-auth (인증)
├── packages/ai-agent-core (Reno AI 봇)
└── server/modules/reno/ (봇 구현)

WBFinHub
├── packages/hub-auth (인증)
└── server/modules/deals/ (거래 관리)
```

## 관련 문서

- [WBHubManager.md](./WBHubManager.md) - HubManager 상세 구조
- [WBSalesHub.md](./WBSalesHub.md) - SalesHub 및 Reno AI
- [WBFinHub.md](./WBFinHub.md) - FinHub 거래 관리
- [shared-packages.md](./shared-packages.md) - 공용 패키지 상세
- [deployment.md](./deployment.md) - 배포 및 환경 설정
