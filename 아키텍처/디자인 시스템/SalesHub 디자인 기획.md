# SalesHub 디자인 기획

> 디자인 시스템 v1.0 (B3: Warm Elevated) 기반 SalesHub 전체 페이지 리디자인

---

## 1. 개요

### 1.1 목표
- 기존 `gray` 기반 → `zinc` 기반으로 전환
- 테두리 중심 → 그림자 중심 카드 분리
- 파스텔 배지 → 솔리드/3단계 배지 시스템
- 모바일 반응형 강화

### 1.2 허브 색상
- **Primary**: blue-600 (`#2563EB`) — SalesHub 고유
- **Primary Light**: blue-50 (`#EFF6FF`)
- **Primary Hover**: blue-500 (`#3B82F6`)
- **Primary Pressed**: blue-700 (`#1D4ED8`)

### 1.3 변경 범위
| 구분 | 파일 수 | 설명 |
|------|---------|------|
| 인프라 | 2 | globals.css, tailwind.config.ts |
| UI 컴포넌트 | 10+ | card, button, badge, input, table 등 |
| 레이아웃 | 3 | Sidebar, Header, DashboardLayout |
| 페이지 컴포넌트 | 40+ | 모든 페이지의 도메인 컴포넌트 |

---

## 2. 인프라 변경

### 2.1 globals.css — CSS 변수 교체

```css
:root {
  /* Background */
  --bg-base: 240 5% 96%;        /* #F4F4F5 zinc-100 */
  --bg-card: 0 0% 100%;         /* white */
  --bg-subtle: 0 0% 98%;        /* #FAFAFA zinc-50 */

  /* Text */
  --text-primary: 240 6% 10%;   /* #18181B zinc-900 */
  --text-secondary: 240 4% 26%; /* #3F3F46 zinc-700 */
  --text-tertiary: 240 4% 46%;  /* #71717A zinc-500 */
  --text-muted: 240 4% 65%;     /* #A1A1AA zinc-400 */

  /* Primary (SalesHub = blue) */
  --primary: 217 91% 60%;       /* #3B82F6 blue-500 */
  --primary-50: 214 100% 97%;   /* #EFF6FF */
  --primary-100: 214 95% 93%;   /* #DBEAFE */
  --primary-600: 221 83% 53%;   /* #2563EB */
  --primary-700: 224 76% 48%;   /* #1D4ED8 */
  --primary-foreground: 0 0% 100%;

  /* Semantic */
  --success: 142 71% 29%;       /* green-700 #15803D */
  --warning: 32 95% 44%;        /* amber-700 #B45309 */
  --error: 0 72% 51%;           /* red-600 #DC2626 */
  --info: 217 91% 60%;          /* blue-600 #2563EB */

  /* Surface */
  --border: 240 6% 90%;         /* zinc-200 #E4E4E7 */
  --input: 240 6% 90%;
  --ring: 221 83% 53%;          /* blue-600 */
  --radius: 0.5rem;

  /* Shadow (참고: Tailwind shadow 사용) */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.15);

  /* Chart */
  --chart-1: 221 83% 53%;   /* blue-600 */
  --chart-2: 142 71% 45%;   /* green-600 */
  --chart-3: 32 95% 44%;    /* amber-600 */
  --chart-4: 262 83% 58%;   /* violet-500 */
  --chart-5: 0 72% 51%;     /* red-600 */
}
```

### 2.2 tailwind.config.ts — 확장

```typescript
theme: {
  extend: {
    colors: {
      // CSS 변수 연결
      'bg-base': 'hsl(var(--bg-base))',
      'bg-card': 'hsl(var(--bg-card))',
      'bg-subtle': 'hsl(var(--bg-subtle))',
      primary: {
        50: 'hsl(var(--primary-50))',
        100: 'hsl(var(--primary-100))',
        DEFAULT: 'hsl(var(--primary-600))',
        600: 'hsl(var(--primary-600))',
        700: 'hsl(var(--primary-700))',
      },
    },
    boxShadow: {
      xs: 'var(--shadow-xs)',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      xl: 'var(--shadow-xl)',
      '2xl': 'var(--shadow-2xl)',
    },
    borderRadius: {
      xl: '12px',
      '2xl': '16px',
    },
    keyframes: {
      'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      'scale-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
    },
    animation: {
      'fade-in': 'fade-in 0.2s ease-out',
      'slide-up': 'slide-up 0.3s ease-out',
      'scale-in': 'scale-in 0.2s ease-out',
    },
  },
},
```

