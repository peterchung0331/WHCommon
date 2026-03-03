# WHCommon

WorkHub 공유 문서/아키텍처/스크립트 메타 레포지토리. 배포 불가 — 문서 전용.

## WorkHub Ecosystem

| Repo | Path | Role | Ports (FE/BE) |
|------|------|------|---------------|
| WBHubManager | /mnt/c/GitHub/WBHubManager | SSO 인증, 허브관리, AI 페르소나 | 3090/4090 |
| WBSalesHub | /mnt/c/GitHub/WBSalesHub | CRM, Reno AI, Slack 연동 | 3010/4010 |
| WBFinHub | /mnt/c/GitHub/WBFinHub | 딜관리, CSV import, Fireblocks | 3020/4020 |
| WBOnboardingHub | /mnt/c/GitHub/WBOnboardingHub | 고객 온보딩, GCP Vision | - |
| HWTestAgent | /mnt/c/GitHub/HWTestAgent | 테스트 자동화, 에러패턴DB | 3080/4080 |
| **WHCommon** | /mnt/c/GitHub/WHCommon | 공유 문서, 아키텍처, 스크립트 | - |

## Key Directories
```
아키텍처/                # 시스템 아키텍처 문서
아키텍처/디자인-시스템/   # 디자인 시스템 v1.0
규칙/                    # 실행 규칙 (실행_기획.md, 실행_작업.md, reno-bot-rules.md)
기획/                    # PRD 문서 (진행중/, 완료/)
작업/                    # Task 문서 (진행중/, 완료/)
별도 기획/               # 독립 기획 문서
기능 PRD/                # 기능별 PRD
에이전트/                # 에이전트 설정 문서
skills/                  # Claude Code 스킬
scripts/                 # 공유 스크립트
회사-정보/               # 웨이브릿지 회사 정보
```

## Architecture Doc Index
| 문서 | 내용 |
|------|------|
| 아키텍처/overview.md | 전체 시스템 구조, 기술 스택, 인증 흐름 |
| 아키텍처/WBHubManager.md | HubManager API, DB 스키마, 서비스 |
| 아키텍처/WBSalesHub.md | SalesHub, Reno AI, Slack, 고객 |
| 아키텍처/WBFinHub.md | FinHub, 딜관리, Fireblocks |
| 아키텍처/shared-packages.md | hub-auth, ai-agent-core, llm-connector |
| 아키텍처/deployment.md | Docker, Nginx, Oracle Cloud |
| 아키텍처/계정관리.md | 중앙 계정 관리 시스템 |
| 아키텍처/디자인-시스템/디자인-시스템-v1.0.md | 색상, 배지, 테이블, 간격 (49KB) |

## 폴더 참조 규칙
폴더명만 명시 시 WHCommon 기준: `기획/진행중/` → `/mnt/c/GitHub/WHCommon/기획/진행중/`
