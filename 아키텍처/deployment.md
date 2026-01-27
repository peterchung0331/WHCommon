# 배포 및 환경 설정

## 배포 아키텍처

```
┌────────────────────────────────────────────────────────────────┐
│                    Oracle Cloud (158.180.95.246)               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐      ┌─────────────────┐                 │
│  │  스테이징 환경   │      │  프로덕션 환경   │                 │
│  │                 │      │                 │                 │
│  │ nginx-staging   │      │ nginx-prod      │                 │
│  │ (:4400 HTTPS)   │      │ (:80/:443)      │                 │
│  │       │         │      │       │         │                 │
│  │       ▼         │      │       ▼         │                 │
│  │ ┌───────────┐   │      │ ┌───────────┐   │                 │
│  │ │HubManager │   │      │ │HubManager │   │                 │
│  │ │-staging   │   │      │ │-prod      │   │                 │
│  │ └───────────┘   │      │ └───────────┘   │                 │
│  │ ┌───────────┐   │      │ ┌───────────┐   │                 │
│  │ │SalesHub   │   │      │ │SalesHub   │   │                 │
│  │ │-staging   │   │      │ │-prod      │   │                 │
│  │ └───────────┘   │      │ └───────────┘   │                 │
│  │ ┌───────────┐   │      │ ┌───────────┐   │                 │
│  │ │FinHub    │   │      │ │FinHub    │   │                 │
│  │ │-staging   │   │      │ │-prod      │   │                 │
│  │ └───────────┘   │      │ └───────────┘   │                 │
│  └─────────────────┘      └─────────────────┘                 │
│                                                                │
│  ┌─────────────────────────────────────────┐                  │
│  │         workhub-network (공유)           │                  │
│  │              172.19.0.0/16              │                  │
│  └─────────────────────────────────────────┘                  │
│                                                                │
│  ┌─────────────────────────────────────────┐                  │
│  │           PostgreSQL (공용 DB)           │                  │
│  │              :5432                      │                  │
│  └─────────────────────────────────────────┘                  │
└────────────────────────────────────────────────────────────────┘
```

## Docker Compose 파일

| 파일 | 환경 | 용도 |
|------|------|------|
| `docker-compose.yml` | 로컬 | 개발용 (PostgreSQL 포함) |
| `docker-compose.staging.yml` | 스테이징 | 오라클 스테이징 |
| `docker-compose.prod.yml` | 프로덕션 | 오라클 프로덕션 |

## 컨테이너 명명 규칙

| 환경 | HubManager | SalesHub | FinHub | Nginx |
|------|-----------|----------|--------|-------|
| 스테이징 | hubmanager-staging | wbsaleshub-staging | wbfinhub-staging | nginx-staging |
| 프로덕션 | wbhubmanager-prod | wbsaleshub-prod | wbfinhub-prod | nginx-prod |

## 포트 체계

| 환경 | HubManager | SalesHub | FinHub | 외부 접근 |
|------|-----------|----------|--------|-----------|
| 로컬 (FE) | 3090 | 3010 | 3020 | - |
| 로컬 (BE) | 4090 | 4010 | 4020 | Nginx :4400 |
| 스테이징 | 내부 | 내부 | 내부 | Nginx :4400 |
| 프로덕션 | 4090 | 4010 | 4020 | Nginx :80/:443 |

## Nginx 경로 기반 라우팅

```nginx
# 기본 (HubManager)
location / {
    proxy_pass http://wbhubmanager:4090;
}

# SalesHub
location /saleshub {
    rewrite ^/saleshub(.*)$ $1 break;
    proxy_pass http://wbsaleshub:4010;
}

# FinHub
location /finhub {
    rewrite ^/finhub(.*)$ $1 break;
    proxy_pass http://wbfinhub:4020;
}
```

### 쿠키 전달 설정
```nginx
proxy_pass_header Set-Cookie;
proxy_set_header Cookie $http_cookie;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
```

## 환경변수 파일

