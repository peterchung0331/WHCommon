# PRD: WBFinHub JWT SSO 쿠키 인증 방식 전환

## 1. Introduction/Overview

현재 WBFinHub는 `@wavebridge/hub-auth` 패키지를 사용하여 Authorization 헤더 기반의 JWT 인증을 구현하고 있습니다. 이 방식은 프론트엔드에서 localStorage에 토큰을 저장하고, 매 API 요청마다 `Authorization: Bearer <token>` 헤더를 통해 인증하는 구조입니다.

이번 작업은 WBRefHub와 동일한 **쿠키 기반 JWT SSO 인증 방식**으로 전환하는 것입니다. 이를 통해:
- XSS 공격에 더 안전한 `httpOnly` 쿠키 사용
- CSRF 방지를 위한 `sameSite` 속성 활용
- 전체 WorkHub 생태계에서 일관된 인증 방식 유지
- localStorage 의존성 제거로 보안 강화

**핵심 변경 사항:**
1. `@wavebridge/hub-auth` 패키지 완전 제거
2. RefHub와 동일한 쿠키 인증 모듈 구현 (cookieAuth, jwtService)
3. 백엔드: Authorization 헤더 → 쿠키 기반 인증으로 변경
4. 프론트엔드: localStorage 토큰 저장 → 쿠키 자동 처리로 변경
5. SSO 엔드포인트: `/auth/sso` → `/auth/login`, `/auth/sso-complete` 방식으로 변경

## 2. Goals

1. **보안 강화**: localStorage 토큰 저장 방식을 제거하고 httpOnly 쿠키 사용
2. **일관성**: WBRefHub와 동일한 인증 구조 적용하여 전체 허브 간 일관성 확보
3. **단순화**: `@wavebridge/hub-auth` 패키지 의존성 제거로 코드 복잡도 감소
4. **호환성**: 기존 테스트 코드 유지하되 쿠키 인증 테스트 추가
5. **확장성**: 향후 다른 허브(WBSalesHub, WBOnboardingHub)에도 동일한 패턴 적용 가능

## 3. User Stories

### Story 1: 쿠키 기반 SSO 로그인
**As a** WBFinHub 사용자
**I want to** 로그인 시 쿠키에 JWT 토큰이 자동 저장되도록
**So that** localStorage를 직접 관리할 필요 없이 안전하게 인증할 수 있다

**Acceptance Criteria:**
- 로그인 버튼 클릭 시 HubManager로 리다이렉트
- HubManager OAuth 완료 후 `/auth/sso-complete`로 돌아옴
- 쿠키에 `wbhub_access_token`, `wbhub_refresh_token` 자동 저장
- 대시보드로 자동 리다이렉트

### Story 2: API 요청 시 자동 인증
**As a** 개발자
**I want to** API 요청 시 쿠키가 자동으로 전송되도록
**So that** 매번 Authorization 헤더를 수동으로 설정할 필요가 없다

**Acceptance Criteria:**
- 백엔드 미들웨어가 쿠키에서 토큰을 자동으로 읽음
- 프론트엔드는 `credentials: 'include'` 설정만으로 쿠키 전송
- Authorization 헤더 관련 코드 제거

### Story 3: 기존 기능 유지
**As a** 시스템 관리자
**I want to** 인증 방식 변경 후에도 기존 기능이 정상 작동하도록
**So that** 사용자 경험에 영향을 주지 않는다

**Acceptance Criteria:**
- 거래(Deal), 고객(Customer), 트랜잭션 등 기존 모듈 정상 작동
- 권한 검증 (isAdmin 등) 기능 유지
- 기존 테스트 케이스 통과

## 4. Functional Requirements

### 4.1 백엔드 요구사항

#### FR-1: @wavebridge/hub-auth 패키지 제거
- `package.json`에서 `@wavebridge/hub-auth` 의존성 제거
- 관련 import 문 및 사용 코드 모두 삭제

#### FR-2: 쿠키 설정 모듈 추가
- 파일: `/server/config/cookie.config.ts` (RefHub와 동일)
- 내용:
  ```typescript
  export const COOKIE_CONFIG = {
    ACCESS_TOKEN: {
      name: 'wbhub_access_token',
      options: {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: '/',
        maxAge: 15 * 60 * 1000, // 15분
      }
    },
    REFRESH_TOKEN: {
      name: 'wbhub_refresh_token',
      options: {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      }
    }
  }
  ```

