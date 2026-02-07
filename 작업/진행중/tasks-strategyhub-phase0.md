# StrategyHub Phase 0 구현 작업 리스트

> **목표**: 코드 작성 전 모든 설계 완료 + 클로드 코드 친화적 구조 + 빌드 최적화
> **기간**: 1.5주 (48시간)
> **작성일**: 2026-02-07

---

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 6일 (48 WU) |
| 파일 수 | ~50개 |
| 예상 LOC | ~3000줄 |
| 복잡도 | 중간 |

---

## Relevant Files

### DB 스키마
- `migrations/001_init.sql` - PostgreSQL DDL (26개 테이블)
- `server/config/database.ts` - DB 연결 설정

### 백엔드
- `server/index.ts` - 서버 진입점
- `server/config/env-validation.ts` - 환경변수 검증
- `server/utils/logger.ts` - 구조화된 로깅
- `server/utils/debug-context.ts` - 디버그 컨텍스트
- `server/utils/error-handler.ts` - 에러 핸들링
- `server/workflows/strategy-graph.ts` - LangGraph 그래프 정의
- `server/workflows/state.ts` - LangGraph 상태 정의
- `server/agents/tools.ts` - Agent SDK 도구 정의

### 프론트엔드
- `frontend/next.config.js` - Next.js 설정
- `frontend/tailwind.config.ts` - Tailwind CSS 설정
- `frontend/app/layout.tsx` - 루트 레이아웃
- `frontend/app/page.tsx` - 홈 페이지
- `frontend/lib/api-client.ts` - Axios API 클라이언트

### 템플릿
- `templates/discovery-only.md` - 아이디어 발견 템플릿
- `templates/idea-to-planning.md` - 전체 기획 템플릿
- `templates/regulatory-review.md` - 규제 검토 템플릿
- `templates/market-analysis.md` - 시장 분석 템플릿
- `templates/tech-evaluation.md` - 기술 평가 템플릿

### 인프라
- `Dockerfile` - 멀티스테이지 빌드
- `.dockerignore` - Docker 빌드 최적화
- `docker-compose.yml` - 로컬 개발 환경
- `.env.template` - 환경변수 템플릿

### 문서
- `DEBUGGING.md` - 디버깅 가이드
- `docs/performance-targets.md` - 성능 목표 지표

---

## Instructions for Completing Tasks

**IMPORTANT:** 각 작업 완료 후 `- [ ]`를 `- [x]`로 변경하여 진행 상황을 추적합니다.

---

## Tasks

- [x] 0.0 Git 브랜치 생성
  - [x] 0.1 `feature/phase0-foundation` 브랜치 생성 및 체크아웃

- [ ] 1.0 [PARALLEL GROUP: db-setup] PostgreSQL DB 스키마 생성
  - [ ] 1.1 pgvector 확장 활성화 스크립트 작성
  - [ ] 1.2 기본 18개 테이블 DDL 작성 (users, strategy_projects, clarification_conversations 등)
  - [ ] 1.3 PostgresSaver 3개 테이블 DDL 작성 (checkpoints, checkpoint_writes, checkpoint_metadata)
  - [ ] 1.4 v1.6 신규 5개 테이블 DDL 작성 (context_globals, context_templates, context_logs, feedbacks, learning_metrics)
  - [ ] 1.5 벡터 인덱스 생성 (file_chunks.embedding, reg_chunks.embedding)
  - [ ] 1.6 B-tree 인덱스 생성 (user_id, project_id, created_at 등 12개)
  - [ ] 1.7 마이그레이션 파일 통합 (`migrations/001_init.sql`)

- [ ] 2.0 [PARALLEL GROUP: backend-config] 백엔드 기본 설정
  - [ ] 2.1 환경변수 템플릿 작성 (`.env.template`)
  - [ ] 2.2 환경변수 검증 로직 (`server/config/env-validation.ts`)
  - [ ] 2.3 DB 연결 설정 (`server/config/database.ts` - pg 사용)
  - [ ] 2.4 서버 진입점 (`server/index.ts` - Express 기본 설정)
  - [ ] 2.5 구조화된 로깅 시스템 (`server/utils/logger.ts` - Winston 사용)
  - [ ] 2.6 디버그 컨텍스트 (`server/utils/debug-context.ts`)
  - [ ] 2.7 에러 핸들러 (`server/utils/error-handler.ts`)

- [ ] 3.0 [PARALLEL GROUP: langgraph-setup] LangGraph 상태 그래프 설계
  - [ ] 3.1 상태 인터페이스 정의 (`server/workflows/state.ts`)
  - [ ] 3.2 빈 노드 함수 작성 (clarifyNode, discoverNode, researchNode 등 8개)
  - [ ] 3.3 조건부 엣지 함수 작성 (routeByProjectType, decideRetryOrContinue)
  - [ ] 3.4 LangGraph 그래프 구성 (`server/workflows/strategy-graph.ts`)
  - [ ] 3.5 빈 그래프 실행 테스트 스크립트 작성

- [ ] 4.0 [PARALLEL GROUP: agent-tools] Agent SDK 도구 정의
  - [ ] 4.1 웹 검색 도구 (web_search) 정의
  - [ ] 4.2 URL 검증 도구 (check_url) 정의
  - [ ] 4.3 벡터 검색 도구 (vector_search) 정의
  - [ ] 4.4 문서 분석 도구 (analyze_document) 정의
  - [ ] 4.5 규제 검색 도구 (search_regulations) 정의
  - [ ] 4.6 시장 데이터 도구 (get_market_data) 정의
  - [ ] 4.7 기술 평가 도구 (evaluate_tech) 정의
  - [ ] 4.8 LLM 생성 도구 (llm_generate) 정의
  - [ ] 4.9 도구 통합 파일 (`server/agents/tools.ts`)

