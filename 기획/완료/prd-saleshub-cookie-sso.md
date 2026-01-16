# 세일즈허브 OAuth 리디렉션 루프 해결 플랜

## 문제 요약

**증상**: 허브 선택 화면에서 세일즈허브 클릭 시 OAuth 인증 후 다시 허브 선택 화면으로 돌아오는 루프 발생

**원인**: WBHubManager는 Cookie SSO 방식으로 `/auth/sso-complete` 엔드포인트로 리디렉트하지만, WBSalesHub에는 해당 엔드포인트가 없고 JWT 토큰 방식(`/auth/callback?token=...`)을 기대함

**영향 범위**: WBHubManager, WBSalesHub 두 프로젝트

---

## 근본 원인 분석

### 1. Cookie SSO와 JWT 토큰 방식 혼용 🔴

**WBHubManager `server/routes/authRoutes.ts:487-514`**:
```typescript
const COOKIE_SSO_HUBS = ['wbsaleshub', 'wbfinhub', 'wbonboardinghub', 'wbrefhub'];

if (COOKIE_SSO_HUBS.includes(hub_slug)) {
  // Cookie 설정
  res.cookie('wbhub_access_token', token, cookieOptions);

  // sso-complete 엔드포인트로 리디렉트 (토큰 없이)
  const ssoCompleteUrl = `${hubUrl}/auth/sso-complete`;
  return res.redirect(ssoCompleteUrl);  // ❌ 이 엔드포인트 없음
}
```

**WBSalesHub**: `/auth/sso-complete` 엔드포인트 부재
- `/auth/callback?token=...` 엔드포인트만 존재 (`frontend/app/(auth)/callback/page.tsx`)
- JWT 토큰을 URL 파라미터로 받아 localStorage에 저장하는 방식

### 2. 환경변수 및 쿠키 도메인 설정 🟡

**WBHubManager `.env.staging`**:
```env
SALESHUB_URL=https://staging.workhub.biz/saleshub
# COOKIE_DOMAIN 설정 없음 ⚠️
```

**WBSalesHub `.env.staging`**:
```env
APP_URL=https://staging.workhub.biz/saleshub
BASE_URL=https://staging.workhub.biz/saleshub
```

**문제점**:
- `COOKIE_DOMAIN` 환경변수 미설정으로 쿠키 공유 실패 가능
- 쿠키가 `.staging.workhub.biz` 도메인으로 설정되지 않으면 WBSalesHub에서 읽을 수 없음

### 3. OAuth 플로우 불일치

**현재 플로우 (실패)**:
```
1. /hubs 페이지 - "세일즈허브" 클릭
   ↓
2. authApi.generateHubToken('wbsaleshub') → requires_auth: true
   ↓
3. Google OAuth 리디렉트 (state에 hub_slug 포함)
   ↓
4. OAuth 승인 후 /api/auth/google-callback
   ↓
5. Cookie SSO 적용 (res.cookie)
   ↓
6. https://staging.workhub.biz/saleshub/auth/sso-complete 리디렉트
   ↓
7. ❌ 404 또는 처리 실패 → /hubs로 돌아옴
```

**기대하는 플로우 (Cookie SSO)**:
```
6. https://staging.workhub.biz/saleshub/auth/sso-complete 리디렉트
   ↓
7. WBSalesHub가 쿠키에서 토큰 읽어 JWT 검증
   ↓
8. ✅ 검증 성공 → 대시보드로 리다이렉트
```

---

---

## 권장 솔루션: WBRefHub 패턴 적용 (Cookie SSO)

### 중요 발견 🔍

**WBRefHub 분석 결과**:
- ✅ WBRefHub는 이미 Cookie SSO 방식으로 성공적으로 작동 중
- ✅ WBSalesHub는 이미 `COOKIE_SSO_HUBS`에 포함됨 (HubManager)
- ✅ 문제: WBSalesHub에 `/auth/sso-complete` 엔드포인트가 없음

**해결 방안**:
- ❌ ~~JWT URL 파라미터 방식으로 변경~~ (기존 방안 A 폐기)
- ✅ **WBRefHub의 Cookie SSO 패턴을 WBSalesHub에 적용** (신규 권장안)

### Phase 1: WBSalesHub에 Cookie SSO 엔드포인트 추가 (0.3일, 2 WU)

**참조 구현**: `WBHubManager/WBRefHub/server/routes/authRoutes.ts`

