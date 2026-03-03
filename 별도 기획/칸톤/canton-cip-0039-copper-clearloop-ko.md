# CIP-0039: Copper ClearLoop를 Weight 1의 Tier 3 슈퍼 밸리데이터로 추가

> 원문: https://github.com/canton-foundation/cips/blob/main/cip-0039/cip-0039.md
> 본문: PDF 제공 (`cip-0032-0033-0034-0036-0038-0039-0040.pdf`) — 메타정보 및 공개 자료 기반 작성
> 번역/풀이일: 2026-02-24

---

## 기본 정보

| 항목 | 내용 |
|------|------|
| CIP 번호 | 0039 |
| 제목 | Copper ClearLoop를 Tier 3 SV (Weight 1)로 추가 |
| 저자 | 미기재 (PDF 본문 참조) |
| 상태 | **Final** (온체인 채택 완료, 운영 중) |
| 유형 | Governance |
| 작성일 | 2024-12-06 |
| 승인일 | 2024-12-14 |
| 라이선스 | CC0-1.0 |

> **CIP-0032, 0033, 0034, 0036, 0038, 0039, 0040은 동일한 PDF 본문에 묶여 있으며, 동일 투표(CIP-0042 포함)로 승인되었다.**

---

## 개요 (Abstract)

- Copper ClearLoop를 **Weight 1의 Tier 3 슈퍼 밸리데이터**로 추가한다.
- 이는 CIP-0015(Copper 기본 SV)와 별도로, **ClearLoop 제품의 Canton Network 통합**에 초점을 맞춘 CIP이다.

---

## 신청자 소개 (About Applicant)

### Copper ClearLoop란?

Copper ClearLoop는 Copper가 개발한 **오프체인 결제(Off-Exchange Settlement) 솔루션**이다.

### 핵심 메커니즘

```
기존 방식:
  기관 투자자 → 자산을 거래소에 직접 이동 → 거래 → 출금
  문제점: 거래소 파산 시 자산 손실 리스크

ClearLoop 방식:
  기관 투자자 → 자산은 Copper 커스터디에 유지 → 거래소에서 거래 → 오프체인 결제
  장점: 거래소 카운터파티 리스크 제거, 자산 안전성 확보
```

### Canton Network와의 통합 의미

ClearLoop를 Canton Network에 통합하면:
1. **오프체인 결제 기록**을 Canton의 프라이버시 보호 원장에 기록
2. 기관 고객이 Canton 기반 자산을 ClearLoop를 통해 **안전하게 거래**
3. Canton의 **원자적 결제(Atomic Settlement)** 기능과 ClearLoop의 오프체인 결제를 결합

---

## 마일스톤 및 Weight 획득 조건

> **본 CIP의 상세 마일스톤은 PDF 문서에만 포함되어 있어 정확한 내용을 확인할 수 없다.**
> 아래는 공개 메타정보와 CIP 패턴에 기반한 추정이다.

| 항목 | 내용 |
|------|------|
| 최대 Weight | **1** (Tier 3 등급) |
| 마일스톤 구조 | Canton 기반 ClearLoop 통합 (상세 미확인) |
| SV 노드 운영 | Weight ≤ 2.5이므로 자체 노드 운영 **불필요** (GSF 멀티테넌트 사용 가능) |

### Copper 그룹 합산 Weight

```
CIP-0015 (Copper 기본):      +1
CIP-0039 (Copper ClearLoop): +1
──────────────────────────────
Copper 그룹 합산:             2.0
```

> Copper는 기본 SV(CIP-0015)와 ClearLoop(CIP-0039) 두 건으로 합산 Weight 2를 보유한다. 이는 2.5 이하이므로 자체 SV 노드 운영 의무 없이 GSF 멀티테넌트로 운영 가능하다.

---

## 참고 사항

- CIP-0039는 **2024년 12월 대규모 SV 확장** 시기에 7건의 CIP와 함께 일괄 승인되었다.
- 동시 승인된 CIP 중 CIP-0033(Strange Pixels)만 **Rejected** 처리되었으며, 나머지 6건은 모두 Final 상태이다.
- ClearLoop는 Zodia의 Off-Venue Settlement(CIP-0075)와 유사한 **오프체인 결제** 개념이나, Copper는 초기 참여자로 단순 통합 방식, Zodia는 성과 연동 방식이라는 차이가 있다.

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2024-12-06 | 최초 초안 작성 |
| 2024-12-14 | CIP 승인 (CIP-0032~0040 일괄 투표) |
