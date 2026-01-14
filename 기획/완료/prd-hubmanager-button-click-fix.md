# PRD: HubManager 버튼 클릭 불가 버그 수정

## 문서 정보
- **작성일**: 2026-01-14
- **상태**: 완료
- **우선순위**: Critical
- **담당**: Claude Code

---

## 1. 개요

### 1.1 문제 요약
스테이징 환경(`https://staging.workhub.biz:4400/hubs`)에서 Google OAuth 로그인 완료 후 HubManager로 복귀하면 Hub 카드 버튼 클릭이 작동하지 않는 버그.

### 1.2 영향 범위
- **환경**: 스테이징 (https://staging.workhub.biz:4400)
- **페이지**: /hubs (Hub 선택 페이지)
- **영향**: 로그인된 사용자가 다른 Hub로 이동할 수 없음

---

## 2. 재현 시나리오

### 2.1 정확한 재현 단계
```
1. 새 브라우저 세션 시작
2. https://staging.workhub.biz:4400/hubs 접속
3. Sales Hub 카드 클릭 → ✅ 정상 동작 (OAuth로 이동)
4. Google OAuth 로그인 (biz.dev@wavebridge.com / wave1234!!)
5. SalesHub 대시보드 로드 완료
6. HubManager /hubs 페이지로 다시 이동 (리디렉션 또는 직접 접속)
7. Hub 카드 클릭 시도 → ❌ 버튼 작동 안 함
```

### 2.2 잘못된 재현 시나리오 (문제 아님)
- ❌ Google OAuth 페이지까지만 가고 브라우저 뒤로가기 → 정상 동작
- ❌ 로그인 없이 단순 클릭 테스트 → 정상 동작

### 2.3 핵심 차이점
| 시나리오 | 결과 |
|----------|------|
| 미로그인 상태에서 클릭 | ✅ 정상 |
| OAuth 페이지까지만 → 뒤로가기 | ✅ 정상 |
| **OAuth 로그인 완료 → SalesHub → HubManager 복귀** | ❌ 버튼 불가 |

---

## 3. 근본 원인 분석

### 3.1 핵심 원인: JWT audience 불일치

**문제**: OAuth 로그인 후 `/api/auth/generate-hub-token` 호출 시 401 에러 발생

**원인 코드 분석**:

```typescript
// server/routes/authRoutes.ts

// OAuth 콜백에서 Hub SSO 토큰 생성 시 (line 317):
const token = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',
  issuer: 'wbhubmanager',
  audience: ['wbsaleshub', 'wbfinhub', 'wbrefhub'],  // ⚠️ 'wbhubmanager' 없음!
});

// generate-hub-token에서 토큰 검증 시 (line 907-911):
decoded = jwt.verify(accessToken, publicKey, {
  algorithms: ['RS256'],
  issuer: 'wbhubmanager',
  audience: 'wbhubmanager',  // ❌ 위 토큰에는 이 audience가 없음!
});
// → jwt.verify() 실패 → 401 Unauthorized 반환
```

### 3.2 버그 발생 흐름

```
1. HubManager → Google OAuth → OAuth 성공
2. OAuth 콜백에서 `wbhub_access_token` 쿠키 설정
   - audience: ['wbsaleshub', 'wbfinhub', 'wbrefhub'] (wbhubmanager 없음!)
3. SalesHub로 리다이렉트 → 정상 동작
4. HubManager `/hubs`로 복귀
5. Hub 카드 클릭 → handleHubClick() → authApi.generateHubToken(hub.slug) 호출
6. 백엔드에서 쿠키의 JWT 검증 시 **audience 불일치로 401 반환**
7. 프론트엔드 client.ts 인터셉터가 401 처리 → 토큰 갱신 시도 실패
8. **클릭 핸들러가 에러 발생으로 중단** → 버튼이 동작하지 않는 것처럼 보임
```

---

## 4. 수정 방안

### 4.1 Option 1: generateHubToken() 함수에서 audience 추가 (권장)

**파일**: `server/routes/authRoutes.ts`
**위치**: line 317

```typescript
// Before
audience: ['wbsaleshub', 'wbfinhub', 'wbrefhub'],

// After
audience: ['wbsaleshub', 'wbfinhub', 'wbrefhub', 'wbhubmanager'],
```

**장점**:
- 변경 최소화 (1줄)
- 기존 로직 유지
- HubManager에서도 토큰 검증 가능

### 4.2 Option 2: generate-hub-token 엔드포인트에서 audience 검증 완화

**파일**: `server/routes/authRoutes.ts`
**위치**: line 907-911

```typescript
// Before
decoded = jwt.verify(accessToken, publicKey, {
  algorithms: ['RS256'],
  issuer: 'wbhubmanager',
  audience: 'wbhubmanager',
});

// After - audience 검증 제거
decoded = jwt.verify(accessToken, publicKey, {
  algorithms: ['RS256'],
  issuer: 'wbhubmanager',
  // audience 검증 제거
});
```

**단점**: 보안 약화 가능성

### 4.3 권장 수정안

**Option 1 적용** - `generateHubToken()` 함수에서 audience에 `'wbhubmanager'` 추가

---

## 5. 작업량

- **작업량**: 0.5일 (4 WU)
- **파일**: 1개 (`server/routes/authRoutes.ts`)
- **LOC**: ~5줄
- **복잡도**: 낮음
- **테스트**: Playwright E2E 테스트 필요

---

## 6. 검증 방법

### 6.1 Playwright 테스트

```typescript
// 네트워크 모니터링으로 401 에러 확인
page.on('response', async res => {
  if (res.url().includes('/api/auth/generate-hub-token')) {
    console.log('generate-hub-token status:', res.status());
    if (res.status() === 401) {
      console.log('❌ JWT audience mismatch confirmed!');
    }
  }
});
```

### 6.2 수동 테스트

1. 스테이징 환경 접속: `https://staging.workhub.biz:4400/hubs`
2. Sales Hub 클릭 → Google OAuth 로그인
3. SalesHub 대시보드 확인
4. HubManager `/hubs`로 복귀
5. Hub 카드 클릭 → **정상 동작 확인**

---

## 7. 관련 파일

| 파일 | 역할 |
|------|------|
| `server/routes/authRoutes.ts` | JWT 토큰 생성/검증 (수정 대상) |
| `frontend/app/hubs/page.tsx` | Hub 선택 페이지 (handleHubClick) |
| `frontend/lib/api/auth.ts` | generateHubToken API 호출 |
| `frontend/lib/api/client.ts` | Axios 인터셉터 (401 처리) |

---

## 8. 디버깅 플랜 파일

상세 테스트 시나리오는 다음 플랜 파일 참조:
- `/home/peterchung/.claude/plans/foamy-shimmying-lightning.md`

---

## 9. 체크리스트

- [x] 문제 재현 시나리오 확인
- [x] 근본 원인 분석 완료 (JWT audience 불일치)
- [x] 수정 방안 도출
- [x] 코드 수정 적용 (2026-01-14)
- [x] 스테이징 배포 (2026-01-14)
- [x] E2E 테스트 검증 (generate-hub-token 200 OK 확인)
- [ ] 프로덕션 배포 (스테이징 검증 완료 후 진행)

---

## 10. 참고 사항

- **테스트 계정**: biz.dev@wavebridge.com / wave1234!!
- **스테이징 URL**: https://staging.workhub.biz:4400
- **HWTestAgent 테스트 디렉토리**: `/home/peterchung/HWTestAgent/tests/staging-debug/`