#### 1.1 `/auth/sso-complete` 엔드포인트 추가

**신규 파일**: `WBSalesHub/server/routes/authRoutes.ts` (또는 기존 파일 수정)

```typescript
import { Router, Request, Response } from 'express';
import { verifyAccessToken } from '../middleware/cookieAuth';
import { COOKIE_NAMES } from '../config/cookie.config';

const router = Router();

// Cookie SSO Complete 엔드포인트 (WBRefHub 패턴)
router.get('/auth/sso-complete', async (req: Request, res: Response) => {
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

export default router;
```

#### 1.2 쿠키 인증 미들웨어 추가

**신규 파일**: `WBSalesHub/server/middleware/cookieAuth.ts` (WBRefHub 패턴)

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getPublicKey } from '../services/jwtService';
import { COOKIE_NAMES } from '../config/cookie.config';

export interface TokenPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
  username?: string;
  full_name?: string;
  is_admin?: boolean;
  type?: string;
}

export async function verifyAccessToken(token: string): Promise<{
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}> {
  try {
    const publicKey = getPublicKey();

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'wbhubmanager',
      // audience: ['wbsaleshub', 'wbfinhub', 'wbrefhub'],  // Optional
    }) as TokenPayload;

    // 토큰 타입 확인
    if (decoded.type && decoded.type !== 'access') {
      return { valid: false, error: 'Invalid token type' };
    }

    return { valid: true, payload: decoded };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return { valid: false, error: (error as Error).message };
  }
}

// 쿠키 인증 미들웨어
export function cookieAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    if (!accessToken) {
      // 쿠키 없어도 next() 호출 (인증 선택적)
      return next();
    }

    const verifyResult = await verifyAccessToken(accessToken);

    if (verifyResult.valid && verifyResult.payload) {
      req.user = {
        id: verifyResult.payload.sub,
        email: verifyResult.payload.email,
        username: verifyResult.payload.username,
        full_name: verifyResult.payload.full_name,
        is_admin: verifyResult.payload.is_admin || false,
      };
    }

    next();
  };
}
```

#### 1.3 쿠키 설정 추가

**신규 파일**: `WBSalesHub/server/config/cookie.config.ts`

```typescript
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'wbhub_access_token',
  REFRESH_TOKEN: 'wbhub_refresh_token',
} as const;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const COOKIE_CONFIG = {
  ACCESS_TOKEN: {
    name: COOKIE_NAMES.ACCESS_TOKEN,
    options: {
      httpOnly: true,
      secure: IS_PRODUCTION,  // HTTPS only in production
      sameSite: 'lax' as const,
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
      maxAge: 15 * 60 * 1000,  // 15분
    }
  },
  REFRESH_TOKEN: {
    name: COOKIE_NAMES.REFRESH_TOKEN,
    options: {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax' as const,
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7일
    }
  }
} as const;
```

**검증 포인트**:
- HubManager가 이미 쿠키 설정함 (COOKIE_SSO_HUBS에 포함)
- `/auth/sso-complete` 엔드포인트가 쿠키에서 토큰 읽음
- JWT 검증 성공 시 대시보드로 리다이렉트

---

### Phase 2: 환경변수 주입 방식 통일 및 설정 (0.2일, 1.5 WU)

#### 2.1 Doppler CLI 제거 및 .env 파일 강제 사용

**배경**:
- 현재 WBSalesHub의 `docker-start.sh`는 Doppler CLI를 우선 사용하고, Doppler 토큰이 없을 때만 `.env` 파일 사용
- 이로 인해 환경변수 관리가 이원화되어 혼란 발생
- **해결**: `.env` 파일만 사용하도록 강제하여 단일 소스 원칙(Single Source of Truth) 준수

**수정 파일**: `WBSalesHub/docker-start.sh`

**현재 코드 (라인 1-20)**:
```bash
#!/bin/bash

# Doppler 토큰이 있으면 Doppler 사용, 없으면 환경변수 사용
if [ -n "$DOPPLER_TOKEN" ]; then
  echo "✓ Using Doppler for environment variables"
  doppler run -- npm run start
else
  echo "✓ Using .env file for environment variables"
  npm run start
fi
```

**수정 후**:
```bash
#!/bin/bash

# .env 파일 강제 사용 (Doppler CLI 제거)
echo "✓ Loading environment variables from .env file"

