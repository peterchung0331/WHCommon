# BTC Daily Signal — 예측모델 v1.3 (KST 22:00 실행용)

> **목적**
> 매일 **KST 22:00**에 관측 가능한 지표를 이용해,
> 미국장(22:30~) BTC **LONG / SHORT / FLAT** 결정 + 포지션 사이즈 + 리스크 관리를 산출한다.
>
> **v1.3 핵심 변경**
> 1) 출력을 확률 → **행동(Direction + Conviction + Size)** 으로 전환
> 2) **4-Layer 아키텍처**: Regime → Flow → Momentum → Risk
> 3) 이산 버킷 → **연속 점수**(-1.0 ~ +1.0)로 정보 손실 제거
> 4) 핵심 변수 추가: Perp Funding Rate, BTC IV/Skew, Stablecoin Flows, Liquidation Data
> 5) **레짐 적응형 가중치/임계값** — 시장 환경별 다른 해석
> 6) **리스크 관리 내장**: SL/TP, 이벤트 캘린더, 연속 손실 필터, 포지션 사이징

---

## 0) 설계 철학

1. **레짐이 모든 것을 지배한다.** 동일한 신호가 레짐에 따라 반대 의미를 가진다.
2. **출력은 확률이 아니라 행동이다.** LONG / SHORT / FLAT + Conviction(1~5) + Size(%).
3. **비대칭이 기본이다.** BTC는 장기 양의 drift → SHORT 진입 기준이 더 엄격해야 한다.
4. **연속 점수로 정보를 보존한다.** 이산 버킷 경계값의 불안정성을 제거한다.
5. **백테스트 없으면 보수적으로.** 초기 파라미터는 의도적으로 FLAT bias를 준다.

---

## 1) 4-Layer Signal Architecture

```
Layer 1: REGIME (시장 레짐 판별)
    ↓ 레짐에 따라 Layer 2~3의 가중치/임계값 변경
Layer 2: FLOW (자금 흐름 + 포지셔닝) — 5개 변수
    ↓
Layer 3: MOMENTUM (단기 모멘텀) — 4개 변수
    ↓
Layer 4: RISK (리스크 필터 + 사이즈 조정)
    ↓
OUTPUT: Direction(LONG/SHORT/FLAT) + Conviction(1~5) + Size(%) + SL/TP
```

---

## 2) Layer 1: REGIME (시장 레짐 판별)

레짐은 매일 22:00 KST에 판별하며, **모든 후속 레이어의 해석 기준을 결정**한다.

### 2.1 변동성 레짐 (Vol Regime)

| 조건 | 레짐 | 의미 |
|---|---|---|
| BTC ATM IV(7d) < 35% **AND** 20d Realized Vol < 30% | **LOW_VOL** | 압축 상태. 방향성 브레이크아웃 임박. 작은 신호에도 큰 사이즈 가능 |
| BTC ATM IV(7d) 35%~60% | **NORMAL** | 기본 모드. 표준 가중치 적용 |
| BTC ATM IV(7d) > 60% **OR** VIX > 25 | **HIGH_VOL** | 불확실성 극대. 사이즈 감축, FLAT 편향 |

> **데이터 소스**: Deribit 웹사이트 (Options → BTC → IV 차트)

### 2.2 추세 레짐 (Trend Regime)

| 조건 | 레짐 | 의미 |
|---|---|---|
| BTC 20d MA > 50d MA **AND** 현재가 > 20d MA | **UPTREND** | 디핑 매수 유리. LONG 기준 완화, SHORT 기준 강화 |
| BTC 20d MA < 50d MA **AND** 현재가 < 20d MA | **DOWNTREND** | 반등 숏 유리. SHORT 기준 완화, LONG 기준 강화 |
| 그 외 (교차 직후, MA 수렴) | **RANGING** | 방향성 없음. FLAT 편향 |

> **데이터 소스**: TradingView (BTC/USDT 일봉, MA 20/50 오버레이)

### 2.3 매크로 레짐 (Macro Regime)

| 조건 | 레짐 |
|---|---|
| SPX 20d MA 상승 **AND** VIX < 18 **AND** DXY 5d 하락 추세 | **RISK_ON** |
| SPX 20d MA 하락 **OR** VIX > 25 **OR** DXY 5d 급등(+1%↑) | **RISK_OFF** |
| 그 외 | **NEUTRAL** |

