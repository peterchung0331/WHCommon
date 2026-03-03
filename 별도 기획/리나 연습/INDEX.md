# Wavebridge BD Team — Context Index & Classification Framework

> Claude Code context 입력용 프로젝트 분류 체계.
> 새로운 프로젝트/문서 발생 시 이 프레임워크 기준으로 분류하고 context를 연결한다.

---

## 1. Classification Tiers

### Tier 1: Core Revenue & Liquidity

수익을 직접 생성하거나, 유동성 인프라를 구성하는 활동.

**분류 기준:**
- 매출 또는 거래량에 직접 기여하는가?
- 고객 자산이 플랫폼을 경유하는가?
- 중단 시 즉시 매출 영향이 발생하는가?

**현재 해당 프로젝트:**

| 프로젝트 | Context 파일 | 근거 |
|----------|-------------|------|
| Dolfin KR (OTC/P2P/RFQ/TWAP) | `00_WAVEBRIDGE_COMPANY.md` | 핵심 플랫폼. 직접매매·교환중개 매출 직결 |
| WSP / Dolfin Global | `00_WAVEBRIDGE_COMPANY.md` | 2024 거래량 $165.5M, 매출 $1.8M. 실질 수익원 |
| 주간 보고 (KPI 트래킹) | `11_WEEKLY_REPORTS.md` | 매출·거래량·고객수 실시간 추적 |

**승격 후보:**
- BTC 담보 대출 (전북/광주은행) — 수익 모델 확정 시 Tier 1 승격
- 스테이블코인 유통 — B2B 매출 발생 시 Tier 1 승격

---

### Tier 2: Strategic Infrastructure

직접 매출은 아니지만, 사업 확장·자본·기술 기반을 구축하는 활동.

**분류 기준:**
- 12개월 내 Tier 1 활동을 가능하게 하는가?
- 자본 조달, 기술 플랫폼, 라이선스 등 구조적 기반인가?
- 부재 시 사업 확장이 불가능한가?

**현재 해당 프로젝트:**

| 프로젝트 | Context 파일 | 근거 |
|----------|-------------|------|
| IR Series C | `01_IR_SERIES_C.md` | 성장 자본 조달. Data Room, FAQ, 투자자 미팅 전 과정 |
| Dolfin KR 상장심사 | `09_DOLFIN_KR.md` | 거래지원 평가 체계 = 플랫폼 신뢰 기반 |
| 해외 PL사 협업 (Virtu/FalconX) | `06_OVERSEAS_PL.md` | 글로벌 유동성 풀 확보 = ETF·OTC 실행 인프라 |
| 파트너십 (D3 Labs, Zoth) | `12_PARTNERSHIPS.md` | 글로벌 네트워크, RWA 파이프라인 |

**승격 후보:**
- 없음 (이미 Tier 1 지원 역할에 충실)

---

### Tier 3: Regulatory & Policy

규제 환경을 형성하거나 대응하는 활동. 타이밍과 결과가 외부 변수에 의존.

**분류 기준:**
- 금융당국·입법 기관과의 직접 상호작용이 있는가?
- 규제 승인/지정이 프로젝트 진행의 전제조건인가?
- 산출물이 정책 입안자 대상인가?

**현재 해당 프로젝트:**

| 프로젝트 | Context 파일 | 근거 |
|----------|-------------|------|
| 비트코인 현물 ETF 구조 제안 | `07_BD_TEAM_TASKS.md` #10 | 자본시장법 개정, 금융위 승인 의존 |
| 삼성 가상자산 얼라이언스 | `07_BD_TEAM_TASKS.md` #5 | 혁신금융서비스 지정 = 규제 샌드박스. 지정 여부가 전제조건 |
| 김앤장 Q&A | `07_BD_TEAM_TASKS.md` #13 | 규제 해석, 법적 구조 자문 |
| 바레인 라이선스 | `07_BD_TEAM_TASKS.md` 기타 | 해외 규제 대응 |

**승격 조건:**
- 삼성 얼라이언스 → 혁신금융 지정 확정 시 Tier 2로 승격 (ETF 인프라 기반)
- ETF 구조 → 자본시장법 개정 확정 시 Tier 1로 승격 (직접 매출)

---

### Tier 4: Institutional Distribution

기관 고객 교육, 시장 포지셔닝, 브랜드 신뢰 구축 활동. 간접적으로 파이프라인을 확장.

