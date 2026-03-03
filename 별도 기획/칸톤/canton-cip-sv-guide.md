# 웨이브릿지 Canton CIP 슈퍼 밸리데이터 추가 가이드

> 작성일: 2026-02-24 | 근거: CIP-0000 (프로세스), CIP-0045 (SV 운영 요건), CIP-0091/0095 (최신 SV 추가 사례)

---

## 1. 현재 상황 요약

| 항목 | 내용 |
|------|------|
| 웨이브릿지 현재 상태 | Canton Network **Validator** (SV 아님) |
| 제출할 CIP 유형 | **Governance** |
| 필요한 SV 후원 | Sponsor 1명 + Endorser 1명 (총 2명) |
| 투표 기한 | cip-discuss 게시 후 **1개월** 이내 투표 진행 필요 |
| 투표 승인 조건 | 기존 SV 중 **2/3 다수결** |
| Weight > 2.5일 경우 | 6개월 내 자체 SV 노드 운영 의무 (CIP-0045) |

---

## 2. 전체 타임라인 (예상)

| 주차 | 단계 | 세부 내용 |
|------|------|----------|
| 1~2주 | 내부 준비 | 가치 제안 정의, 마일스톤 설계, 법인 자료 정비 |
| 3~4주 | SV 섭외 | Sponsor/Endorser 후보 접촉, 사전 피드백 수렴 |
| 5주 | CIP 초안 작성 | 마크다운 형식, CIP 에디터와 협업 |
| 6주 | cip-discuss 게시 | 메일링리스트에 Draft 공개, 커뮤니티 피드백 수집 |
| 7~8주 | GitHub PR 생성 | canton-foundation/cips 레포에 PR 제출 |
| 8~9주 | 투표 요청 | Sponsor SV가 cip-vote 메일링리스트로 투표 요청 |
| 9~10주 | 투표 진행 | 10일간 투표 (GitHub Team Voting) |
| 10주~ | 승인 후 | Approved → 온체인 2/3 채택 → Final |

> Governance CIP는 cip-discuss 게시 후 **1개월** 내 투표로 넘어가야 합니다. 기한 초과 시 Withdrawn 또는 Deferred 처리됩니다.

---

## 3. 사전 준비사항

### 3.1 회사 자료

- **법인 정보**: 정식 법인명, 설립 국가, 설립 연도
- **규제 라이선스**: 보유 중인 금융/블록체인 관련 라이선스 (예: VASP, MiCA 등)
- **Canton Validator 운영 실적**: 현재 운영 중인 Validator 노드의 업타임, 처리량, 운영 기간
- **주요 파트너/고객**: Canton 생태계 내 또는 금융권 파트너십

### 3.2 기술 역량

- Validator 노드 운영 경험 (업타임 SLA, 모니터링 체계)
- SV 노드 운영 가능 여부 확인:
  - Weight ≤ 2.5 → GSF 멀티테넌트 SV 노드 사용 가능 (자체 운영 불필요)
  - Weight > 2.5 → **6개월 내 자체 SV 노드 운영 필수** (CIP-0045)
- 자체 SV 노드 운영 시:
  - 인프라 비용 산정
  - Canton Coin Scan API 제공 능력
  - Canton Coin Scan UI 호스팅 가능 여부

### 3.3 가치 제안 정의 (가장 중요)

Canton 생태계에 웨이브릿지가 기여하는 **구체적이고 측정 가능한 가치**를 정의해야 합니다.

최근 승인된 CIP들의 가치 제안 유형:

| CIP | 회사 | 가치 제안 유형 |
|-----|------|--------------|
| CIP-0091 Zenith | ZkCloud | EVM 호환 Virtual Blockchain 기술 제공 |
| CIP-0095 Mesh | Mesh | 결제 인프라, 400M+ 유저 연결, 스테이블코인 정산 |
| CIP-0090 USDT0 | - | USDT를 Canton에 온보딩 |
| CIP-0061 Chainlink | Chainlink | 오라클/가격 피드 인프라 |
| CIP-0069 Ledger | Ledger | 하드웨어 월렛 통합 |