#### FR-3: JWT 서비스 모듈 추가
- 파일: `/server/services/jwtService.ts` (RefHub 코드 복사)
- 기능:
  - `verifyAccessToken(token: string)`: JWT 토큰 검증
  - `decodeToken(token: string)`: 토큰 디코딩 (디버깅용)
  - `getTokenExpiry(token: string)`: 만료 시간 확인
  - `isTokenExpired(token: string)`: 만료 여부 확인
- JWT 공개키: `process.env.JWT_PUBLIC_KEY` 사용 (HubManager와 동일)

#### FR-4: 쿠키 인증 미들웨어 추가
- 파일: `/server/middleware/cookieAuth.ts` (RefHub 코드 복사)
- 기능:
  - `cookieAuthMiddleware(req, res, next)`: 쿠키에서 토큰 읽고 검증
  - `requireAuth(req, res, next)`: 인증 필수 체크
- `req.user` 타입:
  ```typescript
  interface Request {
    user?: {
      id: string;
      email: string;
      username?: string;
      fullName?: string;
      isAdmin?: boolean;
    } | null;
  }
  ```

#### FR-5: 기존 JWT 미들웨어 교체
- 파일: `/server/middleware/jwt.ts`
- 변경:
  - `authenticateJWT` → `cookieAuthMiddleware` 사용으로 변경
  - `@wavebridge/hub-auth` import 제거
  - `isAuthenticatedAndActive` 함수 내부 로직 변경
  - 개발 모드 우회 로직 유지 (`AUTH_ENABLED=false` 지원)

#### FR-6: 인증 라우트 변경
- 파일: `/server/routes/authRoutes.ts`
- 기존 엔드포인트 제거:
  - `GET /auth/sso` (전체 로직 삭제)
  - `GET /auth/mock-sso` (테스트용, 유지 가능하나 쿠키 방식으로 수정)
- 새 엔드포인트 추가:
  - `GET /auth/login`: HubManager SSO로 리다이렉트
    ```typescript
    const hubManagerUrl = process.env.HUB_MANAGER_URL || 'http://workhub.biz';
    const finhubUrl = process.env.FINHUB_URL || 'http://localhost:3020';
    const ssoUrl = `${hubManagerUrl}/api/auth/google-oauth?app=wbfinhub&redirect=${encodeURIComponent(finhubUrl)}`;
    res.redirect(ssoUrl);
    ```
  - `GET /auth/sso-complete`: HubManager에서 쿠키 설정 후 돌아오는 엔드포인트
    ```typescript
    // 1. 쿠키에서 토큰 읽기
    const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    // 2. 토큰 검증
    const result = await verifyAccessToken(accessToken);
    // 3. 대시보드로 리다이렉트
    res.redirect(`${frontendUrl}/dashboard`);
    ```
- 기존 엔드포인트 유지:
  - `POST /auth/refresh`: 유지 (쿠키 방식으로 수정)
  - `POST /auth/logout`: 쿠키 삭제 로직으로 변경
  - `GET /auth/me`: 쿠키 인증 미들웨어 사용으로 변경
  - `GET /auth/status`: 유지

#### FR-7: 환경변수 추가
- `.env.template` 및 `.env.local`에 추가:
  ```bash
  # Cookie SSO 설정
  FINHUB_URL=http://localhost:3020
  COOKIE_DOMAIN=  # 프로덕션: .workhub.biz
  JWT_PUBLIC_KEY=  # HubManager의 JWT 공개키 (Base64 또는 PEM 형식)
  ```

#### FR-8: 서버 초기화 변경
- 파일: `/server/index.ts`
- 변경:
  - 쿠키 파서 미들웨어 추가: `app.use(cookieParser())`
  - `cookieAuthMiddleware`를 전역 미들웨어로 등록 (선택적 인증)
  - CORS 설정에 `credentials: true` 추가
  ```typescript
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  }));
  ```

### 4.2 프론트엔드 요구사항

#### FR-9: 로그인 페이지 변경
- 파일: `/frontend/app/(auth)/login/page.tsx`
- 변경:
  - `login()` 함수 수정: `/api/auth/login`으로 리다이렉트
  - localStorage 관련 코드 제거
  - 쿠키는 자동으로 설정되므로 별도 처리 불필요

#### FR-10: SSO 콜백 페이지 제거 또는 수정
- 파일: `/frontend/app/auth/sso-callback/page.tsx`
- **옵션 1 (권장)**: 완전 제거
  - 쿠키 기반 인증에서는 `/auth/sso-complete`가 백엔드에서 처리
  - 프론트엔드 콜백 페이지 불필요
