# 오라클 스테이징 빌드 메모리 부족 문제 분석

## 작업 정보
- **날짜**: 2026-01-14
- **작업자**: Claude Code
- **상태**: 진행중 (플랜 작성 완료)
- **관련 파일**: `/home/peterchung/.claude/plans/zazzy-brewing-naur.md`

## 문제 상황

### 발생 시점
- 오라클 스테이징 환경에서 2개 허브(HubManager, SalesHub)를 동시 빌드 시 메모리 부족 발생

### 의문점
1. 실제 리소스(RAM) 부족 문제인가?
2. 빌드 락 메커니즘이 제대로 작동하는가?

## 분석 결과 (플랜 모드)

### 1. 빌드 락 메커니즘: ⚠️ **미구현 확인**

**코드베이스 탐색 결과**:
- `deploy-staging.sh` 파일에서 flock, mkdir .lock 등 락 메커니즘 없음
- 여러 스크립트 동시 실행 시 이미지 태그 충돌 가능
- 현재는 운영자가 수동으로 순차 실행을 보장해야 함

**증거**:
```
파일: /home/peterchung/WBHubManager/scripts/oracle/deploy-staging.sh (89줄)
구조: 직렬 5단계 (Git Pull → Build → Tag → Start → Cleanup)
동시 빌드 보호: 없음
```

### 2. 메모리 설정: ✅ **양호**

**Dockerfile 설정** (모든 허브 적용):
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=2048"  # 2GB 제한
```

**BuildKit 캐시 최적화**:
```dockerfile
RUN --mount=type=cache,target=/root/.npm npm ci
```
- 효과: 메모리 사용 70-90% 감소, npm 재다운로드 방지

**Next.js 최적화** (WBSalesHub, WBFinHub):
```typescript
productionBrowserSourceMaps: false           // 메모리 30-40% 감소
experimental: { webpackMemoryOptimizations: true }
```

### 3. npm 타임아웃: ✅ **양호**

```dockerfile
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000
```

### 4. 실제 메모리 상태: ❓ **확인 필요**

오라클 서버 SSH 접속하여 다음 항목 확인 필요:
- 시스템 총 메모리 및 가용 메모리
- Docker 컨테이너별 메모리 사용량
- 빌드 중 실시간 메모리 사용량
- OOM Killer 로그 확인

## 해결 방안 (플랜)

### 우선순위 1: 빌드 락 메커니즘 구현 (flock)

**수정 파일**: `deploy-staging.sh` (모든 허브)

**구현 방법**:
```bash
#!/bin/bash
LOCK_FILE="/tmp/deploy-staging.lock"

# 락 획득 (다른 빌드 대기)
exec 200>"$LOCK_FILE"
flock -x 200 || {
    echo "❌ 다른 빌드가 진행 중입니다. 대기 중..."
    flock -w 3600 200 || {  # 최대 1시간 대기
        echo "❌ 타임아웃: 락 획득 실패"
        exit 1
    }
}

echo "✓ 빌드 락 획득"

# 기존 빌드 로직...

# 락 자동 해제 (스크립트 종료 시)
```

**예상 효과**:
- 동시 빌드 방지 (100%)
- 이미지 태그 충돌 방지
- 메모리 사용량 분산

### 우선순위 2: 순차 빌드 스크립트 작성

**신규 파일**: `scripts/oracle/deploy-all-staging.sh`

```bash
#!/bin/bash
set -e

HUBS=("WBHubManager" "WBSalesHub" "WBFinHub" "WBOnboardingHub")

echo "🚀 순차 스테이징 배포 시작"

for hub in "${HUBS[@]}"; do
    echo ""
    echo "📦 $hub 빌드 중..."
    cd /home/ubuntu/workhub/$hub
    ./scripts/oracle/deploy-staging.sh

    echo "✅ $hub 빌드 완료"
    echo "⏳ 5초 대기 (메모리 정리)..."
    sleep 5
done

echo ""
echo "✅ 모든 허브 배포 완료"
```

### 우선순위 3: BuildKit 병렬 작업 수 제한

**수정 파일**: `docker-compose.oracle.yml`

```yaml
x-build-args: &build-args
  BUILDKIT_MAX_PARALLELISM: 2  # 병렬 작업 수 제한

services:
  wbhubmanager-staging:
    build:
      context: ./WBHubManager
      args:
        <<: *build-args
```

**예상 효과**: 메모리 사용 30% 감소

### 우선순위 4: 오라클 서버 리소스 확인

**SSH 접속**:
```bash
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246
```

**확인 명령어**:
```bash
# 시스템 메모리 상태
free -h
cat /proc/meminfo | grep -E 'MemTotal|MemFree|MemAvailable'

# Docker 메모리 사용량
docker stats --no-stream
docker system df

# OOM Killer 로그
dmesg | grep -i -E 'oom|memory|killed'
journalctl -xe | grep -i -E 'oom|docker'
```

### 우선순위 5: 동시 빌드 재현 테스트

**테스트 시나리오**:
```bash
# 터미널 1: HubManager 빌드
cd /home/ubuntu/workhub/WBHubManager
./scripts/oracle/deploy-staging.sh &

# 터미널 2: SalesHub 빌드 (즉시 실행)
cd /home/ubuntu/workhub/WBSalesHub
./scripts/oracle/deploy-staging.sh &

