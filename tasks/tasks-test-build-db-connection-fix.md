# Tasks: test-build 컨테이너 PostgreSQL 연결 실패 수정

## 📋 Overview

**Feature**: Oracle staging 환경 test-build 이미지의 PostgreSQL 연결 문제 해결
**Goal**: HubManager 4/4 (100%), SalesHub 3/3 (100%) 스모크 테스트 통과
**Date**: 2026-01-12

**Current Status**:
- wbhubmanager-test: 0/4 (0%) - PostgreSQL localhost 연결 실패
- wbsaleshub-test: 1/3 (33%) - Health check만 통과

**Root Cause**:
1. WBHubManager: 파일 기반 dotenv가 Docker 환경변수 덮어씀 (`override: true`)
2. docker-entrypoint.sh: `DB_HOST` 기본값이 `localhost`
3. test-build 컨테이너: docker-compose.yml에 `DB_HOST=postgres` 누락 가능성

---

## Relevant Files

### WBHubManager
- `/home/peterchung/WBHubManager/server/index.ts:16-27` - 환경변수 로드 로직 (문제 원인)
- `/home/peterchung/WBHubManager/docker-entrypoint.sh:7-8` - DB_HOST 기본값 설정
- `/home/peterchung/WBHubManager/Dockerfile` - Docker 빌드 설정
- `/home/ubuntu/workhub/docker-compose.oracle.yml` - 오라클 서버 컨테이너 설정 (확인 필요)

### WBSalesHub
- `/home/peterchung/WBSalesHub/server/index.ts:8` - 환경변수 로드 (잠재적 문제)
- `/home/peterchung/WBSalesHub/Dockerfile` - Docker 빌드 설정

### Test Reports
- `/home/peterchung/HWTestAgent/test-results/MyTester/reports/2026-01-12-oracle-smoke-test.md` - 현재 실패 리포트

---

## Instructions for Completing Tasks

**IMPORTANT:** 각 작업 완료 후 반드시 `- [ ]`를 `- [x]`로 변경하여 진행 상황을 추적합니다.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (완료 후)

---

## Tasks

### Phase 1: 로컬 코드 수정 (병렬 가능)

- [ ] 1.0 [PARALLEL GROUP: code-fix] 코드 수정 (로컬 환경)
  - [ ] 1.1 WBHubManager 환경변수 로드 로직 수정 (Sub-Agent A)
    - File: `/home/peterchung/WBHubManager/server/index.ts:16-27`
    - Change: `override: true` → `override: false`
    - Add: `process.env.DATABASE_URL` 체크로 Docker 환경변수 우선 적용
    - Expected: Docker 환경변수가 있으면 파일 로드 skip
  - [ ] 1.2 WBHubManager docker-entrypoint.sh 기본값 변경 (Sub-Agent A)
    - File: `/home/peterchung/WBHubManager/docker-entrypoint.sh:7-8`
    - Change: `DB_HOST=${DB_HOST:-localhost}` → `DB_HOST=${DB_HOST:-postgres}`
    - Rationale: Docker Compose 네트워크에서 postgres 서비스명 사용
  - [ ] 1.3 WBSalesHub 환경변수 로드 개선 (Sub-Agent B, 선택사항)
    - File: `/home/peterchung/WBSalesHub/server/index.ts:8`
    - Add: `DATABASE_URL` 체크 로직 (일관성 확보)
    - Note: 현재는 정상 작동하나 동일한 패턴 적용 권장

### Phase 2: Git 커밋 & 푸시 (순차)

- [ ] 2.0 로컬 Git 작업
  - [ ] 2.1 WBHubManager Git commit
    - Command: `cd /home/peterchung/WBHubManager && git add server/index.ts docker-entrypoint.sh`
    - Commit message: `"fix: prioritize Docker env vars over .env files for DB connection"`
  - [ ] 2.2 WBHubManager Git push
    - Command: `git push origin main`
  - [ ] 2.3 WBSalesHub Git commit (1.3 완료 시)
    - Command: `cd /home/peterchung/WBSalesHub && git add server/index.ts`
    - Commit message: `"refactor: add explicit DATABASE_URL check for Docker env priority"`
  - [ ] 2.4 WBSalesHub Git push (1.3 완료 시)
    - Command: `git push origin main`

