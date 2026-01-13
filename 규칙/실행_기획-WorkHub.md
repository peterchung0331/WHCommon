# 실행_기획 - WorkHub 특화 가이드

> **메인 문서로 돌아가기**: [실행_기획.md](./실행_기획.md)

이 문서는 WorkHub 프로젝트 특화 가이드라인과 체크리스트를 제공합니다.

---

## 허브 정보 요약

| 허브 | 경로 | 개발 포트 | 프로덕션 URL | 주요 기능 |
|------|------|----------|-------------|----------|
| **HubManager** | `/home/peterchung/WBHubManager` | 3090/4090 | workhub.biz | SSO, 허브 관리 |
| **SalesHub** | `/home/peterchung/WBSalesHub` | 3010/4010 | /saleshub | CRM, 미팅 관리 |
| **FinHub** | `/home/peterchung/WBFinHub` | 3020/4020 | /finhub | 재무, 트랜잭션 |
| **OnboardingHub** | `/home/peterchung/WBOnboardingHub` | 3030/4030 | /onboarding | 사용자 온보딩 |
| **RefHub** | `/home/peterchung/WBHubManager/WBRefHub` | 3040/4040 | /refhub | 레퍼런스 관리 |

---

## A. 환경별 구성 체크리스트

### 로컬 개발 환경

```bash
# 환경 파일
.env.local

# 검증 명령어
npm run dev
```

**체크리스트**:
- [ ] `.env.local` 파일 생성: `cp .env.template .env.local`
- [ ] 포트 설정: 프론트엔드 3000번대, 백엔드 4000번대
- [ ] 데이터베이스: `docker-compose -f docker-compose.dev.yml up -d postgres`
- [ ] dev-login 활성화 확인: `NODE_ENV=development`
- [ ] 서버 실행: `npm run dev`
- [ ] 접속 테스트: `curl http://localhost:4090/api/health`

### Docker 스테이징 환경

```bash
# 환경 파일
.env.staging

# 검증 명령어
docker-compose -f docker-compose.staging.yml up -d
```

**체크리스트**:
- [ ] `.env.staging` 파일 확인
- [ ] `DOCKER_PORT=4400` 설정
- [ ] `NODE_ENV=production` 설정
- [ ] Google OAuth만 사용 (dev-login 비활성화)
- [ ] Nginx 설정: `http://localhost:4400/[hub-name]`
- [ ] Docker 빌드: `DOCKER_BUILDKIT=1 docker-compose build`
- [ ] 접속 테스트: `curl http://158.180.95.246:4400/api/health`

### 프로덕션 환경

```bash
# 환경 파일
.env.prd

# 배포 명령어
ssh oracle-cloud
./scripts/deploy-production.sh
```

**체크리스트**:
- [ ] `.env.prd` 파일 확인 (Doppler 동기화)
- [ ] `DOCKER_PORT=4500` 설정
- [ ] `NODE_ENV=production` 설정
- [ ] HTTPS 강제: `https://workhub.biz`
- [ ] SSL 인증서 확인: Let's Encrypt
- [ ] 배포 스크립트: `./scripts/deploy-production.sh`
- [ ] 모니터링: 배포 후 30분간 에러 로그 확인

### 환경 × 허브 설정 매트릭스

| 환경 | HubManager | SalesHub | FinHub | OnboardingHub |
|------|------------|----------|--------|---------------|
| **로컬 개발** |
| - 프론트엔드 | 3090 | 3010 | 3020 | 3030 |
| - 백엔드 | 4090 | 4010 | 4020 | 4030 |
| - dev-login | ✓ | ✓ | ✓ | ✓ |
| - DB | localhost:5432 | localhost:5432 | localhost:5432 | localhost:5432 |
| **스테이징** |
| - URL | :4400 | :4400/saleshub | :4400/finhub | :4400/onboarding |
| - OAuth | Google | Google | Google | Google |
| - DB | localhost:5432 | localhost:5432 | localhost:5432 | localhost:5432 |
| **프로덕션** |
| - URL | workhub.biz | /saleshub | /finhub | /onboarding |
| - HTTPS | ✓ | ✓ | ✓ | ✓ |
| - DB | Oracle Cloud | Oracle Cloud | Oracle Cloud | Oracle Cloud |

