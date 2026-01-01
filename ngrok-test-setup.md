# ngrok 테스트 환경 설정 가이드

**생성일:** 2025-12-30
**목적:** 로컬 WBHubManager에서 프로덕션 WBFinHub로 SSO 자동 로그인 테스트

---

## 개요

이 가이드는 로컬에서 실행 중인 WBHubManager를 ngrok 터널로 노출하고, 프로덕션 환경의 WBFinHub와 SSO 통합을 테스트하는 방법을 설명합니다.

### 테스트 목표

**성공 조건:**
1. 로컬 HubManager → FinHub 버튼 클릭
2. Google OAuth 승인 성공
3. JWT 토큰 생성
4. JWT 토큰을 프로덕션 FinHub에 전송
5. FinHub 로그인 화면 없이 바로 대시보드로 진입 ✅

---

## 사전 요구사항

### 1. 로컬 환경 설정

#### 필요한 소프트웨어
- Node.js 18+ 설치
- PostgreSQL 실행 중
- WBHubManager 로컬 서버 실행 가능 상태

#### WBHubManager 환경 변수 확인
```bash
# c:\GitHub\WBHubManager\.env 파일 확인
DATABASE_URL=postgresql://...
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...
```

### 2. ngrok 설치

#### Windows (Chocolatey)
```bash
choco install ngrok
```

#### Windows (수동 설치)
1. https://ngrok.com/download 에서 Windows 버전 다운로드
2. ZIP 압축 해제
3. `ngrok.exe`를 PATH에 추가 또는 직접 실행

#### 인증 토큰 설정
```bash
# ngrok 계정 생성 후 토큰 받기
ngrok authtoken YOUR_NGROK_AUTH_TOKEN
```

---

## 테스트 환경 구성

### Step 1: ngrok 터널 시작

로컬 WBHubManager 서버가 실행되는 포트(4090)를 ngrok으로 노출합니다.

```bash
# 새 터미널 창에서 실행
ngrok http 4090
```

**출력 예시:**
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://abcd-1234-5678-9012.ngrok-free.app -> http://localhost:4090
```

**중요:** `Forwarding` 줄의 HTTPS URL을 복사하세요. (예: `https://abcd-1234-5678-9012.ngrok-free.app`)

### Step 2: Google OAuth 콜백 URL 업데이트

Google Cloud Console에서 OAuth 2.0 클라이언트 ID 설정을 업데이트합니다.

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/
   - 프로젝트 선택: WBHubManager

2. **OAuth 2.0 클라이언트 ID 수정**
   - APIs & Services → Credentials
   - OAuth 2.0 클라이언트 ID 클릭
   - "승인된 리디렉션 URI"에 추가:
     ```
     https://YOUR-NGROK-URL.ngrok-free.app/api/auth/google-callback
     ```
   - 예: `https://abcd-1234-5678-9012.ngrok-free.app/api/auth/google-callback`
   - "저장" 클릭

### Step 3: 로컬 환경 변수 업데이트

로컬 WBHubManager의 `.env` 파일을 수정합니다.

```bash
# c:\GitHub\WBHubManager\.env

# 기존:
# APP_URL=http://localhost:4090

# ngrok URL로 변경:
APP_URL=https://YOUR-NGROK-URL.ngrok-free.app
```

### Step 4: 로컬 서버 재시작

환경 변수 변경사항을 반영하기 위해 서버를 재시작합니다.

```bash
# 기존 서버 프로세스 종료 (Ctrl+C)

# PostgreSQL 실행 확인
# 서버 재시작
cd c:\GitHub\WBHubManager
npm run dev
```

**서버 실행 확인:**
- 브라우저에서 ngrok URL 접속: `https://YOUR-NGROK-URL.ngrok-free.app`
- WBHubManager 로그인 페이지가 표시되어야 함

### Step 5: Hubs 테이블 확인

로컬 데이터베이스의 `hubs` 테이블에 프로덕션 WBFinHub URL이 등록되어 있는지 확인합니다.

```sql
-- PostgreSQL 쿼리
SELECT id, name, slug, url, is_active FROM hubs;
```

**기대 결과:**
```
id | name      | slug      | url                                   | is_active
---+-----------+-----------+---------------------------------------+----------
1  | WB FinHub | wbfinhub  | https://wbfinhub.up.railway.app       | true
2  | WB Docs   | wbdocs    | https://docs.wavebridge.kr            | true
```

**WBFinHub URL이 없거나 다른 경우:**
```sql
-- 업데이트
UPDATE hubs
SET url = 'https://wbfinhub.up.railway.app'
WHERE slug = 'wbfinhub';
```

---

## 테스트 실행

### 테스트 시나리오

#### 1. Hub 선택 페이지 접속
```
https://YOUR-NGROK-URL.ngrok-free.app/hubs
```

#### 2. WBFinHub 버튼 클릭
- "WB FinHub" 카드 클릭
- Google OAuth 승인 화면으로 리다이렉트

