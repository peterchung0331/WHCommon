import fs from 'fs';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

// Read markdown
let md = fs.readFileSync('워크허브-마스터플랜-v1.0.md', 'utf-8');

// ============================================================
// ASCII → Mermaid 변환 맵
// ============================================================

const replacements = [
  // 1. 플랫폼 전체 구조 (Executive Summary)
  {
    start: '┌──────────────────────────────────────────────────────────────────┐',
    end: '└──────────────────────────────────────────────────────────────────┘',
    mermaid: `graph TB
    subgraph WorkHub["워크허브 플랫폼"]
        subgraph Hubs["업무 허브"]
            SH["SalesHub<br/>영업/CRM<br/>Reno AI"]
            FH["FinHub<br/>재무/거래<br/>거래분석 AI"]
            OH["OnboardingHub<br/>고객 온보딩<br/>OCR AI"]
            STH["StrategyHub<br/>문서·협업<br/>문서편집 AI"]
        end
        HM["HubManager<br/>SSO · 권한 · AI 관리<br/>페르소나 · 모니터링"]
        subgraph Ext["외부 연동"]
            Slack["Slack<br/>봇/알림"]
            Telegram["Telegram<br/>경량 접근"]
            Notion["Notion<br/>문서 연동"]
            Email["Email<br/>알림"]
        end
        subgraph Client["클라이언트"]
            Apps["PC 웹앱 · Android 앱 · iOS 계획 · PWA"]
        end
    end
    SH & FH & OH & STH --> HM
    HM --> Slack & Telegram & Notion & Email
    HM --> Apps

    style WorkHub fill:#f0f4ff,stroke:#1a56db,stroke-width:2px
    style SH fill:#e8edfa,stroke:#1a56db
    style FH fill:#e8edfa,stroke:#1a56db
    style OH fill:#e8edfa,stroke:#1a56db
    style STH fill:#e8edfa,stroke:#1a56db
    style HM fill:#dbeafe,stroke:#1a56db,stroke-width:2px
    style Slack fill:#fef3c7,stroke:#d97706
    style Telegram fill:#fef3c7,stroke:#d97706
    style Notion fill:#fef3c7,stroke:#d97706
    style Email fill:#fef3c7,stroke:#d97706
    style Apps fill:#d1fae5,stroke:#059669`
  },

  // 2. SSO 구조
  {
    start: '┌─────────────────┐\n                    │   HubManager    │\n                    │  (SSO Gateway)',
    end: '│ 독립 API │\n        └──────────┘  └──────────┘  └──────────┘  └──────────┘',
    mermaid: `graph TB
    HM["HubManager<br/>(SSO Gateway)<br/>JWT 쿠키 발급<br/>.workhub.biz"]
    SH["SalesHub<br/>독립 DB · 독립 API"]
    FH["FinHub<br/>독립 DB · 독립 API"]
    OH["OnboardingHub<br/>독립 DB · 독립 API"]
    STH["StrategyHub<br/>독립 DB · 독립 API"]
    HM -->|JWT 쿠키| SH & FH & OH & STH
    style HM fill:#dbeafe,stroke:#1a56db,stroke-width:2px
    style SH fill:#e8edfa,stroke:#1a56db
    style FH fill:#e8edfa,stroke:#1a56db
    style OH fill:#e8edfa,stroke:#1a56db
    style STH fill:#e8edfa,stroke:#1a56db`
  },

  // 3. 데이터 흐름도
  {
    start: '[ 입력 소스 ]                  [ Context Pool ]              [ 출력 ]',
    end: '(RSS/웹/PDF)',
    mermaid: `graph LR
    subgraph Input["입력 소스"]
        I1["Slack 메시지"]
        I2["음성 녹취"]
        I3["문서 OCR"]
        I4["수동 입력"]
        I5["이메일"]
        I6["외부 API"]
        I7["크론 배치"]
        I8["Collector<br/>(RSS/웹/PDF)"]
    end
    Engine["정제/분류<br/>엔진"]
    CP[("Context<br/>Pool")]
    AI["AI<br/>에이전트"]
    subgraph Output["출력"]
        O1["미팅 브리핑"]
        O2["주간 리포트"]
        O3["위험 알림"]
        O4["팔로업 메일"]
        O5["딜 분석"]
        O6["전략 문서"]
    end
    I1 & I2 & I3 & I4 & I5 & I6 & I7 & I8 --> Engine --> CP --> AI --> O1 & O2 & O3 & O4 & O5 & O6
    style CP fill:#dbeafe,stroke:#1a56db,stroke-width:2px
    style AI fill:#fef3c7,stroke:#d97706,stroke-width:2px`
  },

  // 4. 전통 RDB vs 워크허브 모델
  {
    start: '┌─ 전통 RDB 모델',
    end: '└───────────────────────────────────────┘',
    mermaid: `graph LR
    subgraph RDB["전통 RDB 모델"]
        R1["사용자"] -->|SQL 쿼리| R2["DB"] --> R3["결과"]
        R4["· 정형 데이터만 처리<br/>· 검색어를 정확히 알아야 함<br/>· 사후적 대시보드<br/>· 수동 리포트 작성"]
    end
    subgraph WH["워크허브 모델"]
        W1["사용자"] -->|자연어| W2["AI"] --> W3["인사이트"]
        W4[("Context Pool")]
        W4 -->|정형+비정형 통합| W2
        W5["· 자연어 질문 가능<br/>· 선제적 알림 + 자동 리포트"]
    end
    style RDB fill:#fee2e2,stroke:#dc2626
    style WH fill:#d1fae5,stroke:#059669`
  },

  // 5. LLM 비용 관리 — line-number based replacement
  {
    start: 'LLM 비용 관리',
    end: '보드 표시',
    mermaid: `graph TB
    subgraph Cost["LLM 비용 관리 시스템"]
        Track["사용량 추적<br/>(토큰/비용)"]
        Monitor["월 예산 모니터링<br/>프로바이더별 · 허브별 · 목적별"]
        Check{"예산 초과?"}
        Fallback["자동 폴백<br/>(Claude)"]
        Dash["어드민 대시보드<br/>일/주/월 비용 리포트"]
    end
    Track --> Monitor --> Check
    Check -->|Yes| Fallback
    Check -->|No| Dash
    Fallback --> Dash
    style Cost fill:#f0f4ff,stroke:#1a56db
    style Check fill:#fef3c7,stroke:#d97706`
  },

  // 6. Context Pool 파이프라인
  {
    start: '┌─────────────────────────────────────────────────┐\n  │              Context Pool 파이프라인',
    end: '│  Collector┘                                       │\n  │                                                   │\n  └─────────────────────────────────────────────────┘',
    mermaid: `graph LR
    subgraph Collect["수집"]
        S1["Slack"]
        S2["음성"]
        S3["OCR"]
        S4["수동"]
        S5["이메일"]
        S6["API"]
        S7["크론"]
        S8["Collector"]
    end
    Engine["AI 정제/<br/>분류 엔진"]
    subgraph Context["컨텍스트"]
        C1["고객 A 컨텍스트"]
        C2["고객 B 컨텍스트"]
        C3["거래 X 컨텍스트"]
        C4["프로젝트 Y 컨텍스트"]
        C5["산업 동향 컨텍스트"]
        C6["규제 변화 컨텍스트"]
    end
    S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 --> Engine --> C1 & C2 & C3 & C4 & C5 & C6
    style Engine fill:#dbeafe,stroke:#1a56db,stroke-width:2px`
  },

  // 7. HubManager 관계도
  {
    start: '┌─────────────────┐\n                    │   HubManager    │\n                    │                 │\n                    │  · SSO 인증',
    end: 'SalesHub FinHub OnboardingHub StrategyHub',
    mermaid: `graph TB
    HM["HubManager<br/>· SSO 인증 · 권한 관리<br/>· AI 페르소나 · LLM 모니터링<br/>· 푸시 알림 · 문서 관리"]
    SH["SalesHub"]
    FH["FinHub"]
    OH["OnboardingHub"]
    STH["StrategyHub"]
    HM --> SH & FH & OH & STH
    style HM fill:#dbeafe,stroke:#1a56db,stroke-width:2px`
  },

  // 8. SSO 인증 흐름
  {
    start: '사용자 ──→ HubManager 로그인 ──→ JWT 쿠키 발급 (.workhub.biz)',
    end: '각 허브가 JWT 검증 후 접근 허용',
    mermaid: `graph LR
    User["사용자"] --> Login["HubManager 로그인"] --> JWT["JWT 쿠키 발급<br/>(.workhub.biz)"]
    JWT --> Valid["쿠키가 모든 허브에서 유효<br/>(SalesHub, FinHub, ...)"]
    Valid --> Access["각 허브가 JWT 검증 후<br/>접근 허용"]
    style JWT fill:#dbeafe,stroke:#1a56db`
  },

  // 9. 고객 컨텍스트 수집
  {
    start: 'Slack 채널 ───┐\n  미팅 노트 ────┼──→ AI 정제',
    end: '다음 액션 아이템',
    mermaid: `graph LR
    S1["Slack 채널"]
    S2["미팅 노트"]
    S3["음성 녹취"]
    S4["이메일"]
    AI["AI 정제"]
    CTX["고객 컨텍스트<br/>(Markdown + JSONB)"]
    Summary["· 최근 활동 10건 요약<br/>· 핵심 합의 사항<br/>· 주요 리스크<br/>· 다음 액션 아이템"]
    S1 & S2 & S3 & S4 --> AI --> CTX --> Summary
    style CTX fill:#dbeafe,stroke:#1a56db`
  },

  // 10. 주간 리포트 워크플로우
  {
    start: '크론 (매주 금요일 15시) ──→ AI 초안 생성',
    end: '+ 이메일 배포 (계획)',
    mermaid: `graph LR
    Cron["크론<br/>매주 금요일 15시"] --> AI["AI 초안 생성<br/>(4섹션 병렬, 15-30초)"]
    AI --> Editor["WYSIWYG 편집기<br/>(TipTap)<br/>담당자가 수정·보완"]
    Editor --> Export["Notion 자동 내보내기<br/>+ 이메일 배포 (계획)"]
    style Cron fill:#fef3c7,stroke:#d97706
    style AI fill:#dbeafe,stroke:#1a56db`
  },

  // 11. 음성 녹취 파이프라인
  {
    start: '음성 녹취 ──→ 텍스트 전사 ──→ AI 요약 ──→ 미팅 노트 자동 생성',
    end: '고객 컨텍스트에 반영',
    mermaid: `graph LR
    Voice["음성 녹취"] --> Text["텍스트 전사"] --> Summary["AI 요약"] --> Note["미팅 노트<br/>자동 생성"]
    Note --> Ctx["고객 컨텍스트에 반영"]
    style Summary fill:#dbeafe,stroke:#1a56db`
  },

  // 12. FinHub 업무 흐름
  {
    start: '딜 생성 ──→ 조건 협의 ──→ 내부 승인 ──→ Fireblocks 거래 실행\n   │',
    end: '딜 등록      조건 기록      자동 실행        및 정산 확인',
    mermaid: `graph LR
    D1["딜 생성<br/>(FinHub에서 딜 등록)"] --> D2["조건 협의<br/>(FinHub에서 조건 기록)"]
    D2 --> D3["내부 승인<br/>(승인 워크플로우 자동 실행)"]
    D3 --> D4["Fireblocks 거래 실행<br/>(트랜잭션 모니터링 및 정산 확인)"]
    style D3 fill:#fef3c7,stroke:#d97706`
  },

  // 13. 딜 코드 체계
  {
    start: 'LCH_2025E01A_USDT_1\n │',
    end: '└────────────────── 고객/상대방 코드',
    mermaid: `graph LR
    Code["LCH_2025E01A_USDT_1"]
    P1["LCH → 고객/상대방 코드"]
    P2["2025E01A → 거래 식별자"]
    P3["USDT → 거래 자산"]
    P4["1 → 순번"]
    Code --- P1
    Code --- P2
    Code --- P3
    Code --- P4
    style Code fill:#dbeafe,stroke:#1a56db,stroke-width:2px`
  },

  // 14. 딜 상태 워크플로우
  {
    start: 'Draft ──→ In Progress ──→ Completed ──→ Settled\n  │',
    end: '└── 취소 ────└── 보류 ──────└── 분쟁 처리',
    mermaid: `graph LR
    Draft --> InProgress["In Progress"] --> Completed --> Settled
    Draft -.->|취소| X1["취소"]
    InProgress -.->|보류| X2["보류"]
    Completed -.->|분쟁| X3["분쟁 처리"]
    style Draft fill:#e8edfa,stroke:#1a56db
    style Settled fill:#d1fae5,stroke:#059669`
  },

  // 15. Fireblocks 연동 구조
  {
    start: 'FinHub (딜 관리) ──→ Fireblocks API ──→ 블록체인',
    end: '└── 트랜잭션 상태 모니터링',
    mermaid: `graph LR
    FH["FinHub<br/>(딜 관리)"] --> FB["Fireblocks API"] --> BC["블록체인"]
    FB --> Vault["Vault (금고)<br/>Wallet A · Wallet B"]
    FH --> Monitor["트랜잭션 상태<br/>모니터링"]
    style FB fill:#fef3c7,stroke:#d97706
    style Vault fill:#e8edfa,stroke:#1a56db`
  },

  // 16. CSV 임포트 워크플로우
  {
    start: 'CSV 업로드 ──→ 미리보기 ──→ 필드 매핑 ──→ 검증 ──→ 확정 임포트',
    end: '자동 추천     행별 오류 이유',
    mermaid: `graph LR
    Upload["CSV 업로드"] --> Preview["미리보기<br/>(샘플 5행 표시)"]
    Preview --> Map["필드 매핑<br/>(컬럼 매칭, 자동 추천)"]
    Map --> Validate["검증<br/>(오류 표시, 행별 오류 이유)"]
    Validate --> Import["확정 임포트"]
    style Validate fill:#fef3c7,stroke:#d97706`
  },

  // 17. 거래 승인 워크플로우
  {
    start: '담당자 요청 ──→ 팀장 검토 ──→ 본부장 승인 ──→ 실행',
    end: '└── 반려 ──────└── 반려 (사유 기록)',
    mermaid: `graph LR
    Req["담당자 요청"] --> Review["팀장 검토"] --> Approve["본부장 승인"] --> Exec["실행"]
    Review -.->|반려| Rej1["반려"]
    Approve -.->|반려| Rej2["반려 (사유 기록)"]
    style Approve fill:#d1fae5,stroke:#059669
    style Rej1 fill:#fee2e2,stroke:#dc2626
    style Rej2 fill:#fee2e2,stroke:#dc2626`
  },

  // 18. 온보딩 프로세스
  {
    start: '고객 ──→ 업로드 링크 ──→ 서류 제출 ──→ OCR 자동 인식',
    end: '온보딩 완료\n                                   고객 활성화',
    mermaid: `graph TB
    C["고객"] --> Link["업로드 링크"] --> Submit["서류 제출"] --> OCR["OCR 자동 인식"]
    OCR --> Ops["운영팀 초기 검토"]
    Ops --> AML["AML팀 위험 평가"]
    AML --> Dual["듀얼 승인<br/>(준법감시인 + 본부장)"]
    Dual --> Done["온보딩 완료<br/>고객 활성화"]
    style OCR fill:#dbeafe,stroke:#1a56db
    style Dual fill:#fef3c7,stroke:#d97706
    style Done fill:#d1fae5,stroke:#059669`
  },

  // 19. 6단계 서류 검토
  {
    start: 'Draft ──→ Ops Confirmed ──→ AML Reviewing ──→ AML Completed',
    end: '(6)            (5)',
    mermaid: `graph LR
    D["1. Draft"] --> OC["2. Ops Confirmed"] --> AR["3. AML Reviewing"] --> AC["4. AML Completed"]
    AC --> FC["5. Final Confirmed"] --> AP["6. Approved"]
    style D fill:#e8edfa,stroke:#1a56db
    style AP fill:#d1fae5,stroke:#059669`
  },

  // 20. 듀얼 승인 프로세스
  {
    start: '최종 확인 (5단계) ──→ 듀얼 승인 요청 자동 생성',
    end: '온보딩 완료 (6단계)',
    mermaid: `graph TB
    Final["최종 확인 (5단계)"] --> Req["듀얼 승인 요청<br/>자동 생성"]
    Req --> CO["준법감시인 승인"]
    Req --> BH["비즈니스본부장 승인"]
    CO & BH --> Done["양측 모두 승인 시<br/>온보딩 완료 (6단계)"]
    style Done fill:#d1fae5,stroke:#059669
    style Req fill:#fef3c7,stroke:#d97706`
  },

  // 21. 고객 포털 워크플로우
  {
    start: '운영팀이 업로드 링크 생성 ──→ 고객에게 링크 전달',
    end: '운영팀에 알림 → 검토 시작',
    mermaid: `graph TB
    Create["운영팀이 업로드 링크 생성"] --> Send["고객에게 링크 전달<br/>(이메일/메신저)"]
    Send --> Access["고객이 링크 접속<br/>(로그인 불필요)"]
    Access --> Upload["서류 드래그&드롭 업로드"]
    Upload --> Notify["운영팀에 알림 → 검토 시작"]
    style Access fill:#d1fae5,stroke:#059669`
  },

  // 22. StrategyHub 구조
  {
    start: '┌─────────────────────────┐\n                    │      StrategyHub',
    end: '(산업 동향, 규제)      (전략 문서)',
    mermaid: `graph TB
    subgraph STH["StrategyHub"]
        Collector["Collector<br/>정보수집"]
        DocAI["문서생성<br/>AI 협업"]
        Collector & DocAI --> CP[("Context Pool<br/>(전사 지식 저수지)")]
    end
    CP --> Hubs["각 허브로 전달<br/>(산업 동향, 규제)"]
    CP --> Exec["경영진 리뷰<br/>(전략 문서)"]
    style STH fill:#f0f4ff,stroke:#1a56db
    style CP fill:#dbeafe,stroke:#1a56db,stroke-width:2px`
  },

  // 23. 정보의 흐름 (Context Pool)
  {
    start: '[ 외부 정보 ]                    [ 내부 정보 ]',
    end: '· 경영진 브리핑',
    mermaid: `graph TB
    subgraph External["외부 정보"]
        E1["규제 기관 발표"]
        E2["산업 뉴스"]
        E3["경쟁사 동향"]
        E4["시장 리포트"]
        E5["파트너사 소식"]
    end
    subgraph Internal["내부 정보"]
        I1["SalesHub (고객 동향)"]
        I2["FinHub (거래 패턴)"]
        I3["OnboardingHub (온보딩 트렌드)"]
        I4["미팅 녹취 요약"]
    end
    CP[("Context<br/>Pool")]
    E1 & E2 & E3 & E4 & E5 --> CP
    I1 & I2 & I3 & I4 --> CP
    subgraph Output["전략적 산출물"]
        O1["시장 분석 보고서"]
        O2["전략 제안서"]
        O3["규제 대응 문서"]
        O4["경영진 브리핑"]
    end
    CP --> O1 & O2 & O3 & O4
    style CP fill:#dbeafe,stroke:#1a56db,stroke-width:2px`
  },

  // 24. AI 자동 반영 워크플로우
  {
    start: '리뷰어가 블록별 코멘트 작성',
    end: '└── Diff 뷰어로 변경사항 확인',
    mermaid: `graph TB
    Comment["리뷰어가 블록별 코멘트 작성"]
    Click["작성자가 'AI 리뷰 반영' 클릭"]
    Select["반영할 코멘트 선택 (기본: 전체)<br/>+ 추가 지시사항 입력 (선택)"]
    Claude["Claude API가 코멘트를<br/>문서에 반영"]
    Version["새 버전 자동 생성<br/>(v1.0 → v1.1)"]
    Result["· 반영된 코멘트 자동 '해결' 표시<br/>· AI 반영 요약 기록<br/>· Diff 뷰어로 변경사항 확인"]
    Comment --> Click --> Select --> Claude --> Version --> Result
    style Claude fill:#dbeafe,stroke:#1a56db
    style Version fill:#d1fae5,stroke:#059669`
  },

  // 25. 대표/CFO 워크플로우
  {
    start: '[ 월요일 아침 ]\n주간 리포트 Slack DM 수신',
    end: 'AI가 자동 반영',
    mermaid: `graph LR
    Mon["월요일 아침<br/>주간 리포트<br/>Slack DM 수신"] --> Summary["요약 섹션 확인<br/>(2분)"]
    Summary --> Detail["세일즈/BD/대관<br/>상세 확인"]
    Detail --> Review["StrategyHub에서<br/>주요 문서 리뷰"]
    Review --> Feedback["블록 코멘트로 피드백<br/>AI가 자동 반영"]
    style Mon fill:#fef3c7,stroke:#d97706`
  },

  // 26. 세일즈 매니저 워크플로우
  {
    start: '[ 미팅 전 ]\nReno 미팅 브리핑 수신',
    end: 'Slack에서 @Reno 질의 ──→ 건강도 알림 확인 ──→ 위험 고객 대응',
    mermaid: `graph TB
    subgraph Before["미팅 전"]
        B1["Reno 미팅 브리핑 수신"] --> B2["고객 컨텍스트 확인"] --> B3["미팅 진행"]
    end
    subgraph After["미팅 후"]
        A1["음성 녹취 자동 전사"] --> A2["미팅 요약 자동 생성"] --> A3["팔로업 메일 초안"]
    end
    subgraph Daily["일상"]
        D1["Slack에서 @Reno 질의"] --> D2["건강도 알림 확인"] --> D3["위험 고객 대응"]
    end
    style Before fill:#d1fae5,stroke:#059669
    style After fill:#dbeafe,stroke:#1a56db
    style Daily fill:#fef3c7,stroke:#d97706`
  },

  // 27. BD 매니저 워크플로우
  {
    start: '파트너십 추적 ──→ 딜 건강도 모니터링',
    end: '대응 전략 수립',
    mermaid: `graph TB
    Track["파트너십 추적"] --> Monitor["딜 건강도 모니터링"] --> Alert["위험 신호 Slack 알림"]
    Alert --> Analyze["고객 컨텍스트에서<br/>원인 분석"]
    Analyze --> Strategy["대응 전략 수립"]
    style Alert fill:#fee2e2,stroke:#dc2626`
  },

  // 28. 전략기획 워크플로우
  {
    start: 'StrategyHub Collector ──→ 산업/규제 동향 자동 수집\n                              │\n                              ▼\n                      북마크 및 분류',
    end: 'AI 자동 반영 → 최종 Published',
    mermaid: `graph TB
    Collect["StrategyHub Collector<br/>산업/규제 동향 자동 수집"] --> Bookmark["북마크 및 분류"]
    Bookmark --> Write["AI와 문서 공동 작성<br/>(보고서, 제안서, 분석)"]
    Write --> Review["리뷰어 피드백 수집"]
    Review --> Publish["AI 자동 반영 → 최종 Published"]
    style Collect fill:#dbeafe,stroke:#1a56db
    style Publish fill:#d1fae5,stroke:#059669`
  },

  // 29. 재무 담당자 워크플로우
  {
    start: '딜 등록 ──→ 조건 기록 ──→ 승인 요청 ──→ Fireblocks 거래 실행\n                                              │\n                                              ▼\n                                    트랜잭션 모니터링',
    end: '정산 확인 + 리포트 생성',
    mermaid: `graph LR
    Reg["딜 등록"] --> Cond["조건 기록"] --> Approve["승인 요청"] --> Exec["Fireblocks<br/>거래 실행"]
    Exec --> Monitor["트랜잭션<br/>모니터링"]
    Monitor --> Settle["정산 확인 +<br/>리포트 생성"]
    style Exec fill:#fef3c7,stroke:#d97706`
  },

  // 30. 컴플라이언스 담당자 워크플로우
  {
    start: 'OnboardingHub ──→ 서류 OCR 결과 확인',
    end: '감사 로그 확인 + 규제 보고',
    mermaid: `graph TB
    OCR["OnboardingHub<br/>서류 OCR 결과 확인"] --> KYC["KYC 체크리스트 검증"]
    KYC --> AML["AML 위험 등급 평가"]
    AML --> Dual["듀얼 승인 처리"]
    Dual --> Audit["감사 로그 확인 +<br/>규제 보고"]
    style AML fill:#fef3c7,stroke:#d97706`
  },

  // 31. 대화 컨텍스트 관리
  {
    start: '세션 시작 ──→ 사용자 질의 ──→ Context Pool에서 관련 정보 조회',
    end: '대화 로그 저장 (1년 보존)',
    mermaid: `graph LR
    Start["세션 시작"] --> Query["사용자 질의"] --> Search["Context Pool에서<br/>관련 정보 조회"]
    Search --> Response["AI 응답 생성<br/>(컨텍스트 반영)"]
    Response --> Log["대화 로그 저장<br/>(1년 보존)"]
    style Search fill:#dbeafe,stroke:#1a56db`
  },

  // 32. 허브간 Context Pool 연동
  {
    start: 'StrategyHub Collector ──→ 산업/규제 Context Pool ──┐',
    end: 'OnboardingHub KYC ──────→ 온보딩 Context Pool ─────┘',
    mermaid: `graph LR
    S1["StrategyHub Collector"] -->|산업/규제| CP[("크로스 허브<br/>활용")]
    S2["SalesHub 고객 활동"] -->|고객| CP
    S3["FinHub 거래 데이터"] -->|거래| CP
    S4["OnboardingHub KYC"] -->|온보딩| CP
    style CP fill:#dbeafe,stroke:#1a56db,stroke-width:2px`
  },

  // 33-38. 자동화 시나리오들
  {
    start: '[매일 자정 크론]\n내일 미팅 조회',
    end: '브리핑이 준비되었습니다"',
    mermaid: `graph LR
    Cron["매일 자정 크론"] --> Query["내일 미팅 조회"] --> Ctx["미팅별 고객<br/>컨텍스트 조회"]
    Ctx --> AI["Reno AI<br/>브리핑 생성"]
    AI --> DM["담당자 Slack DM<br/>'내일 10시 A사 미팅<br/>브리핑이 준비되었습니다'"]
    style Cron fill:#fef3c7,stroke:#d97706
    style AI fill:#dbeafe,stroke:#1a56db`
  },

  {
    start: '[매일 오전 9시 크론]\n전체 고객 건강도 산출',
    end: '즉시 확인 필요"',
    mermaid: `graph LR
    Cron["매일 오전 9시 크론"] --> Calc["전체 고객<br/>건강도 산출"] --> Detect["Critical 등급 감지"]
    Detect --> DM["담당자 Slack DM<br/>'⚠️ B사 건강도 Critical<br/>30일간 미응답, 즉시 확인 필요'"]
    style Cron fill:#fef3c7,stroke:#d97706
    style Detect fill:#fee2e2,stroke:#dc2626`
  },

  {
    start: '[매주 금요일 15시 크론]\n주간 데이터 집계',
    end: '편집 후 발행하세요"',
    mermaid: `graph LR
    Cron["매주 금요일 15시 크론"] --> Agg["주간 데이터 집계"] --> AI["AI 4섹션<br/>병렬 생성<br/>(15-30초)"]
    AI --> Save["리포트 저장"]
    Save --> Notify["담당자에게 알림<br/>'주간 리포트 초안 완성<br/>편집 후 발행하세요'"]
    style Cron fill:#fef3c7,stroke:#d97706
    style AI fill:#dbeafe,stroke:#1a56db`
  },

  {
    start: '[서류 업로드 시 즉시]\n업로드 ──→ GCP Vision OCR',
    end: 'High → 자동 반영',
    mermaid: `graph LR
    Upload["서류 업로드 시 즉시"] --> OCR["GCP Vision OCR"] --> Classify["서류 유형<br/>자동 분류"]
    Classify --> Extract["필드 추출"]
    Extract --> Score{"신뢰도 평가"}
    Score -->|Low| Manual["수동 검증 요청"]
    Score -->|High| Auto["자동 반영"]
    style OCR fill:#dbeafe,stroke:#1a56db
    style Manual fill:#fee2e2,stroke:#dc2626
    style Auto fill:#d1fae5,stroke:#059669`
  },

  {
    start: '[매일 오전 크론]\n전체 고객 건강도 재산출',
    end: '대시보드 위젯 자동 갱신',
    mermaid: `graph LR
    Cron["매일 오전 크론"] --> Calc["전체 고객<br/>건강도 재산출"] --> Detect["변화 감지"]
    Detect --> Alert["등급 변화 시<br/>담당자 알림"]
    Alert --> Dash["대시보드 위젯<br/>자동 갱신"]
    style Cron fill:#fef3c7,stroke:#d97706`
  },

  {
    start: '[매시간 크론]\nCollector 실행',
    end: '(설정 시)',
    mermaid: `graph LR
    Cron["매시간 크론"] --> Collect["Collector 실행<br/>등록된 소스별 수집"] --> Dedup["중복 제거"]
    Dedup --> Save["DB 저장"]
    Save --> Notify["북마크 알림<br/>(설정 시)"]
    style Cron fill:#fef3c7,stroke:#d97706`
  },

  // 39. 크로스 허브 인사이트 엔진
  {
    start: 'SalesHub 데이터 ────┐',
    end: '유동성 확보 필요"',
    mermaid: `graph LR
    SH["SalesHub 데이터"]
    FH["FinHub 데이터"]
    OH["OnboardingHub 데이터"]
    STH["StrategyHub 동향"]
    Engine["크로스 허브<br/>인사이트 엔진"]
    Dash["경영진 대시보드"]
    Insight["'3분기 기관 고객 온보딩 증가 →<br/>Earn 상품 수요 40% 증가 예상 →<br/>유동성 확보 필요'"]
    SH & FH & OH & STH --> Engine --> Dash --> Insight
    style Engine fill:#dbeafe,stroke:#1a56db,stroke-width:2px
    style Insight fill:#d1fae5,stroke:#059669`
  },
];

