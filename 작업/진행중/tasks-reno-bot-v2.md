# Task: 레노봇v2 마이크로서비스 구현

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 10일 (80 WU) |
| 파일 수 | ~30개 |
| 예상 LOC | ~2,000줄 |
| 복잡도 | 높음 (마이크로서비스 분리 + 단순화) |

## Relevant Files

### 신규 생성 (WBBotService)
- `/home/peterchung/WBBotService/package.json` - 프로젝트 설정
- `/home/peterchung/WBBotService/tsconfig.json` - TypeScript 설정 (declaration: false)
- `/home/peterchung/WBBotService/scripts/build-esbuild.js` - esbuild 빌드 스크립트
- `/home/peterchung/WBBotService/bots/reno/persona.ts` - PersonaLoader (50줄)
- `/home/peterchung/WBBotService/bots/reno/agent.ts` - 레노 에이전트
- `/home/peterchung/WBBotService/bots/shared/llm.ts` - LLM 싱글톤
- `/home/peterchung/WBBotService/bots/shared/slack.ts` - Slack 핸들러 팩토리
- `/home/peterchung/WBBotService/bots/shared/db.ts` - DB 접근 레이어
- `/home/peterchung/WBBotService/Dockerfile` - Docker 빌드 최적화
- `/home/peterchung/WBBotService/.dockerignore` - Docker 제외 파일

### 참조 파일 (레노봇v1 - 읽기 전용)
- `/home/peterchung/WBSalesHub/server/modules/reno/agent/RenoAgent.ts:1-1356` - 기존 에이전트 로직
- `/home/peterchung/WBSalesHub/server/modules/integrations/slack/renoSlackApp.ts:1-914` - Slack 통합
- `/home/peterchung/WBSalesHub/server/modules/reno/context/CustomerContextManager.ts` - 컨텍스트 관리

### Notes
- **레노봇v1은 WBSalesHub에 그대로 유지** (동작 보장)
- **레노봇v2는 WBBotService에 새로 구현** (단순화 버전)
- esbuild로 빌드 시간 15-20초 목표
- ai-agent-core 의존성 제거 (PersonaLoader로 대체)

## Instructions for Completing Tasks

**IMPORTANT:** 각 작업 완료 시 `- [ ]`를 `- [x]`로 변경하여 진행 상황을 추적합니다.

## Tasks

### Week 1: 단순화 + 빌드 최적화 ✅ **완료** (2026-01-28)

- [x] 0.0 프로젝트 초기화
  - [x] 0.1 WBBotService 디렉토리 생성 (`/home/peterchung/WBBotService`)
  - [x] 0.2 Git 초기화 (`git init`)
  - [x] 0.3 기본 디렉토리 구조 생성 (bots/, scripts/, etc.)

- [x] 1.0 package.json 및 기본 설정
  - [x] 1.1 package.json 생성 (esbuild, TypeScript, 핵심 의존성만)
  - [x] 1.2 tsconfig.json 생성 (declaration: false, sourceMap: false)
  - [x] 1.3 .gitignore 생성
  - [x] 1.4 .env.template 생성

- [x] 2.0 PersonaLoader 구현 (ai-agent-core 제거)
  - [x] 2.1 bots/reno/persona.ts 생성
  - [x] 2.2 PersonaLoader 클래스 구현 (Cache + DB)
  - [x] 2.3 HubManager DB 연결 설정
  - [x] 2.4 로컬 테스트 (페르소나 로드 확인)

- [x] 3.0 esbuild 빌드 시스템
  - [x] 3.1 scripts/build-esbuild.js 작성
  - [x] 3.2 package.json 빌드 스크립트 추가
  - [x] 3.3 빌드 테스트 (목표: <5초, **실제: 0.03초 ✅**)
  - [x] 3.4 타입 체크 스크립트 추가 (tsc --noEmit)

- [x] 4.0 LLM 싱글톤 구현
  - [x] 4.1 bots/shared/llm.ts 생성
  - [x] 4.2 LLMService 클래스 구현 (Anthropic, OpenAI)
  - [x] 4.3 환경변수에서 API 키 로드

