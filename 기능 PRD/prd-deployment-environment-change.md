# PRD: 배포 환경 변경

## 1. 개요

### 1.1 문제 정의
현재 배포 방식의 문제점:
1. **로컬 빌드 의존성**: WSL에서 빌드 후 이미지 전송 → 네트워크 부하, 시간 소요
2. **환경 불일치**: 로컬 스테이징 ≠ 오라클 프로덕션 환경
3. **스테이징 부재**: 프로덕션 배포 전 실제 환경 테스트 불가
4. **환경변수 혼란**: 허브별로 주입 방식이 다름

### 1.2 목표
오라클 서버에서 스테이징/프로덕션 환경을 동시 운영하여:
- 프로덕션과 동일한 환경에서 테스트
- 안전한 배포 (스테이징 → 프로덕션 승격)
- 빠른 롤백 지원

---

## 2. 사용자 결정 사항

| 항목 | 결정 |
|------|------|
| **스테이징 접근** | `workhub.biz:4400` (포트로 구분) |
| **실행 방식** | 스테이징(4400) + 프로덕션(4500) 동시 실행 |
| **롤백 정책** | 최근 2개 버전 보관 |
| **빌드 방식** | Docker Compose 빌드 (BuildKit 최적화) |
| **환경변수 주입** | 하이브리드 (env_file + 파일 마운트) |
| **Git 구성** | 단일 저장소 (/home/ubuntu/workhub/) |
| **승격 방식** | 수동 승격 (promote-production.sh) |
| **Doppler** | 3환경 분리 (development, staging, production) |
| **디스크 관리** | 자동 정리 (빌드 후 cleanup) |

---

## 3. 기능 요구사항

### FR-1: 오라클 서버 빌드
- 오라클 서버에서 Docker Compose로 직접 빌드
- BuildKit 병렬 빌드 활성화
- 빌드 캐시 활용으로 재빌드 시간 단축

### FR-2: 스테이징/프로덕션 분리
- 스테이징: 포트 4400, `workhub.biz:4400`
- 프로덕션: 포트 4500/80, `workhub.biz`
- 동시 실행 지원

### FR-3: 이미지 태그 관리
- `:staging` - 현재 스테이징 버전
- `:production` - 현재 프로덕션 버전
- `:rollback` - 이전 프로덕션 버전 (롤백용)

### FR-4: 환경변수 관리
- `.env.common`: 공통 시크릿 (DB, OAuth)
- `.env.staging`: 스테이징 전용 설정
- `.env.production`: 프로덕션 전용 설정
- JWT 키: 파일 마운트 방식

### FR-5: 배포 스크립트
- `deploy-staging.sh`: Git pull → 빌드 → 스테이징 배포
- `promote-production.sh`: 스테이징 → 프로덕션 승격
- `rollback-production.sh`: 프로덕션 롤백

### FR-6: 자동 정리
- 빌드 후 오래된 이미지/캐시 자동 정리
- 디스크 용량 20GB 이상 유지

---

## 4. 비기능 요구사항

### NFR-1: 성능
- 재빌드 시간: 코드만 변경 시 2분 이내
- 승격 시간: 30초 이내

### NFR-2: 가용성
- 프로덕션 다운타임: 10초 이내 (컨테이너 교체)
- 롤백 시간: 30초 이내

### NFR-3: 보안
- JWT 키 파일: chmod 600
- 환경변수 파일: Git 추적 안함
- Doppler 중앙 관리

---

## 5. 범위 외 (Out of Scope)

- CI/CD 파이프라인 구축 (GitHub Actions 등)
- 무중단 배포 (Blue-Green, Canary)
- 컨테이너 오케스트레이션 (Kubernetes)
- SSL 인증서 자동 갱신

---

## 6. 성공 지표

