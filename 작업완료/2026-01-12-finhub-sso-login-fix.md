# WBFinHub SSO 로그인 URL 수정

**날짜**: 2026-01-12
**작업자**: Claude Code
**상태**: ✅ 완료

## 문제 상황

### 증상
- 핀허브(`localhost:3020`)에 접속 시 무한 리디렉트 루프 발생
- 리디렉트 URL: `http://localhost:3090/login?app=finhub&redirect=%2Flogin`
- 허브매니저에 `/login` 페이지가 존재하지 않아 404 에러 발생

### 근본 원인
핀허브가 **잘못된 허브매니저 로그인 URL**을 사용하고 있었음:

**잘못된 URL** (기존):
```
http://localhost:3090/login?app=finhub&redirect=/login
```

**올바른 URL** (수정 후):
```
http://localhost:3090/api/auth/google-oauth?redirect_uri=http://localhost:3020/auth/callback&hub_id=finhub
```

### 코드 위치
- `/home/peterchung/WBFinHub/frontend/lib/api-client.ts` (147, 221번 줄)
- `/home/peterchung/WBFinHub/frontend/providers/AuthProvider.tsx` (76, 86번 줄)

## 해결 방법

### 참조 패턴
세일즈허브(`WBSalesHub`)의 구현 패턴을 참조:
- `/home/peterchung/WBSalesHub/frontend/lib/api-client.ts` (187-196번 줄)
- 헬퍼 함수 사용: `getLoginUrl()`, `getLogoutUrl()`, `setTokens()`, `clearTokens()`, `hasTokens()`

### 수정 내용

#### 1. `/home/peterchung/WBFinHub/frontend/lib/api-client.ts`

**추가된 헬퍼 함수**:
```typescript
/**
 * 토큰 저장
 */
export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
}

/**
 * 토큰 삭제
 */
export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

/**
 * 토큰 존재 여부 확인
 */
export function hasTokens(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('accessToken');
  }
  return false;
}

/**
 * HubManager 로그인 URL 가져오기
 * HubManager의 Google OAuth 엔드포인트로 직접 연결
 */
export function getLoginUrl(redirect?: string): string {
  const HUB_ID = process.env.NEXT_PUBLIC_HUB_ID || 'finhub';
  const HUB_CALLBACK_URL = process.env.NEXT_PUBLIC_HUB_CALLBACK_URL || 'http://localhost:3020/auth/callback';
  // Use new redirect_uri flow with hub_id
  return `${HUB_MANAGER_URL}/api/auth/google-oauth?redirect_uri=${encodeURIComponent(HUB_CALLBACK_URL)}&hub_id=${HUB_ID}`;
}

/**
 * HubManager 로그아웃 URL
 */
export function getLogoutUrl(): string {
  return `${HUB_MANAGER_URL}/logout`;
}
```

**수정된 에러 핸들러** (147, 221번 줄):
```typescript
// Before (잘못된 URL 사용)
if (typeof window !== 'undefined') {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  const currentPath = window.location.pathname;
  const loginUrl = `${HUB_MANAGER_URL}/login?app=finhub&redirect=${encodeURIComponent(currentPath)}`;
  window.location.href = loginUrl;
}

// After (헬퍼 함수 사용)
if (typeof window !== 'undefined') {
  clearTokens();
  window.location.href = getLoginUrl();
}
```

#### 2. `/home/peterchung/WBFinHub/frontend/providers/AuthProvider.tsx`

**Import 추가**:
```typescript
import { getLoginUrl, getLogoutUrl } from '@/lib/api-client';
```

**login() 함수 수정**:
```typescript
// Before
export function login(redirectPath?: string) {
  const oauthUrl = new URL('/api/auth/google-oauth', HUB_MANAGER_URL);
  oauthUrl.searchParams.set('redirect_uri', HUB_CALLBACK_URL);
  oauthUrl.searchParams.set('hub_id', HUB_ID);

  console.log('🔗 Redirecting to HubManager OAuth:', oauthUrl.toString());
  window.location.href = oauthUrl.toString();
}

// After
export function login(redirectPath?: string) {
  const loginUrl = getLoginUrl(redirectPath);
  console.log('🔗 Redirecting to HubManager OAuth:', loginUrl);
  window.location.href = loginUrl;
}
```

**logout() 함수 수정**:
```typescript
// Before
export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  const logoutUrl = `${HUB_MANAGER_URL}/logout?redirect=${encodeURIComponent(window.location.origin + '/login')}`;
  window.location.href = logoutUrl;
}

// After
export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  window.location.href = getLogoutUrl();
}
```

#### 3. 환경변수 설정

`/home/peterchung/WBFinHub/frontend/.env.local`에 추가:
```env
NEXT_PUBLIC_HUB_ID=finhub
NEXT_PUBLIC_HUB_CALLBACK_URL=http://localhost:3020/auth/callback
```

## 테스트 결과

### 서비스 상태 확인
```bash
# FinHub Frontend
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3020
# Status: 200 ✅

# FinHub Backend
curl -s http://localhost:4020/api/health
# {"success":true,"message":"WBFinHub API is running","timestamp":"2026-01-12T13:46:59.523Z","port":"4020"} ✅
```

### 예상 동작 흐름
1. 사용자가 `http://localhost:3020` 접속
2. 인증 체크: 토큰 없음 → `/login` 페이지로 리디렉트
3. "WBHubManager로 로그인" 버튼 클릭
4. **올바른 URL로 리디렉트**: `http://localhost:3090/api/auth/google-oauth?redirect_uri=http://localhost:3020/auth/callback&hub_id=finhub`
5. 허브매니저 Google OAuth 인증
6. 콜백: `http://localhost:3020/auth/callback?accessToken=...&refreshToken=...`
7. 토큰 저장 후 대시보드로 이동

## 기타 이슈

### 허브매니저 DB 연결 문제
테스트 중 허브매니저 백엔드(4090)가 PostgreSQL 연결 실패:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**원인**: 로컬 PostgreSQL이 TCP 연결을 받지 않음 (Unix socket만 사용)

**해결 방법** (선택):
1. PostgreSQL `pg_hba.conf`에서 TCP 연결 허용
2. 오라클 클라우드 DB 사용 (SSH 터널링)
3. Docker PostgreSQL 사용

## 패턴 일관성

이제 모든 허브가 동일한 SSO 로그인 패턴을 사용:

| 허브 | getLoginUrl() | getLogoutUrl() | 상태 |
|------|--------------|----------------|------|
| WBHubManager | ✅ | ✅ | 기준 |
| WBSalesHub | ✅ | ✅ | 참조 |
| **WBFinHub** | ✅ | ✅ | **수정 완료** |
| WBOnboardingHub | ? | ? | 확인 필요 |

## 다음 작업

- [ ] WBOnboardingHub의 SSO 로그인 패턴 확인 및 통일
- [ ] 로컬 PostgreSQL TCP 연결 설정 또는 Docker 환경 구성
- [ ] E2E 테스트: 전체 SSO 인증 플로우 검증

## 참고 문서

- `/home/peterchung/WHCommon/claude-context.md` - 프로젝트 컨텍스트
- `/home/peterchung/WBSalesHub/frontend/lib/api-client.ts` - 참조 구현
- `/home/peterchung/WBSalesHub/frontend/components/providers/AuthProvider.tsx` - 참조 구현

---

**작업 완료**: 2026-01-12 22:47 KST
**검증 상태**: 핀허브 서비스 정상 실행 확인 ✅
**추가 테스트 필요**: 허브매니저 연동 E2E 테스트 (DB 설정 후)