- [x] 5.0 DB 접근 레이어
  - [x] 5.1 bots/shared/db.ts 생성
  - [x] 5.2 WBSalesHub DB pool 설정
  - [x] 5.3 HubManager DB pool 설정 (페르소나용)
  - [x] 5.4 연결 테스트

- [x] 6.0 레노 에이전트 복사 및 단순화
  - [x] 6.1 WBSalesHub의 RenoAgent.ts 복사 → bots/reno/agent.ts
  - [x] 6.2 ai-agent-core import 제거, PersonaLoader로 교체
  - [x] 6.3 LLMService 싱글톤 사용으로 변경
  - [x] 6.4 불필요한 의존성 제거

- [x] 7.0 Tool 시스템 구조화
  - [x] 7.1 bots/reno/tools/index.ts 생성
  - [x] 7.2 bots/reno/tools/customer.ts 생성 (고객 도구 4개)
  - [x] 7.3 bots/reno/tools/context.ts 생성 (컨텍스트 도구 2개)
  - [x] 7.4 Tool 정의와 핸들러 통합

- [x] 8.0 Slack 통합 단순화
  - [x] 8.1 bots/shared/slack.ts 생성
  - [x] 8.2 SlackHandlerFactory 클래스 구현
  - [x] 8.3 명령어 핸들러 팩토리 메서드 구현
  - [x] 8.4 이벤트 핸들러 통합 (app_mention + message)
  - [x] 8.5 권한 체크 로직 단순화 (5분 캐시)

- [x] 10.0 메인 진입점 구현
  - [x] 10.1 index.ts 생성
  - [x] 10.2 Express 서버 설정 (포트 4015)
  - [x] 10.3 Slack Bolt 앱 초기화
  - [x] 10.4 헬스체크 엔드포인트 (/api/health)
  - [x] 10.5 에러 핸들링 미들웨어

**Week 1 성과**:
- ✅ 빌드 시간: **0.03초** (목표 5초 대비 167배 개선, 원래 120초 대비 4000배 개선)
- ✅ 코드 복잡도: 40% 감소 (예상)
- ✅ ai-agent-core 의존성 제거 완료
- ✅ LLM 인스턴스 4개 → 1개 통합

### Week 2: 로컬 테스트 및 배포 준비

- [ ] 9.0 CustomerContextManager 이동 (선택, 필요 시)
  - [ ] 9.1 WBSalesHub의 CustomerContextManager.ts 복사
  - [ ] 9.2 bots/reno/context/CustomerContextManager.ts로 이동
  - [ ] 9.3 LLMService 사용으로 변경
  - [ ] 9.4 DB pool 연결 업데이트

### Week 3: Docker 및 배포

- [ ] 11.0 Docker 설정
  - [ ] 11.1 Dockerfile 작성 (멀티스테이지, esbuild)
  - [ ] 11.2 .dockerignore 작성
  - [ ] 11.3 로컬 Docker 빌드 테스트 (목표: <40초)
  - [ ] 11.4 Docker 이미지 크기 확인 (목표: <200MB)

- [ ] 12.0 환경 설정 파일
  - [ ] 12.1 .env.local 생성 (로컬 개발용)
  - [ ] 12.2 .env.staging 생성 (스테이징용)
  - [ ] 12.3 .env.prd 생성 (프로덕션용)

- [ ] 13.0 Service Token 인증
  - [ ] 13.1 WBSalesHub에 serviceAuth 미들웨어 추가
  - [ ] 13.2 SERVICE_TOKEN 환경변수 설정
  - [ ] 13.3 WBBotService에서 API 호출 시 토큰 포함
  - [ ] 13.4 인증 테스트

- [ ] 14.0 로컬 테스트
  - [ ] 14.1 로컬에서 WBBotService 실행 (npm run dev)
  - [ ] 14.2 페르소나 로드 테스트
  - [ ] 14.3 Slack 연동 테스트 (ngrok 사용)
  - [ ] 14.4 DB CRUD 테스트
  - [ ] 14.5 빌드 시간 측정 (목표: <20초)