### 파일 계층
```
.env.template   # Git 포함 (키만, 값 없음)
.env.local      # 로컬 개발 (Git 제외)
.env.staging    # 스테이징 (Git 제외)
.env.prd        # 프로덕션 (Git 제외)
```

### 필수 환경변수
```bash
# 데이터베이스
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 인증
SESSION_SECRET=32자_이상_랜덤_문자열
JWT_PRIVATE_KEY=Base64_인코딩_개인키
JWT_PUBLIC_KEY=Base64_인코딩_공개키
COOKIE_DOMAIN=.workhub.biz

# AI (선택)
ANTHROPIC_API_KEY=sk-ant-...

# OAuth (선택)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Slack (SalesHub만)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
```

### JWT 키 Base64 인코딩
```bash
cat server/keys/private.pem | base64 -w 0  # JWT_PRIVATE_KEY
cat server/keys/public.pem | base64 -w 0   # JWT_PUBLIC_KEY
```

## 배포 스크립트

### 위치
```
WBHubManager/scripts/oracle/
├── deploy-staging.sh           # 스테이징 배포
├── deploy-all-staging.sh       # 모든 허브 배포
└── promote-production.sh       # 프로덕션 승격
```

### 스테이징 배포 (`deploy-staging.sh`)
```bash
# 실행
./scripts/oracle/deploy-staging.sh

# 단계
1. Git Pull (최신 코드)
2. Docker 이미지 빌드 (BuildKit 캐시)
3. Docker Compose 실행
4. 헬스체크 확인
```

### 프로덕션 승격 (`promote-production.sh`)
```bash
# 실행
./scripts/oracle/promote-production.sh

# 단계
1. 스테이징 이미지 태그 → prod
2. 프로덕션 컨테이너 교체
3. 헬스체크 확인
```

## SSH 접속

```bash
# 오라클 서버 접속
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246

# 로그 확인
docker logs -f hubmanager-staging
docker logs -f wbsaleshub-staging

# Nginx 설정 수정
docker exec -it nginx-staging vi /etc/nginx/conf.d/default.conf
docker exec nginx-staging nginx -t
docker exec nginx-staging nginx -s reload
```

## URL 체계

| 환경 | HubManager | SalesHub | FinHub |
|------|-----------|----------|--------|
| 로컬 | localhost:3090 | localhost:3010/saleshub | localhost:3020/finhub |
| 스테이징 | staging.workhub.biz:4400 | staging.workhub.biz:4400/saleshub | staging.workhub.biz:4400/finhub |
| 프로덕션 | workhub.biz | workhub.biz/saleshub | workhub.biz/finhub |

## Docker 빌드 최적화

### Dockerfile 필수 요소
```dockerfile
# 멀티스테이지 빌드
FROM node:20-alpine AS deps
FROM node:20-alpine AS builder
FROM node:20-alpine AS runner

# BuildKit 캐시
RUN --mount=type=cache,target=/root/.npm npm ci

# 비root 사용자
USER node
```

### 허브별 목표 이미지 크기
| 허브 | 목표 크기 |
|------|----------|
| WBHubManager | 300-350MB |
| WBSalesHub | 250-300MB |
| WBFinHub | 300-350MB |

## 트러블슈팅

### 자주 발생하는 문제

1. **OOM (Exit 137)**
   - 원인: Docker 메모리 부족
   - 해결: `docker-compose.yml`에 메모리 제한 추가

2. **쿠키 SSO 실패**
   - 원인: COOKIE_DOMAIN 미설정
   - 해결: `.env`에 `COOKIE_DOMAIN=.workhub.biz` 추가

3. **Nginx 502 에러**
   - 원인: 백엔드 컨테이너 미시작
   - 해결: `docker logs` 확인 후 재시작

### 에러 패턴 DB
- URL: http://workhub.biz/testagent/api/error-patterns
- 검색: `curl -s "http://workhub.biz/testagent/api/error-patterns?query=에러키워드"`
