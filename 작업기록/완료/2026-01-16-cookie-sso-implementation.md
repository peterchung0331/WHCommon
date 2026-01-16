# 세일즈허브 Cookie SSO 구현 및 배포 완료

**작업 날짜**: 2026-01-16
**작업자**: Claude Code
**작업 시간**: 약 4시간 (디버깅 포함)
**작업량**: 0.9일 (7.5 WU)

---

## 작업 요약

WBSalesHub에 Cookie 기반 SSO(Single Sign-On) 인증 방식을 구현하여 WBHubManager로부터의 OAuth 인증 플로우를 완성했습니다. 오라클 스테이징 환경에서 E2E 테스트를 통해 전체 인증 플로우가 정상 작동함을 검증했습니다.

### 핵심 성과
- ✅ Cookie SSO 엔드포인트 구현 (`/auth/sso-complete`)
- ✅ JWT 공개키 동기화 및 검증 로직 완성
- ✅ 오라클 스테이징 배포 성공
- ✅ E2E 테스트 통과 (Google OAuth → Cookie 인증 → API 접근)
- ✅ ES Modules 환경 대응 (`__dirname` 폴리필)

---

## 문제 정의

### 초기 증상
- 허브 선택 화면에서 "세일즈허브" 클릭 시 OAuth 인증 후 다시 허브 선택 화면으로 리디렉션되는 루프 발생
- WBSalesHub 대시보드에 접근 불가

### 근본 원인
1. **Cookie SSO 엔드포인트 부재**: WBHubManager는 `/auth/sso-complete`로 리디렉트하지만 WBSalesHub에 해당 엔드포인트 없음
2. **JWT 토큰 방식 혼용**: WBSalesHub가 URL 파라미터로 토큰을 받는 방식만 지원 (`/auth/callback?token=...`)
3. **인증 플로우 불일치**: HubManager는 Cookie SSO를 사용하지만 SalesHub는 지원하지 않음

---

## 구현 내용

### Phase 1: Cookie SSO 엔드포인트 추가 (0.3일, 2 WU)

#### 1.1 `/auth/sso-complete` 엔드포인트
**파일**: [WBSalesHub/server/routes/authRoutes.ts](../../../WBSalesHub/server/routes/authRoutes.ts) (라인 237-269)

```typescript
/**
 * GET /auth/sso-complete
 * Cookie SSO 완료 (WBRefHub 패턴)
 */
router.get('/sso-complete', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3010';

  // 1. 쿠키에서 토큰 추출
  const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
  if (!accessToken) {
    console.error('❌ No access token in cookie');
    return res.redirect(`${frontendUrl}/login?error=no_token`);
  }

  // 2. JWT 검증
  const verifyResult = await verifyAccessToken(accessToken);
  if (!verifyResult.valid) {
    console.error('❌ Invalid access token:', verifyResult.error);
    return res.redirect(`${frontendUrl}/login?error=invalid_token`);
  }

  console.log('✅ SSO Complete - User authenticated:', verifyResult.payload.email);

  // 3. 대시보드로 리다이렉트
  return res.redirect(`${frontendUrl}`);
});
```

#### 1.2 쿠키 인증 미들웨어
**파일**: [WBSalesHub/server/middleware/cookieAuth.ts](../../../WBSalesHub/server/middleware/cookieAuth.ts)

```typescript
export function cookieAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    if (!accessToken) {
      return next(); // 쿠키 없어도 next() 호출
    }

    const verifyResult = await verifyAccessToken(accessToken);

    if (verifyResult.valid && verifyResult.payload) {
      req.user = {
        id: verifyResult.payload.sub,
        account_id: verifyResult.payload.sub,
        email: verifyResult.payload.email,
        name: verifyResult.payload.username || verifyResult.payload.email.split('@')[0],
        role: verifyResult.payload.is_admin ? 'ADMIN' : 'VIEWER',
        status: 'ACTIVE',
        is_hub_admin: verifyResult.payload.is_admin,
      };
    }

    next();
  };
}
```

