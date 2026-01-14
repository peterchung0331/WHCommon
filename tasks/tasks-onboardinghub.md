# WBOnboardingHub 구현 태스크

## Relevant Files

### 백엔드 (server/)
- `server/index.ts` - Express 서버 진입점
- `server/routes/auth.ts` - SSO 인증 라우트
- `server/routes/obhub.ts` - 온보딩 허브 메인 API 라우트
- `server/routes/documents.ts` - 서류 업로드/관리 라우트
- `server/routes/approvals.ts` - 승인 프로세스 라우트
- `server/routes/uploadLinks.ts` - 기간제 링크 라우트
- `server/services/ssoService.ts` - SSO 인증 서비스
- `server/services/s3Service.ts` - AWS S3 파일 업로드 서비스
- `server/services/ocrService.ts` - Google Cloud Vision OCR 서비스
- `server/services/emailService.ts` - SendGrid 이메일 서비스
- `server/services/salesHubService.ts` - SalesHub 고객 연동 서비스
- `server/middleware/auth.ts` - 인증 미들웨어
- `server/middleware/roleCheck.ts` - 역할 기반 접근 제어 미들웨어
- `prisma/schema.prisma` - 데이터베이스 스키마

### 프론트엔드 (frontend/)
- `frontend/app/layout.tsx` - 루트 레이아웃
- `frontend/app/page.tsx` - 메인 페이지 (대시보드로 리다이렉트)
- `frontend/app/auth/sso/page.tsx` - SSO 콜백 페이지
- `frontend/app/dashboard/page.tsx` - 대시보드 페이지
- `frontend/app/customers/page.tsx` - 고객 목록 페이지
- `frontend/app/customers/[id]/page.tsx` - 고객 상세 페이지
- `frontend/app/approvals/page.tsx` - 승인 대기 목록 페이지
- `frontend/app/upload/[token]/page.tsx` - 고객 직접 업로드 페이지 (비인증)
- `frontend/components/DocumentUploader.tsx` - 서류 업로드 컴포넌트
- `frontend/components/DocumentViewer.tsx` - 서류 뷰어 컴포넌트
- `frontend/components/WorkflowStatus.tsx` - 6단계 워크플로우 상태 컴포넌트
- `frontend/components/ApprovalCard.tsx` - 승인 카드 컴포넌트
- `frontend/lib/api.ts` - API 클라이언트
- `frontend/stores/authStore.ts` - 인증 상태 관리 (Zustand)

### 설정 파일
- `docker-compose.yml` - 로컬 개발용 Docker 설정
- `ecosystem.config.js` - PM2 프로덕션 설정
- `.env.template` - 환경변수 템플릿
- `deploy-oracle.sh` - 오라클 클라우드 배포 스크립트

### Notes

- 포트: Frontend 3030, Backend 4030
- 로컬 DB: Docker PostgreSQL (`postgresql://postgres:postgres@localhost:5432/obhub`)
- 프로덕션 DB: 오라클 클라우드 PostgreSQL
- 내부 약어: `obhub`

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

### Phase 1: 프로젝트 기본 구조 설정

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (`git checkout -b feature/onboardinghub-init`)

- [x] 1.0 프로젝트 폴더 구조 생성
  - [x] 1.1 WBOnboardingHub 루트 폴더 정리 (기존 파일 확인)
  - [x] 1.2 `server/` 폴더 구조 생성 (routes, services, middleware, utils)
  - [x] 1.3 `frontend/` 폴더 구조 생성 (app, components, lib, stores)
  - [x] 1.4 `prisma/` 폴더 생성

- [x] 2.0 백엔드 Express 서버 셋업
  - [x] 2.1 `server/package.json` 생성 및 의존성 설치
  - [x] 2.2 `server/tsconfig.json` 설정
  - [x] 2.3 `server/index.ts` Express 서버 기본 코드 작성
  - [x] 2.4 CORS, body-parser, 에러 핸들링 미들웨어 설정
  - [x] 2.5 헬스체크 엔드포인트 (`GET /health`) 추가

