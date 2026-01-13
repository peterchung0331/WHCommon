# PRD: Hub SSO Redirect 개선

## 1. Introduction/Overview

현재 사용자가 각 허브(WBFinHub, WBSalesHub 등)의 URL로 직접 접근하여 로그인할 때, HubManager의 OAuth 인증 후 허브 선택 화면으로 이동하는 문제가 있습니다. 사용자는 원래 접근하려던 허브로 바로 돌아가야 하지만, 현재는 다시 허브를 선택해야 하는 불편함이 있습니다.

이 기능은 사용자가 직접 각 허브 URL로 접근했을 때, OAuth 인증 후 자동으로 원래 허브로 리다이렉트되도록 개선합니다.

**기대 플로우:**
1. 사용자가 `http://workhub.biz/finhub` 직접 접근
2. FinHub 로그인 화면 표시
3. "HubManager로 로그인" 버튼 클릭
4. HubManager OAuth 인증 (Google 등)
5. JWT 토큰 발급
6. **자동으로 FinHub 대시보드로 리다이렉트** ✨ (개선 사항)

## 2. Goals

1. 사용자가 각 허브 URL로 직접 접근 시, OAuth 후 원래 허브로 자동 리다이렉트
2. 마지막 접속 허브를 기억하여, 다음 로그인 시 자동으로 해당 허브로 이동
3. redirect_uri가 없는 경우(HubManager 메인으로 접근) 허브 선택 화면 표시 (기존 동작 유지)
4. 모든 허브(FinHub, SalesHub, 향후 추가될 허브)에 적용 가능한 확장 가능한 구조
5. 보안: 허용된 도메인만 리다이렉트 가능하도록 whitelist 검증

## 3. User Stories

### Story 1: 직접 허브 접근
**As a** FinHub 사용자
**I want to** `http://workhub.biz/finhub`로 직접 접근하여 로그인
**So that** OAuth 인증 후 자동으로 FinHub 대시보드로 이동할 수 있다

**Acceptance Criteria:**
- FinHub 로그인 화면에서 "HubManager로 로그인" 클릭 시 `redirect_uri` 파라미터 포함
- HubManager OAuth 완료 후 자동으로 FinHub 대시보드로 리다이렉트
- URL: `http://workhub.biz/finhub/` (대시보드)

### Story 2: 마지막 접속 허브 기억
**As a** 반복 사용자
**I want to** HubManager로 로그인할 때 마지막 접속한 허브로 자동 이동
**So that** 매번 허브를 선택하는 번거로움을 줄일 수 있다

**Acceptance Criteria:**
- 마지막 접속 허브 정보가 JWT 또는 쿠키에 저장됨
- `redirect_uri` 없이 HubManager로 로그인 시, 마지막 허브로 자동 리다이렉트
- 마지막 접속 허브가 없으면 허브 선택 화면 표시

### Story 3: HubManager 메인 접근
**As a** 허브 관리자
**I want to** HubManager 메인으로 직접 접근
**So that** 여러 허브 중 선택할 수 있다

**Acceptance Criteria:**
- HubManager 메인 URL(`http://workhub.biz`)로 접근 시 허브 선택 화면 표시
- 마지막 접속 허브가 있어도, 명시적으로 선택 화면을 원하는 경우 표시 가능

## 4. Functional Requirements

### 4.1 각 허브(FinHub, SalesHub 등) 요구사항

**FR-1:** 로그인 화면에서 "HubManager로 로그인" 버튼 클릭 시, 다음 파라미터를 포함하여 HubManager로 리다이렉트해야 함:
- `redirect_uri`: 현재 허브의 callback URL (예: `http://workhub.biz/finhub/auth/callback`)
- `hub_id`: 허브 식별자 (예: `finhub`, `saleshub`)

**예시:**
```
http://workhub.biz/auth/google?redirect_uri=http://workhub.biz/finhub/auth/callback&hub_id=finhub
```