### Phase 3: 오라클 서버 배포 (병렬 가능)

- [ ] 3.0 [PARALLEL GROUP: oracle-deploy] 오라클 서버 업데이트
  - [ ] 3.1 WBHubManager 코드 업데이트 및 빌드 (Sub-Agent A)
    - Command: `ssh oracle-cloud "cd /home/ubuntu/workhub/WBHubManager && git pull origin main"`
    - Build: `ssh oracle-cloud "cd /home/ubuntu/workhub/WBHubManager && DOCKER_BUILDKIT=1 docker build -t wbhubmanager:test-build ."`
    - Expected: 빌드 시간 ~42초, 이미지 크기 262MB
  - [ ] 3.2 WBSalesHub 코드 업데이트 및 빌드 (Sub-Agent B, 1.3 완료 시)
    - Command: `ssh oracle-cloud "cd /home/ubuntu/workhub/WBSalesHub && git pull origin main"`
    - Build: `ssh oracle-cloud "cd /home/ubuntu/workhub/WBSalesHub && DOCKER_BUILDKIT=1 docker build -t wbsaleshub:test-build ."`
    - Expected: 빌드 시간 ~237초, 이미지 크기 353MB
  - [ ] 3.3 docker-compose.oracle.yml 환경변수 확인 (Sequential)
    - Command: `ssh oracle-cloud "cat /home/ubuntu/workhub/docker-compose.oracle.yml | grep -A 20 'wbhubmanager-test'"`
    - Check: `DB_HOST=postgres` 환경변수 존재 여부 확인
    - Action: 없으면 추가 필요

### Phase 4: 컨테이너 재시작 및 검증 (병렬 가능)

- [ ] 4.0 [PARALLEL GROUP: container-restart] 컨테이너 재시작
  - [ ] 4.1 WBHubManager 컨테이너 재시작 (Sub-Agent A)
    - Stop: `ssh oracle-cloud "docker rm -f wbhubmanager-test"`
    - Start: `ssh oracle-cloud "cd /home/ubuntu/workhub && docker-compose -f docker-compose.oracle.yml up -d wbhubmanager-test"`
    - Wait: 30초 대기 (Health check)
  - [ ] 4.2 WBSalesHub 컨테이너 재시작 (Sub-Agent B, 3.2 완료 시)
    - Stop: `ssh oracle-cloud "docker rm -f wbsaleshub-test"`
    - Start: `ssh oracle-cloud "cd /home/ubuntu/workhub && docker-compose -f docker-compose.oracle.yml up -d wbsaleshub-test"`
    - Wait: 30초 대기 (Health check)

- [ ] 5.0 로그 검증 (Sequential after 4.0)
  - [ ] 5.1 WBHubManager 로그 확인
    - Command: `ssh oracle-cloud "docker logs wbhubmanager-test 2>&1 | tail -50"`
    - Expected: "✅ Using DATABASE_URL from environment variables (Docker)"
    - Expected: "✅ Postgres is up - executing command"
    - Expected: "✅ Database connected successfully"
  - [ ] 5.2 WBSalesHub 로그 확인
    - Command: `ssh oracle-cloud "docker logs wbsaleshub-test 2>&1 | tail -50"`
    - Expected: No "localhost" connection errors
    - Expected: "Database connected successfully"

### Phase 5: 스모크 테스트 (병렬)

- [ ] 6.0 [PARALLEL GROUP: smoke-test] 스모크 테스트 실행
  - [ ] 6.1 WBHubManager 스모크 테스트 (Sub-Agent A)
    - Test 1: `curl http://158.180.95.246:4091/api/health` (Health Check)
    - Test 2: `curl http://158.180.95.246:4091/api/auth/jwt/public-key` (JWT Public Key)
    - Test 3: `curl http://158.180.95.246:4091/api/hubs` (Hub List - auth 필요 시 skip)
    - Test 4: `curl http://158.180.95.246:4091/` (Frontend Access)
    - Expected: 4/4 (100%) 통과
  - [ ] 6.2 WBSalesHub 스모크 테스트 (Sub-Agent B)
    - Test 1: `curl http://158.180.95.246:4011/api/health` (Health Check)
    - Test 2: `curl http://158.180.95.246:4011/api/health/db` (DB Connection Check)
    - Test 3: `curl http://158.180.95.246:4011/` (Frontend Access)
    - Expected: 3/3 (100%) 통과

