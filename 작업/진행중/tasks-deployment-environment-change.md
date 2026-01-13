# 배포 환경 변경 태스크

## Relevant Files

- `WHCommon/배포-가이드-오라클.md` - 배포 가이드 문서 (완료)
- `WHCommon/claude-context.md` - 컨텍스트 문서 (완료)
- `/home/ubuntu/workhub/docker-compose.yml` - Docker Compose 설정 (오라클 서버)
- `/home/ubuntu/workhub/nginx/nginx.conf` - Nginx 설정 (오라클 서버)
- `/home/ubuntu/workhub/scripts/` - 배포 스크립트 (오라클 서버)
- `WBHubManager/Dockerfile` - BuildKit 최적화
- 각 허브 `deploy-oracle.sh` - deprecated 처리

### Notes

- 4400 포트는 이미 방화벽에서 열려있음 (작업 불필요)
- 테스트 대상: WBHubManager만 먼저 진행
- 오라클 서버 스크립트는 `/home/ubuntu/workhub/scripts/`에 생성
- 환경변수 파일은 Git에 추적하지 않음

## Instructions for Completing Tasks

**IMPORTANT:** 각 태스크 완료 시 `- [ ]`를 `- [x]`로 변경하세요.

---

## Phase 0: 사전 준비 (순차)

- [ ] 0.0 Feature branch 생성
  - [ ] 0.1 `git checkout -b feature/deployment-environment-change`

---

## Phase 1: 병렬 작업 그룹

### [Agent A] 설정 파일 생성 (docker-compose, nginx, 배포 스크립트)

- [ ] A.1 Docker Compose 설정
  - [ ] A.1.1 `docker-compose.yml` 생성 (staging/production 프로필)
  - [ ] A.1.2 WBHubManager 서비스 정의
  - [ ] A.1.3 env_file 및 volumes 설정
  - [ ] A.1.4 네트워크 설정 (workhub-network)

- [ ] A.2 Nginx 설정
  - [ ] A.2.1 `nginx/nginx.conf` 생성
  - [ ] A.2.2 스테이징 서버 블록 (listen 4400)
  - [ ] A.2.3 프로덕션 서버 블록 (listen 4500, 80)
  - [ ] A.2.4 프록시 헤더 설정

- [ ] A.3 배포 스크립트 생성
  - [ ] A.3.1 `scripts/deploy-staging.sh`
  - [ ] A.3.2 `scripts/promote-production.sh`
  - [ ] A.3.3 `scripts/rollback-production.sh`
  - [ ] A.3.4 `scripts/cleanup-docker.sh`

### [Agent B] Dockerfile 최적화 (BuildKit)

- [ ] B.1 WBHubManager Dockerfile BuildKit 캐시 마운트 추가

### [Agent C] 기존 스크립트 deprecated 처리

- [ ] C.1 WBHubManager/deploy-oracle.sh deprecated 처리

---

## Phase 2: 오라클 서버 설정 (순차 - SSH)

- [ ] 2.0 오라클 서버 디렉토리 구조 생성
  - [ ] 2.1 `/home/ubuntu/workhub/` 디렉토리 생성
  - [ ] 2.2 `/home/ubuntu/workhub/config/` 디렉토리 생성
  - [ ] 2.3 `/home/ubuntu/workhub/config/keys/` 디렉토리 생성
  - [ ] 2.4 `/home/ubuntu/workhub/scripts/` 디렉토리 생성
  - [ ] 2.5 `/home/ubuntu/workhub/nginx/` 디렉토리 생성

- [ ] 3.0 환경변수 및 키 파일 설정
  - [ ] 3.1 `config/.env.common` 파일 생성
  - [ ] 3.2 `config/.env.staging` 파일 생성
  - [ ] 3.3 `config/.env.production` 파일 생성
  - [ ] 3.4 JWT 키 파일 복사 및 권한 설정

- [ ] 4.0 설정 파일 배포
  - [ ] 4.1 docker-compose.yml 오라클 서버에 복사
  - [ ] 4.2 nginx.conf 오라클 서버에 복사
  - [ ] 4.3 배포 스크립트 오라클 서버에 복사 및 chmod +x

---

## Phase 3: 테스트 (WBHubManager만)

- [ ] 5.0 스테이징 배포 테스트
  - [ ] 5.1 deploy-staging.sh 실행
  - [ ] 5.2 http://158.180.95.246:4400 접속 테스트
  - [ ] 5.3 Google OAuth 로그인 테스트
  - [ ] 5.4 API 헬스체크

- [ ] 6.0 프로덕션 승격 테스트
  - [ ] 6.1 promote-production.sh 실행
  - [ ] 6.2 http://workhub.biz 접속 테스트
  - [ ] 6.3 다운타임 측정

- [ ] 7.0 롤백 테스트
  - [ ] 7.1 rollback-production.sh 실행
  - [ ] 7.2 이전 버전 복원 확인

---

## Phase 4: 마무리

- [ ] 8.0 최종 커밋 및 머지
  - [ ] 8.1 모든 변경사항 Git 커밋
  - [ ] 8.2 PR 생성
  - [ ] 8.3 main 브랜치에 머지

---

## 병렬 작업 다이어그램

```
Phase 0 ──► 0.0 Feature branch
    │
    ▼
Phase 1 (병렬) ─────────────────────────────
    │
    ├──► [Agent A] 설정 파일 생성
    │     ├── docker-compose.yml
    │     ├── nginx.conf
    │     └── 배포 스크립트 4개
    │
    ├──► [Agent B] Dockerfile 최적화
    │     └── WBHubManager BuildKit
    │
    └──► [Agent C] 기존 스크립트 정리
          └── deploy-oracle.sh deprecated
────────────────────────────────────────────
    │
    ▼
Phase 2 (순차) ──► 오라클 서버 설정
    │
    ▼
Phase 3 (순차) ──► 테스트 (HubManager만)
    │
    ▼
Phase 4 (순차) ──► 커밋 및 머지
```