**FR-2:** 각 허브는 `/auth/callback` 엔드포인트를 구현해야 함:
- Query parameter로 전달된 JWT 토큰(`token`)을 localStorage에 저장
- 토큰 검증 후 대시보드로 리다이렉트

**FR-3:** 각 허브는 `hub_id`를 환경변수 또는 설정 파일에 정의해야 함:
- WBFinHub: `HUB_ID=finhub`
- WBSalesHub: `HUB_ID=saleshub`
- 향후 추가 허브: 고유한 `hub_id` 사용

### 4.2 HubManager 요구사항

**FR-4:** OAuth 엔드포인트(`/auth/google`, `/auth/callback` 등)는 `redirect_uri`와 `hub_id` 파라미터를 받아서 OAuth state에 저장해야 함

**FR-5:** OAuth 인증 완료 후, state에서 `redirect_uri`와 `hub_id`를 복원하여:
- JWT 토큰을 발급
- `redirect_uri`로 리다이렉트 (토큰을 query parameter로 전달: `?token=<jwt>`)

**FR-6:** `redirect_uri` whitelist 검증:
- 허용된 도메인 목록: `http://workhub.biz`, `http://158.180.95.246`, `http://localhost` (개발용)
- 허용된 경로 패턴: `/finhub/*`, `/saleshub/*`, `/[hub_id]/*`
- 검증 실패 시 에러 메시지 표시 및 허브 선택 화면으로 리다이렉트

**FR-7:** 마지막 접속 허브 기억 기능:
- JWT payload에 `last_hub_id` 필드 추가
- 사용자가 허브 접속 시 해당 `hub_id`를 JWT에 저장
- `redirect_uri` 없이 로그인 시, `last_hub_id`를 확인하여 자동 리다이렉트

**FR-8:** `redirect_uri` 없이 로그인하는 경우:
- `last_hub_id`가 있으면: 해당 허브로 자동 리다이렉트
- `last_hub_id`가 없으면: 허브 선택 화면(`/hubs`) 표시

**FR-9:** 허브 선택 화면에서 명시적으로 허브 선택 시:
- 선택한 허브의 `hub_id`를 JWT에 저장
- 해당 허브로 리다이렉트

### 4.3 보안 요구사항

**FR-10:** `redirect_uri` 검증 로직:
```typescript
const ALLOWED_REDIRECT_DOMAINS = [
  'http://workhub.biz',
  'https://workhub.biz',
  'http://158.180.95.246',
  'http://localhost:3010', // SalesHub dev
  'http://localhost:3020', // FinHub dev
  'http://localhost:3090', // HubManager dev
];

function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return ALLOWED_REDIRECT_DOMAINS.some(domain => {
      const allowedUrl = new URL(domain);
      return url.protocol === allowedUrl.protocol &&
             url.hostname === allowedUrl.hostname &&
             (url.port === allowedUrl.port || allowedUrl.port === '');
    });
  } catch {
    return false;
  }
}
```

**FR-11:** OAuth state 암호화:
- `redirect_uri`와 `hub_id`를 포함한 state를 암호화하여 전달
- 외부에서 state를 변조할 수 없도록 HMAC 또는 JWT 서명 사용

## 5. Non-Goals (Out of Scope)

- ❌ 외부 도메인으로의 리다이렉트 지원 (보안상 내부 도메인만 허용)
- ❌ 여러 허브를 동시에 열어두는 멀티탭 세션 관리
- ❌ SSO 로그아웃 시 모든 허브에서 동시 로그아웃 (향후 구현)
- ❌ 모바일 앱 deep link 지원 (현재는 웹만)

## 6. Design Considerations

### 6.1 URL 구조

**각 허브의 OAuth 시작 URL:**
```
http://workhub.biz/auth/google?redirect_uri=http://workhub.biz/finhub/auth/callback&hub_id=finhub
```

**각 허브의 Callback URL:**
```
http://workhub.biz/finhub/auth/callback?token=<jwt_token>
```

### 6.2 UI 변경 사항