### Phase 6: 최종 리포트 (Sequential)

- [ ] 7.0 최종 결과 리포트 작성
  - [ ] 7.1 테스트 결과 수집
    - HubManager: 통과율, 실패 항목, 개선 사항
    - SalesHub: 통과율, 실패 항목, 개선 사항
  - [ ] 7.2 리포트 작성
    - File: `/home/peterchung/HWTestAgent/test-results/MyTester/reports/2026-01-12-test-build-fix-result.md`
    - Format: 실행_작업.md 기반 Markdown
    - Include: Before/After 비교, 수정 사항, 검증 결과
  - [ ] 7.3 플랜 파일 업데이트
    - File: `/home/peterchung/.claude/plans/idempotent-marinating-blossom.md`
    - Status: "완료" 또는 "부분 완료" 기록

---

## Parallel Execution Strategy

### Group 1: code-fix (Phase 1)
- **Total Time**: ~5분
- **Sub-Agent A**: WBHubManager 수정 (1.1, 1.2)
- **Sub-Agent B**: WBSalesHub 수정 (1.3)
- **Dependency**: None (완전 독립)

### Group 2: oracle-deploy (Phase 3)
- **Total Time**: ~4분 (빌드 병렬 실행)
- **Sub-Agent A**: WBHubManager 빌드 (42초)
- **Sub-Agent B**: WBSalesHub 빌드 (237초)
- **Dependency**: Phase 2 완료 후

### Group 3: container-restart (Phase 4)
- **Total Time**: ~30초
- **Sub-Agent A**: wbhubmanager-test 재시작
- **Sub-Agent B**: wbsaleshub-test 재시작
- **Dependency**: Phase 3 완료 후

### Group 4: smoke-test (Phase 6)
- **Total Time**: ~10초
- **Sub-Agent A**: HubManager 4개 테스트
- **Sub-Agent B**: SalesHub 3개 테스트
- **Dependency**: Phase 5 완료 후

**예상 총 소요 시간**: ~10분 (병렬 실행 시)
**순차 실행 시**: ~20분 (50% 시간 절감)

---

## QA Testing & Verification

### Environment
- **Target**: Oracle Cloud (test-build containers)
- **Timeout**: 90s (production 환경 기준)
- **Retries**: 3 (최고 안정성)

### Verification Checklist
- [ ] Docker 환경변수 우선 적용 확인 (로그 "Using DATABASE_URL from environment variables")
- [ ] PostgreSQL 연결 성공 확인 (로그 "Postgres is up - executing command")
- [ ] Health Check API 200 응답 확인
- [ ] 전체 스모크 테스트 통과율 100% 달성

### Rollback Plan
수정 후 문제 발생 시:
1. Git revert: `git revert HEAD`
2. 기존 staging 이미지로 롤백: `docker tag wbhubmanager:staging wbhubmanager:test-build`
3. 컨테이너 재시작: `docker-compose up -d wbhubmanager-test`

---

## Notes

### Why Parallel Execution Works
1. **code-fix**: 서로 다른 프로젝트 디렉토리 수정 (파일 충돌 없음)
2. **oracle-deploy**: 독립된 Docker 빌드 컨텍스트 (BuildKit 캐시 공유 가능)
3. **container-restart**: 독립된 Docker 컨테이너 (네트워크만 공유)
4. **smoke-test**: 독립된 HTTP 요청 (서버 리소스만 공유)

### Critical Sequential Steps
1. **Phase 2 before Phase 3**: Git push 완료 후 오라클 서버 git pull
2. **Phase 3.3 (env check)**: 빌드 완료 후 docker-compose.yml 확인
3. **Phase 5 before Phase 6**: 로그 검증 후 스모크 테스트

### Template Used
- **Docker Build Optimization Template** (partially)
- **Multi-Hub Parallel Execution Pattern**

---

**Created**: 2026-01-12
**Plan Reference**: `/home/peterchung/.claude/plans/idempotent-marinating-blossom.md`
**Estimated Total Time**: ~10분 (병렬), ~20분 (순차)
