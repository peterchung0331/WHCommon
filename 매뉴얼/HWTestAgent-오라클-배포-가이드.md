# HWTestAgent 오라클 클라우드 배포 가이드

**작성일**: 2026-01-16
**목적**: 여러 로컬 PC에서 중앙 집중식 에러 패턴 DB 사용

---

## 📋 배포 개요

### 배포 이유
- **문제**: 3개 PC(집, 사무실, 노트북)에서 독립적으로 작업 시 에러 데이터 파편화
- **해결**: 오라클 클라우드에 중앙 에러 DB 구축하여 모든 PC에서 공유
- **효과**:
  - 통합 에러 수집 (10+8+5 = 23 에러/월 → 단일 DB)
  - success_rate 신뢰도 향상 (더 많은 적용 사례)
  - 24/7 에러 기록 가능

### 배포 구성
- **백엔드 API**: Express 서버 (포트 4100)
- **프론트엔드**: 정적 HTML 대시보드 (public/index.html, 743줄)
- **데이터베이스**: PostgreSQL (testagent DB)
- **AI 솔루션**: Claude API 연동
- **알림**: Slack Webhook

---

## 🔧 사전 준비 (One-time Setup)

### 1. 오라클 서버 PostgreSQL DB 생성

```bash
# SSH 접속
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246

# PostgreSQL 접속
sudo -u postgres psql

# DB 및 사용자 생성
CREATE DATABASE testagent;
CREATE USER testagent_user WITH PASSWORD 'testagent_secure_password';
GRANT ALL PRIVILEGES ON DATABASE testagent TO testagent_user;
\c testagent
GRANT ALL ON SCHEMA public TO testagent_user;
\q

# DB 마이그레이션 (로컬에서 HWTestAgent 디렉토리에서 실행)
# TODO: 마이그레이션 스크립트 실행
```

### 2. Nginx 설정 추가

```bash
# 오라클 서버에서
sudo nano /etc/nginx/sites-available/workhub

# 다음 내용 추가 (파일 끝에)
```

```nginx
# HWTestAgent API (포트 4100)
location /testagent/ {
    rewrite ^/testagent/?(.*)$ /$1 break;
    proxy_pass http://localhost:4100;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 60s;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
}

location = /testagent/health {
    proxy_pass http://localhost:4100/api/health;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 10s;
    proxy_connect_timeout 5s;
}

location = /testagent {
    proxy_pass http://localhost:4100/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

```bash
# Nginx 설정 검증 및 재시작
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 오라클 서버에 프로젝트 디렉토리 생성

```bash
# 오라클 서버에서
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246

# 디렉토리 생성
mkdir -p /home/ubuntu/workhub/HWTestAgent
cd /home/ubuntu/workhub/HWTestAgent

# Git clone
git clone git@github.com:peterchung0331/HWTestAgent.git .
```

### 4. Doppler 환경변수 동기화

```bash
# 로컬에서 Doppler에 환경변수 업로드 (첫 1회만)
# TODO: Doppler 설정 스크립트 실행
```

---

## 🚀 배포 방법

### 자동 배포 (권장)

```bash
# 로컬에서 HWTestAgent 디렉토리에서
./scripts/deploy-oracle.sh
```

**자동 수행 항목**:
1. ✅ 로컬 타입 체크
2. ✅ Git 커밋 확인
3. ✅ Git push
4. ✅ 오라클 서버 SSH 접속
5. ✅ Git pull
6. ✅ Docker 이미지 빌드
7. ✅ 컨테이너 재시작
8. ✅ Health check
9. ✅ 외부 접근 테스트

### 수동 배포

```bash
# 1. 로컬에서 변경사항 커밋 및 푸시
git add .
git commit -m "feat: Your changes"
git push origin master

# 2. 오라클 서버 접속
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246

# 3. 프로젝트 디렉토리로 이동
cd /home/ubuntu/workhub/HWTestAgent

# 4. 최신 코드 가져오기
git pull origin master

# 5. 기존 컨테이너 중지
docker-compose down

# 6. Docker 이미지 빌드
DOCKER_BUILDKIT=1 docker-compose build

# 7. 컨테이너 시작
docker-compose up -d

# 8. Health check
curl http://localhost:4100/api/health

# 9. 외부 접근 테스트
curl https://workhub.biz/testagent/health
```

---

## 🔍 배포 확인

### 1. 컨테이너 상태 확인

