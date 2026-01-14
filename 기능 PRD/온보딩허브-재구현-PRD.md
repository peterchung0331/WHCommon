# 온보딩 허브 재구현 PRD

## 개요
- **목적**: 온보딩 허브의 백엔드를 새로 구현 (프론트엔드 신규 개발)
- **현재 상태**: Coming Soon (isUnderDevelopment: true)
- **현재 URL**: `https://wbonboardinghub.up.railway.app` (미구현)

---

## 네이밍 규칙

| 구분 | 명칭 | 용도 |
|-----|------|------|
| **외부 노출** | `onboardinghub` | URL, 사용자 UI, 문서 등 |
| **내부 코드** | `obhub` | 변수명, 함수명, 파일명 등 |

- 외부 URL: `http://workhub.biz/onboardinghub`
- 프로젝트 폴더: `WBOnboardingHub` (Git 저장소)
- 내부 약어: `obhub` (예: `obhubApi`, `obhubService`, `OBHUB_PORT`)

---

## 결정된 사항

| 항목 | 결정 |
|-----|------|
| **배포 환경** | 오라클 클라우드 (다른 Hub들과 동일) |
| **프론트엔드** | 신규 개발 (Next.js) |
| **고객 데이터** | SalesHub 연동 |
| **이메일 서비스** | SendGrid |
| **OCR 서비스** | Google Cloud Vision API |
| **파일 저장소** | AWS S3 (무료 5GB/12개월) |

---

## 현재 온보딩 허브 기능 분석

### 1. 프론트엔드 (HubManager 내)

