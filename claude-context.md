# Claude Code 컨텍스트

이 파일은 Claude Code와의 대화에서 기억해야 할 중요한 정보를 저장합니다.

## 프로젝트 정보

### 폴더 구조
- **공용폴더**: `C:\GitHub\WHCommon` - 프로젝트 간 공유되는 문서 및 리소스
- **테스트에이전트**: `C:\GitHub\HWTestAgent` - 자동화 테스트 시스템
- **테스트리포트폴더**: `C:\GitHub\HWTestAgent\TestReport` - 테스트 결과 및 리포트 저장
- **작업중폴더**: `C:\GitHub\WHCommon\OnProgress` - 진행 중인 작업 상태 기록

### 중요 문서
- **기능 리스트**: `C:\GitHub\WHCommon\기능-리스트.md` - 모든 WorkHub 프로젝트의 상세 기능 목록 (도입일 포함)
- **테스트리포트포맷**: `C:\GitHub\HWTestAgent\TestReport\테스트-리포트-템플릿.md` - 테스트 리포트 작성 시 사용하는 표준 템플릿
- **테스트PRD폴더**: `C:\GitHub\HWTestAgent\테스트_작성` - 테스트 시나리오 PRD 문서
- **기능PRD폴더**: `C:\GitHub\WHCommon\기능 PRD` - 기능 개발 PRD 문서

## 폴더 참조 규칙
- 사용자가 **폴더 이름을 명시하지 않고** 경로를 언급하면 **WHCommon 폴더**를 의미함
- 예: `/기능 PRD/` → `C:\GitHub\WHCommon\기능 PRD/`
- 예: `/tasks/` → `C:\GitHub\WHCommon\tasks/`

## 언어 설정
- 새 채팅이나 대화 압축 후 **한국어**를 기본 언어로 사용

## 세션 시작 규칙
- 새 세션에서 사용자가 처음 입력하는 단어는 **세션 제목용**임
- 첫 입력에 대해 관련 작업을 이어서 하지 말고, 제목으로만 인식하고 간단히 인사만 할 것
- 예: 사용자가 "안녕"이라고 입력하면 → "안녕하세요! 무엇을 도와드릴까요?" 정도로만 응답

## 저장소 관리 규칙

### WBHubManager 저장소 관리 항목
WBHubManager Git 저장소에서 다음 항목들을 관리합니다:
- ✅ **워크스페이스 설정 파일** (`.code-workspace` 등)
- ✅ **WHCommon 공용 폴더** 전체
  - Docker 테스트 가이드 (`WHCommon/Docker/*.md`)
  - 공용 규칙 파일 (`WHCommon/ppPrd.md`, `ppTask.md`, `claude-context.md` 등)
  - 기타 프로젝트 간 공유 문서 및 설정
- ✅ **WBHubManager 프로젝트 코드** (서버, 프론트엔드 등)

### 각 Hub 저장소 관리 항목 (WBFinHub, WBSalesHub 등)
- ✅ 각 Hub의 **고유 프로젝트 코드만** 관리
- ❌ 워크스페이스 설정이나 공용 폴더는 관리하지 않음

### 정리
모든 공용/공유 자원은 **WBHubManager 저장소 하나로 집중 관리**하고, 각 Hub는 자신의 코드만 관리하는 구조입니다.

---

## 기타 설정 및 규칙

### Railway 배포 제약사항
- ❌ **Railway CLI 사용 불가**: 이 워크스페이스에서는 Railway CLI 명령어를 실행할 수 없음
- ✅ **대안**: Railway 대시보드의 웹 UI를 통해서만 작업 가능
  - DB 마이그레이션: Railway 대시보드 → 서비스 → ⋮ → "Run a Command"
  - 환경변수 설정: Railway 대시보드 → Variables 탭
  - 로그 확인: Railway 대시보드 → Logs 탭
- 📌 Railway 관련 작업 시 항상 사용자에게 웹 UI를 통한 수동 작업을 요청해야 함

### 환경변수 관리 규칙
- ✅ **환경변수 템플릿**: `.env.template` 파일 사용
  - 각 프로젝트의 루트에 `.env.template` 파일 제공
  - 신규 개발자는 이 파일을 복사하여 `.env.local` 생성
  - 명령어: `cp .env.template .env.local`
  - Git에 커밋됨 (민감 정보 없이 구조만 제공)
- ✅ **로컬 개발**: `.env.local` 파일 사용
  - 로컬 개발 시 애플리케이션이 `.env.local` 파일에서 환경변수 로드
  - Git에 커밋되지 않음 (`.gitignore`에 포함)
  - 필수 항목(*) 표시된 환경변수는 반드시 값 입력 필요
- ✅ **프로덕션 배포**: `.env.prd` 파일 사용
  - 프로덕션 배포 시 애플리케이션이 `.env.prd` 파일에서 환경변수 로드
  - Git에 커밋되지 않음 (`.gitignore`에 포함)
  - 오라클 서버 배포 시 Git Hook이 자동으로 Doppler에서 `.env.prd` 생성
