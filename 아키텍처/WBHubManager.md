# WBHubManager 아키텍처

## 개요

WBHubManager는 WorkHub 시스템의 **메인 관리 허브**로, 사용자 인증, 허브 관리, AI 페르소나 관리를 담당합니다.

## 디렉토리 구조

```
WBHubManager/
├── server/                    # Express 백엔드
│   ├── index.ts              # 진입점 (포트 4090)
│   ├── config/
│   │   └── database.ts       # PostgreSQL 커넥션 풀
│   ├── database/
│   │   ├── init.ts           # DB 초기화
│   │   ├── schema/           # SQL 스키마 (hubs, users, documents)
│   │   └── migrations/       # 마이그레이션 (16개)
│   ├── routes/
│   │   ├── hubRoutes.ts      # /api/hubs
│   │   ├── adminRoutes.ts    # /api/admin
│   │   ├── aiAdminRoutes.ts  # /api/ai-admin (페르소나)
│   │   └── ...
│   ├── services/
│   │   ├── personaService.ts # 페르소나 CRUD + 버전 관리
│   │   └── ...
│   └── middleware/
│       └── rateLimit.ts
│
├── frontend/                  # Next.js 프론트엔드
│   ├── app/                   # App Router
│   │   ├── page.tsx          # 루트 → /hubs 리다이렉트
│   │   ├── layout.tsx
│   │   ├── admin/            # 어드민 페이지
│   │   ├── hubs/             # 허브 목록
│   │   └── docs/             # 문서
│   ├── components/
│   └── lib/
│
├── packages/                  # 공용 모노레포 패키지
│   ├── ai-agent-core/        # AI 에이전트 프레임워크
│   ├── hub-auth/             # 인증 라이브러리
│   └── llm-connector/        # LLM 연결기
│
├── WBRefHub/                  # Cookie SSO 레퍼런스 (테스트용)
├── HWTestAgent/               # 테스트 자동화 에이전트
│
├── docker-compose.yml         # 로컬 Docker 설정
├── docker-compose.staging.yml
├── docker-compose.prod.yml
├── Dockerfile                 # 멀티스테이지 빌드
└── nginx/                     # Nginx 설정
```

## API 엔드포인트

### 허브 관리 (`/api/hubs`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 허브 목록 (권한 확인) |
| GET | `/slug/:slug` | 특정 허브 조회 |
| POST | `/` | 허브 생성 (어드민) |
| PUT | `/:id` | 허브 수정 |
| DELETE | `/:id` | 허브 삭제 |

### AI 페르소나 관리 (`/api/ai-admin`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/personas` | 페르소나 목록 |
| POST | `/personas` | 페르소나 생성 |
| PUT | `/personas/:id` | 페르소나 수정 |
| GET | `/personas/:id/changelog` | 변경 이력 |

### 어드민 (`/api/admin`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/stats` | 통계 |
| POST | `/cleanup-duplicate-hubs` | 중복 정리 |

## 데이터베이스 스키마

### 주요 테이블
- `hubs` - 허브 목록 (id, slug, name, url, is_active, order_index)
- `users` - 사용자 계정
- `documents` - 문서 관리
- `ai_personas` - AI 페르소나 (DB 기반 관리)
- `ai_persona_change_logs` - 페르소나 변경 이력
- `banners` - 배너 관리
- `user_permissions` - 사용자 권한

## 핵심 서비스

### PersonaService (`server/services/personaService.ts`)
AI 페르소나의 CRUD 및 버전 관리를 담당합니다.

```typescript
// 주요 메서드
getPersonaById(id: number)
createPersona(data: CreatePersonaInput)
updatePersona(id: number, data: UpdatePersonaInput)
getChangeLog(personaId: number)
```

### Database Pool (`server/config/database.ts`)
PostgreSQL 커넥션 풀 관리

```typescript
// 설정
poolSize: 3 (DB_POOL_MAX 환경변수)
idleTimeout: 60초
connectionTimeout: 5초
SSL: 프로덕션만
```

## 세션 및 인증

- **세션 저장소**: PostgreSQL (connect-pg-simple)
- **쿠키 설정**:
  - name: `wbhub.sid`
  - httpOnly: true
  - sameSite: 'lax'
  - domain: COOKIE_DOMAIN 환경변수
  - maxAge: 24시간

## 환경변수

```bash
# 필수
DATABASE_URL=postgresql://...
SESSION_SECRET=...
JWT_PRIVATE_KEY=... (Base64)
JWT_PUBLIC_KEY=... (Base64)
COOKIE_DOMAIN=.workhub.biz

# 선택
ANTHROPIC_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## 빌드 및 실행

```bash
# 로컬 개발
npm run dev              # 프론트엔드 + 백엔드

# 빌드
npm run build:frontend   # Next.js 정적 빌드
npm run build:server     # TypeScript 컴파일

# Docker
docker-compose up -d
```
