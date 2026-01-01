# Common Directory

이 디렉토리는 프로젝트 전체에서 공통으로 사용되는 설정 파일과 문서를 저장합니다.

## 파일 목록

### railway-env.md
Railway 프로덕션 환경의 환경변수를 저장하는 파일입니다.

**용도:**
- Docker 배포 테스트 시 환경변수 자동 로드
- Railway 환경변수 버전 관리
- 로컬 테스트 환경 구성

**보안:**
- ⚠️ 이 파일은 `.gitignore`에 추가되어 Git에 커밋되지 않습니다
- 민감한 정보(비밀번호, API 키)가 포함되어 있으므로 외부 공유 금지
- 로컬 개발 환경에서만 사용

**사용법:**
```bash
# 1. Docker 배포 테스트 실행 (railway-env.md 자동 사용)
node scripts/docker-deploy-test.cjs

# 2. 환경변수 업데이트
node scripts/docker-deploy-test.cjs --update-env
# 또는 railway-env.md 파일을 직접 편집

# 3. npm 스크립트로 실행
npm run test:deploy
```

## .gitignore 설정

다음 파일들은 Git에 커밋되지 않습니다:
- `common/railway-env.md` - Railway 환경변수 (민감 정보 포함)
- `common/*.secret.*` - 기타 비밀 정보
- `common/.env.*` - 환경변수 파일

## 추가할 수 있는 파일

이 디렉토리에 추가할 수 있는 파일 예시:
- `database-schemas.md` - 데이터베이스 스키마 문서
- `api-specifications.md` - API 명세
- `deployment-checklist.md` - 배포 체크리스트
- `troubleshooting.md` - 문제 해결 가이드

**원칙:**
- 민감한 정보를 포함하는 파일은 반드시 `.gitignore`에 추가
- 팀원들과 공유해야 하는 문서는 민감 정보를 제외하고 커밋
- 환경별 설정은 별도 파일로 분리
