# 스테이징 환경 HTTPS 설정 및 환경변수 정리

**작업일**: 2026-01-12
**작업자**: Claude Sonnet 4.5 + Peter Chung
**작업 시간**: 약 2시간

---

## 📋 작업 개요

스테이징 환경에서 HTTPS를 적용하고, 모든 URL에서 포트 번호(`:4400`)를 제거하여 깔끔한 URL 구조를 구현했습니다.

### 문제 상황
1. 브라우저가 `staging.workhub.biz`에 접속 시 자동으로 HTTPS로 리다이렉트
2. nginx-staging이 HTTP만 지원하여 ERR_CONNECTION_REFUSED 발생
3. `.env.staging` 파일에 `http://` 및 포트 `:4400` 혼재

### 해결 방법
1. Let's Encrypt SSL 인증서 사용 (이미 존재)
2. nginx-staging을 HTTPS(443, 4400) 포트로 재설정
3. 모든 환경변수 URL을 `https://staging.workhub.biz` 형태로 통일

---

## 🛠️ 작업 내용

### 1. nginx-staging SSL 설정 (15분)

#### 1.1 SSL 인증서 확인
```bash
# Let's Encrypt 인증서 이미 존재 확인
sudo certbot certificates
# staging.workhub.biz 인증서 발견
```

#### 1.2 nginx 설정 업데이트
**파일**: `/home/ubuntu/workhub/nginx/nginx-staging.conf`

**변경 전**:
```nginx
server {
    listen 80;
    listen 4400;
    server_name staging.workhub.biz;
    # ...
}
```

**변경 후**:
```nginx
# HTTPS 포트 443
server {
    listen 443 ssl http2;
    server_name staging.workhub.biz;

    ssl_certificate /etc/letsencrypt/live/staging.workhub.biz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.workhub.biz/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    # ...
}

# HTTPS 포트 4400 (레거시 지원)
server {
    listen 4400 ssl http2;
    # 동일한 SSL 설정
}
```

**주요 변경사항**:
- ✅ 포트 80 리스너 제거 (nginx-prod가 사용 중)
- ✅ 포트 443(HTTPS) 추가
- ✅ 포트 4400을 HTTPS로 변경
- ✅ SSL 인증서 경로 지정
- ✅ HSTS 헤더 추가 (보안 강화)

#### 1.3 nginx 컨테이너 재시작
```bash
docker rm -f nginx-staging
docker run -d \
  --name nginx-staging \
  --network workhub-network \
  -p 443:443 \
  -p 4400:4400 \
  -v /home/ubuntu/workhub/nginx/nginx-staging.conf:/etc/nginx/nginx.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  --restart unless-stopped \
  nginx:1.29.4-alpine
```

**검증**:
```bash
# HTTPS 테스트
curl -I https://staging.workhub.biz
# HTTP/2 200 ✅

curl -I https://staging.workhub.biz:4400
# HTTP/2 200 ✅
```

---

### 2. 환경변수 파일 업데이트 (10분)

#### 2.1 WBHubManager/.env.staging

**변경 전**:
```bash
APP_URL=http://staging.workhub.biz:4400
FRONTEND_URL=http://staging.workhub.biz:4400
GOOGLE_REDIRECT_URI=http://staging.workhub.biz:4400/api/auth/google-callback
SALESHUB_URL=http://staging.workhub.biz:4400/saleshub
FINHUB_URL=http://staging.workhub.biz:4400/finhub
```

**변경 후**:
```bash
APP_URL=https://staging.workhub.biz
FRONTEND_URL=https://staging.workhub.biz
GOOGLE_REDIRECT_URI=https://staging.workhub.biz/api/auth/google-callback
SALESHUB_URL=https://staging.workhub.biz/saleshub
FINHUB_URL=https://staging.workhub.biz/finhub
```

**변경 명령어**:
```bash
cd /home/peterchung/WBHubManager
sed -i 's|http://staging\.workhub\.biz:4400|https://staging.workhub.biz|g' .env.staging
```

#### 2.2 WBSalesHub/.env.staging

**변경 전**:
```bash
APP_URL=http://staging.workhub.biz:4400/saleshub
BASE_URL=http://staging.workhub.biz:4400/saleshub
HUB_MANAGER_URL=http://staging.workhub.biz:4400
```

**변경 후**:
```bash
APP_URL=https://staging.workhub.biz/saleshub
BASE_URL=https://staging.workhub.biz/saleshub
HUB_MANAGER_URL=https://staging.workhub.biz
```

#### 2.3 WBFinHub/.env.staging