```bash
# 오라클 서버에서
docker ps | grep hwtestagent
```

예상 출력:
```
CONTAINER ID   IMAGE                  STATUS         PORTS                    NAMES
abc123def456   hwtestagent-api:latest Up 5 minutes   0.0.0.0:4100->4100/tcp   hwtestagent-api
```

### 2. Health Check

```bash
# 내부 (오라클 서버에서)
curl http://localhost:4100/api/health

# 외부 (로컬 PC에서)
curl https://workhub.biz/testagent/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2026-01-16T13:00:00.000Z"
}
```

### 3. 대시보드 접속

브라우저에서:
- https://workhub.biz/testagent

### 4. 로그 확인

```bash
# 오라클 서버에서
docker logs -f hwtestagent-api

# 최근 50줄만
docker logs --tail 50 hwtestagent-api
```

---

## 🧪 로컬 PC 설정 (각 PC마다)

### 1. 환경변수 업데이트

**PC1 (집), PC2 (사무실), PC3 (노트북)** 모두 동일하게 설정:

```bash
# WBHubManager/.env.local (또는 다른 허브)
TESTAGENT_API_URL=https://workhub.biz/testagent
```

### 2. 스킬테스터 연동 확인

```bash
# 테스트 에러 발생시켜서 원격 DB 기록 확인
/스킬테스터 허브매니저 단위

# 오라클 서버에서 DB 확인
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246
sudo -u postgres psql testagent
SELECT COUNT(*) FROM error_patterns;
```

---

## 📊 리소스 모니터링

### 오라클 서버 리소스 확인

```bash
# 메모리 사용량
docker stats hwtestagent-api --no-stream

# 디스크 사용량
docker images | grep hwtestagent
```

### 예상 리소스 사용량

| 항목 | 예상 값 | 오라클 Free Tier |
|------|---------|------------------|
| 메모리 | ~300-400MB | 24GB (1.7% 사용) |
| CPU | 5% 평균, 20% 피크 | 4 OCPU (5% 사용) |
| 디스크 | ~600MB | 200GB (0.3% 사용) |
| 네트워크 | ~50-100 MB/월 | 10TB/월 (무료) |

---

## 🛠️ 트러블슈팅

### 1. Health Check 실패

```bash
# 컨테이너 로그 확인
docker logs hwtestagent-api

# 컨테이너 재시작
docker-compose restart

# 포트 확인
netstat -tulpn | grep 4100
```

### 2. Nginx 502 Bad Gateway

```bash
# Nginx 설정 검증
sudo nginx -t

# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log

# 백엔드 서버 실행 상태 확인
curl http://localhost:4100/api/health
```

### 3. 데이터베이스 연결 실패

```bash
# PostgreSQL 실행 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U testagent_user -d testagent -h localhost -p 5432

# 환경변수 확인
docker exec hwtestagent-api env | grep DATABASE_URL
```

### 4. Docker 이미지 빌드 실패

```bash
# BuildKit 없이 빌드
DOCKER_BUILDKIT=0 docker-compose build

# 캐시 없이 빌드
docker-compose build --no-cache

# 디스크 공간 확인
df -h
```

---

## 📝 유지보수

### 정기 작업

1. **로그 정리** (월 1회)
   ```bash
   docker logs --since 30d hwtestagent-api > /tmp/hwtestagent-backup.log
   docker-compose restart
   ```

2. **DB 백업** (주 1회)
   ```bash
   pg_dump -U testagent_user testagent > /tmp/testagent-backup-$(date +%Y%m%d).sql
   ```

3. **Docker 이미지 정리** (월 1회)
   ```bash
   docker image prune -f
   docker volume prune -f
   ```

### 업데이트

```bash
# 로컬에서 변경사항 푸시 후
./scripts/deploy-oracle.sh
```

---

## 🔗 참고 링크

- **프로젝트**: https://github.com/peterchung0331/HWTestAgent
- **대시보드**: https://workhub.biz/testagent
- **API 문서**: https://workhub.biz/testagent/api
- **플랜 파일**: `/home/peterchung/.claude/plans/purring-zooming-biscuit.md`

---

## 📞 문의

문제 발생 시:
1. 로그 확인 (`docker logs hwtestagent-api`)
2. GitHub Issues 등록
3. Slack #testagent 채널

---

**마지막 업데이트**: 2026-01-16
**작성자**: Claude Sonnet 4.5 + Peter Chung