- ✅ **Doppler 동기화**: Git Hook을 통한 자동 동기화
  - **커밋 전** (`pre-commit`): `.env.local`의 환경변수를 Doppler Development 설정에 업로드
  - **Pull 후** (`post-merge`): Doppler에서 최신 환경변수를 다운로드하여 `.env.local` 업데이트
  - **배포 전** (`pre-push`): Doppler Production 설정에서 `.env.prd` 생성
- ❌ **실시간 Doppler 연동 금지**: 애플리케이션 실행 시 Doppler API를 직접 호출하지 않음
- 📌 **Doppler 토큰 파일 위치**: `C:\GitHub\WHCommon\env\.env.doppler`
  - 모든 프로젝트의 Development/Production Doppler 토큰이 저장됨
  - Git Hook 스크립트가 이 파일에서 토큰을 읽어 사용
  - 예시: `DOPPLER_TOKEN_HUBMANAGER_DEV`, `DOPPLER_TOKEN_HUBMANAGER_PRD`
- 📌 **신규 개발자 온보딩**: `C:\GitHub\WHCommon\온보딩-가이드.md` 참조

### 로컬 개발 데이터베이스 환경
- ✅ **Docker PostgreSQL 사용**: 모든 로컬 개발 환경은 Docker로 실행된 PostgreSQL 사용
  - 컨테이너 이름: `hwtestagent-postgres`
  - 이미지: `postgres:15`
  - 포트: `5432`
  - 사용자/비밀번호: `postgres/postgres`
  - 실행 명령어: `sudo docker run -d --name hwtestagent-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hwtestagent -p 5432:5432 postgres:15`
- ✅ **로컬 DB 연결 정보**:
  - **WBHubManager**: `postgresql://postgres:postgres@localhost:5432/hubmanager?schema=public`
  - **WBSalesHub**: `postgresql://postgres:postgres@localhost:5432/saleshub?schema=public`
  - **WBFinHub**: `postgresql://postgres:postgres@localhost:5432/finhub?schema=public`
  - **HWTestAgent**: `postgresql://postgres:postgres@localhost:5432/hwtestagent`
- ❌ **로컬에서 오라클 DB 직접 연결 금지**: 로컬 개발 시 오라클 클라우드 DB에 직접 연결하지 않음
  - 이유: 네트워크 레이턴시, 방화벽 설정, 프로덕션 데이터 격리
  - 로컬 개발은 항상 로컬 Docker PostgreSQL 사용

### 프로덕션 배포 환경
- **오라클 클라우드**: 메인 프로덕션 환경
  - WBHubManager: `http://158.180.95.246:3090` / `http://workhub.biz` (Frontend: 3090, Backend: 4090)
  - WBSalesHub: `http://158.180.95.246:3010` / `http://workhub.biz/saleshub` (Frontend: 3010, Backend: 4010)
  - WBFinHub: `http://158.180.95.246:3020` / `http://workhub.biz/finhub` (Frontend: 3020, Backend: 4020)
  - HWTestAgent: `http://158.180.95.246:3100` / `http://workhub.biz/testagent` (Frontend: 3100, Backend: 4100)
  - SSH 접속: `ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246`
  - SSH 키 위치: `C:\GitHub\WHCommon\SSHkey\ssh-key-2026-01-01.key` (WSL에서는 `~/.ssh/oracle-cloud.key`로 복사 후 사용)
- ❌ **Railway 배포 안함**: 오라클 클라우드로 완전 마이그레이션 완료

### 오라클 클라우드 배포 원칙
- ❌ **로컬 Docker 빌드 금지**: 로컬에서 Docker 이미지를 빌드하지 않음
- ✅ **오라클에서 직접 빌드**: 오라클 클라우드 서버에서 GitHub에서 코드를 받아 빌드
- ✅ **GitHub SSH 키 공유**: 로컬 WSL의 GitHub SSH 키(`~/.ssh/github_key`)를 오라클 서버에 복사하여 사용
- 📌 **배포 방법**:
  1. 각 프로젝트의 `deploy-oracle.sh` 스크립트 실행
  2. 스크립트가 자동으로 코드를 GitHub에 푸시
  3. 오라클 서버에서 Git pull 후 Docker 빌드 및 배포
- 📌 **배포 가이드**: `C:\GitHub\WHCommon\배포-가이드-오라클.md` 참조
- 📌 **신규 프로젝트**: 배포 가이드의 "신규 프로젝트 생성 시 체크리스트" 따라 설정

### GitHub SSH 설정 (WSL)
- **등록된 SSH 키**: `WSL Ubuntu_Home` (GitHub에 등록됨)
  - 핑거프린트: `SHA256:40SmkVG7LVOoq50pEe2FyhQ0dJL1EYGiAIpbO6Mjix8`
  - 등록일: 2026-01-01
- **WSL SSH 설정 파일**: `~/.ssh/config`
  ```
  Host github.com
      HostName github.com
      User git
      IdentityFile ~/.ssh/github_key
      IdentitiesOnly yes

  Host oracle-cloud
      HostName 158.180.95.246
      User ubuntu
      IdentityFile ~/.ssh/oracle-cloud.key
      IdentitiesOnly yes
  ```