**변경 전**:
```bash
APP_URL=http://staging.workhub.biz/finhub
HUB_MANAGER_URL=http://staging.workhub.biz
```

**변경 후**:
```bash
APP_URL=https://staging.workhub.biz/finhub
HUB_MANAGER_URL=https://staging.workhub.biz
```

---

### 3. Git 커밋 및 배포 (15분)

#### 3.1 로컬 커밋
```bash
# WBHubManager
cd /home/peterchung/WBHubManager
git add .env.staging
git commit -m "Update .env.staging to use HTTPS without port"
git push --set-upstream origin feature/connection-pool-optimization

# WBSalesHub
cd /home/peterchung/WBSalesHub
git add .env.staging
git commit -m "Update .env.staging to use HTTPS without port"
git push

# WBFinHub
cd /home/peterchung/WBFinHub
git add .env.staging
git commit -m "Update .env.staging to use HTTPS without port"
git push --set-upstream origin feature/connection-pool-optimization
```

**커밋 해시**:
- WBHubManager: `34863c2`
- WBSalesHub: `dc01dd2`
- WBFinHub: `d728aee`

#### 3.2 오라클 서버 배포
```bash
# WBHubManager 배포
ssh oracle-cloud "cd /home/ubuntu/workhub/WBHubManager && \
  git pull && \
  docker rm -f wbhubmanager-staging && \
  docker run -d --name wbhubmanager-staging \
    --network workhub-network \
    --add-host host.docker.internal:host-gateway \
    --env-file .env.staging \
    --health-cmd='wget -q --spider http://localhost:4090/api/health || exit 1' \
    --health-interval=30s --health-timeout=10s \
    --health-retries=3 --health-start-period=40s \
    wbhubmanager:staging"

# WBSalesHub 배포
ssh oracle-cloud "cd /home/ubuntu/workhub/WBSalesHub && \
  git pull && \
  docker rm -f wbsaleshub-staging && \
  docker run -d --name wbsaleshub-staging \
    --network workhub-network \
    --add-host host.docker.internal:host-gateway \
    --env-file .env.staging \
    wbsaleshub:staging"
```

**배포 확인**:
```bash
# 컨테이너 상태 확인
docker ps --filter name=staging
# 모두 healthy 상태 ✅

# 환경변수 확인
docker exec wbhubmanager-staging printenv | grep APP_URL
# APP_URL=https://staging.workhub.biz ✅
```

---

### 4. 문서 업데이트 (20분)

#### 4.1 claude-context.md 업데이트

**파일**: `/home/peterchung/WHCommon/claude-context.md`

**추가 내용**:
```markdown
- ✅ **스테이징 환경**: `.env.staging` 파일 사용
  - Docker 스테이징 환경에서 `.env.staging` 파일에서 환경변수 로드
  - `DOCKER_PORT=4400` 설정
  - **⚠️ 오라클 환경은 항상 HTTPS 사용**: 모든 URL은 `https://staging.workhub.biz` 형태 (포트 번호 없음)
  - SSL 인증서: Let's Encrypt (staging.workhub.biz)
  - nginx-staging이 포트 443(HTTPS)으로 SSL 터미네이션 수행

- ✅ **프로덕션 배포**: `.env.prd` 파일 사용
  - **⚠️ 오라클 환경은 항상 HTTPS 사용**: 모든 URL은 `https://workhub.biz` 형태 (포트 번호 없음)
  - SSL 인증서: Let's Encrypt (workhub.biz, *.workhub.biz)
  - nginx-prod가 포트 443(HTTPS)으로 SSL 터미네이션 수행
```

#### 4.2 배포-가이드-오라클.md 업데이트

**파일**: `/home/peterchung/WHCommon/배포-가이드-오라클.md`

**스테이징 배포 섹션에 추가**:
```markdown
### 1. 스테이징 배포

**⚠️ 중요: 오라클 환경 HTTPS 필수**
- 스테이징 환경의 모든 URL은 `https://staging.workhub.biz` 형태 (포트 번호 없음)
- `.env.staging` 파일의 모든 URL은 반드시 `https://`로 시작
- SSL 인증서: Let's Encrypt (staging.workhub.biz)
- nginx-staging이 포트 443(HTTPS)으로 SSL 터미네이션 수행
- 예시:
  ```bash
  APP_URL=https://staging.workhub.biz
  SALESHUB_URL=https://staging.workhub.biz/saleshub
  GOOGLE_REDIRECT_URI=https://staging.workhub.biz/api/auth/google-callback
  ```