---

## 3. 레이아웃 컴포넌트

### 3.1 DashboardLayout (`app/(dashboard)/layout.tsx`)

**현재**: `bg-gray-50`
**변경**: `bg-zinc-100` (= bg-base)

```
┌──────────────────────────────────────────────┐
│ Sidebar (w-64, fixed, shadow-2xl)            │
│                                              │
│ ┌──────────────────────────────────────┐     │
│ │ Header (h-16, shadow-xs)            │     │
│ ├──────────────────────────────────────┤     │
│ │                                      │     │
│ │  메인 콘텐츠 (bg-zinc-100)           │     │
│ │                                      │     │
│ └──────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

### 3.2 Sidebar (`components/layout/Sidebar.tsx`)

| 항목 | 현재 | 변경 |
|------|------|------|
| 배경 | `bg-white border-r border-gray-200` | `bg-white shadow-2xl border-0` |
| 너비 | `w-60` | `w-64` |
| 로고 영역 | — | `h-16 flex items-center px-6` |
| 활성 항목 | `bg-primary/10 text-primary` | `bg-blue-50 text-blue-700 rounded-xl font-medium` |
| 비활성 항목 | `text-gray-600` | `text-zinc-600 hover:bg-zinc-100 rounded-xl` |
| 항목 높이 | — | `h-10 px-3` |
| 하단 유저 | — | `border-t border-zinc-100 p-4` |
| 모바일 | 오버레이 | `translate-x 슬라이드 + backdrop-blur` |

### 3.3 Header (`components/layout/Header.tsx`)

| 항목 | 현재 | 변경 |
|------|------|------|
| 높이 | `h-16` | 유지 |
| 그림자 | 없음 | `shadow-xs` |
| 배경 | `bg-white border-b` | `bg-white shadow-xs border-0` |
| 제목 | `text-2xl font-bold` | `text-xl font-semibold text-zinc-900` |
| 브레드크럼 | 없음 | `text-zinc-400 → text-zinc-900` |

---

## 4. 페이지별 디자인 기획

### 4.1 인증 페이지 (Login / Signup / Pending)

**레이아웃**: 중앙 카드, 배경 `bg-zinc-100`

| 요소 | 현재 | 변경 |
|------|------|------|
| 배경 | 그래디언트 (`from-primary/10`) | `bg-zinc-100` 단색 |
| 카드 | `border rounded-lg` | `rounded-2xl shadow-xl p-8 border-0` |
| 로고 | — | 상단 중앙, SalesHub 로고 |
| 버튼 | `bg-primary` | `bg-blue-600 hover:bg-blue-500 shadow-xs active:scale-[0.98]` |
| 입력 | `border-gray-200` | `border-zinc-300 focus:ring-2 focus:ring-blue-600/20` |
| 링크 | `text-primary` | `text-blue-600 hover:text-blue-500` |
| 에러 | 빨간 텍스트 | 에러 카드 (icon + message) |

### 4.2 대시보드 (`/`)

#### 4.2.1 통계 카드 (StatCard) — KPI 표준 적용

**현재**: `bg-white border rounded-lg p-6` + 아이콘 원형 배경
**변경**: KPI 카드 표준 적용

```
┌──────────────────────────────────────────────┐
│  월간 거래액          2월 기준               │  ← text-zinc-500 / text-zinc-400
│  ₩138,500,000        +12.5%                 │  ← text-3xl font-bold / text-green-700
│  vs 전월 ₩123,100,000                       │  ← text-xs text-zinc-400
│                                              │
│  기준: 2/7 09:00 KST                        │  ← text-[11px] text-zinc-300
└──────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | `border rounded-lg p-6` | `rounded-2xl shadow-md p-8 border-0` |
| 아이콘 | 원형 배경 (`bg-primary/10`) | 좌상단 아이콘, `text-blue-600` |
| 값 | `text-2xl font-bold` | `text-3xl font-bold font-mono tabular-nums` |
| 추세 | 화살표 아이콘 | `+12.5%` 녹색/적색 텍스트 (부호 포함) |
| 기준 기간 | 없음 | **추가**: 우측 상단 `text-zinc-400` |
| 기준 시간 | 없음 | **추가**: 하단 `text-[11px] text-zinc-300` |
| 호버 | `hover:shadow-md` | `hover:shadow-lg transition-shadow duration-200` |
| 그리드 | `md:grid-cols-2 lg:grid-cols-4 gap-6` | 유지 |