#### 1.1 Hub 선택 카드 (`frontend/components/hubs/HubCard.tsx`)
- **디스플레이 스타일**: `process` (프로세스 단계 표시형)
- **색상 테마**: 보라색 (#9333ea)
- **하이라이트 메시지 5개**:
  1. 맞춤형 온보딩 프로세스 자동화
  2. 고객별 진행 상황 추적
  3. 자동 이메일 및 알림 발송
  4. 체크리스트 및 템플릿 제공
  5. 인터랙티브 튜토리얼

#### 1.2 Hub 설정 (`frontend/lib/constants/hubConfig.ts`)
```typescript
onboarding: {
  slug: 'onboarding',
  displayStyle: 'process',
  primaryColor: '#9333ea',
  accentColor: '#a855f7',
  lightColor: '#faf5ff',
  subtitle: 'Customer Onboarding Hub',
  highlightMessages: [...],
  isUnderDevelopment: true,
  actionLabel: '출시 알림 받기',
}
```

### 2. 백엔드 (HubManager 내 - SSO 인증 부분)

#### 2.1 데이터베이스 스키마 (`server/database/init.ts`)
```sql
-- hubs 테이블에 온보딩 허브 등록
INSERT INTO hubs (slug, name, description, url, order_index) VALUES
  ('onboarding', 'Onboarding Hub', 'Customer Onboarding Hub',
   'https://wbonboardinghub.up.railway.app', 3);
```

#### 2.2 SSO 인증 흐름 (구현됨)
1. `POST /api/auth/generate-hub-token` - Hub SSO 토큰 생성
2. JWT RS256 토큰으로 사용자 정보 전달
3. Hub의 `/auth/sso?token=...` 엔드포인트로 리다이렉션

#### 2.3 온보딩 관련 문서 (`documents` 테이블)
- `onboarding/getting-started` - 온보딩 프로세스 개요
- `onboarding/features` - 고객 정보 관리
- `onboarding/faq` - 온보딩 단계 FAQ

---

## 온보딩 허브 핵심 기능 PRD

### 기능 1: 온보딩 프로세스 관리

#### 1.1 온보딩 단계 정의 (5단계)
| 단계 | 이름 | 설명 |
|-----|------|------|
| 1 | 등록 (Registration) | 고객사 기본 정보 입력 |
| 2 | 서류 제출 (Documentation) | 필요 서류 업로드 |
| 3 | 검토 (Review) | 서류 검토 및 승인 |
| 4 | 설정 (Setup) | 계정 생성 및 권한 설정 |
| 5 | 완료 (Completed) | 온보딩 완료 및 서비스 이용 시작 |

#### 1.2 필요 API
- `GET /api/onboarding/processes` - 온보딩 프로세스 목록
- `POST /api/onboarding/processes` - 새 온보딩 프로세스 생성
- `GET /api/onboarding/processes/:id` - 특정 프로세스 상세
- `PUT /api/onboarding/processes/:id` - 프로세스 업데이트
- `DELETE /api/onboarding/processes/:id` - 프로세스 삭제

### 기능 2: 고객별 진행 상황 추적

#### 2.1 고객 온보딩 상태
- 현재 단계 표시
- 각 단계별 완료 여부
- 진행률 (%)
- 예상 완료일

#### 2.2 필요 API
- `GET /api/onboarding/customers` - 고객 목록 및 상태
- `GET /api/onboarding/customers/:id/progress` - 특정 고객 진행 상황
- `PUT /api/onboarding/customers/:id/step` - 단계 업데이트

### 기능 3: 자동 이메일 및 알림 발송 (SendGrid)

#### 3.1 알림 유형
- 단계 완료 알림
- 다음 단계 안내
- 서류 제출 요청
- 승인/반려 알림
- 리마인더 (기한 임박)

#### 3.2 필요 API
- `GET /api/onboarding/notifications` - 알림 템플릿 목록
- `POST /api/onboarding/notifications/send` - 알림 발송
- `GET /api/onboarding/notifications/history` - 발송 이력

### 기능 4: 체크리스트 및 템플릿

#### 4.1 체크리스트 기능
- 단계별 필수 체크리스트 항목
- 체크 상태 저장
- 전체 완료 시 다음 단계 진행 가능

#### 4.2 템플릿 기능
- 온보딩 프로세스 템플릿
- 문서 템플릿
- 이메일 템플릿

#### 4.3 필요 API
- `GET /api/onboarding/templates` - 템플릿 목록
- `GET /api/onboarding/templates/:id` - 템플릿 상세
- `POST /api/onboarding/templates` - 템플릿 생성
- `GET /api/onboarding/checklists/:processId` - 체크리스트 조회
- `PUT /api/onboarding/checklists/:processId/items/:itemId` - 체크리스트 항목 업데이트

### 기능 5: 인터랙티브 튜토리얼

#### 5.1 튜토리얼 유형
- 단계별 가이드 (Step-by-step)
- 비디오 튜토리얼
- FAQ 섹션
- 도움말 팝오버

#### 5.2 필요 API
- `GET /api/onboarding/tutorials` - 튜토리얼 목록
- `GET /api/onboarding/tutorials/:id` - 튜토리얼 상세
- `POST /api/onboarding/tutorials/:id/progress` - 튜토리얼 진행 상황 저장

### 기능 6: 고객 문서 OCR (수기 텍스트 인식)

#### 6.1 기능 설명
- 고객이 업로드한 문서에서 수기(손글씨) 텍스트 자동 추출
- 회사 관련 문서(계약서, 신청서 등)의 필기 내용 인식
- 추출된 텍스트를 온보딩 데이터로 자동 입력

#### 6.2 OCR 도구 비교 및 추천

| 도구 | 한글 수기 인식 | 장점 | 단점 | 비용 |
|-----|--------------|------|------|------|
| **Google Cloud Vision** | ⭐⭐⭐⭐ | 200+ 언어, 50개 수기 언어 지원, 안정적 | 종량제 비용 | $1.50/1000건 |
| **Amazon Textract** | ⭐⭐⭐ | AWS 생태계 연동, 표/양식 인식 우수 | 한글 수기 정확도 낮음 | $1.50/1000페이지 |
| **GPT-4 Vision** | ⭐⭐⭐⭐⭐ | 최고 정확도, 맥락 이해 | API 비용 높음 | ~$0.01/이미지 |
| **Gemini 2.5 Pro** | ⭐⭐⭐⭐⭐ | GPT-4급 정확도, Google 생태계 | 비교적 신규 | 유사 |
| **PaddleOCR** | ⭐⭐⭐ | 무료 오픈소스, 109개 언어 | 셀프 호스팅 필요 | 무료 |
| **OlmOCR-2** | ⭐⭐⭐⭐ | 오픈소스 최고 성능, 82.4점 | 7B 모델 GPU 필요 | 무료 |

**추천: Google Cloud Vision API**
- 이유: 한글 수기 인식 지원, 안정적인 서비스, 합리적 비용, 쉬운 통합
- 대안: 높은 정확도가 필요하면 GPT-4 Vision 또는 Gemini 2.5 Pro 고려

#### 6.3 필요 API
- `POST /api/obhub/documents/:id/ocr` - 문서 OCR 처리 요청
- `GET /api/obhub/documents/:id/ocr-result` - OCR 결과 조회
- `PUT /api/obhub/documents/:id/ocr-result` - OCR 결과 수정 (사용자 검토 후)

#### 6.4 OCR 워크플로우
```
1. 고객이 문서 업로드
   ↓
2. 백그라운드에서 OCR 처리 (Google Cloud Vision)
   ↓
3. 추출된 텍스트 저장
   ↓
4. 담당자가 결과 검토 및 수정
   ↓
5. 확정된 데이터를 온보딩 정보에 반영
```

### 기능 7: 서류 검토 및 승인 프로세스

#### 7.1 기능 설명
- 서류 검토는 6단계 승인 프로세스를 거침
- 각 단계별 담당자/팀이 다름
- 승인/반려 시 사유 기록
- 승인 이력 추적 및 감사 로그

#### 7.2 서류 검토 워크플로우 (6단계)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 서류 업로드 (임시)                                           │
│     - 운영팀이 직접 업로드 OR 고객이 기간제 링크로 직접 업로드     │
│     - 상태: draft                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. 운영팀 확정 (1차 확정)                                       │
│     - 운영팀이 서류 검토 후 확정                                 │
│     - 상태: ops_confirmed                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. AML팀 리뷰                                                  │
│     - AML(자금세탁방지)팀이 고객 신원/서류 검증                   │
│     - 상태: aml_reviewing                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. AML 리뷰 완료                                               │
│     - AML팀 검토 완료                                           │
│     - 상태: aml_completed                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. 2차 확정                                                    │
│     - 운영팀이 AML 결과 확인 후 최종 서류 확정                    │
│     - 상태: final_confirmed                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. 최종 온보딩 승인                                            │
│     - 준법감시인 + 비즈니스본부장 동시 승인 필요                  │
│     - 상태: approved (둘 다 승인 시)                            │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.3 단계별 상세

| 단계 | 상태 코드 | 담당자 | 액션 | 반려 시 |
|-----|----------|-------|------|--------|
| 1. 업로드 (임시) | `draft` | 운영팀 또는 고객 | 서류 업로드 | - |
| 2. 1차 확정 | `ops_confirmed` | 운영팀 | 서류 검토 후 확정 | 재업로드 요청 |
| 3. AML 리뷰 | `aml_reviewing` | AML팀 | 리뷰 시작 | - |
| 4. AML 완료 | `aml_completed` | AML팀 | 리뷰 완료 | 1단계로 반려 |
| 5. 2차 확정 | `final_confirmed` | 운영팀 | 최종 확정 | AML 재검토 요청 |
| 6. 최종 승인 | `approved` | 준법감시인 + 비즈니스본부장 | 동시 승인 | 사유와 함께 반려 |

#### 7.4 최종 승인 (듀얼 승인)

최종 온보딩 승인은 **두 명의 승인자가 모두 승인**해야 완료됩니다.

```
                    ┌─────────────────┐
                    │   2차 확정 완료  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ↓                              ↓
    ┌─────────────────┐            ┌─────────────────┐
    │   준법감시인     │            │ 비즈니스본부장  │
    │   승인 대기      │            │   승인 대기     │
    └────────┬────────┘            └────────┬────────┘
              │                              │
              ↓                              ↓
    ┌─────────────────┐            ┌─────────────────┐
    │  승인 / 반려    │            │  승인 / 반려    │
    └────────┬────────┘            └────────┬────────┘
              │                              │
              └──────────────┬───────────────┘
                             ↓
                    ┌─────────────────┐
                    │  둘 다 승인 시   │
                    │  → 온보딩 완료  │
                    │                 │
                    │  하나라도 반려 시│
                    │  → 반려 처리    │
                    └─────────────────┘
```

#### 7.5 서류 업로드 방식

| 방식 | 설명 | 업로더 |
|-----|------|-------|
| **운영팀 직접 업로드** | 운영팀이 고객에게 받은 서류를 직접 업로드 | 운영팀 |
| **고객 직접 업로드** | 기간제 링크를 통해 고객이 직접 업로드 | 고객 |

두 방식 모두 업로드 후 상태는 `draft`이며, 운영팀이 검토 후 1차 확정해야 다음 단계로 진행됩니다.

#### 7.6 승인자 역할

| 역할 | 코드 | 권한 |
|-----|------|------|
| 운영팀 | `ops_team` | 업로드, 1차 확정, 2차 확정 |
| AML팀 | `aml_team` | AML 리뷰, AML 완료 |
| 준법감시인 | `compliance_officer` | 최종 승인 (필수) |
| 비즈니스본부장 | `business_head` | 최종 승인 (필수) |
| 관리자 | `admin` | 모든 권한, 승인자 지정 |
| 고객 | `customer` | 기간제 링크를 통한 서류 업로드만 가능 |

#### 7.7 필요 API

**상태 변경 API**
- `PUT /api/obhub/documents/:id/confirm` - 1차 확정 (운영팀)
- `PUT /api/obhub/documents/:id/aml-start` - AML 리뷰 시작
- `PUT /api/obhub/documents/:id/aml-complete` - AML 리뷰 완료
- `PUT /api/obhub/documents/:id/final-confirm` - 2차 확정
- `PUT /api/obhub/documents/:id/reject` - 반려 (사유 필수)

**최종 승인 API**
- `POST /api/obhub/approvals` - 최종 승인 요청 생성
- `GET /api/obhub/approvals` - 승인 대기 목록 조회
- `GET /api/obhub/approvals/:id` - 승인 요청 상세
- `PUT /api/obhub/approvals/:id/approve` - 승인 처리
- `PUT /api/obhub/approvals/:id/reject` - 반려 처리
- `GET /api/obhub/approvals/history` - 승인 이력 조회

#### 7.8 알림 유형

| 이벤트 | 수신자 | 채널 |
|-------|-------|------|
| 1차 확정 완료 | AML팀 | 이메일, 인앱 |
| AML 리뷰 완료 | 운영팀 | 이메일, 인앱 |
| 2차 확정 완료 | 준법감시인, 비즈니스본부장 | 이메일, 인앱 |
| 최종 승인 완료 | 운영팀, 고객 | 이메일 |
| 반려 발생 | 해당 단계 담당자 | 이메일, 인앱 |
| 승인 독촉 (24시간) | 미처리 승인자 | 이메일 |

### 기능 8: 고객 직접 서류 제출 (기간제 링크)

#### 8.1 기능 설명
- 고객에게 기간 한정 업로드 링크를 발급
- 고객이 로그인 없이 직접 서류 업로드 가능
- 링크 만료 후 자동 비활성화

#### 8.2 링크 특징
- **기간 설정**: 1일 ~ 30일 (기본 7일)
- **접근 제한**: 토큰 기반 인증 (JWT)
- **보안**: 1회용 또는 다회용 선택 가능
- **알림**: 업로드 완료 시 담당자에게 이메일 알림

#### 8.3 사용자 플로우
```
[담당자]
1. 온보딩 고객 상세 페이지에서 "서류 제출 링크 생성" 클릭
2. 유효 기간 및 필요 서류 항목 선택
3. 링크 생성 → 자동으로 고객 이메일로 발송 (SendGrid)

[고객]
1. 이메일에서 링크 클릭
2. 로그인 없이 서류 업로드 페이지 접근
3. 필요 서류 업로드 (드래그 앤 드롭)
4. 제출 완료 → 담당자에게 알림

[담당자]
1. 알림 수신
2. 업로드된 서류 확인
3. OCR 자동 처리 결과 검토
4. 온보딩 다음 단계로 진행
```

#### 8.4 필요 API
- `POST /api/obhub/upload-links` - 업로드 링크 생성
- `GET /api/obhub/upload-links/:token` - 링크 유효성 검증
- `POST /api/obhub/upload-links/:token/documents` - 고객 문서 업로드 (비인증)
- `GET /api/obhub/upload-links` - 발급된 링크 목록 조회
- `DELETE /api/obhub/upload-links/:id` - 링크 취소/삭제

#### 8.5 이메일 템플릿 (SendGrid)
```
제목: [WorkHub] 서류 제출 요청 - {고객사명}

안녕하세요, {고객명}님

{회사명}의 온보딩 프로세스 진행을 위해 아래 서류 제출을 요청드립니다.

📋 필요 서류:
{서류목록}

📅 제출 기한: {만료일}

아래 버튼을 클릭하여 서류를 제출해 주세요.

[서류 제출하기] ← 버튼 (링크)

문의사항이 있으시면 {담당자이메일}로 연락 주세요.

감사합니다.
{회사명} 드림
```

---

## 데이터베이스 스키마 (신규 온보딩 허브용)

### 테이블 설계

```sql
-- 온보딩 프로세스
CREATE TABLE onboarding_processes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id INTEGER,
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, archived
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 온보딩 단계
CREATE TABLE onboarding_steps (
  id SERIAL PRIMARY KEY,
  process_id INTEGER REFERENCES onboarding_processes(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 고객 온보딩 (SalesHub 연동)
CREATE TABLE customer_onboardings (
  id SERIAL PRIMARY KEY,
  saleshub_customer_id INTEGER NOT NULL,  -- SalesHub 고객 ID
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  process_id INTEGER REFERENCES onboarding_processes(id),
  current_step_id INTEGER REFERENCES onboarding_steps(id),
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  assigned_to INTEGER REFERENCES users(id)
);

-- 단계별 진행 상황
CREATE TABLE onboarding_progress (
  id SERIAL PRIMARY KEY,
  customer_onboarding_id INTEGER REFERENCES customer_onboardings(id),
  step_id INTEGER REFERENCES onboarding_steps(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, skipped
  completed_at TIMESTAMP,
  notes TEXT
);

-- 체크리스트 항목
CREATE TABLE checklist_items (
  id SERIAL PRIMARY KEY,
  step_id INTEGER REFERENCES onboarding_steps(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL
);

-- 체크리스트 완료 상태
CREATE TABLE checklist_completions (
  id SERIAL PRIMARY KEY,
  customer_onboarding_id INTEGER REFERENCES customer_onboardings(id),
  checklist_item_id INTEGER REFERENCES checklist_items(id),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  completed_by INTEGER REFERENCES users(id),
  UNIQUE(customer_onboarding_id, checklist_item_id)
);

-- 알림 템플릿 (SendGrid 연동)
CREATE TABLE notification_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, in_app, both
  sendgrid_template_id VARCHAR(100), -- SendGrid 동적 템플릿 ID
  subject VARCHAR(255),
  body TEXT NOT NULL,
  trigger_event VARCHAR(100), -- step_completed, reminder, etc
  created_at TIMESTAMP DEFAULT NOW()
);

-- 알림 발송 이력
CREATE TABLE notification_history (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES notification_templates(id),
  customer_onboarding_id INTEGER REFERENCES customer_onboardings(id),
  recipient_email VARCHAR(255),
  sendgrid_message_id VARCHAR(100),
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent' -- sent, failed, pending, delivered, opened
);

-- 문서/파일 업로드
CREATE TABLE onboarding_documents (
  id SERIAL PRIMARY KEY,
  customer_onboarding_id INTEGER REFERENCES customer_onboardings(id),
  step_id INTEGER REFERENCES onboarding_steps(id),
  upload_link_id INTEGER REFERENCES upload_links(id), -- 고객 직접 업로드 시
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by INTEGER REFERENCES users(id), -- NULL if uploaded by customer via link
  uploaded_by_customer BOOLEAN DEFAULT false
);

-- OCR 결과
CREATE TABLE document_ocr_results (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES onboarding_documents(id) ON DELETE CASCADE,
  raw_text TEXT, -- 원본 추출 텍스트
  structured_data JSONB, -- 구조화된 데이터 (필드별)
  confidence_score DECIMAL(5,2), -- 인식 신뢰도 (0-100)
  ocr_provider VARCHAR(50) DEFAULT 'google_vision', -- 사용한 OCR 서비스
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  reviewed_by INTEGER REFERENCES users(id), -- 검토자
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 고객 직접 업로드 링크
CREATE TABLE upload_links (
  id SERIAL PRIMARY KEY,
  customer_onboarding_id INTEGER REFERENCES customer_onboardings(id),
  token VARCHAR(255) UNIQUE NOT NULL, -- JWT 토큰 또는 UUID
  expires_at TIMESTAMP NOT NULL, -- 만료 시간
  max_uses INTEGER DEFAULT 1, -- 최대 사용 횟수 (NULL = 무제한)
  use_count INTEGER DEFAULT 0, -- 현재 사용 횟수
  required_documents TEXT[], -- 필요 서류 목록
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- 업로드 링크 사용 이력
CREATE TABLE upload_link_usage (
  id SERIAL PRIMARY KEY,
  upload_link_id INTEGER REFERENCES upload_links(id),
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  document_id INTEGER REFERENCES onboarding_documents(id),
  used_at TIMESTAMP DEFAULT NOW()
);

-- 서류 검토 상태 (6단계 워크플로우)
CREATE TABLE document_review_status (
  id SERIAL PRIMARY KEY,
  customer_onboarding_id INTEGER REFERENCES customer_onboardings(id),
  document_id INTEGER REFERENCES onboarding_documents(id),
  status VARCHAR(50) DEFAULT 'draft',
    -- draft: 임시 업로드
    -- ops_confirmed: 1차 확정
    -- aml_reviewing: AML 리뷰 중
    -- aml_completed: AML 완료
    -- final_confirmed: 2차 확정
    -- pending_approval: 최종 승인 대기
    -- approved: 승인 완료
    -- rejected: 반려
  ops_confirmed_by INTEGER REFERENCES users(id),
  ops_confirmed_at TIMESTAMP,
  aml_reviewer_id INTEGER REFERENCES users(id),
  aml_started_at TIMESTAMP,
  aml_completed_at TIMESTAMP,
  aml_notes TEXT,
  final_confirmed_by INTEGER REFERENCES users(id),
  final_confirmed_at TIMESTAMP,
  rejection_reason TEXT,
  rejected_by INTEGER REFERENCES users(id),
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 최종 승인 요청 (듀얼 승인)
CREATE TABLE final_approval_requests (
  id SERIAL PRIMARY KEY,
  customer_onboarding_id INTEGER REFERENCES customer_onboardings(id),
  requested_by INTEGER REFERENCES users(id), -- 2차 확정한 운영팀원
  requested_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected

  -- 준법감시인 승인
  compliance_officer_id INTEGER REFERENCES users(id),
  compliance_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  compliance_approved_at TIMESTAMP,
  compliance_note TEXT,

  -- 비즈니스본부장 승인
  business_head_id INTEGER REFERENCES users(id),
  business_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  business_approved_at TIMESTAMP,
  business_note TEXT,

  -- 최종 결과
  final_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  completed_at TIMESTAMP
);

-- 사용자 역할/권한
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
    -- ops_team: 운영팀
    -- aml_team: AML팀
    -- compliance_officer: 준법감시인
    -- business_head: 비즈니스본부장
    -- admin: 관리자
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 검토/승인 이력 (감사 로그)
CREATE TABLE review_audit_log (
  id SERIAL PRIMARY KEY,
  customer_onboarding_id INTEGER REFERENCES customer_onboardings(id),
  document_id INTEGER REFERENCES onboarding_documents(id),
  action VARCHAR(50) NOT NULL,
    -- uploaded, ops_confirmed, aml_started, aml_completed,
    -- final_confirmed, approval_requested, approved, rejected
  performed_by INTEGER REFERENCES users(id),
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  note TEXT,
  details JSONB, -- 추가 상세 정보
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## SSO 인증 연동 (HubManager → 온보딩 허브)

### 인증 흐름
1. HubManager에서 `POST /api/auth/generate-hub-token` 호출
2. JWT RS256 토큰 생성 (payload: sub, email, username, full_name, is_admin)
3. 온보딩 허브의 `/auth/sso?token=...` 으로 리다이렉션
4. 온보딩 허브에서 토큰 검증 (HubManager 공개키 사용)
5. 세션 생성 및 대시보드로 이동

### 필요 엔드포인트 (온보딩 허브)
- `GET /auth/sso` - SSO 토큰 검증 및 세션 생성
- `GET /auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

---

## 기술 스택

### 백엔드
- **런타임**: Node.js + Express
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **인증**: JWT RS256 (HubManager와 동일)
- **이메일**: SendGrid API
- **OCR**: Google Cloud Vision API
- **파일 저장**: AWS S3
- **프로세스 관리**: PM2

### 운영 환경
| 환경 | 데이터베이스 | 배포 |
|-----|------------|------|
| **프로덕션** | 오라클 클라우드 PostgreSQL | PM2 |
| **로컬 개발** | Docker 내 PostgreSQL | - |

### AWS S3 무료 티어 (12개월)
- 저장소: 5GB (Standard)
- GET 요청: 20,000건/월
- PUT 요청: 2,000건/월
- 데이터 전송: 100GB/월
- 초과 시: $0.023/GB/월

### 프론트엔드
- **프레임워크**: Next.js (App Router)
- **UI 라이브러리**: Tailwind CSS, shadcn/ui
- **상태 관리**: React Query + Zustand
- **아이콘**: Lucide React
- **파일 업로드**: react-dropzone

---

## 프로젝트 구조

```
WBOnboardingHub/
├── frontend/          # Next.js App Router
│   ├── app/
│   │   ├── auth/     # SSO 인증
│   │   ├── dashboard/
│   │   ├── onboarding/
│   │   └── ...
│   └── components/
├── server/           # Express 백엔드
│   ├── routes/
│   ├── services/
│   ├── database/
│   └── ...
├── prisma/
│   └── schema.prisma
└── docker-compose.yml
```

---

## 배포 정보

- **외부 URL**: `http://workhub.biz/onboardinghub`
- **내부 URL**: `http://158.180.95.246:3030`
- **포트**: Frontend 3030, Backend 4030
- **배포 스크립트**: `deploy-oracle.sh`

---

## SalesHub 연동

- SalesHub API를 통해 고객 목록 조회
- 고객 선택 시 온보딩 프로세스 시작
- 필요 API: `GET /api/customers` (SalesHub)

---

## 구현 우선순위

### Phase 1: 기본 구조
1. 프로젝트 셋업 (백엔드 + 프론트엔드)
2. 데이터베이스 스키마 생성 (Prisma)
3. SSO 인증 연동 (`/auth/sso`)
4. 기본 대시보드 UI

### Phase 2: 핵심 기능
5. 온보딩 프로세스 CRUD
6. SalesHub 고객 연동
7. 단계별 진행 상황 추적
8. 체크리스트 기능

### Phase 3: 고급 기능
9. SendGrid 이메일 알림 시스템
10. 문서 업로드 기능
11. 튜토리얼 시스템
12. 대시보드 분석/통계

### Phase 4: 추가 기능
13. 책임자 승인 프로세스
14. 고객 직접 서류 제출 (기간제 링크)
15. 문서 OCR 기능 (Google Cloud Vision)
16. OCR 결과 검토 UI

---

## HubManager 수정 필요 사항

온보딩 허브 출시 시 HubManager에서 변경할 항목:

1. `frontend/lib/constants/hubConfig.ts`
   - `isUnderDevelopment: false` 로 변경
   - `actionLabel: '시작하기'` 로 변경

2. `server/database/init.ts`
   - 온보딩 허브 URL을 오라클 클라우드 주소로 변경
   - `http://158.180.95.246:3030`

---

## OCR 도구 참고 자료

OCR 도구 선정 시 참고한 자료:
- [Complete Guide Open Source OCR Models 2025](https://www.e2enetworks.com/blog/complete-guide-open-source-ocr-models-2025)
- [OCR Benchmark: Text Extraction Accuracy](https://research.aimultiple.com/ocr-accuracy/)
- [10 Awesome OCR Models for 2025](https://www.kdnuggets.com/10-awesome-ocr-models-for-2025)
- [Best Korean OCR App for 2025](https://www.cisdem.com/resource/korean-ocr.html)
- [A Comprehensive Guide to OCR APIs](https://www.docsumo.com/blogs/ocr/api)

---

*작성일: 2026-01-03*
*마지막 수정: 2026-01-03*