- 각 허브의 로그인 화면: 변경 없음 (기존 "HubManager로 로그인" 버튼 사용)
- HubManager 허브 선택 화면: 변경 없음 (기존 UI 유지)

### 6.3 플로우 다이어그램

```
[사용자] --> http://workhub.biz/finhub
    |
    v
[FinHub 로그인 화면]
    |
    | "HubManager로 로그인" 클릭
    v
http://workhub.biz/auth/google?redirect_uri=...&hub_id=finhub
    |
    v
[Google OAuth 인증]
    |
    v
[HubManager] JWT 발급 + last_hub_id 저장
    |
    v
http://workhub.biz/finhub/auth/callback?token=<jwt>
    |
    v
[FinHub] 토큰 저장 + 대시보드 리다이렉트
    |
    v
[FinHub 대시보드] ✅
```

## 7. Technical Considerations

### 7.1 OAuth State 관리

HubManager의 OAuth state 구조:
```typescript
interface OAuthState {
  redirect_uri?: string;
  hub_id?: string;
  nonce: string; // CSRF 방지
  timestamp: number; // state 만료 시간 검증
}

// State를 JWT로 서명하여 전달
const state = jwt.sign(oauthState, JWT_SECRET, { expiresIn: '10m' });
```

### 7.2 JWT Payload 확장

JWT에 `last_hub_id` 필드 추가:
```typescript
interface JWTPayload {
  sub: string; // account_id
  email: string;
  username: string;
  role: string;
  status: string;
  last_hub_id?: string; // 추가
  iat: number;
  exp: number;
  iss: string;
  aud: string[];
}
```

### 7.3 환경변수

각 허브의 `.env` 파일:
```bash
# WBFinHub
HUB_ID=finhub
HUB_CALLBACK_URL=http://workhub.biz/finhub/auth/callback

# WBSalesHub
HUB_ID=saleshub
HUB_CALLBACK_URL=http://workhub.biz/saleshub/auth/callback
```

### 7.4 데이터베이스 변경

- ❌ 데이터베이스 스키마 변경 불필요 (JWT에만 저장)
- 향후 필요시 `accounts` 테이블에 `last_hub_id` 컬럼 추가 가능

## 8. Success Metrics

1. **사용자 경험 개선**
   - OAuth 후 추가 클릭 없이 원래 허브로 리다이렉트 성공률: 95% 이상
   - 평균 로그인 완료 시간: 20% 감소 (허브 선택 단계 제거)

2. **기능 정확성**
   - `redirect_uri` 파라미터가 있는 경우 정확한 허브로 리다이렉트: 100%
   - 마지막 접속 허브 기억 기능 작동률: 100%
   - Whitelist 검증 실패 시 안전하게 허브 선택 화면으로 fallback: 100%

3. **보안**
   - 허용되지 않은 도메인으로의 리다이렉트 시도 차단: 100%
   - OAuth state 변조 시도 탐지 및 차단: 100%

## 9. Open Questions

1. **마지막 접속 허브 저장 위치**
   - Q: JWT에만 저장할지, 데이터베이스에도 저장할지?
   - A: 초기에는 JWT에만 저장. 향후 사용자 프로필 기능 추가 시 DB에도 저장 고려

2. **개발 환경 localhost 처리**
   - Q: 각 허브가 다른 포트(3010, 3020)를 사용하는데, whitelist에 모두 추가해야 하는가?
   - A: 개발 환경에서는 `localhost` 도메인의 모든 포트 허용 고려

3. **허브 추가 시 확장성**
   - Q: 새로운 허브 추가 시 HubManager 코드 수정이 필요한가?
   - A: Whitelist에 패턴 매칭(`/[a-z]+/auth/callback`) 사용하여 자동으로 허용

4. **에러 처리**
   - Q: redirect_uri로 리다이렉트 실패 시 어떻게 처리?
   - A: 에러 로그 남기고 허브 선택 화면으로 fallback

---

**작성일:** 2026-01-02
**버전:** 1.0
**작성자:** Claude Code
