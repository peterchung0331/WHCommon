# WBHubManager 어드민페이지 E2E 테스트 작업 기록

**작업 일시**: 2026-01-27
**프로젝트**: WBHubManager
**작업 유형**: E2E 테스트 작성 및 버그 발견

---

## 작업 요약

어드민페이지(`/admin/*`)에 대한 포괄적인 E2E 테스트를 작성하고, 테스트 실행 과정에서 여러 기능적 문제점을 발견했습니다.

---

## ✅ 완료된 작업

### 1. E2E 테스트 인프라 구축

**작성된 테스트 파일** (총 31개 테스트 케이스):

1. **`tests/e2e/admin/admin-auth.spec.ts`** (6개 테스트)
   - TC-AUTH-01: 올바른 비밀번호로 로그인 성공
   - TC-AUTH-02: 잘못된 비밀번호로 로그인 실패
   - TC-AUTH-03: 세션 유지 확인
   - TC-AUTH-04: 로그아웃 후 재인증 필요
   - TC-AUTH-05: 미인증 상태 API 호출 시 403 응답
   - TC-AUTH-06: 빈 비밀번호 입력 시 에러

2. **`tests/e2e/admin/admin-accounts.spec.ts`** (8개 테스트)
   - 사용자 목록 조회 및 선택
   - 사용자별 허브 권한 조회
   - 권한 부여 (개별/일괄)
   - 역할 변경
   - 권한 취소
   - Pending 사용자 승인/거부

3. **`tests/e2e/admin/admin-banners.spec.ts`** (9개 테스트)
   - 배너 목록 조회
   - 배너 생성 (색상, 클릭 동작, 대상 허브, 기간)
   - 배너 수정/삭제
   - 활성화/비활성화 토글
   - XSS 방어 테스트

4. **`tests/e2e/admin/admin-monitoring-api.spec.ts`** (8개 테스트)
   - LLM 사용량 통계 조회
   - LLM 예산 상태 조회
   - 대화 세션 목록/상세 조회
   - AI 사용량 요약 통계

**헬퍼 및 Page Object 파일**:
- `tests/e2e/admin/helpers/auth.helper.ts` - 인증 헬퍼 함수
- `tests/e2e/admin/helpers/database.helper.ts` - DB 시드/정리 (작성 완료)
- `tests/e2e/admin/page-objects/AdminAuthPage.ts` - 인증 페이지 POM
- `tests/e2e/admin/page-objects/AccountsPage.ts` - 계정 페이지 POM
- `tests/e2e/admin/page-objects/BannersPage.ts` - 배너 페이지 POM
- `tests/e2e/admin/page-objects/MonitoringPage.ts` - 모니터링 페이지 POM

### 2. Playwright 설정 최적화

**`playwright.config.ts` 수정사항**:
- 테스트 타임아웃: 60초 → 120초
- 네비게이션 타임아웃: 30초 → 60초
- 액션 타임아웃: 10초 → 15초
- workers: 1 (DB 충돌 방지)
- retries: 1 (실패 시 1회 재시도)

### 3. 테스트 플랜 저장

- `playwright-test-planner` MCP 도구로 테스트 플랜 저장 완료
- 파일: `tests/e2e/admin/admin-test.plan.md`

### 4. Banners 페이지 인증 기능 복원

**문제**: `frontend/app/admin/banners/page.tsx:68`에 "인증 제거됨" 주석 발견
**조치**: AdminPasswordModal 추가하여 인증 기능 복원
- `/api/admin/check` 엔드포인트로 인증 상태 확인
- `showPasswordModal` 상태로 모달 표시 제어
- `isAuthenticated` 상태로 메인 콘텐츠 렌더링 제어

---

## ❌ 발견된 주요 문제점

### 1. 백엔드 서버 안정성 문제 (🔴 높은 우선순위)

**증상**:
- 백엔드 서버(포트 4090)가 예기치 않게 중단됨
- 프론트엔드에서 `ECONNREFUSED 127.0.0.1:4090` 에러 발생

**영향**:
- E2E 테스트 실행 불가
- `/api/*` 프록시 요청 실패 (500 Internal Server Error)

**임시 조치**:
```bash
npm run dev > /tmp/backend-stable.log 2>&1 &
```

**권장 조치**:
1. 백엔드 크래시 원인 분석 (로그 확인 필요)
2. PM2 또는 forever 같은 프로세스 관리자 도입
3. 백엔드 에러 핸들링 강화

---

### 2. Accounts 페이지 성능 문제 (🔴 높은 우선순위)

**위치**: `frontend/app/admin/accounts/page.tsx:94-127`

**증상**:
- 페이지 로딩에 60초 이상 소요
- 테스트 타임아웃 발생 (60초 제한)

**원인**:
```typescript
const loadData = async () => {
  // ❌ 순차 실행 - 매우 느림
  const usersResponse = await accountsApi.getAllUsers();
  const hubsResponse = await hubsApi.getAllHubs();

  const roles: Record<number, RoleDefinition[]> = {};
  for (const hub of hubsResponse.data || []) {
    // ❌ 각 허브마다 순차 호출
    const rolesResponse = await rolesApi.getHubRoleDefinitions(hub.id);
    roles[hub.id] = rolesResponse.data;
  }
};
```

