# PRD: HWTestAgent Playwright 에이전트 기반 재구현

## 1. Introduction/Overview

HWTestAgent를 Playwright 에이전트(Planner, Generator, Healer) 기반으로 재구현하여 AI 기반 자동화 QA 테스트 시스템을 구축한다.

### 문제점
- 기존 YAML 시나리오는 수동 작성/유지보수 필요
- API 변경 시 테스트 케이스 수동 업데이트 필요
- 테스트 실패 시 수동 디버깅 필요

### 해결책
- Playwright 에이전트가 테스트 계획 자동 생성 (Planner)
- Claude 서브에이전트가 테스트 코드 자동 생성 (Generator)
- 실패 테스트 자동 수정 (Healer)
- 버전별 diff 분석 및 자동 승인

---

## 2. Goals

1. **테스트 자동화**: 테스트 계획부터 코드 생성까지 AI 기반 자동화
2. **자가 복구**: 실패 테스트를 Healer가 자동 수정 (최대 3회 시도)
3. **버전 관리**: 테스트 스위트 버전별 diff 분석 및 변경점 리포트
4. **통합 대시보드**: Smoke + QA 테스트를 하나의 UI에서 관리
5. **품질 평가**: ISTQB/TMMi 기반 품질 수준 평가

---

## 3. User Stories

### 3.1 개발자
- 개발자로서, 코드 변경 후 자동으로 테스트가 재생성되어 수동 테스트 작성 부담을 줄이고 싶다.
- 개발자로서, 테스트 실패 시 자동으로 수정되어 디버깅 시간을 절약하고 싶다.

### 3.2 QA 담당자
- QA 담당자로서, 대시보드에서 전체 테스트 현황을 한눈에 파악하고 싶다.
- QA 담당자로서, 품질 점수를 통해 테스트 커버리지와 안정성을 측정하고 싶다.

### 3.3 프로젝트 관리자
- 관리자로서, Slack 알림으로 테스트 결과 요약을 받아 서비스 상태를 파악하고 싶다.
- 관리자로서, 테스트 버전별 변경점을 확인하여 회귀 테스트 범위를 관리하고 싶다.

---

## 4. Functional Requirements

### 4.1 테스트 그룹 관리
1. 시스템은 15개 테스트 그룹을 관리해야 한다 (Production 8개 + Development 7개)
2. 시스템은 그룹 간 의존성을 정의하고 Wave별로 병렬 실행해야 한다
3. 시스템은 그룹별 테스트 케이스를 조회할 수 있어야 한다

### 4.2 테스트 계획 (Planner)
4. 시스템은 서비스별 API/페이지를 분석하여 테스트 계획을 생성해야 한다
5. 시스템은 테스트 계획을 `specs/*.md` 파일로 저장해야 한다
6. 시스템은 매주 일요일 22:00에 자동으로 테스트를 재생성해야 한다
7. 시스템은 수동 트리거로도 테스트를 재생성할 수 있어야 한다

### 4.3 테스트 생성 (Generator)
8. 시스템은 Claude 서브에이전트를 호출하여 `.spec.ts` 파일을 생성해야 한다
9. 시스템은 생성된 테스트를 "New 테스트 스위트"로 저장해야 한다
10. 시스템은 이전 스위트와 diff를 분석하고 자동 승인해야 한다

### 4.4 테스트 실행 (Executor)
11. 시스템은 Wave별로 테스트를 병렬 실행해야 한다
12. 시스템은 Production 테스트를 매일 02:00에 실행해야 한다
13. 시스템은 Development 테스트를 매일 03:00에 실행해야 한다
14. 시스템은 수동 트리거로 특정 그룹만 실행할 수 있어야 한다

### 4.5 테스트 자동 수정 (Healer)
15. 시스템은 실패한 테스트를 자동으로 분석해야 한다
16. 시스템은 최대 3회까지 자동 수정을 시도해야 한다
17. 시스템은 수정 결과를 기록해야 한다

### 4.6 알림
18. 시스템은 테스트 스위트 전체에 대한 요약을 Slack으로 전송해야 한다
19. 알림에는 전체 테스트 수, 성공/실패 수, 힐링 수가 포함되어야 한다

### 4.7 대시보드
20. 시스템은 공개 접근 가능한 대시보드를 제공해야 한다 (추후 HubManager SSO 통합 예정)
21. 대시보드는 Smoke 테스트와 QA 테스트를 통합 관리해야 한다
22. 대시보드는 다음 페이지를 포함해야 한다:
    - 홈 (전체 현황)
    - 테스트 스위트 관리 (케이스, 결과, 변경 이력)
    - 수동 트리거 (Prod/Dev QA 실행)
    - 스모크 테스트 관리
    - 품질 평가 (ISTQB/TMMi 기반)

### 4.8 품질 평가
23. 시스템은 다음 영역별 품질 점수를 계산해야 한다:
    - 테스트 커버리지 (30%)
    - 테스트 안정성 (25%)
    - 테스트 효율성 (20%)
    - 결함 검출률 (25%)