- [ ] 15.0 docker-compose 통합
  - [ ] 15.1 docker-compose.yml 생성 (로컬용)
  - [ ] 15.2 wbbotservice 서비스 추가
  - [ ] 15.3 네트워크 설정 (workhub-network)
  - [ ] 15.4 환경변수 설정
  - [ ] 15.5 로컬 Docker Compose 실행 테스트

- [ ] 16.0 스테이징 배포 준비
  - [ ] 16.1 docker-compose.staging.yml 수정
  - [ ] 16.2 wbbotservice-staging 서비스 추가
  - [ ] 16.3 Nginx 설정 수정 (/slack/reno2 → :4015)
  - [ ] 16.4 배포 스크립트 작성 (scripts/deploy-staging.sh)

- [ ] 17.0 스테이징 배포
  - [ ] 17.1 오라클 서버 SSH 접속
  - [ ] 17.2 WBBotService 코드 업로드
  - [ ] 17.3 Docker 이미지 빌드
  - [ ] 17.4 docker-compose up -d wbbotservice-staging
  - [ ] 17.5 로그 확인 (docker logs -f wbbotservice-staging)

- [ ] 18.0 스테이징 검증
  - [ ] 18.1 헬스체크 확인 (curl http://localhost:4015/api/health)
  - [ ] 18.2 Slack 봇 테스트 (@reno2 멘션)
  - [ ] 18.3 고객 검색 테스트
  - [ ] 18.4 메모 추가 테스트
  - [ ] 18.5 빌드 시간 재측정

- [ ] 19.0 프로덕션 배포
  - [ ] 19.1 docker-compose.prod.yml 수정
  - [ ] 19.2 프로덕션 이미지 빌드
  - [ ] 19.3 프로덕션 배포 (blue-green 방식)
  - [ ] 19.4 Nginx 설정 업데이트
  - [ ] 19.5 헬스체크 및 모니터링

- [ ] 20.0 문서화 및 정리
  - [ ] 20.1 README.md 작성 (WBBotService)
  - [ ] 20.2 API 문서 작성
  - [ ] 20.3 환경변수 문서 업데이트
  - [ ] 20.4 배포 가이드 업데이트
  - [ ] 20.5 작업 파일 완료로 이동 (/작업/완료/)

## 복잡도 제거 체크리스트

### 제거할 복잡도
- [ ] ai-agent-core 패키지 의존성 제거
- [ ] PersonaManager 3단계 로딩 → 2단계로 단순화
- [ ] Anthropic 인스턴스 4개 → 1개 (LLMService)
- [ ] Slack 명령어 중복 코드 → 팩토리 패턴
- [ ] 이벤트 핸들러 중복 → 통합 핸들러
- [ ] 소스맵/선언 파일 생성 제거 (프로덕션)

### 유지할 기능
- [ ] DB 기반 페르소나 (PersonaLoader)
- [ ] 각 허브 DB CRUD (직접 접근)
- [ ] Claude Tool Use 패턴 (17개 도구)
- [ ] Slack 통합 (명령어 + 이벤트)
- [ ] 고객 컨텍스트 관리

## 검증 기준

### 빌드 시간
- [ ] npm run build < 5초
- [ ] Docker build (Cold) < 40초
- [ ] Docker build (Warm) < 15초

### 기능
- [ ] 페르소나 로드 성공 (DB에서)
- [ ] Slack 봇 응답 < 5초
- [ ] Claude API 호출 성공
- [ ] DB CRUD 동작 확인

### 복잡도
- [ ] 코드 줄 수 < 2,000줄 (40% 감소)
- [ ] 외부 의존성 3개 이하
- [ ] 중복 코드 < 100줄
- [ ] Anthropic 인스턴스 1개

## 참고 사항

- **레노봇v1 (WBSalesHub)**: 그대로 유지, 동작 보장
- **레노봇v2 (WBBotService)**: 새로운 마이크로서비스, 단순화 버전
- **Slack 명령어**: `/reno2-*` 형식 사용 (충돌 방지)
- **포트**: 4015 (WBBotService), 4010 (WBSalesHub)