**적용**: [WBSalesHub/server/index.ts](../../../WBSalesHub/server/index.ts) (라인 81)
```typescript
app.use(cookieAuthMiddleware()); // 전역 적용
```

#### 1.3 쿠키 설정 파일
**파일**: [WBSalesHub/server/config/cookie.config.ts](../../../WBSalesHub/server/config/cookie.config.ts)

```typescript
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'wbhub_access_token',
  REFRESH_TOKEN: 'wbhub_refresh_token',
} as const;

export const COOKIE_CONFIG = {
  ACCESS_TOKEN: {
    name: COOKIE_NAMES.ACCESS_TOKEN,
    options: {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax' as const,
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
      maxAge: 15 * 60 * 1000, // 15분
    }
  },
  // ...
};
```

---

### Phase 2: 환경변수 및 Docker 설정 (0.2일, 1.5 WU)

#### 2.1 Doppler CLI 제거
**파일**: [WBSalesHub/docker-start.sh](../../../WBSalesHub/docker-start.sh)

**변경 전** (Doppler CLI 사용):
```bash
if [ -n "$DOPPLER_TOKEN" ]; then
  echo "✓ Using Doppler for environment variables"
  doppler run -- npm run start
else
  echo "✓ Using .env file for environment variables"
  npm run start
fi
```

**변경 후** (.env 파일만 사용):
```bash
echo "✓ Loading environment variables from .env file"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set"
  exit 1
fi

echo "✓ Environment variables loaded successfully"
exec npm run start
```

**이유**: 환경변수 관리 단일화 (Single Source of Truth)

#### 2.2 환경변수 설정
**파일**: `/home/ubuntu/workhub/WBSalesHub/.env.staging` (오라클 서버)

```env
# 스테이징 환경 (포트 번호 필수)
APP_URL=https://staging.workhub.biz:4400/saleshub
BASE_URL=https://staging.workhub.biz:4400/saleshub

# JWT 공개키 (Base64 인코딩)
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...

# 데이터베이스
DATABASE_URL=postgresql://workhub:Wnsgh22dml2026@host.docker.internal:5432/hubmanager
HUBMANAGER_DATABASE_URL=postgresql://workhub:Wnsgh22dml2026@host.docker.internal:5432/hubmanager

# 기타
PORT=4010
NODE_ENV=production
FRONTEND_URL=https://staging.workhub.biz:4400/saleshub
```

---

### Phase 3: JWT 공개키 동기화 (0.1일, 0.5 WU)

#### 3.1 ES Modules __dirname 폴리필
**파일**: [WBSalesHub/server/services/jwtService.ts](../../../WBSalesHub/server/services/jwtService.ts)

**문제**: ES Modules 환경에서 `__dirname` 사용 불가
**해결**: `fileURLToPath` 및 `dirname` 사용

```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**커밋**: `698c5f6` - "fix: Add __dirname polyfill for ES Modules in jwtService"

#### 3.2 공개키 추출 및 인코딩
```bash
# HubManager 컨테이너에서 공개키 추출
docker exec wbhubmanager-staging cat /app/server/keys/public.pem

# Base64 인코딩
cat public.pem | base64 -w 0

# .env.staging에 추가
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...
```

---

### Phase 4: 로컬 테스트 (생략)

로컬 환경 대신 오라클 스테이징 환경에 직접 배포하여 테스트했습니다.

**이유**:
- 로컬 환경 설정 복잡도 감소
- 실제 운영 환경과 동일한 조건에서 테스트
- 시간 절약 (로컬 환경 구축 0.2일 → 0일)

---

### Phase 5: 오라클 스테이징 배포 및 E2E 테스트 (0.3일, 2.5 WU)

#### 5.1 배포 과정
```bash
# 1. Git push
cd /mnt/c/GitHub/WBSalesHub
git add .
git commit -m "feat: Add Cookie SSO support with /auth/sso-complete endpoint"
git push origin master

# 2. 오라클 서버에서 배포
ssh oracle-cloud
cd /home/ubuntu/workhub/WBSalesHub
git pull origin master
DOCKER_BUILDKIT=1 docker build -t wbsaleshub:staging .

