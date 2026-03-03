# Canton CIP — 한국·APAC 관련 SV 분석

> 작성일: 2026-02-24 | 출처: https://github.com/canton-foundation/cips

---

## 요약

Canton Network의 전체 SV 승인 CIP 중 한국, APAC, 또는 웨이브릿지와 연관된 SV를 조사한 결과입니다.

- **"Wavebridge"는 어떤 CIP에서도 SV로 언급되지 않음** (현재 Validator 상태)
- **7RIDGE가 유일한 한국 직접 연결 SV** (Weight 10, T1)
- APAC 핵심 SV: Hex Trust(홍콩), Monstera(홍콩/베이징), Zodia(싱가포르/홍콩/일본/호주)

| CIP | SV 이름 | Weight | 지역 | 핵심 역할 | 상태 |
|-----|---------|--------|------|----------|------|
| 0019 | **7RIDGE** | 10 | **한국** | VC/투자, 초기 핵심 SV | Final |
| 0087 | **Hex Trust** | 3 | **홍콩**/싱가포르/베트남 | 기관 커스터디/트레이딩 | Approved |
| 0052 | **Monstera** | 5 | **홍콩/베이징**/런던 | APAC 대형기관 온보딩 | Final |
| 0075 | **Zodia** | 5 | **싱가포르/홍콩/일본/호주** | 기관 커스터디/결제 | Approved |
| 0044 | **Elliptic** | 0.5 | 런던/**싱가포르** | AML/컴플라이언스 | Final |
| 0061 | **Chainlink** | 7.5 | 미국 (APAC 협력) | 오라클/가격 피드 | Final |

> **상태 참고**: Final = 온체인 채택 완료(실제 운영 중), Approved = 오프체인 투표 통과(온체인 채택 대기 중)

---

## 1. CIP-0019 — 7RIDGE (Weight 10, T1) | Final

- 한국 기반 벤처캐피탈/블록체인 투자사로 알려진 7RIDGE를 T1 SV로 추가하는 CIP
- Weight 10 (최고 등급)으로 2024년 6월 승인, Final 상태 — 온체인 운영 중
- CIP 저자는 Chris Zuehlke (Digital Asset 전 CEO)
- "7RIDGE is used as a placeholder to represent the NewCo until the entity name is finalized"
  - 실제 법인명이 이후 변경되었을 가능성 있음
- CIP 본문 상세 내용은 PDF로만 제공되어 마일스톤 등 세부사항 확인 불가
- 7RIDGE(세븐릿지)는 한국 설립 VC로, Canton Network 초기 핵심 SV 중 하나
- T1 등급은 Broadridge, Tradeweb, Circle 등과 동일한 최고 Weight
- 초기 SV로서 성과 연동(마일스톤) 구조 없이 고정 Weight로 참여한 것으로 추정
- Canton Network 거버넌스에서 투표권 비중이 매우 높음 (Weight 10)
- **현재 SV 중 한국과 가장 직접적으로 연결되는 유일한 SV**

---

## 2. CIP-0087 — Hex Trust (Max Weight 3) | Approved

- 2018년 **홍콩**에 설립된 기관급 디지털 자산 커스터디 및 금융 서비스 회사
- 거점: **싱가포르, 홍콩, 베트남, 두바이, 이탈리아** — APAC 중심 글로벌 운영
- 멀티 관할권 규제 라이선스 보유 (홍콩, 싱가포르, 두바이, 유럽)
- 커스터디, 트레이딩, 스테이킹, 자산 발행 서비스를 기관 고객에 제공
- 저자: Giorgia Pellizzari, Alessio Quaglini
- **마일스톤**:
  - Integration (+180일): Canton Coin 및 토큰 표준 세이프키핑 통합
  - Adoption (+180일, MainNet 이후): Inelastic Burn 활동 기반 추가 Weight (+2)
- Weight 2.5 초과 시 6개월 내 자체 SV 노드 운영 의무
- APAC 기관 고객 기반이 Canton Network의 아시아 확장에 직접 기여 가능
- 웨이브릿지와 커스터디/인프라 영역에서 시너지 가능성 있음
- 2025년 10월 승인 (온체인 채택 대기 중)

---

## 3. CIP-0052 — Monstera / Witan Group (Max Weight 5) | Final

- Monstera는 **Witan Group**의 디지털 자산 자회사
- Witan은 **홍콩, 베이징, 런던, 두바이**에서 운영하는 사설투자회사
- 회장 David Stern: Sphere Entertainment 부회장, 2001년 중국 중심 자문업 창업
- **핵심 가치 제안**: Canton Network에 전략적 참여자(대형 기관)를 유치
- **APAC 타겟 기관**:
  - Tokyo Dome / Mitsui Fudosan (회장 연결)
  - Sun Hung Kai & Co (CEO 겸 대주주)
  - AirAsia (창업자 겸 CEO)
- 중동: Mashreq Bank, Dubai Stock Exchange, Abu Dhabi First Bank
- 유럽: Deutsche Bank, Munich Re
- **마일스톤**: 승인된 신규 참여자가 MainNet 첫 거래 실행 시 참여자당 +0.5 Weight (최대 5)
- 기한: 승인 후 +180일, 월 1회 GSF 토크노믹스 위원회에 보고
- Canton 생태계의 **APAC 대형 기관 온보딩 허브** 역할

---

## 4. CIP-0075 — Zodia Custody (Max Weight 5) | Approved

- **Standard Chartered, Northern Trust, SBI Holdings, National Australia Bank, Emirates NBD**가 후원하는 기관급 커스터디 플랫폼
- 거점: **UK, EU, 싱가포르, 홍콩, 호주, UAE(ADGM & VARA), 일본** — APAC 전역 운영
- 라이선스: FCA(영국), CBI(EU), CSSF(EU), FSRA(ADGM), 호주·싱가포르 운영허가, ASIC/MAS 진행 중
- 4대 사업 축: HOLD(커스터디), EARN(자산관리), TRADE(거래소 외 순결제), BUILD(토큰발행)
- **마일스톤 구조** (독특한 가속 보너스 포함):

| 항목 | 조건 | 기한 | Weight |
|------|------|------|--------|
| Off-Venue 결제 통합 | Canton ↔ Zodia Interchange | +180일 | +0.5 |
| Off-Venue 가속보너스 | 60일 이내 완료 시 | +180일 | 최대 +1 |
| Off-Venue 채택보너스 | Zodia 고객의 Canton 채택 | Go Live 후 180일 | 최대 +1 |
| 3자 담보관리 | Canton에 솔루션 구축 | +180일 | +0.5 |
| 3자 가속보너스 | 60일 이내 완료 시 | +180일 | 최대 +1 |
| 3자 채택보너스 | Zodia 고객의 Canton 채택 | Go Live 후 180일 | 최대 +1 |

- **SBI Holdings(일본)와 NAB(호주)**가 주주 — APAC 금융권 직접 연결
- 2025년 9월 승인 (온체인 채택 대기 중)
- 웨이브릿지와 커스터디·트레이딩 인프라에서 가장 시너지가 큰 APAC SV

---

## 5. CIP-0044 — Elliptic (Weight 0.5, T4) | Final

- 블록체인 분석 및 금융범죄 방지(AML) 글로벌 선도 기업
- 본사: **런던** / 지사: **뉴욕, 싱가포르**
- 투자사: Evolution Equity, **SoftBank, SBI Group**, Albion VC, Wells Fargo, JP Morgan 등
- 매주 $10억+ 거래를 스크리닝하는 규제 기관·거래소·은행 대상 솔루션
- **마일스톤**: 6개월 내 Canton Coin 및 USDC 온체인 AML 모니터링 제공
- Weight 0.5 (T4, 최소 등급) — SV 노드 자체 운영 불필요, GSF 멀티테넌트 사용
- SBI Group 투자 + 싱가포르 거점으로 APAC 연결
- 컴플라이언스/AML 인프라 성격 — 웨이브릿지와 직접 경쟁보다는 보완적 관계
- Canton Network의 규제 준수 인프라 담당 SV
- 2024년 9월 승인, Final 상태

---

## 6. CIP-0061 — Chainlink (Weight 7.5) | Final (참고)

- 미국 기반이나 **APAC 주요 기관과 직접 협력** 이력이 있어 참고용으로 포함
- **APAC 파트너십**:
  - MAS(싱가포르 통화청): Project Guardian 핵심 파트너
  - HKMA(홍콩 금융관리국): 공식 파트너
  - SBI Digital Markets: UBS와 협력한 토큰화 펀드 프로젝트
  - ANZ(호주·뉴질랜드): $1조+ 자산 운용, CCIP 기반 크로스체인 결제 시연
- Canton에 제공하는 서비스:
  - Data Streams 오라클 인프라
  - Proof of Reserve (PoR) — 담보 검증
  - CCIP — 50개+ 블록체인 연결
- 300명+ 엔지니어, $20조+ 거래 가치 활성화
- 웨이브릿지가 Canton에서 자산 가격 데이터를 활용할 때 Chainlink 인프라에 의존
- APAC 금융기관들의 Canton 참여를 기술적으로 뒷받침하는 역할

---

## 웨이브릿지 관점 시사점

### Sponsor/Endorser 후보로서의 APAC SV

| SV | 가능성 | 근거 |
|----|--------|------|
| 7RIDGE | 높음 | 한국 기반, 가장 자연스러운 연결. Weight 10으로 투표 영향력 큼 |
| Hex Trust | 중간 | APAC 커스터디 동종 업계, 시너지 제안 가능 |
| Zodia | 중간 | SBI Holdings 연결, APAC 커스터디 인프라 보완 |
| Monstera | 낮음 | APAC 기관 온보딩 특화, 웨이브릿지와 직접 접점 불분명 |

### 경쟁 분석

- APAC 커스터디 영역: Hex Trust, Zodia가 이미 진출 — 웨이브릿지는 **차별화된 가치 제안** 필요
- 한국 시장: 7RIDGE 외 한국 특화 SV 부재 — **한국/아시아 시장 접근성**이 차별점이 될 수 있음
- AML/컴플라이언스: Elliptic이 담당 — 보완적 관계로 활용 가능

### 마일스톤 설계 참고

| 패턴 | 해당 SV | 특징 |
|------|---------|------|
| 기관 온보딩 기반 | Monstera | 참여자당 +0.5 Weight, 최대 5 |
| 통합 + 채택 보너스 | Zodia | 가속보너스(60일 이내 완료 시 추가), 채택보너스(고객 유치) |
| 통합 + Inelastic Burn | Hex Trust | 실제 네트워크 사용량 기반 |
| 고정 Weight (초기 SV) | 7RIDGE | 마일스톤 없이 T1 고정 — 현재는 불가능한 방식 |
