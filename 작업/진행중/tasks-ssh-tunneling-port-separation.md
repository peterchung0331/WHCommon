# Task List: SSH 터널링 포트 분리 구현

**Feature:** 허브별 SSH 터널링 포트 분리
**Created:** 2026-01-12
**Status:** In Progress

## Overview

로컬 개발 환경에서 각 허브가 독립적인 SSH 터널링 포트를 사용하여 오라클 DB에 접근하도록 구성합니다.

**Problem:**
- 로컬 Docker PostgreSQL과 SSH 터널링이 5432 포트 충돌
- 현재 `.env.local` 설정은 오라클 DB를 가리키지만 연결 실패

**Solution:**
- 허브별 독립 SSH 터널링 포트 할당 (5434-5437)
- 통합 및 개별 터널링 스크립트 제공

## Port Mapping Strategy

| Hub | Oracle DB | Local SSH Port | Database |
|-----|-----------|----------------|----------|
| WBHubManager | 5432 | → 5434 | dev-hubmanager |
| WBSalesHub | 5432 | → 5435 | dev-saleshub |
| WBFinHub | 5432 | → 5436 | dev-finhub |
| WBOnboardingHub | 5432 | → 5437 | dev-onboardinghub |

## Relevant Files

### Files to Create
- `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-all.sh`
- `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-hubmanager.sh`
- `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-saleshub.sh`
- `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-finhub.sh`
- `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-onboarding.sh`

### Files to Modify
- `/home/peterchung/WBHubManager/.env.local`
- `/home/peterchung/WBSalesHub/.env.local`
- `/home/peterchung/WHCommon/claude-context.md`
- `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh`

## Tasks

### 0.0 준비 작업
- [x] 0.1 기존 SSH 터널링 프로세스 종료
- [ ] 0.2 실행_작업.md 기반 Task 생성 완료

---

### 1.0 [PARALLEL GROUP: script-creation] SSH 터널링 스크립트 생성

#### 1.1 통합 스크립트 생성
- [ ] 1.1.1 `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-all.sh` 생성
  - 모든 허브(4개) SSH 터널링 동시 시작
  - 포트 5434-5437 매핑
  - 기존 프로세스 자동 종료 기능
  - 터널링 상태 확인 기능
- [ ] 1.1.2 실행 권한 부여 (`chmod +x`)

#### 1.2 [PARALLEL GROUP: individual-scripts] 개별 허브 스크립트 생성
- [ ] 1.2.1 `ssh-tunnel-oracle-hubmanager.sh` 생성 (포트 5434)
- [ ] 1.2.2 `ssh-tunnel-oracle-saleshub.sh` 생성 (포트 5435)
- [ ] 1.2.3 `ssh-tunnel-oracle-finhub.sh` 생성 (포트 5436)
- [ ] 1.2.4 `ssh-tunnel-oracle-onboarding.sh` 생성 (포트 5437)
- [ ] 1.2.5 모든 스크립트에 실행 권한 부여

---

### 2.0 [PARALLEL GROUP: env-update] 환경변수 파일 업데이트

#### 2.1 WBHubManager 설정 변경
- [ ] 2.1.1 `.env.local` DATABASE_URL 포트 변경 (5432 → 5434)
  ```bash
  DATABASE_URL="postgresql://postgres:Wnsgh22dml2026@localhost:5434/dev-hubmanager?connection_limit=3&pool_timeout=20"
  ```

#### 2.2 WBSalesHub 설정 변경
- [ ] 2.2.1 `.env.local` DATABASE_URL 포트 변경 (5432 → 5435)
- [ ] 2.2.2 `.env.local` HUBMANAGER_DATABASE_URL 포트 변경 (5432 → 5434)
  ```bash
  DATABASE_URL="postgresql://postgres:Wnsgh22dml2026@localhost:5435/dev-saleshub?connection_limit=3&pool_timeout=20"
  HUBMANAGER_DATABASE_URL="postgresql://postgres:Wnsgh22dml2026@localhost:5434/dev-hubmanager?connection_limit=3&pool_timeout=20"
  ```

#### 2.3 WBFinHub 설정 변경 (해당 시)
- [ ] 2.3.1 `.env.local` 파일 존재 여부 확인
- [ ] 2.3.2 DATABASE_URL 포트 변경 (5432 → 5436)

#### 2.4 WBOnboardingHub 설정 변경 (해당 시)
- [ ] 2.4.1 `.env.local` 파일 존재 여부 확인
- [ ] 2.4.2 DATABASE_URL 포트 변경 (5432 → 5437)

---

### 3.0 문서 업데이트

