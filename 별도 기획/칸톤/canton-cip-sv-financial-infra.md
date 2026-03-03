# Canton CIP SV 번역 및 웨이브릿지 마일스톤 작성 계획

> 작성일: 2026-02-24

---

## 1. 작업 개요

### 목적
- Canton CIP SV 승인 사례 11건을 한글로 번역하여 개별 md 파일로 저장
- 11개 사례의 마일스톤 패턴을 분석하여 웨이브릿지 고유 마일스톤 설계

### 작업 범위

| # | 작업 | 파일명 | 상태 |
|---|------|--------|------|
| 1 | CIP-0075 Zodia 번역 | `canton-cip-0075-zodia-ko.md` | 완료 |
| 2 | CIP-0087 Hex Trust 번역 | `canton-cip-0087-hextrust-ko.md` | 완료 |
| 3 | CIP-0072 Fireblocks 번역 | `canton-cip-0072-fireblocks-ko.md` | 완료 |
| 4 | CIP-0074 BitGo 번역 | `canton-cip-0074-bitgo-ko.md` | 완료 |
| 5 | CIP-0015 Copper 번역 | `canton-cip-0015-copper-ko.md` | 완료 |
| 6 | CIP-0039 Copper Clearloop 번역 | `canton-cip-0039-copper-clearloop-ko.md` | 완료 |
| 7 | CIP-0040 Deribit 번역 | `canton-cip-0040-deribit-ko.md` | 완료 |
| 8 | CIP-0085 Talos 번역 | `canton-cip-0085-talos-ko.md` | 완료 |
| 9 | CIP-0060 Zero Hash 번역 | `canton-cip-0060-zerohash-ko.md` | 완료 |
| 10 | CIP-0094 Blockdaemon 번역 | `canton-cip-0094-blockdaemon-ko.md` | 완료 |
| 11 | CIP-0041 Circle 번역 | `canton-cip-0041-circle-ko.md` | 완료 |
| 12 | 마일스톤 비교 분석 | `canton-milestone-analysis.md` | 완료 |
| 13 | 웨이브릿지 마일스톤 설계 | `canton-wavebridge-milestones.md` | 완료 |

### 저장 위치
모든 파일: `/mnt/c/GitHub/WHCommon/별도 기획/칸톤/`

---

## 2. 번역 작업 상세

### 번역 원칙
- CIP-0075 (Zodia) 번역본과 동일한 형식 유지
- 구조: 기본 정보 → 개요 → 신청자 소개 → 마일스톤 테이블 → 보상 메커니즘
- 단순 번역이 아닌 맥락 설명 포함
- 원문 링크 상단에 명시

### 원문 소스
- GitHub raw: `https://raw.githubusercontent.com/canton-foundation/cips/main/cip-XXXX/cip-XXXX.md`
- CIP-0015, 0039, 0040은 본문이 PDF로만 제공 → md에 있는 메타정보 + 이전 세션에서 확보한 정보 기반 작성

### 병렬 작업 가능 단위

```
세션 A: CIP-0087, 0072, 0074 (커스터디 3건)
세션 B: CIP-0015, 0039, 0040 (초기 SV / PDF 기반 3건)
세션 C: CIP-0085, 0060, 0094, 0041 (트레이딩/인프라 4건)
세션 D: 마일스톤 분석 + 웨이브릿지 마일스톤 설계 (세션 A~C 완료 후)
```

---

## 3. 마일스톤 비교 분석 (`canton-milestone-analysis.md`)

### 분석 프레임워크

11개 SV의 마일스톤을 아래 축으로 비교:

| 분석 항목 | 설명 |
|----------|------|
| **마일스톤 유형** | Integration / Acceleration / Adoption / 기타 |
| **Weight 배분 구조** | 기본 Weight vs 성과 연동 Weight 비율 |
| **기한** | 승인 후 N일 |
| **검증 기준** | 정량적(TVL, 거래량) vs 정성적(통합 완료) |
| **가속 보너스 유무** | 조기 완료 인센티브 존재 여부 |
| **채택 보너스 단위** | $1.5B당, $25M당, 참여자당 등 |

### 비교 대상 요약

| CIP | SV | Max Weight | 마일스톤 수 | 핵심 패턴 |
|-----|-----|-----------|-----------|----------|
| 0075 | Zodia | 5 | 6 | 통합 + 가속 + 채택 (2트랙) |
| 0087 | Hex Trust | 3 | 2 | 통합 + 채택(Inelastic Burn) |
| 0072 | Fireblocks | 5 | 3 | 월렛지원 + 가속 + 채택 |
| 0074 | BitGo | 5 | 3 | 커스터디 + 가속 + 채택 |
| 0085 | Talos | 6.5 | 7 | CC트레이딩 + pX결제 (2트랙) |
| 0060 | Zero Hash | 7.5 | 4 | 통합 + 교육 + 독점성 + 채택 |
| 0094 | Blockdaemon | 5 | 3 | 월렛 + 거래량 + TVL |
| 0041 | Circle | 10 | PDF | 확인 필요 |
| 0015 | Copper | 1 | PDF | 확인 필요 |
| 0039 | Copper CL | 1 | PDF | 확인 필요 |
| 0040 | Deribit | 1 | PDF | 확인 필요 |