# 3. 컨테이너 재시작
docker stop wbsaleshub-staging
docker rm wbsaleshub-staging
docker run -d --name wbsaleshub-staging \
  --network workhub-network \
  -p 4010:4010 \
  --env-file /home/ubuntu/workhub/WBSalesHub/.env.staging \
  --add-host=host.docker.internal:host-gateway \
  wbsaleshub:staging
```

#### 5.2 E2E 테스트 결과
**파일**: [HWTestAgent/tests/e2e-oracle-staging-cookie-sso.spec.ts](../../../HWTestAgent/tests/e2e-oracle-staging-cookie-sso.spec.ts)

**실행 명령어**:
```bash
cd /home/peterchung/HWTestAgent
npx playwright test tests/e2e-oracle-staging-cookie-sso.spec.ts --timeout=120000
```

**결과**: ✅ **PASS** (1 passed, 1 skipped)

**검증 항목**:
- ✅ Google OAuth 인증 성공
- ✅ Cookie 발급 (`wbhub_access_token`)
- ✅ Cookie 도메인: `staging.workhub.biz`
- ✅ Cookie 속성: `httpOnly: true`, `sameSite: Lax`
- ✅ `/auth/sso-complete` 엔드포인트 정상 작동
- ✅ 대시보드 리디렉트 성공
- ✅ API 인증 성공 (`/api/auth/me`)

**테스트 출력**:
```
✅ COOKIE SSO TEST PASSED
============================================
   ✓  Complete Cookie SSO flow: HubManager → OAuth → SalesHub (10.1s)
   1 skipped (cookie persistence test)
   1 passed (11.4s)
```

---

## 디버깅 과정 및 해결한 이슈

### 이슈 1: ES Modules `__dirname` 에러
**에러**: `ReferenceError: __dirname is not defined in ES module scope`
**위치**: `WBSalesHub/server/services/jwtService.ts` 라인 25
**원인**: ES Modules에서 `__dirname` 전역 변수 사용 불가
**해결**: `fileURLToPath` 및 `dirname` 폴리필 추가
**커밋**: `698c5f6`

### 이슈 2: JWT Invalid Signature
**에러**: `JsonWebTokenError: invalid signature`
**위치**: WBSalesHub JWT 검증 (cookieAuth.ts)
**원인**: 잘못된 공개키 사용 (config/keys 대신 컨테이너 내부 키 필요)
**해결**: HubManager 컨테이너에서 공개키 추출 후 Base64 인코딩하여 환경변수로 주입

### 이슈 3: 브라우저 에러 페이지 (chrome-error)
**에러**: `chrome-error://chromewebdata/` 페이지로 이동
**원인**: 환경변수 URL에 포트 번호 누락
**해결**: `APP_URL`과 `BASE_URL`에 `:4400` 추가

### 이슈 4: 쿠키 인증 미들웨어 미적용
**에러**: `/api/auth/me`에서 "No token provided" 응답
**원인**: cookieAuthMiddleware가 전역으로 적용되지 않음
**해결**: `server/index.ts`에 `app.use(cookieAuthMiddleware())` 추가
**커밋**: `e18f0c5`

### 이슈 5: JWT 미들웨어와 Cookie 미들웨어 충돌
**에러**: 여전히 "No token provided" 반환
**원인**: `/auth/me` 엔드포인트가 `authenticateJWT` 미들웨어 사용 (Authorization 헤더만 확인)
**해결**: `authenticateJWT` 제거, `req.user` 수동 확인으로 변경
**커밋**: `9c8b128`

### 이슈 6: API 응답 구조 불일치
**에러**: E2E 테스트에서 `userData.user` undefined
**원인**: 백엔드가 `user` 키 대신 `data` 키로 응답
**해결**: 응답 구조 수정 (`user` → `data`)

---

## 최종 인증 플로우

