# PRD: 단위 테스트 환경 셋업

## 1. 개요

WBHubManager, WBFinHub, WBSalesHub 세 프로젝트에 Jest 기반 단위 테스트 환경을 구축합니다.
현재 세 프로젝트 모두 Playwright E2E 테스트만 존재하며, 단위 테스트 환경이 없습니다.

## 2. 목표

- 각 프로젝트에 Jest + TypeScript 단위 테스트 환경 구축
- `npm test` 명령으로 단위 테스트 실행 가능
- 스킬테스터(`/스킬테스터 단위`)와 연동 가능한 구조

## 3. 대상 프로젝트

| 프로젝트 | 경로 | 서버 구조 |
|---------|------|----------|
| WBHubManager | `/home/peterchung/WBHubManager` | server/ |
| WBFinHub | `/home/peterchung/WBFinHub` | server/ |
| WBSalesHub | `/home/peterchung/WBSalesHub` | server/ |

## 4. 기능 요구사항

### 4.1 Jest 설정
1. 각 프로젝트에 Jest + ts-jest 설치
2. `jest.config.js` 생성 (TypeScript 지원)
3. `package.json`에 test 스크립트 추가

### 4.2 테스트 파일 구조
```
server/
├── __tests__/           # 테스트 파일 폴더
│   ├── services/        # 서비스 테스트
│   ├── routes/          # 라우트 테스트 (선택)
│   └── utils/           # 유틸리티 테스트
├── services/
├── routes/
└── ...
```

### 4.3 샘플 테스트 작성
- 각 프로젝트당 1-2개 샘플 테스트 작성
- 테스트 패턴 가이드 제공

## 5. 비기능 요구사항

- ESM/CommonJS 호환성 고려
- 기존 tsconfig.json과 호환
- DB 모킹 패턴 포함

## 6. 설치할 패키지

```bash
npm install -D jest ts-jest @types/jest
```

## 7. 작업 목록

### Phase 1: WBHubManager
- [ ] Jest 패키지 설치
- [ ] jest.config.js 생성
- [ ] package.json 스크립트 추가
- [ ] 샘플 테스트 작성
- [ ] 테스트 실행 확인

### Phase 2: WBFinHub
- [ ] Jest 패키지 설치
- [ ] jest.config.js 생성
- [ ] package.json 스크립트 추가
- [ ] 샘플 테스트 작성
- [ ] 테스트 실행 확인

### Phase 3: WBSalesHub
- [ ] Jest 패키지 설치
- [ ] jest.config.js 생성
- [ ] package.json 스크립트 추가
- [ ] 샘플 테스트 작성
- [ ] 테스트 실행 확인

## 8. 성공 기준

- 세 프로젝트 모두 `npm test` 실행 시 테스트 통과
- `/스킬테스터 [프로젝트] 단위` 명령으로 테스트 실행 가능

## 9. 예상 산출물

각 프로젝트:
- `jest.config.js`
- `server/__tests__/` 폴더
- 1-2개 샘플 테스트 파일

---
작성일: 2026-01-03