# .env 파일 존재 확인
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "Please create .env file from .env.staging or .env.prd"
  exit 1
fi

# 환경변수 로드 확인
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set in .env file"
  exit 1
fi

echo "✓ Environment variables loaded successfully"
npm run start
```

**Dockerfile 수정** (Doppler CLI 설치 제거):
```dockerfile
# 기존 코드 (라인 80-85) - 제거
# RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
#     echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
#     apk add doppler

# 수정 후: Doppler CLI 설치 단계 완전 삭제
```

**환경변수 파일 준비**:
```bash
# 오라클 서버에서 실행
cd /home/ubuntu/workhub/WBSalesHub

# 스테이징 환경
cp .env.staging .env

# 프로덕션 환경
cp .env.prd .env
```

#### 2.2 환경변수 검증 및 설정

**파일**: `WBHubManager/.env.staging`, `WBSalesHub/.env.staging`

**WBHubManager `.env.staging` 추가**:
```env
# Cookie 도메인 설정 (필요 시 추후 사용)
COOKIE_DOMAIN=.staging.workhub.biz

# URL 확인
SALESHUB_URL=https://staging.workhub.biz/saleshub
FINHUB_URL=https://staging.workhub.biz/finhub
ONBOARDINGHUB_URL=https://staging.workhub.biz/onboarding
```

**WBSalesHub `.env.staging` 확인**:
```env
# Doppler 관련 변수 제거 (더 이상 사용하지 않음)
# DOPPLER_TOKEN=...
# DOPPLER_CONFIG=stg_wbsaleshub
# DOPPLER_ENVIRONMENT=stg
# DOPPLER_PROJECT=wbworkhub

# 필수 환경변수만 유지
DATABASE_URL=postgresql://...
HUB_MANAGER_URL=https://staging.workhub.biz
APP_URL=https://staging.workhub.biz/saleshub
BASE_URL=https://staging.workhub.biz/saleshub
PORT=4010
NODE_ENV=production
```

**검증**:
- `SALESHUB_URL` 환경변수가 `.env.staging`에 정의되어 있는지 확인
- `getHubUrl()` 함수에서 제대로 로드되는지 확인
- Doppler 관련 변수 제거 확인

#### 2.3 다른 허브에도 동일 변경 적용 (선택 사항)

**대상 프로젝트**: WBFinHub, WBOnboardingHub

**작업 순서**:
1. `docker-start.sh`에서 Doppler CLI 로직 제거
2. `Dockerfile`에서 Doppler CLI 설치 제거
3. `.env.staging`, `.env.prd` 파일 준비
4. 배포 스크립트에서 `.env` 파일 복사 로직 추가

**작업량**: 허브당 0.1일 (0.5 WU) × 2개 = 0.2일 (1 WU)

---

### Phase 3: JWT 공개키 동기화 및 검증 (0.1일, 0.5 WU)

**파일**: `WBSalesHub/server/services/jwtService.ts`, `WBSalesHub/.env.staging`

#### 3.1 공개키 로딩 로직 (WBRefHub 패턴)

**파일**: `WBSalesHub/server/services/jwtService.ts`

```typescript
import fs from 'fs';
import path from 'path';

let publicKey: string | null = null;

export function getPublicKey(): string {
  if (publicKey) {
    return publicKey;
  }

  // 1. 환경변수에서 로드 (우선순위)
  const envKey = process.env.JWT_PUBLIC_KEY;

  if (envKey) {
    // Base64 인코딩된 키인 경우 디코딩
    if (!envKey.includes('-----BEGIN')) {
      publicKey = Buffer.from(envKey, 'base64').toString('utf-8');
    } else {
      publicKey = envKey;
    }
    return publicKey;
  }

  // 2. 파일에서 로드 (폴백)
  const publicKeyPath = path.join(__dirname, '../keys/public.pem');

  if (fs.existsSync(publicKeyPath)) {
    publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    return publicKey;
  }

  throw new Error('JWT public key not found in env or file');
}
```

#### 3.2 환경변수 설정

**파일**: `WBSalesHub/.env.staging`

```env
# JWT 검증 설정
HUB_MANAGER_URL=https://staging.workhub.biz
JWT_PUBLIC_KEY=<base64-encoded-key>  # 또는 파일 경로

# 쿠키 도메인 설정
COOKIE_DOMAIN=.staging.workhub.biz

