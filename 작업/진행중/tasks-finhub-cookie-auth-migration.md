# Tasks: WBFinHub JWT SSO 쿠키 인증 방식 전환

**참고 PRD:** [prd-finhub-cookie-auth-migration.md](/home/peterchung/WHCommon/기능 PRD/prd-finhub-cookie-auth-migration.md)

## Relevant Files

### 새로 생성할 파일 (RefHub에서 복사)
- `/home/peterchung/WBFinHub/server/config/cookie.config.ts` - 쿠키 설정 상수
- `/home/peterchung/WBFinHub/server/services/jwtService.ts` - JWT 토큰 검증 서비스
- `/home/peterchung/WBFinHub/server/middleware/cookieAuth.ts` - 쿠키 기반 인증 미들웨어
- `/home/peterchung/WBFinHub/server/__tests__/unit/cookieConfig.test.ts` - 쿠키 설정 단위 테스트
- `/home/peterchung/WBFinHub/server/__tests__/unit/jwtService.test.ts` - JWT 서비스 단위 테스트

### 수정할 파일
- `/home/peterchung/WBFinHub/server/middleware/jwt.ts` - 기존 미들웨어를 쿠키 방식으로 교체
- `/home/peterchung/WBFinHub/server/routes/authRoutes.ts` - SSO 엔드포인트 변경
- `/home/peterchung/WBFinHub/server/index.ts` - 쿠키 파서 및 CORS 설정 추가
- `/home/peterchung/WBFinHub/package.json` - @wavebridge/hub-auth 의존성 제거
- `/home/peterchung/WBFinHub/frontend/app/(auth)/login/page.tsx` - localStorage 제거
- `/home/peterchung/WBFinHub/frontend/lib/api.ts` - credentials: 'include' 추가
- `/home/peterchung/WBFinHub/frontend/store/authStore.ts` - localStorage 로직 제거
- `/home/peterchung/WBFinHub/.env.template` - 환경변수 추가

### 제거할 파일
- `/home/peterchung/WBFinHub/frontend/app/auth/sso-callback/page.tsx` - 쿠키 방식에서 불필요

### Notes
- RefHub의 쿠키 인증 구조를 FinHub에 그대로 복사하여 적용
- @wavebridge/hub-auth 패키지 의존성 완전 제거
- localStorage 토큰 저장 방식 제거, httpOnly 쿠키로 전환
- 기존 테스트는 유지하되 쿠키 방식으로 수정

## Instructions for Completing Tasks

**WHCommon/계획_테스크.md 사용 알림:** 이 테스크는 `WHCommon/계획_테스크.md` 규칙에 따라 작성되었습니다. 각 서브 테스크 완료 후 중간중간 커밋을 진행합니다.

**IMPORTANT:** 각 테스크 완료 시 `- [ ]`를 `- [x]`로 변경하여 진행 상황을 추적합니다.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch `git checkout -b feature/finhub-cookie-auth`

- [ ] 1.0 백엔드 쿠키 인증 모듈 추가 (RefHub 복사)
  - [ ] 1.1 `/server/config/cookie.config.ts` 파일 생성 (RefHub 복사)
  - [ ] 1.2 `/server/services/jwtService.ts` 파일 생성 (RefHub 복사)
  - [ ] 1.3 `/server/middleware/cookieAuth.ts` 파일 생성 (RefHub 복사)
  - [ ] 1.4 빌드 및 타입 에러 확인 (`npm run build`)

- [ ] 2.0 서버 초기화 및 CORS 설정 변경
  - [ ] 2.1 `/server/index.ts`에 `cookie-parser` 패키지 추가
  - [ ] 2.2 `cookieParser()` 미들웨어 등록
  - [ ] 2.3 CORS 설정에 `credentials: true` 추가
  - [ ] 2.4 `package.json`에 `cookie-parser` 의존성 추가 및 설치

- [ ] 3.0 인증 라우트 변경 (SSO 엔드포인트)
  - [ ] 3.1 `/server/routes/authRoutes.ts`에서 기존 `/auth/sso` 엔드포인트 제거
  - [ ] 3.2 `/auth/login` 엔드포인트 추가 (HubManager로 리다이렉트)
  - [ ] 3.3 `/auth/sso-complete` 엔드포인트 추가 (쿠키 검증 후 대시보드 이동)
  - [ ] 3.4 `/auth/logout` POST 엔드포인트를 쿠키 삭제 방식으로 변경
  - [ ] 3.5 `/auth/me` GET 엔드포인트를 쿠키 인증 미들웨어 사용으로 변경

