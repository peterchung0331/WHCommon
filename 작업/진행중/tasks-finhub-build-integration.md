# Tasks: WBFinHub 빌드 통합

## 프로젝트 정보
- **프로젝트**: WBFinHub 오라클 클라우드 배포 시스템 통합
- **목표**: WBFinHub를 WBHubManager의 통합 빌드 시스템에 포함
- **관련 문서**: `/home/peterchung/.claude/plans/shimmying-zooming-lightning.md`

## Relevant Files

### WBHubManager 저장소
- `/home/peterchung/WBHubManager/docker-compose.oracle.yml` - 오라클 배포용 Docker Compose 설정
- `/home/peterchung/WBHubManager/nginx/nginx-staging.conf` - 스테이징 Nginx 설정
- `/home/peterchung/WBHubManager/nginx/nginx-prod.conf` - 프로덕션 Nginx 설정
- `/home/peterchung/WBHubManager/scripts/build-sequential.sh` - 순차 빌드 스크립트
- `/home/peterchung/WBHubManager/scripts/oracle/deploy-staging.sh` - 스테이징 배포 스크립트
- `/home/peterchung/WBHubManager/scripts/oracle/promote-production.sh` - 프로덕션 승격 스크립트
- `/home/peterchung/WBHubManager/scripts/oracle/rollback-production.sh` - 롤백 스크립트

### 참고 문서
- `/home/peterchung/WHCommon/배포-가이드-오라클.md` - 배포 가이드 문서 (업데이트 필요)

### Notes
- WBFinHub의 Dockerfile은 이미 최신 빌드 규칙(BuildKit 캐시, npm 타임아웃)이 적용되어 있어 수정 불필요
- 모든 작업은 WBHubManager 저장소에서 진행
- Git 커밋은 중간중간 진행 (각 주요 마일스톤마다)

## Instructions for Completing Tasks

**IMPORTANT:** 각 작업 완료 시 `- [ ]`를 `- [x]`로 변경하여 진행 상황을 추적합니다.

## Tasks

- [ ] 0.0 작업 준비
  - [ ] 0.1 현재 작업 디렉토리 확인 (`pwd`)
  - [ ] 0.2 WBHubManager 저장소로 이동 (`cd /home/peterchung/WBHubManager`)
  - [ ] 0.3 최신 코드 pull (`git pull`)
  - [ ] 0.4 작업 브랜치 생성 (`git checkout -b feature/finhub-build-integration`)

- [ ] 1.0 docker-compose.oracle.yml에 WBFinHub 서비스 추가
  - [ ] 1.1 파일 읽기 (`/home/peterchung/WBHubManager/docker-compose.oracle.yml`)
  - [ ] 1.2 스테이징 환경에 `wbfinhub-staging` 서비스 추가
    - 서비스명: `wbfinhub-staging`
    - 이미지: `wbfinhub:staging`
    - context: `./WBFinHub`
    - 포트: 4020 (내부)
    - env_file: `./config/.env.common`, `./config/.env.staging`
    - 환경변수: NODE_ENV=production, PORT=4020, HUB_MANAGER_URL, SERVE_FRONTEND=true, DOCKER=true
    - healthcheck: `/api/health` (30초 주기)
    - depends_on: wbhubmanager-staging
  - [ ] 1.3 프로덕션 환경에 `wbfinhub-prod` 서비스 추가
    - 스테이징과 동일한 구조, env_file만 `.env.production` 사용
    - depends_on: wbhubmanager-prod
  - [ ] 1.4 nginx-staging의 depends_on에 wbfinhub-staging 추가
  - [ ] 1.5 nginx-prod의 depends_on에 wbfinhub-prod 추가
  - [ ] 1.6 변경사항 저장 및 확인

- [ ] 2.0 Nginx 설정 업데이트 (스테이징)
  - [ ] 2.1 파일 읽기 (`/home/peterchung/WBHubManager/nginx/nginx-staging.conf`)
  - [ ] 2.2 `/finhub` location 블록 추가
    - upstream: `http://wbfinhub-staging:4020`
    - proxy_pass, proxy_set_header 설정 추가
  - [ ] 2.3 변경사항 저장 및 확인

- [ ] 3.0 Nginx 설정 업데이트 (프로덕션)
  - [ ] 3.1 파일 읽기 (`/home/peterchung/WBHubManager/nginx/nginx-prod.conf`)
  - [ ] 3.2 `/finhub` location 블록 추가
    - upstream: `http://wbfinhub-prod:4020`
    - proxy_pass, proxy_set_header 설정 추가
  - [ ] 3.3 변경사항 저장 및 확인

- [ ] 4.0 build-sequential.sh 스크립트 수정
  - [ ] 4.1 파일 읽기 (`/home/peterchung/WBHubManager/scripts/build-sequential.sh`)
  - [ ] 4.2 빌드 카운트 업데이트 (1/3 → 1/4, 2/3 → 2/4, 3/3 → 3/4)
  - [ ] 4.3 WBFinHub 빌드 단계 추가 (4/4)
    - 조건부 로직 제거, 무조건 빌드하도록 변경
    - `docker compose -f docker-compose.oracle.yml --profile "$PROFILE" build wbfinhub-$PROFILE`
  - [ ] 4.4 변경사항 저장 및 확인

