# Tasks: 로컬→오라클 DB 전환 + 연결 풀 최적화

## Relevant Files

### 신규 생성
- `/home/peterchung/WBOnboardingHub/server/lib/prisma.ts` - Prisma 싱글톤 패턴
- `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh` - SSH 터널링 스크립트
- `/home/peterchung/WHCommon/배포-가이드-로컬.md` - 로컬 개발 가이드

### 수정 (연결 풀 최적화)
- `/home/peterchung/WBHubManager/server/config/database.ts:1-100` - Pool 크기 환경별 분리
- `/home/peterchung/WBSalesHub/server/config/database.ts:1-100` - Pool 크기 축소
- `/home/peterchung/WBOnboardingHub/server/routes/auth.ts` - Prisma import 변경
- `/home/peterchung/WBOnboardingHub/server/routes/uploadLinks.ts` - Prisma import 변경
- `/home/peterchung/WBOnboardingHub/server/routes/api.ts` - Prisma import 변경
- `/home/peterchung/WBOnboardingHub/server/services/*.ts` - Prisma import 변경

### 수정 (DB 전환)
- `/home/peterchung/WBHubManager/.env.local` - DATABASE_URL 변경
- `/home/peterchung/WBSalesHub/.env.local` - DATABASE_URL 변경
- `/home/peterchung/WBFinHub/.env.local` - DATABASE_URL 변경
- `/home/peterchung/WBOnboardingHub/.env.local` - DATABASE_URL 변경
- `/home/peterchung/WHCommon/claude-context.md:1-500` - 로컬 DB 환경 섹션 업데이트

### Notes
- Step 0 (연결 풀 최적화)를 먼저 완료해야 Step 1-7 (DB 전환) 진행 가능
- 총 연결 수: 151개 → 45개 (운영) / 30개 (개발)로 감소 목표
- 환경변수 테스트는 로컬 Docker DB로 먼저 검증 후 오라클 DB 전환

## Instructions for Completing Tasks

**IMPORTANT:** 각 작업을 완료하면 `- [ ]`를 `- [x]`로 변경하여 진행 상황을 추적하세요.

---

## Tasks

### Phase 1: 연결 풀 최적화 (선행 작업)

- [ ] 0.0 Create feature branch (WBOnboardingHub)
  - [ ] 0.1 WBOnboardingHub로 이동: `cd /home/peterchung/WBOnboardingHub`
  - [ ] 0.2 최신 master 브랜치로 업데이트: `git checkout master && git pull`
  - [ ] 0.3 feature 브랜치 생성: `git checkout -b feature/connection-pool-optimization`

- [ ] 1.0 WBOnboardingHub Prisma 싱글톤 패턴 구현
  - [ ] 1.1 `server/lib/prisma.ts` 파일 생성
  - [ ] 1.2 Prisma 싱글톤 코드 작성 (globalForPrisma 패턴)
  - [ ] 1.3 development 환경에서 query 로깅 활성화
  - [ ] 1.4 beforeExit 이벤트에서 $disconnect 호출 추가

- [ ] 2.0 WBOnboardingHub Prisma 중복 인스턴스 제거 (자동 리팩토링)
  - [ ] 2.1 `new PrismaClient()` 사용 파일 검색: `grep -r "new PrismaClient()" server/`
  - [ ] 2.2 `server/routes/auth.ts` 리팩토링
    - `const prisma = new PrismaClient()` → `import { prisma } from '../lib/prisma'`
  - [ ] 2.3 `server/routes/uploadLinks.ts` 리팩토링
  - [ ] 2.4 `server/routes/api.ts` 리팩토링
  - [ ] 2.5 `server/services/auditLogService.ts` 리팩토링
  - [ ] 2.6 `server/services/documentService.ts` 리팩토링
  - [ ] 2.7 `server/services/approvalService.ts` 리팩토링
  - [ ] 2.8 `server/services/onboardingService.ts` 리팩토링
  - [ ] 2.9 기타 Prisma 사용 파일 리팩토링 (검색 결과 기반)