#### 3.1 claude-context.md 업데이트
- [ ] 3.1.1 "로컬 개발 데이터베이스 환경" 섹션 찾기
- [ ] 3.1.2 SSH 터널링 포트 매핑 정보 업데이트
  - HubManager: localhost:5434
  - SalesHub: localhost:5435
  - FinHub: localhost:5436
  - OnboardingHub: localhost:5437
- [ ] 3.1.3 SSH 터널링 스크립트 경로 업데이트
  - 통합: `ssh-tunnel-oracle-all.sh`
  - 개별: `ssh-tunnel-oracle-{hub}.sh`
- [ ] 3.1.4 터널링 확인/종료 명령어 업데이트
  ```bash
  # 확인: ps aux | grep "ssh.*543[4-7]"
  # 종료: pkill -f "ssh.*543[4-7]"
  ```

#### 3.2 기존 단일 포트 스크립트에 Deprecated 경고 추가
- [ ] 3.2.1 `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh` 파일 열기
- [ ] 3.2.2 파일 상단에 Deprecated 경고 및 대안 안내 추가
- [ ] 3.2.3 사용자 확인 프롬프트 추가

---

### 4.0 [PARALLEL GROUP: validation] 검증 및 테스트

#### 4.1 SSH 터널링 검증
- [ ] 4.1.1 통합 스크립트 실행
  ```bash
  /home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-all.sh
  ```
- [ ] 4.1.2 터널링 프로세스 4개 실행 확인
  ```bash
  ps aux | grep "[s]sh.*543[4-7]"
  ```
- [ ] 4.1.3 포트 리스닝 상태 확인
  ```bash
  ss -tlnp | grep -E "543[4-7]"
  ```

#### 4.2 [PARALLEL GROUP: db-connection-test] DB 연결 테스트
- [ ] 4.2.1 HubManager DB 연결 테스트 (포트 5434)
  ```bash
  PGPASSWORD=Wnsgh22dml2026 psql -h localhost -p 5434 -U postgres -d dev-hubmanager -c "SELECT current_database()"
  ```
- [ ] 4.2.2 SalesHub DB 연결 테스트 (포트 5435)
  ```bash
  PGPASSWORD=Wnsgh22dml2026 psql -h localhost -p 5435 -U postgres -d dev-saleshub -c "SELECT current_database()"
  ```
- [ ] 4.2.3 FinHub DB 연결 테스트 (포트 5436)
- [ ] 4.2.4 OnboardingHub DB 연결 테스트 (포트 5437)

#### 4.3 서버 시작 테스트
- [ ] 4.3.1 기존 서버 프로세스 종료
  ```bash
  fuser -k 4090/tcp 4010/tcp
  ```
- [ ] 4.3.2 WBHubManager 백그라운드 시작
  ```bash
  cd /home/peterchung/WBHubManager && nohup npm run dev:local > /tmp/hubmanager.log 2>&1 &
  ```
- [ ] 4.3.3 WBSalesHub 백그라운드 시작
  ```bash
  cd /home/peterchung/WBSalesHub && nohup npm run dev:local > /tmp/saleshub.log 2>&1 &
  ```
- [ ] 4.3.4 서버 시작 대기 (10초)
- [ ] 4.3.5 로그 확인 (DB 연결 성공 메시지)
  ```bash
  tail -30 /tmp/hubmanager.log | grep -E "Database|✅|❌"
  tail -30 /tmp/saleshub.log | grep -E "Database|✅|❌"
  ```

#### 4.4 헬스체크
- [ ] 4.4.1 HubManager 헬스체크
  ```bash
  curl -s http://localhost:4090/api/health | grep success
  ```
- [ ] 4.4.2 SalesHub 헬스체크
  ```bash
  curl -s http://localhost:4010/api/health | grep success
  ```

---

### 5.0 E2E 통합 테스트

#### 5.1 SSO 인증 플로우 테스트
- [ ] 5.1.1 HubManager dev-login으로 JWT 토큰 획득
  ```bash
  TOKEN=$(curl -s "http://localhost:4090/api/auth/dev-login?email=test@wavebridge.com" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  ```
- [ ] 5.1.2 토큰으로 HubManager 사용자 정보 조회
  ```bash
  curl -s "http://localhost:4090/api/auth/me" -b /tmp/cookies.txt
  ```
- [ ] 5.1.3 SalesHub SSO 엔드포인트 테스트
  ```bash
  curl -s "http://localhost:4010/auth/sso?token=$TOKEN"
  ```
- [ ] 5.1.4 SalesHub API 접근 테스트
  ```bash
  curl -s http://localhost:4010/api/customers
  ```

