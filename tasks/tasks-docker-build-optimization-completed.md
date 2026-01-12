# Docker 빌드 최적화 - 완료 보고서

## 작업 기간
- 시작: 2026-01-11
- 완료: 2026-01-12

## 최종 결과

### 이미지 크기 비교
| 허브 | 최적화 전 | 최적화 후 | 감소율 |
|------|----------|----------|--------|
| **WBHubManager** | 878MB | **262MB** | **70%** |
| **WBSalesHub** | 1.34GB (Server Mode) | **353MB** (Static Export) | **74%** |

### 주요 변경 사항

#### 1. WBHubManager
- BuildKit 캐시 마운트 적용
- npm cache clean --force 제거 (BuildKit 캐시 충돌 방지)
- `isomorphic-dompurify` 의존성 추가
- 멀티스테이지 빌드 최적화

#### 2. WBSalesHub
- **Static Export 모드로 변경** (`output: 'export'`)
  - Server Mode: .next/ + node_modules = ~1.3GB
  - Static Export: out/ 폴더만 = ~2MB
- **hub-auth 로컬 라이브러리 이전**
  - `@wavebridge/hub-auth` 패키지 → `server/lib/hub-auth/`
  - 오라클 서버에서 file: 참조 문제 해결
- **AccountStatus 소문자 통일**
  - ACTIVE → active, PENDING → pending 등
  - DB 마이그레이션: `005_lowercase_status.sql`
- **AccountRole 동적 타입 변경**
  - 고정 enum → string 타입
  - HubManager의 `hub_role_definitions` 테이블에서 동적 로드

---

## 변경된 파일 목록

### WBSalesHub
| 파일 | 변경 내용 |
|------|----------|
| `frontend/next.config.ts` | `output: 'export'` 설정, rewrites 제거 |
| `Dockerfile` | `out/` 폴더만 복사, 프론트엔드 node_modules 제거 |
| `server/lib/hub-auth/` | hub-auth 라이브러리 전체 복사 (신규) |
| `server/lib/hub-auth/types/auth.types.ts` | AccountRole=string, AccountStatus=소문자 |
| `server/types/index.ts` | AccountRole, AccountStatus 타입 동기화 |
| `server/database/migrations/005_lowercase_status.sql` | DB 소문자 마이그레이션 |
| `package.json` | `@wavebridge/hub-auth` 의존성 제거 |
| 다수 서버 파일 | ACTIVE→active, PENDING→pending 등 변경 |

### WBHubManager
| 파일 | 변경 내용 |
|------|----------|
| `Dockerfile` | npm cache clean --force 제거 |
| `package.json` | `isomorphic-dompurify` 추가 |

### WHCommon
| 파일 | 변경 내용 |
|------|----------|
| `claude-context.md` | Static Export 가이드 상세 추가 |

---

## 기술적 세부 사항

### Static Export vs Server Mode

```
Server Mode (.next/ + node_modules):
├── .next/                    ~150MB
├── node_modules/             ~600MB (프론트엔드 의존성)
└── 총: ~750MB (프론트엔드만)

Static Export (out/):
├── out/                      ~2MB (정적 HTML/CSS/JS)
└── 총: ~2MB (프론트엔드만)
```

### Dockerfile 변경 (핵심)

```dockerfile
# ❌ 이전 (Server Mode)
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
RUN npm --prefix frontend ci --omit=dev  # 600MB 추가!

# ✅ 이후 (Static Export)
COPY --from=frontend-builder /app/frontend/out ./frontend/out
COPY --from=frontend-builder /app/frontend/public ./frontend/public
# node_modules 설치 불필요!
```

### hub-auth 이전 이유
- `@wavebridge/hub-auth`는 `file:../WBHubManager/packages/hub-auth` 참조
- 오라클 서버에서는 저장소가 분리되어 있어 참조 불가
- 해결: 소스 코드를 `server/lib/hub-auth/`로 복사

### AccountStatus 소문자 통일 이유
- PostgreSQL enum 값과 TypeScript 타입 불일치 방지
- 업계 표준: 소문자 사용 (pending, active, rejected, inactive)
- DB 마이그레이션으로 기존 데이터 변환

---

## 오라클 스테이징 배포 상태

### 빌드 완료
- [x] WBHubManager staging: 262MB
- [x] WBSalesHub staging: 353MB

### 컨테이너 상태
- [x] wbhubmanager-staging: healthy
- [x] wbsaleshub-staging: healthy (schema.sql 복사 필요)

### 남은 작업
- [ ] Dockerfile에 `schema.sql`, `migrations/` 복사 추가
- [ ] 재빌드 및 스모크 테스트 완료

---

## 참고 문서
- claude-context.md: "7. 프론트엔드 빌드 모드" 섹션
- Dockerfile 최적화 가이드: claude-context.md "Docker 빌드 최적화 가이드" 섹션

---

---

## 추가 최적화: 상대 경로 패턴 (2026-01-12)

### 배경
- BUILD ARG로 `NEXT_PUBLIC_API_URL`을 주입하면 환경별로 캐시가 무효화됨
- 스테이징 → 프로덕션 승격 시 전체 재빌드 필요 (3-5분 소요)

### 해결 방안: 상대 경로 패턴
- **빌드 시**: `NEXT_PUBLIC_API_URL` 환경변수를 완전히 제거
- **런타임 시**: 모든 API 호출은 상대 경로 (`/api/*`) 사용
- **라우팅**: Nginx가 `/api/*` 요청을 백엔드로 프록시

### 변경 사항

#### 1. next.config.js
```javascript
// ❌ 이전
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4090',
  },
};

// ✅ 이후
const nextConfig = {
  // env 객체 제거
  async rewrites() {
    // 개발 환경에서만 rewrites 사용
    if (process.env.NODE_ENV === 'development') {
      return [{ source: '/api/:path*', destination: 'http://localhost:4090/api/:path*' }];
    }
    return [];
  },
};
```

#### 2. API 클라이언트
```typescript
// ❌ 이전
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4090';

// ✅ 이후
const API_BASE_URL = '';  // 빈 문자열 (상대 경로)
```

#### 3. Dockerfile
```dockerfile
# ❌ 이전
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# ✅ 이후 (ARG/ENV 제거)
RUN npm run build  # 환경 독립적
```

### 예상 효과
| 항목 | 변경 전 | 변경 후 | 개선율 |
|------|---------|---------|-------|
| 스테이징 빌드 | 3-5분 | 3-5분 | - |
| 프로덕션 승격 | 3-5분 (재빌드) | **0초** (태그만 변경) | **100%** |
| 총 배포 시간 | 6-10분 | 3-5분 | **50%** |
| 캐시 활용도 | 0% | 100% | ∞ |

### 적용 허브
- ✅ **WBSalesHub**: 이미 적용됨 (검증 완료)
- 🔄 **WBHubManager**: 적용 예정
- 🔄 **WBFinHub**: 적용 예정 (basePath 제거)
- 🔄 **WBOnboardingHub**: 적용 예정

### 참고 문서
- 계획서: `/home/peterchung/.claude/plans/robust-waddling-swan.md`
- 검증 사례: WBSalesHub (http://workhub.biz/saleshub)

---

## 작성자
- Claude Sonnet 4.5
- 작성일: 2026-01-12
- 업데이트: 2026-01-12 (상대 경로 패턴 추가)
