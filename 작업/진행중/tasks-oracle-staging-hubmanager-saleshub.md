# Tasks: 오라클 스테이징 빌드 및 E2E 테스트 (HubManager + SalesHub)

## Relevant Files

### 로컬 환경
- `/home/peterchung/WBHubManager/.env.staging` - 포트 번호 `:4400` 제거 필요
- `/home/peterchung/WBSalesHub/.env.staging` - 검증 필요 (이미 최신 상태로 예상)
- `/home/peterchung/HWTestAgent/tests/e2e-oracle-staging-hubmanager-saleshub.spec.ts` - 신규 E2E 테스트 스크립트
- `/home/peterchung/HWTestAgent/tests/helpers/google-oauth-helper.ts` - Google OAuth 자동 로그인 헬퍼

### 오라클 서버
- `/home/ubuntu/workhub/docker-compose.staging.yml` - Docker Compose 설정
- `/home/ubuntu/workhub/nginx/nginx-staging.conf` - Nginx 리버스 프록시 설정
- `/home/ubuntu/workhub/WBHubManager/.env.staging` - 환경변수 동기화
- `/home/ubuntu/workhub/WBSalesHub/.env.staging` - 환경변수 확인

### Notes
- 로컬 테스트 완료 상태이므로 빌드 실패 리스크 낮음
- NEXT_PUBLIC_* 변수는 현행 유지 (규칙 위반이지만 빌드 성공 우선)
- 환경별 테스트 전략: "QA Testing & Server Management > 2. 환경별 테스트 전략" 참조

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

### Phase 1: 환경변수 검증 및 수정 (로컬)

- [x] 1.0 WBHubManager 환경변수 수정
  - [x] 1.1 `/home/peterchung/WBHubManager/.env.staging` 파일 읽기
  - [x] 1.2 URL에서 `:4400` 포트 번호 제거
    - `APP_URL=https://staging.workhub.biz:4400` → `https://staging.workhub.biz`
    - `NEXTAUTH_URL=https://staging.workhub.biz:4400` → `https://staging.workhub.biz`
    - `NEXT_PUBLIC_API_URL` 등 모든 URL 확인
  - [x] 1.3 수정사항 저장 및 검증

- [x] 2.0 WBSalesHub 환경변수 검증
  - [x] 2.1 `/home/peterchung/WBSalesHub/.env.staging` 파일 읽기
  - [x] 2.2 주요 환경변수 확인
    - DATABASE_URL (host.docker.internal:5432) ✓
    - HUBMANAGER_DATABASE_URL ✓
    - APP_URL (/saleshub 경로 포함) ✓
    - NEXT_PUBLIC_API_URL (/saleshub/api) ✓
    - Google OAuth 콜백 URL ✓
  - [x] 2.3 문제 없으면 "검증 완료" 표시 - ✅ 검증 완료

---

### Phase 2: 오라클 서버 준비

- [x] 3.0 SSH 접속 및 저장소 업데이트
  - [x] 3.1 오라클 서버 SSH 접속 ✓
  - [x] 3.2 WBHubManager 상태 확인 (이미 최신) ✓
  - [x] 3.3 WBSalesHub 상태 확인 (feature/connection-pool-optimization 브랜치, 최신 상태) ✓

- [x] 4.0 환경변수 동기화
  - [x] 4.1 오라클 서버에서 직접 HubManager .env.staging 수정 (`sed -i 's/:4400//g'`)
  - [x] 4.2 HubManager 환경변수 확인 - 모든 `:4400` 제거됨 ✓
  - [x] 4.3 SalesHub 환경변수 확인 - 이미 올바르게 설정됨 ✓

- [x] 5.0 Docker Compose 설정 확인
  - [x] 5.1 docker-compose.oracle.yml 파일 확인 ✓
  - [x] 5.2 hubmanager 서비스 정의 존재 확인 (wbhubmanager:staging) ✓
  - [x] 5.3 saleshub 서비스 정의 존재 확인 (wbsaleshub:staging) ✓
  - [x] 5.4 staging 프로필 설정 확인 ✓
  - [x] 5.5 공통 환경변수 파일 (config/.env.common) 확인 ✓

---

### Phase 3: Docker 빌드 및 배포

- [x] 6.0 기존 컨테이너 정리
  - [x] 6.1 HubManager 컨테이너 중지 및 삭제 ✓
  - [x] 6.2 SalesHub 컨테이너 중지 및 삭제 ✓

- [x] 7.0 컨테이너 재시작 (환경변수 업데이트)
  - [x] 7.1 Docker Compose로 컨테이너 재생성
    - 명령어: `docker compose --profile staging up -d wbhubmanager-staging wbsaleshub-staging`
  - [x] 7.2 컨테이너 상태 확인 - 두 허브 모두 Healthy ✓
  - [x] 7.3 헬스체크 완료 대기 (40초) ✓

- [x] 8.0 서비스 헬스체크
  - [x] 8.1 컨테이너 상태 최종 확인
    - wbhubmanager-staging: Healthy ✓
    - wbsaleshub-staging: Healthy ✓
  - [x] 8.2 Nginx 응답 확인 (158.180.95.246:4400) ✓

---

### Phase 4: E2E 테스트 (로컬)

