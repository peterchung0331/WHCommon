# PRD: 스모크테스트 스킬 (Smoke Test Skill)

## 1. Introduction/Overview

### 문제 정의
현재 개발 프로세스에서 개발자가 코드 변경 후 기본 기능이 정상 작동하는지 빠르게 확인할 방법이 부족합니다. 전체 테스트 스위트는 너무 느리고(3-10분), 수동 확인은 일관성이 없으며, 필수 체크 항목을 놓칠 위험이 있습니다.

### 솔루션
스킬테스터에 **스모크테스트** 서브 스킬을 추가하여, 개발 중 필수 기능들을 1분 이내에 자동으로 체크하고, 실패 시 원인을 분석하여 해결책을 제안하는 기능을 구현합니다.

### 목표
- 개발 중간중간 필수 요소를 빠르게(1분 이내) 검증
- 실패 원인을 자동 분석하고 해결책 제안
- 모든 WorkHub 프로젝트에서 일관된 체크리스트 적용
- TestAgent DB에 테스트 이력 저장 및 관리

---

## 2. Goals

### 구체적 목표
1. **속도**: 1분 이내에 5-10개 필수 항목 체크 완료
2. **자동화**: 실패 시 원인 분석 및 자동 수정 시도 (최대 1회 재시도)
3. **일관성**: YAML 체크리스트로 프로젝트별 필수 항목 표준화
4. **가시성**: 마크다운 리포트 + DB 저장으로 이력 관리
5. **확장성**: 모든 WorkHub 프로젝트 지원

### 측정 가능한 성공 지표
- 평균 실행 시간: 30초-1분
- 체크 항목 통과율: 95% 이상
- 자동 수정 성공률: 30% 이상
- 개발자 만족도: 수동 체크 대비 시간 80% 절감

---

## 3. User Stories

### US-1: 개발자가 코드 변경 후 빠른 체크를 원함
**As a** 개발자
**I want to** 코드 변경 후 필수 기능이 정상인지 1분 안에 확인하고 싶다
**So that** 전체 테스트를 기다리지 않고 빠르게 피드백을 받을 수 있다

**Acceptance Criteria:**
- `/스킬테스터 스모크` 명령 하나로 실행 가능
- 1분 이내에 결과 확인 가능
- Health Check, 인증, 주요 API, DB 연결 검증

### US-2: 개발자가 실패 원인을 빠르게 파악하고 싶음
**As a** 개발자
**I want to** 테스트 실패 시 상세한 원인과 해결책을 받고 싶다
**So that** 디버깅 시간을 최소화할 수 있다

**Acceptance Criteria:**
- 실패한 체크 항목의 요청/응답 로그 확인
- 실패 원인 분석 (서버 미실행, 타임아웃, 응답 불일치 등)
- 구체적인 해결책 제안 (서버 재시작, 환경변수 설정 등)

### US-3: 팀 리더가 프로젝트별 필수 체크 항목을 관리하고 싶음
**As a** 팀 리더
**I want to** 각 프로젝트의 필수 체크 항목을 YAML 파일로 관리하고 싶다
**So that** 팀 전체가 일관된 기준으로 스모크테스트를 실행할 수 있다

**Acceptance Criteria:**
- YAML 파일로 체크리스트 정의 및 버전 관리
- 우선순위 설정 (Critical, High, Medium, Low)
- 프로젝트별 독립적인 체크리스트 유지

### US-4: QA 담당자가 테스트 이력을 추적하고 싶음
**As a** QA 담당자
**I want to** 스모크테스트 실행 이력을 DB에서 조회하고 싶다
**So that** 프로젝트의 안정성 트렌드를 분석할 수 있다

**Acceptance Criteria:**
- TestAgent DB에 테스트 실행 이력 저장
- 체크 항목별 성공/실패 통계 확인
- 리포트를 마크다운 파일로도 저장하여 즉시 확인 가능

---

## 4. Functional Requirements

### FR-1: 스모크테스트 스킬 생성
**우선순위:** 🔴 Critical

시스템은 새로운 서브 스킬 `스킬테스터-스모크`를 생성하고, 메인 디스패처 `스킬테스터.md`에 파싱 규칙을 추가해야 한다.