> **데이터 소스**: TradingView (SPX, VIX, DXY 차트), Yahoo Finance

### 2.4 레짐 복합 매트릭스

Vol Regime × Trend Regime 조합으로 **REGIME_BIAS**와 **트레이딩 모드**를 결정한다.

| Vol \ Trend | UPTREND | RANGING | DOWNTREND |
|---|---|---|---|
| **LOW_VOL** | Aggressive Long (+0.15) | Breakout Watch (+0.00) | Caution Short (-0.10) |
| **NORMAL** | Standard Long (+0.08) | Neutral (+0.00) | Standard Short (-0.08) |
| **HIGH_VOL** | Reduce & Buy Dips (+0.00) | **FLAT Default** (+0.00) | Reduce & Sell Rallies (+0.00) |

- HIGH_VOL에서는 REGIME_BIAS = 0 (bias 없이 순수 신호에만 의존)
- Macro Regime이 **RISK_OFF**이면: REGIME_BIAS를 **0.05 감산** (추가 보수적)
- Macro Regime이 **RISK_ON**이면: REGIME_BIAS를 **0.03 가산** (약간 공격적)

---

## 3) Layer 2: FLOW (자금 흐름 + 포지셔닝)

모든 변수는 **연속 점수 (-1.0 ~ +1.0)** 으로 변환한다.

### 3.1 Perp Funding Rate `F_fund` (Contrarian)

Perpetual swap funding rate는 **역방향 지표**. 롱 과밀 시 숏 압력, 숏 과밀 시 롱 기회.

| 8h Funding (연환산) | `F_fund` | 해석 |
|---:|---:|---|
| ≥ +30% | -0.8 | 롱 극단 과열 → 강한 숏 압력 |
| +15% ~ +30% | -0.4 | 롱 과열 |
| -5% ~ +15% | 0.0 | 중립 |
| -15% ~ -5% | +0.3 | 숏 편향 |
| -30% ~ -15% | +0.6 | 숏 과열 → 롱 기회 |
| ≤ -30% | +1.0 | 극단적 숏 과열 → 강한 롱 신호 |

> **구간 내 선형 보간** 적용. 예: 연환산 +22%면 F_fund = -0.4 + (-0.8-(-0.4)) × (22-15)/(30-15) = -0.4 + (-0.4)(7/15) ≒ **-0.59**
>
> **데이터 소스**: Binance Futures 또는 Coinglass (무료)

### 3.2 Leverage Ratio `F_lev`

Coinglass 무료에서 청산 히트맵 상세는 제한적이므로, **Estimated Leverage Ratio**를 사용한다.

| BTC Est. Leverage Ratio | `F_lev` | 해석 |
|---:|---:|---|
| ≥ 0.25 | -0.6 | 레버리지 극단 과열 → 청산 캐스케이드 위험 |
| 0.20 ~ 0.25 | -0.3 | 레버리지 높음 |
| 0.15 ~ 0.20 | 0.0 | 정상 범위 |
| 0.10 ~ 0.15 | +0.3 | 레버리지 낮음 (건전한 상승 여력) |
| ≤ 0.10 | +0.6 | 레버리지 극저 → 강한 상승 여력 |

> **선형 보간** 적용.
>
> **데이터 소스**: Coinglass (무료 → BTC Estimated Leverage Ratio)

### 3.3 ETF Flow 3일 합계 `F_etf`

단일일 ETF 유입/유출의 노이즈를 줄이고 추세적 흐름을 포착한다.

```
flow_3d = ETF_FLOW_T-1 + ETF_FLOW_T-2 + ETF_FLOW_T-3  (US$M)
F_etf = clip(flow_3d / 500, -1.0, +1.0)
```

| 3일 합계 (US$M) | `F_etf` |
|---:|---:|
| ≥ +500 | +1.0 |
| +250 | +0.5 |
| 0 | 0.0 |
| -250 | -0.5 |
| ≤ -500 | -1.0 |

> **데이터 소스**: Farside Investors (무료, 수동 확인)

### 3.4 Stablecoin 7d Net Mint `F_stable`

USDT+USDC 7일 순발행은 크립토 시장으로의 신규 자금 유입을 나타낸다.

```
mint_7d = 7일간 USDT + USDC 순발행 (US$B)
F_stable = clip(mint_7d / 2.0, -1.0, +1.0)
```

