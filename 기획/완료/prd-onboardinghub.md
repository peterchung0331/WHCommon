# PRD: 온보딩 허브 (OnboardingHub)

## 1. Introduction/Overview

온보딩 허브는 고객사의 온보딩 프로세스를 자동화하고 관리하는 시스템입니다. 서류 업로드부터 최종 승인까지 6단계 워크플로우를 통해 체계적으로 고객 온보딩을 처리합니다.

**해결하려는 문제:**
- 수동 서류 관리로 인한 비효율
- 승인 프로세스 추적의 어려움
- 고객 서류의 수기 텍스트 확인 작업 부담
- 여러 팀(운영팀, AML팀, 준법감시인 등) 간 협업 어려움

---

## 2. Goals

| 목표 | 측정 지표 |
|-----|---------|
| 온보딩 프로세스 자동화 | 수동 작업 50% 감소 |
| 서류 검토 시간 단축 | OCR을 통한 데이터 추출 자동화 |
| 승인 프로세스 투명성 | 모든 단계 감사 로그 기록 |
| 고객 편의성 향상 | 고객 직접 서류 업로드 기능 |

---

## 3. User Stories

### US-1: 운영팀 담당자
> 운영팀 담당자로서, 고객 서류를 업로드하고 1차 확정하여 AML팀에 전달할 수 있다.

### US-2: 고객
> 고객으로서, 이메일로 받은 링크를 통해 로그인 없이 필요 서류를 직접 업로드할 수 있다.

### US-3: AML팀
> AML팀으로서, 고객 신원 및 서류를 검증하고 리뷰 결과를 기록할 수 있다.

### US-4: 준법감시인/비즈니스본부장
> 최종 승인자로서, 온보딩 요청을 검토하고 승인 또는 반려할 수 있다.

### US-5: 관리자
> 관리자로서, 사용자 역할을 지정하고 승인 이력을 조회할 수 있다.

---

## 4. Functional Requirements

### 4.1 프로젝트 기본 설정

| 항목 | 값 |
|-----|-----|
| 프로젝트명 | WBOnboardingHub |
| 외부 URL | http://workhub.biz/onboardinghub |
| 내부 URL | http://158.180.95.246:3030 |
| 포트 | Frontend: 3030, Backend: 4030 |
| 내부 약어 | obhub |
| 배포 환경 | 오라클 클라우드 |

### 4.2 기술 스택

**백엔드:**
- Node.js + Express
- PostgreSQL + Prisma
- JWT RS256 (HubManager SSO 연동)
- SendGrid (이메일)
- Google Cloud Vision API (OCR)
- AWS S3 (파일 저장, 무료 5GB/12개월)
- PM2 (프로세스 관리)

**운영 환경:**
| 환경 | 데이터베이스 | 배포 |
|-----|------------|------|
| 프로덕션 | 오라클 클라우드 PostgreSQL | PM2 |
| 로컬 개발 | Docker 내 PostgreSQL | - |

**프론트엔드:**
- Next.js (App Router)
- Tailwind CSS + shadcn/ui
- React Query + Zustand
- Lucide React (아이콘)
- react-dropzone (파일 업로드)

### 4.3 핵심 기능

#### FR-1: SSO 인증
1. HubManager에서 JWT RS256 토큰을 받아 인증
2. `/auth/sso?token=...` 엔드포인트에서 토큰 검증
3. 사용자 세션 생성 및 대시보드로 이동

#### FR-2: SalesHub 고객 연동
1. SalesHub API를 통해 고객 목록 조회
2. 고객 선택 시 온보딩 프로세스 시작
3. 고객 정보 동기화

#### FR-3: 서류 업로드
1. **운영팀 직접 업로드**: 운영팀이 고객 서류를 직접 업로드
2. **고객 직접 업로드**: 기간제 링크(1~30일)를 통해 고객이 직접 업로드
3. 업로드된 파일은 AWS S3에 저장
4. 업로드 후 상태는 `draft`

#### FR-4: 6단계 서류 검토 워크플로우

```
1. 서류 업로드 (임시)     [draft]           → 운영팀 또는 고객
       ↓
2. 1차 확정              [ops_confirmed]    → 운영팀
       ↓
3. AML 리뷰              [aml_reviewing]    → AML팀
       ↓
4. AML 리뷰 완료         [aml_completed]    → AML팀
       ↓
5. 2차 확정              [final_confirmed]  → 운영팀
       ↓
6. 최종 승인 (듀얼)      [approved]         → 준법감시인 + 비즈니스본부장
```

