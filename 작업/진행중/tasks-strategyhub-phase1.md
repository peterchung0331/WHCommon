# StrategyHub v1.6 Phase 1 구현

> **MVP 백엔드 + 핵심 뷰어 (리서치/기획/승인/파이프라인)**

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 17일 (138 WU) |
| 파일 수 | ~60개 |
| 예상 LOC | ~8,000줄 |
| 복잡도 | 높음 |

## Relevant Files

- `server/index.ts` - 서버 진입점, 라우터 등록
- `server/agents/*.ts` - 9개 에이전트 구현
- `server/routes/*.ts` - API 라우터 (20개 엔드포인트)
- `server/services/*.ts` - 비즈니스 로직
- `server/workflows/strategy-graph.ts` - LangGraph 그래프 실제 연결
- `server/workflows/state.ts` - 상태 정의
- `frontend/app/projects/*.tsx` - 프로젝트 관련 페이지
- `frontend/app/projects/[id]/*.tsx` - 상세/모니터링/승인 페이지
- `frontend/components/*.tsx` - 공유 컴포넌트
- `frontend/lib/api.ts` - API 클라이언트

## Instructions for Completing Tasks

**IMPORTANT:** 각 작업 완료 시 `- [ ]`을 `- [x]`로 변경하세요.

## Tasks

- [x] 0.0 Phase 0 빌드 에러 수정
  - [x] 0.1 process.NODE_ENV → process.env.NODE_ENV 수정 (3파일)
  - [x] 0.2 TypeScript 빌드 확인

- [ ] 1.0 [PARALLEL GROUP: foundation] 의존성 설치 및 공용 타입 정의
  - [ ] 1.1 npm install (uuid, marked, zod, tavily 등)
  - [ ] 1.2 server/types/api.ts - 공통 API 응답 타입
  - [ ] 1.3 server/types/agents.ts - 에이전트 입출력 타입

- [ ] 2.0 [PARALLEL GROUP: backend-agents] D1.1 Discovery Agent
  - [ ] 2.1 server/agents/discovery.ts - 아이디어 생성 로직
  - [ ] 2.2 웹 검색 + LLM 프롬프트 + 점수화

- [ ] 3.0 [PARALLEL GROUP: backend-agents] C1.1 Clarifier Agent
  - [ ] 3.1 server/agents/clarifier.ts - 턴별 대화 로직
  - [ ] 3.2 프로젝트 타입 파싱 + 리서처 선택 + 확인

- [ ] 4.0 [PARALLEL GROUP: backend-agents] Research Agents (RW1.1, RD1.1, RF1.1)
  - [ ] 4.1 server/agents/researcher-web.ts (RW1.1) - Tavily 웹 검색
  - [ ] 4.2 server/agents/researcher-doc.ts (RD1.1) - pgvector 문서 분석
  - [ ] 4.3 server/agents/researcher-finance.ts (RF1.1) - 금융 규제 분석

- [ ] 5.0 [PARALLEL GROUP: backend-agents] V1.1 Validator (3-layer)
  - [ ] 5.1 server/agents/validator.ts - Rule-based + Consistency + Grounding

- [ ] 6.0 [PARALLEL GROUP: backend-agents] P1.1 Planner
  - [ ] 6.1 server/agents/planner.ts - 템플릿 기반 기획서 작성

- [ ] 7.0 [PARALLEL GROUP: backend-agents] RV1.1 Reviewer
  - [ ] 7.1 server/agents/reviewer.ts - 품질 평가 + 개선 제안

- [ ] 8.0 [PARALLEL GROUP: backend-agents] F1.1 Formatter
  - [ ] 8.1 server/agents/formatter.ts - Markdown→HTML→PDF

- [ ] 9.0 [PARALLEL GROUP: api-routes] API Routes 구현
  - [ ] 9.1 server/routes/projectRoutes.ts - 프로젝트 CRUD + status
  - [ ] 9.2 server/routes/discoveryRoutes.ts - Discovery API
  - [ ] 9.3 server/routes/clarifyRoutes.ts - Clarify 대화 API
  - [ ] 9.4 server/routes/resultRoutes.ts - Research/Validation/Planning/Review 결과 조회
  - [ ] 9.5 server/routes/approvalRoutes.ts - 승인 처리 API
  - [ ] 9.6 server/routes/formatRoutes.ts - 포맷팅 + 다운로드 API
  - [ ] 9.7 server/routes/contextRoutes.ts - 컨텍스트 관리 API
  - [ ] 9.8 server/services/projectService.ts - 프로젝트 DB 서비스
  - [ ] 9.9 server/index.ts 라우터 등록

- [ ] 10.0 strategy-graph.ts 에이전트 연결
  - [ ] 10.1 노드 함수에 실제 에이전트 호출 연결
  - [ ] 10.2 interrupt() 승인 흐름 구현

- [ ] 11.0 [PARALLEL GROUP: frontend] 프론트엔드 UI 구현
  - [ ] 11.1 대시보드 (프로젝트 카드 목록 + 워크플로우 축소)
  - [ ] 11.2 프로젝트 생성 (Clarify 대화 UI)
  - [ ] 11.3 아이디어 선택 페이지
  - [ ] 11.4 리서치 뷰어 (리서처별 탭 + 인용)
  - [ ] 11.5 기획안 뷰어 (마크다운 렌더링 + 목차)
  - [ ] 11.6 승인 화면 (기획안+검증+리뷰 통합)
  - [ ] 11.7 파이프라인 모니터 (SSE 실시간)
  - [ ] 11.8 컨텍스트 설정 페이지

- [ ] 12.0 빌드 검증 및 QA
  - [ ] 12.1 TypeScript 백엔드 빌드
  - [ ] 12.2 Next.js 프론트엔드 빌드
  - [ ] 12.3 API 엔드포인트 검증
