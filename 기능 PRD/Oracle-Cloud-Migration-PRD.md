# Oracle Cloud 이관 PRD (Product Requirements Document)

**작성일:** 2026-01-01
**목적:** Railway → Oracle Cloud 완전 이관
**예상 기간:** 1-2주
**담당:** Claude Code 자동화 + 수동 검증

---

## 1. 개요

### 1.1 이관 목적
- Railway CLI의 Claude Code 접근 제한 해결
- SSH 직접 접근으로 완전한 자동화 가능
- 비용 절감 (Railway $5+/월 → Oracle 무료)
- 24GB RAM으로 확장성 확보

### 1.2 이관 대상

| 서비스 | Railway 현재 상태 | Oracle 목표 |
|--------|------------------|-------------|
| WBHubManager | 운영 중 | Docker Container |
| WBFinHub | 운영 중 | Docker Container |
| WBSalesHub | 운영 중 | Docker Container |
| WBOnboardingHub | 운영 중 | Docker Container |
| PostgreSQL (HubManager) | Railway Postgres | Docker Container |
| PostgreSQL (FinHub) | Railway Postgres | Docker Container |
| WHTestManager | 미구현 | Docker Container (신규) |

### 1.3 이관 항목

```
┌─────────────────────────────────────────────────────────────┐
│  이관 대상                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 환경변수 (Environment Variables)                        │
│     ├── DATABASE_URL                                        │
│     ├── SESSION_SECRET                                      │
│     ├── JWT_PRIVATE_KEY / JWT_PUBLIC_KEY                    │
│     ├── GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET             │
│     ├── APP_URL (도메인 변경 필요)                           │
│     └── 기타 서비스별 환경변수                               │
│                                                             │
│  2. 데이터베이스 (PostgreSQL)                                │
│     ├── HubManager DB (users, sessions, hubs, documents)   │
│     ├── FinHub DB (accounts, transactions, entities, etc.) │
│     └── 기타 서비스 DB                                      │
│                                                             │
│  3. 도메인/SSL                                               │
│     ├── 기존: *.up.railway.app                              │
│     └── 신규: 커스텀 도메인 또는 IP 직접 사용                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 사전 준비 사항

### 2.1 Oracle Cloud 계정 생성
- [ ] https://oracle.com/cloud/free 가입
- [ ] 결제 수단 등록 (무료 티어 확인용, 과금 안됨)
- [ ] 리전 선택: **ap-chuncheon-1 (서울/춘천)** 또는 **ap-tokyo-1 (도쿄)**

### 2.2 Doppler 계정 생성
- [ ] https://doppler.com 가입
- [ ] Workspace 생성
- [ ] 프로젝트 생성 (workhub-hubmanager, workhub-finhub 등)

### 2.3 Railway 데이터 백업 준비
- [ ] Railway 대시보드 접근 권한 확인
- [ ] 각 서비스 환경변수 목록 정리
- [ ] PostgreSQL 접속 정보 확인 (DATABASE_URL)

### 2.4 로컬 도구 설치
```bash
# SSH 키 생성 (없는 경우)
ssh-keygen -t ed25519 -f ~/.ssh/oracle_key -C "oracle-cloud"

# PostgreSQL 클라이언트 (DB 마이그레이션용)
# Windows
choco install postgresql

# Mac
brew install postgresql

# Doppler CLI
# Windows
scoop install doppler
# Mac
brew install dopplerhq/cli/doppler
# Linux
curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | sudo gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/doppler-cli.list
sudo apt update && sudo apt install doppler
```

---

## 3. Phase 1: Oracle Cloud 인프라 구축

### 3.1 VM 인스턴스 생성

#### Step 1: Compute Instance 생성
```
1. Oracle Cloud Console 로그인
2. Compute → Instances → Create Instance

설정값:
- Name: workhub-server
- Compartment: (기본값)
- Placement: AD-1
- Image: Ubuntu 22.04 (aarch64)  # ARM
- Shape: VM.Standard.A1.Flex
  - OCPUs: 4
  - Memory: 24 GB
- Networking:
  - VCN: 새로 생성 또는 기존 사용
  - Subnet: Public Subnet
  - Public IP: Assign
