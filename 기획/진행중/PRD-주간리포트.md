# PRD: 주간 리포트 기능

**상태**: 진행중
**대상 허브**: WBSalesHub
**작성일**: 2026. 02. 08
**작성자**: Peter Chung + Claude

---

## 1. 개요

WBSalesHub에 "주간 리포트" 사이드바 페이지를 신규 추가한다. 경영진이 매주 A4 1-2장 분량으로 세일즈/BD/대관 현황을 한눈에 파악할 수 있도록, AI(Claude)가 초안을 자동 생성하고 사용자가 WYSIWYG 편집기로 수정한 뒤 Notion으로 내보내는 워크플로를 구현한다.

### 핵심 요구사항

- 4개 섹션(요약, 세일즈, BD, 대관) x 가로 전주/금주 비교
- 3개월 누적 기록 + 1주 변화 강조
- 정보밀도 극대화 (표/그래프 지양, 텍스트 중심)
- 리포트 템플릿: 처음 1개("경영진 주간보고"), 이후 10개 이하 확장
- 마크다운 WYSIWYG 편집기로 수정 가능
- DB 저장 (메인) + Notion 내보내기
- 자동생성: 먼저 수동 → 이후 크론 자동화 (매주 금요일 15시 KST)

---

## 2. DB 스키마

### 2-1. weekly_report_templates 테이블

리포트 템플릿 관리 (처음 1개, 최대 10개)

```sql
CREATE TABLE IF NOT EXISTS weekly_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  ai_system_prompt TEXT,
  ai_section_prompts JSONB DEFAULT '{}',
  data_config JSONB DEFAULT '{"lookbackWeeks": 12, "highlightWeeks": 1}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2-2. weekly_reports 테이블

생성된 리포트 저장

```sql
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES weekly_report_templates(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  sections JSONB NOT NULL DEFAULT '{}',
  -- 구조: {
  --   "summary": { "current": "금주 마크다운", "previous": "전주 마크다운" },
  --   "sales": { "current": "...", "previous": "..." },
  --   "bd": { "current": "...", "previous": "..." },
  --   "government": { "current": "...", "previous": "..." }
  -- }
  data_snapshot JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft, review, final, exported
  ai_generated BOOLEAN DEFAULT false,
  ai_model VARCHAR(50),
  ai_generated_at TIMESTAMPTZ,
  notion_page_id VARCHAR(100),
  notion_exported_at TIMESTAMPTZ,
  created_by UUID REFERENCES accounts(id),
  updated_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, week_start)
);

CREATE INDEX idx_weekly_reports_week ON weekly_reports(week_start DESC);
CREATE INDEX idx_weekly_reports_status ON weekly_reports(status);
```

### 2-3. 기본 템플릿 시드

```sql
INSERT INTO weekly_report_templates (name, description, sections, is_default) VALUES (
  '경영진 주간보고',
  '세일즈, BD, 대관 현황을 경영진에게 보고하는 주간 리포트',
  '[{"key":"summary","label":"요약","order":1},{"key":"sales","label":"세일즈","order":2},{"key":"bd","label":"BD","order":3},{"key":"government","label":"대관","order":4}]',
  true
);
```

---

## 3. 백엔드 API

### 3-1. 파일 구조

| 파일 | 역할 |
|------|------|
| `server/services/weeklyReportService.ts` | CRUD + 데이터 수집 + AI 생성 |
| `server/services/notionExportService.ts` | Notion 내보내기 |
| `server/routes/weeklyReportRoutes.ts` | Express 라우트 |
| `server/database/migrations/032_add_weekly_reports.sql` | 마이그레이션 |

### 3-2. API 엔드포인트

`server/index.ts`의 `setupRoutes()`에 등록:
```typescript
const weeklyReportRoutes = (await import('./routes/weeklyReportRoutes.js')).default;
app.use('/api/weekly-reports', weeklyReportRoutes);
```

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/weekly-reports/templates` | 템플릿 목록 | isAuthenticatedAndActive |
| GET | `/api/weekly-reports` | 리포트 목록 (페이지네이션) | isAuthenticatedAndActive |
| GET | `/api/weekly-reports/:id` | 리포트 상세 | isAuthenticatedAndActive |
| POST | `/api/weekly-reports` | 빈 리포트 생성 | isAuthenticatedAndActive |
| PUT | `/api/weekly-reports/:id` | 리포트 수정 (편집 내용 저장) | isAuthenticatedAndActive |
| PATCH | `/api/weekly-reports/:id/status` | 상태 변경 (draft→review→final) | isAuthenticatedAndActive |
| DELETE | `/api/weekly-reports/:id` | 삭제 | isMaster |
| POST | `/api/weekly-reports/generate` | AI 초안 생성 | isAuthenticatedAndActive |
| POST | `/api/weekly-reports/:id/regenerate-section` | 섹션 재생성 | isAuthenticatedAndActive |
| POST | `/api/weekly-reports/:id/export/notion` | Notion 내보내기 | isAuthenticatedAndActive |
| GET | `/api/weekly-reports/data-preview` | 수집 데이터 미리보기 | isAuthenticatedAndActive |