#### 4.2.2 SalesPipeline

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | `border rounded-lg` | `rounded-2xl shadow-md p-8 border-0` |
| 진행률 바 | 색상별 단계 | 유지, 색상을 zinc 기반으로 조정 |
| 핵심 지표 | 텍스트 나열 | 미니 KPI 카드 형태 (`bg-zinc-50 rounded-xl p-4`) |
| 단계 라벨 | `text-gray-600` | `text-zinc-600` |

#### 4.2.3 차트 카드 (StageBarChart, MonthlyTrendChart 등)

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | `border rounded-lg` | `rounded-2xl shadow-md p-8 border-0` |
| 차트 색상 | 기본 Chart.js | blue-600, green-600, amber-600, violet-500, red-600 |
| 범례 | Chart.js 기본 | 커스텀 범례 (`text-zinc-500`) |
| 제목 | `font-semibold` | `text-lg font-semibold text-zinc-900` |

#### 4.2.4 DealsAtRiskWidget

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | 기본 카드 | `rounded-2xl shadow-md p-8 border-0` |
| 경고 아이콘 | — | `text-amber-600` AlertTriangle |
| 위험 항목 | 리스트 | 미니 카드 리스트, L1 배지 사용 |

#### 4.2.5 RecentCustomers / RecentMeetingNotes

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | 기본 카드 | `rounded-2xl shadow-md p-8 border-0` |
| 리스트 항목 | `divide-gray-200` | `divide-zinc-100` |
| 링크 | `text-primary` | `text-blue-600 hover:text-blue-500` |
| "더보기" | 하단 텍스트 | `text-blue-600 font-medium` |

#### 4.2.6 대시보드 그리드 전체

```
┌──────────────────────────────────────────────────────┐
│ Header: "대시보드"                                    │
├──────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │ KPI 1  │ │ KPI 2  │ │ KPI 3  │ │ KPI 4  │  gap-6 │
│ └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                      │
│ ┌──────────────────────┐ ┌───────────────┐           │
│ │ SalesPipeline        │ │ StageDistChart│  gap-6   │
│ │ (lg:col-span-2)      │ │               │           │
│ └──────────────────────┘ └───────────────┘           │
│                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ StageBar │ │ Monthly  │ │ Category │  gap-6       │
│ └──────────┘ └──────────┘ └──────────┘              │
│                                                      │
│ ┌──────────────────────────────────────────┐         │
│ │ DealsAtRisk (Reno AI)                    │  gap-6  │
│ └──────────────────────────────────────────┘         │
│                                                      │
│ ┌───────────────────┐ ┌───────────────────┐          │
│ │ RecentCustomers   │ │ RecentMeetingNotes│  gap-6  │
│ └───────────────────┘ └───────────────────┘          │
└──────────────────────────────────────────────────────┘
```

**모바일 (< lg)**:
- KPI: `grid-cols-1 sm:grid-cols-2`
- 차트: `grid-cols-1`
- 최근 활동: `grid-cols-1`

---

### 4.3 고객 목록 (`/customers`)

#### 4.3.1 필터 바 — 필터 바 v1 표준 적용

**현재**: 검색 + 5개 드롭다운 일렬 배치
**변경**: 필터 바 v1 표준