---

## 4. 웨이브릿지 마일스톤 설계 (`canton-wavebridge-milestones.md`)

### 웨이브릿지 고유 가치 제안 (5개 축)

| # | 축 | 설명 | 차별점 |
|---|-----|------|--------|
| 1 | **한국 금융기관 연결** | 한국 금융기관을 Canton 생태계에 온보딩 | 한국 유일 VASP + 금융기관 네트워크 |
| 2 | **원화 스테이블코인** | Canton 기반 KRW 스테이블코인 PoC → 법제화 후 출시 | 한국 규제 대응 + 원화 유동성 |
| 3 | **한국 RWA** | 한국 금융자산 토큰화 PoC → 법제화 후 출시 | 한국 자본시장 접근 |
| 4 | **한국 커스터디** | 한국 금융기관 대상 Canton 자산 커스터디 | 한국 규제 준수 커스터디 |
| 5 | **프라임 브로커리지** | 한국 금융기관 대상 Canton 프라임 서비스 | 한국 기관 전용 트레이딩/결제 |

### 마일스톤 설계 원칙 (기존 CIP 패턴 기반)

1. **Integration → Acceleration → Adoption** 3단계 구조 유지
2. **정량적 검증 기준** 필수 (TVL, 거래량, 기관 수 등)
3. **법제화 의존 마일스톤**은 조건부(Conditional) 처리 — 기존 CIP에 없는 새로운 패턴
4. **PoC와 Production을 분리** — PoC는 기한 내 확정, Production은 법제화 조건부
5. **가속 보너스** 포함하여 조기 달성 인센티브 부여

### 예상 마일스톤 구조 (초안)

```
Max Weight = 7~10 (TBD)

D1: Canton 통합 기반 구축 (PoC 환경)           → +1~2 Weight, 180일
    - Canton Coin/토큰 표준 지원
    - 한국 금융기관 최소 1곳 TestNet 참여

D2: 가속 보너스                                → 최대 +1~2 Weight
    - 60일 내 완료 시 만점, 180일 선형 비례

D3: 원화 스테이블코인 PoC                      → +0.5~1 Weight, 180일
    - TestNet 상 KRW 스테이블코인 발행/이전 시연
    - 한국 금융기관 1곳 이상 참여

D4: 한국 RWA 토큰화 PoC                        → +0.5~1 Weight, 180일
    - TestNet 상 한국 금융자산(채권/펀드) 토큰화 시연
    - 한국 금융기관 1곳 이상 참여

D5: 커스터디 서비스 오픈                        → +0.5~1 Weight, 180일
    - Canton 자산 커스터디 서비스 런칭
    - 기관 고객 최소 1곳 MainNet 거래 완료

D6: 채택 보너스                                → 최대 +2~3 Weight
    - 금융기관 온보딩 수, TVL, 거래량 기반
    - 법제화 이후 Production 전환 시 추가 Weight

D7: 프라임 브로커리지 (조건부)                  → +0.5~1 Weight
    - 법제화 완료 조건부
    - Canton 기반 트레이딩/결제/대출 서비스
```

### 법제화 의존 마일스톤 처리 방안

기존 CIP에는 규제 조건부 마일스톤 선례가 없음. 아래 접근법 제안:

1. **PoC/TestNet 마일스톤은 법제화 무관하게 기한 내 달성 가능** → 확정 기한
2. **Production/MainNet 마일스톤은 "법제화 완료 후 N일" 형식** → 조건부 기한
3. **법제화 미완료 시 해당 Weight는 에스크로 유지** → 별도 만료 기한 설정 (예: CIP 승인 후 36개월)
4. TWG와 사전 협의하여 조건부 구조 승인 획득 필요

---

## 5. 작업 순서 및 의존성

```
Phase 1 (병렬 가능):
  ├─ 세션 A: CIP-0087, 0072, 0074 번역
  ├─ 세션 B: CIP-0015, 0039, 0040 번역
  └─ 세션 C: CIP-0085, 0060, 0094, 0041 번역

Phase 2 (Phase 1 완료 후):
  └─ 세션 D: 마일스톤 비교 분석 + 웨이브릿지 마일스톤 설계

Phase 3 (Phase 2 완료 후):
  └─ canton-cip-sv-guide.md 업데이트 (웨이브릿지 마일스톤 반영)
```
