# Manual Google OAuth Test Guide

**목표:** Google OAuth 승인 후 WBFinHub 대시보드로 자동 로그인 확인

## 현재 환경 설정

✅ **ngrok 백엔드 터널**: `https://violently-verrucous-carlyn.ngrok-free.dev`
✅ **로컬 프론트엔드**: `http://localhost:3090`
✅ **백엔드 서버**: ngrok URL 사용하도록 설정됨

## 수동 테스트 절차

### 1. 프론트엔드 접속
```
http://localhost:3090/hubs
```

### 2. Finance Hub 버튼 클릭

### 3. Google OAuth 진행
- ngrok 경고 화면이 나타나면 "Visit Site" 클릭
- Google 계정 선택 및 로그인
- OAuth 승인 (필요 시)

### 4. 결과 확인

**예상되는 플로우:**
1. Google OAuth 승인 완료
2. WBHubManager `/api/auth/google-callback` 호출
3. JWT 토큰 생성
4. WBFinHub `/auth/sso?token=...`로 리다이렉트
5. WBFinHub가 WBHubManager에 토큰 검증 요청
6. **문제 발생**: WBFinHub는 프로덕션 WBHubManager에 요청하지만, 토큰은 로컬에서 생성됨

## 실제 발생하는 문제

### 시나리오 A: WBFinHub 로그인 페이지로 리다이렉트
- URL: `https://wbfinhub.up.railway.app/login/?error=invalid_token`
- **원인**: WBFinHub가 프로덕션 WBHubManager(`https://wbhub.up.railway.app`)에 토큰 검증 요청
- **해결**: 로컬 WBHubManager를 프로덕션으로 배포하거나, WBFinHub를 로컬에서 실행

### 시나리오 B: "WBHubManager로 로그인" 화면 표시
- URL: `https://wbfinhub.up.railway.app/login`
- **원인**: 토큰이 없거나 검증 실패
- **해결**: 백엔드 로그 확인하여 토큰 생성 여부 확인

## 디버깅 체크리스트

### 백엔드 로그 확인
```bash
# 터미널에서 백엔드 로그 확인
npm run dev
```

**확인 사항:**
- [ ] `✅ Google user info retrieved` 로그
- [ ] `✅ User upserted in database` 로그
- [ ] `✅ Session created for user` 로그
- [ ] `🎫 Generating Hub SSO token...` 로그
- [ ] `✅ Hub SSO token generated successfully` 로그
- [ ] `🔗 Redirecting to Hub SSO: https://wbfinhub.up.railway.app/auth/sso?token=...` 로그

### 브라우저 개발자 도구
1. **Network 탭**
   - [ ] `/api/auth/google-callback` 요청 성공 (302 리다이렉트)
   - [ ] `/auth/sso?token=...` 요청 확인
   - [ ] 토큰 파라미터가 URL에 포함되어 있는지 확인

2. **Console 탭**
   - [ ] JavaScript 에러 없음
   - [ ] "✅ Session exists, redirecting to Hub SSO" 로그

3. **Application 탭 → Storage**
   - [ ] `sessionStorage`에 `wbhub_access_token` 존재 여부 (Hub 선택 페이지에서만)

## 해결 방법

### 옵션 1: WBFinHub 로컬 실행 (추천)
```bash
cd c:/GitHub/WBFinHub
npm run dev
```

- WBFinHub를 로컬 포트 3001에서 실행
- `.env` 파일에서 `HUB_MANAGER_URL=http://localhost:4090` 설정
- 로컬 WBFinHub는 로컬 WBHubManager에 토큰 검증 요청

### 옵션 2: 프로덕션 배포
- 로컬 WBHubManager 코드를 Railway에 배포
- 프로덕션 환경에서 전체 플로우 테스트

### 옵션 3: ngrok Pooling (ngrok Pro 필요)
```bash
# 백엔드와 프론트엔드 모두 ngrok으로 노출
ngrok start --all --pooling-enabled
```

## 성공 조건

✅ Google OAuth 승인 후:
1. WBFinHub 로그인 화면 없이 대시보드로 바로 이동
2. URL: `https://wbfinhub.up.railway.app/dashboard` 또는 `/`
3. 상단 네비게이션에 사용자 이름 표시
4. 데이터가 정상적으로 로드됨

## 현재 상태

- [x] ngrok 터널 실행 중
- [x] 백엔드 서버 실행 중
- [x] 프론트엔드 서버 실행 중
- [x] Google OAuth 설정 완료
- [x] JWT 토큰 생성 로직 구현 완료
- [ ] End-to-end 테스트 필요 (수동 또는 로컬 WBFinHub)

---

**다음 단계:** 브라우저에서 `http://localhost:3090/hubs`로 접속하여 Finance Hub 버튼을 클릭하고 결과를 확인하세요.
