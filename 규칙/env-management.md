# 환경변수 관리 규칙

## 파일 구조
```
.env.template   # Git 포함 (키만, 값 없음)
.env.local      # 로컬 개발
.env.staging    # 스테이징
.env.prd        # 프로덕션
```

## Doppler 규칙
- **자동 실행 금지**: package.json, Dockerfile에서 Doppler CLI 사용 금지
- **수동 동기화만 허용**: 사용자 명시적 요청 시에만 실행

## Doppler CLI 사용법
토큰 파일: `/mnt/c/GitHub/WHCommon/env.doppler` (Git 미추적)

```bash
# HubManager
cd /mnt/c/GitHub/WBHubManager && DOPPLER_TOKEN=<HUBMANAGER_DEV_토큰> doppler secrets download --no-file --format env > .env.local

# SalesHub
cd /mnt/c/GitHub/WBSalesHub && DOPPLER_TOKEN=<SALESHUB_DEV_토큰> doppler secrets download --no-file --format env > .env.local

# FinHub
cd /mnt/c/GitHub/WBFinHub && DOPPLER_TOKEN=<FINHUB_DEV_토큰> doppler secrets download --no-file --format env > .env.local

# HWTestAgent
cd /mnt/c/GitHub/HWTestAgent && DOPPLER_TOKEN=<TESTAGENT_DEV_토큰> doppler secrets download --no-file --format env > .env.local
```

**참고**: 실제 토큰은 `env.doppler` 파일에서 확인 (절대 Git에 커밋 금지)

## JWT 키
- Base64 인코딩 필수
- 환경변수: `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`

## 상세 배포 가이드
- /mnt/c/GitHub/WHCommon/아키텍처/deployment.md