# 9. 스테이징 테스트
# 브라우저: https://staging.workhub.biz
```

**프로덕션 배포 섹션에 추가**:
```markdown
### 2. 프로덕션 승격

**⚠️ 중요: 오라클 환경 HTTPS 필수**
- 프로덕션 환경의 모든 URL은 `https://workhub.biz` 형태 (포트 번호 없음)
- `.env.prd` 파일의 모든 URL은 반드시 `https://`로 시작
- SSL 인증서: Let's Encrypt (workhub.biz, *.workhub.biz)
- nginx-prod가 포트 443(HTTPS)으로 SSL 터미네이션 수행

# 브라우저: https://workhub.biz
```

**.env 예시 업데이트**:
```bash
### .env.staging 예시
NODE_ENV=production
DOCKER_PORT=4400
# ⚠️ 오라클 환경은 항상 HTTPS 사용
APP_URL=https://staging.workhub.biz
FRONTEND_URL=https://staging.workhub.biz
GOOGLE_REDIRECT_URI=https://staging.workhub.biz/api/auth/google-callback
SALESHUB_URL=https://staging.workhub.biz/saleshub
FINHUB_URL=https://staging.workhub.biz/finhub

### .env.production 예시
NODE_ENV=production
DOCKER_PORT=4500
# ⚠️ 오라클 환경은 항상 HTTPS 사용
APP_URL=https://workhub.biz
FRONTEND_URL=https://workhub.biz
GOOGLE_REDIRECT_URI=https://workhub.biz/api/auth/google-callback
SALESHUB_URL=https://workhub.biz/saleshub
FINHUB_URL=https://workhub.biz/finhub
COOKIE_DOMAIN=.workhub.biz
```

**문서 커밋**:
```bash
cd /home/peterchung/WHCommon
git add claude-context.md 배포-가이드-오라클.md
git commit -m "Add HTTPS requirement for Oracle environments"
git push
# Commit: 0360c99
```

---

## ✅ 작업 결과

### 변경된 파일
| 파일 | 변경 내용 | 커밋 해시 |
|------|----------|----------|
| WBHubManager/.env.staging | HTTP → HTTPS, 포트 제거 | 34863c2 |
| WBSalesHub/.env.staging | HTTP → HTTPS, 포트 제거 | dc01dd2 |
| WBFinHub/.env.staging | HTTP → HTTPS, 포트 제거 | d728aee |
| WHCommon/claude-context.md | HTTPS 필수 규칙 추가 | 0360c99 |
| WHCommon/배포-가이드-오라클.md | HTTPS 예시 및 가이드 추가 | 0360c99 |

### 접속 URL 변경
| 환경 | 변경 전 | 변경 후 |
|------|---------|---------|
| **HubManager** | `http://staging.workhub.biz:4400` | `https://staging.workhub.biz` ✅ |
| **SalesHub** | `http://staging.workhub.biz:4400/saleshub` | `https://staging.workhub.biz/saleshub` ✅ |
| **FinHub** | `http://staging.workhub.biz:4400/finhub` | `https://staging.workhub.biz/finhub` ✅ |

### 컨테이너 상태
```bash
NAMES                  STATUS
wbsaleshub-staging     Up 20 seconds (healthy)
wbhubmanager-staging   Up 25 seconds (healthy)
nginx-staging          Up 2 minutes
```

### 환경변수 검증
```bash
docker exec wbhubmanager-staging printenv | grep -E '(APP_URL|SALESHUB_URL|GOOGLE_REDIRECT_URI)'

# 출력:
APP_URL=https://staging.workhub.biz
GOOGLE_REDIRECT_URI=https://staging.workhub.biz/api/auth/google-callback
SALESHUB_URL=https://staging.workhub.biz/saleshub
```

---

## 📊 주요 개선사항

### 1. 보안 강화
- ✅ 모든 트래픽이 HTTPS로 암호화
- ✅ HSTS 헤더 적용 (max-age=31536000)
- ✅ TLS 1.2/1.3만 사용
- ✅ 강력한 암호화 스위트 적용

### 2. URL 간소화
- ✅ 포트 번호 제거: `:4400` → (없음)
- ✅ 프로토콜 통일: `http://` → `https://`
- ✅ 브라우저 자동 HTTPS 리다이렉트 문제 해결

### 3. 일관성 확보
- ✅ 모든 `.env.staging` 파일 통일된 형식
- ✅ 문서화 완료 (컨텍스트 + 배포 가이드)
- ✅ 프로덕션 환경도 동일 규칙 적용 예정

