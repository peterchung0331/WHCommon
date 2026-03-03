# CIP-0041: Circle을 Weight 10의 슈퍼 밸리데이터로 추가

> 원문: https://github.com/canton-foundation/cips/blob/main/cip-0041/cip-0041.md
> 번역/풀이일: 2026-02-24
> ⚠️ **본문이 PDF로만 제공되어 마일스톤 상세 내용은 확인 불가.** 메타정보 + 공개 정보 기반으로 작성.

---

## 기본 정보

| 항목 | 내용 |
|------|------|
| CIP 번호 | 0041 |
| 제목 | Circle을 Weight 10의 SV로 추가 |
| 저자 | Eric Saraniecki |
| 상태 | **Final** (온체인 채택 완료, 실제 운영 중) |
| 유형 | Governance |
| 작성일 | 2025-02-06 |
| 라이선스 | CC0-1.0 |

---

## 개요 (Abstract)

- Circle을 **Weight 10 (T1, 최고 등급)**의 슈퍼 밸리데이터로 추가한다.
- Weight 10은 Canton Network에서 가장 높은 등급으로, Broadridge, Tradeweb, 7RIDGE 등과 동일한 수준이다.
- Circle은 **USDC 발행사**로서 Canton Network의 스테이블코인 인프라에 핵심적인 역할을 담당한다.

> CIP-0041의 전체 본문은 PDF로만 제공되며, 마일스톤 세부사항은 아래에서 공개 정보를 기반으로 추정한다.

---

## 신청자 소개 (About Applicant)

### Circle이란?

Circle은 **USDC(USD Coin) 발행사**이자 글로벌 금융 기술 기업으로, 디지털 달러 인프라를 구축하여 인터넷 상에서 달러 가치를 이동시키는 것을 핵심 사업으로 한다.

### 주요 현황

| 항목 | 내용 |
|------|------|
| **설립** | 2013년, 미국 보스턴 |
| **핵심 제품** | **USDC** — 세계 2위 스테이블코인 (시가총액 약 $300억+) |
| **규제 현황** | 미국 FinCEN 등록 MSB, 주별 송금업 라이선스, MiCA 준수 (EU) |
| **공개 상장** | NYSE 상장 (티커: CRCL, 2024년 IPO) |
| **주요 파트너** | Coinbase (공동 설립), BlackRock (투자사), Visa, Mastercard |

### USDC 주요 특징

| 특징 | 설명 |
|------|------|
| **완전 담보** | 미국 국채 및 현금 예금으로 1:1 담보 |
| **투명성** | 월별 준비금 증명(attestation) 공개 (회계법인 Deloitte) |
| **멀티체인** | Ethereum, Solana, Avalanche, Polygon, Base, **Canton** 등 15개+ 체인 지원 |
| **규제 준수** | FATF Travel Rule 준수, 제재 스크리닝 내장 |

### Canton Network에서의 역할

- Canton에서 **USDC를 네이티브 발행**하여 Canton 생태계의 기축 결제 수단으로 사용
- CIP-0090 (USDT0)과 함께 Canton의 **스테이블코인 듀얼 트랙** 구성
- Canton 위 DeFi, 결제, 담보관리, RWA 토큰화 등 모든 금융 애플리케이션의 **유동성 인프라** 역할

---

## 마일스톤 및 Weight 획득 조건 (Deliverables)

> ⚠️ **PDF 본문 미확인** — 아래는 공개된 정보와 다른 CIP 패턴을 기반으로 한 추정이며, 정확한 마일스톤은 원문 PDF를 확인해야 합니다.

### 추정되는 마일스톤 구조

CIP-0041은 2025년 2월 작성으로, 성과 연동 마일스톤이 본격화되기 전 시기의 CIP이다. Weight 10 (T1)이라는 점에서 **초기 핵심 SV**로서의 포지션에 가까울 가능성이 높다.

다만 CIP-0041은 2025년 2월 작성이고, 이 시기의 다른 CIP(예: CIP-0060 Zero Hash, 2025년 4월)에는 이미 마일스톤 구조가 있으므로, 일부 성과 연동 요소가 포함되었을 수 있다.

| 예상 영역 | 예상 내용 | 근거 |
|----------|----------|------|
| USDC Canton 통합 | Canton Network에 USDC 네이티브 발행 | Circle의 핵심 사업 |
| 유동성 공급 | Canton USDC 유동성 목표치 달성 | T1 Weight에 상응하는 기여 |
| 생태계 채택 | USDC 기반 결제/정산 고객 온보딩 | 최근 CIP 트렌드 |
| 인프라 지원 | Canton 개발자 도구, API, SDK 제공 | Circle 플랫폼 역량 |

### Weight 구조 추정

```
Max Weight = 10 (T1, 최고 등급)
─────────────────────────────────
상세 배분은 PDF 원문 확인 필요
```

---

## SV 보상 메커니즘 (SV Reward Mechanics)

표준 에스크로 메커니즘을 따르는 것으로 추정된다 (CIP-0045 적용):

1. GSF가 `extraBeneficiary` PartyID로 에스크로 SV 설정 (최대 Weight 10)
2. 에스크로 SV는 블록별 보상을 발행하지 않음 → 미청구 보상 풀로 적립
3. 마일스톤 달성 시 TWG 검증 후 Weight 활성화
4. Weight > 2.5이므로 **자체 SV 노드 운영 필수** (CIP-0045)

> Circle은 이미 **Final** 상태이므로 온체인 채택이 완료되어 실제 운영 중이다.

---

## 분석 노트 — 웨이브릿지 관점

### Circle SV의 전략적 의미

1. **Canton 생태계의 기축 통화 인프라**: USDC는 Canton에서 가장 중요한 스테이블코인. Weight 10은 이 전략적 중요성을 반영
2. **T1 등급의 희소성**: Weight 10 SV는 Broadridge, Tradeweb, 7RIDGE, Circle 등 소수에 불과 — 네트워크 거버넌스에서 최대 영향력
3. **Final 상태**: 이미 온체인에서 운영 중이므로 실제 네트워크에서 USDC 관련 활동이 진행 중

### Sponsor/Endorser 후보로서의 Circle

- Weight 10으로 **투표 영향력이 최대** — Sponsor로 확보 시 강력한 지원
- 웨이브릿지가 한국에서 USDC 유동성을 확대하는 가치 제안을 할 경우 Circle과의 시너지 가능
- canton-cip-sv-guide.md에서 4순위 Sponsor 후보로 이미 식별 (스테이블코인 관련 시너지)

### 웨이브릿지 마일스톤 설계 시 참고

- **T1 Weight는 현재 웨이브릿지에 비현실적** — Max 5~7.5가 적정
- Circle의 **Canton USDC 인프라 위에 한국 금융기관의 결제/정산을 구축**하는 것이 시너지 포인트
- 원화 스테이블코인(KRW) PoC에서 USDC ↔ KRW 교환 경로를 Canton 위에 구현하면 Circle과의 협력 명분이 강화됨

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2025-02-06 | 최초 초안 작성 |
| (확인 필요) | CIP 승인 |
| (확인 필요) | Final (온체인 채택 완료) |