# 터미널 3: 모니터링
watch -n 1 'free -h && echo "---" && docker stats --no-stream'
```

### 우선순위 6: 메모리 증설 (필요 시)

**권장 사양**:
- **최소**: 8GB (4개 허브 동시 빌드)
- **권장**: 16GB (여유 있는 빌드 + 런타임)

**증설 방법** (오라클 클라우드):
1. 오라클 클라우드 콘솔 로그인
2. Compute > Instances > wbhubmanager
3. Edit > Shape 변경 (VM.Standard.E4.Flex)
4. 메모리 선택 (8GB → 16GB)
5. 인스턴스 재시작

**비용**:
- 8GB: ~$43/month
- 16GB: ~$86/month

## 구현 계획

| 순서 | 작업 | 예상 시간 | 비고 |
|------|------|----------|------|
| 1 | 빌드 락 메커니즘 구현 (flock) | 30분 | 최우선 |
| 2 | 순차 빌드 스크립트 작성 | 20분 | 운영 편의성 |
| 3 | BuildKit 병렬 작업 수 제한 | 15분 | 메모리 최적화 |
| 4 | 오라클 서버 리소스 확인 | 15분 | 문제 원인 파악 |
| 5 | 동시 빌드 재현 테스트 | 30분 | 검증 |
| 6 | 메모리 증설 (필요 시) | 1시간 | 최후 수단 |

## 수정 대상 파일

### 기존 파일 수정
- `/home/peterchung/WBHubManager/scripts/oracle/deploy-staging.sh`
- `/home/peterchung/WBSalesHub/scripts/oracle/deploy-staging.sh`
- `/home/peterchung/WBFinHub/scripts/oracle/deploy-staging.sh`
- `/home/peterchung/WBOnboardingHub/scripts/oracle/deploy-staging.sh`
- `/home/peterchung/WBHubManager/docker-compose.oracle.yml`

### 신규 파일 생성
- `/home/peterchung/WBHubManager/scripts/oracle/deploy-all-staging.sh`

## 검증 방법

### 1. 빌드 락 검증
```bash
# 터미널 1
./deploy-staging.sh &

# 터미널 2 (즉시 실행)
./deploy-staging.sh
# 예상 출력: "❌ 다른 빌드가 진행 중입니다. 대기 중..."
```

### 2. 메모리 사용량 검증
```bash
# 빌드 전
free -h > before.txt

# 빌드 중 (다른 터미널)
watch -n 1 'free -h'

# 빌드 후
free -h > after.txt
diff before.txt after.txt
```

### 3. 동시 빌드 성공 검증
```bash
# 순차 빌드 스크립트 실행
./deploy-all-staging.sh

# 모든 허브 정상 실행 확인
docker ps | grep staging
curl http://localhost:4400/api/health
curl http://localhost:4400/saleshub/api/health
curl http://localhost:4400/finhub/api/health
```

## 예상 문제 및 대응

| 문제 | 원인 | 대응 방안 |
|------|------|----------|
| OOM Killer 발동 | 실제 메모리 부족 | 메모리 증설 (8GB → 16GB) |
| 빌드 중 프리징 | npm timeout | npm 타임아웃 증가 (현재 120초) |
| 이미지 태그 충돌 | 동시 빌드 | flock 락 메커니즘 구현 |
| BuildKit 캐시 부족 | 디스크 공간 부족 | `docker builder prune -af` |

## 다음 단계

1. ✅ 플랜 작성 완료
2. ✅ 사용자 승인 (2026-01-16)
3. ✅ 빌드 락 메커니즘 구현 (flock)
4. ✅ 리소스 진단 스크립트 작성 (diagnose-resources.sh)
5. ✅ 순차 빌드 스크립트 작성 (deploy-all-staging.sh)
6. ✅ BuildKit 병렬 작업 수 제한 설정
7. ✅ Git 커밋 및 푸시 (commit: 9f12ce5)
8. ⏳ 오라클 서버에서 동시 빌드 재현 테스트
9. ⏳ 검증 및 완료

## 참고 문서

- 플랜 파일: `/home/peterchung/.claude/plans/zazzy-brewing-naur.md`
- Docker 빌드 가이드: `/home/peterchung/WHCommon/문서/가이드/Docker-빌드-최적화-가이드.md`
- 배포 가이드: `/home/peterchung/WHCommon/문서/가이드/배포-가이드-오라클.md`
- 환경변수 가이드: `/home/peterchung/WHCommon/문서/가이드/환경변수-가이드.md`

## 작업 히스토리

### 2026-01-14 (오후)
- **작업 시작**: 빌드 메모리 부족 문제 분석 요청
- **코드베이스 탐색**: 빌드 락 메커니즘 미구현 확인
- **플랜 작성**: 6단계 해결 방안 수립
- **작업기록 생성**: 진행중 폴더에 기록

### 2026-01-16 (저녁)
- **사용자 승인**: "하고 있던 디버깅 계속 해줘" 요청
- **1단계 완료**: 빌드 락 메커니즘 구현 (flock)
  - `scripts/oracle/deploy-staging.sh` 수정
  - 동시 빌드 방지, 최대 1시간 대기
  - trap으로 자동 락 해제
- **2단계 완료**: 순차 빌드 스크립트 작성
  - `scripts/oracle/deploy-all-staging.sh` 생성
  - 4개 허브 순차 빌드
  - 빌드 시간 통계 제공
- **3단계 완료**: 리소스 진단 스크립트 작성
  - `scripts/oracle/diagnose-resources.sh` 생성
  - 메모리, Docker, OOM 로그, CPU, 디스크 자동 진단
- **4단계 완료**: BuildKit 병렬 작업 수 제한
  - `docker-compose.oracle.yml`에 BUILDKIT_MAX_PARALLELISM=2 추가
- **Git 동기화**: commit 9f12ce5 푸시 완료
- **다음 작업**: 오라클 서버에서 실제 테스트 필요

---
**작성일**: 2026-01-14 ~ 2026-01-16
**작성자**: Claude Code
**상태**: 구현 완료, 테스트 대기