#### FR-5: 듀얼 승인 (최종 단계)
1. 2차 확정 후 준법감시인과 비즈니스본부장에게 동시 승인 요청
2. **둘 다 승인** 시 → 온보딩 완료
3. **하나라도 반려** 시 → 반려 처리 (사유 필수)

#### FR-6: 문서 OCR
1. 업로드된 문서에서 Google Cloud Vision API로 텍스트 추출
2. 수기(손글씨) 텍스트 인식 지원
3. 추출된 텍스트를 담당자가 검토 및 수정
4. 확정된 데이터를 온보딩 정보에 반영

#### FR-7: 기간제 업로드 링크
1. 운영팀이 고객별 업로드 링크 생성 (유효기간 1~30일)
2. SendGrid로 고객에게 이메일 발송
3. 고객이 로그인 없이 서류 업로드
4. 업로드 완료 시 운영팀에게 알림

#### FR-8: 알림 시스템 (SendGrid)
| 이벤트 | 수신자 |
|-------|-------|
| 1차 확정 완료 | AML팀 |
| AML 리뷰 완료 | 운영팀 |
| 2차 확정 완료 | 준법감시인, 비즈니스본부장 |
| 최종 승인 완료 | 운영팀, 고객 |
| 반려 발생 | 해당 단계 담당자 |
| 승인 독촉 (24시간) | 미처리 승인자 |

#### FR-9: 감사 로그
1. 모든 상태 변경 기록 (who, when, what)
2. 승인/반려 사유 기록
3. 이력 조회 기능

### 4.4 사용자 역할

| 역할 | 코드 | 권한 |
|-----|------|------|
| 운영팀 | `ops_team` | 업로드, 1차 확정, 2차 확정 |
| AML팀 | `aml_team` | AML 리뷰, AML 완료 |
| 준법감시인 | `compliance_officer` | 최종 승인 |
| 비즈니스본부장 | `business_head` | 최종 승인 |
| 관리자 | `admin` | 모든 권한, 역할 지정 |
| 고객 | `customer` | 기간제 링크로 서류 업로드만 |

### 4.5 API 엔드포인트

