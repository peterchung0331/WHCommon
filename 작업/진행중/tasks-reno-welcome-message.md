# 레노봇 웰컴 메시지 문제 분석 및 개선 PRD

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 0.5일 (4 WU) |
| 파일 수 | 1개 |
| 예상 LOC | ~30줄 |
| 복잡도 | 낮음 |

---

## 문제 상황
- **@Reno 멘션 시**: 웰컴 메시지가 안 나옴 (코드상으로는 나와야 함 - 버그 가능성)
- **DM 시작 시**: 웰컴 메시지가 없음 (구현 자체가 없음)

---

## Relevant Files

- `/mnt/c/GitHub/WBSalesHub/server/modules/integrations/slack/renoSlackApp.ts:512-548` - app_mention 이벤트 핸들러 (채널 멘션 웰컴 메시지)
- `/mnt/c/GitHub/WBSalesHub/server/modules/integrations/slack/renoSlackApp.ts:666-760` - message 이벤트 핸들러 (DM 메시지 처리)

---

## Tasks

- [x] 0.0 Create feature branch (스킵 - master에서 직접 작업)

- [x] 1.0 [PARALLEL GROUP: analysis] 문제 분석 및 디버깅
  - [x] 1.1 멘션 웰컴 메시지 로직 분석 (Agent A)
    - [x] 1.1.1 renoSlackApp.ts:541-548 코드 분석
    - [x] 1.1.2 chat.update 호출 에러 케이스 확인
    - [x] 1.1.3 tempMessage.ts 존재 여부 확인
  - [x] 1.2 DM 웰컴 메시지 로직 분석 (Agent B)
    - [x] 1.2.1 renoSlackApp.ts:697-699 코드 분석
    - [x] 1.2.2 빈 메시지 처리 로직 확인
    - [x] 1.2.3 message 이벤트 트리거 조건 확인

- [x] 2.0 멘션 웰컴 메시지 버그 수정
  - [x] 2.1 chat.update 에러 핸들링 추가
  - [x] 2.2 tempMessage 실패 시 fallback 처리
  - [x] 2.3 상세 로깅 추가

- [x] 3.0 DM 웰컴 메시지 구현
  - [x] 3.1 빈 DM 메시지에 웰컴 메시지 응답 추가
  - [x] 3.2 첫 DM 세션 시 인사 메시지 표시

- [x] 4.0 QA 테스트 및 배포
  - [x] 4.1 빌드 검증 성공
  - [ ] 4.2 스테이징 배포 (`./scripts/deploy-staging.sh`) - 사용자 확인 대기
  - [ ] 4.3 Slack에서 실제 테스트
    - [ ] 4.3.1 @Reno만 멘션 → 웰컴 메시지 확인
    - [ ] 4.3.2 레노봇 DM 열고 메시지 → 웰컴 메시지 확인

---

## 현재 구현 분석

### 1. @Reno 멘션 핸들러 (app_mention)
**파일**: renoSlackApp.ts:512-548

```typescript
this.app.event('app_mention', async ({ event, say, client }) => {
  const userMessage = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

  // 1. 먼저 "처리 중입니다! 😊" 임시 메시지 전송
  tempMessage = await say({ text: '처리 중입니다! 😊', thread_ts: threadTs });

  // 2. 빈 메시지면 웰컴 메시지로 업데이트
  if (!userMessage) {
    await client.chat.update({
      channel: channelId,
      ts: tempMessage.ts,
      text: '안녕하세요! 무엇을 도와드릴까요? 🙋\n`/reno-help`를 입력하면...',
    });
    return;
  }
});
```

**잠재적 문제점:**
- `chat.update` 호출 시 에러가 발생하면 catch되지 않고 무시될 수 있음
- 임시 메시지 전송 실패 시 업데이트할 ts가 없음

### 2. DM 핸들러 (message 이벤트)
**파일**: renoSlackApp.ts:697-699

```typescript
// DM에서 빈 메시지면 그냥 무시
if (!userMessage) {
  return;
}
```

**문제점:**
- 웰컴 메시지 로직 자체가 없음
- 사용자가 DM을 처음 시작해도 아무 응답 없음

---

## 개선안

### Step 1: 멘션 웰컴 메시지 에러 처리 강화
```typescript
if (!userMessage) {
  try {
    await client.chat.update({
      channel: channelId,
      ts: tempMessage.ts,
      text: '안녕하세요! 무엇을 도와드릴까요? 🙋\n`/reno-help`를 입력하면 사용 가능한 명령어를 확인할 수 있습니다.',
    });
  } catch (updateError) {
    console.error('[RenoSlackApp] Failed to update welcome message:', updateError);
    // fallback: 새 메시지 전송
    await say({
      text: '안녕하세요! 무엇을 도와드릴까요? 🙋\n`/reno-help`를 입력하면 사용 가능한 명령어를 확인할 수 있습니다.',
      thread_ts: threadTs,
    });
  }
  return;
}
```

### Step 2: DM 웰컴 메시지 추가
```typescript
if (!userMessage) {
  await say({
    text: '안녕하세요! 무엇을 도와드릴까요? 🙋\n`/reno-help`를 입력하면 사용 가능한 명령어를 확인할 수 있습니다.',
  });
  return;
}
```