- [x] 3.0 프론트엔드 Next.js 셋업
  - [x] 3.1 `frontend/package.json` 생성 및 의존성 설치 (Next.js, Tailwind, shadcn/ui)
  - [x] 3.2 `frontend/tsconfig.json` 설정
  - [x] 3.3 Tailwind CSS 설정 (`tailwind.config.ts`, `globals.css`)
  - [x] 3.4 shadcn/ui 초기화 및 기본 컴포넌트 설치
  - [x] 3.5 `frontend/app/layout.tsx` 루트 레이아웃 작성
  - [x] 3.6 기본 페이지 (`frontend/app/page.tsx`) 작성

- [x] 4.0 Prisma 데이터베이스 스키마 작성
  - [x] 4.1 `prisma/schema.prisma` 파일 생성
  - [x] 4.2 users 테이블 스키마 작성
  - [x] 4.3 user_roles 테이블 스키마 작성
  - [x] 4.4 onboarding_processes, onboarding_steps 테이블 작성
  - [x] 4.5 customer_onboardings, onboarding_progress 테이블 작성
  - [x] 4.6 onboarding_documents, document_ocr_results 테이블 작성
  - [x] 4.7 document_review_status 테이블 작성 (6단계 워크플로우)
  - [x] 4.8 upload_links, upload_link_usage 테이블 작성
  - [x] 4.9 final_approval_requests 테이블 작성 (듀얼 승인)
  - [x] 4.10 notification_templates, notification_history 테이블 작성
  - [x] 4.11 review_audit_log 테이블 작성 (감사 로그)
  - [x] 4.12 checklist_items, checklist_completions 테이블 작성

- [x] 5.0 Docker 및 환경 설정
  - [x] 5.1 `docker-compose.yml` 작성 (PostgreSQL 컨테이너)
  - [x] 5.2 `.env.template` 환경변수 템플릿 작성
  - [ ] 5.3 `.env.local` 로컬 개발용 환경변수 설정
  - [ ] 5.4 Docker 컨테이너 실행 및 DB 연결 테스트
  - [ ] 5.5 Prisma 마이그레이션 실행 (`npx prisma migrate dev`)

- [x] 6.0 PM2 및 배포 설정
  - [x] 6.1 `ecosystem.config.js` PM2 설정 파일 작성
  - [x] 6.2 `deploy-oracle.sh` 배포 스크립트 작성
  - [x] 6.3 `.gitignore` 파일 작성

---

### Phase 2: SSO 인증 연동

- [x] 7.0 SSO 인증 백엔드 구현
  - [x] 7.1 HubManager 공개키 설정 (환경변수)
  - [x] 7.2 `server/services/ssoService.ts` JWT RS256 검증 로직 구현
  - [x] 7.3 `server/routes/auth.ts` SSO 라우트 생성
  - [x] 7.4 `GET /auth/sso` 엔드포인트 구현 (토큰 검증 → 세션 생성)
  - [x] 7.5 `GET /auth/logout` 엔드포인트 구현
  - [x] 7.6 `GET /api/auth/me` 현재 사용자 정보 API 구현
  - [x] 7.7 세션/쿠키 기반 인증 미들웨어 구현

- [x] 8.0 SSO 인증 프론트엔드 구현
  - [x] 8.1 `frontend/app/auth/sso/page.tsx` SSO 콜백 페이지 구현
  - [ ] 8.2 `frontend/stores/authStore.ts` Zustand 인증 상태 관리
  - [x] 8.3 `frontend/lib/api.ts` API 클라이언트 (인증 헤더 포함)
  - [ ] 8.4 인증되지 않은 사용자 리다이렉트 로직
  - [x] 8.5 로그아웃 기능 구현

---

### Phase 3: 핵심 API 구현

- [x] 9.0 SalesHub 고객 연동
  - [x] 9.1 `server/services/salesHubService.ts` SalesHub API 클라이언트 구현
  - [x] 9.2 고객 목록 조회 API (`GET /api/obhub/customers`)
  - [x] 9.3 고객 상세 조회 API (`GET /api/obhub/customers/:id`)
  - [x] 9.4 고객 진행 상황 API (`GET /api/obhub/customers/:id/progress`)

- [x] 10.0 온보딩 프로세스 CRUD
  - [x] 10.1 프로세스 목록 API (`GET /api/obhub/processes`)
  - [x] 10.2 프로세스 생성 API (`POST /api/obhub/processes`)
  - [x] 10.3 프로세스 상세 API (`GET /api/obhub/processes/:id`)
  - [x] 10.4 프로세스 수정 API (`PUT /api/obhub/processes/:id`)
  - [x] 10.5 프로세스 삭제 API (`DELETE /api/obhub/processes/:id`)