웨이브릿지가 선택할 수 있는 가치 제안 방향:
- **거래량/TVL 기여**: Canton에 유입시키는 자산 규모
- **기술 인프라**: 브릿지, 결제, 크로스체인 등 기술적 기여
- **생태계 확장**: 새로운 사용자/기관 유입
- **파트너십**: 기존 금융기관/프로젝트와의 연결

---

## 4. SV 2곳 섭외 전략

### 4.1 역할 정의

| 역할 | 설명 | 누가 할 수 있는가 |
|------|------|------------------|
| **Sponsor** | CIP를 cip-vote 메일링리스트에 정식 제출하는 SV | 기존 SV 중 1곳 |
| **Endorser** | CIP를 공식 지지하는 SV | 기존 SV 중 1곳 (Sponsor와 다른 곳) |

> 웨이브릿지는 현재 SV가 아니므로 **반드시 2곳** 필요합니다. (이미 SV인 경우 Endorser 1곳만 필요)

### 4.2 후보 SV 우선순위 및 접근 전략

#### 1순위 — Eric Saraniecki (Digital Asset / 실질적 CIP 게이트키퍼)

- **이유**: 전체 CIP의 약 70%를 작성한 핵심 인물. SV 추가 CIP의 사실상 표준 저자
- **접근법**: cip-discuss 메일링리스트에 Draft를 올린 후 직접 연락. 또는 GSF를 통해 소개 요청
- **연락처**: GitHub `@esaraniecki` 또는 cip-discuss 메일링리스트

#### 2순위 — CIP 에디터 (Wayne Collier, Stanislav, Taras, Itai, Amanda)

- **이유**: CIP 프로세스를 관리하는 에디터들. 초안 정리 및 번호 할당 담당
- **접근법**: Draft를 cip-discuss에 올린 후 에디터가 자동 배정됨. 사전에 직접 연락도 가능
- **GitHub 핸들**:
  - Wayne Collier: `@waynecollier-da`
  - Stanislav: `@stas-sbi`
  - Taras: `@tkatrichenko`
  - Itai: `@isegall-da`
  - Amanda: `@hythloda`

#### 3순위 — Zenith (CIP-0091)

- **이유**: 최근 승인 (2025-11-04), 한국 연결 가능성 (저자 중 Heslin Kim)
- **접근법**: 기존 비즈니스 네트워크를 통한 접촉. 한국 블록체인 커뮤니티 통해 Heslin Kim 연결 시도

#### 4순위 — 비즈니스 관련 기존 SV

- Circle (CIP-0041, Weight 10): 스테이블코인 관련 시너지
- Chainlink (CIP-0061, Weight 7.5): 인프라 관련 시너지
- Fireblocks (CIP-0072, Weight 5): 커스터디/인프라
- 기타 웨이브릿지와 기존 관계가 있는 기관

### 4.3 섭외 접근 절차

```
1. cip-discuss 메일링리스트 가입 (https://lists.sync.global/g/cip-discuss/topics)
2. Draft CIP를 메일링리스트에 게시하여 관심 표명
3. 잠재 Sponsor/Endorser SV에 직접 연락:
   - 이메일 또는 GitHub를 통해 CIP Draft 공유
   - 웨이브릿지의 가치 제안과 Canton 생태계 기여 설명
   - Sponsor/Endorser 역할 요청
4. GSF에 operations@sync.global 로 연락:
   - 법인 정보, CIP 링크, 관련 당사자 이메일 주소 제출
5. Sponsor SV가 확정되면 cip-vote 메일링리스트로 투표 요청
```

### 4.4 섭외 시 강조 포인트

Sponsor/Endorser SV를 설득할 때 강조할 내용:
- 웨이브릿지가 Canton에 가져오는 **구체적 비즈니스 가치** (거래량, TVL, 신규 사용자 등)
- 이미 Validator로 네트워크에 참여 중이라는 **검증된 운영 역량**
- 성과 연동 Weight 구조로 **리스크 최소화** (달성하지 못하면 Weight 회수)
- Canton 생태계 전체에 대한 **긍정적 시너지** 효과

---

## 5. CIP 문서 작성 가이드

### 5.1 CIP 구조 (Governance — SV 추가용)

아래는 CIP-0091 (Zenith)과 CIP-0095 (Mesh) 구조를 기반으로 한 템플릿입니다.

