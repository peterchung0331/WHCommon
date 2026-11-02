# 미팅노트 2-Panel 레이아웃 + Slack 공유 기능

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 1.5일 (12 WU) |
| 파일 수 | 8개 |
| 예상 LOC | ~600줄 |
| 복잡도 | 중간 |

## Relevant Files

- `WBSalesHub/frontend/app/(dashboard)/meeting-notes/page.tsx` - 메인 페이지 (카드 그리드 → 2-Panel 레이아웃)
- `WBSalesHub/frontend/components/meeting-notes/MeetingNoteDetail.tsx` - 상세 보기 (Dialog → 인라인 패널)
- `WBSalesHub/frontend/components/meeting-notes/MeetingNoteListItem.tsx` - 신규: 좌측 리스트 아이템
- `WBSalesHub/frontend/components/meeting-notes/SlackShareModal.tsx` - 신규: Slack 공유 모달
- `WBSalesHub/frontend/lib/api.ts` - API 클라이언트 (slackShareApi 추가)
- `WBSalesHub/server/services/slackShareService.ts` - 신규: Slack 공유 서비스
- `WBSalesHub/server/routes/slackShareRoutes.ts` - 신규: Slack 공유 라우트
- `WBSalesHub/server/index.ts` - 라우트 등록

## Tasks

- [x] 1.0 [PARALLEL GROUP: backend] 백엔드 Slack 공유 API
  - [x] 1.1 slackShareService.ts 생성 (getBotChannels, shareNoteToChannel)
  - [x] 1.2 slackShareRoutes.ts 생성 (GET /channels, POST /meeting-note)
  - [x] 1.3 server/index.ts에 라우트 등록

- [x] 2.0 [PARALLEL GROUP: frontend-components] 프론트엔드 컴포넌트
  - [x] 2.1 MeetingNoteListItem.tsx 신규 생성
  - [x] 2.2 MeetingNoteDetail.tsx 리팩토링 (Dialog → 인라인 패널 + Slack 공유 버튼)
  - [x] 2.3 SlackShareModal.tsx 신규 생성
  - [x] 2.4 api.ts에 slackShareApi 추가

- [x] 3.0 프론트엔드 페이지 재구성
  - [x] 3.1 page.tsx 2-Panel 레이아웃으로 재구성

- [x] 4.0 빌드 검증
  - [x] 4.1 프론트엔드 빌드 확인 (미팅노트 관련 에러 없음, tiptap 의존성은 기존 이슈)
  - [x] 4.2 백엔드 빌드 확인 ✅