**상세:**
- 파일 위치: `~/.claude/skills/스킬테스터-스모크.md`
- 키워드: "스모크", "smoke", "필수체크"
- 자동 호출: `/스킬테스터 [프로젝트] 스모크`

### FR-2: YAML 체크리스트 로더
**우선순위:** 🔴 Critical

시스템은 프로젝트별 YAML 체크리스트 파일을 로드하고 파싱해야 한다.

**상세:**
- 경로: `/home/peterchung/HWTestAgent/scenarios/[project]/smoke.yaml`
- 필드: name, type, timeout, retries, checks[]
- 각 체크: id, name, priority, request{method, url, expected{status, body}}

### FR-3: 환경 자동 감지
**우선순위:** 🟠 High

시스템은 현재 실행 환경(Docker Compose / 로컬 개발 서버)을 자동 감지하고 적절한 baseURL을 설정해야 한다.

**상세:**
- Docker Compose 실행 확인: `docker-compose ps`
- 로컬 서버 확인: 포트 체크 (예: 3090, 3000)
- baseURL 결정: Docker → `http://localhost:3090`, Local → 환경변수

### FR-4: 순차적 체크 실행
**우선순위:** 🔴 Critical

시스템은 YAML 체크리스트의 각 항목을 우선순위 순으로 순차 실행하고 결과를 기록해야 한다.

**상세:**
- 우선순위 정렬: critical → high → medium → low
- 진행 상황 표시: `[1/5] Health Check API 실행 중...`
- HTTP 요청 전송 및 응답 검증
- 결과 기록: 성공/실패, 응답시간, 에러 메시지

### FR-5: 실패 원인 자동 분석
**우선순위:** 🔴 Critical

시스템은 체크 실패 시 원인을 자동 분석하고 카테고리화해야 한다.

**실패 유형:**
- 네트워크 오류 (서버 미실행): `ECONNREFUSED`
- 타임아웃: `ETIMEDOUT`
- 잘못된 응답 상태: `Expected 200, got 500`
- 응답 본문 불일치: `Expected "ok", got "error"`
- 인증 오류: `401 Unauthorized`

### FR-6: 자동 수정 및 재시도
**우선순위:** 🟠 High

시스템은 특정 실패 유형에 대해 자동 수정을 시도하고 1회 재시도해야 한다.

**자동 수정 시나리오:**
- 서버 미실행 → Docker Compose 시작 제안 및 재시도
- 타임아웃 → 재시도 (timeout 증가 없음)
- 기타 → 상세 로그 기록 후 다음 체크 진행

### FR-7: 리포트 생성
**우선순위:** 🔴 Critical

시스템은 기존 `테스트-리포트-템플릿.md` 형식을 따르는 마크다운 리포트를 생성해야 한다.

**리포트 구조:**
1. 📊 스모크테스트 결과 요약
   - 총 체크 항목 / 성공 / 실패 / 통과율
   - 총 실행시간
   - 실행 환경
2. 📋 체크 항목별 상세 결과 (테이블)
   - 순번 | 체크 항목 | 우선순위 | 결과 | 응답시간
3. ❌ 실패 케이스 상세 분석
   - 실패 원인
   - 요청/응답 로그
   - 제안된 해결책
4. 🔧 수정사항 (자동 수정이 있을 경우)
5. 📝 결론 및 권장사항

### FR-8: DB 저장
**우선순위:** 🟠 High

시스템은 TestAgent DB에 테스트 실행 이력을 저장해야 한다.

**저장 테이블:**
- **TestRun**: test_type='SMOKE', project, status, total_checks, passed_checks, duration
- **TestStep**: 각 체크 항목별 실행 결과
- **ErrorPattern**: 실패 패턴 및 제안 (실패 시)

### FR-9: 로컬 파일 저장
**우선순위:** 🔴 Critical

시스템은 리포트를 로컬 파일 시스템에 저장해야 한다.

**저장 경로:**
- 리포트: `/home/peterchung/HWTestAgent/test-results/MyTester/reports/YYYY-MM-DD-[프로젝트명]-스모크-테스트.md`
- 로그: `/home/peterchung/HWTestAgent/test-results/MyTester/logs/YYYY-MM-DD-[프로젝트명]-smoke-details.json`

