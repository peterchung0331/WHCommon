# Slack KG 백필 작업 기록 (2026-03-17)

## 목적
리노봇 참여 채널 2025-07-01 이후 메시지 전체 → KG v3 (crm_episodic_memories + crm_semantic_facts) 백필

## 상태: 구현 완료, 실행 대기

## 채널 목록 (11개, chat-biz-dept 영구 제외)

| 채널ID | 채널명 | 모드 | 예상건수 | 상태 |
|--------|--------|------|---------|------|
| C0ACWDEE13L | 부서-BD팀 | unstructured | 433 | 대기 |
| C0AD01S2760 | 부서-sales-and-operation | unstructured | 257 | 대기 |
| C096XMFD5S7 | 운영-prime-kr-온보딩 | structured | 91 | 대기 |
| C0ADQN3LV24 | tf-welcome-exchanges | unstructured | 226 | 대기 |
| C09991P0A1H | tf-welcome-hashed | hint (Hashed) | 156 | 대기 |
| C0ACT119DQD | tf-wbp-에스크로-서비스 | unstructured | 113 | 대기 |
| C0AEV2BUWQG | tf-bitcoin-spot-etf | unstructured | 13 | 대기 |
| C0AD9B8V38R | ir-series-c | unstructured | 125 | 대기 |
| G0AD9B9DC5P | tf-광주은행원화연동 | unstructured | 36 | 대기 |
| G0ACUBZD5U6 | tf-금융위원회-디자법 | unstructured | 35 | 대기 |
| G0ACUJ6CNUA | proj-prime-kr-lp-line-setup | unstructured | 47 | 대기 |

**총 예상: 1,532건**
~~C08MG8ZEC6P chat-biz-dept~~ → **영구 제외** (잡담, 백필/실시간 모두 제외)

---

## 실행 명령

### Step 1: Wave 1 dry-run
```bash
curl -s -X POST https://workhub.biz/saleshub/api/slack/share/backfill-kg \
  -H "Content-Type: application/json" \
  -b "session=<쿠키>" \
  -d '{
    "channels": [
      {"channelId": "C0ACWDEE13L", "mode": "unstructured"},
      {"channelId": "C0AD01S2760", "mode": "unstructured"},
      {"channelId": "C0ADQN3LV24", "mode": "unstructured"},
      {"channelId": "C0ACT119DQD", "mode": "unstructured"},
      {"channelId": "C09991P0A1H", "mode": "hint", "customerHint": "Hashed"},
      {"channelId": "C096XMFD5S7", "mode": "structured"}
    ],
    "since": "2025-07-01",
    "dryRun": true,
    "concurrency": 3
  }'
```

### Step 2: Wave 1 실제 실행 (dryRun: false)

### Step 3: Wave 2
```bash
curl -s -X POST https://workhub.biz/saleshub/api/slack/share/backfill-kg \
  -H "Content-Type: application/json" \
  -b "session=<쿠키>" \
  -d '{
    "channels": [
      {"channelId": "C0AD9B8V38R", "mode": "unstructured"},
      {"channelId": "C0AEV2BUWQG", "mode": "unstructured"},
      {"channelId": "G0AD9B9DC5P", "mode": "unstructured"},
      {"channelId": "G0ACUBZD5U6", "mode": "unstructured"},
      {"channelId": "G0ACUJ6CNUA", "mode": "unstructured"}
    ],
    "since": "2025-07-01",
    "dryRun": false,
    "concurrency": 3
  }'
```

---

## 검증 SQL

```sql
-- 채널별 에피소드 생성 현황
SELECT source_type, episode_type, COUNT(*) as cnt, ROUND(AVG(importance)::numeric, 1) as avg_importance
FROM crm_episodic_memories
WHERE source_type = 'slack' AND created_at > '2026-03-17'
GROUP BY source_type, episode_type;

-- 고객별 semantic facts 축적
SELECT c.company_name, COUNT(sf.id) as facts
FROM crm_semantic_facts sf
JOIN customers c ON c.id = sf.customer_id
WHERE sf.created_at > '2026-03-17'
GROUP BY c.company_name
ORDER BY facts DESC
LIMIT 20;
```

---

## 실행 결과

| 날짜 | Wave | 결과 | 비고 |
|------|------|------|------|
| - | - | - | 미실행 |

---

## 구현 변경 사항

- `slackKgBackfillService.ts` 전면 재작성 (2026-03-17)
  - 3모드: structured / unstructured / hint
  - AI 배치 분류 (20개씩)
  - source_id = message ts 중복 방지
  - mentionedCompanies → key_facts 포함
  - 병렬 처리 (concurrency 파라미터)
- `slackShareRoutes.ts` 새 인터페이스 적용
- `UNSTRUCTURED_SLACK_CHANNELS` 에서 C08MG8ZEC6P 제거 (양쪽 env)
- `channelMonitor.ts`, `unstructuredChannelCollector.ts` → KG v3 실시간 삽입 추가
- `types.ts` → EpisodeType에 'slack' 추가