| 7일 순발행 (US$B) | `F_stable` |
|---:|---:|
| ≥ +2.0 | +1.0 |
| +1.0 | +0.5 |
| 0 | 0.0 |
| -1.0 | -0.5 |
| ≤ -2.0 | -1.0 |

> **데이터 소스**: DefiLlama → Stablecoins (무료)

### 3.5 Coinbase Premium `F_cb`

미국 현물 수요의 프록시. Coinbase vs Binance 가격 차이를 연속 점수로 변환.

```
cb_prem = (Coinbase BTC - Binance BTC) in USD
F_cb = clip(cb_prem / 80, -1.0, +1.0)
```

| 프리미엄 (USD) | `F_cb` |
|---:|---:|
| ≥ +80 | +1.0 |
| +40 | +0.5 |
| 0 | 0.0 |
| -40 | -0.5 |
| ≤ -80 | -1.0 |

> **데이터 소스**: TradingView (COINBASE:BTCUSD - BINANCE:BTCUSDT 차트)

### 3.6 FLOW 복합 점수

```
FLOW = w1×F_fund + w2×F_lev + w3×F_etf + w4×F_stable + w5×F_cb
```

**레짐별 가중치** (합계 = 1.00):

| 가중치 | UPTREND | RANGING | DOWNTREND |
|---|---:|---:|---:|
| w1 (Funding) | 0.25 | 0.30 | 0.25 |
| w2 (Leverage) | 0.25 | 0.25 | 0.25 |
| w3 (ETF 3d) | 0.20 | 0.15 | 0.15 |
| w4 (Stablecoin) | 0.15 | 0.10 | 0.10 |
| w5 (CB Premium) | 0.15 | 0.20 | 0.25 |

> **해석**: RANGING에서는 contrarian(Funding)의 비중 증가.
> DOWNTREND에서는 미국 현물 수요(CB Premium)의 비중 증가.

---

## 4) Layer 3: MOMENTUM (단기 모멘텀)

### 4.1 Pre-open 2h BTC Return `M_pre`

```
PREOPEN_RET_2H = (P_22:00 - P_20:00) / P_20:00 × 100  (%)
M_pre = clip(PREOPEN_RET_2H / 1.5, -1.0, +1.0)
```

| 2h 수익률 | `M_pre` |
|---:|---:|
| ≥ +1.5% | +1.0 |
| +0.75% | +0.5 |
| 0% | 0.0 |
| -0.75% | -0.5 |
| ≤ -1.5% | -1.0 |

> **데이터 소스**: Binance/TradingView (BTC/USDT 실시간)

### 4.2 BTC 4h RSI `M_rsi` (Contrarian)

과매수/과매도는 역방향 지표로 사용한다.

| 4h RSI | `M_rsi` | 해석 |
|---:|---:|---|
| ≥ 80 | -1.0 | 극단 과매수 → 풀백 가능 |
| 75 | -0.6 | 과매수 |
| 65 ~ 75 | 선형 보간 -0.6 ~ 0.0 | |
| 35 ~ 65 | 0.0 | 중립 |
| 25 ~ 35 | 선형 보간 0.0 ~ +0.6 | |
| 25 | +0.6 | 과매도 |
| ≤ 20 | +1.0 | 극단 과매도 → 반등 가능 |

> **단, UPTREND 레짐에서는 RSI 과매수 스코어를 50% 감쇄** (추세 추종 존중)
> **DOWNTREND 레짐에서는 RSI 과매도 스코어를 50% 감쇄** (하락 추세 존중)
>
> **데이터 소스**: TradingView (BTC 4h RSI)

### 4.3 CME OI + Basis `M_cme`

CME 미결제약정 변화와 선물 프리미엄을 결합한다.

```
cme_oi_chg = CME BTC OI 24h 변화 (%)
cme_basis = CME 선물 프리미엄 연환산 (%)

M_cme = 0.6 × clip(cme_oi_chg / 5, -1, +1) + 0.4 × clip(cme_basis / 15, -1, +1)
```

| CME OI 변화 | OI 기여분 | CME Basis | Basis 기여분 |
|---:|---:|---:|---:|
| ≥ +5% | +0.6 | ≥ +15% | +0.4 |
| 0% | 0.0 | 0% | 0.0 |
| ≤ -5% | -0.6 | ≤ -15% | -0.4 |

> **데이터 소스**: TradingView (CME BTC OI), Coinglass (CME Basis)

### 4.4 Options Put-Call Skew `M_skew` (Contrarian)