### FR-10: 프로젝트별 체크리스트 생성
**우선순위:** 🔴 Critical

시스템은 모든 WorkHub 프로젝트의 기본 스모크테스트 체크리스트를 생성해야 한다.

**생성할 파일:**
1. `/home/peterchung/HWTestAgent/scenarios/wbhubmanager/smoke.yaml`
2. `/home/peterchung/HWTestAgent/scenarios/wbfinhub/smoke.yaml`
3. `/home/peterchung/HWTestAgent/scenarios/wbsaleshub/smoke.yaml`
4. `/home/peterchung/HWTestAgent/scenarios/wbonboardinghub/smoke.yaml`

**공통 체크 항목:**
- Health Check API
- JWT Public Key 조회
- 주요 비즈니스 API (프로젝트별 상이)
- DB 연결 확인

---

## 5. Non-Goals (Out of Scope)

### 이 기능에 포함되지 않는 것
1. **전체 테스트 대체**: 스모크테스트는 단위/통합/E2E 테스트를 대체하지 않음. 빠른 필수 체크만 수행.
2. **자동 코드 수정**: 서버 재시작 제안 외에 소스 코드를 직접 수정하지 않음.
3. **성능 벤치마크**: 응답 시간 측정만 하며, 성능 최적화 제안은 하지 않음.
4. **UI 테스트**: 브라우저 기반 테스트는 포함하지 않음 (E2E 스킬 사용).
5. **예약 실행**: 수동 실행만 지원 (CI/CD 통합은 향후 고려).
6. **복잡한 인증**: Google OAuth는 포함하지 않음 (JWT 토큰 발급만 테스트).

---

## 6. Design Considerations

### UI/UX 요구사항
**콘솔 출력 형식:**
```
🧪 스모크테스트 시작: WBHubManager
환경: Docker Compose (http://localhost:3090)
체크 항목: 5개

[1/5] ✅ Health Check API (120ms)
[2/5] ✅ JWT Public Key 조회 (85ms)
[3/5] ❌ Hub 목록 조회 (Timeout)
[4/5] ✅ DB 연결 확인 (45ms)
[5/5] ✅ Frontend 접근 테스트 (230ms)

📊 결과 요약:
  - 총 체크: 5개
  - 성공: 4개 (80%)
  - 실패: 1개 (20%)
  - 실행 시간: 45초

📝 리포트 저장: /home/peterchung/HWTestAgent/test-results/MyTester/reports/2026-01-04-HubManager-스모크-테스트.md
```

### 스크린샷/목업
N/A (콘솔 기반 툴)

### 관련 컴포넌트
- 기존 스킬: `스킬테스터`, `스킬테스터-단위`, `스킬테스터-E2E`
- TestAgent DB: PostgreSQL
- YAML 파서: 기존 ScenarioLoader 재사용 가능

---

## 7. Technical Considerations

### 기술적 제약사항
1. **Docker Compose 의존성**: Docker Compose가 설치되고 실행 중이어야 함
2. **TestAgent DB 연결**: PostgreSQL 연결 정보가 환경변수에 설정되어 있어야 함
3. **네트워크 접근**: 로컬 서버 포트(3090, 3000 등)에 접근 가능해야 함

### 기술 스택
- **HTTP 클라이언트**: axios 또는 node-fetch
- **YAML 파서**: js-yaml
- **DB 드라이버**: pg (node-postgres)
- **파일 시스템**: Node.js fs/promises

### 의존성
- 기존 TestAgent 인프라 (DB, 리포지토리 패턴)
- 기존 스킬테스터 파싱 로직
- 기존 테스트-리포트-템플릿.md

### 성능 고려사항
- **타임아웃 설정**: 기본 60초 (YAML에서 조정 가능)
- **재시도 제한**: 최대 1회 재시도로 총 시간 제한
- **순차 실행**: 병렬 실행 시 서버 부하 우려로 순차 실행

### 보안 고려사항
- **인증 정보**: 환경변수로만 관리 (YAML에 하드코딩 금지)
- **DB 저장**: 민감한 응답 본문은 저장하지 않음 (status와 에러 메시지만)
- **로그 파일**: Git에 추가하지 않음 (.gitignore 필수)

---

## 8. Success Metrics

