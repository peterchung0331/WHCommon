# Railway Production Environment Variables

**Last Updated:** 2025-12-30

이 파일은 Railway 프로덕션 환경의 환경변수를 저장합니다.
Docker 배포 테스트 시 자동으로 사용됩니다.

## 환경변수

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:PORT/railway

# Application Environment
NODE_ENV=production

# Security Keys (Generate using: openssl rand -hex 64)
SESSION_SECRET=YOUR_SESSION_SECRET_HERE
JWT_SECRET=YOUR_JWT_SECRET_HERE

# JWT RSA Keys (Generate using: ssh-keygen -t rsa -b 2048 -m PEM)
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----

JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
YOUR_PUBLIC_KEY_HERE
-----END PUBLIC KEY-----

# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# Application URLs
FRONTEND_URL=https://your-app.up.railway.app
APP_URL=https://your-app.up.railway.app
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
NEXT_PUBLIC_HUB_MANAGER_URL=https://your-app.up.railway.app

# Railway Configuration
RAILWAY_API_TOKEN=YOUR_RAILWAY_API_TOKEN

# Hub Database URLs
SALESHUB_DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
FINHUB_DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
ONBOARDINGHUB_DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway

# Backup Configuration
BACKUP_RETENTION_DAYS=90
BACKUP_DIR=/backups

# Timezone
TZ=Asia/Seoul
```

## 사용 방법

### 1. 환경변수 업데이트
이 파일의 `## 환경변수` 섹션의 ```env 블록 안의 내용을 수정하세요.

### 2. Docker 배포 테스트 실행
```bash
npm run test:deploy
```

또는:
```bash
node scripts/docker-deploy-test.cjs
```

### 3. 새로운 환경변수 추가 시
Railway 대시보드에서 환경변수를 추가/수정한 후, 이 파일을 업데이트하세요.

## 주의사항

⚠️ **이 파일은 민감한 정보를 포함하고 있습니다!**
- Git에 커밋되지 않도록 `.gitignore`에 추가됨
- 절대 외부에 공유하지 마세요
- 로컬 개발 환경에서만 사용하세요

## 자동화

`docker-deploy-test.cjs` 스크립트는 자동으로:
1. 이 파일에서 환경변수를 읽어옴
2. `.env.docker-test` 파일 생성
3. Docker 빌드 테스트 실행
4. 임시 파일 정리