25-delta skew는 옵션 시장의 방향성 편향을 나타낸다.

```
skew_25d = 25-delta put-call skew (%)
M_skew = clip(-skew_25d / 10, -1.0, +1.0)
```

| 25d Skew | `M_skew` | 해석 |
|---:|---:|---|
| ≤ -10% | +1.0 | 극단적 put skew = 공포 과잉 → 롱 기회 |
| -5% | +0.5 | |
| 0% | 0.0 | 중립 |
| +5% | -0.5 | |
| ≥ +10% | -1.0 | 극단적 call skew = 탐욕 과잉 → 숏 기회 |

> **데이터 소스**: Deribit 웹사이트 (BTC Options → Skew 차트)

### 4.5 MOMENTUM 복합 점수

```
MOM = 0.35×M_pre + 0.25×M_rsi + 0.20×M_cme + 0.20×M_skew
```

---

## 5) Layer 4: RISK (리스크 필터)

이 레이어는 **방향성을 바꾸지 않고, 사이즈만 조정하거나 FLAT으로 오버라이드**한다.

### 5.1 매크로 리스크 스코어 `R_macro` (0 ~ 1.0)

```
R_spx   = clip(-SPX_RET_T-1 / 1.5, 0, 1.0)    # SPX -1.5% 이상이면 1.0
R_vix   = clip(VIX_CHG_T-1 / 15, 0, 1.0)       # VIX +15% 이상이면 1.0
R_dxy   = clip(DXY_CHG_T-1 / 0.8, 0, 1.0)      # DXY +0.8% 이상이면 1.0
R_yield = clip(REAL10Y_DELTA_bp / 10, 0, 1.0)   # 실질금리 +10bp이면 1.0

R_macro = 0.30×R_spx + 0.25×R_vix + 0.25×R_dxy + 0.20×R_yield
```

> R_macro ≥ 0.6이면 **LONG 사이즈 30% 감축**, ≥ 0.8이면 **FLAT 강제**

### 5.2 이벤트 리스크 필터 `R_event` (사이즈 배수)

| 이벤트 | `R_event` | 행동 |
|---|---:|---|
| 이벤트 없음 | 1.0 | 정상 사이즈 |
| 옵션 만기(Deribit 분기), 고용지표 | 0.7 | 사이즈 30% 감축 |
| CPI/PPI 발표일 | 0.5 | 사이즈 50% 감축 |
| **FOMC 결정일** | 0.3 | 사이즈 70% 감축 |
| FOMC 발표 직전 1시간, 서프라이즈 지정학 | **0.0** | **FLAT 강제** |

> **데이터 소스**: ForexFactory (무료 이벤트 캘린더)

### 5.3 연속 손실 필터 `R_streak` (사이즈 배수)

| 조건 | `R_streak` |
|---|---:|
| 연속 손실 0~2일 | 1.0 |
| 연속 손실 3일 | 0.5 |
| 연속 손실 4일 | 0.3 |
| **연속 손실 5일 이상** | **0.0 (FLAT 강제, 모델 재검토)** |

---

## 6) 최종 신호 계산

### Step 1: Raw Signal

```
RAW_SIGNAL = REGIME_BIAS + 0.55 × FLOW + 0.45 × MOM
```

> RAW_SIGNAL 이론적 레인지: 약 -1.07 ~ +1.13 (극단적), 실전 범위: 약 ±0.5 내외

### Step 2: Direction (방향 결정)

**레짐별 비대칭 임계값** (SHORT 기준이 더 엄격):

| Vol Regime | LONG Threshold | SHORT Threshold |
|---|---:|---:|
| LOW_VOL | 0.10 | 0.15 |
| NORMAL | 0.15 | 0.20 |
| HIGH_VOL | 0.25 | 0.30 |

```
if RAW_SIGNAL ≥ +LONG_THRESHOLD:   Direction = LONG
if RAW_SIGNAL ≤ -SHORT_THRESHOLD:  Direction = SHORT
else:                                Direction = FLAT
```

### Step 3: Conviction (확신도, 1~5)

```
signal_strength = |RAW_SIGNAL| - THRESHOLD  (사용된 threshold)
Conviction = min(ceil(signal_strength / 0.08), 5)
```

| signal_strength | Conviction |
|---:|---:|
| 0.00 ~ 0.08 | 1 |
| 0.08 ~ 0.16 | 2 |
| 0.16 ~ 0.24 | 3 |
| 0.24 ~ 0.32 | 4 |
| ≥ 0.32 | 5 |