- [ ] 5.0 배포 스크립트 업데이트 (deploy-staging.sh)
  - [ ] 5.1 파일 읽기 (`/home/peterchung/WBHubManager/scripts/oracle/deploy-staging.sh`)
  - [ ] 5.2 Git pull 대상에 WBFinHub 추가
  - [ ] 5.3 이미지 태그 루프에 `wbfinhub` 추가
  - [ ] 5.4 변경사항 저장 및 확인

- [ ] 6.0 배포 스크립트 업데이트 (promote-production.sh)
  - [ ] 6.1 파일 읽기 (`/home/peterchung/WBHubManager/scripts/oracle/promote-production.sh`)
  - [ ] 6.2 롤백 백업 루프에 `wbfinhub` 추가
  - [ ] 6.3 승격 루프에 `wbfinhub` 추가
  - [ ] 6.4 변경사항 저장 및 확인

- [ ] 7.0 배포 스크립트 업데이트 (rollback-production.sh)
  - [ ] 7.1 파일 읽기 (`/home/peterchung/WBHubManager/scripts/oracle/rollback-production.sh`)
  - [ ] 7.2 롤백 루프에 `wbfinhub` 추가
  - [ ] 7.3 변경사항 저장 및 확인

- [ ] 8.0 중간 커밋 (설정 파일 변경)
  - [ ] 8.1 변경된 파일 확인 (`git status`)
  - [ ] 8.2 변경사항 스테이징 (`git add .`)
  - [ ] 8.3 커밋 생성
    ```bash
    git commit -m "$(cat <<'EOF'
    feat: WBFinHub를 통합 빌드 시스템에 추가

    - docker-compose.oracle.yml: WBFinHub 스테이징/프로덕션 서비스 추가
    - Nginx 설정: /finhub 경로 라우팅 추가 (staging, prod)
    - build-sequential.sh: WBFinHub 빌드 단계 추가
    - 배포 스크립트: WBFinHub 포함하도록 업데이트

    🤖 Generated with [Claude Code](https://claude.com/claude-code)

    Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
    EOF
    )"
    ```

- [ ] 9.0 배포 가이드 문서 업데이트
  - [ ] 9.1 파일 읽기 (`/home/peterchung/WHCommon/배포-가이드-오라클.md`)
  - [ ] 9.2 프로젝트별 내부 포트 테이블에 WBFinHub 추가
  - [ ] 9.3 오라클 서버 디렉토리 구조에 WBFinHub 추가
  - [ ] 9.4 build-sequential.sh 예시 업데이트 (3/3 → 4/4)
  - [ ] 9.5 변경사항 저장

- [ ] 10.0 최종 커밋 및 푸시
  - [ ] 10.1 변경된 파일 확인 (`git status`)
  - [ ] 10.2 변경사항 스테이징 (`git add .`)
  - [ ] 10.3 커밋 생성
    ```bash
    git commit -m "$(cat <<'EOF'
    docs: 배포 가이드에 WBFinHub 반영

    - 프로젝트별 포트 테이블 업데이트
    - 디렉토리 구조 업데이트
    - 빌드 예시 업데이트

    🤖 Generated with [Claude Code](https://claude.com/claude-code)

    Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
    EOF
    )"
    ```
  - [ ] 10.4 원격 저장소에 푸시 (`git push origin feature/finhub-build-integration`)

- [ ] 11.0 QA 테스트 (로컬)
  - [ ] 11.1 docker-compose.oracle.yml 문법 검증 (`docker compose -f docker-compose.oracle.yml config`)
  - [ ] 11.2 Nginx 설정 문법 검증 (`nginx -t` 또는 Docker 컨테이너 내에서)
  - [ ] 11.3 build-sequential.sh 실행 권한 확인
  - [ ] 11.4 스크립트 문법 검증 (`bash -n scripts/build-sequential.sh`)

- [ ] 12.0 후속 작업 안내
  - [ ] 12.1 오라클 서버 작업 사항 정리
    - WBFinHub Git 저장소 클론 확인: `/home/ubuntu/workhub/WBFinHub`
    - 환경변수 파일 업데이트: `/home/ubuntu/workhub/config/.env.common`
    - Docker 네트워크 확인: `workhub-network`
  - [ ] 12.2 테스트 배포 계획 안내
    - 스테이징 배포: `./WBHubManager/scripts/oracle/deploy-staging.sh`
    - 접속 테스트: `http://158.180.95.246:4400/finhub`
    - 프로덕션 승격: `./WBHubManager/scripts/oracle/promote-production.sh`

## 완료 조건

- [x] 모든 설정 파일이 WBFinHub를 포함하도록 수정됨
- [x] Git 커밋이 중간중간 완료됨 (2회)
- [x] 배포 가이드 문서가 업데이트됨
- [x] 로컬 검증이 완료됨 (문법 체크)
- [x] 원격 저장소에 푸시 완료

## 참고 사항

### WBFinHub 현재 상태
- ✅ Dockerfile에 BuildKit 캐시 마운트 적용됨
- ✅ npm 타임아웃 설정 완료
- ✅ 멀티스테이지 빌드 구조
- ❌ docker-compose.oracle.yml 미포함 (이번 작업으로 추가)

### 오라클 서버 환경변수 예시
```env
# config/.env.common
DATABASE_URL_FINHUB=postgresql://workhub:PASSWORD@localhost:5432/finhub
WBFINHUB_BACKEND_URL=http://wbfinhub:4020
```

### 배포 후 확인 사항
```bash
# 컨테이너 실행 확인
docker ps | grep wbfinhub

# 로그 확인
docker logs -f wbfinhub-staging

# 헬스체크
curl http://158.180.95.246:4400/finhub/api/health
```
