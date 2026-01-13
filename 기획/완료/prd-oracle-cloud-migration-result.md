# Oracle Cloud 마이그레이션 완료 보고서

**작업일**: 2026-01-01
**담당**: Claude Code
**상태**: ✅ 완료

---

## 📋 목차

1. [개요](#개요)
2. [마이그레이션 대상](#마이그레이션-대상)
3. [인프라 구성](#인프라-구성)
4. [배포 아키텍처](#배포-아키텍처)
5. [작업 내역](#작업-내역)
6. [환경 설정](#환경-설정)
7. [접속 정보](#접속-정보)
8. [운영 가이드](#운영-가이드)
9. [트러블슈팅](#트러블슈팅)
10. [향후 계획](#향후-계획)

---

## 개요

### 마이그레이션 목적
- Railway 의존성 제거 및 자체 인프라 구축
- 비용 절감 (Railway 유료 → Oracle Cloud Always Free)
- 멀티 클라우드 전략 구축 (Oracle 주, AWS 부, Railway 백업)

### 마이그레이션 범위
- **대상 프로젝트**: WBHubManager (프론트엔드 + 백엔드)
- **데이터베이스**: PostgreSQL 16 (Railway → Oracle Cloud)
- **환경 변수**: Doppler 중앙 관리 시스템 구축

### 마이그레이션 결과
- ✅ **성공**: WBHubManager 프론트엔드 및 백엔드 정상 실행
- ✅ **성공**: PostgreSQL 데이터베이스 정상 작동
- ✅ **성공**: PM2 프로세스 관리 시스템 구축
- ✅ **성공**: GitHub Actions 자동 배포 워크플로우 설정

---

## 마이그레이션 대상

### 1. WBHubManager (완료)
- **프론트엔드**: Next.js 16 (포트 3090)
- **백엔드**: Node.js Express (포트 4090)
- **데이터베이스**: PostgreSQL 16
- **상태**: ✅ 배포 완료 및 정상 작동

### 2. 향후 마이그레이션 대상
- [ ] WBFinHub
- [ ] WBSalesHub
- [ ] WBOnboardingHub
- [ ] WHTestAgent

---

## 인프라 구성

### Oracle Cloud 인스턴스

#### 기본 정보
```yaml
계정: seunghwan.chung.89@gmail.com
인스턴스 이름: instance-20260101-1100
Shape: VM.Standard.E3.Flex
OS: Ubuntu 22.04.5 LTS
OCPU: 1
메모리: 16GB RAM
스토리지: 45GB
```

#### 네트워크 설정
```yaml
VCN: vcn-20260101-1100
서브넷: Public Subnet (10.0.0.0/24)
인터넷 게이트웨이: igw-20260101-1100
프라이빗 IP: 10.0.0.111
퍼블릭 IP: 158.180.95.246 (Reserved)
```

#### Security List (Ingress Rules)
| 포트 | 프로토콜 | 소스 | 용도 |
|-----|---------|------|------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 3090 | TCP | 0.0.0.0/0 | HubManager Frontend |
| 4090 | TCP | 0.0.0.0/0 | HubManager Backend API |
| 5432 | TCP | 10.0.0.0/24 | PostgreSQL (내부 전용) |

### 서버 소프트웨어 스택

```yaml
Node.js: v20.19.6
npm: 10.8.2
PM2: 6.0.14
PostgreSQL: 16.11 (Docker)
Docker: 26.x
serve: 14.x (프론트엔드 정적 파일 서빙)
```

---

## 배포 아키텍처

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                   (WBHubManager)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ push to main
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions                          │
│              (deploy-oracle.yml)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ SSH Deploy
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Oracle Cloud Instance                         │
│              (158.180.95.246)                            │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PM2 Process Manager                 │   │
│  │                                                   │   │
│  │  ┌────────────────┐  ┌────────────────────┐    │   │
│  │  │  hubmanager-   │  │  hubmanager-       │    │   │
│  │  │  backend       │  │  frontend          │    │   │
│  │  │  (Port 4090)   │  │  (Port 3090)       │    │   │
│  │  └────────┬───────┘  └────────────────────┘    │   │
│  └───────────┼──────────────────────────────────────┘   │
│              │                                           │
│              ▼                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │     PostgreSQL 16 Docker Container              │   │
│  │          (localhost:5432)                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Doppler API                           │   │
│  │       (환경변수 중앙 관리)                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 데이터 플로우

```
사용자 브라우저
      │
      ▼
http://158.180.95.246:3090 (프론트엔드)
      │
      ▼
http://158.180.95.246:4090/api (백엔드 API)
      │
      ▼
postgresql://localhost:5432/hubmanager (DB)
```

---

## 작업 내역

### Phase 1: Oracle Cloud 인스턴스 설정 (완료)

#### 1.1 인스턴스 생성
```bash
# Shape: VM.Standard.E3.Flex
# OS: Ubuntu 22.04 LTS
# OCPU: 1, RAM: 16GB
```

#### 1.2 네트워크 설정
- VCN 및 서브넷 생성
- 인터넷 게이트웨이 설정
- Reserved Public IP 할당: 158.180.95.246
- Security List 설정 (포트 22, 80, 443, 3090, 4090, 5432 오픈)

#### 1.3 SSH 접속 설정
```bash
# SSH 키 페어 생성 및 저장
# 로컬: ~/.ssh/oracle-workhub.key
# 권한: chmod 600

# 접속 명령어
ssh -i ~/.ssh/oracle-workhub.key ubuntu@158.180.95.246
```

### Phase 2: 서버 환경 구축 (완료)

#### 2.1 시스템 업데이트
```bash
sudo apt update
sudo apt upgrade -y
```

#### 2.2 Node.js 20 설치
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node -v  # v20.19.6
npm -v   # 10.8.2
```

#### 2.3 PM2 설치
```bash
sudo npm install -g pm2

# 시스템 재시작 시 자동 실행 설정
pm2 startup
pm2 save
```

#### 2.4 Docker 설치
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### 2.5 PostgreSQL 컨테이너 실행
```bash
cd ~/workhub
docker-compose up -d

# 상태 확인
docker ps
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: workhub-postgres
    environment:
      POSTGRES_USER: workhub
      POSTGRES_PASSWORD: your_secure_password_here_2026
      POSTGRES_DB: hubmanager
    ports:
      - "5432:5432"
    volumes:
      - ./backups:/backups
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U workhub -d hubmanager"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Phase 3: Doppler 환경 변수 설정 (완료)

#### 3.1 Doppler Production Config 생성
- Doppler 대시보드에서 5개 프로젝트별 Production Config 생성
  - `prd_wbhubmanager`
  - `prd_finhub`
  - `prd_wbsaleshub`
  - `prd_onboardinghub`
  - `prd_testagent`

#### 3.2 Service Token 발급
```bash
# WBHubManager
DOPPLER_TOKEN_HUBMANAGER_PRD=dp.st.prd_wbhubmanager.XXXXXXXXXX

# WBFinHub
DOPPLER_TOKEN_FINHUB_PRD=dp.st.prd_finhub.XXXXXXXXXX

# WBSalesHub
DOPPLER_TOKEN_SALESHUB_PRD=dp.st.prd_wbsaleshub.XXXXXXXXXX

# WBOnboardingHub
DOPPLER_TOKEN_ONBOARDINGHUB_PRD=dp.st.prd_onboardinghub.XXXXXXXXXX

# WHTestAgent
DOPPLER_TOKEN_TESTAGENT_PRD=dp.st.prd_testagent.XXXXXXXXXX
```

#### 3.3 환경변수 업로드
Doppler API를 사용하여 Railway의 환경변수를 Oracle Cloud 프로덕션 설정으로 복사 및 업로드 완료.

**주요 환경변수 (WBHubManager)**:
- `DB_PROVIDER=oracle`
- `ORACLE_DATABASE_URL=postgresql://workhub:password@localhost:5432/hubmanager`
- `NODE_ENV=development` (로컬 PostgreSQL SSL 비활성화)
- `APP_URL=http://158.180.95.246:4090`
- 기타 JWT, Google OAuth, 각 Hub 연동 URL 등

#### 3.4 환경변수 다운로드
```bash
cd ~/workhub/WBHubManager

# Doppler API로 환경변수 다운로드
source .env.doppler
curl -s --request GET \
  --url "https://api.doppler.com/v3/configs/config/secrets/download?format=env" \
  --header "Authorization: Bearer ${DOPPLER_TOKEN_HUBMANAGER_PRD}" > .env
```

### Phase 4: 데이터베이스 마이그레이션 (완료)

#### 4.1 Railway 데이터베이스 백업
```bash
# 로컬에서 Railway 백업
pg_dump postgresql://postgres:password@railway.app:port/railway > hubmanager.dump
```

#### 4.2 Oracle Cloud PostgreSQL 복원
```bash
# Oracle Cloud 서버에서
scp -i ~/.ssh/oracle-workhub.key hubmanager.dump ubuntu@158.180.95.246:~/railway-backups/

# PostgreSQL 복원
docker exec -i workhub-postgres psql -U workhub -d hubmanager < ~/railway-backups/hubmanager.dump
```

#### 4.3 데이터 검증
```sql
-- 테이블 확인
\dt

-- 사용자 수 확인
SELECT COUNT(*) FROM users;  -- 18명

-- Hub 수 확인
SELECT COUNT(*) FROM hubs;   -- 6개
```

### Phase 5: 애플리케이션 배포 (완료)

#### 5.1 WBHubManager 배포
```bash
cd ~/workhub

# 로컬에서 코드 압축 및 업로드
tar --exclude='node_modules' --exclude='.git' --exclude='frontend/node_modules' \
    --exclude='frontend/.next' -czf /tmp/wbhubmanager.tar.gz .

scp -i ~/.ssh/oracle-workhub.key /tmp/wbhubmanager.tar.gz ubuntu@158.180.95.246:~/workhub/

# Oracle Cloud 서버에서 압축 해제
cd ~/workhub
mkdir -p WBHubManager
cd WBHubManager
tar -xzf ../wbhubmanager.tar.gz
```

#### 5.2 의존성 설치 및 빌드
```bash
cd ~/workhub/WBHubManager

# 백엔드 의존성 설치
npm install

# 백엔드 빌드
npm run build:server

# 프론트엔드 의존성 설치 및 빌드
cd frontend
npm install
npx next build  # output: export로 정적 파일 생성
```

#### 5.3 package.json 수정
```bash
# Doppler CLI 없이 실행하도록 수정
# start 스크립트: "node dist/server/index.js"
```

#### 5.4 PM2 프로세스 시작
```bash
# 백엔드 시작
pm2 start npm --name "hubmanager-backend" -- start

# 프론트엔드 시작 (serve 사용)
sudo npm install -g serve
cd frontend
pm2 start "serve out -l 3090" --name "hubmanager-frontend"

# PM2 프로세스 저장 (재부팅 후 자동 실행)
pm2 save
```

### Phase 6: GitHub Actions 자동 배포 설정 (완료)

#### 6.1 워크플로우 파일 생성
파일: `.github/workflows/deploy-oracle.yml`

```yaml
name: Deploy to Oracle Cloud

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Oracle Cloud
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: 158.180.95.246
          username: ubuntu
          key: ${{ secrets.ORACLE_SSH_KEY }}
          port: 22
          script: |
            # WBHubManager 배포
            cd ~/workhub/WBHubManager
            git pull origin main
            npm install
            npm run build
            cd frontend && npm install && npm run build && cd ..
            pm2 restart hubmanager-backend
            pm2 restart hubmanager-frontend
            pm2 list
```

#### 6.2 GitHub Secret 설정
```
GitHub Repository → Settings → Secrets and variables → Actions
→ New repository secret

Name: ORACLE_SSH_KEY
Value: [SSH 개인키 전체 내용]
```

#### 6.3 자동 배포 테스트
```bash
# 로컬에서 main 브랜치에 push
git add .
git commit -m "feat: Oracle Cloud 배포 설정"
git push origin main

# GitHub Actions 탭에서 배포 진행 상황 확인
```

---

## 환경 설정

### 멀티 클라우드 데이터베이스 설정

`server/config/database.ts`에서 환경변수 기반 데이터베이스 프로바이더 선택:

```typescript
type DatabaseProvider = 'oracle' | 'aws' | 'railway';
const DB_PROVIDER = (process.env.DB_PROVIDER || 'oracle') as DatabaseProvider;

switch (DB_PROVIDER) {
  case 'oracle':
    databaseUrl = process.env.ORACLE_DATABASE_URL || process.env.DATABASE_URL || '';
    console.log('📊 Database Provider: Oracle Cloud PostgreSQL');
    break;
  case 'aws':
    databaseUrl = process.env.AWS_DATABASE_URL || process.env.DATABASE_URL || '';
    console.log('📊 Database Provider: AWS RDS PostgreSQL');
    break;
  case 'railway':
    databaseUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL || '';
    console.log('📊 Database Provider: Railway PostgreSQL');
    break;
}
```

### 환경변수 우선순위

```
1. ORACLE_DATABASE_URL (Oracle Cloud 전용)
2. AWS_DATABASE_URL (AWS RDS 전용)
3. RAILWAY_DATABASE_URL (Railway 전용)
4. DATABASE_URL (기본값)
```

### Doppler 환경변수 관리

#### 구조
```
WHCommon/env/
├── .env.doppler              # 모든 Service Token 저장
│   ├── DOPPLER_TOKEN_HUBMANAGER_DEV
│   ├── DOPPLER_TOKEN_HUBMANAGER_PRD
│   ├── DOPPLER_TOKEN_FINHUB_DEV
│   ├── DOPPLER_TOKEN_FINHUB_PRD
│   └── ... (총 10개)
└── (각 프로젝트별 .env.doppler 파일도 보관)
```

#### 사용법
```bash
# 로컬 개발 환경
source .env.doppler
export DOPPLER_TOKEN="${DOPPLER_TOKEN_HUBMANAGER_DEV}"
doppler run -- npm run dev

# Oracle Cloud 프로덕션
source .env.doppler
curl -s --request GET \
  --url "https://api.doppler.com/v3/configs/config/secrets/download?format=env" \
  --header "Authorization: Bearer ${DOPPLER_TOKEN_HUBMANAGER_PRD}" > .env
```

---

## 접속 정보

### 공개 접속 URL

| 서비스 | URL | 상태 |
|--------|-----|------|
| WBHubManager 프론트엔드 | http://158.180.95.246:3090 | ✅ 실행 중 |
| WBHubManager 백엔드 API | http://158.180.95.246:4090 | ✅ 실행 중 |
| Health Check | http://158.180.95.246:4090/api/health | ✅ 정상 |

### SSH 접속

```bash
ssh -i ~/.ssh/oracle-workhub.key ubuntu@158.180.95.246
```

### 데이터베이스 접속

```bash
# Oracle Cloud 서버 내부에서
docker exec -it workhub-postgres psql -U workhub -d hubmanager

# 또는
psql postgresql://workhub:your_secure_password_here_2026@localhost:5432/hubmanager
```

---

## 운영 가이드

### PM2 프로세스 관리

#### 프로세스 상태 확인
```bash
pm2 list
```

#### 로그 확인
```bash
# 전체 로그
pm2 logs

# 특정 프로세스 로그
pm2 logs hubmanager-backend
pm2 logs hubmanager-frontend

# 실시간 로그 (--lines N으로 마지막 N줄)
pm2 logs --lines 50

# 로그 스트림 중지하고 출력만
pm2 logs --nostream
```

#### 프로세스 재시작
```bash
# 특정 프로세스
pm2 restart hubmanager-backend
pm2 restart hubmanager-frontend

# 전체 재시작
pm2 restart all
```

#### 프로세스 중지/시작
```bash
# 중지
pm2 stop hubmanager-backend
pm2 stop all

# 시작
pm2 start hubmanager-backend
pm2 start all
```

#### 프로세스 삭제
```bash
pm2 delete hubmanager-backend
pm2 delete all
```

#### 모니터링
```bash
# 실시간 모니터링 (CPU, 메모리)
pm2 monit

# 상세 정보
pm2 show hubmanager-backend
```

### Docker 컨테이너 관리

#### PostgreSQL 상태 확인
```bash
docker ps --filter "name=workhub-postgres"
docker logs workhub-postgres
docker logs workhub-postgres --tail 50
```

#### PostgreSQL 재시작
```bash
docker restart workhub-postgres
```

#### PostgreSQL 중지/시작
```bash
docker stop workhub-postgres
docker start workhub-postgres
```

#### 데이터베이스 백업
```bash
# 컨테이너 내부에서 백업
docker exec workhub-postgres pg_dump -U workhub hubmanager > backup-$(date +%Y%m%d).dump

# 또는 로컬에서
pg_dump postgresql://workhub:password@158.180.95.246:5432/hubmanager > backup-$(date +%Y%m%d).dump
```

### 환경변수 업데이트

#### Doppler에서 최신 환경변수 다운로드
```bash
cd ~/workhub/WBHubManager

# .env.doppler 소스
source .env.doppler

# Doppler API로 다운로드
curl -s --request GET \
  --url "https://api.doppler.com/v3/configs/config/secrets/download?format=env" \
  --header "Authorization: Bearer ${DOPPLER_TOKEN_HUBMANAGER_PRD}" > .env

# 백엔드 재시작 (환경변수 다시 로드)
pm2 restart hubmanager-backend --update-env
```

### 배포 방법

#### 수동 배포
```bash
# Oracle Cloud 서버에서
cd ~/workhub/WBHubManager

# 최신 코드 가져오기 (Git 설정 시)
git pull origin main

# 의존성 설치
npm install
cd frontend && npm install && cd ..

# 빌드
npm run build:server
cd frontend && npx next build && cd ..

# 재시작
pm2 restart all
```

#### GitHub Actions 자동 배포
```bash
# 로컬에서 main 브랜치에 push
git add .
git commit -m "배포할 내용"
git push origin main

# GitHub Actions가 자동으로 배포 진행
# https://github.com/user/WBHubManager/actions 에서 확인
```

### 서버 재부팅 시

PM2 프로세스는 자동으로 재시작되지만, PostgreSQL Docker 컨테이너는 수동 재시작 필요:

```bash
# 재부팅 후 SSH 접속
ssh -i ~/.ssh/oracle-workhub.key ubuntu@158.180.95.246

# Docker 컨테이너 상태 확인
docker ps -a

# PostgreSQL 시작 (중지되어 있으면)
cd ~/workhub
docker-compose up -d

# PM2 프로세스 확인
pm2 list
```

---

## 트러블슈팅

### 문제 1: 백엔드가 데이터베이스 연결 실패

**증상**:
```
❌ Database connection check failed: Connection terminated due to connection timeout
```

**원인**:
- 환경변수에서 `158.180.95.246`으로 연결 시도 (외부 IP)
- 같은 서버 내부에서는 `localhost` 사용 필요

**해결**:
```bash
cd ~/workhub/WBHubManager
sed -i 's/158\.180\.95\.246/localhost/g' .env
pm2 restart hubmanager-backend
```

---

### 문제 2: SSL 연결 오류

**증상**:
```
❌ The server does not support SSL connections
```

**원인**:
- `NODE_ENV=production`일 때 SSL 연결 시도
- 로컬 PostgreSQL은 SSL 미지원

**해결**:
```bash
cd ~/workhub/WBHubManager

# NODE_ENV를 development로 변경
sed -i 's/NODE_ENV="production"/NODE_ENV="development"/g' .env

# 또는 DB_SSL=false 추가
echo 'DB_SSL="false"' >> .env

pm2 restart hubmanager-backend --update-env
```

---

### 문제 3: 프론트엔드 "next start" 오류

**증상**:
```
Error: "next start" does not work with "output: export" configuration.
```

**원인**:
- Next.js `output: export` 설정 시 `next start` 사용 불가
- 정적 파일로 빌드되므로 `serve` 사용 필요

**해결**:
```bash
# serve 설치
sudo npm install -g serve

# PM2로 serve 실행
cd ~/workhub/WBHubManager/frontend
pm2 delete hubmanager-frontend
pm2 start "serve out -l 3090" --name "hubmanager-frontend"
pm2 save
```

---

### 문제 4: Doppler CLI 없음 오류

**증상**:
```
sh: 1: doppler: not found
```

**원인**:
- package.json의 `start` 스크립트가 `doppler run` 사용
- Oracle Cloud 서버에 Doppler CLI 미설치

**해결**:
```bash
cd ~/workhub/WBHubManager

# package.json 수정
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.start = 'node dist/server/index.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

pm2 restart hubmanager-backend
```

---

### 문제 5: PM2 프로세스가 계속 재시작됨

**증상**:
```
Script /usr/bin/npm had too many unstable restarts (16). Stopped. "errored"
```

**원인**:
- 환경변수 문제
- 포트 충돌
- 의존성 누락

**해결**:
```bash
# 로그 확인
pm2 logs hubmanager-backend --lines 50 --nostream

# 환경변수 확인
cat ~/workhub/WBHubManager/.env

# 포트 확인
netstat -tuln | grep -E "3090|4090"

# 프로세스 삭제 후 재시작
pm2 delete all
cd ~/workhub/WBHubManager
pm2 start npm --name "hubmanager-backend" -- start
cd frontend
pm2 start "serve out -l 3090" --name "hubmanager-frontend"
pm2 save
```

---

### 문제 6: GitHub Actions 배포 실패

**증상**:
```
Permission denied (publickey)
```

**원인**:
- GitHub Secret의 `ORACLE_SSH_KEY` 미설정 또는 잘못됨

**해결**:
```bash
# 로컬에서 SSH 키 확인
cat ~/.ssh/oracle-workhub.key

# GitHub Repository → Settings → Secrets and variables → Actions
# → ORACLE_SSH_KEY 생성/수정
# SSH 개인키 전체 내용 복사 (-----BEGIN ~ -----END 포함)
```

---

## 향후 계획

### Phase 7: 나머지 프로젝트 마이그레이션 (예정)

#### WBFinHub
- [ ] Oracle Cloud PostgreSQL 데이터베이스 생성 (`finhub`)
- [ ] Railway 데이터 백업 및 복원
- [ ] 프로젝트 배포 (포트: 3091, 4091)
- [ ] PM2 프로세스 등록
- [ ] GitHub Actions 워크플로우 추가

#### WBSalesHub
- [ ] Oracle Cloud PostgreSQL 데이터베이스 생성 (`saleshub`)
- [ ] Railway 데이터 백업 및 복원
- [ ] 프로젝트 배포 (포트: 3092, 4092)
- [ ] PM2 프로세스 등록
- [ ] GitHub Actions 워크플로우 추가

#### WBOnboardingHub
- [ ] Oracle Cloud PostgreSQL 데이터베이스 생성 (`onboardinghub`)
- [ ] Railway 데이터 백업 및 복원
- [ ] 프로젝트 배포 (포트: 3093, 4093)
- [ ] PM2 프로세스 등록
- [ ] GitHub Actions 워크플로우 추가

#### WHTestAgent
- [ ] Oracle Cloud PostgreSQL 데이터베이스 생성 (`testagent`)
- [ ] Railway 데이터 백업 및 복원
- [ ] 프로젝트 배포 (포트: 3094, 4094)
- [ ] PM2 프로세스 등록
- [ ] GitHub Actions 워크플로우 추가

### Phase 8: AWS RDS 연동 (예정)

- [ ] AWS RDS PostgreSQL 인스턴스 생성
- [ ] 데이터 복제 (Oracle Cloud → AWS RDS)
- [ ] Multi-AZ 설정
- [ ] 백업 정책 설정
- [ ] 환경변수 추가 (`AWS_DATABASE_URL`)
- [ ] `DB_PROVIDER=aws` 전환 테스트

### Phase 9: 도메인 및 SSL 설정 (예정)

- [ ] 도메인 구매 (예: workhub.app)
- [ ] Oracle Cloud Load Balancer 설정
- [ ] Let's Encrypt SSL 인증서 발급
- [ ] HTTPS 리다이렉션 설정
- [ ] 서브도메인 설정
  - `api.workhub.app` → 백엔드
  - `app.workhub.app` → 프론트엔드

### Phase 10: 모니터링 및 알림 (예정)

- [ ] PM2 Plus 연동 (프로세스 모니터링)
- [ ] Oracle Cloud Monitoring 설정
- [ ] Slack 알림 연동
- [ ] 로그 수집 시스템 구축 (ELK Stack 또는 CloudWatch)
- [ ] 헬스 체크 자동화

### Phase 11: 백업 자동화 (예정)

- [ ] 데이터베이스 자동 백업 스크립트
- [ ] 백업 파일 Oracle Object Storage 업로드
- [ ] 백업 복원 테스트 자동화
- [ ] 백업 보관 정책 설정 (90일)

---

## 비용 분석

### Oracle Cloud Always Free

| 항목 | 스펙 | 비용 |
|-----|------|------|
| VM Instance | VM.Standard.E3.Flex (1 OCPU, 16GB RAM) | **무료** |
| Block Storage | 45GB | **무료** |
| Public IP | Reserved IP 1개 | **무료** |
| 아웃바운드 트래픽 | 월 10TB | **무료** |

**월 예상 비용**: **$0**

### Railway (기존)

| 항목 | 스펙 | 비용 |
|-----|------|------|
| PostgreSQL | 5개 데이터베이스 | ~$20/월 |
| 웹 서비스 | 5개 서비스 | ~$30/월 |

**월 예상 비용**: **~$50**

### 비용 절감 효과

**월 절감액**: $50
**연 절감액**: $600

---

## 보안 고려사항

### 현재 보안 설정

1. **SSH 키 기반 인증**
   - 비밀번호 인증 비활성화
   - SSH 키: `~/.ssh/oracle-workhub.key` (chmod 600)

2. **방화벽 (Security List)**
   - 필요한 포트만 오픈
   - PostgreSQL (5432)은 내부 전용

3. **환경변수 암호화**
   - Doppler를 통한 중앙 관리
   - Service Token 사용

4. **데이터베이스 접근 제한**
   - PostgreSQL은 localhost만 접근 가능
   - 강력한 비밀번호 사용

### 개선 필요 사항

1. **SSL/TLS 인증서**
   - [ ] Let's Encrypt SSL 인증서 발급
   - [ ] HTTPS 적용

2. **데이터베이스 암호화**
   - [ ] 전송 중 암호화 (TLS)
   - [ ] 저장 시 암호화 (Transparent Data Encryption)

3. **접근 제어**
   - [ ] IP 화이트리스트 설정
   - [ ] VPN 또는 Bastion Host 구축

4. **로그 및 모니터링**
   - [ ] 접근 로그 기록
   - [ ] 이상 탐지 시스템

5. **정기 보안 업데이트**
   - [ ] 시스템 패키지 자동 업데이트
   - [ ] Node.js 및 의존성 정기 업데이트

---

## 참고 문서

### 프로젝트 문서
- [Oracle Cloud Migration PRD](/mnt/c/GitHub/WHCommon/기능 PRD/Oracle-Cloud-Migration-PRD.md)
- [Doppler Setup Guide](/mnt/c/GitHub/WBHubManager/docs/Oracle-Doppler-Setup-Guide.md)
- [GitHub Actions Setup Guide](/mnt/c/GitHub/WBHubManager/docs/GitHub-Actions-Setup.md)

### 외부 문서
- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Doppler Documentation](https://docs.doppler.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-01 | 1.0.0 | 최초 작성 - Oracle Cloud 마이그레이션 완료 | Claude Code |

---

## 문의

- **이메일**: seunghwan.chung.89@gmail.com
- **Oracle Cloud 계정**: seunghwan.chung.89@gmail.com
- **서버 IP**: 158.180.95.246

---

**작성자**: Claude Code
**최종 수정일**: 2026-01-01
**문서 버전**: 1.0.0