### Step 4: Position Size (자본의 %)

```
BASE_SIZE:
  Conviction 1 →  5%
  Conviction 2 → 10%
  Conviction 3 → 15%
  Conviction 4 → 20%
  Conviction 5 → 25%

VOL_ADJUST:
  LOW_VOL  → 1.2
  NORMAL   → 1.0
  HIGH_VOL → 0.6

FINAL_SIZE = BASE_SIZE × R_event × R_streak × VOL_ADJUST
```

> **하드캡**: FINAL_SIZE는 **어떤 경우에도 자본의 25%를 초과할 수 없다.**

### Step 5: Leverage & Risk Levels

| Conviction | 최대 레버리지 |
|---:|---:|
| 1 | 1x (무레버리지) |
| 2 | 2x |
| 3 | 3x |
| 4 | 4x |
| 5 | 5x |

> HIGH_VOL 레짐에서는 위 레버리지를 **50% 감축** (예: Conv 4 → 최대 2x)
>
> **절대 하드캡: 5x 초과 금지.**

---

## 7) 리스크 관리 프레임워크

### 7.1 시간 프레임

| 항목 | 값 |
|---|---|
| **진입 시점** | KST 22:30 (미국장 오픈) |
| **기본 청산 시점** | KST 07:00 (미국장 마감 직후) |
| **홀딩 기간** | ~8.5시간 |

### 7.2 스톱로스 / 테이크프로핏

| 규칙 | 조건 | 행동 |
|---|---|---|
| **스톱로스** | 계좌 기준 -2% | 즉시 전량 청산 |
| **테이크프로핏 1** | 계좌 기준 +3% | 50% 포지션 청산 |
| **트레일링 스톱** | TP1 이후, 고점 대비 -1.5% | 나머지 50% 청산 |
| **시간 청산** | 07:00 KST | 잔여 포지션 전량 청산 |

### 7.3 장중 오버라이드

| 조건 | 행동 |
|---|---|
| 미국장 중 서프라이즈 이벤트 발생 | 사이즈 50% 즉시 감축 |
| BTC가 30분 내 ±3% 급변 (flash crash/pump) | 전량 청산, 재진입 금지 |

---

## 8) 일일 운영 Runbook

| 시간 (KST) | 작업 | 산출 |
|---|---|---|
| **21:30** | Layer 1 데이터: BTC IV(Deribit), Realized Vol, MA 20/50 위치, SPX/VIX/DXY 추세 | Vol/Trend/Macro Regime + REGIME_BIAS |
| **21:40** | Layer 2 데이터: Funding rate(Binance), Leverage ratio(Coinglass), ETF flow 3d(Farside), Stablecoin mint(DefiLlama), CB Premium(TradingView) | FLOW score |
| **21:50** | Layer 3 데이터: Pre-open BTC return, 4h RSI, CME OI+Basis, Deribit Skew | MOM score |
| **21:55** | Layer 4 체크: 매크로 리스크(R_macro), 이벤트 캘린더(R_event), 연속 손실(R_streak) | Risk filters |
| **22:00** | **RAW_SIGNAL 계산 → Direction + Conviction + Size 확정** | **최종 신호** |
| **22:30** | 진입 실행 | 포지션 개시 |
| 22:30~07:00 | SL/TP 모니터링 (알림 설정 권장) | 리스크 관리 |
| **07:00** | 기본 청산 (미리 주문 설정) | 포지션 종료 |
| **07:05** | 결과 기록 → 스프레드시트 | 백테스트 DB 구축 |

---

## 9) 일일 입력 템플릿 (복붙용)

