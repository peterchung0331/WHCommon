# StrategyHub 디자인 기획

> 디자인 시스템 v1.0 (B3: Warm Elevated) 기반 StrategyHub 전체 페이지 리디자인

---

## 1. 개요

### 1.1 목표
- 디자인 시스템 v1.0 적용 (zinc 기반, 그림자 중심)
- **"뷰어 퍼스트" UX 원칙** 유지: 80% 조회, 20% 입력
- 기존 15개 페이지 + 12개 컴포넌트 리디자인
- TopNav 기반 레이아웃 (사이드바 없음) 유지
- 모바일 반응형 강화

### 1.2 허브 색상
- **Primary**: rose-600 (`#E11D48`) — StrategyHub 고유
- **Primary Light**: rose-50 (`#FFF1F2`)
- **Primary Hover**: rose-500 (`#F43F5E`)
- **Primary Pressed**: rose-700 (`#BE123C`)

> **주의**: error red-600과 구분하기 위해 rose 계열 사용. red-600은 에러/위험 전용.

### 1.3 현재 상태
| 구분 | 상태 | 설명 |
|------|------|------|
| 페이지 | 15개 구현 | 모든 라우트 존재 |
| 컴포넌트 | 12개 | TopNav, ProjectCard, ClarifyChat 등 |
| UI 라이브러리 | shadcn/ui 3개 | button, card, input |
| 프론트엔드 완성도 | ~90% | FeedbackForm 미배포, 컨텍스트 관리 stub |

