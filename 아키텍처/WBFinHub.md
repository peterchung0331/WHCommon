# WBFinHub 아키텍처

## 개요

WBFinHub는 **재무/거래 관리 허브**로, 거래(Deal) 관리, CSV 임포트, Fireblocks API 통합을 담당합니다.

**상태**: 초기 단계 (v0.1.0), Mock 데이터 기반

## 디렉토리 구조

```
WBFinHub/
├── server/
│   ├── index.ts                    # 진입점 (포트 4020)
│   ├── modules/
│   │   ├── deals/                  # 거래 관리 (핵심)
│   │   │   ├── deal.service.ts     # CRUD 서비스 (412줄)
│   │   │   ├── deal.types.ts       # 타입 정의
│   │   │   └── index.ts
│   │   │
│   │   ├── fireblocks/             # Fireblocks API 통합
│   │   │   ├── fireblocks.service.ts
│   │   │   └── fireblocks.types.ts
│   │   │
│   │   └── import/                 # CSV 임포트
│   │       └── csvImporter.ts
│   │
│   ├── routes/
│   │   ├── dealRoutes.ts
│   │   └── importRoutes.ts
│   │
│   └── config/
│       └── database.ts
│
├── frontend/
│   ├── app/
│   │   ├── deals/                  # 거래 목록/상세
│   │   ├── import/                 # CSV 임포트 UI
│   │   └── dashboard/              # 대시보드
│   └── components/
│       └── DealTable.tsx
│
├── packages/                       # 심볼릭 링크 → HubManager/packages
├── Dockerfile
└── docker-compose.*.yml
```

## API 엔드포인트

### 거래 관리 (`/api/deals`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 거래 목록 (필터링, 페이지네이션) |
| GET | `/:id` | 거래 상세 |
| POST | `/` | 거래 생성 |
| PUT | `/:id` | 거래 수정 |
| DELETE | `/:id` | 거래 삭제 |
| GET | `/stats` | 거래 통계 |

### CSV 임포트 (`/api/import`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/csv` | CSV 파일 업로드 |
| GET | `/preview` | 임포트 미리보기 |
| POST | `/confirm` | 임포트 확정 |

### Fireblocks (`/api/fireblocks`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/vaults` | 볼트 목록 |
| POST | `/transactions` | 트랜잭션 생성 |

## 데이터 모델

### Deal (거래)
```typescript
interface Deal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  counterparty: string;
  deal_type: 'buy' | 'sell' | 'transfer';
  created_at: Date;
  updated_at: Date;
  created_by: string;
}
```

### DealFilter
```typescript
interface DealFilter {
  status?: string;
  deal_type?: string;
  date_from?: Date;
  date_to?: Date;
  min_amount?: number;
  max_amount?: number;
}
```

## 핵심 서비스

### DealService (`server/modules/deals/deal.service.ts`)
거래 CRUD 및 통계 관리

```typescript
// 주요 메서드
getAllDeals(filter?: DealFilter, pagination?: Pagination)
getDealById(id: string)
createDeal(data: CreateDealInput)
updateDeal(id: string, data: UpdateDealInput)
deleteDeal(id: string)
getDealStats()
```

### Fireblocks Integration
외부 Fireblocks API와 연동하여 암호화폐 거래 관리

```typescript
// 환경변수
FIREBLOCKS_API_KEY=...
FIREBLOCKS_API_SECRET=...
FIREBLOCKS_VAULT_ID=...
```

## 환경변수

```bash
# 필수
DATABASE_URL=postgresql://...
HUBMANAGER_DATABASE_URL=postgresql://... (SSO용)

# Fireblocks (선택)
FIREBLOCKS_API_KEY=...
FIREBLOCKS_API_SECRET=...
```

## 현재 상태 및 향후 계획

### 현재 (v0.1.0)
- Mock 데이터 기반 CRUD
- 기본 CSV 임포트
- Fireblocks 타입 정의만

### 향후 계획
- 실제 DB 연동
- Fireblocks API 완전 통합
- AI 기반 거래 분석 (ai-agent-core 활용)
- 승인 워크플로우