### 3-3. 데이터 수집 로직

**세일즈**:
- customers (sales_stage별 count)
- customer_activities (금주/전주)
- meetings (금주/전주)
- health_score / importance_score 변동 고객, 신규 고객

**BD** (카테고리 기반):
- `customer_categories WHERE level1 IN ('Prime','파트너')` JOIN customers, activities, memos

**대관**:
- `customer_categories WHERE level1 = '대관'` JOIN customers, activities, memos

**3개월 누적**:
- `date_trunc('week', activity_date)` 기준 12주간 주별 활동 count 추이

### 3-4. AI 초안 생성

- Anthropic SDK 직접 사용 (기존 `modules/integrations/claude/claude.service.ts` 패턴)
- 모델: `claude-sonnet-4-20250514`
- 4개 섹션 병렬 생성 (`Promise.all`) → 15-30초 소요
- 각 섹션에 current(금주) + previous(전주) 마크다운 반환 요청

**프롬프트 구조**:
```
시스템: 경영진 주간보고 작성 전문가. 마크다운 형식. 표/그래프 금지. 정보밀도 극대화.
        각 섹션 300-500자. 숫자+팩트 중심. 전주 대비 변화를 (+N/-N) 형태로 강조.
        3개월 누적 추이 한줄 언급.

유저: [섹션명] 데이터:
      금주(2/3~2/7): { 활동 15건, 미팅 5건, 신규고객 2건, ... }
      전주(1/27~1/31): { 활동 12건, 미팅 3건, 신규고객 1건, ... }
      12주 추이: { 평균 활동 13건/주, 추세: 상승 }
      주요 고객별 현황: [...]
```

---

## 4. 프론트엔드

### 4-1. 사이드바 메뉴 추가

`frontend/components/layout/Sidebar.tsx` navItems 배열 (미팅노트 다음 위치):

```typescript
import { ClipboardList } from 'lucide-react';

{ href: '/weekly-reports', label: '주간 리포트', icon: ClipboardList },
```

### 4-2. WYSIWYG 편집기: TipTap

```bash
cd frontend && npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/pm
```

선택 이유: React 네이티브, shadcn/ui 통합 용이, 마크다운 변환 지원, SSR은 next/dynamic으로 CSR 처리

### 4-3. 파일 구조

```
frontend/
├── app/(dashboard)/weekly-reports/
│   ├── page.tsx                      # 리포트 목록
│   └── [id]/page.tsx                 # 리포트 편집
├── components/weekly-reports/
│   ├── ReportListTable.tsx           # 목록 테이블
│   ├── ReportEditor.tsx              # TipTap WYSIWYG 래퍼
│   ├── ReportSectionLayout.tsx       # 4섹션 x 2컬럼 레이아웃
│   ├── ReportToolbar.tsx             # 상단 도구바 (저장/생성/내보내기)
│   ├── GenerateDialog.tsx            # AI 생성 다이얼로그
│   └── ReportPrintView.tsx           # A4 프린트 뷰
├── hooks/useWeeklyReports.ts         # React Query hooks
└── lib/api.ts                        # weeklyReportsApi 추가
```

### 4-4. API 클라이언트

`frontend/lib/api.ts` - 기존 `api` 인스턴스 사용, `/api` 접두사 없이:

```typescript
export const weeklyReportsApi = {
  getTemplates: () => api.get('/weekly-reports/templates'),
  getAll: (params?) => api.get('/weekly-reports', params),
  getById: (id: string) => api.get(`/weekly-reports/${id}`),
  create: (data: any) => api.post('/weekly-reports', data),
  update: (id: string, data: any) => api.put(`/weekly-reports/${id}`, data),
  generate: (data: any) => api.post('/weekly-reports/generate', data),
  exportNotion: (id: string) => api.post(`/weekly-reports/${id}/export/notion`),
};
```

### 4-5. 리포트 편집 페이지 레이아웃