```markdown
## CIP XXXX

<pre>
  CIP: ?
  Title: Add WaveBridge as a Super Validator (Max Weight X)
  Author: [저자 이름들]
  Type: Governance
  Status: Draft
  Created: YYYY-MM-DD
  License: CC0-1.0
</pre>
```

### 5.2 각 섹션별 작성 가이드

#### Abstract (200단어 이내)

한 문단으로 제안의 핵심을 요약합니다.

**포함할 내용:**
- 웨이브릿지를 Weight X의 SV로 추가하는 제안
- 성과 연동 구조 (마일스톤 기반 Weight 배분)
- 웨이브릿지가 Canton에 기여하는 핵심 가치 한 줄 요약

**예시:**
```markdown
## Abstract
Add WaveBridge as a Super Validator (SV) of max weight X, with the majority of
the weight reachable through growth and adoption KPIs.

WaveBridge commits to [웨이브릿지의 핵심 기여 내용을 한 문장으로].
```

#### About the Applicant

회사 소개 섹션. 최근 CIP에서 필수로 포함하는 항목:
- 회사 설립 배경 및 연혁
- 주요 제품/서비스
- 기존 파트너십 및 고객
- Canton Network 참여 이력 (Validator 운영 기간 등)
- 규제 준수 현황

#### Motivation

**왜 웨이브릿지가 Canton SV가 되어야 하는가?**
- Canton 생태계에 현재 부족한 부분 중 웨이브릿지가 채울 수 있는 것
- 웨이브릿지가 SV가 되었을 때 네트워크에 미치는 긍정적 영향
- 기존 Validator 경험에서 나오는 네트워크 이해도

#### Specification (마일스톤 테이블) — 핵심 섹션

최근 트렌드는 **성과 연동(Outcome-Linked) 마일스톤** 방식입니다.

**마일스톤 설계 원칙:**
1. **측정 가능해야 함**: TVL, 거래량, 사용자 수 등 수치 기반
2. **검증 가능해야 함**: Tokenomics Working Group(TWG)이 확인할 수 있는 증빙
3. **기한이 있어야 함**: CIP 승인일 기준 N개월
4. **Weight 배분이 합리적이어야 함**: Integration + Growth/Adoption으로 분리

**마일스톤 구조 예시 (CIP-0091/0095 패턴):**

```markdown
## Specification

### Integration Weight

| 마일스톤 | 달성 조건 | 기한 | Weight |
|---------|---------|------|--------|
| D1: MVP/PoC | [기술적 통합 완료 조건] | 승인 후 4~6개월 | +1~2 |
| D2: Mainnet 배포 | [프로덕션 환경 배포 조건] | D1 후 4~6개월 | +2~3 |

### Growth & Adoption Weight

| 마일스톤 | 달성 조건 | 기한 | Weight |
|---------|---------|------|--------|
| D3: TVL/거래량 | $XM 이상 TVL 또는 거래량 | Mainnet 후 12개월 | +0.5~3 |
| D4: 생태계 확장 | N개 기관 온보딩 | Mainnet 후 12개월 | +0.5~1.5 |
```

**검증 방식 (Acceptance Criteria) 작성 예시:**
- 트랜잭션 ID로 검증 가능한 온체인 활동
- 월간 증빙 보고서 (attestation) + 샘플 TXID
- 프레스 릴리즈 또는 공개 발표
- TWG(Tokenomics Working Group)의 확인 서명

#### SV Reward Mechanics

이 섹션은 **CIP-0091/0095와 동일한 표준 문구**를 사용합니다. 변경할 부분이 거의 없는 보일러플레이트입니다.

핵심 메커니즘:
1. GSF가 `extraBeneficiary` PartyID로 에스크로 SV를 설정 (최대 획득 Weight로)
2. 에스크로 SV는 블록별 보상을 발행하지 않음 → 미청구 보상 풀로 적립
3. 마일스톤 달성 시:
   - TWG에 증빙 제출 → TWG 승인 → Tokenomics-Announce 메일링리스트 발표
   - GSF가 `extraBeneficiary`를 웨이브릿지가 통제하는 활성 PartyID로 변경
   - 2/3 SV 운영자가 미청구 보상에서 웨이브릿지에 할당
