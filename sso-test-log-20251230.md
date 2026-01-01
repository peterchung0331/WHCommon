# SSO 자동 로그인 테스트 로그

**테스트 일시:** 2025-12-30
**테스트 환경:** ngrok 터널 사용 (로컬 → 프로덕션)
**테스트 목표:** 로컬 WBHubManager → 프로덕션 WBFinHub SSO 자동 로그인

---

## 테스트 환경 구성

### 1. SalesHubApiClient localhost URL 수정 ✅

**파일:** `c:\GitHub\WBFinHub\server\services\salesHubApiClient.ts`

**변경 내용:**
```typescript
// Before:
const baseURL = process.env.WB_SALES_HUB_API_URL || 'http://localhost:4000';

// After:
const baseURL = process.env.WB_SALES_HUB_API_URL || 'https://wbsaleshub.up.railway.app';
```

**상태:** ✅ 완료

---

### 2. ngrok 설치 및 업데이트 ✅

**초기 버전:** 3.3.1 (너무 오래됨)
**업데이트 버전:** 3.34.1

**실행 명령:**
```bash
ngrok version  # 3.3.1 확인
ngrok update   # 3.34.1로 업데이트 성공
```

**상태:** ✅ 완료

---

### 3. ngrok 터널 시작 ✅

**실행 명령:**
```bash
ngrok http 4090 --log=stdout
```

**터널 정보:**
```
Session Status: online
Forwarding:     https://violently-verrucous-carlyn.ngrok-free.dev -> http://localhost:4090
Web Interface:  http://127.0.0.1:4040
```

**ngrok URL:** `https://violently-verrucous-carlyn.ngrok-free.dev`

**상태:** ✅ 완료 (백그라운드 실행 중)

---

## 수동 구성 필요 사항

### 4. Google OAuth 콜백 URL 업데이트 ⚠️ 수동 작업 필요

**Google Cloud Console 접속:**
1. https://console.cloud.google.com/ 접속
2. 프로젝트 선택: WBHubManager 또는 해당 프로젝트
3. **APIs & Services** → **Credentials** 메뉴
4. OAuth 2.0 클라이언트 ID 클릭

**승인된 리디렉션 URI 추가:**
```
https://violently-verrucous-carlyn.ngrok-free.dev/api/auth/google-callback
```

**중요:**
- 기존 프로덕션 URL은 유지할 것
- ngrok URL은 테스트 종료 후 제거할 것

**상태:** ⚠️ 수동 작업 대기 중

---

### 5. 로컬 .env 파일 업데이트 ⚠️ 수동 작업 필요

**파일 위치:** `c:\GitHub\WBHubManager\.env`

**변경 내용:**
```bash
# 기존 APP_URL 주석 처리 또는 변경
# APP_URL=http://localhost:4090

# ngrok URL로 임시 변경
APP_URL=https://violently-verrucous-carlyn.ngrok-free.dev
```

**상태:** ⚠️ 수동 작업 대기 중

---

### 6. 로컬 데이터베이스 hubs 테이블 확인 ⚠️ 확인 필요

**확인할 쿼리:**
```sql
SELECT id, name, slug, url, is_active FROM hubs WHERE slug = 'wbfinhub';
```

**기대 결과:**
```
id | name      | slug      | url                                   | is_active
---+-----------+-----------+---------------------------------------+----------
?  | WB FinHub | wbfinhub  | https://wbfinhub.up.railway.app       | true
```

**URL이 다른 경우 업데이트:**
```sql
UPDATE hubs
SET url = 'https://wbfinhub.up.railway.app'
WHERE slug = 'wbfinhub';
```

**상태:** ⚠️ 확인 필요

---

## 테스트 실행 절차

### 7. 로컬 WBHubManager 서버 시작

**실행 명령:**
```bash
cd c:\GitHub\WBHubManager
npm run dev
```

**확인 사항:**
- 서버가 포트 4090에서 실행되고 있는지 확인
- PostgreSQL 연결 성공 확인
- 에러 로그 없는지 확인

**상태:** 대기 중

---

### 8. SSO 자동 로그인 테스트 실행

#### Step 1: ngrok URL로 Hub 선택 페이지 접속
```
https://violently-verrucous-carlyn.ngrok-free.dev/hubs
```

**예상 동작:**
- WBHubManager의 Hub 선택 페이지가 표시됨
- WB FinHub, WB Docs 카드가 보임

#### Step 2: WBFinHub 버튼 클릭
**예상 동작:**
- Google OAuth 승인 화면으로 리다이렉트
- Google 계정 선택 화면 표시

#### Step 3: Google 계정 선택 및 승인
**예상 동작:**
- 권한 승인 완료
- WBHubManager Google OAuth 콜백 호출: `/api/auth/google-callback`

#### Step 4: JWT 토큰 생성 및 전송
**로컬 서버 로그 확인 (예상):**
```
✅ Google OAuth callback received
✅ Google user info retrieved: your-email@example.com
✅ User upserted into database
✅ Session created for user: your-email@example.com
🎫 Generating Hub SSO token...
✅ Hub SSO token generated successfully
📦 Token Payload: {
  sub: "123",
  email: "your-email@example.com",
  username: "your-username",
  is_admin: false,
  type: "access",
  iat: ...,
  exp: ...
}
✅ Hub URL: https://wbfinhub.up.railway.app
🔗 Redirecting to Hub SSO: https://wbfinhub.up.railway.app/auth/sso?token=JWT...
```

#### Step 5: WBFinHub SSO 엔드포인트 처리
**Railway 로그 확인 (예상):**
```
📥 SSO login request received
🔐 Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
📤 Verifying token with HubManager...
✅ Token verification successful
✅ User authenticated: your-email@example.com
💾 Storing tokens in localStorage
🔗 Redirecting to dashboard
```