### 정량적 지표
1. **실행 속도**: 평균 30초-1분 (목표: 95% 케이스에서 1분 이내)
2. **통과율**: 체크 항목 95% 이상 통과 (안정적인 환경 기준)
3. **자동 수정 성공률**: 30% 이상 (서버 재시작 등 간단한 케이스)
4. **사용 빈도**: 개발자 1인당 주 10회 이상 사용

### 정성적 지표
1. **개발자 피드백**: "빠르고 유용하다" 평가 80% 이상
2. **디버깅 시간 단축**: 수동 체크 대비 80% 시간 절감
3. **버그 조기 발견**: 커밋 전 기본 기능 오류 90% 이상 탐지

### 모니터링 방법
- TestAgent DB 쿼리로 실행 이력 집계
- 개발자 설문조사 (분기별)
- 리포트 생성 빈도 추적

---

## 9. Open Questions

### 향후 논의 필요 사항
1. **CI/CD 통합**: Git pre-push hook에서 자동 실행할 것인가?
   - 답변 대기: 사용자 피드백 수집 후 결정
2. **다중 환경 지원**: Oracle/Railway 환경도 스모크테스트 지원할 것인가?
   - 답변 대기: 1차 배포 후 필요성 평가
3. **병렬 실행**: 체크 항목을 병렬로 실행하여 속도 향상할 것인가?
   - 답변 대기: 서버 부하 테스트 후 결정
4. **Slack 알림**: 실패 시 Slack 알림을 보낼 것인가?
   - 답변 대기: 팀 요구사항 확인 후 결정
5. **커버리지 확장**: Frontend 렌더링 체크를 추가할 것인가?
   - 답변 대기: E2E 스킬과의 역할 분담 명확화 필요

---

## 10. Implementation Roadmap

### Phase 1: 기본 구현 (1-2일)
- [ ] `스킬테스터-스모크.md` 스킬 생성
- [ ] `스킬테스터.md` 파싱 규칙 추가
- [ ] YAML 로더 구현
- [ ] 환경 자동 감지 로직
- [ ] 순차적 체크 실행 로직

### Phase 2: 고급 기능 (1-2일)
- [ ] 실패 원인 자동 분석
- [ ] 자동 수정 및 재시도 로직
- [ ] 리포트 생성 (템플릿 활용)
- [ ] DB 저장 연동

### Phase 3: 프로젝트별 체크리스트 (1일)
- [ ] WBHubManager smoke.yaml 생성
- [ ] WBFinHub smoke.yaml 생성
- [ ] WBSalesHub smoke.yaml 생성
- [ ] WBOnboardingHub smoke.yaml 생성

### Phase 4: 테스트 및 문서화 (1일)
- [ ] 각 프로젝트에서 스모크테스트 실행 및 검증
- [ ] 사용 가이드 문서 작성
- [ ] 팀 공유 및 피드백 수집

---

## 11. Appendix

### 참고 자료
- 기존 PRECISION 테스트: `/home/peterchung/HWTestAgent/scenarios/wbhubmanager/precision.yaml`
- 테스트 리포트 템플릿: `/home/peterchung/HWTestAgent/test-plans/templates/테스트-리포트-템플릿.md`
- TestAgent PRD: `/home/peterchung/HWTestAgent/docs/HWTestAgent-PRD.md`
- 스킬테스터 메인: `~/.claude/skills/스킬테스터.md`

### 용어 정의
- **스모크테스트 (Smoke Test)**: 배포 전/후 기본 기능이 정상 작동하는지 빠르게 확인하는 테스트
- **체크 항목 (Check Item)**: YAML에 정의된 개별 검증 항목 (예: Health Check API)
- **우선순위 (Priority)**: 체크 항목의 중요도 (Critical, High, Medium, Low)
- **재시도 (Retry)**: 체크 실패 시 자동으로 다시 시도하는 로직

### 버전 히스토리
- **v1.0** (2026-01-04): 초기 PRD 작성
  - 사용자 요구사항 12개 질문 기반
  - 기존 스킬테스터 구조 분석 완료
  - 상세 구현 계획 수립 완료

---

**작성자:** Claude Sonnet 4.5
**작성일:** 2026-01-04
**최종 수정일:** 2026-01-04
**PRD 버전:** 1.0