- [ ] 3.0 WBHubManager 연결 풀 환경별 설정
  - [ ] 3.1 `cd /home/peterchung/WBHubManager && git checkout -b feature/connection-pool-optimization`
  - [ ] 3.2 `server/config/database.ts` 파일 읽기
  - [ ] 3.3 Pool max 설정 변경: `max: 20` → `max: parseInt(process.env.DB_POOL_MAX || (process.env.NODE_ENV === 'production' ? '15' : '5'))`
  - [ ] 3.4 빌드 검증: `npm run build` (TypeScript 에러 확인)

- [ ] 4.0 WBSalesHub 연결 풀 크기 축소
  - [ ] 4.1 `cd /home/peterchung/WBSalesHub && git checkout -b feature/connection-pool-optimization`
  - [ ] 4.2 `server/config/database.ts` 파일 읽기
  - [ ] 4.3 Pool max 설정 변경: `max: 50` → `max: parseInt(process.env.DB_POOL_MAX || (process.env.NODE_ENV === 'production' ? '10' : '5'))`
  - [ ] 4.4 빌드 검증: `npm run build`

- [ ] 5.0 Phase 1 연결 테스트 (로컬 Docker DB)
  - [ ] 5.1 로컬 Docker PostgreSQL 실행 확인: `sudo docker ps | grep postgres`
  - [ ] 5.2 WBOnboardingHub 서버 실행: `npm run dev:server`
  - [ ] 5.3 로그에서 Prisma 연결 확인: "Database connected successfully"
  - [ ] 5.4 PostgreSQL 연결 수 확인:
    ```bash
    sudo docker exec -it wbhub-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'onboardinghub';"
    ```
  - [ ] 5.5 예상 연결 수: 10개 이하 확인 (기존 72개에서 감소)
  - [ ] 5.6 WBHubManager 서버 실행 및 연결 수 확인 (15개 이하)
  - [ ] 5.7 WBSalesHub 서버 실행 및 연결 수 확인 (10개 이하)

- [ ] 6.0 Phase 1 커밋 및 푸시
  - [ ] 6.1 WBOnboardingHub 커밋: `git add . && git commit -m "feat: Prisma 싱글톤 패턴 적용으로 연결 수 72개→10개 감소"`
  - [ ] 6.2 WBOnboardingHub 푸시: `git push origin feature/connection-pool-optimization`
  - [ ] 6.3 WBHubManager 커밋: `git add . && git commit -m "feat: 연결 풀 환경별 설정 (운영 15개, 개발 5개)"`
  - [ ] 6.4 WBHubManager 푸시: `git push origin feature/connection-pool-optimization`
  - [ ] 6.5 WBSalesHub 커밋: `git add . && git commit -m "feat: 연결 풀 크기 축소 (50개→10개)"`
  - [ ] 6.6 WBSalesHub 푸시: `git push origin feature/connection-pool-optimization`

---

### Phase 2: 오라클 DB 전환

- [ ] 7.0 Doppler에서 DB 비밀번호 확인
  - [ ] 7.1 Doppler 토큰 파일 읽기: `cat /home/peterchung/WHCommon/env.doppler | grep HUBMANAGER_PRD`
  - [ ] 7.2 환경변수 다운로드 (또는 오라클 서버 SSH 접속 후 확인):
    ```bash
    # 로컬에서 Doppler CLI 사용 (설치되어 있다면)
    # doppler secrets download --project hubmanager --config prd

    # 또는 오라클 서버 접속
    ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246
    cat /home/ubuntu/workhub/WBHubManager/.env.prd | grep DATABASE_URL
    ```
  - [ ] 7.3 비밀번호 추출: `postgresql://workhub:[이 부분]@...`
  - [ ] 7.4 비밀번호 복사 (다음 단계에서 사용)

- [ ] 8.0 오라클 서버에 개발 전용 DB 생성
  - [ ] 8.1 오라클 서버 SSH 접속: `ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246`
  - [ ] 8.2 PostgreSQL 컨테이너 확인: `docker ps | grep postgres`
  - [ ] 8.3 개발 DB 생성:
    ```bash
    docker exec -it workhub-postgres psql -U workhub -c 'CREATE DATABASE "dev-hubmanager";'
    docker exec -it workhub-postgres psql -U workhub -c 'CREATE DATABASE "dev-saleshub";'
    docker exec -it workhub-postgres psql -U workhub -c 'CREATE DATABASE "dev-finhub";'
    docker exec -it workhub-postgres psql -U workhub -c 'CREATE DATABASE "dev-onboardinghub";'
    ```
  - [ ] 8.4 생성 확인: `docker exec -it workhub-postgres psql -U workhub -c "\l" | grep dev-`
  - [ ] 8.5 각 DB 생성 확인: dev-hubmanager, dev-saleshub, dev-finhub, dev-onboardinghub