- **옵션 2**: RefHub 방식으로 변경
  - 백엔드 `/auth/sso-complete`가 프론트엔드 `/auth/callback`으로 리다이렉트
  - 프론트엔드에서 쿠키 검증 후 대시보드 이동

#### FR-11: API 호출 설정 변경
- 파일: `/frontend/lib/api.ts`
- 변경:
  - 모든 `fetch()` 호출에 `credentials: 'include'` 추가
  - `Authorization` 헤더 설정 코드 제거
  - localStorage 토큰 읽기 코드 제거
  ```typescript
  // 변경 전
  const token = localStorage.getItem('accessToken');
  headers: { 'Authorization': `Bearer ${token}` }

  // 변경 후
  credentials: 'include',  // 쿠키 자동 전송
  ```

#### FR-12: AuthStore 변경
- 파일: `/frontend/store/authStore.ts`
- 변경:
  - localStorage 토큰 저장/읽기 로직 제거
  - 인증 상태는 `/api/auth/me` 호출 결과로만 판단
  - 쿠키는 브라우저가 자동 관리

#### FR-13: AuthProvider 변경
- 파일: `/frontend/providers/AuthProvider.tsx` (있는 경우)
- 변경:
  - `login()` 함수: `/api/auth/login`으로 리다이렉트만 수행
  - `logout()` 함수: `/api/auth/logout` POST 호출 후 쿠키 삭제

### 4.3 테스트 요구사항

#### FR-14: 기존 테스트 유지
- 경로: `/server/__tests__/`, `/frontend/__tests__/` 등
- 기존 단위 테스트, 통합 테스트 유지
- Authorization 헤더 관련 테스트는 쿠키 방식으로 수정

#### FR-15: 쿠키 인증 테스트 추가
- RefHub의 테스트 코드 참고:
  - `/server/__tests__/unit/cookieConfig.test.ts`: 쿠키 설정 테스트
  - `/server/__tests__/unit/jwtService.test.ts`: JWT 검증 테스트
  - `/server/__tests__/integration/api.test.ts`: 쿠키 기반 API 테스트
- E2E 테스트:
  - `/e2e/finhub-sso.spec.ts`: 쿠키 SSO 플로우 테스트
  - Playwright로 쿠키 설정 확인

## 5. Non-Goals (Out of Scope)

- ❌ WBSalesHub, WBOnboardingHub의 인증 방식 변경 (이 작업에서는 제외)
- ❌ HubManager의 인증 로직 변경 (이미 쿠키 지원 중)
- ❌ Refresh Token 자동 갱신 로직 (RefHub에도 미구현, 추후 구현)
- ❌ 기존 계정 데이터 마이그레이션 (인증 방식만 변경, DB 스키마 동일)
- ❌ 모바일 앱 지원 (웹 전용)

## 6. Design Considerations

### 6.1 쿠키 vs localStorage 비교

| 항목 | 쿠키 (새 방식) | localStorage (기존 방식) |
|------|---------------|------------------------|
| **보안** | httpOnly로 XSS 방어 | JavaScript로 접근 가능 (XSS 취약) |
| **CSRF 방지** | sameSite 속성 사용 | 없음 |
| **자동 전송** | 브라우저가 자동 처리 | 수동으로 헤더 설정 필요 |
| **만료 관리** | 자동 (maxAge) | 수동 관리 필요 |
| **크기 제한** | ~4KB | ~5MB |

### 6.2 인증 플로우 변경

**변경 전 (Authorization 헤더 방식):**
```
[사용자] → 로그인 버튼 클릭
    ↓
[HubManager] OAuth 인증
    ↓
[FinHub /auth/sso?token=xxx] 토큰을 query param으로 전달
    ↓
[FinHub Backend] 토큰 검증 후 프론트엔드로 리다이렉트 (token을 URL에 포함)
    ↓
[FinHub Frontend /auth/sso-callback] localStorage에 토큰 저장
    ↓
[대시보드] Authorization 헤더에 토큰 포함하여 API 호출
```

**변경 후 (쿠키 방식):**
```
[사용자] → 로그인 버튼 클릭
    ↓
[FinHub /auth/login] HubManager로 리다이렉트
    ↓
[HubManager] OAuth 인증
    ↓
[HubManager] 쿠키에 JWT 설정 후 FinHub로 리다이렉트
    ↓
[FinHub /auth/sso-complete] 쿠키에서 토큰 읽고 검증
    ↓
[대시보드] 쿠키가 자동으로 전송되어 인증
```

