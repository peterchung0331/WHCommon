# WBSalesHub 오라클 배포 통합 테스크

## Relevant Files

- `WBHubManager/docker-compose.oracle.yml` - 오라클 서버용 Docker Compose 설정 (WBSalesHub 서비스 추가)
- `WBHubManager/nginx/nginx-staging.conf` - 스테이징 Nginx 설정 (/saleshub 라우팅 추가)
- `WBHubManager/nginx/nginx-prod.conf` - 프로덕션 Nginx 설정 (/saleshub 라우팅 추가)
- `WBHubManager/scripts/oracle/deploy-staging.sh` - 스테이징 배포 스크립트 (WBSalesHub 빌드 추가)
- `WBHubManager/scripts/oracle/promote-production.sh` - 프로덕션 프로모션 스크립트 (WBSalesHub 추가)
- `WBHubManager/scripts/oracle/rollback-production.sh` - 프로덕션 롤백 스크립트 (WBSalesHub 추가)
- `WBSalesHub/Dockerfile` - WBSalesHub Docker 빌드 파일 (참고용)

### Notes

- 이 작업은 배포 인프라 설정 변경이므로 브랜치를 생성하지 않고 main에서 직접 진행
- 오라클 서버에 WBSalesHub 디렉토리와 DB가 이미 존재함
- 로컬 docker-compose.yml의 wbsaleshub 설정을 참고하여 오라클 버전 작성

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 1.0 docker-compose.oracle.yml에 WBSalesHub 서비스 추가
  - [x] 1.1 wbsaleshub-staging 서비스 정의 추가 (profile: staging, 포트 4010)
  - [x] 1.2 wbsaleshub-prod 서비스 정의 추가 (profile: production, 포트 5010)
  - [x] 1.3 nginx-staging depends_on에 wbsaleshub-staging 추가
  - [x] 1.4 nginx-prod depends_on에 wbsaleshub-prod 추가

- [x] 2.0 nginx-staging.conf에 WBSalesHub 라우팅 추가
  - [x] 2.1 upstream saleshub_staging 정의 추가 (server: wbsaleshub-staging:4010)
  - [x] 2.2 /saleshub location 블록 추가 (rewrite, proxy_pass, 쿠키 전달)

- [x] 3.0 nginx-prod.conf에 WBSalesHub 라우팅 추가
  - [x] 3.1 upstream saleshub_prod 정의 추가 (server: wbsaleshub-prod:5010)
  - [x] 3.2 /saleshub location 블록 추가 (포트 4500 서버)
  - [x] 3.3 /saleshub location 블록 추가 (포트 80 서버)

- [x] 4.0 deploy-staging.sh에 WBSalesHub 빌드 추가
  - [x] 4.1 [1/5] Git pull 섹션에 WBSalesHub Git pull 추가
  - [x] 4.2 [3/5] 이미지 태그 섹션에 wbsaleshub:staging 태그 추가
  - [x] 4.3 완료 메시지에 /saleshub URL 추가

- [x] 5.0 promote-production.sh에 WBSalesHub 프로모션 추가
  - [x] 5.1 [1/4] 스테이징 이미지 확인에 wbsaleshub:staging 확인 추가
  - [x] 5.2 [2/4] 롤백 태그 생성에 wbsaleshub:rollback 추가
  - [x] 5.3 [3/4] 프로덕션 태그 생성에 wbsaleshub:production 추가

- [x] 6.0 rollback-production.sh에 WBSalesHub 롤백 추가
  - [x] 6.1 [1/3] 롤백 이미지 확인에 wbsaleshub:rollback 확인 추가
  - [x] 6.2 [2/3] 롤백 태그 처리에 wbsaleshub 이미지 태그 추가

- [x] 7.0 변경사항 커밋 및 푸시
  - [x] 7.1 WBHubManager 저장소에 변경사항 커밋
  - [x] 7.2 feature/deployment-environment-change 브랜치에 푸시

- [ ] 8.0 오라클 서버 배포 및 테스트
  - [ ] 8.1 오라클 서버 SSH 접속
  - [ ] 8.2 WBHubManager Git pull
  - [ ] 8.3 WBSalesHub Git pull
  - [ ] 8.4 스테이징 배포 실행 (deploy-staging.sh)
  - [ ] 8.5 http://158.180.95.246:4400/saleshub 접속 테스트

## 포트 체계

| 환경 | HubManager | SalesHub | Nginx | 접속 URL |
|------|-----------|----------|-------|----------|
| 스테이징 | 4090 | 4010 | 4400 | http://158.180.95.246:4400/saleshub |
| 프로덕션 | 5090 | 5010 | 4500/80 | http://workhub.biz/saleshub |