- [ ] 9.0 오라클 서버 개발 DB 스키마 초기화
  - [ ] 9.1 WBHubManager 스키마 생성:
    ```bash
    cd /home/ubuntu/workhub/WBHubManager
    docker exec -i workhub-postgres psql -U workhub -d dev-hubmanager < server/database/schema/users.sql
    docker exec -i workhub-postgres psql -U workhub -d dev-hubmanager < server/database/schema/hubs.sql
    ```
  - [ ] 9.2 WBSalesHub 스키마 생성:
    ```bash
    cd /home/ubuntu/workhub/WBSalesHub
    docker exec -i workhub-postgres psql -U workhub -d dev-saleshub < server/database/schema.sql
    ```
  - [ ] 9.3 WBFinHub 스키마 생성:
    ```bash
    cd /home/ubuntu/workhub/WBFinHub
    docker exec -i workhub-postgres psql -U workhub -d dev-finhub < server/database/schema.sql
    ```
  - [ ] 9.4 WBOnboardingHub 스키마 생성:
    ```bash
    cd /home/ubuntu/workhub/WBOnboardingHub
    docker exec -i workhub-postgres psql -U workhub -d dev-onboardinghub < server/database/schema.sql
    ```
  - [ ] 9.5 오라클 서버 SSH 종료: `exit`

- [ ] 10.0 SSH 터널링 스크립트 생성
  - [ ] 10.1 스크립트 파일 생성: `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh`
  - [ ] 10.2 스크립트 내용 작성 (echo 메시지, ssh -L 5432:localhost:5432)
  - [ ] 10.3 실행 권한 부여: `chmod +x /home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh`
  - [ ] 10.4 테스트 실행 (별도 터미널): `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh`
  - [ ] 10.5 터널링 프로세스 확인: `ps aux | grep ssh | grep 5432`

- [ ] 11.0 각 허브 환경변수 변경 (.env.local)
  - [ ] 11.1 WBHubManager `.env.local` 백업: `cp .env.local .env.local.backup`
  - [ ] 11.2 WBHubManager `.env.local` 수정:
    - `DATABASE_URL=postgresql://workhub:[Step7_비밀번호]@localhost:5432/dev-hubmanager?schema=public`
    - `DB_PROVIDER=oracle`
    - `DB_SSL=false`
  - [ ] 11.3 WBSalesHub `.env.local` 백업 및 수정:
    - `DATABASE_URL=postgresql://workhub:[비밀번호]@localhost:5432/dev-saleshub?schema=public`
    - `HUBMANAGER_DATABASE_URL=postgresql://workhub:[비밀번호]@localhost:5432/dev-hubmanager?schema=public`
  - [ ] 11.4 WBFinHub `.env.local` 백업 및 수정:
    - `DATABASE_URL=postgresql://workhub:[비밀번호]@localhost:5432/dev-finhub?schema=public&connection_limit=10&pool_timeout=20`
  - [ ] 11.5 WBOnboardingHub `.env.local` 백업 및 수정:
    - `DATABASE_URL=postgresql://workhub:[비밀번호]@localhost:5432/dev-onboardinghub?schema=public&connection_limit=10&pool_timeout=20`
    - `HUBMANAGER_DATABASE_URL=postgresql://workhub:[비밀번호]@localhost:5432/dev-hubmanager?schema=public`