### 6.3 RefHub와의 구조 동일성

WBFinHub는 WBRefHub와 **완전히 동일한 구조**를 가집니다:

| 모듈 | RefHub 경로 | FinHub 경로 (새로 생성) |
|------|------------|----------------------|
| 쿠키 설정 | `/server/config/cookie.config.ts` | `/server/config/cookie.config.ts` |
| JWT 서비스 | `/server/services/jwtService.ts` | `/server/services/jwtService.ts` |
| 쿠키 인증 미들웨어 | `/server/middleware/cookieAuth.ts` | `/server/middleware/cookieAuth.ts` |
| 인증 라우트 | `/server/routes/authRoutes.ts` | `/server/routes/authRoutes.ts` (수정) |
| 로그인 페이지 | `/frontend/app/login/page.tsx` | `/frontend/app/(auth)/login/page.tsx` (수정) |

## 7. Technical Considerations

### 7.1 CORS 설정

쿠키를 사용하려면 CORS 설정에 `credentials: true` 필수:

```typescript
// 백엔드 (server/index.ts)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));

// 프론트엔드 (lib/api.ts)
fetch(url, {
  credentials: 'include',  // 쿠키 전송 허용
});
```

### 7.2 프로덕션 환경 설정

- **도메인**: `workhub.biz`
- **쿠키 도메인**: `.workhub.biz` (모든 서브도메인에서 공유)
- **Secure 플래그**: HTTPS에서만 쿠키 전송
- **SameSite**: `lax` (CSRF 방지)

환경변수 `.env.prd`:
```bash
NODE_ENV=production
COOKIE_DOMAIN=.workhub.biz
HUB_MANAGER_URL=http://workhub.biz
FINHUB_URL=http://workhub.biz/finhub
FRONTEND_URL=http://workhub.biz/finhub
JWT_PUBLIC_KEY=<HubManager의 공개키>
```

### 7.3 개발 환경 설정

- **도메인**: `localhost`
- **쿠키 도메인**: 설정하지 않음 (동일 도메인만)
- **Secure 플래그**: false
- **포트**:
  - Frontend: 3001
  - Backend: 4020
  - HubManager: 4090

환경변수 `.env.local`:
```bash
NODE_ENV=development
HUB_MANAGER_URL=http://localhost:4090
FINHUB_URL=http://localhost:3020
FRONTEND_URL=http://localhost:3001
JWT_PUBLIC_KEY=<HubManager의 공개키>
AUTH_ENABLED=true  # false로 설정 시 개발 모드 우회
```

### 7.4 PrismaAccountAdapter 유지

- 파일: `/server/adapters/PrismaAccountAdapter.ts`
- 기존 코드 유지 (쿠키 인증과 무관)
- `@wavebridge/hub-auth` 의존성 제거 시 인터페이스만 남기고 직접 구현

### 7.5 기존 모듈과의 통합

- **계정 모듈** (`/server/modules/accounts`): 변경 없음
- **고객 모듈** (`/server/modules/customers`): 변경 없음
- **거래 모듈** (`/server/modules/deals`): 변경 없음
- **트랜잭션 모듈** (`/server/modules/deal-transactions`): 변경 없음

모든 모듈은 `req.user`를 통해 인증된 사용자 정보를 받으므로, 미들웨어 교체만으로 동작합니다.

## 8. Success Metrics

1. **보안 강화**
   - localStorage에 저장된 토큰 0개
   - httpOnly 쿠키 사용률 100%

2. **기능 정상 작동**
   - 기존 API 엔드포인트 정상 작동률 100%
   - SSO 로그인 성공률 100%
   - 기존 테스트 케이스 통과율 100%

3. **코드 단순화**
   - `@wavebridge/hub-auth` 의존성 제거 완료
   - Authorization 헤더 관련 코드 제거 완료
   - localStorage 토큰 관리 코드 제거 완료

4. **일관성**
   - RefHub와 동일한 파일 구조 및 코드 패턴 적용
   - 전체 WorkHub 프로젝트 간 인증 방식 일관성 확보

## 9. Open Questions

### Q1: @wavebridge/hub-auth 패키지는 완전히 삭제하나요?
**A:** 네, `package.json`에서 제거하고 관련 import 및 사용 코드 모두 삭제합니다. RefHub처럼 직접 구현한 코드만 사용합니다.

### Q2: 기존 테스트 코드는 어떻게 처리하나요?
**A:** 사용자 선택에 따라 **기존 테스트 유지하되 쿠키 테스트 추가**합니다. Authorization 헤더 관련 테스트는 쿠키 방식으로 수정합니다.

