# Task: HubManager 버튼 클릭 불가 버그 수정

## 문서 정보
- **생성일**: 2026-01-14
- **PRD**: `/home/peterchung/WHCommon/기획/진행중/prd-hubmanager-button-click-fix.md`
- **작업량**: 0.5일 (4 WU)
- **복잡도**: 낮음

---

## Relevant Files

- `server/routes/authRoutes.ts:314-318` - JWT 토큰 생성 시 audience 설정 (수정 대상)
- `server/routes/authRoutes.ts:907-911` - JWT 토큰 검증 시 audience 확인 (참조)
- `frontend/app/hubs/page.tsx` - Hub 선택 페이지 (handleHubClick)
- `frontend/lib/api/auth.ts` - generateHubToken API 호출

### Notes

- 수정 대상은 `generateHubToken()` 함수의 audience 배열에 `'wbhubmanager'` 추가
- 테스트는 HWTestAgent에서 Playwright E2E 테스트로 검증

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

---

## Tasks

- [x] 1.0 JWT audience 불일치 버그 수정
  - [x] 1.1 `server/routes/authRoutes.ts` 파일의 `generateHubToken()` 함수에서 audience 배열에 `'wbhubmanager'` 추가 (line 317)
  - [x] 1.2 TypeScript 빌드 검증 (`npm run build:server`)

- [x] 2.0 로컬 테스트 검증
  - [x] 2.1 로컬 서버 시작 및 기능 테스트 (서버 실행 확인)
  - [x] 2.2 Hub 카드 클릭 동작 확인 (스테이징에서 E2E 테스트로 대체)

- [x] 3.0 스테이징 배포 및 검증
  - [x] 3.1 Git 커밋 및 푸시
  - [x] 3.2 오라클 스테이징 배포 (docker build -t wbhubmanager:staging)
  - [x] 3.3 Playwright E2E 테스트로 버그 수정 검증
    - ✅ generate-hub-token API가 200 반환 확인 (기존 401 → 200)
    - ✅ Google OAuth 로그인 후 Hub 카드 클릭 정상 동작

- [x] 4.0 문서 정리
  - [x] 4.1 PRD 체크리스트 업데이트
  - [x] 4.2 PRD 파일을 `기획/완료/`로 이동
  - [x] 4.3 Task 파일을 `작업/완료/`로 이동
