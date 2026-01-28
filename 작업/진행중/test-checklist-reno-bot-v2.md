# 테스트 체크리스트: 레노봇v2

## 문서 정보
- **작성일**: 2026-01-28
- **버전**: 2.0.0
- **상태**: Week 1 완료, Week 2 준비 중

---

## 1. 빌드 및 컴파일 테스트

### 1.1 esbuild 빌드 테스트
```bash
cd /home/peterchung/WBBotService
npm run build
```

**검증 기준**:
- [x] 빌드 시간 < 5초 (실제: 0.03초 ✅)
- [x] 에러 없음
- [x] `dist/index.js` 생성 (23.8kb)
- [x] 번들 완료 메시지 출력

### 1.2 TypeScript 타입 체크
```bash
npm run typecheck
```

**검증 기준**:
- [x] 타입 에러 없음
- [x] 컴파일 완료

### 1.3 의존성 설치
```bash
npm install
```

**검증 기준**:
- [x] 설치 성공
- [x] 필수 패키지 존재:
  - [x] @anthropic-ai/sdk
  - [x] @slack/bolt
  - [x] express
  - [x] pg
  - [x] dotenv

---

## 2. 로컬 환경 테스트 (Week 2)

### 2.1 환경 변수 설정
```bash
cp .env.template .env.local
# .env.local 편집
```

**검증 항목**:
- [ ] DATABASE_URL 설정
- [ ] HUBMANAGER_DATABASE_URL 설정
- [ ] ANTHROPIC_API_KEY 설정
- [ ] SLACK_BOT_TOKEN 설정 (선택)
- [ ] SLACK_SIGNING_SECRET 설정 (선택)

### 2.2 서버 시작
```bash
npm start
```

**검증 기준**:
- [ ] 서버 시작 성공 (포트 4015)
- [ ] 로그 출력:
  - [ ] `[WBBotService] Starting server...`
  - [ ] `[WBBotService] RenoAgent initialized`
  - [ ] `[WBBotService] Server listening on port 4015`
- [ ] 에러 없음

### 2.3 Health Check
```bash
curl http://localhost:4015/api/health
```

**예상 응답**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T...",
  "version": "2.0.0",
  "service": "WBBotService",
  "checks": {
    "database": {
      "salesHub": "ok",
      "hubManager": "ok"
    },
    "llm": "ok"
  }
}
```

**검증 항목**:
- [ ] HTTP 200 응답
- [ ] DB 연결 성공
- [ ] LLM 초기화 성공

### 2.4 기본 라우트
```bash
curl http://localhost:4015/
```

**예상 응답**:
```json
{
  "service": "WBBotService",
  "version": "2.0.0",
  "description": "레노봇v2 마이크로서비스",
  "endpoints": [
    "/api/health",
    "/slack/reno2/events"
  ]
}
```

---

## 3. 데이터베이스 연결 테스트 (Week 2)

### 3.1 WBSalesHub DB 연결
```bash
# Node REPL에서
const { DatabaseManager } = require('./dist/bots/shared/db.js');
const pool = DatabaseManager.getSalesHubPool(process.env.DATABASE_URL);
const result = await pool.query('SELECT NOW()');
console.log(result.rows[0]);
```

**검증 기준**:
- [ ] 연결 성공
- [ ] 쿼리 실행 성공
- [ ] 현재 시간 반환

### 3.2 HubManager DB 연결
```bash
# Node REPL에서
const pool = DatabaseManager.getHubManagerPool(process.env.HUBMANAGER_DATABASE_URL);
const result = await pool.query('SELECT * FROM ai_personas WHERE agent_id = $1', ['reno']);
console.log(result.rows);
```

**검증 기준**:
- [ ] 연결 성공
- [ ] 페르소나 조회 성공
- [ ] `reno-internal`, `reno-external` 반환

### 3.3 Tool 실행 테스트
```bash
# Node REPL에서
const { ToolHandlers } = require('./dist/bots/reno/tools/index.js');
const handlers = new ToolHandlers(pool);
const result = await handlers.execute('get_customer_list', { limit: 5 });
console.log(result);
```

**검증 기준**:
- [ ] 고객 목록 반환
- [ ] JSON 형식
- [ ] 최대 5개 고객

---

## 4. AI 에이전트 테스트 (Week 2)

### 4.1 PersonaLoader 테스트
```bash
# Node REPL에서
const { PersonaLoader } = require('./dist/bots/reno/persona.js');
const loader = new PersonaLoader(hubManagerPool);
const persona = await loader.load('internal');
console.log(persona);
```

**검증 기준**:
- [ ] 페르소나 로드 성공
- [ ] Cache 확인 (두 번째 호출 시 DB 쿼리 없음)
- [ ] `buildSystemPrompt()` 동작

### 4.2 RenoAgent 초기화
```bash
# Node REPL에서
const { RenoAgent } = require('./dist/bots/reno/agent.js');
const { LLMService } = require('./dist/bots/shared/llm.js');