# 프론트엔드 URL
FRONTEND_URL=https://staging.workhub.biz/saleshub
APP_URL=https://staging.workhub.biz/saleshub
```

#### 3.3 공개키 파일 복사 (로컬 개발용)

```bash
# WBHubManager의 공개키를 WBSalesHub로 복사
cp /mnt/c/GitHub/WBHubManager/server/keys/public.pem \
   /mnt/c/GitHub/WBSalesHub/server/keys/public.pem
```

**검증 포인트**:
- WBHubManager와 동일한 공개키 사용
- `getPublicKey()` 함수가 정상적으로 키 반환
- JWT 검증 성공 (issuer: 'wbhubmanager')

---

### Phase 4: 로컬 테스트 (0.2일, 1.5 WU)

**테스트 시나리오**:

1. **WBHubManager 서버 시작**
   ```bash
   cd /mnt/c/GitHub/WBHubManager
   npm run dev  # 포트 3090/4090
   ```

2. **WBSalesHub 서버 시작**
   ```bash
   cd /mnt/c/GitHub/WBSalesHub
   npm run dev  # 포트 3010/4010
   ```

3. **허브 선택 플로우 테스트**
   - http://localhost:3090/hubs 접속
   - "세일즈허브" 카드 클릭
   - Google OAuth 로그인 (biz.dev@wavebridge.com)
   - 예상 결과: http://localhost:3010 대시보드로 리디렉트 ✅

4. **개발자 도구로 검증**
   - Network 탭: `/api/auth/google-callback` → 302 리디렉트 확인
   - Location 헤더: `http://localhost:3010/auth/sso-complete`
   - Application 탭: Cookies에서 `wbhub_access_token` 확인
   - 최종 리디렉트: `http://localhost:3010` (대시보드)

---

### Phase 5: 오라클 스테이징 배포 및 테스트 (0.3일, 2.5 WU)

**배포 순서**:

1. **WBSalesHub 배포** (Cookie SSO 엔드포인트 추가)
   ```bash
   cd /mnt/c/GitHub/WBSalesHub
   git add server/routes/authRoutes.ts server/middleware/cookieAuth.ts \
           server/config/cookie.config.ts server/services/jwtService.ts \
           docker-start.sh Dockerfile .env.staging
   git commit -m "feat: Add Cookie SSO support with /auth/sso-complete endpoint"
   git push origin master

   # 오라클 서버에서 배포
   ssh oracle-cloud
   cd /home/ubuntu/workhub/WBSalesHub
   ./scripts/oracle/deploy-staging.sh
   ```

2. **WBHubManager 환경변수 확인** (코드 수정 없음)
   ```bash
   ssh oracle-cloud
   cd /home/ubuntu/workhub/WBHubManager

   # 환경변수 확인 (COOKIE_DOMAIN 설정 여부)
   cat .env.staging | grep -E 'COOKIE_DOMAIN|SALESHUB_URL'

   # 이미 COOKIE_SSO_HUBS에 포함되어 있으므로 코드 수정 불필요
   ```

3. **E2E 테스트 (HWTestAgent)**
   ```bash
   cd /home/peterchung/HWTestAgent
   npx playwright test tests/e2e-oracle-staging-saleshub-login.spec.ts
   ```

**검증 항목**:
- https://staging.workhub.biz:4400/hubs 접속
- "세일즈허브" 클릭
- Google OAuth 로그인 (biz.dev@wavebridge.com)
- 예상 결과: https://staging.workhub.biz:4400/saleshub 대시보드 ✅

---

## 수정 대상 파일

### 기존 파일 수정
1. `WBHubManager/.env.staging` (COOKIE_DOMAIN 추가)
2. **`WBSalesHub/docker-start.sh` (Doppler CLI 로직 제거)**
3. **`WBSalesHub/Dockerfile` (Doppler CLI 설치 제거, 라인 80-85)**
4. **`WBSalesHub/.env.staging` (Doppler 관련 변수 제거, COOKIE_DOMAIN 추가)**
5. **`WBSalesHub/server/routes/authRoutes.ts` (기존 파일에 /auth/sso-complete 추가)**
6. **`WBSalesHub/server/index.ts` (라우터 및 미들웨어 등록)**

