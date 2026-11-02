# Tasks: HWTestAgent Playwright 에이전트 기반 재구현

## Relevant Files

### 신규 생성 파일
- `src/playwright-agent/orchestrator/AgentOrchestrator.ts` - 전체 워크플로우 관리
- `src/playwright-agent/orchestrator/GroupManager.ts` - 15개 그룹 정의 및 의존성 관리
- `src/playwright-agent/planner/TestPlanner.ts` - 테스트 계획 생성 (specs/*.md)
- `src/playwright-agent/generator/TestGenerator.ts` - 테스트 코드 생성 (*.spec.ts)
- `src/playwright-agent/healer/TestHealer.ts` - 실패 테스트 자동 수정
- `src/playwright-agent/diff/SuiteDiffer.ts` - 스위트 버전 비교
- `src/playwright-agent/diff/ChangeReport.ts` - 변경점 리포트 생성
- `src/playwright-agent/executor/SubAgentRunner.ts` - Claude 서브에이전트 호출
- `src/playwright-agent/executor/ParallelExecutor.ts` - Wave별 병렬 실행
- `src/server/routes/playwright-agent.ts` - Playwright Agent API
- `src/server/routes/suites.ts` - Suite 관리 API
- `src/storage/models/TestSuite.ts` - 테스트 스위트 모델
- `src/storage/models/SuiteVersion.ts` - 스위트 버전 모델
- `src/storage/repositories/SuiteRepository.ts` - 스위트 DB 레이어
- `src/scheduler/PlaywrightScheduler.ts` - Playwright 테스트 스케줄러
- `scripts/schema-v2.sql` - 신규 테이블 스키마

### 프론트엔드 신규 파일
- `frontend/app/(dashboard)/page.tsx` - 대시보드 홈
- `frontend/app/(dashboard)/suites/page.tsx` - 스위트 목록
- `frontend/app/(dashboard)/suites/[id]/page.tsx` - 스위트 상세
- `frontend/app/(dashboard)/suites/[id]/results/page.tsx` - 결과 이력
- `frontend/app/(dashboard)/suites/[id]/changes/page.tsx` - 변경 이력
- `frontend/app/(dashboard)/runs/page.tsx` - 실행 이력
- `frontend/app/(dashboard)/runs/[id]/page.tsx` - 실행 상세
- `frontend/app/(dashboard)/trigger/page.tsx` - 수동 트리거
- `frontend/app/(dashboard)/smoke/page.tsx` - 스모크 관리
- `frontend/app/(dashboard)/quality/page.tsx` - 품질 평가

### 수정 파일
- `src/server/index.ts` - 새 라우트 등록
- `src/scheduler/TestScheduler.ts` - PlaywrightScheduler 통합
- `src/notification/SlackNotifier.ts` - 스위트 요약 알림 추가

### 테스트 출력 디렉토리
- `specs/` - 테스트 계획 마크다운
- `playwright-tests/groups/` - 그룹별 생성된 테스트

### Notes

- HWTestAgent 프로젝트 위치: `/mnt/c/GitHub/HWTestAgent`
- 기존 Smoke 테스트(YAML)는 현행 유지
- 대시보드는 공개 접근, 추후 HubManager SSO 통합 예정

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch `feature/playwright-agent-reimplementation`

- [x] 1.0 인프라 구축 (DB + API 기본 구조)
  - [x] 1.1 `scripts/schema-v2.sql` 생성 - 4개 신규 테이블 (test_suites, suite_versions, suite_diffs, playwright_test_runs)
  - [ ] 1.2 PostgreSQL에 스키마 적용
  - [x] 1.3 `src/storage/models/TestSuite.ts` 생성
  - [x] 1.4 `src/storage/models/SuiteVersion.ts` 생성
  - [x] 1.5 `src/storage/repositories/SuiteRepository.ts` 생성
  - [x] 1.6 `src/server/routes/suites.ts` 기본 CRUD API 구현
  - [x] 1.7 `src/server/routes/playwright-agent.ts` 기본 구조 생성
  - [x] 1.8 `src/server/index.ts`에 새 라우트 등록

- [x] 2.0 Orchestrator + GroupManager 구현
  - [x] 2.1 `src/playwright-agent/` 디렉토리 구조 생성
  - [x] 2.2 `GroupManager.ts` - 15개 그룹 정의 (G01-G15)
  - [x] 2.3 `GroupManager.ts` - 그룹 간 의존성 정의
  - [x] 2.4 `GroupManager.ts` - Wave별 병렬 그룹 계산 로직
  - [x] 2.5 `AgentOrchestrator.ts` - 6단계 Phase 워크플로우 정의
  - [x] 2.6 `AgentOrchestrator.ts` - Phase 전환 및 상태 관리

- [x] 3.0 Planner 구현
  - [x] 3.1 `TestPlanner.ts` - 서비스별 API 엔드포인트 분석 로직
  - [x] 3.2 `TestPlanner.ts` - 프론트엔드 페이지 분석 로직
  - [x] 3.3 `TestPlanner.ts` - `specs/*.md` 테스트 계획 생성
  - [x] 3.4 `specs/` 디렉토리 구조 생성 (wbhubmanager, wbsaleshub, wbfinhub)
  - [ ] 3.5 Planner API 엔드포인트 구현 (`POST /api/playwright/plan`)

- [x] 4.0 Generator 구현 (서브에이전트)
  - [x] 4.1 `SubAgentRunner.ts` - Claude Code 서브에이전트 호출 인터페이스
  - [x] 4.2 `SubAgentRunner.ts` - Generator 에이전트 프롬프트 템플릿
  - [x] 4.3 `TestGenerator.ts` - 그룹별 `.spec.ts` 파일 생성 로직
  - [x] 4.4 `playwright-tests/groups/` 디렉토리 구조 생성
  - [ ] 4.5 Generator API 엔드포인트 구현 (`POST /api/playwright/generate`)
  - [ ] 4.6 "New 테스트 스위트" 저장 로직

- [x] 5.0 Executor 구현
  - [x] 5.1 `ParallelExecutor.ts` - Wave별 병렬 실행 로직
  - [x] 5.2 `ParallelExecutor.ts` - 의존성 기반 실행 순서 관리
  - [x] 5.3 `ParallelExecutor.ts` - 실행 결과 수집 및 DB 저장
  - [ ] 5.4 Run API 엔드포인트 구현 (`POST /api/playwright/run`)
  - [ ] 5.5 실행 결과 조회 API (`GET /api/playwright/run/:id`)

- [x] 6.0 Healer 구현 (서브에이전트)
  - [x] 6.1 `TestHealer.ts` - 실패 테스트 분석 로직
  - [x] 6.2 `SubAgentRunner.ts` - Healer 에이전트 프롬프트 템플릿
  - [x] 6.3 `TestHealer.ts` - 자동 수정 시도 (최대 3회)
  - [x] 6.4 `TestHealer.ts` - 수정 결과 기록
  - [ ] 6.5 Heal API 엔드포인트 구현 (`POST /api/playwright/heal`)

- [x] 7.0 Diff & Reporting 구현
  - [x] 7.1 `SuiteDiffAnalyzer.ts` - 스위트 버전 간 diff 계산
  - [x] 7.2 `SuiteDiffAnalyzer.ts` - 추가/삭제/수정 테스트 분류
  - [x] 7.3 `SuiteDiffAnalyzer.ts` - 변경점 리포트 생성
  - [x] 7.4 자동 승인 로직 구현 (자동 승인)
  - [ ] 7.5 Diff API 엔드포인트 (`GET /api/suites/:id/versions/:v/diff`)
  - [ ] 7.6 Change Report API (`GET /api/suites/:id/change-report`)

- [ ] 8.0 스케줄러 통합
  - [ ] 8.1 `PlaywrightScheduler.ts` - 매일 02:00 Production 테스트
  - [ ] 8.2 `PlaywrightScheduler.ts` - 매일 03:00 Development 테스트
  - [ ] 8.3 `PlaywrightScheduler.ts` - 매주 일요일 22:00 재생성
  - [ ] 8.4 기존 `TestScheduler.ts`와 통합
  - [ ] 8.5 `SlackNotifier.ts` - 스위트 요약 알림 추가

- [ ] 9.0 프론트엔드 - 대시보드 홈
  - [ ] 9.1 `frontend/app/(dashboard)/layout.tsx` - 사이드바 네비게이션
  - [ ] 9.2 `frontend/app/(dashboard)/page.tsx` - 전체 현황 카드
  - [ ] 9.3 서비스별 현황 컴포넌트
  - [ ] 9.4 최근 실행 목록 컴포넌트
  - [ ] 9.5 품질 트렌드 차트 컴포넌트

- [ ] 10.0 프론트엔드 - 테스트 스위트 관리
  - [ ] 10.1 `/suites/page.tsx` - 스위트 목록 페이지
  - [ ] 10.2 `/suites/[id]/page.tsx` - 스위트 상세 (케이스 목록)
  - [ ] 10.3 `/suites/[id]/results/page.tsx` - 테스트 결과 이력
  - [ ] 10.4 `/suites/[id]/changes/page.tsx` - 수정 내역 (diff 뷰어)
  - [ ] 10.5 그룹별 테스트 케이스 트리 컴포넌트

- [ ] 11.0 프론트엔드 - 수동 트리거
  - [ ] 11.1 `/trigger/page.tsx` - Production/Development 실행 카드
  - [ ] 11.2 그룹 선택 체크박스 UI
  - [ ] 11.3 실행 진행률 표시 컴포넌트
  - [ ] 11.4 실시간 상태 업데이트 (polling 또는 SSE)

- [ ] 12.0 프론트엔드 - 스모크 테스트 관리
  - [ ] 12.1 `/smoke/page.tsx` - 현재 상태 카드 (서비스별)
  - [ ] 12.2 스케줄 설정 UI
  - [ ] 12.3 최근 24시간 이력 테이블
  - [ ] 12.4 즉시 실행 버튼

- [ ] 13.0 프론트엔드 - 품질 평가 대시보드
  - [ ] 13.1 `/quality/page.tsx` - 전체 품질 점수 게이지
  - [ ] 13.2 영역별 점수 바 차트 (커버리지, 안정성, 효율성, 검출률)
  - [ ] 13.3 TMMi 레벨 표시
  - [ ] 13.4 개선 권장 사항 카드
  - [ ] 13.5 품질 트렌드 차트 (30일)

- [ ] 14.0 통합 테스트 및 QA
  - [ ] 14.1 전체 워크플로우 E2E 테스트
  - [ ] 14.2 각 API 엔드포인트 테스트
  - [ ] 14.3 프론트엔드 빌드 검증
  - [ ] 14.4 백엔드 빌드 검증
  - [ ] 14.5 Smoke + QA 테스트 통합 확인
  - [ ] 14.6 Slack 알림 테스트

- [ ] 15.0 배포 및 문서화
  - [ ] 15.1 오라클 클라우드 배포
  - [ ] 15.2 환경변수 설정 확인
  - [ ] 15.3 스케줄러 정상 동작 확인
  - [ ] 15.4 README 업데이트