// ============================================================
// Replace ASCII blocks with Mermaid
// ============================================================

for (const r of replacements) {
  const startIdx = md.indexOf(r.start);
  if (startIdx === -1) {
    console.log(`WARN: not found: ${r.start.substring(0, 50)}...`);
    continue;
  }
  const endIdx = md.indexOf(r.end, startIdx);
  if (endIdx === -1) {
    console.log(`WARN: end not found: ${r.end.substring(0, 50)}...`);
    continue;
  }

  // Find enclosing ``` block
  const beforeStart = md.lastIndexOf('```', startIdx);
  const afterEnd = md.indexOf('```', endIdx + r.end.length);

  if (beforeStart !== -1 && afterEnd !== -1) {
    const blockStart = beforeStart;
    const blockEnd = afterEnd + 3;
    md = md.substring(0, blockStart) + '<div class="mermaid">\n' + r.mermaid + '\n</div>' + md.substring(blockEnd);
  }
}

// ============================================================
// Convert remaining markdown to HTML
// ============================================================

const html = marked.parse(md);

const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
@page {
  size: A4;
  margin: 14mm 16mm;
}
body {
  font-family: "Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", sans-serif;
  font-size: 10.5pt;
  line-height: 1.65;
  color: #1a1a1a;
  max-width: 100%;
}