---

## B. 허브 간 통신 가이드

### SSO (Single Sign-On)

**아키텍처**:
```
사용자 → HubManager OAuth → JWT 토큰 발급
                ↓
         쿠키로 토큰 전달
                ↓
      SalesHub/FinHub/etc → JWT 검증 → 인증 완료
```

**구현 체크리스트**:
- [ ] OAuth redirect_uri 설정: `ALLOWED_REDIRECT_DOMAINS`
- [ ] JWT 토큰 전달: httpOnly 쿠키 사용
- [ ] 토큰 검증: 각 허브에서 `jwtService.verify()` 호출
- [ ] 쿠키 도메인: `.workhub.biz` (프로덕션)

**코드 예시**:
```typescript
// HubManager에서 토큰 발급
const token = jwtService.sign({ userId, email, role });
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined,
  maxAge: 24 * 60 * 60 * 1000 // 24시간
});

// 다른 허브에서 토큰 검증
const token = req.cookies.auth_token;
const decoded = jwtService.verify(token);
```

### 허브 간 API 호출 (최소화 권장)

**원칙**: 각 허브는 독립적으로 운영 (Microservice)

**허용되는 경우**:
- 사용자 권한 조회 (HubManager → 다른 허브)
- 공통 마스터 데이터 조회

**방법**:
```typescript
// 내부 API 호출
const response = await fetch(`${process.env.HUBMANAGER_URL}/api/users/${userId}`, {
  headers: {
    'Authorization': `Bearer ${serviceToken}`,
    'X-Internal-Request': 'true'
  }
});
```

### 데이터베이스 공유

**원칙**: 각 허브는 독립된 PostgreSQL 스키마 사용

**공유 테이블** (HubManager에서 관리):
- `users`: 사용자 기본 정보
- `hub_roles`: 허브별 권한
- `audit_logs`: 감사 로그

**참조 방법** (읽기 전용):
```typescript
// Prisma에서 다른 스키마 참조
const user = await prisma.$queryRaw`
  SELECT * FROM hubmanager.users WHERE id = ${userId}
`;
```

---

## C. 보안 체크리스트

### OAuth & SSO 보안

- [ ] `redirect_uri` whitelist 검증
  ```typescript
  const allowedDomains = process.env.ALLOWED_REDIRECT_DOMAINS?.split(',') || [];
  if (!allowedDomains.some(d => redirectUri.startsWith(d))) {
    throw new Error('Invalid redirect_uri');
  }
  ```

- [ ] 상태 토큰(state) 검증으로 CSRF 방지
  ```typescript
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;
  ```

- [ ] JWT 토큰 서명 검증
  ```typescript
  jwt.verify(token, process.env.JWT_SECRET);
  ```

- [ ] 토큰 만료 시간 설정: 24시간 + 30일 리프레시

### 쿠키 보안

- [ ] `httpOnly: true` (XSS 방지)
- [ ] `secure: true` (프로덕션 환경, HTTPS만)
- [ ] `sameSite: 'lax'` (CSRF 방지)
- [ ] 쿠키 도메인: `.workhub.biz` (서브도메인 공유)

### API 보안

- [ ] 모든 엔드포인트에 인증 미들웨어 적용
  ```typescript
  app.use('/api', authMiddleware);
  ```

- [ ] 권한 검증: 역할 기반(RBAC)
  ```typescript
  if (!['admin', 'master'].includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  ```