```
=== BTC SIGNAL v1.3 === [날짜: ____-__-__]

--- LAYER 1: REGIME ---
BTC ATM IV (7d):             ___%
BTC Realized Vol (20d):      ___%
BTC 현재가 vs 20d MA:        위 / 아래
20d MA vs 50d MA:            위 / 아래 / 교차중
SPX 20d 추세:                상승 / 하락 / 횡보
VIX 레벨:                    ___
DXY 5d 추세:                 상승 / 하락 / 횡보
→ Vol Regime:                LOW_VOL / NORMAL / HIGH_VOL
→ Trend Regime:              UPTREND / RANGING / DOWNTREND
→ Macro Regime:              RISK_ON / NEUTRAL / RISK_OFF
→ REGIME_BIAS:               ___

--- LAYER 2: FLOW ---
Perp Funding (8h 연환산):    ___% → F_fund: ___
Est. Leverage Ratio:         ___ → F_lev: ___
ETF Flow 3일 합계 (US$M):   ___ → F_etf: ___
Stablecoin 7d Mint ($B):     ___ → F_stable: ___
CB Premium (USD):            ___ → F_cb: ___
→ FLOW Score:                ___

--- LAYER 3: MOMENTUM ---
Pre-open 2h BTC Ret (%):    ___ → M_pre: ___
BTC 4h RSI:                  ___ → M_rsi: ___
CME OI 24h chg (%) / Basis (%): ___ / ___ → M_cme: ___
25d Put-Call Skew (%):       ___ → M_skew: ___
→ MOM Score:                 ___

--- LAYER 4: RISK ---
SPX T-1 Return (%):         ___ → R_spx: ___
VIX Change T-1 (%):         ___ → R_vix: ___
DXY Change T-1 (%):         ___ → R_dxy: ___
Real 10Y Yield Delta (bp):  ___ → R_yield: ___
→ R_macro:                   ___
이벤트 캘린더:               ___ → R_event: ___
연속 손실 일수:              ___ → R_streak: ___

--- OUTPUT ---
RAW_SIGNAL:                  ___
Threshold (Long / Short):    ___ / ___
→ DIRECTION:                 LONG / SHORT / FLAT
→ CONVICTION:                ___  (1~5)
→ BASE_SIZE:                 ___%
→ FINAL_SIZE:                ___% (리스크 조정 후)
→ MAX LEVERAGE:              ___x
→ STOP LOSS:                 -2.0%
→ TAKE PROFIT 1:             +3.0% (50% 청산)
→ TRAILING STOP:             1.5%
→ 시간 청산:                 07:00 KST
```

---

## 10) 무료 데이터 소스 가이드

| 변수 | 무료 소스 | URL / 접근법 | 업데이트 |
|---|---|---|---|
| BTC ATM IV (7d) | Deribit | deribit.com → Options → BTC → IV Term Structure | 실시간 |
| BTC Realized Vol | TradingView | BVOL 또는 수동 계산 | 실시간 |
| BTC MA 20/50 | TradingView | BTC/USDT 일봉 + MA 오버레이 | 실시간 |
| Perp Funding Rate | Coinglass / Binance | coinglass.com/FundingRate | 실시간 |
| Est. Leverage Ratio | Coinglass | coinglass.com/pro/futures/EstimatedLeverageRatio | 실시간 |
| ETF Flow | Farside Investors | farside.co.uk/btc/ | T+1 (수동) |
| Stablecoin Mint | DefiLlama | defillama.com/stablecoins | 준실시간 |
| CB Premium | TradingView | COINBASE:BTCUSD - BINANCE:BTCUSDT 수식 차트 | 실시간 |
| BTC 4h RSI | TradingView | BTC/USDT 4h 차트 + RSI 인디케이터 | 실시간 |
| CME OI / Basis | Coinglass / TradingView | coinglass.com/BitcoinOpenInterest | 실시간 |
| 25d Skew | Deribit | deribit.com → Options → BTC → Skew | 실시간 |
| SPX / VIX / DXY | TradingView / Yahoo Finance | 차트 직접 확인 | 전일 확정 |
| Real 10Y Yield | FRED | fred.stlouisfed.org/series/DFII10 | 전일 확정 |
| 이벤트 캘린더 | ForexFactory | forexfactory.com/calendar | 사전 확인 |

---

## 11) Paper Trading & 파라미터 튜닝

### 11.1 Paper Trading 기간

v1.3은 백테스트 없이 설계된 모델이다. **최소 30 거래일 paper trading**을 권고한다.

**매일 기록할 항목:**
- 전체 입력값 + 점수
- 최종 신호 (Direction, Conviction, Size)
- 가상 진입/청산가, PnL
- 특이사항 (이벤트, 서프라이즈 등)

**30일 후 검증 지표:**
| 지표 | 최소 기준 | 목표 |
|---|---|---|
| 적중률 (Hit Rate) | ≥ 52% | ≥ 56% |
| 평균 손익비 (Avg Win / Avg Loss) | ≥ 1.2 | ≥ 1.5 |
| 최대 연속 손실 | ≤ 5일 | ≤ 3일 |
| Sharpe Ratio (일간) | ≥ 0.5 | ≥ 1.0 |