/* Headings */
h1 {
  font-size: 20pt;
  border-bottom: 2.5px solid #1a56db;
  padding-bottom: 6px;
  margin-top: 28px;
  margin-bottom: 10px;
  page-break-before: always;
  color: #0f172a;
}
h1:first-of-type { page-break-before: avoid; }
h2 {
  font-size: 15pt;
  border-bottom: 1px solid #94a3b8;
  padding-bottom: 4px;
  margin-top: 22px;
  margin-bottom: 8px;
  page-break-after: avoid;
  color: #1e293b;
}
h3 {
  font-size: 12pt;
  margin-top: 14px;
  margin-bottom: 6px;
  page-break-after: avoid;
  color: #334155;
}
h4 { font-size: 11pt; margin-top: 10px; margin-bottom: 4px; }

/* Text */
p { margin: 4px 0 8px 0; }
ul, ol { margin: 4px 0 8px 0; padding-left: 22px; }
li { margin: 2px 0; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }
strong { color: #1a56db; }
blockquote { border-left: 3px solid #1a56db; padding-left: 10px; color: #64748b; margin: 8px 0; font-size: 10pt; }

/* Tables */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 9pt;
  page-break-inside: avoid;
}
th, td { border: 1px solid #d0d5dd; padding: 5px 8px; text-align: left; }
th { background: #e8edfa; font-weight: bold; color: #1e293b; }
tr:nth-child(even) { background: #f8fafc; }

/* Code blocks (remaining ASCII that wasn't converted) */
pre {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 8px 0;
  font-size: 8pt;
  line-height: 1.35;
  page-break-inside: avoid;
  overflow-x: hidden;
  white-space: pre;
}
code { font-family: "D2Coding", "Consolas", "Courier New", monospace; font-size: 8.5pt; }
p code { background: #e8edfa; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }

/* Mermaid diagram containers */
.mermaid {
  display: flex;
  justify-content: center;
  margin: 10px 0;
  page-break-inside: avoid;
}
.mermaid svg {
  max-width: 100% !important;
  max-height: 280px !important;
  width: auto !important;
  height: auto !important;
}
.mermaid[data-size="large"] svg {
  max-height: 360px !important;
}
.mermaid[data-size="small"] svg {
  max-height: 180px !important;
}

/* Orphan/Widow */
p, li { orphans: 3; widows: 3; }
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      primaryColor: '#dbeafe',
      primaryTextColor: '#1e293b',
      primaryBorderColor: '#1a56db',
      lineColor: '#64748b',
      secondaryColor: '#f0f4ff',
      tertiaryColor: '#fef3c7',
      fontSize: '10px',
      fontFamily: '"Malgun Gothic", sans-serif'
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      padding: 8,
      nodeSpacing: 20,
      rankSpacing: 25,
      useMaxWidth: true
    }
  });
</script>
</head>
<body>
${html}
</body>
</html>`;

// Write HTML
fs.writeFileSync('워크허브-마스터플랜-v1.0.html', fullHtml, 'utf-8');
console.log('HTML generated');

// Generate PDF with Puppeteer
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
});
const page = await browser.newPage();
await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 60000 });

// Wait for Mermaid to render
await page.waitForFunction(() => {
  const diagrams = document.querySelectorAll('.mermaid');
  return Array.from(diagrams).every(d => d.querySelector('svg'));
}, { timeout: 30000 });

// Extra wait for rendering to stabilize
await new Promise(r => setTimeout(r, 2000));

// Scale down oversized Mermaid SVGs
await page.evaluate(() => {
  document.querySelectorAll('.mermaid svg').forEach(svg => {
    const bbox = svg.getBoundingClientRect();
    const maxH = 300;
    const maxW = 650;
    if (bbox.height > maxH || bbox.width > maxW) {
      const scaleH = bbox.height > maxH ? maxH / bbox.height : 1;
      const scaleW = bbox.width > maxW ? maxW / bbox.width : 1;
      const scale = Math.min(scaleH, scaleW);
      svg.style.transform = `scale(${scale})`;
      svg.style.transformOrigin = 'top center';
      svg.parentElement.style.height = `${bbox.height * scale}px`;
      svg.parentElement.style.overflow = 'hidden';
    }
  });
});

await page.pdf({
  path: '워크허브-마스터플랜-v1.0.pdf',
  format: 'A4',
  margin: { top: '14mm', bottom: '14mm', left: '16mm', right: '16mm' },
  printBackground: true,
  displayHeaderFooter: false,
});

console.log('PDF generated');
await browser.close();