| 지표 | 목표 |
|------|------|
| 배포 시간 | 10분 이내 (Git push → 스테이징 완료) |
| 롤백 성공률 | 100% |
| 환경 일관성 | 스테이징 = 프로덕션 |
| 다운타임 | 10초 이내 |

---

## 7. 현재 구조 vs 변경 목표

| 환경 | 현재 | 변경 후 |
|------|------|---------|
| **로컬** | npm run dev (3000번대/4000번대) | 유지 |
| **스테이징** | 로컬에서 Docker 빌드 → 로컬 테스트 (4400) | 오라클에서 빌드 (4400), 운영과 동일 환경 |
| **프로덕션** | 로컬 빌드 → 이미지 전송 (4500) | 스테이징 → 프로덕션 전환 (포트/도메인만 변경) |

---

## 8. 오라클 서버 디렉토리 구조

```
/home/ubuntu/workhub/
├── WBHubManager/
├── WBSalesHub/
├── WBFinHub/
├── WBOnboardingHub/
├── HWTestAgent/
├── config/
│   ├── .env.common          # 공통 (DB, OAuth, 세션)
│   ├── .env.staging         # 스테이징 (PORT=4400)
│   ├── .env.production      # 프로덕션 (PORT=4500)
│   └── keys/
│       ├── jwt_private.pem  # chmod 600
│       └── jwt_public.pem   # chmod 644
├── docker-compose.yml       # 통합 설정
├── nginx/
│   └── nginx.conf           # 4400/4500 라우팅
└── scripts/
    ├── deploy-staging.sh
    ├── promote-production.sh
    └── rollback-production.sh
```

---

## 9. 환경변수 파일 구조

### .env.common (공통 - Doppler에서 동기화)
```env
# 데이터베이스
DATABASE_URL=postgresql://...@localhost:5432/...

# 인증
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
```

### .env.staging
```env
NODE_ENV=production
DOCKER_PORT=4400
PUBLIC_URL=http://158.180.95.246:4400
COOKIE_DOMAIN=158.180.95.246
```

### .env.production
```env
NODE_ENV=production
DOCKER_PORT=4500
PUBLIC_URL=http://workhub.biz
COOKIE_DOMAIN=.workhub.biz
```

---

## 10. Docker Compose 설정

```yaml
services:
  wbhubmanager-staging:
    profiles: ["staging"]
    image: wbhubmanager:staging
    env_file:
      - ./config/.env.common
      - ./config/.env.staging
    volumes:
      - ./config/keys:/app/server/keys:ro

  wbhubmanager-prod:
    profiles: ["production"]
    image: wbhubmanager:production
    env_file:
      - ./config/.env.common
      - ./config/.env.production
    volumes:
      - ./config/keys:/app/server/keys:ro
```

---

## 11. 배포 프로세스

### 스테이징 배포
```bash
ssh oracle-cloud
cd /home/ubuntu/workhub
./scripts/deploy-staging.sh
# 브라우저: http://158.180.95.246:4400
```

### 프로덕션 승격
```bash
./scripts/promote-production.sh
# 브라우저: http://workhub.biz
```

### 롤백
```bash
./scripts/rollback-production.sh
```

---

## 12. 수정 대상 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `WHCommon/배포-가이드-오라클.md` | 수정 | 새로운 배포 프로세스 반영 |
| `WHCommon/claude-context.md` | 수정 | 배포 원칙, 환경변수 규칙 변경 |
| `WBHubManager/docker-compose.yml` | 수정 | staging/production 프로필 추가 |
| `WBHubManager/nginx/nginx.conf` | 수정 | 4400/4500 포트 분리 |
| `WBHubManager/Dockerfile` | 수정 | BuildKit 캐시 마운트 추가 |
| 오라클 서버 스크립트 (신규) | 생성 | deploy-staging.sh, promote-production.sh 등 |
| 각 허브 deploy-oracle.sh | 삭제 | 더 이상 사용하지 않음 |

---

마지막 업데이트: 2026-01-11
