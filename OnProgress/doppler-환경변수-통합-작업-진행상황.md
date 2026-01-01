# Doppler 중앙화 환경변수 관리 시스템 구축 - 작업 진행상황

**프로젝트**: WBHubManager
**브랜치**: `feature/doppler-env-management`
**작업 시작일**: 2025-01-01
**최종 업데이트**: 2025-01-01
**상태**: ⏸️ Doppler CLI 설치 대기 중

---

## 📋 목차

1. [현재 상태](#현재-상태)
2. [완료된 작업](#완료된-작업)
3. [다음 단계](#다음-단계)
4. [중요 파일 및 경로](#중요-파일-및-경로)
5. [참고 사항](#참고-사항)

---

## 🎯 현재 상태

### ✅ 완료된 작업 (커밋 완료)

- **브랜치**: `feature/doppler-env-management`
- **커밋 ID**: `23722cb`
- **커밋 메시지**: "feat: Doppler 중앙화 환경변수 관리 시스템 구축"
- **변경된 파일**: 13개 (새로 생성 7개 + 수정 6개)

### ⏸️ 대기 중인 작업

**Doppler CLI 설치 필요** - 설치 시점 미정

```powershell
# Windows (Scoop)
scoop bucket add doppler https://github.com/DopplerHQ/scoop-doppler.git
scoop install doppler
```

### 🔄 현재 환경변수 관리 방식

- **기존 방식 유효**: `.env` 및 `frontend/.env.local` 파일 정상 작동 중
- **백업 완료**: `.env.backup` 및 `frontend/.env.local.backup`으로 안전하게 보관
- **하이브리드 모드**: Doppler 설치 전까지 `npm run dev:local` 사용

---

## ✅ 완료된 작업

### 1. Git 및 환경변수 백업

#### 파일 백업
```bash
.env → .env.backup
frontend/.env.local → frontend/.env.local.backup
```

#### .gitignore 업데이트
**파일**: `c:\GitHub\WBHubManager\.gitignore`

**추가된 내용**:
```gitignore
# Environment variables
frontend/.env.local
frontend/.env.production.local

# Environment variable backups
*.backup
railway-env-snapshot.txt

# Doppler
.doppler
doppler.yaml
.doppler.yaml

# Railway
.railway/
```

---

### 2. 환경변수 템플릿 업데이트

#### 루트 템플릿
**파일**: `c:\GitHub\WBHubManager\.env.example`

**주요 변경**:
- Doppler 사용 안내 추가 (CLI 설치, 인증, 프로젝트 설정)
- Doppler 없이 실행하는 방법 안내
- 모든 필수 환경변수 템플릿 추가:
  - DATABASE_URL
  - PORT, FRONTEND_PORT, NODE_ENV
  - SESSION_SECRET
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL
  - NEXT_PUBLIC_API_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
  - JWT_PRIVATE_KEY_PATH, JWT_PUBLIC_KEY_PATH
  - External Hub URLs (WBFINHUB, WBSALESHUB, ONBOARDINGHUB)

#### 프론트엔드 템플릿
**파일**: `c:\GitHub\WBHubManager\frontend\.env.local.example`

**주요 변경**:
- Doppler 사용 안내 추가
- NEXTAUTH_URL, NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_HUB_MANAGER_URL

---

### 3. Doppler 통합 스크립트 생성

#### 3.1 초기화 스크립트
**파일**: `c:\GitHub\WBHubManager\scripts\doppler-init.cjs`

**기능**:
- Doppler CLI 설치 확인
- Doppler 인증 상태 확인
- Doppler 프로젝트 설정 확인
- .env.backup 파일 존재 시 마이그레이션 안내
- 다음 단계 안내 메시지 출력

**사용법**:
```bash
npm run doppler:init
```

---

#### 3.2 마이그레이션 스크립트
**파일**: `c:\GitHub\WBHubManager\scripts\doppler-migrate.cjs`

**기능**:
- .env.backup 파일 읽기 및 파싱
- 주석 및 빈 줄 제외
- Doppler 프로젝트 설정 확인
- 환경변수 Doppler에 업로드 (`doppler secrets set`)
- 업로드 성공/실패 로그 출력

**사용법**:
```bash
npm run doppler:migrate
```

---

#### 3.3 Railway 동기화 스크립트
**파일**: `c:\GitHub\WBHubManager\scripts\sync-railway-env.cjs`

**기능**:
- Railway CLI 설치 및 인증 확인
- Doppler에서 프로덕션 환경변수 다운로드 (`--config prd`)
- Railway에 환경변수 업로드 (`railway variables set`)
- 동기화 결과 요약 출력
- Doppler-Railway 네이티브 통합 안내

**사용법**:
```bash
npm run doppler:sync-railway
```

**참고**: Doppler-Railway 네이티브 통합 사용 시 자동 동기화되므로 수동 실행 불필요

---

#### 3.4 JWT 키 인코딩 스크립트
**파일**: `c:\GitHub\WBHubManager\scripts\encode-jwt-keys.cjs`

**기능**:
- `server/keys/private.pem` 및 `server/keys/public.pem` 읽기
- Base64 인코딩 수행
- 인코딩된 키 출력
- Doppler 업로드 명령어 안내

**사용법**:
```bash
npm run doppler:encode-jwt
```

**출력 예시**:
```
JWT_PRIVATE_KEY=<base64-encoded-string>
JWT_PUBLIC_KEY=<base64-encoded-string>

자동 업로드 명령어:
doppler secrets set JWT_PRIVATE_KEY="..." --config prd
doppler secrets set JWT_PUBLIC_KEY="..." --config prd
```

---

#### 3.5 환경변수 검증 스크립트
**파일**: `c:\GitHub\WBHubManager\scripts\validate-env.cjs`

**기능**:
- 필수 환경변수 목록 정의 (dev, prd 환경별)
- Doppler 또는 로컬 .env에서 환경변수 확인
- 누락/비어있는 환경변수 목록 출력
- 검증 결과 요약 (성공/경고/실패)

**사용법**:
```bash
# 현재 환경 검증 (기본: dev)
npm run doppler:validate

# 개발 환경 검증
npm run doppler:validate:dev

# 프로덕션 환경 검증
npm run doppler:validate:prd
```

**필수 환경변수 (dev)**:
- DATABASE_URL
- PORT
- SESSION_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- APP_URL
- NEXT_PUBLIC_API_URL
- NEXTAUTH_URL, NEXTAUTH_SECRET

**필수 환경변수 (prd)** - dev 포함 + 추가:
- NODE_ENV
- JWT_PRIVATE_KEY, JWT_PUBLIC_KEY
- WBFINHUB_BACKEND_URL
- WBSALESHUB_URL
- ONBOARDINGHUB_URL

---

### 4. package.json 스크립트 업데이트

#### 루트 package.json
**파일**: `c:\GitHub\WBHubManager\package.json`

**추가/수정된 스크립트**:

**개발/배포 스크립트**:
```json
{
  "dev": "doppler run -- nodemon --watch server --exec tsx server/index.ts",
  "dev:local": "nodemon --watch server --exec tsx server/index.ts",
  "start": "doppler run --config prd -- node dist/server/index.js",
  "start:local": "NODE_ENV=production node dist/server/index.js"
}
```

**Doppler 관리 스크립트**:
```json
{
  "doppler:init": "node scripts/doppler-init.cjs",
  "doppler:migrate": "node scripts/doppler-migrate.cjs",
  "doppler:sync-railway": "node scripts/sync-railway-env.cjs",
  "doppler:secrets": "doppler secrets",
  "doppler:validate": "node scripts/validate-env.cjs",
  "doppler:validate:dev": "node scripts/validate-env.cjs dev",
  "doppler:validate:prd": "node scripts/validate-env.cjs prd",
  "doppler:encode-jwt": "node scripts/encode-jwt-keys.cjs"
}
```

**Docker 스크립트**:
```json
{
  "docker:up": "doppler run -- docker-compose up",
  "docker:railway": "doppler run --config prd -- docker-compose -f docker-compose.railway.yml up"
}
```

---

#### 프론트엔드 package.json
**파일**: `c:\GitHub\WBHubManager\frontend\package.json`

**추가/수정된 스크립트**:
```json
{
  "dev": "doppler run -- next dev -p 3090",
  "dev:local": "next dev -p 3090",
  "build": "doppler run --config prd -- next build",
  "build:local": "next build"
}
```

---

### 5. 문서화

#### 5.1 개발자 온보딩 가이드
**파일**: `c:\GitHub\WBHubManager\docs\DOPPLER_SETUP.md`

**내용**:
- 📖 목차
- 🚀 초기 설정 (Doppler CLI 설치, 인증, 프로젝트 설정)
- 💻 일상적인 사용 (개발 서버 시작, 환경변수 확인/수정, 환경 전환)
- 🐳 Docker 사용
- 🚂 Railway 배포 (자동 동기화, 수동 동기화)
- ❓ 트러블슈팅
  - Doppler 없이 로컬 실행
  - 환경변수가 변경되지 않음
  - "Doppler is not authenticated" 오류
  - Railway 통합 문제
  - 특정 환경변수만 누락됨
- 🙋 FAQ
  - .env 파일은 어떻게 되나요?
  - 환경변수를 추가하려면?
  - 프로덕션과 개발 환경의 환경변수가 다른가요?
  - 팀원과 환경변수를 공유하려면?
  - JWT 키는 어떻게 설정하나요?
- 📚 추가 자료 (Doppler 공식 문서 링크)

---

#### 5.2 README.md 업데이트
**파일**: `c:\GitHub\WBHubManager\README.md`

**추가/수정된 섹션**:

**환경 변수 설정 (Doppler)**:
```markdown
### 2. 환경 변수 설정 (Doppler)

이 프로젝트는 **Doppler**를 사용하여 환경변수를 중앙에서 관리합니다.

# 1. Doppler CLI 설치
scoop install doppler  # Windows (Scoop)
brew install dopplerhq/cli/doppler  # macOS (Homebrew)

# 2. Doppler 인증
doppler login

# 3. 프로젝트 설정
doppler setup

# 4. 환경변수 초기화 및 검증
npm run doppler:init
npm run doppler:validate:dev

**Doppler 없이 로컬에서 실행하려면:**
cp .env.example .env
npm run dev:local
```

**Railway 배포 섹션**:
```markdown
### Railway 배포

**환경 변수는 Doppler-Railway 통합으로 자동 동기화됩니다:**

- Doppler Dashboard → Integrations → Railway 연결
- `wbhubmanager_prd` Config를 Railway Production 환경에 매핑
- Doppler에서 환경변수 수정 시 Railway에 자동 배포

수동 동기화가 필요한 경우:
npm run doppler:sync-railway

필수 환경 변수:
- DATABASE_URL, SESSION_SECRET
- JWT_PRIVATE_KEY, JWT_PUBLIC_KEY (Base64 인코딩)
- NODE_ENV=production

JWT 키 인코딩:
npm run doppler:encode-jwt
```

---

### 6. 작업 목록
**파일**: `c:\GitHub\WBHubManager\tasks\tasks-doppler-env-management.md`

**내용**:
- 전체 작업 체크리스트 (18개 상위 작업)
- 각 작업별 세부 하위 작업
- 관련 파일 목록
- QA 테스트 체크리스트
- 예상 소요 시간: 약 5.5시간

---

## 🚀 다음 단계

### Phase 1: Doppler CLI 설치 및 인증

**작업 시점**: Doppler CLI 설치 결정 시

```powershell
# 1. Doppler CLI 설치 (Windows)
scoop bucket add doppler https://github.com/DopplerHQ/scoop-doppler.git
scoop install doppler

# 2. 설치 확인
doppler --version

# 3. 인증
doppler login
```

브라우저가 열리면 Doppler 계정으로 로그인 (계정 없으면 무료로 생성)

---

### Phase 2: Doppler 프로젝트 생성

**Doppler Dashboard**: https://dashboard.doppler.com

1. **새 프로젝트 생성**
   - 프로젝트 이름: `wbhubmanager`

2. **환경 Config 생성**
   - `dev` (개발 환경)
   - `prd` (프로덕션 환경)
   - 선택사항: `staging` (스테이징 환경)

---

### Phase 3: 로컬 프로젝트 설정

```bash
# 프로젝트 디렉토리로 이동
cd c:\GitHub\WBHubManager

# Doppler 프로젝트 설정
doppler setup
# → Project: wbhubmanager
# → Config: dev

# 초기화 스크립트 실행
npm run doppler:init
```

---

### Phase 4: 환경변수 마이그레이션

```bash
# .env.backup → Doppler 마이그레이션
npm run doppler:migrate

# Doppler에서 환경변수 확인
npm run doppler:secrets

# 또는
doppler secrets
```

**예상 출력**:
```
발견된 환경변수: 10개

환경변수 업로드 중...

✅ DATABASE_URL
✅ PORT
✅ SESSION_SECRET
✅ GOOGLE_CLIENT_ID
✅ GOOGLE_CLIENT_SECRET
✅ APP_URL
✅ NEXT_PUBLIC_API_URL
✅ NEXTAUTH_URL
✅ NEXTAUTH_SECRET
✅ FRONTEND_PORT

📊 마이그레이션 결과:
   성공: 10개
   실패: 0개

✨ 마이그레이션 완료!
```

---

### Phase 5: 환경변수 검증

```bash
# 개발 환경 검증
npm run doppler:validate:dev
```

**예상 출력**:
```
✅ 환경변수 유효성 검증

환경: dev
필수 환경변수: 9개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DATABASE_URL (70자)
✅ PORT (4자)
✅ SESSION_SECRET (40자)
✅ GOOGLE_CLIENT_ID (72자)
✅ GOOGLE_CLIENT_SECRET (35자)
✅ APP_URL (47자)
✅ NEXT_PUBLIC_API_URL (21자)
✅ NEXTAUTH_URL (21자)
✅ NEXTAUTH_SECRET (40자)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 검증 결과:
   ✅ 설정됨: 9개
   ⚠️  비어있음: 0개
   ❌ 누락됨: 0개

✨ 모든 환경변수가 올바르게 설정되었습니다!
```

누락된 환경변수가 있다면 추가:

```bash
doppler secrets set MISSING_KEY=value
```

---

### Phase 6: JWT 키 설정 (프로덕션)

```bash
# JWT 키 Base64 인코딩
npm run doppler:encode-jwt
```

**출력 예시**:
```
🔐 JWT 키 Base64 인코딩

✅ JWT 키 Base64 인코딩 완료

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Doppler prd 환경에 다음 환경변수를 설정하세요:

1️⃣ JWT_PRIVATE_KEY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFB...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2️⃣ JWT_PUBLIC_KEY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2tx...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


🚀 자동 업로드 명령어:

doppler secrets set JWT_PRIVATE_KEY="LS0tLS1CRUdJTi..." --config prd
doppler secrets set JWT_PUBLIC_KEY="LS0tLS1CRUdJTi..." --config prd
```

출력된 명령어를 복사하여 실행:

```bash
# 프로덕션 환경으로 전환
doppler setup --config prd

# JWT 키 설정
doppler secrets set JWT_PRIVATE_KEY="..." --config prd
doppler secrets set JWT_PUBLIC_KEY="..." --config prd

# 프로덕션 환경 검증
npm run doppler:validate:prd

# 다시 개발 환경으로 전환
doppler setup --config dev
```

---

### Phase 7: 개발 서버 실행 테스트

```bash
# 백엔드 개발 서버 (Doppler 자동 로드)
npm run dev

# 프론트엔드 개발 서버 (별도 터미널)
cd frontend
npm run dev
```

**확인 사항**:
- ✅ 서버가 정상적으로 시작되는지
- ✅ 데이터베이스 연결이 성공하는지
- ✅ 환경변수가 Doppler에서 로드되는지 (콘솔 로그 확인)
- ✅ 로그인 기능이 정상 작동하는지

**문제 발생 시**:
```bash
# 기존 방식으로 롤백
npm run dev:local
cd frontend && npm run dev:local
```

---

### Phase 8: Railway 통합 (선택사항)

#### 방법 1: Doppler-Railway 네이티브 통합 (권장)

**Doppler Dashboard**: https://dashboard.doppler.com

1. **Integrations 메뉴** → **Railway** 선택
2. **Connect to Railway** 클릭
3. Railway 계정 연결 (OAuth)
4. **Railway 프로젝트 선택**: `wbhubmanager`
5. **Config 매핑 설정**:
   - Doppler `wbhubmanager_prd` → Railway `Production` 환경
   - (선택) Doppler `wbhubmanager_dev` → Railway `Development` 환경
6. **자동 동기화 활성화** ✅

**결과**:
- Doppler에서 환경변수 변경 시 Railway에 **자동 동기화**
- Railway가 자동으로 재배포

**주의사항**:
- Railway Dashboard에서 환경변수를 **직접 수정하지 마세요**
- 모든 환경변수는 **Doppler에서만 관리**

---

#### 방법 2: 수동 동기화

Doppler-Railway 통합을 사용하지 않는 경우:

```bash
# Railway CLI 설치 (미설치 시)
npm install -g @railway/cli

# Railway 인증
railway login

# Doppler → Railway 수동 동기화
npm run doppler:sync-railway
```

**출력 예시**:
```
🚂 Doppler → Railway 환경변수 동기화

✅ Railway CLI 설치 확인
✅ Railway 인증 완료

1️⃣ Doppler에서 프로덕션 환경변수 가져오는 중...
   발견: 15개 환경변수

2️⃣ Railway에 환경변수 업로드 중...
   ✅ DATABASE_URL
   ✅ SESSION_SECRET
   ✅ JWT_PRIVATE_KEY
   ✅ JWT_PUBLIC_KEY
   ...

📊 동기화 결과:
   성공: 15개
   실패: 0개

✨ 동기화 완료!

확인: railway variables

💡 팁: Doppler-Railway 네이티브 통합을 사용하면 자동 동기화됩니다.
설정: https://docs.doppler.com/docs/railway
```

---

### Phase 9: 프로덕션 배포 테스트

```bash
# 프로덕션 빌드 (로컬)
npm run build

# 프로덕션 서버 실행 (로컬, Doppler prd 환경)
doppler setup --config prd
npm run start

# 또는 Doppler 없이
npm run start:local
```

**Railway 배포**:
1. Doppler-Railway 통합이 활성화되어 있다면, Doppler에서 환경변수 변경 시 자동 배포
2. Git push 시 Railway가 자동으로 빌드 및 배포

---

### Phase 10: 브랜치 병합 및 마무리

모든 테스트가 성공적으로 완료되면:

```bash
# 개발 환경으로 전환 (안전을 위해)
doppler setup --config dev

# 메인 브랜치로 전환
git checkout feature/hub-selection-layout

# Feature 브랜치 병합
git merge feature/doppler-env-management

# 푸시
git push origin feature/hub-selection-layout

# Feature 브랜치 삭제 (선택)
git branch -d feature/doppler-env-management
```

---

## 📁 중요 파일 및 경로

### 프로젝트 경로
```
c:\GitHub\WBHubManager\
```

### Git 정보
- **브랜치**: `feature/doppler-env-management`
- **커밋 ID**: `23722cb`
- **메인 브랜치**: `feature/hub-selection-layout`

### 생성된 스크립트
```
c:\GitHub\WBHubManager\scripts\doppler-init.cjs
c:\GitHub\WBHubManager\scripts\doppler-migrate.cjs
c:\GitHub\WBHubManager\scripts\sync-railway-env.cjs
c:\GitHub\WBHubManager\scripts\encode-jwt-keys.cjs
c:\GitHub\WBHubManager\scripts\validate-env.cjs
```

### 문서
```
c:\GitHub\WBHubManager\docs\DOPPLER_SETUP.md
c:\GitHub\WBHubManager\README.md (업데이트됨)
c:\GitHub\WBHubManager\tasks\tasks-doppler-env-management.md
```

### 환경변수 파일
```
c:\GitHub\WBHubManager\.env.backup (백업)
c:\GitHub\WBHubManager\.env.example (템플릿)
c:\GitHub\WBHubManager\frontend\.env.local.backup (백업)
c:\GitHub\WBHubManager\frontend\.env.local.example (템플릿)
```

### 설정 파일
```
c:\GitHub\WBHubManager\.gitignore (업데이트됨)
c:\GitHub\WBHubManager\package.json (업데이트됨)
c:\GitHub\WBHubManager\frontend\package.json (업데이트됨)
```

---

## 📝 참고 사항

### 기존 환경변수 관리 방식

**완전히 유효함** - Doppler CLI 설치 전까지 기존 방식 사용:

```bash
# 백엔드
npm run dev:local

# 프론트엔드
cd frontend
npm run dev:local
```

### 하이브리드 모드

**현재 상태**: 두 가지 방식 모두 지원

1. **Doppler 방식** (권장, 설치 후):
   ```bash
   npm run dev           # Doppler에서 환경변수 자동 로드
   npm run start         # 프로덕션 (Doppler prd 환경)
   ```

2. **로컬 .env 방식** (백업):
   ```bash
   npm run dev:local     # .env 파일 사용
   npm run start:local   # 프로덕션 (.env 파일 사용)
   ```

### 환경 전환

```bash
# 개발 환경
doppler setup --config dev

# 프로덕션 환경
doppler setup --config prd

# 현재 환경 확인
doppler configure get config
```

### 롤백 방법

Doppler에 문제가 생기면 언제든지 기존 방식으로 롤백 가능:

```bash
# .env.backup을 .env로 복사
cp .env.backup .env
cp frontend/.env.local.backup frontend/.env.local

# 로컬 방식으로 실행
npm run dev:local
cd frontend && npm run dev:local
```

### 보안 주의사항

- ✅ `.env` 및 `frontend/.env.local` 파일은 `.gitignore`에 포함됨
- ✅ `.env.backup` 파일도 `.gitignore`에 포함되어 Git에 커밋되지 않음
- ✅ Doppler는 AES-256 암호화로 환경변수를 안전하게 저장
- ✅ Railway Dashboard에서 환경변수 직접 수정 금지 (Doppler에서만 관리)

### 팀 협업

**팀원 온보딩**:
1. Doppler CLI 설치
2. `doppler login` 인증
3. Doppler Dashboard에서 프로젝트 접근 권한 부여
4. `doppler setup` 프로젝트 설정
5. `npm run dev` 실행 → 자동으로 환경변수 로드

**장점**:
- 환경변수를 Slack/Discord로 공유할 필요 없음
- 중앙에서 관리, 팀원 모두 동일한 환경변수 사용
- 환경변수 변경 이력 추적 (Audit Log)

---

## 🔗 참고 링크

- **Doppler 공식 문서**: https://docs.doppler.com
- **Doppler CLI 설치**: https://docs.doppler.com/docs/install-cli
- **Railway 통합 가이드**: https://docs.doppler.com/docs/railway
- **환경변수 베스트 프랙티스**: https://docs.doppler.com/docs/best-practices
- **Doppler Dashboard**: https://dashboard.doppler.com

---

## ✅ 체크리스트 (재개 시 확인)

작업을 재개할 때 다음 사항을 확인하세요:

### 환경 확인
- [ ] Git 브랜치가 `feature/doppler-env-management`인지 확인
- [ ] 최신 커밋이 `23722cb` (Doppler 통합)인지 확인
- [ ] `.env.backup` 파일이 존재하는지 확인
- [ ] `scripts/doppler-*.cjs` 파일들이 모두 존재하는지 확인

### Doppler CLI 설치 (최초 1회)
- [ ] Doppler CLI 설치 (`scoop install doppler`)
- [ ] Doppler 인증 (`doppler login`)
- [ ] Doppler 프로젝트 생성 (Dashboard 또는 CLI)
- [ ] 환경 Config 생성 (`dev`, `prd`)

### 환경변수 마이그레이션
- [ ] `doppler setup` 프로젝트 설정
- [ ] `npm run doppler:init` 초기화
- [ ] `npm run doppler:migrate` 마이그레이션
- [ ] `npm run doppler:validate:dev` 검증

### JWT 키 설정 (프로덕션)
- [ ] `npm run doppler:encode-jwt` JWT 키 인코딩
- [ ] Doppler prd 환경에 JWT_PRIVATE_KEY, JWT_PUBLIC_KEY 설정
- [ ] `npm run doppler:validate:prd` 프로덕션 환경 검증

### 테스트
- [ ] `npm run dev` 백엔드 개발 서버 실행 테스트
- [ ] `cd frontend && npm run dev` 프론트엔드 개발 서버 실행 테스트
- [ ] 데이터베이스 연결 확인
- [ ] 로그인 기능 테스트
- [ ] 프로덕션 빌드 테스트 (`npm run build`)

### Railway 통합 (선택)
- [ ] Doppler Dashboard에서 Railway 통합 활성화
- [ ] Config 매핑 설정 (`wbhubmanager_prd` → Railway Production)
- [ ] 자동 동기화 테스트

### 브랜치 병합
- [ ] 모든 테스트 성공 확인
- [ ] `git checkout feature/hub-selection-layout` 메인 브랜치로 전환
- [ ] `git merge feature/doppler-env-management` 병합
- [ ] `git push origin feature/hub-selection-layout` 푸시

---

## 🆘 문제 발생 시

### Doppler CLI 미설치
```bash
scoop install doppler
```

### Doppler 인증 실패
```bash
doppler login
```

### 환경변수 누락
```bash
# 특정 환경변수 추가
doppler secrets set KEY=VALUE

# 전체 검증
npm run doppler:validate:dev
```

### 기존 방식으로 롤백
```bash
npm run dev:local
cd frontend && npm run dev:local
```

### Railway 동기화 문제
```bash
# 수동 동기화
npm run doppler:sync-railway

# Railway CLI 재인증
railway login
```

---

**작업 재개 시 이 문서를 참고하여 다음 단계를 진행하세요!**

**마지막 업데이트**: 2025-01-01
**작성자**: Claude Sonnet 4.5 (Claude Code)