- [ ] Rate Limiting: 100 req/min (IP별)
  ```typescript
  import rateLimit from 'express-rate-limit';
  const limiter = rateLimit({ windowMs: 60000, max: 100 });
  ```

- [ ] CORS: whitelist 기반 허용
  ```typescript
  const corsOptions = {
    origin: ['https://workhub.biz', 'https://staging.workhub.biz'],
    credentials: true
  };
  ```

### 환경변수 보안

- [ ] 민감 정보는 `.env.*` 파일에만 저장
- [ ] `.env` 파일들은 `.gitignore`에 포함
- [ ] `.env.template` 파일로 구조 공유 (값은 제외)
- [ ] Doppler 동기화: `push-all-to-doppler.sh` 스크립트

---

## D. 배포 전 검증 체크리스트

### 코드 검증

```bash
# ESLint 검사
npm run lint

# TypeScript 타입 검사
npx tsc --noEmit

# 단위 테스트
npm run test

# 통합 테스트 (HWTestAgent)
cd /home/peterchung/HWTestAgent && npx playwright test
```

**체크리스트**:
- [ ] ESLint 검사 통과: `npm run lint`
- [ ] TypeScript 타입 검사 통과: `npx tsc --noEmit`
- [ ] 단위 테스트 통과: `npm run test`
- [ ] 통합 테스트 통과: HWTestAgent 실행

### 환경 검증

```bash
# 환경변수 확인
cat .env.prd | grep -E "^[A-Z]" | wc -l

# Doppler 동기화 확인
doppler secrets --project workhub --config prd
```

**체크리스트**:
- [ ] `.env.prd` 파일 모든 필수 환경변수 설정
- [ ] 데이터베이스 마이그레이션 스크립트 준비: `npx prisma migrate deploy`
- [ ] Doppler 동기화 완료

### Docker 검증

```bash
# Docker 빌드
DOCKER_BUILDKIT=1 docker-compose build

# 이미지 크기 확인
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

**체크리스트**:
- [ ] 로컬 Docker 빌드 성공
- [ ] 스테이징 환경(4400) 정상 작동
- [ ] 이미지 크기 확인: < 400MB 권장

### 프로덕션 배포

```bash
# SSH 접속
ssh oracle-cloud

# 스테이징 배포
./scripts/deploy-staging.sh

# 프로덕션 승격
./scripts/promote-production.sh

# 롤백 (필요 시)
./scripts/rollback-production.sh
```

**체크리스트**:
- [ ] 오라클 서버 SSH 접속 확인
- [ ] 스테이징 배포 및 테스트
- [ ] E2E 시나리오 수동 검증
- [ ] 프로덕션 승격
- [ ] 배포 후 30분간 에러 로그 확인

---

## E. PRD 작성 시 자주 묻는 질문 (FAQ)

### Q1. 여러 허브에 적용되는 기능의 PRD 작성법

**A**: 하나의 PRD로 작성하되, FR을 허브별로 구분

```markdown
## 4. Functional Requirements

### FR-공통 (모든 허브)
- FR-C1: JWT 토큰 검증 미들웨어
- FR-C2: httpOnly 쿠키 설정

### FR-HubManager
- FR-HM1: OAuth 콜백 엔드포인트

### FR-SalesHub
- FR-SH1: 고객 목록 권한 필터링

### FR-해당없음
- FinHub: 이 기능 적용 대상 아님
- OnboardingHub: 이 기능 적용 대상 아님
```

### Q2. NFR(비기능 요구사항) 정의 수준

**A**: 3가지 카테고리에서 정량적 목표 1개 이상

```markdown
- Performance: API 응답 < 200ms (95 percentile)
- Availability: 99.9% uptime (월 43분 이하 다운타임)
- Scalability: 동시 사용자 1,000명 지원
```

### Q3. 테스트 전략 작성법

**A**: User Stories 기반 E2E 시나리오

```markdown
## 10. Test Strategy