### 신규 파일 생성
1. **`WBSalesHub/server/middleware/cookieAuth.ts` (WBRefHub 패턴)**
2. **`WBSalesHub/server/config/cookie.config.ts` (WBRefHub 패턴)**
3. **`WBSalesHub/server/services/jwtService.ts` (공개키 로딩 로직, WBRefHub 패턴)**
4. **`WBSalesHub/server/keys/public.pem` (WBHubManager에서 복사)**

---

## 검증 방법

### 1. 로컬 환경 검증

**테스트 명령어**:
```bash
# 브라우저 개발자 도구 Network 탭 확인
# 1. /api/auth/google-callback 응답 확인
#    - Status: 302
#    - Set-Cookie: wbhub_access_token=eyJ...; HttpOnly; SameSite=Lax
#    - Location: http://localhost:3010/auth/sso-complete

# 2. /auth/sso-complete 페이지 로드 확인
#    - Status: 302
#    - 쿠키에서 토큰 읽어 JWT 검증
#    - Location: http://localhost:3010/

# 3. Application 탭 → Cookies 확인
#    - wbhub_access_token 쿠키 존재 확인
#    - Domain: localhost (로컬), .staging.workhub.biz (스테이징)
```

### 2. 오라클 스테이징 검증

**Playwright 테스트**:
```typescript
// tests/e2e-oracle-staging-saleshub-login.spec.ts
test('WBSalesHub OAuth login from HubManager', async ({ page }) => {
  // 1. HubManager 허브 선택 페이지
  await page.goto('https://staging.workhub.biz:4400/hubs');

  // 2. 세일즈허브 클릭
  await page.click('text=세일즈허브');

  // 3. Google OAuth 로그인
  await loginWithGoogle(page, {
    email: 'biz.dev@wavebridge.com',
    password: 'wave1234!!',
    redirectPath: '/saleshub'
  });

  // 4. 대시보드 확인
  await expect(page).toHaveURL(/\/saleshub/);
  await expect(page.locator('text=대시보드')).toBeVisible();
});
```

### 3. 네트워크 로그 확인

**오라클 서버 로그**:
```bash
# WBHubManager 로그
ssh oracle-cloud
docker logs -f wbhubmanager-staging 2>&1 | grep "Cookie SSO"
# 예상 출력: 🍪 [wbsaleshub] Cookie SSO 적용
# 예상 출력: 🔗 Redirecting to https://staging.workhub.biz/saleshub/auth/sso-complete

# WBSalesHub 로그
docker logs -f wbsaleshub-staging 2>&1 | grep "SSO Complete"
# 예상 출력: ✅ SSO Complete - User authenticated: biz.dev@wavebridge.com
```

---

## 예상 문제 및 대응

| 문제 | 원인 | 대응 방안 |
|------|------|----------|
| `/auth/sso-complete` 404 에러 | 엔드포인트 미등록 | `server/index.ts`에 라우터 등록 확인 |
| JWT 토큰 검증 실패 | 공개키 파일 부재 | WBHubManager의 `public.pem` 복사 |
| 쿠키를 읽을 수 없음 | 쿠키 도메인 불일치 | `COOKIE_DOMAIN=.staging.workhub.biz` 설정 |
| "No access token in cookie" | HubManager 쿠키 설정 실패 | HubManager 로그 확인, `COOKIE_SSO_HUBS` 확인 |
| 토큰 만료 | JWT maxAge 설정 | 환경변수 확인 (기본 15분) |

---

## 롤백 계획

수정 사항이 실패하는 경우:

```bash
# WBSalesHub 롤백 (Cookie SSO 변경 취소)
cd /mnt/c/GitHub/WBSalesHub
git revert HEAD
git push origin master

# 오라클 서버 롤백
ssh oracle-cloud
cd /home/ubuntu/workhub/WBSalesHub
./scripts/oracle/rollback-staging.sh

# HubManager는 변경사항 없음 (이미 COOKIE_SSO_HUBS에 포함)
```

---

## 작업 완료 체크리스트

### Cookie SSO 구현 (WBRefHub 패턴)
- [x] Phase 1.1: WBSalesHub `/auth/sso-complete` 엔드포인트 추가 ✅
- [x] Phase 1.2: WBSalesHub `cookieAuth.ts` 미들웨어 추가 ✅
- [x] Phase 1.3: WBSalesHub `cookie.config.ts` 설정 파일 추가 ✅
- [x] Phase 2.1: WBSalesHub Doppler CLI 제거 (`docker-start.sh`, `Dockerfile`) ✅
- [x] Phase 2.2: 환경변수 확인 및 `JWT_PUBLIC_KEY` 추가 ✅
- [x] Phase 3: WBSalesHub `jwtService.ts` 공개키 로딩 로직 추가 (ES Modules 대응) ✅