#### Step 6: 자동 로그인 성공 확인
**성공 조건:** ✅
- WBFinHub 로그인 화면 없이 바로 대시보드로 진입
- 대시보드 URL: `https://wbfinhub.up.railway.app/dashboard`
- 상단 네비게이션 바에 사용자 이름 표시

**실패 조건:** ❌
- `/login` 페이지로 리다이렉트
- `/login?error=invalid_token` 페이지로 리다이렉트
- 에러 메시지 표시

**상태:** 대기 중

---

## 테스트 완료 후 정리

### 9. Google OAuth 콜백 URL 복원
Google Cloud Console에서 ngrok URL 제거:
```
삭제: https://violently-verrucous-carlyn.ngrok-free.dev/api/auth/google-callback
유지: https://wbhub.up.railway.app/api/auth/google-callback
```

### 10. 로컬 .env 파일 복원
```bash
# c:\GitHub\WBHubManager\.env
APP_URL=http://localhost:4090
```

### 11. ngrok 터널 종료
```bash
# ngrok 실행 중인 터미널 또는 백그라운드 작업 종료
# Task ID: b866876
```

---

## 디버깅 정보

### 브라우저 개발자 도구 확인 사항

#### Network 탭
- [ ] Google OAuth 요청이 정상적으로 전송되는지
- [ ] `/api/auth/google-callback` 응답이 302 리다이렉트인지
- [ ] Hub SSO 엔드포인트 요청 URL 형식: `/auth/sso?token=...`

#### Console 탭
- [ ] JavaScript 에러가 없는지
- [ ] API 요청 로그 확인
- [ ] localStorage에 토큰이 저장되는지 (WBFinHub)

#### Application 탭
- [ ] Cookies에 `wbhub.sid` 세션 쿠키가 있는지 (WBHubManager)
- [ ] localStorage에 `accessToken`, `refreshToken`이 있는지 (WBFinHub)

### 로그 파일 위치
- **로컬 WBHubManager 서버 로그:** 콘솔 출력
- **프로덕션 WBFinHub 로그:** Railway 대시보드
- **ngrok 로그:** http://127.0.0.1:4040/inspect/http

---

## 문제 해결 가이드

### 문제 1: redirect_uri_mismatch
**원인:** Google OAuth 콜백 URL이 일치하지 않음

**해결:**
1. Google Cloud Console에서 ngrok URL이 정확히 추가되었는지 확인
2. 로컬 `.env` 파일의 `APP_URL`이 ngrok URL과 일치하는지 확인
3. 로컬 서버 재시작

### 문제 2: JWT 토큰 검증 실패
**원인:** 토큰 형식 불일치 또는 JWT 키 불일치

**확인 사항:**
- [ ] 로컬 `JWT_PRIVATE_KEY`와 프로덕션 `JWT_PUBLIC_KEY`가 같은 쌍인지
- [ ] 토큰 페이로드에 `sub`, `type: 'access'`, `aud` 필드가 있는지
- [ ] `iss: 'wbhubmanager'`, `aud: ['wbsaleshub', 'wbfinhub']` 값이 맞는지

**디버깅:**
```bash
# 로컬에서 JWT 토큰 테스트 스크립트 실행
node c:\GitHub\WBHubManager\scripts\test-sso-token.cjs
```

### 문제 3: 세션 생성 실패
**원인:** PostgreSQL 연결 문제 또는 세션 테이블 없음

**확인:**
```sql
-- PostgreSQL 연결 확인
SELECT version();

-- 세션 테이블 존재 확인
SELECT * FROM session LIMIT 1;
```

---

## 테스트 결과 요약

**테스트 일시:** 2025-12-30
**테스트 환경:** ngrok 터널 (로컬 → 프로덕션)

### 완료된 작업
- [x] SalesHubApiClient localhost URL 수정
- [x] ngrok 설치 및 업데이트 (3.3.1 → 3.34.1)
- [x] ngrok 터널 시작 (포트 4090)
- [x] ngrok URL 획득: `https://violently-verrucous-carlyn.ngrok-free.dev`
- [x] 테스트 환경 설정 문서 생성
- [x] 테스트 로그 문서 생성

### 수동 작업 필요
- [ ] Google OAuth 콜백 URL 업데이트 (Google Cloud Console)
- [ ] 로컬 `.env` 파일 APP_URL 업데이트
- [ ] 로컬 데이터베이스 hubs 테이블 확인
- [ ] 로컬 WBHubManager 서버 시작
- [ ] SSO 자동 로그인 테스트 실행

### 테스트 성공 여부
**상태:** 대기 중

**성공 조건:**
- [ ] Google OAuth 승인 성공
- [ ] JWT 토큰 생성 성공
- [ ] JWT 토큰이 WBFinHub로 전송됨
- [ ] WBFinHub 로그인 화면 없이 대시보드 진입
- [ ] 사용자 정보가 정상적으로 표시됨

---

## 참고 문서

- **ngrok 테스트 환경 설정 가이드:** `c:\GitHub\WBHubManager\Common\ngrok-test-setup.md`
- **JWT 토큰 테스트 스크립트:** `c:\GitHub\WBHubManager\scripts\test-sso-token.cjs`
- **Docker 테스트 가이드:** `c:\GitHub\WBHubManager\common\docker-test-guide.md`
- **Railway 환경 변수:** `c:\GitHub\WBHubManager\common\railway-env.md`

---

**문서 버전:** 1.0
**최종 업데이트:** 2025-12-30 23:47 KST