```
데스크톱:
┌──────────────────────────────────────────────────────────┐
│ [🔍 검색...]  [Stage ▾]  [Type ▾]  [+ 필터]   [정렬 ▾] │
├──────────────────────────────────────────────────────────┤
│ ✕ 액티브 고객  ✕ 회원가입 진행중  ✕ KYC 완료            │  ← 활성 필터 칩 행
└──────────────────────────────────────────────────────────┘

모바일:
┌──────────────────────────────┐
│ [🔍 검색...]    [필터 🔽]    │
└──────────────────────────────┘
→ 하단 시트로 필터 옵션 표시
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 검색 | `border-gray-200` | `bg-zinc-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-600/20` |
| 드롭다운 | shadcn Select | `border-zinc-300 rounded-lg` |
| 필터 칩 | 없음 | `bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1` |
| "필터 초기화" | 없음 | 필터 칩 행 우측에 `text-zinc-400 hover:text-zinc-600` |
| 모바일 | 드롭다운 숨김 | 하단 시트 (Bottom Sheet) |

#### 4.3.2 테이블 — 테이블 v2 Dense 모드 적용

**현재**: 기본 테이블, `border`, 파스텔 배지
**변경**: Dense 모드 + 하이브리드 그림자

```html
<div class="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
  <table class="w-full">
    <thead class="bg-zinc-50 border-b border-zinc-200">
      <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-500 tracking-normal">
        회사명  <!-- uppercase 제거, tracking-normal -->
      </th>
    </thead>
    <tbody class="divide-y divide-zinc-100">
      <tr class="hover:bg-zinc-50 h-[44px]">  <!-- Dense: 40-44px -->
        <td class="px-6 py-2 text-sm">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### 4.3.3 배지 변환 (3단계 시스템)

**Sales Stage 배지** — L2 (Status):
| 상태 | 현재 | 변경 |
|------|------|------|
| 휴면/지연 | `bg-gray-100 text-gray-500` | `bg-zinc-100 text-zinc-600` |
| 잠재 고객 | `bg-gray-100 text-gray-700` | `bg-zinc-200 text-zinc-700` |
| 회원가입 진행중 | `bg-blue-100 text-blue-700` | `bg-blue-100 text-blue-800` |
| 회원가입 완료 | `bg-yellow-100 text-yellow-700` | `bg-amber-100 text-amber-800` |
| 액티브 고객 | `bg-green-100 text-green-700` | `bg-green-100 text-green-800` |
| 온보딩 진행중 | `bg-indigo-100 text-indigo-700` | `bg-indigo-100 text-indigo-800` |

**Entity Type 배지** — L3 (Meta):
| 타입 | 현재 | 변경 |
|------|------|------|
| 법인 | `bg-blue-100 text-blue-700` | `border border-zinc-300 text-zinc-600 bg-transparent` |
| 개인 | `bg-green-100 text-green-700` | `border border-zinc-300 text-zinc-600 bg-transparent` |
| 투자조합 | `bg-purple-100 text-purple-700` | `border border-zinc-300 text-zinc-600 bg-transparent` |
| W/B | `bg-orange-100 text-orange-700` | `border border-zinc-300 text-zinc-600 bg-transparent` |
| 펀드 | `bg-red-100 text-red-700` | `border border-zinc-300 text-zinc-600 bg-transparent` |

> **이유**: Entity Type은 분류(Meta) 정보이므로 L3 아웃라인 배지. 시각적 노이즈 감소.

**Turn Status 배지** — L2 (Status):
| 상태 | 현재 | 변경 |
|------|------|------|
| 완료 | `bg-green-100 text-green-700` | `bg-green-100 text-green-800` |
| 고객 대기 | `bg-blue-100 text-blue-700` | `bg-blue-100 text-blue-800` |
| WB 대기 | `bg-orange-100 text-orange-700` | `bg-amber-100 text-amber-800` |
| 보류 | `bg-gray-100 text-gray-700` | `bg-zinc-100 text-zinc-700` |
| Drop | `bg-red-100 text-red-700` | **L1**: `bg-red-600 text-white` (Critical!) |

#### 4.3.4 모바일 테이블 → 카드 전환

```
데스크톱 (lg+): 테이블 표시
모바일 (< lg): 카드 리스트

┌──────────────────────────────┐
│ 회사명                  Stage │
│ 담당자 · Entity Type         │
│ Turn Status · KYC            │
│ Last Context: 3일 전         │
└──────────────────────────────┘
```

구현: `hidden lg:table` + `lg:hidden` 카드 리스트

---

### 4.4 고객 상세 (`/customers/detail`)

