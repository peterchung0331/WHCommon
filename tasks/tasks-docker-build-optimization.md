# Docker 빌드 메모리 + 속도 최적화 테스크

## 목표
- **메모리 최적화**: OOM Killer(exit 137) 방지 → 4.5-5.5GB 피크
- **속도 최적화**: 6-8분 빌드 → 증분 빌드 1-2분

## 대상 프로젝트
- WBHubManager
- WBSalesHub

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

### Phase 1: 메모리 최적화 (필수)

- [x] 1.0 NODE_OPTIONS 메모리 제한 추가
  - [x] 1.1 WBHubManager/Dockerfile 수정 (라인 31)
  - [x] 1.2 WBSalesHub/Dockerfile 수정 (라인 30)

- [x] 2.0 WBHubManager 중복 npm ci 제거
  - [x] 2.1 WBHubManager/package.json 수정 (라인 10)

### Phase 2: 빌드 속도 최적화

- [x] 3.0 Next.js Cache Mount 추가
  - [x] 3.1 WBSalesHub/Dockerfile에 cache mount 추가 (라인 48)
  - [x] 3.2 WBHubManager/Dockerfile 확인 (이미 적용되어 있음)

- [x] 4.0 Dockerfile Layer 최적화
  - [x] 4.1 WBSalesHub/Dockerfile COPY 명령 수정 (라인 38)
  - [x] 4.2 WBHubManager/Dockerfile COPY 명령 수정 (라인 39)

### Phase 3: Git 커밋 및 로컬 테스트

- [x] 5.0 변경사항 커밋
  - [x] 5.1 git add 실행
  - [x] 5.2 git commit 실행
  - [x] 5.3 feature/deployment-environment-change 브랜치에 push
  - [x] 5.4 WBSalesHub feature/docker-build-optimization 브랜치에 push

- [ ] 6.0 로컬 빌드 테스트
  - [ ] 6.1 WBHubManager 로컬 빌드 테스트 (--memory=6g)
  - [ ] 6.2 WBSalesHub 로컬 빌드 테스트 (--memory=6g)

### Phase 4: 오라클 서버 배포

- [ ] 7.0 오라클 서버 배포
  - [ ] 7.1 오라클 서버 SSH 접속
  - [ ] 7.2 WBHubManager Git pull
  - [ ] 7.3 WBSalesHub Git pull
  - [ ] 7.4 WBHubManager 순차 빌드 (메모리 모니터링)
  - [ ] 7.5 WBSalesHub 순차 빌드 (메모리 모니터링)
  - [ ] 7.6 스테이징 컨테이너 시작

- [ ] 8.0 스테이징 테스트
  - [ ] 8.1 헬스체크 (http://158.180.95.246:4400/health)
  - [ ] 8.2 SalesHub 헬스체크 (http://158.180.95.246:4400/saleshub/api/health)
  - [ ] 8.3 브라우저 접속 테스트

---

## 상세 수정 내용

### 1.1 WBHubManager/Dockerfile (라인 31)
```dockerfile
# 추가할 내용 (builder 스테이지 시작 직후)
ENV NODE_OPTIONS="--max-old-space-size=2048"
```

### 1.2 WBSalesHub/Dockerfile (라인 30)
```dockerfile
# 추가할 내용 (builder 스테이지 시작 직후)
ENV NODE_OPTIONS="--max-old-space-size=2048"
```

### 2.1 WBHubManager/package.json (라인 10)
```json
변경 전: "build:frontend": "npm --prefix frontend ci && npm --prefix frontend run build"
변경 후: "build:frontend": "npm --prefix frontend run build"
```

### 3.1 WBSalesHub/Dockerfile (라인 48)
```dockerfile
변경 전:
RUN npm --prefix frontend run build

변경 후:
RUN --mount=type=cache,target=/app/frontend/.next/cache \
    npm --prefix frontend run build
```

### 4.1, 4.2 Dockerfile COPY 최적화
```dockerfile
변경 전:
COPY . .

변경 후:
COPY --exclude=node_modules --exclude=frontend/node_modules . .
```

---

## 예상 결과

### 메모리 사용량
| 단계 | 현재 | Phase 1 | Phase 1+2 |
|------|------|---------|-----------|
| 피크 메모리 | 7.6-8.6GB | 4.5-5.5GB | 4.5-5.5GB |
| 상태 | ❌ OOM | ✅ 성공 | ✅ 성공 |

### 빌드 시간
| 단계 | 초회 빌드 | 증분 빌드 |
|------|----------|----------|
| **최적화 전** | 6-8분 | 6-8분 |
| **Phase 1** | 6-8분 | 6-8분 |
| **Phase 1+2** | 4-5분 | 1-2분 |

---

## 테스트 명령어

### 로컬 테스트
```bash
# WBHubManager
docker build --memory=6g -t test-wbhubmanager:latest /home/peterchung/WBHubManager

# WBSalesHub
docker build --memory=6g -t test-wbsaleshub:latest /home/peterchung/WBSalesHub
```

### 오라클 서버 순차 빌드
```bash
cd /home/ubuntu/workhub

# 메모리 모니터링과 함께 빌드
/usr/bin/time -v docker compose -f WBHubManager/docker-compose.oracle.yml build wbhubmanager-staging 2>&1 | tee build-hubmanager.log

/usr/bin/time -v docker compose -f WBHubManager/docker-compose.oracle.yml build wbsaleshub-staging 2>&1 | tee build-saleshub.log

# 메모리 사용량 확인
grep "Maximum resident set size" build-*.log
```

---

## 성공 기준
- ✅ Docker 빌드 완료 (exit code 0)
- ✅ 피크 메모리 < 6GB
- ✅ 증분 빌드 시간 < 2분
- ✅ 모든 컨테이너 정상 시작
- ✅ 헬스체크 통과