- **WSL에서 Git push 명령어**: `git push origin <branch>`
- 📌 **주의**: WSL에서 GitHub SSH 키가 없으면 새로 생성 후 GitHub Settings > SSH keys에 등록 필요

### WSL 우선 원칙
- ⚠️ **WSL 우선**: 작업이 안 될 경우 설치, 설정 등으로 WSL에서 해결하는 방법을 우선 시도
- ⚠️ **Windows는 최후 수단**: WSL에서 도저히 해결 불가능한 경우에만 Windows에서 진행
- 예시:
  - SSH 키 없음 → WSL에서 `ssh-keygen`으로 새로 생성 후 GitHub에 등록
  - 패키지 없음 → `apt install` 또는 `npm install`로 설치
  - 권한 문제 → `chmod`로 권한 수정

### WSL sudo 설정
- ✅ **sudo 비밀번호 없이 사용 가능**: `/etc/sudoers.d/peterchung` 파일에 설정됨
- 설정 방법 (이미 완료됨):
  ```powershell
  # Windows PowerShell (관리자 권한)에서 실행
  wsl -u root bash -c "echo 'peterchung ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers.d/peterchung && chmod 0440 /etc/sudoers.d/peterchung"
  ```
- 확인: `sudo whoami` → `root` 출력 (비밀번호 요구 없음)

### HWTestAgent 테스트 시나리오
- **ISTQB 표준 기반 4종 시나리오**:
  - Smoke: 배포 전 최소 검증 (4시간마다)
  - Core-API-P0: 시스템 장애 수준 Critical (6시간마다)
  - Core-API-P1: 핵심 기능 오류 수준 High (하루 2회)
  - Core-API-P2: 부가 기능 오류 수준 Medium (매일 정오)
- **대상 프로젝트**: WBHubManager, WBSalesHub, WBFinHub
- **지원 환경**: production, development, docker

### UI 아이콘 렌더링 규칙
- ✅ **lucide-react 라이브러리 사용**: 모든 프로젝트에서 UI 아이콘은 `lucide-react`의 SVG 아이콘을 사용
- ❌ **이모지 사용 금지**: 이모지(🤖🔧👤🔒 등)는 사용하지 않음
- 📌 **예시**: WBSalesHub 대시보드, WBHubManager 허브 선택 페이지 등
- 📌 **설치**: `npm install lucide-react`
- 📌 **사용법**:
  ```tsx
  import { FlaskConical, Bot, Users, ShieldCheck } from 'lucide-react';

  <FlaskConical className="w-5 h-5 text-blue-600" />
  ```

### Playwright 반복 디버깅 (플라반복디버깅)
사용자가 "플라반복디버깅" 또는 "플레이라이트 반복 디버깅"이라고 요청하면, Playwright를 활용하여 화면이 제대로 나올 때까지 반복적으로 디버깅을 수행합니다.

**수행 절차**:
1. **현재 상태 확인**
   - 페이지 접속 시도 및 스크린샷 캡처
   - 네트워크 요청/응답 모니터링
   - 콘솔 에러 확인

2. **문제 진단**
   - HTTP 상태 코드 확인 (404, 500 등)
   - API 엔드포인트 연결 상태 확인
   - 프론트엔드/백엔드 서버 실행 상태 확인
   - 환경변수 및 설정 파일 검증

3. **문제 해결**
   - 발견된 문제에 대한 수정 적용
   - 서버 재시작 (필요시)
   - 코드 수정 (필요시)

4. **재검증**
   - 수정 후 다시 Playwright로 테스트
   - 화면이 정상적으로 표시될 때까지 1-3단계 반복

5. **완료 보고**
   - 최종 스크린샷 제공
   - 수정한 내용 요약
   - 접속 URL 및 상태 정보 제공

**테스트 스크립트 예시**:
```typescript
import { test, expect } from '@playwright/test';

test('debug page until success', async ({ page }) => {
  // 네트워크 및 콘솔 모니터링
  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('❌ Console Error:', msg.text());
  });

  // 페이지 접속
  await page.goto('http://localhost:3090/hubs');

  // 스크린샷 저장
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

  // 상태 확인
  const response = await page.goto('http://localhost:3090/hubs');
  console.log('Status:', response?.status());
});
```

### SSO 테스트 계정
- **Google 테스트 계정**: 환경변수 `TEST_GOOGLE_EMAIL`, `TEST_GOOGLE_PASSWORD` 참조
- **계정 정보**: 각 프로젝트의 `.env.template` 파일에 기록됨
- **사용처**: WBFinHub - WBHubManager SSO 통합 테스트
- **주의**: SSO 테스트 시 항상 이 테스트 계정을 사용할 것
- 📌 **테스트 방법**:
  1. 환경변수에서 `TEST_GOOGLE_EMAIL`, `TEST_GOOGLE_PASSWORD` 읽기
  2. Playwright로 Google OAuth 자동 로그인 구현
  3. 토큰 전달 및 인증 상태 검증
  4. 대시보드 접근 확인

---
마지막 업데이트: 2026-01-02