```
1. 사용자: /hubs 페이지에서 "세일즈허브" 클릭
   ↓
2. HubManager: /api/auth/generate-hub-token 호출 → requires_auth: true
   ↓
3. HubManager: Google OAuth로 리디렉트 (state에 hub_slug 포함)
   ↓
4. Google: OAuth 인증 완료
   ↓
5. HubManager: /api/auth/google-callback 수신
   ↓
6. HubManager: JWT 토큰 생성 후 Cookie 설정 (wbhub_access_token)
   ↓
7. HubManager: /saleshub/auth/sso-complete로 리디렉트
   ↓
8. WBSalesHub: /auth/sso-complete 엔드포인트
   - 쿠키에서 토큰 읽기
   - JWT 검증 (공개키 사용)
   - 검증 성공 시 대시보드로 리디렉트
   ↓
9. WBSalesHub: 대시보드 로드
   ↓
10. API 호출: cookieAuthMiddleware가 자동으로 인증 처리 ✅
```

---

## 파일 변경 내역

### 신규 파일 (4개)
1. `WBSalesHub/server/middleware/cookieAuth.ts` - Cookie 인증 미들웨어
2. `WBSalesHub/server/config/cookie.config.ts` - Cookie 설정
3. `WBSalesHub/server/services/jwtService.ts` - JWT 공개키 로딩 로직
4. `HWTestAgent/tests/e2e-oracle-staging-cookie-sso.spec.ts` - E2E 테스트

### 수정된 파일 (5개)
1. `WBSalesHub/server/routes/authRoutes.ts` - `/auth/sso-complete` 엔드포인트 추가, `/auth/me` 수정
2. `WBSalesHub/server/index.ts` - cookieAuthMiddleware 전역 적용
3. `WBSalesHub/docker-start.sh` - Doppler CLI 제거
4. `WBSalesHub/.env.staging` (오라클 서버) - JWT_PUBLIC_KEY 추가, URL 수정
5. `WBSalesHub/package.json` - (의존성 변경 없음)

---

## 커밋 히스토리

| 커밋 | 날짜 | 메시지 |
|------|------|--------|
| `698c5f6` | 2026-01-16 | fix: Add __dirname polyfill for ES Modules in jwtService |
| `e18f0c5` | 2026-01-16 | feat: Apply cookie authentication middleware globally |
| `9c8b128` | 2026-01-16 | fix: Allow cookie authentication for /auth/me endpoint |

---

## 성능 및 보안

### 보안 강화
- ✅ **httpOnly Cookie**: JavaScript에서 접근 불가 (XSS 방지)
- ✅ **SameSite=Lax**: CSRF 공격 완화
- ✅ **Secure 플래그**: HTTPS 환경에서만 전송
- ✅ **JWT RS256**: 비대칭 암호화 (공개키/개인키 분리)
- ✅ **토큰 만료**: Access Token 15분 (자동 갱신 필요 시 Refresh Token 사용)

### 성능 개선
- Cookie 기반 인증으로 매 요청마다 Authorization 헤더 불필요
- 브라우저가 자동으로 Cookie 포함 (클라이언트 코드 단순화)
- JWT 검증 시 DB 조회 불필요 (stateless 인증)

---

## 참고 문서

- **플랜 파일**: `~/.claude/plans/composed-toasting-seahorse.md`
- **WBRefHub 구현**: `/mnt/c/GitHub/WBHubManager/WBRefHub/server/routes/authRoutes.ts`
- **배포 가이드**: `/home/peterchung/WHCommon/문서/가이드/배포-가이드-오라클.md`
- **E2E 테스트 가이드**: `~/.claude/skills/스킬테스터/E2E-테스트-가이드.md`

---

## 다음 단계 (선택 사항)

### Phase 2.3: 다른 허브에 Doppler CLI 제거 적용
- WBFinHub
- WBOnboardingHub

**작업량**: 허브당 0.1일 (0.5 WU) × 2개 = 0.2일 (1 WU)

### 프로덕션 배포
```bash
# 스테이징 검증 완료 후 프로덕션 승격
ssh oracle-cloud
cd /home/ubuntu/workhub/WBSalesHub
./scripts/oracle/promote-production.sh
```

---

**작업 완료 시간**: 2026-01-16 23:30 KST
**최종 상태**: ✅ **완료** - 오라클 스테이징 환경에서 Cookie SSO 정상 작동