const anthropic = LLMService.getAnthropic(process.env.ANTHROPIC_API_KEY);
const agent = new RenoAgent({
  anthropic,
  salesHubPool: pool,
  hubManagerPool: hubManagerPool,
  defaultVariant: 'internal',
});

const response = await agent.processMessage({
  userId: 'test@example.com',
  message: '안녕?',
});
console.log(response);
```

**검증 기준**:
- [ ] 에이전트 초기화 성공
- [ ] 메시지 처리 성공
- [ ] Claude API 호출 성공
- [ ] 응답 생성

### 4.3 Tool Use 패턴 테스트
```bash
# 고객 검색 요청
const response = await agent.processMessage({
  userId: 'test@example.com',
  message: '고객 목록 보여줘',
});
console.log(response);
```

**검증 기준**:
- [ ] `get_customer_list` 도구 호출
- [ ] DB 쿼리 실행
- [ ] 고객 정보 포함된 응답

---

## 5. Slack 통합 테스트 (Week 2)

### 5.1 Slack 앱 설정
**수동 작업**:
1. [ ] Slack 앱 생성 (api.slack.com)
2. [ ] Bot Token Scopes 설정:
   - [ ] `app_mentions:read`
   - [ ] `chat:write`
   - [ ] `im:history`
   - [ ] `users:read`
3. [ ] Event Subscription 설정:
   - [ ] URL: `https://staging.workhub.biz:4400/slack/reno2/events`
   - [ ] 이벤트: `app_mention`, `message.im`
4. [ ] 봇 설치 및 토큰 복사

### 5.2 로컬 Slack 이벤트 테스트
```bash
# ngrok 또는 로컬 터널 사용
ngrok http 4015

# Slack Event Subscription URL 변경
# https://<ngrok-url>/slack/reno2/events
```

**검증 기준**:
- [ ] URL 검증 성공 (Slack challenge)
- [ ] `app_mention` 이벤트 수신
- [ ] `message` 이벤트 수신 (DM)

### 5.3 메시지 처리 테스트
**Slack에서 테스트**:
1. [ ] `@레노봇2 안녕?` 멘션
2. [ ] 즉시 응답 확인: "처리 중입니다! 😊"
3. [ ] 최종 응답 확인 (메시지 업데이트)
4. [ ] DM 전송 테스트

**검증 기준**:
- [ ] 즉시 응답 < 1초
- [ ] 최종 응답 < 10초
- [ ] 메시지 내용 정확
- [ ] 에러 없음

### 5.4 권한 체크 테스트
**Slack에서 테스트**:
1. [ ] 권한 있는 사용자: 정상 응답
2. [ ] 권한 없는 사용자: "권한이 없습니다." 메시지
3. [ ] 이메일 없는 사용자: "email_not_found" 에러

---

## 6. Docker 빌드 테스트 (Week 2)

### 6.1 Dockerfile 작성
```dockerfile
# TODO: Week 2
```

### 6.2 Docker 이미지 빌드
```bash
cd /home/peterchung/WBBotService
docker build -t wbbotservice:test .
```

**검증 기준**:
- [ ] 빌드 성공
- [ ] 빌드 시간 < 40초 (Cold)
- [ ] 이미지 크기 < 350MB
- [ ] 3단계 빌드 (deps, builder, runner)

### 6.3 Docker 컨테이너 실행
```bash
docker run -p 4015:4015 \
  -e DATABASE_URL=... \
  -e HUBMANAGER_DATABASE_URL=... \
  -e ANTHROPIC_API_KEY=... \
  wbbotservice:test
```

**검증 기준**:
- [ ] 컨테이너 시작 성공
- [ ] Health check 성공
- [ ] 로그 출력 정상

### 6.4 docker-compose 테스트
```bash
# TODO: docker-compose.yml 작성 후
docker-compose up -d
docker-compose logs -f wbbotservice
```

**검증 기준**:
- [ ] 서비스 시작 성공
- [ ] DB 연결 성공
- [ ] Health check 통과

---

## 7. 통합 테스트 (Week 2)

### 7.1 전체 플로우 테스트
**시나리오**: 고객 검색 및 메모 추가

1. [ ] Slack에서 `@레노봇2 고객 검색: ABC 회사`
2. [ ] 고객 정보 반환 확인
3. [ ] Slack에서 `@레노봇2 메모 추가: ABC 회사에 견적 발송함`
4. [ ] 메모 추가 성공 메시지
5. [ ] DB에서 메모 확인:
   ```sql
   SELECT * FROM customer_memos ORDER BY created_at DESC LIMIT 1;
   ```