- SSH Keys: 위에서 생성한 oracle_key.pub 업로드
- Boot Volume: 100 GB (무료 범위 내)
```

#### Step 2: Security List 설정 (방화벽)
```
Networking → Virtual Cloud Networks → [VCN 선택] → Security Lists → Default Security List

Ingress Rules 추가:
| Source CIDR | Protocol | Dest Port | 설명 |
|-------------|----------|-----------|------|
| 0.0.0.0/0   | TCP      | 22        | SSH |
| 0.0.0.0/0   | TCP      | 80        | HTTP |
| 0.0.0.0/0   | TCP      | 443       | HTTPS |
| 0.0.0.0/0   | TCP      | 4090      | HubManager |
| 0.0.0.0/0   | TCP      | 4020      | FinHub |
| 0.0.0.0/0   | TCP      | 4030      | SalesHub |
| 0.0.0.0/0   | TCP      | 4040      | OnboardingHub |
| 0.0.0.0/0   | TCP      | 5432      | PostgreSQL (개발용, 프로덕션에서는 제한) |
```

#### Step 3: Ubuntu 방화벽 설정
```bash
# SSH 접속 후
ssh -i ~/.ssh/oracle_key ubuntu@<PUBLIC_IP>

# iptables 규칙 추가 (Oracle Ubuntu 기본 차단)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4090 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4020 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4030 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4040 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 5432 -j ACCEPT

# 규칙 저장
sudo netfilter-persistent save
```

### 3.2 서버 초기 설정

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y \
  git \
  curl \
  vim \
  htop \
  net-tools \
  ufw \
  certbot \
  python3-certbot-nginx

# Docker 설치
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Docker Compose 플러그인 설치
sudo apt install -y docker-compose-plugin

# Doppler CLI 설치
curl -sLf --retry 3 --tlsv1.2 --proto "=https" \
  'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | \
  sudo gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | \
  sudo tee /etc/apt/sources.list.d/doppler-cli.list

sudo apt update && sudo apt install -y doppler

# 재로그인 (docker 그룹 적용)
exit
ssh -i ~/.ssh/oracle_key ubuntu@<PUBLIC_IP>

# 설치 확인
docker --version
docker compose version
doppler --version
```

### 3.3 디렉토리 구조 생성

```bash
# 프로젝트 루트
mkdir -p ~/workhub
cd ~/workhub

# 하위 디렉토리
mkdir -p {apps,data,logs,backups,nginx,ssl}

# 구조 확인
tree ~/workhub
# workhub/
# ├── apps/           # 애플리케이션 소스
# │   ├── WBHubManager/
# │   ├── WBFinHub/
# │   ├── WBSalesHub/
# │   └── WBOnboardingHub/
# ├── data/           # PostgreSQL 데이터
# │   ├── postgres-hub/
# │   └── postgres-fin/
# ├── logs/           # 애플리케이션 로그
# ├── backups/        # DB 백업
# ├── nginx/          # Nginx 설정
# └── ssl/            # SSL 인증서
```

---

## 4. Phase 2: Doppler 환경변수 설정

### 4.1 Doppler 개요

```
┌─────────────────────────────────────────────────────────────┐
│  Doppler Cloud (doppler.com)                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Projects                                              │ │
│  │  ├── workhub-hubmanager                               │ │
│  │  │   ├── dev      (개발 환경변수)                      │ │
│  │  │   ├── stg      (스테이징 환경변수)                  │ │
│  │  │   └── prd      (프로덕션 환경변수)                  │ │
│  │  ├── workhub-finhub                                   │ │
│  │  │   ├── dev                                          │ │
│  │  │   ├── stg                                          │ │
│  │  │   └── prd                                          │ │
│  │  ├── workhub-saleshub                                 │ │
│  │  └── workhub-onboardinghub                            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              │
              │ CLI / API (토큰 인증)
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────────┐   ┌─────────────┐
│ Oracle VM   │   │ Claude Code │
│ doppler run │   │ doppler CLI │
└─────────────┘   └─────────────┘
```

### 4.2 Doppler 프로젝트 생성

```bash
# 로컬에서 Doppler 로그인
doppler login

# 프로젝트 생성
doppler projects create workhub-hubmanager
doppler projects create workhub-finhub
doppler projects create workhub-saleshub
doppler projects create workhub-onboardinghub
doppler projects create workhub-shared  # 공통 환경변수
```