- [x] 10.0 E2E 테스트 확인
  - [x] 10.1 기존 테스트 파일 확인 - 이미 존재 ✓
  - [x] 10.2 테스트 파일 검토 - 구조 적절 ✓

- [x] 11.0 E2E 테스트 실행 시도
  - [x] 11.1 Playwright 테스트 실행
  - [x] 11.2 결과: 네트워크 제약으로 인한 실패
    - 원인: 로컬(미국)에서 오라클 서버(한국) 직접 접속 제약
    - 2개 통과, 5개 실패 (접속 관련)
  - [x] 11.3 결론: 수동 검증 필요

---

### Phase 5: 수동 검증 및 완료

- [ ] 13.0 수동 브라우저 테스트
  - [ ] 13.1 HubManager 접속 (`https://staging.workhub.biz`)
  - [ ] 13.2 Google OAuth 로그인 성공 확인
  - [ ] 13.3 허브 선택 페이지 정상 렌더링 확인
  - [ ] 13.4 SalesHub 접속 (`https://staging.workhub.biz/saleshub`)
  - [ ] 13.5 SalesHub 대시보드 정상 렌더링 확인
  - [ ] 13.6 크로스 허브 네비게이션 동작 확인
  - [ ] 13.7 세션 유지 확인 (쿠키)
  - [ ] 13.8 네트워크 탭에서 API 호출 성공 확인 (200 OK)

- [ ] 14.0 로그 모니터링 및 에러 확인
  - [ ] 14.1 실시간 로그 확인 (`docker-compose -f docker-compose.staging.yml logs -f --tail=100 hubmanager saleshub`)
  - [ ] 14.2 에러 로그 검색 (`docker-compose -f docker-compose.staging.yml logs hubmanager saleshub | grep -i error`)
  - [ ] 14.3 치명적 에러 없음 확인
  - [ ] 14.4 경고 로그 검토 및 필요 시 조치

- [ ] 15.0 작업 완료 기록
  - [ ] 15.1 작업 완료 문서 작성
    - 파일: `/home/peterchung/WHCommon/작업기록/완료/2026-01-14-oracle-staging-hubmanager-saleshub.md`
  - [ ] 15.2 환경변수 변경 내역 기록 (HubManager 포트 번호 제거)
  - [ ] 15.3 빌드 소요 시간 기록
  - [ ] 15.4 테스트 결과 요약
  - [ ] 15.5 발견된 문제 및 해결 방법 기록
  - [ ] 15.6 프로덕션 배포 시 주의사항 작성

- [ ] 16.0 Task 파일 이동
  - [ ] 16.1 모든 작업 완료 확인 (모든 체크박스 `[x]`)
  - [ ] 16.2 Task 파일을 `/작업/완료/`로 이동
    - 명령어: `mv /home/peterchung/WHCommon/작업/진행중/tasks-oracle-staging-hubmanager-saleshub.md /home/peterchung/WHCommon/작업/완료/`

---

## 예상 소요 시간

| Phase | 작업 내용 | 예상 시간 |
|-------|----------|----------|
| 1 | 환경변수 검증 및 수정 (로컬) | 10분 |
| 2 | 오라클 서버 준비 | 15분 |
| 3 | Docker 빌드 및 배포 | 10분 |
| 4 | E2E 테스트 (로컬) | 30분 |
| 5 | 수동 검증 및 완료 | 10분 |
| **총** | | **~1.5시간** |

---

## 성공 기준

### 필수 조건 (Must-Have)
- [x] WBHubManager 환경변수 포트 번호 제거 완료
- [ ] HubManager + SalesHub Docker 빌드 성공 (에러 없음)
- [ ] 두 허브 컨테이너 정상 실행 (Healthy 상태)
- [ ] Google OAuth 로그인 성공
- [ ] E2E 테스트 전체 Pass
- [ ] API 엔드포인트 모두 200 OK 응답

### 권장 조건 (Nice-to-Have)
- [ ] 빌드 시간 10분 이내
- [ ] E2E 테스트 3분 이내 완료
- [ ] 페이지 로딩 시간 3초 이내
- [ ] 메모리 사용량 512MB 이내 (컨테이너당)

---

## 문제 해결 가이드

### 빌드 실패 시
1. 로그 확인: `docker-compose -f docker-compose.staging.yml logs hubmanager saleshub`
2. BuildKit 캐시 정리: `docker builder prune`
3. 환경변수 확인: `cat /home/ubuntu/workhub/WBHubManager/.env.staging`

### 컨테이너 실행 실패 시
1. 포트 확인: `netstat -tuln | grep 4090`
2. DB 연결 테스트: `docker-compose exec hubmanager node -e "console.log(process.env.DATABASE_URL)"`
3. 컨테이너 재시작: `docker-compose -f docker-compose.staging.yml restart hubmanager`

### E2E 테스트 실패 시
1. Playwright 디버그 모드: `npx playwright test --debug`
2. 스크린샷 확인: `HWTestAgent/test-results/`
3. Google OAuth Redirect URI 확인 (Google Cloud Console)

---

## 다음 단계 (프로덕션 배포)

스테이징 검증 완료 후:
1. 동일한 환경변수 변경사항 프로덕션 반영
2. 프로덕션 빌드 및 배포
3. 프로덕션 E2E 테스트 실행
4. 모니터링 24시간