#### 4.4.1 헤더 영역

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | `border rounded-lg` | `rounded-2xl shadow-md p-8 border-0` |
| 로고 | 원형 이미지 | `rounded-xl w-16 h-16 shadow-sm` |
| 회사명 | `text-2xl font-bold` | `text-xl font-semibold text-zinc-900` |
| 카테고리 | 파스텔 배지 | L3 아웃라인 배지 |
| Stage 선택 | Select | `border-zinc-300 rounded-lg` |
| 별점 | StarRating | 유지, 색상 `text-amber-500` |

#### 4.4.2 2컬럼 레이아웃

```
데스크톱 (lg+):
┌────────────────────────┐ ┌─────────────────────┐
│ Context Log (sticky)   │ │ Customer Context    │
│ shadow-md rounded-2xl  │ │ shadow-md rounded-2xl│
│ p-8                    │ │ p-8                  │
└────────────────────────┘ └─────────────────────┘

모바일:
┌──────────────────────────────────┐
│ Context Log (탭으로 전환)         │
├──────────────────────────────────┤
│ Customer Context                 │
└──────────────────────────────────┘
```

#### 4.4.3 아코디언 섹션

| 요소 | 현재 | 변경 |
|------|------|------|
| 아코디언 | 기본 스타일 | `bg-white rounded-2xl shadow-md border-0 mb-6` |
| 헤더 | — | `p-6 text-lg font-semibold text-zinc-900` |
| 내부 | — | `px-8 pb-8` |
| 열림 상태 | — | `shadow-lg` 확대 |

#### 4.4.4 상세 정보 섹션 (2컬럼)

```
┌──────────────────────┐ ┌──────────────────────┐
│ CustomerInfo         │ │ Activities           │
│ 기본정보 폼          │ │ 활동 로그            │
├──────────────────────┤ ├──────────────────────┤
│ CustomerContacts     │ │ Documents            │
│ 연락처 목록          │ │ 문서 목록            │
└──────────────────────┘ └──────────────────────┘
```

- 각 서브카드: `bg-zinc-50 rounded-xl p-6` (카드 내부 카드)
- 라벨: `text-xs font-semibold text-zinc-500`
- 값: `text-sm text-zinc-900`

#### 4.4.5 건강도 인사이트

| 요소 | 현재 | 변경 |
|------|------|------|
| 레이더 차트 | Chart.js | 색상: blue-600 메인, blue-100 배경 |
| 점수 | 텍스트 | KPI 카드 표준 (큰 숫자 + 델타) |
| 위험 항목 | 리스트 | L1 배지 + 설명 |

#### 4.4.6 레노 AI 탭 (고객 상세 내 embedded)

| 요소 | 현재 | 변경 |
|------|------|------|
| 탭 컨테이너 | 기본 Tabs | `bg-zinc-50 rounded-xl` |
| 탭 버튼 | 기본 | `data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg` |
| 패널 | — | `bg-white rounded-xl p-6` |

#### 4.4.7 SectionDotNav

| 요소 | 현재 | 변경 |
|------|------|------|
| 점 | — | `w-2 h-2 rounded-full bg-zinc-300` |
| 활성 점 | — | `w-2.5 h-2.5 bg-blue-600` |
| 라벨 | — | 호버 시 `text-xs text-zinc-600` 툴팁 |

---

### 4.5 미팅 관리 (`/meetings`)

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | `border rounded-lg` | `rounded-2xl shadow-md p-6 border-0` |
| 필터 | Select 나열 | 필터 바 v1 패턴 |
| 미팅 카드 | — | `hover:shadow-lg transition-shadow` |
| 유형 배지 | 색상 배지 | L3 아웃라인 배지 |
| 날짜 | 텍스트 | `text-zinc-500 font-mono tabular-nums` |
| Dialog | 기본 | `rounded-2xl shadow-xl p-8` |
| 버튼 | 기본 | `bg-blue-600 shadow-xs active:scale-[0.98]` |

---

### 4.6 미팅노트 (`/meeting-notes`)

#### 4.6.1 카드 그리드

