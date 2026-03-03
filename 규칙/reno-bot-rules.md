# Reno AI 봇 규칙

## 페르소나 관리
- **DB 기반 관리만 사용** — YAML 직접 수정 절대 금지
- API: `/api/ai-admin/personas/*`
- 테이블: `ai_personas`, `ai_persona_change_logs`

## 페르소나 차이점

| 구분 | Internal (직원) | External (고객) |
|------|----------------|-----------------|
| 이모지 | O | **X (절대 금지)** |
| 어투 | 반말/친근 | 격식체만 |

## 슬랙 포맷팅 (CRITICAL)
**플레인 텍스트만 사용. 마크다운 금지.**
- 제목: `[제목]` 대괄호
- 불렛: `• ` 또는 `- `
- **`**볼드**` 절대 금지** — Slack에서 렌더링 안됨
- **`*이탤릭*` 금지**
- `` `코드` `` 최소화

## 배포 규칙
리노봇 관련 코드 수정 시 **스테이징 배포를 기본으로 함께 진행**:
```bash
cd /mnt/c/GitHub/WBSalesHub && ./scripts/deploy-staging.sh
```
- 코드 수정 → 빌드 검증 → 스테이징 배포까지 한 세트
- 배포 완료 후 Slack에서 테스트 가능
- Slack 앱: 스테이징 전용 (App ID: A0ADG3U5DGV)

## 상세 아키텍처
- /mnt/c/GitHub/WHCommon/아키텍처/WBSalesHub.md