**분류 기준:**
- 외부 배포 목적의 리서치/교육 콘텐츠인가?
- 특정 기관 세그먼트의 인식·수요를 형성하는가?
- 직접 딜이 아닌 시장 조성 활동인가?

**현재 해당 프로젝트:**

| 프로젝트 | Context 파일 | 근거 |
|----------|-------------|------|
| 비트코인 전략자산 보고서 | `02_BITCOIN_TREASURY.md` | 법인 BTC Treasury 교육. 고객 수요 형성 |
| 국내 시장 현황 리포트 | `03_KOREA_MARKET_REPORT.md` | 한국 시장 대외 포지셔닝. KBW 배포 |
| 완성자료 모음 | `08_REFERENCE_MATERIALS.md` | 큐레이션된 외부 배포 자료 |
| 참고자료 통합 | `08_REFERENCE_MATERIALS.md` | 리서치 라이브러리 |
| 경쟁사 리서치 | `07_BD_TEAM_TASKS.md` #9 | 포지셔닝 근거, IR 보충 |

---

### Tier 5: BD Team – General Pipeline

개별 BD 태스크. 은행/증권사/파트너 대상 제안, Q&A 대응, 내부 프로세스 등.

**분류 기준:**
- 특정 거래 상대방과의 1:1 BD 활동인가?
- 단일 미팅/제안/DD 대응 수준인가?
- 아직 구조적 임팩트가 확정되지 않았는가?

**현재 해당 프로젝트:**

| 프로젝트 | Context 파일 | 근거 |
|----------|-------------|------|
| 은행 제안 전체 (토스, 신한, 우리, IM뱅크) | `07_BD_TEAM_TASKS.md` | 개별 은행 접촉. 계약 체결 전 |
| 전북/광주은행 | `07_BD_TEAM_TASKS.md` #2 | 진행 중이나 아직 매출 미발생 |
| 카카오뱅크 | `07_BD_TEAM_TASKS.md` #4 | 논의 단계 |
| 빅토리증권 DD | `07_BD_TEAM_TASKS.md` #6 | DD 진행 중 |
| 교환주문 업무 방법서 | `07_BD_TEAM_TASKS.md` #7 | 내부 프로세스 |
| 퀀텀벤처스 Q&A | `07_BD_TEAM_TASKS.md` #14 | 투자자 대응 |
| Token2049 보고서 | `07_BD_TEAM_TASKS.md` #12 | 출장 보고 |
| FS 사업 (하나금융) | `10_FS_BUSINESS.md` | 부수적 IT 수주 |
| Admin | `13_ADMIN.md` | 운영 기반 문서 |

**승격 후보:**
- 전북/광주은행 → 원화계좌 연동 확정 시 Tier 1 (실명확인 = 매출 전제조건)
- 빅토리증권 → DD 완료·계약 체결 시 Tier 2 (홍콩 WSP 진출 인프라)
- 카카오뱅크 → MoU 체결 시 Tier 2 (스테이블코인 유통 인프라)

---

## 2. Classification Decision Tree

새로운 프로젝트/문서 도입 시 아래 순서로 판단:

```
Q1. 이 활동이 직접 매출을 생성하거나 고객 자산이 경유하는가?
  → Yes → Tier 1: Core Revenue & Liquidity

Q2. 12개월 내 Tier 1 활동을 가능하게 하는 구조적 기반인가?
  → Yes → Tier 2: Strategic Infrastructure

Q3. 규제 당국의 승인/지정이 프로젝트의 전제조건인가?
  → Yes → Tier 3: Regulatory & Policy

Q4. 외부 기관의 인식·수요를 형성하는 교육/리서치/브랜딩인가?
  → Yes → Tier 4: Institutional Distribution

Q5. 위 어디에도 해당하지 않거나 아직 구조적 임팩트 미확정?
  → Tier 5: BD Team – General Pipeline
```

**주의사항:**
- 브랜드 네임이 크다고 Tier를 올리지 않는다. 삼성이라도 규제 의존도가 높으면 Tier 3.
- 파일 수가 많다고 중요도가 높은 것이 아니다. 구조적 임팩트 기준.
- 승격은 외부 변수 확정 시점에 실행한다 (규제 승인, 계약 체결, 매출 발생).

---

## 3. Context 파일 목록