```
데스크톱: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
모바일: grid-cols-1 gap-4
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | `border rounded-lg` | `rounded-2xl shadow-md hover:shadow-lg transition-shadow` |
| 소스 배지 | 파스텔 | L3 아웃라인 (Slack/Fireflies/Manual은 분류) |
| 제목 | `font-semibold` | `text-base font-semibold text-zinc-900` |
| 미리보기 | `text-gray-600` | `text-zinc-500 line-clamp-3` |
| 메타 정보 | `text-gray-400` | `text-zinc-400 text-xs` |
| 프라이빗 | 아이콘 | `bg-amber-50 text-amber-700` 작은 배지 |

#### 4.6.2 MeetingNoteDetail (Modal)

| 요소 | 현재 | 변경 |
|------|------|------|
| 모달 | 기본 Dialog | `rounded-2xl shadow-xl max-w-3xl` |
| 내용 | BasicEditor | `prose prose-zinc` 스타일 |
| 액션 | 하단 버튼 | `border-t border-zinc-100 pt-4` |

---

### 4.7 카테고리 (`/categories`)

#### 4.7.1 3컬럼 레이아웃

```
데스크톱:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Level1       │ │ Level2       │ │ Customers    │
│ shadow-md    │ │ shadow-md    │ │ shadow-md    │
│ rounded-2xl  │ │ rounded-2xl  │ │ rounded-2xl  │
└──────────────┘ └──────────────┘ └──────────────┘

모바일: 아코디언으로 전환
┌──────────────────────────────────┐
│ ▶ Level1 카테고리                 │
├──────────────────────────────────┤
│ ▶ Level2 세부분류                 │
├──────────────────────────────────┤
│ ▶ 고객 목록                      │
└──────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 컬럼 카드 | `border` | `rounded-2xl shadow-md border-0` |
| 항목 호버 | `hover:bg-gray-50` | `hover:bg-zinc-50 rounded-lg` |
| 선택 상태 | `bg-primary/10` | `bg-blue-50 text-blue-700` |
| 슬라이더 | 기본 | `accent-blue-600` |
| 별점 | StarRating | 유지 |

---

### 4.8 계정 관리 (`/accounts`)

| 요소 | 현재 | 변경 |
|------|------|------|
| 대기 카드 | 리스트 | `rounded-2xl shadow-md p-6` 개별 카드 |
| 승인 버튼 | 기본 | `bg-green-700 text-white shadow-xs` |
| 거절 버튼 | destructive | `bg-red-600 text-white shadow-xs` |
| 계정 목록 | 테이블 | Dense 테이블 + 하이브리드 그림자 |
| 역할 배지 | 텍스트 | L2 배지: Master=`bg-blue-100`, User=`bg-zinc-100`, Viewer=`bg-zinc-50` |
| 권한 모달 | Dialog | `rounded-2xl shadow-xl p-8` |

---

### 4.9 설정 (`/settings`, `/settings/deal-config`)

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | `border rounded-lg` | `rounded-2xl shadow-md p-8 border-0` |
| 동기화 버튼 | 기본 | `bg-blue-600 shadow-xs` + 로딩 스피너 |
| 탭 | Tabs | `bg-zinc-100 rounded-xl p-1` 탭 컨테이너 |
| 슬라이더 | 기본 | `accent-blue-600` |
| 저장 버튼 | 기본 | `bg-blue-600 shadow-xs` |
| 배치 계산 | 확인 Dialog | `rounded-2xl shadow-xl` |

---

### 4.10 개선요청 (`/improvement-requests`)

| 요소 | 현재 | 변경 |
|------|------|------|
| 가이드 배너 | `bg-blue-50` | `bg-blue-50 rounded-2xl p-6 border-0` |
| 요청 카드 | `border` | `rounded-2xl shadow-sm hover:shadow-md` |
| 상태 배지 | — | L2: Open=`bg-blue-100`, In Progress=`bg-amber-100`, Done=`bg-green-100` |
| 우선순위 배지 | — | L1: High=`bg-red-600 text-white`, L2: Medium=`bg-amber-100`, L3: Low=`border-zinc-300` |
| 생성 모달 | Dialog | `rounded-2xl shadow-xl p-8` |
| 상세 모달 | Dialog | `rounded-2xl shadow-xl max-w-3xl` |
| 댓글 | — | `bg-zinc-50 rounded-xl p-4 mb-2` |