### 1.4 변경 범위
| 구분 | 파일 수 | 설명 |
|------|---------|------|
| 인프라 | 2 | globals.css, tailwind.config.ts |
| UI 컴포넌트 | 3+α | button, card, input + 신규 추가 |
| 도메인 컴포넌트 | 12 | 모든 기존 컴포넌트 |
| 페이지 | 15 | 모든 페이지 |
| 신규 추가 | 5+ | badge, table, dialog, select, skeleton 등 |

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

  /* Primary (StrategyHub = rose) */
  --primary: 347 77% 50%;       /* #E11D48 rose-600 */
  --primary-50: 356 100% 97%;   /* #FFF1F2 */
  --primary-100: 356 100% 95%;  /* #FFE4E6 */
  --primary-500: 350 89% 60%;   /* #F43F5E rose-500 */
  --primary-600: 347 77% 50%;   /* #E11D48 */
  --primary-700: 345 83% 41%;   /* #BE123C */
  --primary-foreground: 0 0% 100%;

  /* Semantic */
  --success: 142 71% 29%;       /* green-700 */
  --warning: 32 95% 44%;        /* amber-700 */
  --error: 0 72% 51%;           /* red-600 ← rose-600과 다름! */
  --info: 217 91% 60%;          /* blue-600 */

  /* Surface */
  --border: 240 6% 90%;         /* zinc-200 */
  --input: 240 6% 90%;
  --ring: 347 77% 50%;          /* rose-600 */
  --radius: 0.5rem;

  /* Shadow */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.15);

  /* Chart — rose 기반 변형 */
  --chart-1: 347 77% 50%;    /* rose-600 */
  --chart-2: 142 71% 45%;    /* green-600 */
  --chart-3: 217 91% 60%;    /* blue-600 */
  --chart-4: 32 95% 44%;     /* amber-600 */
  --chart-5: 262 83% 58%;    /* violet-500 */
}
```

### 2.2 tailwind.config.ts — 확장

```typescript
theme: {
  extend: {
    colors: {
      'bg-base': 'hsl(var(--bg-base))',
      'bg-card': 'hsl(var(--bg-card))',
      'bg-subtle': 'hsl(var(--bg-subtle))',
      primary: {
        50: 'hsl(var(--primary-50))',
        100: 'hsl(var(--primary-100))',
        500: 'hsl(var(--primary-500))',
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
    fontFamily: {
      sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
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

## 3. 레이아웃 변경

### 3.1 전체 구조

StrategyHub는 **사이드바 없이 TopNav만 사용**하는 구조.

```
┌──────────────────────────────────────────────────┐
│ TopNav (sticky, h-16, shadow-xs)                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  메인 콘텐츠 (bg-zinc-100)                        │
│  max-w-6xl mx-auto px-4 py-8                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 3.2 TopNav (`components/TopNav.tsx`)

| 항목 | 현재 | 변경 |
|------|------|------|
| 배경 | `bg-white border-b` | `bg-white shadow-xs border-0` |
| 높이 | — | `h-16` |
| 로고 | 텍스트 "StrategyHub" | `text-lg font-semibold text-zinc-900` |
| 네비게이션 | `text-gray-600` | `text-zinc-600 hover:text-zinc-900` |
| 활성 항목 | `bg-blue-50 text-blue-700` | `bg-rose-50 text-rose-700 rounded-lg font-medium` |
| 버튼 | `bg-primary` | `bg-rose-600 hover:bg-rose-500 text-white shadow-xs rounded-lg` |
| 모바일 | — | 햄버거 메뉴 → 드롭다운 |

### 3.3 페이지 배경

**현재**: `bg-white` (암시적)
**변경**: `bg-zinc-100` (명시적, layout.tsx에 설정)

---

## 4. 페이지별 디자인 기획

### 4.1 홈 페이지 (`/`)

**현재**: 4개 기능 소개 카드 + 링크
**변경**: 대시보드 스타일 인트로

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  StrategyHub                                     │
│  AI 기반 전략 기획 플랫폼                          │
│                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│ │ 전략 기획 │ │ AI 리서치│ │ 자동 검증│ │ 승인  │ │
│ │ shadow-md│ │ shadow-md│ │ shadow-md│ │ s-md │ │
│ │ 아이콘   │ │ 아이콘   │ │ 아이콘   │ │ 아이콘│ │
│ │ 설명     │ │ 설명     │ │ 설명     │ │ 설명  │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
│                                                  │
│  [새 프로젝트 시작 →]   [프로젝트 보기 →]          │
│                                                  │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 제목 | `text-3xl font-bold` | `text-2xl font-semibold text-zinc-900` |
| 부제 | `text-gray-500` | `text-zinc-500` |
| 카드 | `border` | `rounded-2xl shadow-md hover:shadow-lg p-8 border-0` |
| 아이콘 | 기본 | `text-rose-600 w-8 h-8 mb-4` |
| 버튼 | 기본 | `bg-rose-600 hover:bg-rose-500 text-white shadow-xs rounded-lg` |
| 보조 링크 | — | `text-rose-600 hover:text-rose-500` |

---

### 4.2 프로젝트 목록 (`/projects`)

**현재**: 3열 카드 그리드
**변경**: 필터 + 3열 카드 그리드

```
┌──────────────────────────────────────────────────┐
│ 프로젝트                     [+ 새 프로젝트]      │
│                                                  │
│ [🔍 검색...]  [타입 ▾]  [상태 ▾]  [정렬 ▾]      │
│                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ProjectCard│ │ProjectCard│ │ProjectCard│         │
│ └──────────┘ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ProjectCard│ │ProjectCard│ │ProjectCard│         │
│ └──────────┘ └──────────┘ └──────────┘          │
└──────────────────────────────────────────────────┘
```

#### 4.2.1 필터 바 (신규 추가)

| 요소 | 설명 |
|------|------|
| 검색 | `bg-zinc-100 border-0 rounded-lg` |
| 타입 필터 | new-business, strategy, partnership, regulatory, other |
| 상태 필터 | 진행중, 완료, 실패 |
| 정렬 | 최신순, 이름순 |

#### 4.2.2 ProjectCard 리디자인

| 요소 | 현재 | 변경 |
|------|------|------|
| 카드 | `Card (border)` | `rounded-2xl shadow-md hover:shadow-lg p-6 border-0` |
| 프로젝트명 | `text-lg` | `text-base font-semibold text-zinc-900` |
| 상태 배지 | `bg-{color}-100 text-{color}-800` | L2 배지 시스템 적용 |
| 타입 라벨 | 텍스트 | L3 메타 배지: `border border-zinc-300 text-zinc-600` |
| 설명 | `text-gray-500` | `text-zinc-500 line-clamp-2` |
| 현재 단계 | 텍스트 | `text-rose-600 font-medium` |
| 토큰 사용량 | 텍스트 | `text-zinc-400 text-xs font-mono tabular-nums` |
| 생성일 | `text-gray-400` | `text-zinc-400 text-xs` |
| 삭제 버튼 | destructive | `ghost text-zinc-400 hover:text-red-600` |

**프로젝트 상태 배지** (L2):
| 상태 | 스타일 |
|------|--------|
| 진행중 (clarifying~reviewing) | `bg-rose-100 text-rose-800` |
| 승인 대기 | `bg-amber-100 text-amber-800` |
| 완료 | `bg-green-100 text-green-800` |
| 실패 | `bg-red-100 text-red-800` (L1: `bg-red-600 text-white`) |

**프로젝트 타입 배지** (L3):
| 타입 | 스타일 |
|------|--------|
| 신사업 | `border border-rose-300 text-rose-600` |
| 전략 | `border border-zinc-300 text-zinc-600` |
| 파트너십 | `border border-zinc-300 text-zinc-600` |
| 규제 | `border border-zinc-300 text-zinc-600` |
| 기타 | `border border-zinc-300 text-zinc-600` |

---

### 4.3 프로젝트 생성 (`/projects/new`)

**2단계 폼: 기본정보 → 요건 구체화 (ClarifyChat)**

```
Step 1: 기본정보
┌──────────────────────────────────────────────────┐
│ 새 프로젝트 만들기                                │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ 프로젝트 이름                               │   │
│ │ [                                       ]  │   │
│ │                                            │   │
│ │ 프로젝트 타입                               │   │
│ │ [신사업 ▾]                                 │   │
│ │                                            │   │
│ │ 초기 설명 (선택)                            │   │
│ │ [                                       ]  │   │
│ │                                            │   │
│ │           [다음 →]                          │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘

Step 2: ClarifyChat (인라인)
┌──────────────────────────────────────────────────┐
│ 요건 구체화                    응답률: ████ 75%   │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ AI 질문 카드 (Q1)                          │   │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│ │ │ 옵션 A  │ │ 옵션 B  │ │ 직접입력│      │   │
│ │ └─────────┘ └─────────┘ └─────────┘      │   │
│ ├────────────────────────────────────────────┤   │
│ │ AI 질문 카드 (Q2) ...                      │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│  [← 이전]   [건너뛰기]   [프로젝트 시작 →]       │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 폼 카드 | 기본 Card | `rounded-2xl shadow-md p-8 border-0 max-w-2xl mx-auto` |
| 입력 필드 | `border` | `border-zinc-300 rounded-lg focus:ring-2 focus:ring-rose-600/20` |
| 타입 선택 | Select | `border-zinc-300 rounded-lg` |
| 진행 바 | — | **신규**: Step 1/2 인디케이터, `bg-rose-600` 바 |
| 버튼 | 기본 | `bg-rose-600 shadow-xs active:scale-[0.98]` |

---

### 4.4 프로젝트 상세 (`/projects/[id]`)

**메인 대시보드: StageProgress + 단계별 결과 링크 + 메타 정보**

```
┌──────────────────────────────────────────────────┐
│ [← 목록]  프로젝트명           [상태 배지]        │
│ 타입: 신사업 · 생성: 2026.02.05                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ StageProgress (가로 진행률 바)              │   │
│ │ ○──○──●──○──○──○──○──○──○                  │   │
│ │ clarify research validate plan approval    │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ 리서치   │ │ 검증     │ │ 기획안   │          │
│ │ 결과 →   │ │ 결과 →   │ │ 보기 →   │          │
│ │ 3건     │ │ 82점    │ │ v2      │          │
│ └──────────┘ └──────────┘ └──────────┘          │
│                                                  │
│ 토큰 사용량: 12,450 · 소요시간: 3분 24초          │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 헤더 | `text-3xl font-bold` | `text-xl font-semibold text-zinc-900` |
| 메타 정보 | `text-gray-500` | `text-zinc-500 text-sm` |
| StageProgress | 기존 컴포넌트 | 리디자인 (아래 참조) |
| 결과 카드 | — | `rounded-2xl shadow-md hover:shadow-lg p-6 border-0` |
| 토큰 정보 | `text-gray-500` | `text-zinc-400 font-mono tabular-nums text-xs` |
| 폴링 인디케이터 | 스피너 | 작은 `bg-rose-600 animate-pulse` 점 |

---

### 4.5 StageProgress 컴포넌트 리디자인

**현재**: 수평 노드 + 커넥터 라인
**변경**: 더 세련된 스텝 바

```
  ✓ ──── ✓ ──── ● ──── ○ ──── ○ ──── ○
clarify  research  validate  plan  review  approval
```

| 노드 상태 | 현재 | 변경 |
|-----------|------|------|
| 완료 | ✓ 초록 | `bg-green-600 text-white rounded-full w-8 h-8` + ✓ 아이콘 |
| 진행중 | 파란 + ring | `bg-rose-600 text-white rounded-full w-8 h-8 ring-4 ring-rose-100` |
| 실패 | ✗ 빨강 | `bg-red-600 text-white rounded-full w-8 h-8` + X 아이콘 |
| 대기 | 회색 | `bg-zinc-200 text-zinc-400 rounded-full w-8 h-8` |
| 커넥터 (완료) | — | `h-0.5 bg-green-600` |
| 커넥터 (대기) | — | `h-0.5 bg-zinc-200` |
| 재시도 배지 | orange | L2: `bg-amber-100 text-amber-800 text-xs` |
| 라벨 | 텍스트 | `text-xs text-zinc-500 mt-2` |

**모바일**: 세로(vertical) 레이아웃 전환
```
● clarify — 완료
│
● research — 완료
│
◉ validate — 진행중 (재시도 2회)
│
○ plan — 대기
│
○ review — 대기
│
○ approval — 대기
```

---

### 4.6 ClarifyChat 리디자인

**가장 복잡한 컴포넌트 (1063줄). 스타일만 변경, 로직 유지.**

```
┌──────────────────────────────────────────────────┐
│ 요건 구체화                   응답률: ████░ 75%   │
│ 5개 질문 중 4개 응답                              │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ Q1: 주요 타겟 시장은?       [완료 ✓]       │   │
│ │ ────────────────────────────────────────── │   │
│ │ [● 국내 금융]  [○ 해외 금융]  [○ 직접입력] │   │
│ │                                            │   │
│ │ 💭 왜 이 질문? (토글)                       │   │
│ │ > AI가 시장 분석 범위를 좁히기 위해...      │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ Q2: 예상 예산 규모는?       [응답 대기]     │   │
│ │ ...                                        │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ [추가 질문 요청]        [완료 — 프로젝트 시작 →]  │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 컨테이너 | 기본 | `max-w-3xl mx-auto` |
| 질문 카드 | 기본 border | `rounded-2xl shadow-sm hover:shadow-md p-6 border-0 mb-4` |
| 응답 완료 카드 | — | `bg-zinc-50 rounded-2xl p-6 border-0` (약간 그레이) |
| 선택지 버튼 | 기본 | `rounded-xl border-zinc-300 hover:border-rose-600 hover:bg-rose-50` |
| 선택된 버튼 | — | `bg-rose-600 text-white border-rose-600 shadow-xs` |
| 직접 입력 | textarea | `border-zinc-300 rounded-lg focus:ring-2 focus:ring-rose-600/20` |
| 진행률 바 | 기본 | `bg-zinc-200 rounded-full h-2` + `bg-rose-600 rounded-full` |
| Thinking 토글 | 텍스트 | `text-zinc-400 hover:text-zinc-600 text-xs` |
| Thinking 내용 | — | `bg-zinc-50 rounded-lg p-4 text-zinc-500 text-sm` |
| 완료 버튼 | 기본 | `bg-rose-600 text-white shadow-xs` |

---

### 4.7 리서치 결과 (`/projects/[id]/research`)

```
┌──────────────────────────────────────────────────┐
│ [← 프로젝트]  리서치 결과                         │
│                                                  │
│ ┌──────────────┐ ┌──────────────┐               │
│ │ 웹 리서치    │ │ 금융 규제     │               │
│ │ (shadow-md)  │ │ (shadow-md)  │               │
│ │ 3건 수집     │ │ 2건 수집     │               │
│ │ [상세 보기 →]│ │ [상세 보기 →]│               │
│ └──────────────┘ └──────────────┘               │
│ ┌──────────────┐ ┌──────────────┐               │
│ │ 문서 분석    │ │ 시장 분석     │               │
│ │ ...          │ │ ...          │               │
│ └──────────────┘ └──────────────┘               │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ 리서치 상세 (확장형)                        │   │
│ │ 출처, 요약, 날짜, 신뢰도                    │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 리서처 카드 | 기본 스타일 | `rounded-2xl shadow-md p-6 border-0` |
| 리서처 타입 | 텍스트 | L3 배지: `border border-zinc-300 text-zinc-600` |
| 건수 | 텍스트 | `text-2xl font-bold font-mono text-zinc-900` |
| 상세 내용 | 평문 | `bg-zinc-50 rounded-xl p-6` 카드 내부 |
| 출처 링크 | — | `text-rose-600 hover:underline` |
| 신뢰도 표시 | — | ScoreGauge 소형 버전 |

---

### 4.8 아이디어 목록 (`/projects/[id]/ideas`)

> **신사업 타입에만 표시**

```
┌──────────────────────────────────────────────────┐
│ 아이디어 선택                    [2/5 선택됨]     │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ □ 아이디어 1: 디지털 자산 수탁 서비스       │   │
│ │   스코어: 85점 · 카테고리: 신사업           │   │
│ │   [설명 펼치기 ▾]                           │   │
│ ├────────────────────────────────────────────┤   │
│ │ ■ 아이디어 2: 가상자산 규제 컨설팅 (선택됨) │   │
│ │   스코어: 92점 · 카테고리: 규제             │   │
│ │   [설명 접기 ▴]                             │   │
│ │   > 가상자산 사업자 등록 관련...            │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ [선택 완료 — 리서치 시작 →]                       │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 아이디어 항목 | 카드 | `rounded-xl shadow-sm border border-zinc-200 p-5` |
| 선택된 항목 | 파란 배경 | `border-rose-600 bg-rose-50 shadow-md` |
| 스코어 | 텍스트 | `font-mono font-bold text-rose-600` |
| 체크박스 | 기본 | `accent-rose-600 w-5 h-5` |
| 펼침 | 텍스트 | `text-zinc-400 hover:text-zinc-600` |
| 확인 버튼 | 기본 | `bg-rose-600 text-white shadow-xs` |

---

### 4.9 검증 상세 (`/projects/[id]/validation`)

**5-Layer 게이지 + 이슈 목록 + 재시도 타임라인**

```
┌──────────────────────────────────────────────────┐
│ 검증 결과                    총점: 82/100         │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ ScoreGauge × 5 (5-Layer)                   │   │
│ │                                            │   │
│ │ Rule-based    ████████░░ 85/100            │   │
│ │ Consistency   ███████░░░ 78/100            │   │
│ │ Grounding     ████████░░ 88/100            │   │
│ │ Freshness     ██████░░░░ 72/100            │   │
│ │ Cross-model   ████████░░ 82/100            │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────┐ ┌─────────────────────┐    │
│ │ 이슈 목록        │ │ 재시도 타임라인      │    │
│ │ (shadow-md)      │ │ (RetryTimeline)     │    │
│ │ L1/L2 배지       │ │ (shadow-md)         │    │
│ └──────────────────┘ └─────────────────────┘    │
└──────────────────────────────────────────────────┘
```

#### 4.9.1 ScoreGauge 리디자인

| 요소 | 현재 | 변경 |
|------|------|------|
| 바 배경 | 기본 | `bg-zinc-200 rounded-full h-3` |
| 바 채움 | 자동 색상 | 점수별: >=90 green-600, >=70 rose-600, >=50 amber-600, <50 red-600 |
| 점수 | 숫자 | `font-mono font-bold tabular-nums` |
| 라벨 | 텍스트 | `text-sm font-medium text-zinc-700` |
| 컨테이너 | — | `bg-white rounded-2xl shadow-md p-8 border-0` |

#### 4.9.2 이슈 목록

| 요소 | 변경 |
|------|------|
| 컨테이너 | `rounded-2xl shadow-md p-6 border-0` |
| 이슈 항목 | `border-l-4 border-{severity} pl-4 py-3` |
| Critical 이슈 | `border-l-red-600` + L1 배지 |
| Warning 이슈 | `border-l-amber-600` + L2 배지 |
| Info 이슈 | `border-l-blue-600` + L2 배지 |

#### 4.9.3 RetryTimeline 리디자인

| 요소 | 현재 | 변경 |
|------|------|------|
| 컨테이너 | 기본 | `rounded-2xl shadow-md p-6 border-0` |
| 노드 (PASS) | 초록 | `bg-green-600 text-white w-6 h-6 rounded-full` |
| 노드 (FAIL) | 빨강 | `bg-red-600 text-white w-6 h-6 rounded-full` |
| 연결선 | 기본 | `w-0.5 bg-zinc-200 h-8` |
| 점수 | 텍스트 | `font-mono font-bold` |
| PASS/FAIL 배지 | — | L2 배지 |
| 시간 | `text-gray-400` | `text-zinc-400 text-xs` |

---

### 4.10 기획안 (`/projects/[id]/plan`)

**마크다운 렌더링 + 메타 정보 + 다운로드**

```
┌──────────────────────────────────────────────────┐
│ 기획안 (v2)                   [다운로드] [비교]    │
│ 프로젝트명 · 최종 수정: 2026.02.05               │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ MarkdownViewer                             │   │
│ │ (shadow-md rounded-2xl p-8)               │   │
│ │                                            │   │
│ │ # 1. 서론                                  │   │
│ │ ## 1.1 배경                                │   │
│ │ ...                                        │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ FeedbackForm (신규 배포)                    │   │
│ │ ★★★★☆ · 태그 · 의견                        │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 메인 카드 | 기본 | `rounded-2xl shadow-md border-0` |
| 마크다운 | 기존 MarkdownViewer | `prose prose-zinc` 기반 리스타일 |
| h1 | `text-2xl border-b` | `text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-3` |
| h2 | `text-xl` | `text-lg font-semibold text-zinc-800` |
| blockquote | 파란 좌측 바 | `border-l-4 border-rose-300 bg-rose-50 pl-4 py-2` |
| 코드 블록 | 검정 배경 | `bg-zinc-900 text-zinc-100 rounded-xl p-4` |
| 테이블 | 기본 | `border-zinc-200 rounded-lg overflow-hidden` |
| 버전 배지 | — | L3 메타: `border border-zinc-300 text-zinc-600` |

---

### 4.11 승인 페이지 (`/projects/[id]/approval`)

```
┌──────────────────────────────────────────────────┐
│ 기획안 승인                                       │
│                                                  │
│ ┌──────────────────┐ ┌─────────────────────┐    │
│ │ 리뷰 결과        │ │ 검증 요약            │    │
│ │ (shadow-md)      │ │ (shadow-md)         │    │
│ │                  │ │                     │    │
│ │ 점수: 88/100     │ │ 5-Layer 미니 게이지  │    │
│ │ 강점 3개         │ │ 총점: 82            │    │
│ │ 개선점 2개       │ │                     │    │
│ └──────────────────┘ └─────────────────────┘    │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ 기획안 미리보기 (축약)                      │   │
│ │ [전문 보기 →]                               │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ 승인 의견 (textarea)                        │   │
│ │ [                                       ]  │   │
│ │                                            │   │
│ │        [반려]              [승인 ✓]         │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 리뷰 카드 | 기본 | `rounded-2xl shadow-md p-6 border-0` |
| 리뷰 점수 | 텍스트 | KPI 표준: `text-3xl font-bold font-mono` |
| 강점/개선점 | 리스트 | 녹색/황색 좌측 바 항목 |
| 승인 버튼 | 기본 | `bg-green-700 text-white shadow-xs px-8 py-3 rounded-xl` |
| 반려 버튼 | destructive | `bg-red-600 text-white shadow-xs px-8 py-3 rounded-xl` |
| 의견 입력 | textarea | `border-zinc-300 rounded-xl focus:ring-2 focus:ring-rose-600/20` |

---

### 4.12 버전 비교 (`/projects/[id]/compare`)

| 요소 | 현재 | 변경 |
|------|------|------|
| 컨테이너 | 기본 | `rounded-2xl shadow-md border-0 overflow-hidden` |
| Added 행 | 초록 배경 | `bg-green-50 text-green-900` |
| Removed 행 | 빨강 배경 | `bg-red-50 text-red-900` |
| Same 행 | 흰색 | `bg-white text-zinc-700` |
| 라인 번호 | 좌측 | `text-zinc-400 font-mono text-xs w-12` |
| 코드 폰트 | — | `font-mono text-sm` |

---

### 4.13 인사이트 (`/insights`)

**모든 프로젝트의 결과물 통합 조회**

```
┌──────────────────────────────────────────────────┐
│ 인사이트                                         │
│                                                  │
│ [🔍 검색...]  [타입 ▾]  [상태 ▾]  [기간 ▾]      │
│                                                  │
│ 타임라인 형태 또는 카드 그리드                      │
│ ┌────────────────────────────────────────────┐   │
│ │ 프로젝트 A — 기획안 승인됨                   │   │
│ │ 2026.02.05 · 리뷰점수 88 · 검증 82         │   │
│ │ [기획안 보기 →]                              │   │
│ ├────────────────────────────────────────────┤   │
│ │ 프로젝트 B — 검증 완료                       │   │
│ │ 2026.02.03 · 검증점수 75 · 이슈 3건         │   │
│ │ [검증 보기 →]                               │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 필터 바 | 기본 | 필터 바 v1 표준 적용 |
| 카드 | 기본 | `rounded-2xl shadow-sm hover:shadow-md p-6 border-0` |
| 프로젝트명 | 텍스트 | `font-semibold text-zinc-900` |
| 상태 | 텍스트 | L2 배지 |
| 점수 | 텍스트 | `font-mono font-bold text-rose-600` |
| 링크 | — | `text-rose-600 hover:text-rose-500` |
| 타임라인 연결선 | — | `border-l-2 border-zinc-200 ml-4` |

---

### 4.14 리서치 아카이브 (`/archive`)

```
┌──────────────────────────────────────────────────┐
│ 리서치 아카이브                                   │
│                                                  │
│ [🔍 키워드...]  [도메인 ▾]  [기간 ▾]  [타입 ▾]   │
│                                                  │
│ Dense 테이블 (하이브리드 그림자)                    │
│ ┌────────────────────────────────────────────┐   │
│ │ 제목    │ 도메인│ 프로젝트│ 날짜│ 신뢰도    │   │
│ │─────────┼──────┼────────┼────┼─────────│   │
│ │ ...     │ ...  │ ...    │ ...│ ████ 85 │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 필터 | 기본 | 필터 바 v1 |
| 테이블 | 기본 | Dense 모드 + `shadow-sm border border-zinc-200` |
| 신뢰도 | 텍스트 | ScoreGauge 미니 (inline) |
| 도메인 | 텍스트 | L3 배지 |
| 프로젝트 | 링크 | `text-rose-600 hover:underline` |

---

### 4.15 학습 대시보드 (`/learning`)

```
┌──────────────────────────────────────────────────┐
│ 학습 대시보드                                     │
│                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ 평균 평점 │ │ 재시도   │ │ 성공률   │          │
│ │ 4.2/5.0  │ │ 평균 1.3 │ │ 87%     │  KPI 표준 │
│ └──────────┘ └──────────┘ └──────────┘          │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ 30일 추이 차트 (Line/Bar)                   │   │
│ │ 차트 색상: rose-600 메인                    │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────┐ ┌─────────────────────┐    │
│ │ Top 3 장점       │ │ Top 3 개선 영역      │    │
│ │ 정확성, 출처, ... │ │ 깊이, 최신성, ...    │    │
│ └──────────────────┘ └─────────────────────┘    │
└──────────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| KPI 카드 | 텍스트 | KPI 카드 표준 (값 + 델타 + 기준) |
| 차트 | 없음 (텍스트) | **신규**: Chart.js 또는 Recharts, rose-600 기반 |
| Top 3 카드 | 텍스트 | `rounded-2xl shadow-md p-6` + 순위 배지 |
| 순위 | 없음 | `bg-rose-600 text-white w-6 h-6 rounded-full text-xs` |

---

### 4.16 컨텍스트 관리 (`/admin/contexts`)

**현재: stub (미구현). 디자인 기획과 함께 UI 설계.**

```
┌──────────────────────────────────────────────────┐
│ 컨텍스트 관리                                     │
│                                                  │
│ [L1 전사] [L2 문서타입] [L3 프로젝트]   ← 탭    │
│                                                  │
│ L1 전사 컨텍스트:                                 │
│ ┌────────────────────────────────────────────┐   │
│ │ 회사 방향                                   │   │
│ │ [텍스트 에디터]                              │   │
│ │                                            │   │
│ │ 금지 영역                                   │   │
│ │ [텍스트 에디터]                              │   │
│ │                                            │   │
│ │ 기본 원칙                                   │   │
│ │ [텍스트 에디터]                              │   │
│ │                                            │   │
│ │ [저장]                 마지막 수정: 3일 전   │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ L2 문서타입 컨텍스트:                             │
│ ┌────────────────────────────────────────────┐   │
│ │ [신사업 ▾]                                  │   │
│ │ 시장 기회: [에디터]                          │   │
│ │ 역량 평가: [에디터]                          │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 탭 | `bg-zinc-100 rounded-xl p-1`, 활성: `bg-white shadow-sm` |
| 에디터 카드 | `rounded-2xl shadow-md p-6 border-0` |
| 텍스트 에디터 | `border-zinc-300 rounded-lg min-h-[120px]` |
| 저장 버튼 | `bg-rose-600 text-white shadow-xs` |
| 타임스탬프 | `text-zinc-400 text-xs` |

---

## 5. FeedbackForm 배포 기획

**현재**: 컴포넌트 존재하나 어디에도 마운트되지 않음
**변경**: 5개 결과 페이지에 인라인 배치

### 5.1 배치 위치

| 페이지 | 위치 | 트리거 |
|--------|------|--------|
| `/projects/[id]/ideas` | 아이디어 선택 완료 후 | 선택 완료 버튼 클릭 |
| `/projects/[id]/research` | 리서치 결과 하단 | 페이지 로드 |
| `/projects/[id]/validation` | 검증 결과 하단 | 페이지 로드 |
| `/projects/[id]/approval` | 승인/반려 후 | 액션 완료 |
| `/projects/[id]/plan` (완료 시) | 기획안 하단 | completed 상태 |

### 5.2 FeedbackForm 리디자인

```
┌────────────────────────────────────────────┐
│ 이 결과가 도움이 되었나요?                   │
│                                            │
│ ☆ ☆ ☆ ☆ ☆                                 │
│                                            │
│ 도움이 된 점:                               │
│ [정확성] [출처] [제안] [구조]               │
│                                            │
│ 개선 영역:                                  │
│ [깊이] [최신성] [경쟁사] [실현 가능성]       │
│                                            │
│ 추가 의견 (선택):                            │
│ [                                       ]  │
│                                            │
│ [제출]                                      │
└────────────────────────────────────────────┘
```

| 요소 | 현재 | 변경 |
|------|------|------|
| 컨테이너 | 기본 | `bg-zinc-50 rounded-2xl p-6 border-0 mt-8` |
| 별점 | 기본 | `text-amber-500 w-8 h-8` 호버 미리보기 |
| 태그 | 기본 | `rounded-full border border-zinc-300 px-3 py-1` |
| 선택된 태그 | — | `bg-rose-600 text-white border-rose-600` |
| textarea | 기본 | `border-zinc-300 rounded-lg focus:ring-2 focus:ring-rose-600/20` |
| 제출 후 | alert | `bg-green-50 rounded-xl p-4 text-green-800` 성공 메시지 |

---

## 6. 신규 UI 컴포넌트 추가

현재 StrategyHub는 button, card, input 3개의 shadcn/ui 컴포넌트만 보유.
디자인 시스템 적용을 위해 추가 필요:

### 6.1 추가 목록

| 컴포넌트 | 용도 | 우선순위 |
|---------|------|---------|
| `badge.tsx` | 3단계 배지 시스템 | 필수 |
| `table.tsx` | Dense 테이블 (아카이브) | 필수 |
| `dialog.tsx` | 모달 (확인, 피드백) | 필수 |
| `select.tsx` | 필터 드롭다운 | 필수 |
| `tabs.tsx` | 컨텍스트 관리 탭 | 필수 |
| `skeleton.tsx` | 로딩 상태 | 권장 |
| `dropdown-menu.tsx` | TopNav 모바일 메뉴 | 권장 |
| `textarea.tsx` | 피드백 입력 | 권장 |
| `tooltip.tsx` | StageProgress 정보 | 선택 |
| `accordion.tsx` | 모바일 레이아웃 전환 | 선택 |

### 6.2 badge.tsx 스펙

```typescript
type BadgeVariant = 'critical' | 'status' | 'meta';
type BadgeColor = 'rose' | 'green' | 'amber' | 'red' | 'blue' | 'zinc';

// L1 Critical: bg-{color}-600 text-white
// L2 Status: bg-{color}-100 text-{color}-800
// L3 Meta: border border-zinc-300 text-zinc-600
```

---

## 7. 모바일 반응형 전략

### 7.1 레이아웃 전환

| Breakpoint | TopNav | 콘텐츠 | 그리드 |
|------------|--------|--------|--------|
| < 640px | 햄버거 메뉴 | 1열 | 1열 |
| 640-767px | 햄버거 | 1열 | 1-2열 |
| 768-1023px | 전체 네비 | `max-w-4xl` | 2열 |
| 1024px+ | 전체 네비 | `max-w-6xl` | 2-3열 |

### 7.2 페이지별 모바일 전환

| 페이지 | 데스크톱 | 모바일 |
|--------|---------|--------|
| 프로젝트 목록 | 3열 카드 | 1열 카드 |
| 프로젝트 상세 | 2열 결과 카드 | 1열 스택 |
| StageProgress | 가로 노드 | **세로(vertical) 타임라인** |
| ClarifyChat | 2열 Q&A | 1열 스택 |
| 검증 | 게이지 + 이슈 2열 | 1열 스택 |
| 승인 | 리뷰 + 검증 2열 | 1열 스택 |
| 아카이브 | Dense 테이블 | 카드 리스트 |
| 학습 | 3열 KPI | 1열 스택 |

### 7.3 터치 타겟

- 모든 버튼: 최소 `44px` 높이
- ClarifyChat 선택지: `min-h-[48px]` 터치 영역
- TopNav 항목: `h-10 px-4`
- 카드 클릭 영역: 전체 카드

---

## 8. 애니메이션

| 요소 | 애니메이션 | 지속시간 |
|------|-----------|---------|
| 카드 호버 | shadow 확대 | 200ms ease |
| 버튼 클릭 | scale(0.98) | 100ms |
| StageProgress 진행 | 노드 scale-in | 300ms ease-out (순차) |
| ClarifyChat 질문 등장 | slide-up | 300ms ease-out |
| ScoreGauge 바 채움 | width 0→N% | 800ms ease-out |
| 페이지 진입 | fade-in | 200ms ease-out |
| 폴링 인디케이터 | pulse | 무한 |

---

## 9. 에러/빈/로딩 상태 표준

### 9.1 로딩 (폴링 중)

**현재**: 기본 스피너 (`border-4 border-blue-500 animate-spin`)
**변경**: 컨텍스트형 로딩

```
프로젝트 상세 (폴링 중):
┌────────────────────────────────────────────┐
│ StageProgress (진행중 노드 pulse)           │
│ "리서치 진행중... 약 2분 소요"               │
│ 진행률: ████████░░ 80%                     │
└────────────────────────────────────────────┘
```

### 9.2 빈 상태

```
프로젝트 없음:
┌────────────────────────────────────────────┐
│      📋                                    │
│ 아직 프로젝트가 없습니다                      │
│ 새 프로젝트를 만들어 시작하세요                │
│ [+ 새 프로젝트 만들기]                       │
└────────────────────────────────────────────┘
```

### 9.3 에러 상태

```
API 에러:
┌────────────────────────────────────────────┐
│  ⚠️ 데이터를 불러올 수 없습니다              │
│  서버 연결이 끊어졌습니다.                    │
│  [다시 시도]                                │
│  ▶ 기술 정보 (접힘)                          │
└────────────────────────────────────────────┘
```

---

## 10. rose-600 vs red-600 구분 가이드

> StrategyHub에서 가장 주의해야 할 색상 규칙

| 용도 | 색상 | Tailwind |
|------|------|----------|
| **브랜드 Primary** | rose-600 | `bg-rose-600`, `text-rose-600` |
| **버튼 Primary** | rose-600 | `bg-rose-600 hover:bg-rose-500` |
| **링크** | rose-600 | `text-rose-600 hover:text-rose-500` |
| **활성 네비** | rose-700 on rose-50 | `bg-rose-50 text-rose-700` |
| **배지 (진행중)** | rose-100/800 | `bg-rose-100 text-rose-800` |
| **차트 메인** | rose-600 | `#E11D48` |
| --- | --- | --- |
| **에러 메시지** | red-600 | `bg-red-50 text-red-800` |
| **삭제 버튼** | red-600 | `bg-red-600 text-white` |
| **실패 배지** | red-600 | `bg-red-600 text-white` (L1) |
| **검증 실패 노드** | red-600 | `bg-red-600 text-white` |

**구분 원칙**:
- rose = 브랜드/UI (의도된 강조)
- red = 위험/에러 (경고/차단)

---

## 11. 구현 우선순위

### Phase 1: 인프라 (필수 선행)
1. `globals.css` CSS 변수 교체 (rose-600 Primary)
2. `tailwind.config.ts` 확장

### Phase 2: 신규 UI 컴포넌트 추가
3. badge.tsx, table.tsx, dialog.tsx, select.tsx 추가
4. tabs.tsx, skeleton.tsx, dropdown-menu.tsx 추가

### Phase 3: 기존 컴포넌트 리디자인
5. button.tsx, card.tsx, input.tsx 수정
6. TopNav.tsx 리디자인
7. ProjectCard.tsx 리디자인
8. StageProgress.tsx 리디자인

### Phase 4: 복잡한 컴포넌트
9. ClarifyChat.tsx (스타일만, 로직 유지)
10. ScoreGauge.tsx, RetryTimeline.tsx
11. MarkdownViewer.tsx, SimpleDiff.tsx

### Phase 5: 페이지 적용
12. 홈, 프로젝트 목록
13. 프로젝트 상세, 리서치, 아이디어
14. 검증, 기획안, 승인, 비교
15. 인사이트, 아카이브, 학습

### Phase 6: 신규 구현
16. FeedbackForm 5개 페이지 배포
17. 컨텍스트 관리 페이지 UI 구현

### Phase 7: 모바일 반응형
18. TopNav 햄버거 메뉴
19. StageProgress 세로 전환
20. 테이블 → 카드 리스트 전환

---

## 12. 검증 방법

### 시각적 확인
1. `npm run dev` → `localhost:3020/strategyhub`
2. 모든 페이지 순회하며 zinc 톤 확인
3. 카드: 그림자만으로 분리, 테두리 없음
4. 배지: L1/L2/L3 시각적 차이 확인
5. rose-600 vs red-600 구분 확인

### 워크플로우 확인
6. 프로젝트 생성 → ClarifyChat → 완료 흐름
7. StageProgress 각 단계 표시 확인
8. 검증 5-Layer 게이지 정상 표시
9. 승인 페이지 액션 동작

### 모바일 확인
10. Chrome DevTools 모바일 에뮬레이터
11. StageProgress 세로 전환 확인
12. TopNav 햄버거 메뉴 동작
13. 터치 타겟 44px 확인

### 접근성 확인
14. Tab 키 네비게이션
15. Lighthouse 접근성 90+ 목표
16. 색상 대비 WCAG AA 준수

---

마지막 업데이트: 2026. 02. 07.