**인증**
- `GET /auth/sso` - SSO 토큰 검증
- `GET /auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

**온보딩 프로세스**
- `GET /api/obhub/processes` - 프로세스 목록
- `POST /api/obhub/processes` - 프로세스 생성
- `GET /api/obhub/processes/:id` - 프로세스 상세
- `PUT /api/obhub/processes/:id` - 프로세스 수정
- `DELETE /api/obhub/processes/:id` - 프로세스 삭제

**고객 온보딩**
- `GET /api/obhub/customers` - 고객 목록 (SalesHub 연동)
- `GET /api/obhub/customers/:id/progress` - 진행 상황
- `PUT /api/obhub/customers/:id/step` - 단계 업데이트

**서류 관리**
- `POST /api/obhub/documents` - 서류 업로드
- `GET /api/obhub/documents/:id` - 서류 상세
- `PUT /api/obhub/documents/:id/confirm` - 1차 확정
- `PUT /api/obhub/documents/:id/aml-start` - AML 리뷰 시작
- `PUT /api/obhub/documents/:id/aml-complete` - AML 리뷰 완료
- `PUT /api/obhub/documents/:id/final-confirm` - 2차 확정
- `PUT /api/obhub/documents/:id/reject` - 반려

**OCR**
- `POST /api/obhub/documents/:id/ocr` - OCR 처리 요청
- `GET /api/obhub/documents/:id/ocr-result` - OCR 결과 조회
- `PUT /api/obhub/documents/:id/ocr-result` - OCR 결과 수정

**최종 승인**
- `POST /api/obhub/approvals` - 승인 요청 생성
- `GET /api/obhub/approvals` - 승인 대기 목록
- `GET /api/obhub/approvals/:id` - 승인 상세
- `PUT /api/obhub/approvals/:id/approve` - 승인
- `PUT /api/obhub/approvals/:id/reject` - 반려
- `GET /api/obhub/approvals/history` - 승인 이력

**업로드 링크**
- `POST /api/obhub/upload-links` - 링크 생성
- `GET /api/obhub/upload-links/:token` - 링크 검증
- `POST /api/obhub/upload-links/:token/documents` - 고객 업로드 (비인증)
- `GET /api/obhub/upload-links` - 링크 목록
- `DELETE /api/obhub/upload-links/:id` - 링크 삭제

---

## 5. Non-Goals (Out of Scope)

1. 실시간 채팅/메시징 기능
2. 모바일 앱 개발 (웹 반응형으로 대응)
3. 다국어 지원 (한국어만 지원)
4. 결제/과금 기능
5. 고객 포털 (고객은 업로드 링크로만 접근)

---

## 6. Design Considerations

### 6.1 UI/UX 원칙
- Lucide React 아이콘 사용 (이모지 사용 금지)
- shadcn/ui 컴포넌트 활용
- 보라색 테마 (#9333ea)

### 6.2 주요 화면
1. **대시보드**: 온보딩 현황 요약, 승인 대기 목록
2. **고객 목록**: SalesHub 연동 고객 목록
3. **온보딩 상세**: 6단계 진행 상황, 서류 목록, 승인 이력
4. **서류 뷰어**: 업로드 서류 확인, OCR 결과 검토
5. **승인 화면**: 승인/반려 처리, 사유 입력
6. **고객 업로드 페이지**: 기간제 링크 접속 시 표시 (비인증)

---

## 7. Technical Considerations

### 7.1 데이터베이스 스키마

```sql
-- 주요 테이블
- onboarding_processes      -- 온보딩 프로세스 정의
- onboarding_steps          -- 온보딩 단계
- customer_onboardings      -- 고객별 온보딩 (SalesHub 연동)
- onboarding_documents      -- 서류 파일
- document_review_status    -- 6단계 검토 상태
- document_ocr_results      -- OCR 결과
- upload_links              -- 기간제 업로드 링크
- final_approval_requests   -- 듀얼 승인 요청
- user_roles                -- 사용자 역할
- review_audit_log          -- 감사 로그
```

### 7.2 외부 서비스 연동
- **HubManager**: SSO 인증 (JWT RS256)
- **SalesHub**: 고객 데이터 API
- **Google Cloud Vision**: OCR ($1.50/1000건)
- **AWS S3**: 파일 저장 (무료 5GB/12개월)
- **SendGrid**: 이메일 알림

### 7.3 보안 고려사항
- 업로드 링크: JWT 토큰 + 만료 시간
- 파일 업로드: 파일 타입/크기 검증
- API: 역할 기반 접근 제어 (RBAC)

---

## 8. Success Metrics

| 지표 | 목표 |
|-----|-----|
| 온보딩 완료 시간 | 기존 대비 30% 단축 |
| 서류 처리 오류율 | 5% 이하 |
| 승인 대기 시간 | 평균 24시간 이내 |
| 시스템 가용성 | 99.5% 이상 |

---

## 9. Implementation Phases

### Phase 1: 기본 구조
1. 프로젝트 셋업 (백엔드 + 프론트엔드)
2. 데이터베이스 스키마 생성 (Prisma)
3. SSO 인증 연동 (`/auth/sso`)
4. 기본 대시보드 UI

### Phase 2: 핵심 기능
5. 온보딩 프로세스 CRUD
6. SalesHub 고객 연동
7. 서류 업로드 (운영팀)
8. 6단계 검토 워크플로우

### Phase 3: 고급 기능
9. 듀얼 승인 프로세스
10. SendGrid 이메일 알림
11. 감사 로그

### Phase 4: 추가 기능
12. 고객 직접 서류 제출 (기간제 링크)
13. 문서 OCR (Google Cloud Vision)
14. OCR 결과 검토 UI

---

## 10. Open Questions

1. ~~OCR 서비스 선정~~ → Google Cloud Vision API로 결정
2. ~~파일 저장소~~ → AWS S3로 결정
3. ~~배포 환경~~ → 오라클 클라우드로 결정
4. SalesHub API 스펙 확인 필요 (고객 목록 조회 엔드포인트)

---

## 11. HubManager 수정 사항

온보딩 허브 출시 시 HubManager에서 변경할 항목:

1. `frontend/lib/constants/hubConfig.ts`
   - `isUnderDevelopment: false`
   - `actionLabel: '시작하기'`

2. `server/database/init.ts`
   - 온보딩 허브 URL: `http://158.180.95.246:3030`

---

*작성일: 2026-01-03*