**검증 기준**:
- [ ] 전체 플로우 정상 동작
- [ ] DB에 데이터 저장
- [ ] 에러 없음

### 7.2 에러 처리 테스트
**시나리오**:

1. [ ] 존재하지 않는 고객 검색
   - 예상: "고객을 찾을 수 없습니다."
2. [ ] DB 연결 끊김
   - 예상: "데이터베이스 연결 오류"
3. [ ] Claude API 타임아웃
   - 예상: "응답 시간 초과"
4. [ ] 권한 없는 사용자
   - 예상: "권한이 없습니다."

**검증 기준**:
- [ ] 모든 에러 적절히 처리
- [ ] 사용자 친화적 에러 메시지
- [ ] 로그 기록

### 7.3 성능 테스트
**시나리오**: 동시 요청 처리

```bash
# Apache Bench 또는 k6 사용
ab -n 100 -c 10 http://localhost:4015/api/health
```

**검증 기준**:
- [ ] 100 요청 모두 성공
- [ ] 평균 응답 시간 < 100ms
- [ ] 메모리 사용량 < 500MB
- [ ] CPU 사용량 < 80%

---

## 8. 스테이징 배포 테스트 (Week 3)

### 8.1 오라클 서버 배포
```bash
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246

cd /home/ubuntu/WBBotService
git pull origin main
./scripts/deploy-staging.sh
```

**검증 기준**:
- [ ] Git pull 성공
- [ ] Docker 이미지 빌드 성공
- [ ] 컨테이너 시작 성공
- [ ] Health check 통과

### 8.2 Nginx 라우팅 테스트
```bash
curl https://staging.workhub.biz:4400/slack/reno2/events
```

**검증 기준**:
- [ ] Nginx 프록시 정상 동작
- [ ] HTTPS 인증서 유효
- [ ] 라우팅 성공

### 8.3 Slack 프로덕션 테스트
**Slack에서 테스트**:
1. [ ] 스테이징 워크스페이스에서 봇 멘션
2. [ ] 응답 확인
3. [ ] 실제 고객 데이터 조회
4. [ ] 메모 추가/조회

**검증 기준**:
- [ ] 모든 기능 정상 동작
- [ ] 응답 시간 < 5초
- [ ] 에러 없음

---

## 9. 프로덕션 배포 테스트 (Week 3)

### 9.1 프로덕션 승격
```bash
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246

cd /home/ubuntu/WBBotService
./scripts/promote-production.sh
```

**검증 기준**:
- [ ] 스테이징 이미지 태그 → prod
- [ ] 프로덕션 컨테이너 교체 성공
- [ ] Zero downtime 배포
- [ ] Health check 통과

### 9.2 프로덕션 Slack 테스트
**프로덕션 워크스페이스에서**:
1. [ ] 실제 사용자가 봇 사용
2. [ ] 고객 데이터 조회
3. [ ] 메모 추가
4. [ ] 미팅 준비 (추후)

**검증 기준**:
- [ ] 모든 기능 정상
- [ ] 응답 시간 정상
- [ ] 사용자 피드백 긍정적

### 9.3 모니터링 설정
```bash
# 로그 확인
docker logs -f wbbotservice-prod --tail 100

# 메트릭 확인
docker stats wbbotservice-prod
```

**검증 항목**:
- [ ] 로그 정상 출력
- [ ] 메모리 사용량 < 500MB
- [ ] CPU 사용량 < 50%
- [ ] 에러 로그 없음

---

## 10. 회귀 테스트 (레노봇v1)

### 10.1 레노봇v1 동작 확인
**WBSalesHub에서**:
1. [ ] 레노봇v1 정상 동작
2. [ ] Slack 통합 정상
3. [ ] 기존 기능 모두 유지
4. [ ] 성능 저하 없음

**검증 기준**:
- [ ] v1과 v2가 독립적으로 동작
- [ ] v1 사용자 영향 없음
- [ ] DB 충돌 없음

---

## 11. 체크리스트 요약

### Week 1 (완료)
- [x] esbuild 빌드 테스트 (0.03초 ✅)
- [x] TypeScript 타입 체크
- [x] 의존성 설치

### Week 2 (진행 예정)
- [ ] 환경 변수 설정
- [ ] 로컬 서버 시작
- [ ] Health check
- [ ] DB 연결 테스트
- [ ] AI 에이전트 테스트
- [ ] Slack 통합 테스트
- [ ] Docker 빌드

### Week 3 (진행 예정)
- [ ] 스테이징 배포
- [ ] 프로덕션 배포
- [ ] 모니터링 설정
- [ ] 회귀 테스트

---

**최종 업데이트**: 2026-01-28
**진행 상태**: Week 1 완료 (11/50 체크리스트 완료)
