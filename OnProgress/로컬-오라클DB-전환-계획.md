# 로컬 개발 환경 → 오라클 DB 전환 계획

**작성일**: 2026-01-12
**목적**: 로컬 개발/테스트 시 오라클 클라우드의 개발 전용 DB를 사용하도록 전환

---

## 선택사항 요약

- ✅ **접속 방식**: SSH 터널링 (보안 우수, 방화벽 설정 불필요)
- ✅ **DB 선택**: 개발 전용 DB 신규 생성 (운영 DB와 격리)
- ✅ **환경변수 관리**: `.env.local` 직접 수정

---

## 1. 현재 상태 (Before)

### 로컬 개발 DB (Docker PostgreSQL)
```
localhost:5432
- hubmanager (사용자: postgres/postgres)
- saleshub (사용자: postgres/postgres)
- finhub (사용자: postgres/postgres)
- onboardinghub (사용자: postgres/postgres)
```

### 환경변수 (.env.local)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/[dbname]?schema=public
```

---

## 2. 변경 후 상태 (After)

### 오라클 서버 개발 전용 DB
```
158.180.95.246:5432 (SSH 터널링: localhost:5432)
- dev-hubmanager (사용자: workhub/[password])
- dev-saleshub (사용자: workhub/[password])
- dev-finhub (사용자: workhub/[password])
- dev-onboardinghub (사용자: workhub/[password])
```

### 환경변수 (.env.local)
```env
# SSH 터널링 사용 시 localhost 유지
DATABASE_URL=postgresql://workhub:[password]@localhost:5432/dev-[dbname]?schema=public
```

---

## 3. 작업 단계

### Phase 1: 오라클 서버에 개발 DB 생성

#### 1.1 오라클 서버 접속
```bash
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246
```

#### 1.2 PostgreSQL 컨테이너 확인
```bash
docker ps | grep postgres
# 예상: workhub-postgres 컨테이너 실행 중
```

#### 1.3 개발 전용 DB 생성
```bash
docker exec -it workhub-postgres psql -U workhub -c "CREATE DATABASE \"dev-hubmanager\";"
docker exec -it workhub-postgres psql -U workhub -c "CREATE DATABASE \"dev-saleshub\";"
docker exec -it workhub-postgres psql -U workhub -c "CREATE DATABASE \"dev-finhub\";"
docker exec -it workhub-postgres psql -U workhub -c "CREATE DATABASE \"dev-onboardinghub\";"
```

#### 1.4 DB 생성 확인
```bash
docker exec -it workhub-postgres psql -U workhub -c "\l" | grep dev-
```

---

### Phase 2: 로컬에서 SSH 터널링 설정

#### 2.1 SSH 터널링 스크립트 생성
**파일**: `/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh`

```bash
#!/bin/bash
# SSH 터널링을 통한 오라클 DB 접속 스크립트

echo "🔒 SSH 터널링 시작: 오라클 PostgreSQL → localhost:5432"
ssh -i ~/.ssh/oracle-cloud.key \
    -L 5432:localhost:5432 \
    -N \
    ubuntu@158.180.95.246
```

#### 2.2 스크립트 실행 권한 부여
```bash
chmod +x /home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh
```

#### 2.3 백그라운드 실행 (선택)
```bash
# 터미널 세션과 무관하게 실행
nohup /home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh > /tmp/ssh-tunnel.log 2>&1 &
```

---

### Phase 3: 각 허브별 환경변수 변경

#### 3.1 WBHubManager
**파일**: `/home/peterchung/WBHubManager/.env.local`

**변경 전**:
```env
DATABASE_URL=postgresql://workhub:YOUR_PASSWORD@localhost:5432/hubmanager?schema=public
```

**변경 후**:
```env
DATABASE_URL=postgresql://workhub:[실제비밀번호]@localhost:5432/dev-hubmanager?schema=public
DB_PROVIDER=oracle
DB_SSL=false
```

#### 3.2 WBSalesHub
**파일**: `/home/peterchung/WBSalesHub/.env.local`

**변경 전**:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saleshub?schema=public
HUBMANAGER_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hubmanager?schema=public
```

**변경 후**:
```env
DATABASE_URL=postgresql://workhub:[실제비밀번호]@localhost:5432/dev-saleshub?schema=public
HUBMANAGER_DATABASE_URL=postgresql://workhub:[실제비밀번호]@localhost:5432/dev-hubmanager?schema=public
```

#### 3.3 WBFinHub
**파일**: `/home/peterchung/WBFinHub/.env.local`

**변경 전**:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finhub?schema=public
```

**변경 후**:
```env
DATABASE_URL=postgresql://workhub:[실제비밀번호]@localhost:5432/dev-finhub?schema=public
```

#### 3.4 WBOnboardingHub
**파일**: `/home/peterchung/WBOnboardingHub/.env.local`

**변경 전**:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/onboardinghub?schema=public
HUBMANAGER_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hubmanager?schema=public
```