#### 5.2 고객 데이터 CRUD 테스트
- [ ] 5.2.1 고객 목록 조회
- [ ] 5.2.2 특정 고객 상세 조회
- [ ] 5.2.3 미팅 목록 조회
- [ ] 5.2.4 계정 목록 조회

---

### 6.0 최종 정리 및 문서화

#### 6.1 결과 기록
- [ ] 6.1.1 Task 완료 상태를 `WHCommon/tasks/tasks-ssh-tunneling-port-separation.md`에 업데이트
- [ ] 6.1.2 테스트 결과 요약 작성

#### 6.2 Git 커밋
- [ ] 6.2.1 변경 파일 스테이징
  ```bash
  git add WHCommon/scripts/ssh-tunnel-oracle-*.sh
  git add WBHubManager/.env.local
  git add WBSalesHub/.env.local
  git add WHCommon/claude-context.md
  git add WHCommon/tasks/tasks-ssh-tunneling-port-separation.md
  ```
- [ ] 6.2.2 커밋 메시지 작성 및 커밋
  ```bash
  git commit -m "feat: SSH 터널링 허브별 포트 분리 구현

  - 허브별 독립 SSH 터널링 포트 할당 (5434-5437)
  - 통합/개별 터널링 스크립트 생성
  - .env.local 설정 업데이트 (HubManager, SalesHub)
  - claude-context.md 문서 업데이트
  - 기존 단일 포트 스크립트 deprecated 표시

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
  ```

---

## Parallel Execution Groups

### Group 1: `script-creation` (병렬 실행 가능)
- **Task 1.1**: 통합 스크립트 생성
- **Task 1.2**: 개별 허브 스크립트 생성 (1.2.1-1.2.4)

**독립성**: 각 스크립트는 독립적인 파일이므로 동시 생성 가능

### Group 2: `env-update` (병렬 실행 가능)
- **Task 2.1**: WBHubManager `.env.local` 수정
- **Task 2.2**: WBSalesHub `.env.local` 수정
- **Task 2.3**: WBFinHub `.env.local` 수정 (해당 시)
- **Task 2.4**: WBOnboardingHub `.env.local` 수정 (해당 시)

**독립성**: 각 허브는 독립된 저장소이므로 동시 수정 가능

### Group 3: `validation` (일부 병렬 가능)
- **Task 4.1**: SSH 터널링 검증 (순차)
- **Task 4.2**: DB 연결 테스트 (4.2.1-4.2.4 병렬 가능)
- **Task 4.3**: 서버 시작 테스트 (순차)
- **Task 4.4**: 헬스체크 (4.4.1-4.4.2 병렬 가능)

**독립성**: DB 연결 테스트는 각 포트별로 독립적이므로 병렬 실행 가능

### Group 4: `db-connection-test` (완전 병렬 가능)
- **Task 4.2.1**: HubManager DB 연결
- **Task 4.2.2**: SalesHub DB 연결
- **Task 4.2.3**: FinHub DB 연결
- **Task 4.2.4**: OnboardingHub DB 연결

**독립성**: 각 DB 연결은 독립적인 포트와 데이터베이스 사용

---

## Notes

### 장점
1. ✅ **포트 충돌 완전 해소**: 로컬 Docker PostgreSQL(5432, 5433)과 SSH 터널링(5434-5437) 독립
2. ✅ **오라클 DB 데이터 사용**: 개발/스테이징/운영 환경과 동일한 데이터로 로컬 테스트
3. ✅ **허브별 독립 관리**: 필요한 허브만 선택적으로 터널링 실행 가능
4. ✅ **로컬 DB와 공존**: 로컬 Docker PostgreSQL도 계속 사용 가능

### 주의사항
1. ⚠️ **SSH 터널링 필수**: 로컬 서버 실행 전 반드시 터널링 스크립트 실행 필요
2. ⚠️ **네트워크 레이턴시**: SSH 터널링으로 인한 지연 발생 (10-100ms)
3. ⚠️ **프로세스 관리**: 4개의 SSH 프로세스 동시 실행 (약 32MB 메모리)
4. ⚠️ **터널 끊김 대응**: SSH 연결이 끊어지면 서버 DB 연결 실패 발생

### 롤백 계획
문제 발생 시 로컬 Docker PostgreSQL로 전환:
```bash
# .env.local 수정
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wbsaleshub"

# SSH 터널링 종료
pkill -f "ssh.*543[4-7]"
```

---

## Progress Tracking

**Created**: 2026-01-12
**Last Updated**: 2026-01-12
**Completion**: 1/30 tasks (3%)
