# WBSalesHub 아키텍처

## 개요

WBSalesHub는 **영업 CRM 허브**로, 고객 관리와 **Reno AI 봇**을 통한 Slack 기반 영업 지원을 제공합니다.

## 디렉토리 구조

```
WBSalesHub/
├── server/
│   ├── index.ts                    # 진입점 (포트 4010)
│   ├── modules/
│   │   ├── reno/                   # Reno AI 봇 (핵심 모듈)
│   │   │   ├── RenoAgent.ts        # 메인 에이전트 (1063줄)
│   │   │   ├── tools/              # AI 도구 정의 (12개)
│   │   │   │   ├── customerTools.ts
│   │   │   │   ├── meetingTools.ts
│   │   │   │   ├── memoTools.ts
│   │   │   │   └── ...
│   │   │   ├── context/
│   │   │   │   └── CustomerContextManager.ts (1021줄)
│   │   │   └── features/
│   │   │       └── meeting-prep/   # 미팅 준비 기능
│   │   │
│   │   ├── integrations/
│   │   │   └── slack/
│   │   │       └── renoSlackApp.ts # Slack Bolt 앱 (914줄)
│   │   │
│   │   ├── customers/              # 고객 관리
│   │   ├── meetings/               # 미팅 관리
│   │   └── memos/                  # 메모 관리
│   │
│   ├── routes/
│   │   ├── customerRoutes.ts
│   │   ├── meetingRoutes.ts
│   │   └── renoRoutes.ts
│   │
│   └── config/
│       └── database.ts
│
├── frontend/
│   ├── app/
│   │   ├── customers/              # 고객 목록
│   │   ├── meetings/               # 미팅 관리
│   │   └── dashboard/              # 대시보드
│   └── components/
│
├── packages/                       # 심볼릭 링크 → HubManager/packages
├── Dockerfile
└── docker-compose.*.yml
```

## Reno AI 봇 아키텍처

### 핵심 컴포넌트

```
┌─────────────────────────────────────────────────────────────┐
│                    Slack (메시지 수신)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              renoSlackApp.ts (Bolt 앱)                       │
│  - 이벤트 핸들링 (app_mention, message)                       │
│  - 즉시 응답 피드백 ("처리 중입니다!")                          │
│  - 백그라운드 처리 후 메시지 업데이트                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                RenoAgent.ts (메인 에이전트)                   │
│  - Claude API (Tool Use 패턴)                                │
│  - 12개 도구 정의 및 실행                                     │
│  - 페르소나 기반 응답 생성                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Customer    │  │  Meeting    │  │   Memo      │
│   Tools     │  │   Tools     │  │   Tools     │
└─────────────┘  └─────────────┘  └─────────────┘
```

### AI 도구 목록 (12개)

| 도구 | 파일 | 기능 |
|------|------|------|
| get_customer_info | customerTools.ts | 고객 정보 조회 |
| search_customers | customerTools.ts | 고객 검색 |
| get_customer_context | customerTools.ts | 고객 컨텍스트 |
| create_meeting | meetingTools.ts | 미팅 생성 |
| list_meetings | meetingTools.ts | 미팅 목록 |
| get_meeting_prep | meetingTools.ts | 미팅 준비 자료 |
| create_memo | memoTools.ts | 메모 생성 |
| search_memos | memoTools.ts | 메모 검색 |
| get_recent_activities | activityTools.ts | 최근 활동 |
| calculate_commission | commissionTools.ts | 수수료 계산 |
| get_sales_stats | statsTools.ts | 영업 통계 |
| search_knowledge | knowledgeTools.ts | 지식 검색 |

### 페르소나 시스템

| 타입 | 파일 | 대상 | 특징 |
|------|------|------|------|
| Internal | reno-internal.yaml | 직원 | 반말/친근, 이모지 사용 |
| External | reno-external.yaml | 고객 | 격식체, 이모지 금지 |

**로딩 순서**: Cache → DB → YAML 폴백

## API 엔드포인트

### 고객 관리 (`/api/customers`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 고객 목록 |
| GET | `/:id` | 고객 상세 |
| POST | `/` | 고객 생성 |
| PUT | `/:id` | 고객 수정 |
| GET | `/:id/context` | 고객 컨텍스트 (AI용) |

### 미팅 관리 (`/api/meetings`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 미팅 목록 |
| POST | `/` | 미팅 생성 |
| GET | `/:id/prep` | 미팅 준비 자료 |

### Reno 봇 (`/slack/reno`)
| Path | 설명 |
|------|------|
| `/events` | Slack 이벤트 수신 |
| `/interactions` | 버튼 클릭 등 인터랙션 |

## 데이터베이스 스키마

### 주요 테이블
- `customers` - 고객 정보 (name, company, location, contact_info)
- `meetings` - 미팅 기록 (customer_id, date, type, notes)
- `memos` - 영업 메모 (customer_id, content, tags)
- `customer_contexts` - AI 컨텍스트 캐시

## Slack 통합

### 환경변수
```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
```

### 이벤트 Subscription URL
- 스테이징: `https://staging.workhub.biz:4400/saleshub/slack/reno/events`
- 프로덕션: `https://workhub.biz/saleshub/slack/reno/events`

### 즉시 응답 피드백 (2026-01-26 구현)
```typescript
// 1. 즉시 임시 응답
const tempMessage = await say({ text: '처리 중입니다!' });

// 2. 백그라운드 처리
const response = await renoAgent.process(message);

// 3. 메시지 업데이트
await client.chat.update({ ts: tempMessage.ts, text: response });
```

## 환경변수

```bash
# 필수
DATABASE_URL=postgresql://...
HUBMANAGER_DATABASE_URL=postgresql://... (페르소나 DB)

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# AI
ANTHROPIC_API_KEY=sk-ant-...
```