**변경 후**:
```env
DATABASE_URL=postgresql://workhub:[실제비밀번호]@localhost:5432/dev-onboardinghub?schema=public
HUBMANAGER_DATABASE_URL=postgresql://workhub:[실제비밀번호]@localhost:5432/dev-hubmanager?schema=public
```

---

### Phase 4: 데이터베이스 마이그레이션 실행

각 허브별로 스키마 마이그레이션을 실행합니다.

#### 4.1 WBHubManager
```bash
cd /home/peterchung/WBHubManager

# 기존 스키마 생성
docker exec -i workhub-postgres psql -U workhub -d dev-hubmanager < server/database/schema/users.sql
docker exec -i workhub-postgres psql -U workhub -d dev-hubmanager < server/database/schema/hubs.sql

# 마이그레이션 실행
find server/database/migrations -name "*.sql" | sort | while read f; do
  echo "실행: $f"
  docker exec -i workhub-postgres psql -U workhub -d dev-hubmanager < "$f"
done
```

#### 4.2 WBSalesHub
```bash
cd /home/peterchung/WBSalesHub

# 스키마 생성
docker exec -i workhub-postgres psql -U workhub -d dev-saleshub < server/database/schema.sql

# 마이그레이션 실행
find server/database/migrations -name "*.sql" | sort | while read f; do
  echo "실행: $f"
  docker exec -i workhub-postgres psql -U workhub -d dev-saleshub < "$f"
done
```

#### 4.3 WBFinHub
```bash
cd /home/peterchung/WBFinHub

# 스키마 생성
docker exec -i workhub-postgres psql -U workhub -d dev-finhub < server/database/schema.sql

# 마이그레이션 실행 (있다면)
find server/database/migrations -name "*.sql" | sort | while read f; do
  echo "실행: $f"
  docker exec -i workhub-postgres psql -U workhub -d dev-finhub < "$f"
done
```

#### 4.4 WBOnboardingHub
```bash
cd /home/peterchung/WBOnboardingHub

# 스키마 생성
docker exec -i workhub-postgres psql -U workhub -d dev-onboardinghub < server/database/schema.sql

# 마이그레이션 실행 (있다면)
find server/database/migrations -name "*.sql" | sort | while read f; do
  echo "실행: $f"
  docker exec -i workhub-postgres psql -U workhub -d dev-onboardinghub < "$f"
done
```

---

### Phase 5: 연결 테스트

각 허브별로 서버를 실행하여 DB 연결을 확인합니다.

```bash
# 1. SSH 터널링 실행 (별도 터미널)
/home/peterchung/WHCommon/scripts/ssh-tunnel-oracle-db.sh

# 2. 각 허브별 서버 실행 (별도 터미널)
cd /home/peterchung/WBHubManager && npm run dev:server
cd /home/peterchung/WBSalesHub && npm run dev:server
cd /home/peterchung/WBFinHub && npm run dev:server
cd /home/peterchung/WBOnboardingHub && npm run dev:server

# 3. 로그 확인
# "Database connected successfully" 메시지 확인
```

---

## 4. 주의사항

### SSH 터널링 관리
- ✅ **SSH 터널링은 항상 먼저 실행**: 서버 시작 전에 터널링 실행 필요
- ✅ **프로세스 확인**: `ps aux | grep ssh | grep 5432`
- ✅ **종료**: `pkill -f "ssh.*5432:localhost:5432"`

### 데이터 격리
- ✅ **개발 DB 전용**: `dev-*` 데이터베이스는 로컬 개발 전용
- ✅ **운영 DB 보호**: 운영 DB (`hubmanager`, `saleshub` 등)는 건드리지 않음
- ✅ **데이터 초기화**: 개발 DB는 언제든지 DROP/CREATE 가능

### 성능
- ⚠️ **네트워크 레이턴시**: 로컬 Docker DB 대비 10-100ms 추가 지연 예상
- ⚠️ **연결 수 제한**: PostgreSQL 최대 연결 수 확인 필요 (기본 100개)

---

## 5. 롤백 계획

로컬 Docker DB로 되돌리려면:

### 5.1 SSH 터널링 종료
```bash
pkill -f "ssh.*5432:localhost:5432"
```

### 5.2 환경변수 복원
각 허브의 `.env.local` 파일을 원래대로 복원:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/[dbname]?schema=public
```

### 5.3 로컬 Docker PostgreSQL 재시작
```bash
sudo docker start wbhub-postgres
```

---

## 6. 관련 문서 업데이트 필요

- `/home/peterchung/WHCommon/claude-context.md` - "로컬 개발 데이터베이스 환경" 섹션
- `/home/peterchung/WHCommon/배포-가이드-로컬.md` (없으면 신규 생성)

---

## 다음 단계

1. ✅ 이 계획서 검토
2. ⏳ Doppler에서 `workhub` 사용자 비밀번호 확인
3. ⏳ Phase 1-5 순차 실행
4. ⏳ 관련 문서 업데이트