### 4.3 Railway 환경변수를 Doppler로 이관

#### Step 1: Railway에서 환경변수 추출
```
Railway Dashboard → 각 서비스 → Variables 탭에서 복사

필요한 환경변수:
- DATABASE_URL (나중에 Oracle용으로 변경)
- SESSION_SECRET
- JWT_PRIVATE_KEY
- JWT_PUBLIC_KEY
- JWT_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- APP_URL (나중에 변경)
- (기타 서비스별 변수)
```

#### Step 2: Doppler에 환경변수 등록
```bash
# 방법 1: CLI로 하나씩 등록
doppler secrets set DATABASE_URL="postgresql://..." --project workhub-hubmanager --config prd
doppler secrets set SESSION_SECRET="your-secret" --project workhub-hubmanager --config prd
doppler secrets set JWT_PRIVATE_KEY="base64-encoded" --project workhub-hubmanager --config prd

# 방법 2: 파일에서 일괄 등록
# railway-hubmanager.env 파일 준비 후
doppler secrets upload railway-hubmanager.env --project workhub-hubmanager --config prd

# 방법 3: Doppler 웹 대시보드에서 직접 입력
# https://dashboard.doppler.com → 프로젝트 선택 → Secrets 탭
```

#### Step 3: 환경별 설정 분리
```bash
# 개발 환경 (dev)
doppler secrets set APP_URL="http://localhost:4090" --project workhub-hubmanager --config dev
doppler secrets set NODE_ENV="development" --project workhub-hubmanager --config dev

# 프로덕션 환경 (prd)
doppler secrets set APP_URL="https://your-domain.com" --project workhub-hubmanager --config prd
doppler secrets set NODE_ENV="production" --project workhub-hubmanager --config prd

# DATABASE_URL도 환경별로 다르게 설정
doppler secrets set DATABASE_URL="postgresql://workhub:pass@localhost:5432/hubmanager" --project workhub-hubmanager --config dev
doppler secrets set DATABASE_URL="postgresql://workhub:pass@postgres-hub:5432/hubmanager" --project workhub-hubmanager --config prd
```

### 4.4 서비스 토큰 생성 (Oracle 서버용)

```bash
# 각 프로젝트별 서비스 토큰 생성 (prd 환경)
doppler configs tokens create oracle-server --project workhub-hubmanager --config prd
# 출력: dp.st.prd.xxxxxxxxxxxx (안전하게 보관)

doppler configs tokens create oracle-server --project workhub-finhub --config prd
doppler configs tokens create oracle-server --project workhub-saleshub --config prd
doppler configs tokens create oracle-server --project workhub-onboardinghub --config prd
```

### 4.5 Oracle 서버에 Doppler 설정

```bash
# Oracle 서버 SSH 접속
ssh -i ~/.ssh/oracle_key ubuntu@<PUBLIC_IP>

# 서비스 토큰으로 인증 (프로젝트별)
# HubManager
echo "dp.st.prd.xxxx_hubmanager" > ~/.doppler-token-hubmanager
doppler configure set token $(cat ~/.doppler-token-hubmanager) --scope ~/workhub/apps/WBHubManager

# FinHub
echo "dp.st.prd.xxxx_finhub" > ~/.doppler-token-finhub
doppler configure set token $(cat ~/.doppler-token-finhub) --scope ~/workhub/apps/WBFinHub

# 확인
doppler secrets --project workhub-hubmanager --config prd
```

### 4.6 Doppler vs .env 파일 비교

| 항목 | .env 파일 | Doppler |
|------|----------|---------|
| **보안** | Git에 실수로 커밋 위험 | 중앙 관리, 암호화 |
| **동기화** | 수동 복사 필요 | 자동 동기화 |
| **버전 관리** | 없음 | 변경 히스토리 |
| **접근 제어** | 파일 권한만 | 역할 기반 권한 |
| **Claude Code** | SSH로 파일 편집 | CLI로 조회/수정 |
| **비용** | 무료 | 무료 (5명까지) |
| **환경 분리** | 파일 복사 | dev/stg/prd 자동 관리 |

---

## 5. Phase 3: Railway 데이터베이스 백업

### 5.1 PostgreSQL 접속 정보 확인
```
Railway Dashboard → PostgreSQL 서비스 → Connect 탭

연결 정보 예시:
- Host: containers-us-west-xxx.railway.app
- Port: 5432
- Database: railway
- User: postgres
- Password: xxxxxxxx
```