> 적중률 < 52% **AND** 손익비 < 1.2이면 → 파라미터 재조정 또는 모델 구조 재검토.

### 11.2 튜닝 우선순위

데이터가 축적되면 다음 순서로 튜닝한다:

1. **THRESHOLD 값** — FLAT 구간 폭. 가장 큰 영향. FLAT 과다 → 기회 손실, FLAT 부족 → 잡음 거래
2. **FLOW 가중치(w1~w5)** — 어떤 변수가 실제 예측력이 있는지 데이터로 검증
3. **REGIME_BIAS 크기** — 추세 편향이 실제로 수익 기여하는지 검증
4. **SL/TP 수준** — -2%/+3%가 최적인지, 레짐별로 달라야 하는지

### 11.3 Kelly Criterion (향후)

적중률(p)과 평균 손익비(b)가 축적되면:
```
f* = (p × b - (1-p)) / b
```
이 최적 비율의 **절반(half-Kelly)** 을 사이즈 상한으로 사용한다.

---

## 12) 계산 예시

### 예시: 2026-03-04

**Layer 1 — REGIME:**
- BTC ATM IV(7d) = 42% → **NORMAL**
- BTC > 20d MA, 20d MA > 50d MA → **UPTREND**
- SPX 상승, VIX = 16, DXY 횡보 → **RISK_ON**
- REGIME_BIAS = +0.08 (NORMAL+UPTREND) + 0.03 (RISK_ON) = **+0.11**

**Layer 2 — FLOW:**
- Funding 연환산 +8% → F_fund = 0.0 (중립 구간)
- Leverage Ratio = 0.18 → F_lev = 0.0 (정상)
- ETF 3d = +320M → F_etf = +0.64
- Stablecoin 7d = +0.8B → F_stable = +0.40
- CB Premium = +35 USD → F_cb = +0.44
- FLOW = 0.25(0) + 0.25(0) + 0.20(0.64) + 0.15(0.40) + 0.15(0.44) = **+0.254**

**Layer 3 — MOMENTUM:**
- Pre-open 2h = +0.5% → M_pre = +0.33
- 4h RSI = 58 → M_rsi = 0.0 (중립)
- CME OI +2%, Basis +9% → M_cme = 0.6(0.4) + 0.4(0.6) = **+0.48**
- 25d Skew = -3% → M_skew = +0.30
- MOM = 0.35(0.33) + 0.25(0) + 0.20(0.48) + 0.20(0.30) = **+0.272**

**RAW_SIGNAL:**
```
= 0.11 + 0.55(0.254) + 0.45(0.272)
= 0.11 + 0.140 + 0.122
= +0.372
```

**Direction:** NORMAL → LONG Threshold = 0.15. RAW = +0.372 ≥ 0.15 → **LONG**

**Conviction:** signal_strength = 0.372 - 0.15 = 0.222 → ceil(0.222/0.08) = 3 → **Conviction 3**

**Size:**
- BASE_SIZE = 15%
- R_event = 1.0 (이벤트 없음)
- R_streak = 1.0 (연속 손실 없음)
- VOL_ADJUST = 1.0 (NORMAL)
- FINAL_SIZE = 15% × 1.0 × 1.0 × 1.0 = **15%**

**최종 신호:**
```
→ DIRECTION:    LONG
→ CONVICTION:   3
→ FINAL_SIZE:   15%
→ MAX LEVERAGE:  3x
→ STOP LOSS:    -2.0%
→ TAKE PROFIT:  +3.0% (50%), Trailing 1.5%
→ 진입:          22:30 KST
→ 시간 청산:     07:00 KST
```

---

## 13) v1.4 확장 아이디어

- **자동화**: 데이터 수집 + 스코어 계산 자동화 (Python 스크립트 또는 Google Sheets)
- **Exchange Net Flow**: CryptoQuant Pro 구독 시 FLOW 변수로 추가
- **GEX (Gamma Exposure)**: SPX 옵션 GEX → 매크로 변동성 예측 보강
- **BTC Dominance 변화**: Altcoin rotation vs BTC 집중 구간 판별
- **AI/ML 튜닝**: 30일+ 데이터 축적 후 로지스틱 회귀로 가중치 최적화
- **Kelly 자동 사이징**: 실적 데이터 기반 동적 포지션 사이징
