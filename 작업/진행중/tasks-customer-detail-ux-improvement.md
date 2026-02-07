# 고객 상세 화면 UX 개선

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 3일 (24 WU) |
| 파일 수 | 10개 (신규 5, 수정 5) |
| 예상 LOC | ~800줄 |
| 복잡도 | 중간 |

## Relevant Files

- `frontend/app/(dashboard)/customers/detail/page.tsx` - 메인 페이지 (탭 → 스크롤 전환)
- `frontend/components/customers/CustomerDetail.tsx` - 고객 헤더 (여백 축소)
- `frontend/components/customers/context/CustomerContextTab.tsx` - 컨텍스트 표시 (여백/파싱/라벨)
- `frontend/components/customers/context/ContextLogTab.tsx` - 로그 (embedded 모드 추가)
- `frontend/components/customers/context/AddContextModal.tsx` - 추가 모달 (템플릿 적용)
- `frontend/components/customers/SectionDotNav.tsx` - **신규** 플로팅 돗네비
- `frontend/components/customers/context/ParsedSummaryView.tsx` - **신규** 구조화 요약
- `frontend/lib/context-parser.ts` - **신규** 요약 파싱 유틸리티
- `frontend/constants/context-labels.ts` - **신규** 한글 라벨 매핑
- `frontend/constants/context-templates.ts` - **신규** 카테고리별 템플릿

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. Update the file after completing each sub-task.

## Tasks

- [ ] 0.0 사전 조건: 로컬 DB 마이그레이션 적용
  - [ ] 0.1 `001_add_spreadsheet_columns.sql` 마이그레이션 실행 (country_code 컬럼 추가)
  - [ ] 0.2 로컬 백엔드 `/api/customers/13` API 정상 응답 확인

- [ ] 1.0 [PARALLEL GROUP: constants] 상수 파일 생성
  - [ ] 1.1 `frontend/constants/context-labels.ts` 생성 - 한글 라벨 매핑 + formatContextKey 함수
  - [ ] 1.2 `frontend/constants/context-templates.ts` 생성 - 카테고리별 템플릿 정의 (_default, VASP, Prime)

- [ ] 2.0 [PARALLEL GROUP: utils] 유틸리티 및 컴포넌트 생성
  - [ ] 2.1 `frontend/lib/context-parser.ts` 생성 - parseSummary 함수 (날짜/이메일/상태/사람 파싱)
  - [ ] 2.2 `frontend/components/customers/context/ParsedSummaryView.tsx` 생성 - 파싱 결과 렌더링
  - [ ] 2.3 `frontend/components/customers/SectionDotNav.tsx` 생성 - 플로팅 돗네비 (IntersectionObserver)

- [ ] 3.0 메인 페이지 레이아웃 전환
  - [ ] 3.1 `page.tsx` 수정 - Tabs 제거, 섹션별 Collapsible 스택으로 전환
  - [ ] 3.2 각 섹션에 data-section 속성 + 기본 열림/접힘 상태 설정
  - [ ] 3.3 SectionDotNav 통합
  - [ ] 3.4 Playwright로 데스크톱 스크린샷 확인

- [ ] 4.0 컨텍스트 섹션 개선
  - [ ] 4.1 `CustomerContextTab.tsx` 수정 - 여백 축소 (space-y-6→3, p-6→4)
  - [ ] 4.2 요약 영역에 ParsedSummaryView 적용
  - [ ] 4.3 의사결정 요소에 한글 라벨 + 아이콘 적용
  - [ ] 4.4 선호사항에 한글 라벨 + 2열 그리드 적용

- [ ] 5.0 컨텍스트 로그 통합
  - [ ] 5.1 `ContextLogTab.tsx` 수정 - embedded prop 추가 (limit, 전체보기)
  - [ ] 5.2 page.tsx의 컨텍스트 섹션 하단에 embedded 로그 배치

- [ ] 6.0 카테고리별 템플릿 적용
  - [ ] 6.1 `AddContextModal.tsx` 수정 - 고객 카테고리에 따라 필드/가이드 변경

- [ ] 7.0 모바일 대응 및 여백 최종 조정
  - [ ] 7.1 `CustomerDetail.tsx` 헤더 여백 축소
  - [ ] 7.2 모바일 뷰포트(375px) Playwright 스크린샷 확인
  - [ ] 7.3 돗네비 모바일 숨김 확인

- [ ] 8.0 QA 검증
  - [ ] 8.1 데스크톱 전체 섹션 스크롤 + 접기/펼치기 확인
  - [ ] 8.2 돗네비 클릭 → 스무스 스크롤 확인
  - [ ] 8.3 모바일(375px) 레이아웃 확인
  - [ ] 8.4 프론트엔드 빌드 성공 확인 (`npm run build`)