---

### 4.11 Reno AI 사이드바 (AISidebar)

| 요소 | 현재 | 변경 |
|------|------|------|
| 패널 | `right-0 bg-white` | `shadow-2xl border-0 rounded-l-2xl` |
| 헤더 | — | `bg-blue-600 text-white p-4 rounded-tl-2xl` |
| 토글 버튼 | 로봇 이모지 | `bg-blue-600 text-white rounded-l-xl shadow-lg` |
| 탭 | 기본 | `bg-zinc-100 rounded-lg p-0.5` |
| 활성 탭 | — | `bg-white shadow-sm rounded-md` |
| 메시지 버블 | — | AI: `bg-zinc-100 rounded-2xl p-4`, User: `bg-blue-50 rounded-2xl p-4` |
| 입력 | — | `bg-zinc-100 border-0 rounded-xl` |

---

## 5. 공용 UI 컴포넌트 변경 명세

### 5.1 card.tsx

```diff
- rounded-lg border bg-card
+ rounded-2xl shadow-md bg-white border-0

- CardHeader: p-6
+ CardHeader: p-8 pb-0

- CardContent: p-6 pt-0
+ CardContent: p-8 pt-4

- CardTitle: text-2xl font-semibold
+ CardTitle: text-lg font-semibold text-zinc-900
```

### 5.2 button.tsx

```diff
Primary:
- bg-primary text-primary-foreground
+ bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-xs active:scale-[0.98]

Secondary:
- bg-secondary text-secondary-foreground
+ bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shadow-xs

Ghost:
- hover:bg-accent
+ hover:bg-zinc-100 text-zinc-600

Destructive:
- bg-destructive
+ bg-red-600 hover:bg-red-500 text-white shadow-xs
```

### 5.3 badge.tsx

3개 variant 추가:
- `critical`: `bg-{color}-600 text-white rounded-full font-semibold`
- `status`: `bg-{color}-100 text-{color}-800 rounded-full font-medium`
- `meta`: `border border-zinc-300 text-zinc-600 bg-transparent rounded-full font-normal`

### 5.4 input.tsx

```diff
- border border-input rounded-md
+ border border-zinc-300 rounded-lg bg-white
+ focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20
```

### 5.5 table.tsx

```diff
- <table>
+ <div class="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
+   <table class="w-full">

- <thead>
+ <thead class="bg-zinc-50 border-b border-zinc-200">

- <th>
+ <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-500">

- <tbody>
+ <tbody class="divide-y divide-zinc-100">

- <tr>
+ <tr class="hover:bg-zinc-50 h-[44px]">  /* Dense mode */
```

### 5.6 dialog.tsx

```diff
- rounded-lg border bg-background shadow-lg
+ rounded-2xl border-0 bg-white shadow-xl
```

### 5.7 select.tsx

```diff
- border border-input rounded-md
+ border border-zinc-300 rounded-lg
+ focus:ring-2 focus:ring-blue-600/20

- SelectContent
+ SelectContent: rounded-xl shadow-lg border border-zinc-200
```

### 5.8 dropdown-menu.tsx

```diff
- rounded-md border
+ rounded-xl shadow-lg border border-zinc-100

- DropdownMenuItem
+ DropdownMenuItem: rounded-lg hover:bg-zinc-50
```

### 5.9 skeleton.tsx

```diff
- bg-muted animate-pulse
+ bg-zinc-200 animate-pulse rounded
```

### 5.10 tabs.tsx

```diff
- TabsList
+ TabsList: bg-zinc-100 rounded-xl p-1

- TabsTrigger
+ TabsTrigger: rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm
```

---

## 6. 모바일 반응형 전략

### 6.1 Breakpoint 전략

| Breakpoint | 사이드바 | 테이블 | 카드 패딩 | 그리드 |
|------------|---------|--------|-----------|--------|
| < 640px | 숨김 (슬라이드) | 카드 리스트 | p-5 | 1열 |
| 640-767px | 숨김 | 카드 리스트 | p-5 | 1-2열 |
| 768-1023px | 숨김 | 테이블 (스크롤) | p-6 | 2열 |
| 1024px+ | 고정 표시 | 테이블 | p-8 | 2-4열 |