4. 마일스톤 미달성 시:
   - GSF가 웨이브릿지에 통보
   - 남은 SV Weight 제거, GSF 노드 총 Weight 감소
   - TWG가 미청구 보상 처리 권고

#### Rationale

**왜 이 Weight인가, 왜 이 마일스톤인가?**
- 유사 규모/유형 SV의 Weight 비교 (예: "Mesh는 Max 10, 당사는 Max X")
- 마일스톤 수치의 근거 (시장 규모, 기존 실적 기반 예측)
- 성과 연동 구조가 네트워크에 유리한 이유

#### Copyright

```markdown
## Copyright
This CIP is licensed under CC0-1.0:
[Creative Commons CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
```

---

## 6. Weight 전략

### 6.1 Weight 티어별 비교

| Weight 범위 | SV 노드 운영 | GSF 멀티테넌트 | 비고 |
|------------|-------------|--------------|------|
| 0.5 ~ 1 | 불필요 | 사용 가능 | 진입 장벽 낮음, 보상 적음 |
| 1 ~ 2.5 | 불필요 | 사용 가능 | 중간 규모, 자체 노드 선택적 |
| **2.5 초과** | **6개월 내 필수** | 초기만 가능 | CIP-0045 적용 |
| 5 ~ 10 | 필수 | 불가 | 주요 SV급, 높은 보상 + 높은 기대 |

### 6.2 추천 전략: 성과 연동 Max Weight

**가장 최근 표준 패턴**이며 승인 확률이 높습니다.

```
Max Weight = [Integration 기여] + [Growth/Adoption 기여]
              (고정 부분)         (성과 연동 부분)
```

- **보수적 접근**: Max 3~5 (Integration 1~2 + Adoption 2~3)
- **공격적 접근**: Max 7~10 (Integration 2~3 + Adoption 5~7)

> 최근 추세: 새로운 SV는 대부분 Max 5~10 범위로 제안하며, 실제 초기 Weight는 0에서 시작하여 마일스톤 달성에 따라 증가합니다.

---

## 7. 투표 및 온체인 채택 프로세스

### 7.1 투표 요청 → 승인

```
1. Sponsor SV가 cip-vote 메일링리스트로 CIP 전송
   (https://lists.sync.global/g/cip-vote/topics)
   - cip-vote는 멤버십 비공개, 메시지 아카이브 공개

2. 10일간 투표 진행
   - GitHub Team Voting 사용
   - GSF 직원이 투표 자격자 목록 관리

3. 2/3 다수결 → Approved
   - 10일 내 2/3 미달성 → Rejected 또는 Withdrawn 가능

4. 결과 발표
   - GSF 직원이 cip-announce 및 cip-discuss에 결과 게시
   - CIP 제안자가 cip-announce 링크를 PR에 연결 후 PR 머지
```

### 7.2 Approved → Final (온체인 채택)

```
1. SV 운영자들이 supervalidator-ops 메일링리스트에서 온체인 투표 일정 합의
   (https://lists.sync.global/g/supervalidator-ops/topics)

2. 한 SV 운영자가 온체인 투표 제안 생성
   - 만료일(expiration)과 유효일(effectivity) 포함
   - 승인된 CIP의 PR 링크 포함 필수

3. 2/3 SV가 온체인에서 채택 → Final
   - Canton Coin Scan API/UI에서 투표 결과 자동 리포트

4. Final 이후
   - 에스크로 SV 설정 (GSF가 extraBeneficiary PartyID 생성)
   - 웨이브릿지는 Weight 0으로 네트워크 합류
   - 마일스톤 달성에 따라 Weight 증가
```

---

## 8. 리스크 및 대응 전략

### 8.1 승인 실패 시나리오

| 시나리오 | 원인 | 대응 |
|---------|------|------|
| Sponsor/Endorser 미확보 | SV들의 관심 부족 | GSF에 직접 연락, 가치 제안 강화, 더 보수적 Weight 제안 |
| cip-discuss에서 부정적 피드백 | 가치 제안 불명확 | 피드백 반영하여 수정, 마일스톤 구체화 |
| 투표 2/3 미달성 | SV 반대 또는 무관심 | 반대 의견 수렴 후 수정, Deferred로 변경 후 재제출 |
| 1개월 기한 초과 | 절차 지연 | Withdrawn 후 재작성, 또는 사전에 연장 요청 |