- [ ] 5.0 [PARALLEL GROUP: templates] 템플릿 5개 작성
  - [ ] 5.1 discovery-only 템플릿 (`templates/discovery-only.md`)
  - [ ] 5.2 idea-to-planning 템플릿 (`templates/idea-to-planning.md`)
  - [ ] 5.3 regulatory-review 템플릿 (`templates/regulatory-review.md`)
  - [ ] 5.4 market-analysis 템플릿 (`templates/market-analysis.md`)
  - [ ] 5.5 tech-evaluation 템플릿 (`templates/tech-evaluation.md`)
  - [ ] 5.6 템플릿 렌더링 유틸 작성 (`server/utils/template-renderer.ts`)

- [ ] 6.0 [PARALLEL GROUP: frontend-scaffold] Next.js 프론트엔드 스캐폴드
  - [ ] 6.1 Next.js 15 App Router 초기화
  - [ ] 6.2 Tailwind CSS 설정 (`tailwind.config.ts`)
  - [ ] 6.3 shadcn/ui 설정 및 기본 컴포넌트 설치
  - [ ] 6.4 Axios API 클라이언트 설정 (`frontend/lib/api-client.ts`)
  - [ ] 6.5 루트 레이아웃 작성 (`frontend/app/layout.tsx`)
  - [ ] 6.6 홈 페이지 작성 (`frontend/app/page.tsx` - "Coming Soon" 페이지)
  - [ ] 6.7 API 타입 정의 (`frontend/types/api.ts`)
  - [ ] 6.8 Next.js 설정 (`next.config.js` - basePath, rewrites)

- [ ] 7.0 [PARALLEL GROUP: docker-setup] Docker 멀티스테이지 빌드
  - [ ] 7.1 Dockerfile 작성 (deps, builder, runner 스테이지)
  - [ ] 7.2 .dockerignore 작성 (node_modules, .git, .env 등)
  - [ ] 7.3 docker-compose.yml 작성 (db, server, frontend)
  - [ ] 7.4 docker-compose.staging.yml 작성
  - [ ] 7.5 docker-compose.prod.yml 작성
  - [ ] 7.6 Docker 빌드 테스트 (로컬)

- [ ] 8.0 TypeScript 설정
  - [ ] 8.1 tsconfig.json 작성 (프론트엔드)
  - [ ] 8.2 tsconfig.server.json 작성 (백엔드, exclude 설정)
  - [ ] 8.3 공용 타입 정의 (`server/types/index.ts`)

- [ ] 9.0 문서 작성
  - [ ] 9.1 DEBUGGING.md 작성 (디버깅 가이드)
  - [ ] 9.2 성능 목표 지표 문서 (`docs/performance-targets.md`)
  - [ ] 9.3 README.md 업데이트 (프로젝트 개요, 설치 방법)

- [ ] 10.0 초기 데이터 구축 계획 (Phase 1로 연기)
  - [ ] 10.1 규제 문서 수집 스크립트 작성 (`scripts/collect-regulations.ts`)
  - [ ] 10.2 벡터 임베딩 생성 스크립트 작성 (`scripts/embed-documents.ts`)
  - [ ] 10.3 테스트 프로젝트 시드 데이터 작성 (`scripts/seed-test-projects.ts`)

- [ ] 11.0 [PARALLEL GROUP: qa-validation] QA 검증
  - [ ] 11.1 프론트엔드 빌드 검증 (`npm run build` in frontend)
  - [ ] 11.2 백엔드 빌드 검증 (`npm run build` in server)
  - [ ] 11.3 TypeScript 타입 검사 (`tsc --noEmit`)
  - [ ] 11.4 Docker Compose 실행 테스트
  - [ ] 11.5 DB 마이그레이션 실행 테스트
  - [ ] 11.6 헬스체크 API 테스트 (`GET /api/health`)

- [ ] 12.0 Git 커밋 및 푸시
  - [ ] 12.1 변경 사항 스테이징 (`git add .`)
  - [ ] 12.2 커밋 (`git commit -m "feat: Phase 0 - 기반 구축 완료"`)
  - [ ] 12.3 원격 저장소 푸시 (`git push origin feature/phase0-foundation`)

---

## 병렬 실행 그룹

### Group 1: DB & Backend Config (병렬)
- **Task 1.0**: DB 스키마 (독립적)
- **Task 2.0**: 백엔드 설정 (독립적)

### Group 2: LangGraph & Tools (병렬)
- **Task 3.0**: LangGraph 설계 (독립적)
- **Task 4.0**: Agent 도구 정의 (독립적)
- **Task 5.0**: 템플릿 작성 (독립적)

### Group 3: Frontend & Docker (병렬)
- **Task 6.0**: 프론트엔드 스캐폴드 (독립적)
- **Task 7.0**: Docker 설정 (독립적)

### Group 4: Final QA (순차)
- **Task 11.0**: QA 검증 (모든 작업 완료 후)

---

## 완료 기준

- [x] PostgreSQL 26개 테이블 생성 완료
- [x] LangGraph 빈 그래프 실행 성공
- [x] Agent SDK 도구 8개 정의 완료
- [x] 템플릿 5개 작성 완료
- [x] Next.js 15 App Router 스캐폴드 완료
- [x] Docker Compose 로컬 실행 성공
- [x] 구조화된 로깅 시스템 구현 완료
- [x] DEBUGGING.md 작성 완료
- [x] 프론트엔드/백엔드 빌드 성공

---

**작성일**: 2026-02-07
**다음 단계**: Phase 1 구현 (D1.1, C1.1, V1.1 에이전트 구현)
