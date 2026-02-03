# WBSalesHub 고객 건강도 & 중요도 시스템 개선

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 5일 (40 WU) |
| 파일 수 | 22개 (신규 15, 수정 7) |
| 예상 LOC | ~2,500줄 |
| 복잡도 | 높음 |

## Relevant Files

### 백엔드 (신규)
- `server/database/migrations/012_add_deal_config_tables.sql` - 설정 테이블 생성
- `server/database/migrations/013_add_customer_importance_fields.sql` - 고객 테이블 확장
- `server/database/migrations/014_add_csm_relationship_scores.sql` - CSM 평가 테이블
- `server/database/migrations/015_add_complaint_activity_type.sql` - 활동 유형 확장
- `server/types/dealConfig.ts` - 타입 정의
- `server/services/dealConfigService.ts` - 설정 CRUD 서비스
- `server/services/healthScoreService.ts` - 건강도 계산 서비스
- `server/services/importanceScoreService.ts` - 중요도 계산 서비스
- `server/services/csmPulseService.ts` - CSM 평가 서비스
- `server/routes/dealConfigRoutes.ts` - 설정 API 라우트
- `server/routes/csmPulseRoutes.ts` - CSM 평가 API 라우트

### 백엔드 (수정)
- `server/types/index.ts` - ActivityType에 '불만' 추가
- `server/index.ts` - 라우트 등록
- `server/modules/reno/features/deal-health/DealHealthAnalyzer.ts` - 새 로직 연동

### 프론트엔드 (신규)
- `frontend/app/(dashboard)/settings/deal-config/page.tsx` - 설정 페이지
- `frontend/components/settings/HealthConfigTab.tsx` - 건강도 설정 탭
- `frontend/components/settings/ImportanceConfigTab.tsx` - 중요도 설정 탭
- `frontend/components/ui/slider.tsx` - 슬라이더 컴포넌트
- `frontend/lib/api/dealConfigApi.ts` - API 클라이언트
- `frontend/types/dealConfig.ts` - 타입 정의

### 프론트엔드 (수정)
- `frontend/app/(dashboard)/settings/page.tsx` - 설정 링크 추가

## Instructions for Completing Tasks

**IMPORTANT:** 각 태스크 완료 시 `- [ ]`를 `- [x]`로 변경하여 진행 상황을 추적합니다.

## Tasks

- [ ] 0.0 작업 환경 확인
  - [ ] 0.1 WBSalesHub 디렉토리로 이동
  - [ ] 0.2 현재 브랜치 및 상태 확인

- [ ] 1.0 [PARALLEL GROUP: db-migrations] DB 마이그레이션 파일 작성
  - [ ] 1.1 012_add_deal_config_tables.sql 작성 (health_config, importance_config)
  - [ ] 1.2 013_add_customer_importance_fields.sql 작성 (customers 테이블 확장)
  - [ ] 1.3 014_add_csm_relationship_scores.sql 작성 (CSM 평가 테이블)
  - [ ] 1.4 015_add_complaint_activity_type.sql 작성 (활동 유형 확장)

- [ ] 2.0 백엔드 타입 정의
  - [ ] 2.1 server/types/dealConfig.ts 생성 (HealthConfig, ImportanceConfig, CsmPulse 타입)
  - [ ] 2.2 server/types/index.ts 수정 (ActivityType에 '불만' 추가)

- [ ] 3.0 [PARALLEL GROUP: backend-services] 백엔드 서비스 구현
  - [ ] 3.1 dealConfigService.ts 구현 (설정 CRUD)
  - [ ] 3.2 healthScoreService.ts 구현 (6요소 건강도 계산, 중요도 연동 감점)
  - [ ] 3.3 importanceScoreService.ts 구현 (4요소 중요도 계산)
  - [ ] 3.4 csmPulseService.ts 구현 (CSM 평가 CRUD)

- [ ] 4.0 [PARALLEL GROUP: backend-routes] 백엔드 API 라우트 구현
  - [ ] 4.1 dealConfigRoutes.ts 구현 (설정 API)
  - [ ] 4.2 csmPulseRoutes.ts 구현 (CSM 평가 API)
  - [ ] 4.3 server/index.ts에 라우트 등록

- [ ] 5.0 DealHealthAnalyzer 수정
  - [ ] 5.1 기존 DealHealthAnalyzer.ts에서 healthScoreService 호출하도록 수정
  - [ ] 5.2 새 건강도 요소 적용 확인

- [ ] 6.0 프론트엔드 타입 및 API 클라이언트
  - [ ] 6.1 frontend/types/dealConfig.ts 생성
  - [ ] 6.2 frontend/lib/api/dealConfigApi.ts 생성

- [ ] 7.0 프론트엔드 UI 컴포넌트
  - [ ] 7.1 slider.tsx 컴포넌트 추가 (shadcn)
  - [ ] 7.2 HealthConfigTab.tsx 구현
  - [ ] 7.3 ImportanceConfigTab.tsx 구현

- [ ] 8.0 프론트엔드 설정 페이지
  - [ ] 8.1 deal-config/page.tsx 구현
  - [ ] 8.2 settings/page.tsx에 링크 추가

- [ ] 9.0 DB 마이그레이션 실행
  - [ ] 9.1 로컬 DB에 마이그레이션 적용
  - [ ] 9.2 초기 데이터 확인

- [ ] 10.0 QA 테스트
  - [ ] 10.1 백엔드 빌드 검증 (`npm run build`)
  - [ ] 10.2 프론트엔드 빌드 검증 (`npm run build`)
  - [ ] 10.3 API 테스트 (설정 조회/수정)
  - [ ] 10.4 건강도 재계산 테스트
  - [ ] 10.5 UI 동작 확인

## Notes

- 이 작업은 WBSalesHub 프로젝트에서 수행됩니다
- 모델 B (하이브리드) 선택: 6개 건강도 요소 + 선택적 CSM 평가
- 거래 데이터는 건강도에서 제외, 중요도에만 사용
- 단일 가중치로 시작 (추후 세그먼트별 분리 가능)