24. 시스템은 A~F 등급으로 품질을 평가해야 한다

---

## 5. Non-Goals (Out of Scope)

1. 기존 Smoke 테스트의 Playwright 마이그레이션 (현행 YAML 유지)
2. 다른 브라우저 지원 (Chromium만 사용)
3. 모바일 테스트
4. 성능/부하 테스트
5. 보안 테스트 자동화

---

## 6. Design Considerations

### 6.1 프론트엔드 페이지 구조

```
/app/(dashboard)/
├── /                    # 대시보드 홈
├── /suites/             # 테스트 스위트 관리
│   └── [id]/
│       ├── page.tsx     # 케이스 목록
│       ├── results/     # 결과 이력
│       └── changes/     # 변경 이력
├── /runs/               # 실행 이력
├── /trigger/            # 수동 트리거
├── /smoke/              # 스모크 관리
└── /quality/            # 품질 평가
```

### 6.2 UI 컴포넌트
- lucide-react 아이콘 사용
- shadcn/ui 컴포넌트 활용
- 차트: recharts 또는 chart.js

---

## 7. Technical Considerations

### 7.1 아키텍처

```
src/playwright-agent/
├── orchestrator/
│   ├── AgentOrchestrator.ts   # 전체 워크플로우 관리
│   └── GroupManager.ts        # 그룹 분류/의존성
├── planner/
│   └── TestPlanner.ts         # specs/*.md 생성
├── generator/
│   └── TestGenerator.ts       # *.spec.ts 생성
├── healer/
│   └── TestHealer.ts          # 자동 수정
├── diff/
│   ├── SuiteDiffer.ts         # 버전 비교
│   └── ChangeReport.ts        # 변경점 리포트
└── executor/
    ├── SubAgentRunner.ts      # Claude 서브에이전트
    └── ParallelExecutor.ts    # 병렬 실행
```

### 7.2 데이터베이스 확장

신규 테이블:
- `test_suites`: 테스트 스위트 정의
- `suite_versions`: 스위트 버전 관리
- `suite_diffs`: 버전 간 diff 저장
- `playwright_test_runs`: 실행 결과

### 7.3 의존성
- Playwright MCP 에이전트 (이미 설치됨)
- Claude Code 서브에이전트 호출
- PostgreSQL (기존 사용)
- node-cron (기존 사용)

### 7.4 테스트 그룹 (15개)

**Production (8개)**
| 그룹 | 서비스 | 내용 | 의존성 |
|------|--------|------|--------|
| G01 | HubManager | Auth 플로우 | - |
| G02 | HubManager | Pages | - |
| G03 | HubManager | API CRUD | G01 |
| G04 | SalesHub | SSO 플로우 | - |
| G05 | SalesHub | Core | G04 |
| G06 | FinHub | SSO 플로우 | - |
| G07 | FinHub | Core | G06 |
| G08 | All | Cross-Service SSO | G04, G06 |

**Development (7개)**
| 그룹 | 서비스 | 내용 | 의존성 |
|------|--------|------|--------|
| G09 | HubManager | Dev Auth | - |
| G10 | HubManager | Dev API | G09 |
| G11 | SalesHub | Dev SSO | - |
| G12 | SalesHub | Dev Core | G11 |
| G13 | FinHub | Dev SSO | - |
| G14 | FinHub | Dev Core | G13 |
| G15 | All | Dev Integration | All |

### 7.5 실행 Wave

```
Wave 1: G01, G02, G04, G06, G09, G11, G13 (병렬)
Wave 2: G03, G05, G07, G10, G12, G14 (병렬)
Wave 3: G08, G15 (병렬)
```

---

## 8. Success Metrics

1. **테스트 자동 생성률**: 수동 개입 없이 생성되는 테스트 비율 > 90%
2. **Healer 성공률**: 자동 수정 성공률 > 70%
3. **테스트 커버리지**: API 엔드포인트 커버리지 > 85%
4. **품질 점수**: B 등급(80점) 이상 유지
5. **실행 시간**: 전체 테스트 실행 시간 < 15분

---

## 9. Open Questions

1. ~~테스트 재생성 트리거 방식~~ → **해결: 주간 자동 + 수동 트리거**
2. ~~Slack 알림 수준~~ → **해결: 스위트 전체 요약만**
3. ~~대시보드 접근 권한~~ → **해결: 공개, 추후 HubManager SSO 통합**
4. Claude API 비용 모니터링 방안?
5. 테스트 실행 타임아웃 설정 (현재 60초)?

---

## 10. 스케줄링

| 일정 | 유형 | 대상 |
|------|------|------|
| 매 4시간 | Smoke (현행 유지) | 모든 서비스 |
| 매일 02:00 | Playwright Full | Production |
| 매일 03:00 | Playwright Full | Development |
| 매주 일요일 22:00 | Test Regeneration | All |

---

## 11. 구현 위치

- **프로젝트**: HWTestAgent (`/mnt/c/GitHub/HWTestAgent`)
- **기존 코드 확장**: 새 모듈 추가 방식

---

*작성일: 2026-01-03*
*버전: 1.0*