- [ ] 4.0 기존 JWT 미들웨어 교체
  - [ ] 4.1 `/server/middleware/jwt.ts`에서 `@wavebridge/hub-auth` import 제거
  - [ ] 4.2 `authenticateJWT` 함수를 `cookieAuthMiddleware` 기반으로 재작성
  - [ ] 4.3 `isAuthenticatedAndActive` 함수 내부 로직 변경
  - [ ] 4.4 개발 모드 우회 로직 유지 (`AUTH_ENABLED=false`)

- [ ] 5.0 @wavebridge/hub-auth 패키지 제거
  - [ ] 5.1 `package.json`에서 `@wavebridge/hub-auth` 의존성 제거
  - [ ] 5.2 `npm install` 실행하여 패키지 삭제
  - [ ] 5.3 `/server/adapters/PrismaAccountAdapter.ts` 검토 (필요시 수정)
  - [ ] 5.4 전체 코드에서 `@wavebridge/hub-auth` import 제거 확인

- [ ] 6.0 프론트엔드 로그인 페이지 변경
  - [ ] 6.1 `/frontend/app/(auth)/login/page.tsx`에서 localStorage 관련 코드 제거
  - [ ] 6.2 `login()` 함수를 `/api/auth/login`으로 리다이렉트하도록 수정
  - [ ] 6.3 `/frontend/app/auth/sso-callback/page.tsx` 파일 제거

- [ ] 7.0 프론트엔드 API 호출 설정 변경
  - [ ] 7.1 `/frontend/lib/api.ts`의 모든 fetch 호출에 `credentials: 'include'` 추가
  - [ ] 7.2 Authorization 헤더 설정 코드 제거
  - [ ] 7.3 localStorage 토큰 읽기 코드 제거

- [ ] 8.0 프론트엔드 AuthStore 변경
  - [ ] 8.1 `/frontend/store/authStore.ts`에서 localStorage 토큰 저장/읽기 로직 제거
  - [ ] 8.2 인증 상태를 `/api/auth/me` 호출 결과로만 판단하도록 변경

- [ ] 9.0 환경변수 설정
  - [ ] 9.1 `.env.template`에 `FINHUB_URL`, `COOKIE_DOMAIN`, `JWT_PUBLIC_KEY` 추가
  - [ ] 9.2 `.env.local` 업데이트 (개발 환경)
  - [ ] 9.3 Doppler에 환경변수 추가 (프로덕션)

- [ ] 10.0 테스트 추가
  - [ ] 10.1 `/server/__tests__/unit/cookieConfig.test.ts` 추가 (RefHub 참고)
  - [ ] 10.2 `/server/__tests__/unit/jwtService.test.ts` 추가 (RefHub 참고)
  - [ ] 10.3 기존 통합 테스트를 쿠키 방식으로 수정
  - [ ] 10.4 모든 테스트 실행 및 통과 확인

- [ ] 11.0 빌드 및 검증
  - [ ] 11.1 백엔드 빌드 (`npm run build`)
  - [ ] 11.2 프론트엔드 빌드 (`cd frontend && npm run build`)
  - [ ] 11.3 TypeScript 타입 에러 확인
  - [ ] 11.4 로컬 환경에서 SSO 로그인 테스트
  - [ ] 11.5 모든 기존 API 엔드포인트 정상 작동 확인

- [ ] 12.0 Docker 환경 테스트
  - [ ] 12.1 Docker Compose로 빌드 및 실행
  - [ ] 12.2 쿠키 도메인 설정 확인
  - [ ] 12.3 SSO 플로우 정상 작동 확인

- [ ] 13.0 커밋 및 PR 생성
  - [ ] 13.1 변경 사항 커밋 (`git add .` 및 `git commit`)
  - [ ] 13.2 원격 저장소에 푸시 (`git push origin feature/finhub-cookie-auth`)
  - [ ] 13.3 GitHub에서 PR 생성

- [ ] 14.0 오라클 클라우드 배포
  - [ ] 14.1 배포 스크립트 실행 (`./deploy-oracle.sh`)
  - [ ] 14.2 프로덕션 환경에서 SSO 로그인 테스트
  - [ ] 14.3 모니터링 및 로그 확인

---

**작성일:** 2026-01-04
**예상 소요 시간:** 4-6시간
**우선순위:** High
