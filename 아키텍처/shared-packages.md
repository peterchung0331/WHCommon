# 공용 패키지 아키텍처

## 개요

WorkHub는 **모노레포 구조**로 공용 패키지를 관리합니다. 모든 패키지는 WBHubManager/packages에 위치하며, 다른 허브에서 심볼릭 링크로 참조합니다.

```
WBHubManager/packages/
├── ai-agent-core/     # AI 에이전트 프레임워크
├── hub-auth/          # 인증 라이브러리
└── llm-connector/     # LLM 연결기
```

---

## ai-agent-core (`@wbhub/ai-agent-core`)

### 역할
AI 에이전트 공용 프레임워크 (Reno 봇 등)

### 구조
```
ai-agent-core/
├── src/
│   ├── agent/                # BaseAgent 클래스
│   │   ├── BaseAgent.ts      # 모든 에이전트 기본 클래스
│   │   └── types.ts
│   │
│   ├── persona/              # 페르소나 시스템
│   │   ├── personaLoader.ts      # YAML 로더
│   │   ├── dbPersonaLoader.ts    # DB 로더 (우선)
│   │   ├── personaManager.ts     # 런타임 관리
│   │   └── types.ts
│   │
│   ├── conversation/         # 대화 관리
│   │   ├── ConversationManager.ts
│   │   └── types.ts
│   │
│   ├── logging/              # 대화 로깅
│   │   ├── conversationLogger.ts  # 로그 수집
│   │   └── logWorker.ts          # Redis 큐 처리
│   │
│   └── index.ts              # 모듈 내보내기
│
├── personas/                 # YAML 템플릿 (시드 데이터)
│   └── _template.yaml
│
└── docs/personas/
    └── reno.md               # 페르소나 가이드 (읽기 전용)
```

### 페르소나 로딩 순서
```
1. Cache (메모리) → 빠른 응답
2. DB (ai_personas 테이블) → 운영 데이터
3. YAML (personas/*.yaml) → 폴백/시드
```

### 주요 의존성
```json
{
  "yaml": "^2.3.4",       // YAML 파싱
  "bullmq": "^5.1.0",     // Redis 작업 큐
  "ioredis": "^5.3.2",    // Redis 연결
  "pg": "^8.16.3",        // PostgreSQL
  "uuid": "^11.0.4"       // ID 생성
}
```

### 사용 예시
```typescript
import { BaseAgent, PersonaLoader } from '@wbhub/ai-agent-core';

const persona = await PersonaLoader.load('reno-internal');
const agent = new RenoAgent(persona);
const response = await agent.process(message);
```

---

## hub-auth (`@wavebridge/hub-auth`)

### 역할
모든 허브의 **쿠키 기반 SSO 인증** 공용 라이브러리

### 구조
```
hub-auth/
├── src/
│   ├── frontend/             # React 컴포넌트
│   │   ├── components/
│   │   │   ├── AuthCard.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── PendingApproval.tsx
│   │   └── hooks/
│   │       ├── useLogin.ts
│   │       └── useSignup.ts
│   │
│   ├── backend/              # Express 미들웨어
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts  # JWT 검증
│   │   └── services/
│   │       └── registrationService.ts
│   │
│   ├── types/
│   │   └── auth.types.ts     # 공용 타입
│   │
│   └── utils/
│       └── validation.ts     # 유효성 검증
│
└── package.json
```

### 조건부 로드 (package.json exports)
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./frontend": "./dist/frontend/index.js",
    "./backend": "./dist/backend/index.js"
  }
}
```

### 사용 예시

**프론트엔드**:
```typescript
import { AuthCard, useLogin } from '@wavebridge/hub-auth/frontend';

function LoginPage() {
  const { login, isLoading } = useLogin();
  return <AuthCard onSubmit={login} />;
}
```

**백엔드**:
```typescript
import { authMiddleware } from '@wavebridge/hub-auth/backend';

router.get('/protected', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

### 인증 흐름
```
1. 로그인 → JWT 발급
2. 쿠키 설정: wbhub_access_token (httpOnly, sameSite: lax)
3. 쿠키 도메인: .workhub.biz (모든 허브 공유)
4. 다른 허브 → 쿠키 자동 전송 → JWT 검증 → 사용자 확인
```

---

## llm-connector (`@wbhub/llm-connector`)

### 역할
다중 LLM 제공자 통합 및 **비용 관리**

### 구조
```
llm-connector/
├── src/
│   ├── providers/            # LLM 제공자 구현
│   │   ├── base.ts           # BaseLLMProvider
│   │   ├── claude.ts         # Anthropic Claude
│   │   ├── openai.ts         # OpenAI GPT
│   │   ├── gemini.ts         # Google Gemini
│   │   └── index.ts
│   │
│   ├── connector.ts          # LLMConnector (메인)
│   ├── router.ts             # 제공자 라우팅
│   ├── cost-manager.ts       # 비용 추적
│   ├── tracker.ts            # 사용량 추적
│   └── types.ts
│
└── package.json
```

### LLM 우선순위 및 예산
```
1. Claude (무제한) - 기본
2. OpenAI ($100/월) - 폴백 1
3. Gemini ($100/월) - 폴백 2
```

### 자동 폴백 로직
```typescript
// 월별 예산 초과 시 다음 제공자로 자동 전환
const response = await connector.complete({
  messages: [...],
  // 자동으로 예산 내 제공자 선택
});
```

### 비용 추적
```typescript
// DB에 API 호출 비용 기록
await costManager.recordUsage({
  provider: 'claude',
  model: 'claude-3-sonnet',
  inputTokens: 1000,
  outputTokens: 500,
  cost: 0.015
});
```

### 주요 의존성
```json
{
  "@anthropic-ai/sdk": "^0.71.2",
  "openai": "^4.77.0",
  "@google/generative-ai": "^0.21.0",
  "pg": "^8.16.3"
}
```

---

## 패키지 간 의존성

```
ai-agent-core
    │
    └──► llm-connector (LLM 호출)
    │
    └──► hub-auth (사용자 컨텍스트)

hub-auth
    │
    └──► (독립적)

llm-connector
    │
    └──► (독립적)
```

## 버전 관리

| 패키지 | 버전 | 상태 |
|--------|------|------|
| ai-agent-core | 1.0.0 | 안정 |
| hub-auth | 2.0.0 | 안정 |
| llm-connector | 1.0.0 | 안정 |