#### 3. Google 계정 선택 및 승인
- 테스트용 Google 계정 선택
- 권한 승인 클릭

#### 4. 자동 로그인 확인
- Google 승인 완료 후 자동으로 WBFinHub로 리다이렉트
- **성공 조건:** 로그인 화면 없이 바로 대시보드 진입
- **실패 시:** `/login` 화면으로 리다이렉트되면 테스트 실패

### 로그 확인

#### WBHubManager 로컬 서버 로그
```
✅ Google OAuth callback received
✅ Google user info retrieved: your-email@example.com
✅ User upserted into database
✅ Session created for user: your-email@example.com
🎫 Generating Hub SSO token...
✅ Hub SSO token generated successfully
✅ Hub URL: https://wbfinhub.up.railway.app
🔗 Redirecting to Hub SSO: https://wbfinhub.up.railway.app/auth/sso?token=JWT...
```

#### WBFinHub Railway 로그 확인
Railway 대시보드에서 WBFinHub 로그 확인:
```
📥 SSO login request received
🔐 Token: eyJhbGciOiJSUzI1NiIsInR...
✅ Token verification successful
✅ User authenticated: your-email@example.com
🔗 Redirecting to dashboard
```

---

## 문제 해결

### 문제 1: ngrok 터널이 연결되지 않음

**증상:**
```
ERR_CONNECTION_REFUSED
```

**해결:**
1. 로컬 서버가 실행 중인지 확인:
   ```bash
   curl http://localhost:4090/api/health
   ```
2. ngrok 프로세스가 실행 중인지 확인
3. 방화벽에서 ngrok를 허용했는지 확인

### 문제 2: Google OAuth 에러 (redirect_uri_mismatch)

**증상:**
```
Error 400: redirect_uri_mismatch
```

**해결:**
1. Google Cloud Console에서 리디렉션 URI가 정확히 일치하는지 확인:
   ```
   https://YOUR-NGROK-URL.ngrok-free.app/api/auth/google-callback
   ```
2. ngrok URL이 변경되었다면 Google Cloud Console 업데이트
3. 로컬 `.env` 파일의 `APP_URL`이 ngrok URL과 일치하는지 확인

### 문제 3: JWT 토큰 검증 실패

**증상:**
- WBFinHub에서 `/login?error=invalid_token`으로 리다이렉트

**해결:**
1. 로컬 WBHubManager와 프로덕션 WBFinHub가 동일한 JWT_PUBLIC_KEY를 사용하는지 확인
2. Railway 환경 변수 확인:
   ```bash
   railway logs --service wbfinhub | grep "JWT_PUBLIC_KEY"
   ```
3. JWT 토큰 페이로드 확인:
   - `sub`, `email`, `username`, `is_admin`, `type: 'access'`, `aud` 필드 존재 여부
   - `iss: 'wbhubmanager'` 확인
   - `aud: ['wbsaleshub', 'wbfinhub']` 확인

### 문제 4: 세션 생성 실패

**증상:**
```
⚠️ No session user found
Session User: undefined
```

**해결:**
1. PostgreSQL 연결 확인
2. `session` 테이블 존재 여부 확인:
   ```sql
   SELECT * FROM session LIMIT 1;
   ```
3. 세션 스토어 설정 확인 (`server/index.ts`)

---

## 테스트 완료 후 정리

### 1. Google OAuth 콜백 URL 복원
Google Cloud Console에서 테스트용 ngrok URL을 제거하고 프로덕션 URL만 유지:
```
https://wbhub.up.railway.app/api/auth/google-callback
```

### 2. 로컬 환경 변수 복원
```bash
# c:\GitHub\WBHubManager\.env
APP_URL=http://localhost:4090
```

### 3. ngrok 터널 종료
```bash
# ngrok 실행 중인 터미널에서
Ctrl+C
```

---

## 추가 참고 자료

- **JWT 토큰 테스트 스크립트:** `c:\GitHub\WBHubManager\scripts\test-sso-token.cjs`
- **Docker 테스트 가이드:** `c:\GitHub\WBHubManager\common\docker-test-guide.md`
- **Railway 환경 변수:** `c:\GitHub\WBHubManager\common\railway-env.md`

---

## 보안 주의사항

1. **ngrok 터널은 임시 테스트 용도로만 사용**
   - 테스트 완료 후 즉시 종료
   - ngrok URL을 공개하지 말 것

2. **프로덕션 환경 변수 유출 방지**
   - 로컬 `.env` 파일에 프로덕션 키를 저장하지 말 것
   - Railway 환경 변수와 로컬 환경 변수를 분리

3. **Google OAuth 콜백 URL 관리**
   - 테스트 완료 후 ngrok URL 제거
   - 승인된 리디렉션 URI 목록을 최소화

---

**문서 버전:** 1.0
**최종 업데이트:** 2025-12-30
