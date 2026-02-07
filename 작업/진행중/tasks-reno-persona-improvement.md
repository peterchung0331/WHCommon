# 리노봇 페르소나 개선 작업

## 작업량 요약

| 항목 | 값 |
|------|-----|
| 총 작업량 | 2일 (16 WU) |
| 파일 수 | 4개 (YAML, TS 파일들) |
| 예상 LOC | ~800줄 |
| 복잡도 | 중간 |

## Relevant Files

- `/mnt/c/GitHub/WBHubManager/packages/ai-agent-core/personas/reno-internal.yaml` - 페르소나 정의 (환영 메시지, 기능 가이드)
- `/mnt/c/GitHub/WBSalesHub/server/modules/reno/agent/RenoAgent.ts:300-900` - Reno 에이전트 메인 (도구 추가, 확인 프로세스)
- `/mnt/c/GitHub/WBSalesHub/server/modules/reno/context/CustomerContextManager.ts:100-500` - 컨텍스트 관리자 (미리보기, 블렛포인트)
- `/mnt/c/GitHub/WBSalesHub/server/modules/reno/types/customer.ts` - 타입 정의 (ExtractedEntities 확장)

## Tasks

- [ ] 0.0 작업 준비
  - [x] 실행_작업.md 참조
  - [x] 병렬 실행 그룹 식별
  - [ ] TodoWrite로 작업 추적 업데이트

- [ ] 1.0 [PARALLEL GROUP: phase1-files] Phase 1: 파일 수정 (독립적 - 병렬 실행)
  - [ ] 1.1 reno-internal.yaml 환영 메시지 개선
    - [x] 1.1.1 greeting_response를 자연어 명령어 예시 포함으로 재작성
    - [ ] 1.1.2 feature_guides 섹션 추가 (고객 검색, 세일즈 현황, 고객 메모, 컨텍스트 업데이트)
    - [ ] 1.1.3 system_prompt_template에 세일즈 현황 안내 추가
    - [ ] 1.1.4 behavior 섹션에 감정 인식 및 공감 표현 추가
    - [ ] 1.1.5 knowledge 섹션에 GPCT 프레임워크 추가
  - [ ] 1.2 RenoAgent.ts에 get_sales_summary 도구 추가
    - [ ] 1.2.1 RENO_TOOLS 배열에 get_sales_summary 도구 정의 추가
    - [ ] 1.2.2 processTool() switch문에 get_sales_summary 케이스 추가
    - [ ] 1.2.3 SalesSummaryService import 및 사용
  - [ ] 1.3 CustomerContextManager.ts에 확인 프로세스 추가
    - [ ] 1.3.1 previewContextUpdate() 메서드 구현
    - [ ] 1.3.2 generateDiff() private 메서드 구현
    - [ ] 1.3.3 buildConfirmationMessage() private 메서드 구현
    - [ ] 1.3.4 formatValue() private 메서드 구현
  - [ ] 1.4 블렛포인트 지원 기능 구현
    - [ ] 1.4.1 normalizeBulletPoints() private 메서드 추가
    - [ ] 1.4.2 processMemo() 메서드 수정 (정규화 로직 추가)
    - [ ] 1.4.3 extractEntities() 프롬프트 개선 (bullet_items 추가)
    - [ ] 1.4.4 customer.ts의 ExtractedEntities 타입에 bullet_items 필드 추가

- [ ] 2.0 Phase 2: RenoAgent 업데이트 플로우 수정 (1단계 의존)
  - [ ] 2.1 Session 인터페이스 확장
    - [ ] 2.1.1 pendingContextUpdate 필드 추가
  - [ ] 2.2 update_customer_context 케이스 수정
    - [ ] 2.2.1 미리보기 생성 로직 추가
    - [ ] 2.2.2 세션에 pending update 저장
  - [ ] 2.3 processMessage()에 확인 응답 처리 추가
    - [ ] 2.3.1 pending update 체크 로직
    - [ ] 2.3.2 확인 키워드 처리
    - [ ] 2.3.3 취소 키워드 처리

- [ ] 3.0 Phase 3: DB 페르소나 업데이트 (2단계 의존)
  - [ ] 3.1 YAML 파일 내용을 DB에 반영
    - [ ] 3.1.1 wbhubmanager DB 연결
    - [ ] 3.1.2 ai_personas 테이블 업데이트 (reno-internal)
    - [ ] 3.1.3 version 증가 (v2)

- [ ] 4.0 [PARALLEL GROUP: build-deploy] Phase 4: 빌드 및 배포 (3단계 의존)
  - [ ] 4.1 로컬 빌드
    - [ ] 4.1.1 ai-agent-core 패키지 빌드 (선택적)
    - [ ] 4.1.2 WBSalesHub 백엔드 빌드 확인
  - [ ] 4.2 오라클 서버 배포
    - [ ] 4.2.1 파일 복사 (scp)
    - [ ] 4.2.2 컨테이너 재시작
  - [ ] 4.3 슬랙 테스트
    - [ ] 4.3.1 환영 메시지 테스트 ("안녕")
    - [ ] 4.3.2 기능 가이드 테스트 ("고객 검색 사용법")
    - [ ] 4.3.3 세일즈 현황 테스트 ("오늘 세일즈 현황")
    - [ ] 4.3.4 컨텍스트 확인 프로세스 테스트
    - [ ] 4.3.5 블렛포인트 입력 테스트

## 병렬 실행 전략

### Group 1: phase1-files (병렬 실행 가능)
- **1.1 YAML 수정** + **1.2 RenoAgent 도구** + **1.3 CustomerContext 메서드** + **1.4 블렛포인트**
- 이유: 모두 독립적인 파일 수정, 상호 의존성 없음
- 예상 시간 절감: 60분 → 20분 (3배 빠름)

### Group 2: build-deploy (일부 병렬)
- **4.1 로컬 빌드** 완료 후 **4.2 배포** + **4.3 테스트** 순차
- 이유: 빌드 성공 확인 후 배포해야 함

## 완료 조건
- [ ] 모든 파일 수정 완료
- [ ] DB 페르소나 업데이트 완료
- [ ] 오라클 서버 배포 완료
- [ ] 슬랙 테스트 5개 모두 통과