| # | 파일명 | Tier | 핵심 키워드 |
|---|--------|------|-------------|
| 00 | `00_WAVEBRIDGE_COMPANY.md` | 전사 | 프라임브로커리지, Dolfin, VASP, MiCA, 서비스구조, 경쟁우위, 재무전망 |
| 01 | `01_IR_SERIES_C.md` | T2 | Data Room, FAQ, 투자자미팅, WSP, 스테이블코인, 재무프로젝션 |
| 02 | `02_BITCOIN_TREASURY.md` | T4 | 법인BTC, MicroStrategy, 회계처리, mNAV, 골든타이밍 |
| 03 | `03_KOREA_MARKET_REPORT.md` | T4 | 970만투자자, 2500조거래량, 법인진입, ETF, 스테이블코인 |
| 06 | `06_OVERSEAS_PL.md` | T2 | Virtu, FalconX, 마켓메이킹, ETF구조, 유동성 |
| 07 | `07_BD_TEAM_TASKS.md` | T5 | 은행제안, 증권사DD, 경쟁사분석, 교환중개, ETF, 삼성, 우리은행 |
| 08 | `08_REFERENCE_MATERIALS.md` | T4 | 리서치보고서, 회사소개서, 최종산출물 목록 |
| 09 | `09_DOLFIN_KR.md` | T2 | 상장심사, 거래지원, 평가체계 |
| 10 | `10_FS_BUSINESS.md` | T5 | 하나금융, 시장리스크, IT수주 |
| 11 | `11_WEEKLY_REPORTS.md` | T1 | YTD실적, CSP, LEP/OTC, Dolfin Global |
| 12 | `12_PARTNERSHIPS.md` | T2 | D3 Labs, Zoth, MoU, NDA |
| 13 | `13_ADMIN.md` | T5 | 양식, 계약서, 회사정보, 임원정보 |

---

## 4. Context 조합 가이드

### 기본 원칙
- 모든 작업에 `00_WAVEBRIDGE_COMPANY.md`를 base context로 사용
- 해당 Tier의 context 파일을 추가
- 교차 Tier 작업 시 관련 파일 복수 조합

### 시나리오별 조합

| 작업 | Context 조합 | Tier |
|------|-------------|------|
| IR 덱 수정 | 00 + 01 | T2 |
| 투자자 Q&A 대응 | 00 + 01 + 07 | T2+T5 |
| 은행 제안서 작성 | 00 + 07 | T5 |
| ETF 구조 분석 | 00 + 06 + 07(#10) | T2+T3 |
| 스테이블코인 기획 | 00 + 01(스테이블코인) + 07(#8) | T1 후보 |
| 경쟁사 비교 | 00 + 01(경쟁사) + 07(#9) | T4 |
| 주간 보고 | 11 | T1 |
| 규제 대응 문서 | 00 + 06 + 07(#5,#13) | T3 |
| 신규 파트너 제안서 | 00 + 12 | T2 |
| 시장 리서치 보고서 | 00 + 03 + 08 | T4 |

---

## 5. 폴더 구조

```
md 추출/
├── _context/                           ← 이 폴더 (context MD 파일)
├── Admin/                    [109]     — 회사 기본 문서, 양식, 계약서
├── BD팀 업무별 폴더/          [260]     — 개별 BD 태스크별 산출물 (50+ 서브폴더)
├── [Proj] IR Series C/       [160]     — 시리즈 C IR 전체 패키지
├── [Proj] 비트코인 전략자산/    [6]      — Bitcoin Treasury 101 보고서
├── [Proj] 국내 시장 현황 리포트/ [5]     — Korea's Pivotal Crypto Shift 2025
├── [Proj] 해외 PL사 협업/       [3]     — Virtu/FalconX 글로벌 유동성
├── Dolfin KR/                 [8]      — 상장심사 체계
├── FS 사업/                    [4]     — 하나금융 IT 수주
├── 주간 보고/                   [9]     — BD팀 주간/월간 보고
├── 파트너십/                    [4]     — D3 Labs, Zoth MoU/NDA
├── 완성자료 모음/               [44]     — 외부 배포용 최종 산출물 큐레이션
└── 참고자료_통합/               [142]    — 리서치, 외부 보고서, 기존 IR 참조
```

---

## 6. 데이터 기준일

- **분류 체계 수립**: 2026.02.26
- **문서 내용 기준**: 각 문서별 상이 (2024.06 ~ 2026.02)
- **최신 주간 보고**: 2025.04.25
- **최신 IR 덱**: Wavebridge_회사소개자료_IR_20250701