### 5.2 pg_dump로 백업
```bash
# HubManager DB 백업
PGPASSWORD='railway-password' pg_dump \
  -h containers-us-west-xxx.railway.app \
  -p 5432 \
  -U postgres \
  -d railway \
  -F c \
  -f ~/workhub-migration/hubmanager_backup.dump

# FinHub DB 백업
PGPASSWORD='railway-password' pg_dump \
  -h containers-us-west-yyy.railway.app \
  -p 5432 \
  -U postgres \
  -d railway \
  -F c \
  -f ~/workhub-migration/finhub_backup.dump

# 백업 파일 확인
ls -lh ~/workhub-migration/*.dump
```

### 5.3 백업 파일을 Oracle 서버로 전송
```bash
# SCP로 전송
scp -i ~/.ssh/oracle_key ~/workhub-migration/*.dump ubuntu@<ORACLE_IP>:~/workhub/backups/
```

---

## 6. Phase 4: Oracle Cloud 배포

### 6.1 Docker Compose 설정 (Doppler 연동)

```yaml
# ~/workhub/docker-compose.yml

version: '3.8'

services:
  # ============================================
  # PostgreSQL Databases
  # ============================================
  postgres-hub:
    image: postgres:16-alpine
    container_name: postgres-hub
    restart: unless-stopped
    environment:
      POSTGRES_USER: workhub
      POSTGRES_PASSWORD: ${POSTGRES_HUB_PASSWORD}
      POSTGRES_DB: hubmanager
    volumes:
      - ./data/postgres-hub:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U workhub -d hubmanager"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-fin:
    image: postgres:16-alpine
    container_name: postgres-fin
    restart: unless-stopped
    environment:
      POSTGRES_USER: workhub
      POSTGRES_PASSWORD: ${POSTGRES_FIN_PASSWORD}
      POSTGRES_DB: finhub
    volumes:
      - ./data/postgres-fin:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U workhub -d finhub"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Applications (Doppler 연동)
  # ============================================
  wbhubmanager:
    build:
      context: ./apps/WBHubManager
      dockerfile: Dockerfile
    container_name: wbhubmanager
    restart: unless-stopped
    ports:
      - "4090:4090"
    environment:
      # Doppler 서비스 토큰 (docker-compose 실행 시 주입)
      DOPPLER_TOKEN: ${DOPPLER_TOKEN_HUBMANAGER}
    # Doppler로 환경변수 주입하여 실행
    entrypoint: ["doppler", "run", "--"]
    command: ["node", "dist/server/index.js"]
    depends_on:
      postgres-hub:
        condition: service_healthy
    volumes:
      - ./logs/hubmanager:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4090/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  wbfinhub:
    build:
      context: ./apps/WBFinHub
      dockerfile: Dockerfile
    container_name: wbfinhub
    restart: unless-stopped
    ports:
      - "4020:4020"
    environment:
      DOPPLER_TOKEN: ${DOPPLER_TOKEN_FINHUB}
    entrypoint: ["doppler", "run", "--"]
    command: ["node", "dist/server/index.js"]
    depends_on:
      postgres-fin:
        condition: service_healthy
      wbhubmanager:
        condition: service_healthy
    volumes:
      - ./logs/finhub:/app/logs

  wbsaleshub:
    build:
      context: ./apps/WBSalesHub
      dockerfile: Dockerfile
    container_name: wbsaleshub
    restart: unless-stopped
    ports:
      - "4030:4030"
    environment:
      DOPPLER_TOKEN: ${DOPPLER_TOKEN_SALESHUB}
    entrypoint: ["doppler", "run", "--"]
    command: ["node", "dist/server/index.js"]
    depends_on:
      wbhubmanager:
        condition: service_healthy
    volumes:
      - ./logs/saleshub:/app/logs

  wbonboardinghub:
    build:
      context: ./apps/WBOnboardingHub
      dockerfile: Dockerfile
    container_name: wbonboardinghub
    restart: unless-stopped
    ports:
      - "4040:4040"
    environment:
      DOPPLER_TOKEN: ${DOPPLER_TOKEN_ONBOARDINGHUB}
    entrypoint: ["doppler", "run", "--"]
    command: ["node", "dist/server/index.js"]
    depends_on:
      wbhubmanager:
        condition: service_healthy
    volumes:
      - ./logs/onboardinghub:/app/logs

  # ============================================
  # Infrastructure
  # ============================================
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - wbhubmanager
      - wbfinhub

networks:
  default:
    name: workhub-network
```