### 6.2 페이지별 모바일 전환

| 페이지 | 데스크톱 | 모바일 |
|--------|---------|--------|
| 대시보드 | 4열 KPI + 3열 차트 | 1열 스택 |
| 고객 목록 | Dense 테이블 | 카드 리스트 |
| 고객 상세 | 2컬럼 | 1컬럼 + 탭 전환 |
| 미팅노트 | 3열 카드 | 1열 카드 |
| 카테고리 | 3컬럼 | 아코디언 |
| AI 사이드바 | 우측 패널 | 전체 오버레이 |

### 6.3 터치 타겟

- 모든 버튼/링크: 최소 `44px` 터치 영역
- 테이블 행: `48px` 이상 (모바일 카드 시)
- 아이콘 버튼: `w-10 h-10` 최소

---

## 7. 애니메이션

### 7.1 적용 대상

| 요소 | 애니메이션 | 지속시간 |
|------|-----------|---------|
| 카드 호버 | shadow 확대 | 200ms ease |
| 버튼 클릭 | scale(0.98) | 100ms |
| 모달 열기 | scale-in (0.95→1) | 200ms ease-out |
| 사이드바 | translateX | 300ms ease |
| 페이지 진입 | fade-in + slide-up | 300ms ease-out |
| 아코디언 | height 전환 | 200ms ease-out |
| 필터 칩 | fade-in | 150ms |

### 7.2 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. 접근성

### 8.1 포커스 관리

- 모든 인터랙티브 요소: `focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:ring-offset-2`
- 모달 열기: 첫 번째 인터랙티브 요소로 포커스 이동
- 모달 닫기: 트리거 요소로 포커스 복원
- Tab 순서: 논리적 순서 유지

### 8.2 색상 대비 (WCAG AA)

- 본문 텍스트: zinc-900 on white → 21:1 비율
- 보조 텍스트: zinc-500 on white → 5.6:1 비율
- 배지 텍스트: green-800 on green-100 → 5.3:1 비율
- L1 배지: white on red-600 → 4.6:1 비율

---

## 9. 구현 우선순위

### Phase 1: 인프라 (필수 선행)
1. `globals.css` CSS 변수 교체
2. `tailwind.config.ts` 확장

### Phase 2: 공용 UI 컴포넌트 (10개)
3. card.tsx, button.tsx, badge.tsx
4. input.tsx, table.tsx, dialog.tsx
5. select.tsx, dropdown-menu.tsx, skeleton.tsx, tabs.tsx

### Phase 3: 레이아웃
6. Sidebar, Header, DashboardLayout

### Phase 4: 주요 페이지
7. 대시보드 (StatCard, 차트, 위젯)
8. 고객 목록 (필터 바, 배지 전환, Dense 테이블)
9. 고객 상세 (아코디언, 2컬럼, AI 탭)

### Phase 5: 나머지 페이지
10. 미팅, 미팅노트, 카테고리
11. 계정, 설정, 개선요청

### Phase 6: AI 사이드바
12. AISidebar 재스타일링

### Phase 7: 모바일 반응형
13. 테이블 → 카드 전환
14. 3컬럼 → 아코디언 전환
15. 사이드바 슬라이드 + AI 오버레이

---

## 10. 검증 방법

### 시각적 확인
1. `npm run dev` → `localhost:3010/saleshub`
2. Chrome DevTools → Network 탭에서 API 경로 확인
3. 카드: 테두리 없이 그림자만으로 분리 확인
4. 배지: L1/L2/L3 단계별 시각적 차이 확인
5. 테이블: Dense 모드 (44px 행) 확인

### 모바일 확인
6. Chrome DevTools → 모바일 에뮬레이터 (iPhone 14 Pro, Galaxy S23)
7. 테이블 → 카드 리스트 전환 확인
8. 터치 타겟 44px 확인
9. 사이드바 슬라이드 동작 확인

### 접근성 확인
10. Tab 키로 모든 인터랙티브 요소 접근 가능
11. Lighthouse 접근성 점수 90+ 목표
12. 색상 대비 WCAG AA 준수

---

마지막 업데이트: 2026. 02. 07.