- [ ] 12.0 [PARALLEL GROUP: hub-connection-test] 각 허브 연결 테스트
  - [ ] 12.1 SSH 터널링 실행 확인 (별도 터미널에서 실행 중이어야 함)
  - [ ] 12.2 WBHubManager 서버 실행: `cd /home/peterchung/WBHubManager && npm run dev:server`
  - [ ] 12.3 WBHubManager 로그 확인: "Database connected successfully", "Listening on port 4090"
  - [ ] 12.4 WBSalesHub 서버 실행: `cd /home/peterchung/WBSalesHub && npm run dev:server`
  - [ ] 12.5 WBSalesHub 로그 확인: "Database connected successfully", "Listening on port 4010"
  - [ ] 12.6 WBFinHub 서버 실행: `cd /home/peterchung/WBFinHub && npm run dev:server`
  - [ ] 12.7 WBFinHub 로그 확인: "Database connected successfully", "Listening on port 4020"
  - [ ] 12.8 WBOnboardingHub 서버 실행: `cd /home/peterchung/WBOnboardingHub && npm run dev:server`
  - [ ] 12.9 WBOnboardingHub 로그 확인: "Database connected successfully", "Listening on port 4030"

- [ ] 13.0 Health Check 및 연결 수 확인
  - [ ] 13.1 각 허브 Health 엔드포인트 확인:
    ```bash
    curl http://localhost:4090/health  # HubManager
    curl http://localhost:4010/health  # SalesHub
    curl http://localhost:4020/health  # FinHub
    curl http://localhost:4030/health  # OnboardingHub
    ```
  - [ ] 13.2 오라클 서버에서 총 연결 수 확인:
    ```bash
    ssh oracle-cloud "docker exec -it workhub-postgres psql -U workhub -c \"SELECT datname, count(*) FROM pg_stat_activity WHERE datname LIKE 'dev-%' GROUP BY datname;\""
    ```
  - [ ] 13.3 총 연결 수 확인: 약 30-45개 이내 (목표 달성)

---

### Phase 3: 문서 업데이트

- [ ] 14.0 claude-context.md 업데이트
  - [ ] 14.1 파일 읽기: `/home/peterchung/WHCommon/claude-context.md`
  - [ ] 14.2 "로컬 개발 데이터베이스 환경" 섹션 찾기
  - [ ] 14.3 내용 업데이트:
    - 오라클 개발 DB 사용 (SSH 터널링)
    - SSH 터널링 스크립트 경로
    - 운영 DB 격리 정보
    - 주의사항 추가
  - [ ] 14.4 변경사항 검토

- [ ] 15.0 배포-가이드-로컬.md 신규 생성
  - [ ] 15.1 파일 생성: `/home/peterchung/WHCommon/배포-가이드-로컬.md`
  - [ ] 15.2 내용 작성:
    - SSH 터널링 설정 방법
    - 환경변수 설정 가이드
    - 서버 실행 절차
    - 주의사항 및 롤백 방법
  - [ ] 15.3 문서 검토 및 최종 확인

- [ ] 16.0 최종 커밋 및 문서화
  - [ ] 16.1 WHCommon 변경사항 커밋:
    ```bash
    cd /home/peterchung/WHCommon
    git add claude-context.md 배포-가이드-로컬.md scripts/ssh-tunnel-oracle-db.sh
    git commit -m "docs: 로컬 개발 환경 오라클 DB 전환 문서 업데이트"
    git push origin master
    ```
  - [ ] 16.2 작업 계획 파일 정리: `/home/peterchung/WHCommon/OnProgress/로컬-오라클DB-전환-계획.md` 완료로 표시

---

## 환경별 테스트 전략

이 섹션은 `/home/peterchung/WHCommon/실행_작업.md`의 "QA Testing & Server Management > 2. 환경별 테스트 전략"을 참조합니다.

### Local Development (빠른 피드백)
- **연결 테스트**: timeout 10s, 각 허브별 순차 실행
- **Health Check**: 30초

### Oracle Production
- **연결 테스트**: timeout 60s (네트워크 레이턴시 고려)
- **Health Check**: 60초

---

## 프론트엔드 실행 전 보장 체크리스트

- [ ] SSH 터널링 실행 확인
- [ ] 백엔드 서버 정상 구동 확인 (각 허브 4개)
- [ ] 데이터베이스 연결 확인 (Health Check)
- [ ] 총 연결 수 확인 (30-45개 이내)
- [ ] 로그에 에러 없음 확인

**중요:** 위 체크리스트 중 하나라도 실패하면 문제를 해결한 후 다시 검증해야 합니다.