### 8.2 마일스톤 미달성 시

CIP-0091/0095의 표준 처리:
1. GSF가 미달성 통보
2. 남은 SV Weight가 GSF 노드에서 제거
3. TWG가 미청구 보상 처리 방안 권고
4. SV Weight가 축소되지만, 이미 달성한 마일스톤의 Weight는 유지

**대응**: 마일스톤을 현실적으로 설정하고, 기한에 여유를 두는 것이 중요

### 8.3 CIP-0033 (Strange Pixels) Rejected 사례

- Weight 0.5로 제안했으나 **Rejected** 처리된 유일한 SV 추가 CIP
- 교훈: 가치 제안이 불명확하거나 네트워크 기여가 미미하면 거절 가능
- 대응: 구체적이고 측정 가능한 가치 제안 필수

---

## 9. 주요 연락처 및 리소스

### 메일링리스트

| 리스트 | 용도 | URL |
|--------|------|-----|
| cip-discuss | CIP 초안 논의 (공개) | https://lists.sync.global/g/cip-discuss/topics |
| cip-vote | SV 투표 (멤버십 비공개, 아카이브 공개) | https://lists.sync.global/g/cip-vote/topics |
| cip-announce | 투표 결과 발표 | cip-announce@lists.sync.global |
| supervalidator-ops | SV 운영자 간 조율 | https://lists.sync.global/g/supervalidator-ops/topics |

### GSF 연락

- **운영 문의**: operations@sync.global
- **제출 시 포함사항**: 법인 정보, CIP 링크, 관련 당사자 이메일 주소

### CIP 에디터 (GitHub)

| 이름 | GitHub |
|------|--------|
| Stanislav German-Evtushenko | @stas-sbi |
| Taras Katrichenko | @tkatrichenko |
| Wayne Collier | @waynecollier-da |
| Itai Segall | @isegall-da |
| Amanda Martin | @hythloda |

### GitHub 레포

- CIP 레포: https://github.com/canton-foundation/cips
- CIP 템플릿 (일반): cip-XXXX/cip-XXXX.md
- CIP 템플릿 (Governance): cip-XXXX-Governance/cip-XXXX-Governance.md

---

## 10. 체크리스트

### 제출 전

- [ ] 웨이브릿지 가치 제안 정의 완료
- [ ] 측정 가능한 마일스톤 3~4개 설계 완료
- [ ] 각 마일스톤의 검증 방식(Acceptance Criteria) 확정
- [ ] Weight 전략 결정 (Max Weight, 배분 구조)
- [ ] Weight > 2.5 시 자체 SV 노드 운영 계획 수립
- [ ] 법인 자료 정비 (법인명, 규제 현황, 파트너십)
- [ ] CIP 초안 마크다운 작성 완료

### 외부 소통

- [ ] cip-discuss 메일링리스트 가입
- [ ] GSF에 operations@sync.global 로 사전 연락
- [ ] Sponsor SV 1곳 확보
- [ ] Endorser SV 1곳 확보
- [ ] CIP 에디터와 초안 리뷰 완료

### 제출 후

- [ ] cip-discuss에 Draft 게시
- [ ] GitHub cips 레포에 PR 생성
- [ ] CIP 에디터가 번호 할당 확인
- [ ] Sponsor SV가 cip-vote에 투표 요청
- [ ] 10일 투표 완료 대기
- [ ] 승인 시: PR 머지, 온체인 채택 절차 진행

---

## 부록: 참고 CIP 목록

| CIP | 내용 | 참고 포인트 |
|-----|------|-----------|
| CIP-0000 | CIP 프로세스 정의 | 전체 절차의 근거 문서 |
| CIP-0045 | SV 운영 요건 | Weight > 2.5 자체 노드 의무 |
| CIP-0091 | Zenith (Max 10) | 기술 기여형 마일스톤 구조 참고 |
| CIP-0095 | Mesh (Max 10) | 거래량 기반 성과 연동 구조 참고 |
| CIP-0093 | Bosphorus (Max 6) | 중간 Weight 사례 |
| CIP-0033 | Strange Pixels (Rejected) | 유일한 거절 사례, 교훈 |
