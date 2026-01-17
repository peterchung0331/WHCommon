# Task: 세일즈허브 고객정보 DB 스키마 확장

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 1.75일 (14 WU) |
| 파일 수 | 8개 (신규 2개, 수정 6개) |
| 예상 LOC | ~500줄 |
| 복잡도 | 중간 |

## Relevant Files

- `server/database/migrations/add_spreadsheet_columns.sql` - **신규** DB 마이그레이션 파일
- `server/database/schema.sql` - 참조용 스키마 (수정 불필요)
- `server/types/index.ts:7-82` - Customer 인터페이스 확장
- `server/services/customerService.ts` - CRUD 로직 수정
- `server/routes/customerRoutes.ts` - 필터 옵션 추가
- `server/scripts/importSpreadsheet.ts` - **신규** 데이터 임포트 스크립트
- `frontend/types/customer.ts` - 프론트엔드 타입 동기화
- `frontend/components/CustomerForm.tsx` - 폼 필드 추가

### Notes

- 스프레드시트 전체 데이터를 한 번에 임포트 (사용자 확인 완료)
- Turn 컬럼: 완료 여부, 고객 회신 차례, 우리 회사 회신 차례를 구분
- AML 별도 추적 불필요, 온보딩 완료 여부만 표시
- 담당자 정보(이름, 이메일, 전화, 직책)는 customer_contacts 테이블에 별도 INSERT

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/customer-schema-extension`

- [x] 1.0 [PARALLEL GROUP: schema-changes] 스키마 변경 (마이그레이션 SQL)
  - [x] 1.1 `server/database/migrations/` 디렉토리 생성 (없는 경우)
  - [x] 1.2 `add_spreadsheet_columns.sql` 마이그레이션 파일 생성
    - turn_status_type ENUM 생성
    - entity_type ENUM 생성
    - customers 테이블 컬럼 추가 (12개)
  - [x] 1.3 인덱스 추가
    - `idx_customers_entity_type`
    - `idx_customers_turn_status`
    - `idx_customers_kyc_completed`
    - `idx_customers_country_code`
  - [ ] 1.4 로컬/오라클 DB에 마이그레이션 적용 및 검증

- [x] 2.0 백엔드 타입 정의 업데이트
  - [x] 2.1 `server/types/index.ts` - Customer 인터페이스 확장
    - 신규 필드 추가: country_code, entity_type, turn_status, location
    - 신규 필드 추가: kyc_completed, kyc_completed_date, onboarding_completed
    - 신규 필드 추가: document_sent_date, document_received_date
    - 신규 필드 추가: ceo_name, business_area, team_leader
  - [x] 2.2 `server/types/index.ts` - CustomerInput 인터페이스 확장
  - [x] 2.3 SalesStage 타입 확장 (회신 대기, 피드백 진행중, 계약 안내 완료, Drop)
  - [x] 2.4 TurnStatus, EntityType 타입 추가
  - [x] 2.5 CustomerFilter 인터페이스에 신규 필터 추가

- [x] 3.0 백엔드 서비스/라우트 수정
  - [x] 3.1 `server/services/customerService.ts` - 신규 컬럼 처리
    - getAll() 쿼리에 신규 필터 추가
    - update() 에 신규 날짜 필드 처리
  - [x] 3.2 필터 옵션 추가 (entity_type, turn_status, kyc_completed, country_code)

- [x] 4.0 데이터 임포트 스크립트 생성
  - [x] 4.1 `server/scripts/importSpreadsheet.ts` 생성
    - CSV 파싱 로직 (csv-parse)
    - 컬럼 매핑 함수
    - 데이터 변환 함수 (날짜, boolean, enum)
  - [x] 4.2 customer_contacts 동시 생성 로직
  - [x] 4.3 중복 체크 로직 (company_name 기준)
  - [x] 4.4 트랜잭션 처리 및 롤백 로직

- [x] 5.0 프론트엔드 수정
  - [x] 5.1 `frontend/types/customer.ts` - 타입 동기화
    - SalesStage 확장
    - TurnStatus, EntityType 추가
    - Customer 인터페이스에 신규 필드 추가

- [x] 6.0 빌드 검증
  - [x] 6.1 백엔드 빌드 확인 (`npm run build:server`)
  - [x] 6.2 프론트엔드 빌드 확인 (`npm run build:frontend`)

- [x] 7.0 DB 마이그레이션
  - [ ] 7.1 로컬 DB 마이그레이션 (DB 실행 필요)
  - [x] 7.2 오라클 DB 마이그레이션 완료
    - 12개 컬럼 추가 완료
    - 4개 인덱스 생성 완료

- [ ] 8.0 데이터 임포트 (사용자 제공 CSV 필요)
  - [ ] 8.1 스프레드시트 CSV 변환
  - [ ] 8.2 임포트 스크립트 실행
  - [ ] 8.3 데이터 검증

## 신규 컬럼 상세

| 컬럼명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| country_code | VARCHAR(10) | 'KR' | 국가 코드 |
| entity_type | VARCHAR(20) | NULL | 법인/개인/투자조합/W/B/펀드 |
| turn_status | VARCHAR(30) | 'pending' | 회신 차례 상태 |
| location | VARCHAR(255) | NULL | 위치/지역 |
| kyc_completed | BOOLEAN | FALSE | KYC 완료 여부 |
| kyc_completed_date | TIMESTAMP | NULL | KYC 완료일 |
| onboarding_completed | BOOLEAN | FALSE | 온보딩 완료 여부 |
| document_sent_date | TIMESTAMP | NULL | 서류 발송일 |
| document_received_date | TIMESTAMP | NULL | 서류 수령일 |
| ceo_name | VARCHAR(100) | NULL | 대표자명 |
| business_area | VARCHAR(255) | NULL | 사업영역 |
| team_leader | VARCHAR(100) | NULL | 담당 팀장 |

## turn_status 값 매핑

| 스프레드시트 값 | DB 값 |
|----------------|-------|
| 완료 | completed |
| 회신 대기 / Peter | waiting_wb_peter |
| 회신 대기 / Jin | waiting_wb_jin |
| 가입 완료 | completed |
| 3차/4차 피드백 완료 / 회신대기 | waiting_customer |
| Pending | pending |
| Drop | dropped |