- [x] 11.0 서류 업로드 API (AWS S3)
  - [x] 11.1 AWS S3 클라이언트 설정 (`server/services/s3Service.ts`)
  - [x] 11.2 Multer 파일 업로드 미들웨어 설정
  - [x] 11.3 서류 업로드 API (`POST /api/obhub/customers/:id/documents`)
  - [x] 11.4 서류 다운로드 URL API (`GET /api/obhub/documents/:id/download`)
  - [x] 11.5 서류 목록 조회 API (`GET /api/obhub/customers/:id/documents`)
  - [x] 11.6 서류 삭제 API (`DELETE /api/obhub/documents/:id`)

- [x] 12.0 6단계 워크플로우 상태 변경 API
  - [x] 12.1 역할 기반 접근 제어 미들웨어 (`server/middleware/auth.ts`)
  - [x] 12.2 1차 확정 API (`PUT /api/obhub/customers/:id/confirm`) - 운영팀
  - [x] 12.3 AML 리뷰 시작 API (`PUT /api/obhub/customers/:id/aml-start`) - AML팀
  - [x] 12.4 AML 리뷰 완료 API (`PUT /api/obhub/customers/:id/aml-complete`) - AML팀
  - [x] 12.5 2차 확정 API (`PUT /api/obhub/customers/:id/final-confirm`) - 운영팀
  - [x] 12.6 반려 API (`PUT /api/obhub/customers/:id/reject`) - 사유 필수
  - [x] 12.7 상태 변경 시 감사 로그 자동 기록

- [x] 13.0 듀얼 승인 프로세스 API
  - [x] 13.1 최종 승인 요청 API (`PUT /api/obhub/customers/:id/request-approval`)
  - [x] 13.2 승인 대기 목록 API (`GET /api/obhub/approvals/pending`)
  - [x] 13.3 승인 상세 API (`GET /api/obhub/approvals/:id`)
  - [x] 13.4 승인 처리 API (`PUT /api/obhub/approvals/:id/approve`)
  - [x] 13.5 반려 처리 API (`PUT /api/obhub/approvals/:id/reject`)
  - [x] 13.6 승인 이력 조회 API (`GET /api/obhub/audit-logs`)
  - [x] 13.7 듀얼 승인 로직 (준법감시인 + 비즈니스본부장 둘 다 승인 시 완료)

---

### Phase 4: 고급 기능 구현

- [x] 14.0 기간제 업로드 링크 API
  - [x] 14.1 링크 생성 API (`POST /api/obhub/upload-links`)
  - [x] 14.2 링크 검증 API (`GET /api/obhub/upload-links/:token`) - 비인증
  - [x] 14.3 고객 문서 업로드 API (`POST /api/obhub/upload-links/:token/documents`) - 비인증
  - [x] 14.4 링크 목록 조회 API (`GET /api/obhub/upload-links`)
  - [x] 14.5 링크 삭제 API (`DELETE /api/obhub/upload-links/:id`)
  - [x] 14.6 링크 사용 이력 기록

- [x] 15.0 Google Cloud Vision OCR 연동
  - [x] 15.1 Google Cloud Vision 클라이언트 설정
  - [x] 15.2 `server/services/ocrService.ts` OCR 서비스 구현
  - [x] 15.3 OCR 처리 요청 API (`POST /api/obhub/documents/:id/ocr`)
  - [x] 15.4 OCR 결과 조회 API (`GET /api/obhub/documents/:id/ocr`)
  - [ ] 15.5 OCR 결과 수정 API (`PUT /api/obhub/documents/:id/ocr`)
  - [ ] 15.6 비동기 OCR 처리 (백그라운드 작업)

- [x] 16.0 SendGrid 이메일 알림 시스템
  - [x] 16.1 SendGrid 클라이언트 설정 (`server/services/emailService.ts`)
  - [ ] 16.2 이메일 템플릿 정의 (1차 확정, AML 완료, 최종 승인 등)
  - [ ] 16.3 서류 제출 요청 이메일 발송 (기간제 링크)
  - [ ] 16.4 승인 완료/반려 알림 발송
  - [ ] 16.5 승인 독촉 알림 (24시간 미처리 시)
  - [ ] 16.6 알림 발송 이력 기록