### 6.2 Dockerfile 수정 (Doppler CLI 포함)

```dockerfile
# apps/WBHubManager/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Doppler CLI 설치
RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add --no-cache doppler

# curl 설치 (healthcheck용)
RUN apk add --no-cache curl

# 앱 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 4090

# Doppler가 entrypoint에서 처리하므로 CMD만 지정
CMD ["node", "dist/server/index.js"]
```

### 6.3 마스터 환경변수 파일

```bash
# ~/workhub/.env (Docker Compose용 - Doppler 토큰만 저장)

# PostgreSQL Passwords (이것도 Doppler로 옮길 수 있음)
POSTGRES_HUB_PASSWORD=your-secure-password-1
POSTGRES_FIN_PASSWORD=your-secure-password-2

# Doppler Service Tokens
DOPPLER_TOKEN_HUBMANAGER=dp.st.prd.xxxxxxxxxxxx
DOPPLER_TOKEN_FINHUB=dp.st.prd.yyyyyyyyyyyy
DOPPLER_TOKEN_SALESHUB=dp.st.prd.zzzzzzzzzzzz
DOPPLER_TOKEN_ONBOARDINGHUB=dp.st.prd.wwwwwwwwwwww
```

### 6.4 소스 코드 배포

```bash
# Oracle 서버에서 실행
cd ~/workhub/apps

# Git 클론
git clone https://github.com/your-org/WBHubManager.git
git clone https://github.com/your-org/WBFinHub.git
git clone https://github.com/your-org/WBSalesHub.git
git clone https://github.com/your-org/WBOnboardingHub.git
```

### 6.5 데이터베이스 복원

```bash
# 1. PostgreSQL 컨테이너만 먼저 시작
cd ~/workhub
docker compose up -d postgres-hub postgres-fin

# 2. 컨테이너가 ready 될 때까지 대기
sleep 10

# 3. HubManager DB 복원
docker exec -i postgres-hub pg_restore \
  -U workhub \
  -d hubmanager \
  -v \
  < ~/workhub/backups/hubmanager_backup.dump

# 4. FinHub DB 복원
docker exec -i postgres-fin pg_restore \
  -U workhub \
  -d finhub \
  -v \
  < ~/workhub/backups/finhub_backup.dump

# 5. 복원 확인
docker exec postgres-hub psql -U workhub -d hubmanager -c "\dt"
docker exec postgres-fin psql -U workhub -d finhub -c "\dt"
```

### 6.6 전체 서비스 시작

```bash
# 전체 빌드 및 시작
cd ~/workhub
docker compose up -d --build

# 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f
```

---

## 7. Phase 5: 검증 및 전환

### 7.1 Health Check

```bash
# 각 서비스 Health Check
curl http://<ORACLE_IP>:4090/api/health  # HubManager
curl http://<ORACLE_IP>:4020/api/health  # FinHub
curl http://<ORACLE_IP>:4030/api/health  # SalesHub
curl http://<ORACLE_IP>:4040/api/health  # OnboardingHub
```

### 7.2 Doppler 환경변수 확인

```bash
# Oracle 서버에서
docker exec wbhubmanager doppler secrets --only-names

# 또는 로컬 Claude Code에서
doppler secrets --project workhub-hubmanager --config prd
```

### 7.3 Google OAuth 설정 업데이트

```
Google Cloud Console → API & Services → Credentials → OAuth 2.0 Client IDs

Authorized redirect URIs 추가:
- http://<ORACLE_IP>:4090/api/auth/google/callback
- https://your-domain.com/api/auth/google/callback (도메인 사용 시)
```

### 7.4 Doppler APP_URL 업데이트

```bash
# Oracle IP 또는 도메인으로 변경
doppler secrets set APP_URL="http://<ORACLE_IP>:4090" --project workhub-hubmanager --config prd
doppler secrets set APP_URL="http://<ORACLE_IP>:4020" --project workhub-finhub --config prd

# 서비스 재시작하여 적용
ssh oracle-workhub "cd ~/workhub && docker compose restart"
```