### Q3: 프론트엔드 `/auth/sso-callback` 페이지는 제거하나요?
**A:** 쿠키 방식에서는 백엔드 `/auth/sso-complete`가 직접 대시보드로 리다이렉트하므로, 프론트엔드 콜백 페이지는 **제거 권장**합니다. 단, RefHub 방식을 따라 유지할 수도 있습니다.

### Q4: Refresh Token 갱신 로직은 구현하나요?
**A:** RefHub에도 아직 구현되지 않았으므로, 이번 작업에서는 **Out of Scope**입니다. 추후 RefHub와 함께 구현할 예정입니다.

### Q5: 개발 모드 우회 로직(`AUTH_ENABLED=false`)은 유지하나요?
**A:** 네, 기존 `/server/middleware/jwt.ts`의 개발 모드 우회 로직은 `cookieAuth.ts`에서도 동일하게 유지합니다.

## 10. Implementation Checklist

### Phase 1: 백엔드 쿠키 인증 구조 추가
- [ ] `/server/config/cookie.config.ts` 생성 (RefHub 복사)
- [ ] `/server/services/jwtService.ts` 생성 (RefHub 복사)
- [ ] `/server/middleware/cookieAuth.ts` 생성 (RefHub 복사)
- [ ] `/server/index.ts`에 `cookieParser()` 미들웨어 추가
- [ ] CORS 설정에 `credentials: true` 추가

### Phase 2: 인증 라우트 변경
- [ ] `/server/routes/authRoutes.ts`에 `/auth/login` 추가
- [ ] `/server/routes/authRoutes.ts`에 `/auth/sso-complete` 추가
- [ ] 기존 `/auth/sso` 엔드포인트 제거
- [ ] `/auth/logout` 쿠키 삭제 로직으로 변경
- [ ] `/auth/me` 쿠키 인증 미들웨어 사용으로 변경

### Phase 3: 기존 미들웨어 교체
- [ ] `/server/middleware/jwt.ts`에서 `@wavebridge/hub-auth` import 제거
- [ ] `authenticateJWT` 함수를 `cookieAuthMiddleware` 기반으로 재작성
- [ ] `isAuthenticatedAndActive` 함수 내부 로직 변경

### Phase 4: @wavebridge/hub-auth 제거
- [ ] `package.json`에서 의존성 제거
- [ ] `npm install` 실행하여 패키지 삭제
- [ ] `/server/adapters/PrismaAccountAdapter.ts` 검토 (필요시 인터페이스만 유지)

### Phase 5: 프론트엔드 변경
- [ ] `/frontend/app/(auth)/login/page.tsx` 수정 (localStorage 제거)
- [ ] `/frontend/app/auth/sso-callback/page.tsx` 제거 또는 수정
- [ ] `/frontend/lib/api.ts`에 `credentials: 'include'` 추가
- [ ] Authorization 헤더 설정 코드 제거
- [ ] `/frontend/store/authStore.ts` localStorage 로직 제거

### Phase 6: 환경변수 설정
- [ ] `.env.template`에 `FINHUB_URL`, `COOKIE_DOMAIN`, `JWT_PUBLIC_KEY` 추가
- [ ] `.env.local` 업데이트
- [ ] `.env.prd` 업데이트 (Doppler 동기화)

### Phase 7: 테스트 추가
- [ ] `/server/__tests__/unit/cookieConfig.test.ts` 추가 (RefHub 참고)
- [ ] `/server/__tests__/unit/jwtService.test.ts` 추가 (RefHub 참고)
- [ ] `/server/__tests__/integration/api.test.ts` 쿠키 방식으로 수정
- [ ] `/e2e/finhub-sso.spec.ts` E2E 테스트 추가

### Phase 8: 검증 및 배포
- [ ] 로컬 환경에서 SSO 로그인 테스트
- [ ] 모든 기존 API 엔드포인트 정상 작동 확인
- [ ] 기존 테스트 케이스 통과 확인
- [ ] Docker 환경에서 테스트
- [ ] 오라클 클라우드 배포 및 프로덕션 테스트

---

**작성일:** 2026-01-04
**버전:** 1.0
**작성자:** Claude Code
**참고 문서:**
- [prd-hub-sso-redirect-improvement.md](/home/peterchung/WHCommon/기능 PRD/prd-hub-sso-redirect-improvement.md)
- WBRefHub 쿠키 인증 구현 코드
- WBFinHub 기존 인증 구조