### E2E Tests
- **Story 1 검증**: Google OAuth 로그인 → FinHub 대시보드 접근
  - 테스트 파일: `HWTestAgent/tests/e2e-finhub-sso.spec.ts`
  - 도구: Playwright
  - 검증: 로그인 후 `/finhub/dashboard` URL 확인
```

### Q4. 마이그레이션 작업의 PRD 형식

**A**: PRD 형식 + Risk & Mitigation 섹션 필수

```markdown
## 12. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 데이터 손실 | High | 백업 + 롤백 스크립트 준비 |
| 호환성 문제 | Medium | Deprecation 경고 3주 전 공지 |
```

### Q5. Design Considerations 포함 내용

**A**: UI/UX 관련 요구사항 구체적 작성

```markdown
## 6. Design Considerations

### UI Components
- 아이콘: `lucide-react` 라이브러리 사용
- 버튼: Tailwind `bg-blue-600 hover:bg-blue-700` 스타일
- 테이블: `@tanstack/react-table` 사용

### Responsive Design
- 모바일: 768px 이하 → 단일 컬럼 레이아웃
- 데스크톱: 768px 이상 → 2컬럼 레이아웃
```

### Q6. 환경별 설정 차이 명시법

**A**: Technical Considerations에 환경별 표 포함

```markdown
## 7. Technical Considerations

### 환경별 설정

| 설정 항목 | 로컬 개발 | Docker 스테이징 | 프로덕션 |
|----------|----------|----------------|---------|
| 포트 | 4000번대 (개별) | 4400 (통합) | 4500 (통합) |
| OAuth | dev-login 사용 가능 | Google OAuth만 | Google OAuth만 |
| 데이터베이스 | localhost:5432 | localhost:5432 | 오라클 클라우드 |
| 로그 레벨 | DEBUG | INFO | WARN |
```

---

## F. 모범 사례 PRD 상세

### 1. 기본 기능 추가

**문서**: [prd-hub-sso-redirect-improvement.md](./기능%20PRD/prd-hub-sso-redirect-improvement.md)

**핵심 포인트**:
- User Stories가 Acceptance Criteria와 함께 명확히 정의됨
- Security Requirements에 OAuth 관련 검증 사항 상세히 기술
- 환경별 redirect_uri 설정 표 포함

### 2. 대규모 기능

**문서**: [prd-unified-permission-control.md](./기능%20PRD/prd-unified-permission-control.md)

**핵심 포인트**:
- 12개 Implementation Phases로 단계별 구현 계획 수립
- 150개 이상 테스트 케이스 명시
- API 엔드포인트 전체 테이블화
- 데이터베이스 스키마 상세 정의

### 3. 인프라 변경

**문서**: [Oracle-Cloud-Migration-PRD.md](./기능%20PRD/Oracle-Cloud-Migration-PRD.md)

**핵심 포인트**:
- Risk & Mitigation 섹션에 롤백 전략 상세 기술
- 환경별 설정 (Railway → Oracle Cloud) 비교 표 포함
- Docker 이미지 전송 및 배포 절차 상세화

### 4. 테스트 개선

**문서**: [prd-testagent-improvement.md](./기능%20PRD/prd-testagent-improvement.md)

**핵심 포인트**:
- Test Strategy가 ISTQB 표준 기반으로 구성
- 카테고리별 테스트 시나리오 (Smoke, P0, P1, P2) 정의
- Success Metrics에 테스트 커버리지 정량적 목표 명시

---

## 관련 문서

| 문서 | 용도 |
|------|------|
| [실행_기획.md](./실행_기획.md) | 메인 PRD 가이드 |
| [실행_기획-상세.md](./실행_기획-상세.md) | 섹션 가이드라인, 템플릿 |
| [실행_작업.md](./실행_작업.md) | PRD → Task 변환 |
| [claude-context.md](./claude-context.md) | 프로젝트 컨텍스트 |

---

**Last Updated**: 2026-01-14