---

## 8. Phase 6: Railway 종료

### 8.1 전환 완료 확인
- [ ] 모든 서비스 Health Check 통과
- [ ] DB 데이터 정합성 확인
- [ ] Google OAuth 로그인 테스트
- [ ] SSO 플로우 테스트 (HubManager → FinHub)
- [ ] 주요 기능 수동 테스트

### 8.2 Railway 서비스 중지
```
Railway Dashboard → 각 서비스:
1. Settings → Danger Zone → Delete Service
2. 또는 일단 Stop만 하고 1주일 모니터링 후 삭제
```

---

## 9. Claude Code 운영 명령어

### 9.1 SSH Config

```bash
# ~/.ssh/config

Host oracle-workhub
    HostName <ORACLE_PUBLIC_IP>
    User ubuntu
    IdentityFile ~/.ssh/oracle_key
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### 9.2 배포 명령어

```bash
# 단일 서비스 배포
ssh oracle-workhub "cd ~/workhub && git -C apps/WBHubManager pull && docker compose up -d --build wbhubmanager"

# 전체 배포
ssh oracle-workhub "cd ~/workhub && for app in WBHubManager WBFinHub WBSalesHub WBOnboardingHub; do git -C apps/\$app pull; done && docker compose up -d --build"
```

### 9.3 환경변수 관리 (Doppler)

```bash
# 환경변수 조회
doppler secrets --project workhub-hubmanager --config prd

# 환경변수 수정
doppler secrets set NEW_VAR="value" --project workhub-hubmanager --config prd

# 수정 후 서비스 재시작
ssh oracle-workhub "docker compose -f ~/workhub/docker-compose.yml restart wbhubmanager"

# 환경변수 히스토리 확인
doppler activity --project workhub-hubmanager
```

### 9.4 로그 확인

```bash
# 실시간 로그
ssh oracle-workhub "docker logs wbhubmanager -f --tail 100"

# 전체 서비스 로그
ssh oracle-workhub "docker compose -f ~/workhub/docker-compose.yml logs -f"
```

### 9.5 DB 작업

```bash
# 마이그레이션
ssh oracle-workhub "docker exec wbhubmanager npx prisma migrate deploy"

# DB 쿼리
ssh oracle-workhub "docker exec postgres-hub psql -U workhub -d hubmanager -c 'SELECT COUNT(*) FROM users;'"

# 백업
ssh oracle-workhub "docker exec postgres-hub pg_dump -U workhub hubmanager > ~/workhub/backups/hubmanager_\$(date +%Y%m%d).sql"
```

### 9.6 상태 확인

```bash
# 컨테이너 상태
ssh oracle-workhub "docker compose -f ~/workhub/docker-compose.yml ps"

# 리소스 사용량
ssh oracle-workhub "docker stats --no-stream"

# 디스크 사용량
ssh oracle-workhub "df -h"
```

---

## 10. 운영 스크립트

### 10.1 배포 스크립트

```bash
# ~/workhub/scripts/deploy.sh

#!/bin/bash
set -e

SERVICE=$1
BRANCH=${2:-main}

if [ -z "$SERVICE" ]; then
    echo "Usage: ./deploy.sh <service> [branch]"
    echo "Services: hubmanager, finhub, saleshub, onboardinghub, all"
    exit 1
fi

cd ~/workhub

if [ "$SERVICE" = "all" ]; then
    echo "Deploying all services..."
    for app in WBHubManager WBFinHub WBSalesHub WBOnboardingHub; do
        echo "Updating $app..."
        git -C apps/$app fetch origin
        git -C apps/$app checkout $BRANCH
        git -C apps/$app pull origin $BRANCH
    done
    docker compose up -d --build
else
    APP_NAME="WB$(echo $SERVICE | sed 's/.*/\u&/')"
    CONTAINER="wb${SERVICE,,}"

    echo "Deploying $SERVICE from branch $BRANCH..."
    git -C apps/$APP_NAME fetch origin
    git -C apps/$APP_NAME checkout $BRANCH
    git -C apps/$APP_NAME pull origin $BRANCH

    docker compose up -d --build $CONTAINER
fi