- [x] 17.0 감사 로그 시스템
  - [x] 17.1 감사 로그 기록 유틸리티 함수 작성 (`server/services/auditLogService.ts`)
  - [x] 17.2 모든 상태 변경 시 자동 로그 기록
  - [x] 17.3 감사 로그 조회 API (`GET /api/obhub/audit-logs`)
  - [x] 17.4 필터링 (날짜, 액션, 사용자별)

---

### Phase 5: 프론트엔드 구현

- [x] 18.0 대시보드 페이지
  - [x] 18.1 `frontend/app/dashboard/page.tsx` 레이아웃 구성
  - [x] 18.2 온보딩 현황 요약 카드 (진행 중, 완료, 대기 중)
  - [x] 18.3 승인 대기 목록 표시
  - [x] 18.4 최근 활동 타임라인

- [x] 19.0 고객 목록/상세 페이지
  - [x] 19.1 `frontend/app/customers/page.tsx` 고객 목록 테이블
  - [x] 19.2 검색/필터 기능
  - [x] 19.3 `frontend/app/customers/[id]/page.tsx` 고객 상세 페이지
  - [ ] 19.4 6단계 워크플로우 진행 상황 표시 (`WorkflowStatus` 컴포넌트)
  - [x] 19.5 서류 목록 및 상태 표시

- [x] 20.0 서류 업로드/뷰어 컴포넌트
  - [x] 20.1 드래그 앤 드롭 업로드 (react-dropzone)
  - [x] 20.2 업로드 진행률 표시
  - [x] 20.3 서류 다운로드 기능
  - [ ] 20.4 OCR 결과 표시 및 수정 UI

- [ ] 21.0 승인 워크플로우 UI
  - [ ] 21.1 `frontend/app/approvals/page.tsx` 승인 대기 목록
  - [ ] 21.2 `ApprovalCard.tsx` 승인 카드 컴포넌트
  - [ ] 21.3 승인/반려 버튼 및 사유 입력 모달
  - [ ] 21.4 듀얼 승인 상태 표시 (준법감시인/비즈니스본부장)

- [x] 22.0 고객 직접 업로드 페이지 (비인증)
  - [x] 22.1 `frontend/app/upload/[token]/page.tsx` 토큰 기반 접근
  - [x] 22.2 링크 유효성 검증 및 만료 표시
  - [x] 22.3 필요 서류 목록 표시
  - [x] 22.4 업로드 완료 확인 페이지

---

### Phase 6: QA 테스트 및 배포

- [ ] 23.0 QA 테스트
  - [ ] 23.1 프론트엔드 빌드 검증 (`npm run build`)
  - [ ] 23.2 백엔드 빌드 검증 (`npm run build`)
  - [ ] 23.3 TypeScript 타입 에러 검사 및 수정
  - [ ] 23.4 SSO 로그인 플로우 테스트
  - [ ] 23.5 서류 업로드 및 S3 저장 테스트
  - [ ] 23.6 6단계 워크플로우 전체 플로우 테스트
  - [ ] 23.7 듀얼 승인 프로세스 테스트
  - [ ] 23.8 기간제 링크 업로드 테스트
  - [ ] 23.9 이메일 알림 발송 테스트

- [ ] 24.0 배포
  - [ ] 24.1 오라클 클라우드 서버 접속 확인
  - [ ] 24.2 프로덕션 환경변수 설정 (Doppler → .env.prd)
  - [ ] 24.3 배포 스크립트 실행 (`./deploy-oracle.sh`)
  - [ ] 24.4 PM2 프로세스 상태 확인
  - [ ] 24.5 프로덕션 환경 기능 테스트
  - [ ] 24.6 HubManager 설정 변경 (isUnderDevelopment: false)

---

## 프론트엔드 실행 전 보장 체크리스트

- [ ] 프론트엔드 빌드 성공 확인 (`npm run build`)
- [ ] 백엔드 빌드 성공 확인 (`npm run build`)
- [ ] Docker PostgreSQL 컨테이너 실행 확인
- [ ] 백엔드 서버 정상 구동 확인 (포트 4030)
- [ ] 프론트엔드 서버 정상 구동 확인 (포트 3030)
- [ ] SSO 인증 플로우 정상 동작 확인
- [ ] 주요 페이지 로딩 에러 없음 확인