```
┌─────────────────────────────────────────────────┐
│  [저장] [AI 재생성] [Notion 내보내기] [인쇄]      │
│  경영진 주간보고 · 2026년 2월 2주차               │
├─────────────────────────────────────────────────┤
│  ■ 요약                                         │
│  ┌────────────────────────────────────────────┐  │
│  │ WYSIWYG 편집기 (전체 너비, 전주 대비 인라인)  │  │
│  └────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  ■ 세일즈 / BD / 대관 (각 섹션 동일 구조)        │
│  ┌── 전주 (읽기) ──┐  ┌── 금주 (편집) ──┐       │
│  │ react-markdown  │  │ TipTap WYSIWYG │       │
│  └────────────────┘  └────────────────┘       │
└─────────────────────────────────────────────────┘
```

- 요약: 전주/금주 구분 없이 통합 편집 (변화 포인트를 인라인으로 포함)
- 세일즈/BD/대관: 좌측 전주(react-markdown 읽기 전용), 우측 금주(TipTap 편집)
- A4 프린트: `@media print` CSS, 도구바 숨김, 페이지 나누기 제어

---

## 5. Notion 연동

### 5-1. 설정

```bash
cd /home/peterchung/WBSalesHub && npm install @notionhq/client
```

환경변수 (`.env.template`, `.env.local` 등):
```
NOTION_API_KEY=
NOTION_PARENT_PAGE_ID=
```

### 5-2. NotionExportService

- `exportReport(report)`: 마크다운 → Notion 블록 변환 → 페이지 생성
- `checkConnection()`: API 키 유효성 확인
- 변환: heading → heading_2, bullet → bulleted_list_item, paragraph → paragraph
- 내보내기 후 `weekly_reports.notion_page_id` 업데이트

---

## 6. 크론 자동화 (이후 별도 작업)

`server/cron/generateWeeklyReport.ts` 추가, `cron/index.ts`에 등록:
```
cron.schedule('0 15 * * 5', ...) // 매주 금요일 15시 KST
```

현재 스코프에서는 **수동 생성만 구현**, 크론은 별도 작업으로 분리.

---

## 7. 구현 순서

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | DB 마이그레이션 | `server/database/migrations/032_add_weekly_reports.sql` |
| 2 | 백엔드 서비스 (CRUD + 데이터 수집) | `server/services/weeklyReportService.ts` |
| 3 | 백엔드 라우트 | `server/routes/weeklyReportRoutes.ts` |
| 4 | server/index.ts 라우트 등록 | `server/index.ts` |
| 5 | 프론트엔드 TipTap 설치 | `frontend/package.json` |
| 6 | 사이드바 메뉴 추가 | `frontend/components/layout/Sidebar.tsx` |
| 7 | API 클라이언트 + Hooks | `frontend/lib/api.ts`, `frontend/hooks/useWeeklyReports.ts` |
| 8 | 리포트 목록 페이지 | `frontend/app/(dashboard)/weekly-reports/page.tsx` |
| 9 | 리포트 편집 페이지 + 컴포넌트 | `frontend/app/(dashboard)/weekly-reports/[id]/page.tsx`, `components/weekly-reports/*` |
| 10 | AI 초안 생성 로직 | `server/services/weeklyReportService.ts` (generateReport 메서드) |
| 11 | Notion 연동 | `server/services/notionExportService.ts` |

---

## 8. 검증 방법

1. **DB**: 마이그레이션 실행 후 `\dt weekly_report*` 확인
2. **백엔드 API**: `curl http://localhost:4010/api/weekly-reports/templates` → 기본 템플릿 반환
3. **프론트엔드**: `localhost:3010/saleshub/weekly-reports` → 목록 페이지 로드
4. **AI 생성**: "AI로 생성" 클릭 → 4개 섹션 마크다운 생성 확인
5. **편집**: TipTap으로 내용 수정 → 저장 → 새로고침 후 유지 확인
6. **Notion**: 내보내기 → Notion 페이지 생성 확인
7. **인쇄**: 브라우저 인쇄 미리보기에서 A4 레이아웃 확인

---

## 9. 주요 참조 파일

| 파일 | 참조 목적 |
|------|----------|
| `server/services/salesSummaryService.ts` | DB 쿼리 패턴 (Pool 주입, SQL) |
| `server/modules/integrations/claude/claude.service.ts` | Claude API 호출 패턴 |
| `server/cron/index.ts` | 크론 등록 패턴 |
| `server/middleware/auth.ts` | 인증 미들웨어 (isAuthenticatedAndActive, isMaster) |
| `frontend/components/meeting-notes/` | 목록/상세 페이지 UI 패턴 |
| `frontend/components/customers/context/CustomerContextTab.tsx` | 마크다운 뷰어 패턴 |