### 테스트 및 배포
- [x] Phase 4: 로컬 환경 테스트 (생략 - 직접 스테이징 배포) ✅
- [x] Phase 5: 오라클 스테이징 배포 ✅
- [x] Phase 6: E2E 테스트 (Playwright) - **PASS** ✅
- [x] Phase 7: 네트워크 로그 검증 ✅

### 문서화
- [x] Phase 8: 작업기록 작성 및 Git 커밋 ✅
- [ ] 환경변수 가이드 업데이트 (Doppler 제거 내용 추가) - 선택 사항

### 추가 작업 (선택)
- [ ] Phase 2.3: WBFinHub Doppler CLI 제거
- [ ] Phase 2.3: WBOnboardingHub Doppler CLI 제거

---

## 🎉 작업 완료 요약 (2026-01-16)

**완료 상태**: ✅ **성공적으로 완료**

### 핵심 성과
- ✅ Cookie SSO 엔드포인트 구현 완료
- ✅ 오라클 스테이징 배포 성공
- ✅ E2E 테스트 통과 (Google OAuth → Cookie 인증 → API 접근)
- ✅ 6개 이슈 해결 (ES Modules, JWT 키, URL 포트 등)

### 실제 작업량
- **예상**: 1.1일 (8.5 WU)
- **실제**: 0.9일 (7.5 WU) - Phase 4 로컬 테스트 생략으로 단축
- **작업 시간**: 약 4시간 (디버깅 포함)

### 작업기록
- 파일: `/home/peterchung/WHCommon/작업기록/완료/2026-01-16-cookie-sso-implementation.md`
- Git 커밋: `0614287` - "docs: 세일즈허브 Cookie SSO 구현 작업기록 추가"

### 최종 결과
```
🧪 E2E Test Result: ✅ PASS (1 passed, 1 skipped)
- Google OAuth 인증: ✅
- Cookie 발급 및 검증: ✅
- SSO Complete 플로우: ✅
- API 인증: ✅ (biz.dev@wavebridge.com)
```

---

## 총 작업량

- **예상 시간**: 1.1일 (8.5 WU)
- **파일 수**: 10개 (신규 4개 + 기존 수정 6개)
- **복잡도**: 중간

**세부 작업량**:
| Phase | 작업 | 작업량 |
|-------|------|--------|
| 1 | WBSalesHub Cookie SSO 엔드포인트 구현 | 0.3일 (2 WU) |
| 2.1 | Doppler CLI 제거 (docker-start.sh, Dockerfile) | 0.2일 (1.5 WU) |
| 2.2 | 환경변수 설정 및 검증 | 0.1일 (0.5 WU) |
| 3 | WBSalesHub JWT 공개키 로딩 구현 | 0.1일 (0.5 WU) |
| 4 | 로컬 테스트 | 0.2일 (1.5 WU) |
| 5 | 스테이징 배포 및 테스트 | 0.2일 (1.5 WU) |
| 6 | 문서 작성 | 0.1일 (1 WU) |

**추가 작업 (선택)**:
| Phase | 작업 | 작업량 |
|-------|------|--------|
| 2.3 | 다른 허브 Doppler 제거 (FinHub, OnboardingHub) | 0.2일 (1 WU) |

---

## 참고 문서

- **WBHubManager authRoutes**: `/mnt/c/GitHub/WBHubManager/server/routes/authRoutes.ts`
- **WBSalesHub callback 페이지**: `/mnt/c/GitHub/WBSalesHub/frontend/app/(auth)/callback/page.tsx`
- **WBSalesHub JWT 미들웨어**: `/mnt/c/GitHub/WBSalesHub/server/middleware/jwt.ts`
- **배포 가이드**: `/home/peterchung/WHCommon/문서/가이드/배포-가이드-오라클.md`
- **E2E 테스트 가이드**: `~/.claude/skills/스킬테스터/E2E-테스트-가이드.md`

---

**플랜 작성일**: 2026-01-16 (21:00 KST)
**작성자**: Claude Code
**상태**: 사용자 승인 대기