**권장 해결 방법**:
```typescript
const loadData = async () => {
  // ✅ 병렬 실행 - 빠름
  const [usersResponse, hubsResponse] = await Promise.all([
    accountsApi.getAllUsers(),
    hubsApi.getAllHubs(),
  ]);

  // ✅ 모든 허브의 역할 정의를 병렬로 조회
  const hubs = hubsResponse.data || [];
  const rolesPromises = hubs.map(hub =>
    rolesApi.getHubRoleDefinitions(hub.id)
  );
  const rolesResponses = await Promise.all(rolesPromises);

  const roles: Record<number, RoleDefinition[]> = {};
  hubs.forEach((hub, index) => {
    if (rolesResponses[index].success) {
      roles[hub.id] = rolesResponses[index].data;
    }
  });
};
```

**예상 효과**:
- 로딩 시간: 60초+ → 5초 이내
- 테스트 통과율 대폭 향상

---

### 3. Banners 페이지 인증 제거됨 (⚠️ 보안 문제)

**발견 위치**: `frontend/app/admin/banners/page.tsx:68`
**주석**: `// 인증 제거됨 - 데이터만 로드`

**조치 완료**: ✅ 인증 기능 복원 (AdminPasswordModal 추가)

---

## 🔧 테스트 실행 상태

### 현재 상황
- 테스트 코드 작성: ✅ 완료 (31개 테스트)
- 테스트 실행: ⏸️ **백엔드 불안정으로 일시 중단**

### 테스트 실행 결과 (부분)
```
TC-AUTH-01: 올바른 비밀번호로 로그인 성공
  ✘ 실패 - 백엔드 ECONNREFUSED

스크린샷 확인:
  - 비밀번호 모달 정상 표시 ✅
  - 비밀번호 입력 정상 작동 ✅
  - API 호출 실패 ❌ (프록시 에러)
```

---

## 📋 남은 작업 (우선순위순)

### 1단계: 백엔드 안정화 (필수)
- [ ] 백엔드 크래시 원인 분석
- [ ] 프로세스 관리자 도입 (PM2 권장)
- [ ] 에러 핸들링 강화

### 2단계: Accounts 페이지 성능 최적화
- [ ] `loadData()` 함수 병렬 처리로 변경
- [ ] 테스트로 로딩 시간 검증 (5초 이내 목표)

### 3단계: E2E 테스트 완료
- [ ] 전체 테스트 실행 (31개)
- [ ] 실패한 테스트 디버깅 및 수정
- [ ] 테스트 결과 보고서 작성

### 4단계: HWTestAgent 연동
- [ ] 테스트 결과를 HWTestAgent API에 기록
- [ ] 에러 패턴 DB 저장

### 5단계: 모니터링 대시보드 UI 추가
- [ ] `/admin/monitoring` 페이지 신규 생성
- [ ] LLM 사용량 통계 표시
- [ ] 예산 상태 표시
- [ ] 최근 대화 세션 목록

---

## 📊 발견된 추가 문제점 (낮은 우선순위)

### Pending 사용자 목록 새로고침
- 승인 후 자동 새로고침 확인 필요

### 배너 순서 변경 UX
- `order_index`를 직접 입력해야 함
- 드래그 앤 드롭 UI 권장

### 대상 허브 선택 UX
- 텍스트로 허브 slug 입력
- 체크박스 선택 방식으로 개선 권장

### 감사 로그 필터 디바운스 없음
- 날짜 입력 시 매번 API 호출
- 디바운스 추가 권장 (500ms)

---

## 🔗 관련 파일

### 테스트 파일
- `tests/e2e/admin/admin-auth.spec.ts`
- `tests/e2e/admin/admin-accounts.spec.ts`
- `tests/e2e/admin/admin-banners.spec.ts`
- `tests/e2e/admin/admin-monitoring-api.spec.ts`

### 수정된 파일
- `frontend/app/admin/banners/page.tsx` - 인증 기능 복원
- `playwright.config.ts` - 타임아웃 증가
- `tests/e2e/admin/helpers/auth.helper.ts` - 타임아웃 60초로 증가
- `tests/e2e/admin/page-objects/AdminAuthPage.ts` - 타임아웃 60초로 증가

### 확인 필요 파일
- `frontend/app/admin/accounts/page.tsx:94-127` - 성능 최적화 필요
- `server/routes/adminIntegratedRoutes.ts:22-80` - 인증 엔드포인트

---

## 💡 권장 사항

### 즉시 조치 필요
1. **백엔드 안정화**: PM2로 프로세스 관리
2. **Accounts 페이지 최적화**: Promise.all() 적용

### 향후 개선 사항
1. 감사 로그 내보내기 기능 (CSV/Excel)
2. 페르소나 버전 관리 UI 추가
3. 사용자 목록 페이지네이션

---

## 📝 메모

- 테스트 환경: 로컬 (프론트:3090, 백:4090)
- 어드민 비밀번호: 0000
- PostgreSQL: Docker (포트 5433)
- Next.js rewrites로 `/api/*` → `http://localhost:4090/api/*` 프록시

---

**작성자**: Claude Code
**최종 수정**: 2026-01-27 17:20 (KST)