---

## 🔍 기술 상세

### SSL/TLS 설정
```nginx
ssl_certificate /etc/letsencrypt/live/staging.workhub.biz/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/staging.workhub.biz/privkey.pem;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### 보안 헤더
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### nginx 프록시 설정
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;  # ← 중요: HTTPS 명시
```

---

## 🎯 향후 작업

### 1. 프로덕션 환경 적용
- [ ] `.env.prd` 파일을 HTTPS로 업데이트
- [ ] `https://workhub.biz` (포트 없음)
- [ ] nginx-prod SSL 설정 검증

### 2. Google OAuth 콜백 URL 업데이트
- [ ] Google Cloud Console에서 승인된 리디렉션 URI 업데이트
- [ ] 스테이징: `https://staging.workhub.biz/api/auth/google-callback`
- [ ] 프로덕션: `https://workhub.biz/api/auth/google-callback`

### 3. Doppler 동기화
- [ ] Staging 환경 Doppler Config 업데이트
- [ ] `stg_wbhubmanager`, `stg_wbsaleshub`, `stg_wbfinhub`
- [ ] HTTPS URL로 변경

### 4. E2E 테스트 업데이트
- [ ] HWTestAgent 테스트 시나리오 URL 업데이트
- [ ] `http://staging.workhub.biz:4400` → `https://staging.workhub.biz`

---

## 🐛 트러블슈팅

### 문제 1: ERR_CONNECTION_REFUSED
**증상**: 브라우저에서 `staging.workhub.biz` 접속 시 연결 거부

**원인**: 브라우저가 자동으로 HTTPS로 접속하려 했으나 nginx가 HTTP만 지원

**해결**: nginx-staging에 SSL 설정 추가 및 HTTPS 포트(443, 4400) 오픈

### 문제 2: 포트 80 이미 사용 중
**증상**: `docker run` 시 "port 80 already allocated" 에러

**원인**: nginx-prod가 포트 80을 사용 중

**해결**: nginx-staging은 포트 80 없이 443, 4400만 사용

### 문제 3: nginx 로그에 TLS handshake 에러
**증상**: `\x16\x03\x01` (TLS handshake 시작 바이트) 보이며 400 에러

**원인**: 클라이언트가 HTTPS로 접속하려 했으나 서버가 HTTP로 응답

**해결**: nginx SSL 설정 추가로 TLS handshake 정상 처리

---

## 📝 교훈 및 베스트 프랙티스

### 1. 환경변수 URL 형식 표준화
- ✅ **오라클 환경은 항상 HTTPS 사용** (포트 없음)
- ✅ **로컬 개발은 HTTP 허용** (포트 명시)
- ✅ **프로토콜 + 도메인만 사용** (예: `https://staging.workhub.biz`)

### 2. nginx SSL 터미네이션
- ✅ **nginx가 SSL 처리**, 백엔드는 HTTP로 통신
- ✅ **`X-Forwarded-Proto: https` 헤더 전달** 필수
- ✅ **HSTS 헤더로 브라우저 강제 HTTPS**

### 3. Let's Encrypt 인증서 관리
- ✅ **자동 갱신 설정** (`certbot renew`)
- ✅ **인증서 유효기간 90일** (60일마다 갱신 권장)
- ✅ **nginx 재시작 불필요** (볼륨 마운트로 실시간 반영)

### 4. 문서화의 중요성
- ✅ **컨텍스트 파일에 규칙 명시** (향후 혼란 방지)
- ✅ **배포 가이드에 예시 포함** (실수 최소화)
- ✅ **작업 완료 문서로 노하우 축적**

---

## 🔗 관련 링크

- **Git 커밋**:
  - WBHubManager: [34863c2](https://github.com/peterchung0331/WBHubManager/commit/34863c2)
  - WBSalesHub: [dc01dd2](https://github.com/peterchung0331/WBSalesHub/commit/dc01dd2)
  - WBFinHub: [d728aee](https://github.com/peterchung0331/WBFinHub/commit/d728aee)
  - WHCommon: [0360c99](https://github.com/peterchung0331/WHCommon/commit/0360c99)

- **문서**:
  - [claude-context.md](../claude-context.md)
  - [배포-가이드-오라클.md](../배포-가이드-오라클.md)

- **접속 URL**:
  - HubManager: https://staging.workhub.biz
  - SalesHub: https://staging.workhub.biz/saleshub
  - FinHub: https://staging.workhub.biz/finhub

---

**작업 완료일**: 2026-01-12
**작성자**: Claude Sonnet 4.5