echo "Deployment complete!"
docker compose ps
```

### 10.2 백업 스크립트

```bash
# ~/workhub/scripts/backup.sh

#!/bin/bash
set -e

BACKUP_DIR=~/workhub/backups
DATE=$(date +%Y%m%d_%H%M%S)

echo "Starting backup at $DATE..."

# HubManager DB
docker exec postgres-hub pg_dump -U workhub -d hubmanager -F c > $BACKUP_DIR/hubmanager_$DATE.dump
echo "HubManager DB backed up"

# FinHub DB
docker exec postgres-fin pg_dump -U workhub -d finhub -F c > $BACKUP_DIR/finhub_$DATE.dump
echo "FinHub DB backed up"

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete
echo "Old backups cleaned up"

echo "Backup complete!"
ls -lh $BACKUP_DIR/*.dump
```

### 10.3 Cron 설정

```bash
# crontab -e

# 매일 새벽 3시 자동 백업
0 3 * * * /home/ubuntu/workhub/scripts/backup.sh >> /home/ubuntu/workhub/logs/backup.log 2>&1

# 매주 일요일 새벽 4시 Docker 정리
0 4 * * 0 docker system prune -af >> /home/ubuntu/workhub/logs/cleanup.log 2>&1
```

---

## 11. 체크리스트

### Phase 1: 인프라 구축
- [ ] Oracle Cloud 계정 생성
- [ ] VM 인스턴스 생성 (ARM 4 OCPU, 24GB)
- [ ] Security List 설정 (포트 오픈)
- [ ] Ubuntu 방화벽 설정
- [ ] Docker, Docker Compose 설치
- [ ] Doppler CLI 설치
- [ ] 디렉토리 구조 생성

### Phase 2: Doppler 설정
- [ ] Doppler 계정 생성
- [ ] 프로젝트 생성 (hubmanager, finhub, saleshub, onboardinghub)
- [ ] Railway 환경변수 → Doppler 이관
- [ ] 환경별 설정 (dev, stg, prd)
- [ ] 서비스 토큰 생성
- [ ] Oracle 서버에 토큰 설정

### Phase 3: 데이터 백업
- [ ] HubManager DB 백업 (pg_dump)
- [ ] FinHub DB 백업 (pg_dump)
- [ ] 백업 파일 Oracle 서버로 전송

### Phase 4: 배포
- [ ] docker-compose.yml 작성 (Doppler 연동)
- [ ] Dockerfile 수정 (Doppler CLI 포함)
- [ ] 소스 코드 배포
- [ ] PostgreSQL 컨테이너 시작
- [ ] DB 복원 (pg_restore)
- [ ] 전체 서비스 시작

### Phase 5: 검증
- [ ] 모든 서비스 Health Check
- [ ] DB 데이터 COUNT 비교
- [ ] Google OAuth 설정 업데이트
- [ ] Doppler APP_URL 업데이트
- [ ] 로그인 테스트
- [ ] SSO 플로우 테스트

### Phase 6: 전환 완료
- [ ] Railway 서비스 중지
- [ ] Claude Code SSH 설정 확인
- [ ] 운영 스크립트 테스트
- [ ] 자동 백업 cron 설정

---

## 12. 예상 일정

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| Phase 1 | 인프라 구축 | 2-3시간 |
| Phase 2 | Doppler 설정 | 1-2시간 |
| Phase 3 | 데이터 백업 | 1시간 |
| Phase 4 | 배포 | 3-4시간 |
| Phase 5 | 검증 | 2-3시간 |
| Phase 6 | 전환 완료 | 1시간 |
| **Total** | | **10-15시간 (1-2일)** |

---

## 13. 롤백 계획

### Oracle → Railway 롤백 절차

```bash
# 1. Railway 서비스 재시작
# Railway Dashboard에서 Stop된 서비스 Start

# 2. 최신 데이터 Railway로 이관 (필요시)
# Oracle에서 pg_dump → Railway pg_restore

# 3. DNS/도메인 원복
# Google OAuth Redirect URI 원복

# 4. Doppler APP_URL 원복
doppler secrets set APP_URL="https://wbhub.up.railway.app" --project workhub-hubmanager --config prd
```

---

**문서 버전:** 1.1
**작성:** Claude Code
**최종 수정:** 2026-01-01
**변경 사항:** Doppler 환경변수 관리 섹션 추가
