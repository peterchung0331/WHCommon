# PRD: 빌드 락(Lock) 메커니즘

## 개요
- **기능명**: 오라클 서버 빌드 락 메커니즘
- **작성일**: 2026-01-11
- **목적**: 여러 Claude Code 세션에서 동시 빌드 요청 시 서버 리소스 보호 및 순차/병렬 제어

## 문제 정의

### 현재 상황
- 오라클 서버 리소스: 메모리 16GB, CPU 2코어
- 빌드당 메모리 사용량: 2-3GB
- 동시 빌드 시 문제: 8-12GB 메모리 사용 + CPU 병목 → OOM 위험

### 문제점
1. 여러 세션에서 동시 빌드 시 서버 과부하
2. 메모리 부족으로 빌드 실패
3. 이미지 태그 충돌 가능성
4. 데드락 발생 시 수동 해제 필요

## 해결 방안

### 핵심 기능
1. **세마포어 기반 병렬 빌드 제어**
   - 현재: 1개 빌드만 허용 (순차 처리)
   - 향후: N개 병렬 빌드 지원 (설정 파일로 조절)

2. **자동 대기 시스템**
   - 빌드 슬롯이 꽉 차면 자동으로 대기
   - 대기 중 진행 상황 실시간 표시
   - 타임아웃: 10분 (600초)

3. **데드락 방지**
   - trap으로 비정상 종료 시 자동 락 해제
   - PID 기반 락 파일로 프로세스 추적
   - 강제 락 해제 스크립트 제공

## 기술 사양

### 아키텍처
```
┌─────────────────────────────────────────┐
│  Claude Code 세션 A, B, C, ...         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  세마포어 락 메커니즘                   │
│  - 빌드 슬롯 관리 (N개)                │
│  - 자동 대기 (타임아웃 10분)           │
│  - PID 추적                             │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  오라클 서버 (16GB RAM, 2 CPU)         │
│  - 순차 빌드: 1개 (현재)              │
│  - 병렬 빌드: N개 (향후 확장)         │
└─────────────────────────────────────────┘
```

### 구현 파일 목록

#### 신규 파일
1. **`/home/peterchung/WBHubManager/scripts/oracle/build-config.sh`**
   - 병렬 빌드 수 설정: `MAX_PARALLEL_BUILDS=1`
   - 타임아웃 설정: `BUILD_TIMEOUT=600`
   - 락 디렉토리: `LOCK_DIR="/tmp/oracle-build-locks"`

2. **`/home/peterchung/WBHubManager/scripts/oracle/lib/build-lock.sh`**
   - 세마포어 초기화: `init_semaphore()`
   - 락 획득: `acquire_lock(project_name)`
   - 락 해제: `release_lock()`

3. **`/home/peterchung/WBHubManager/scripts/oracle/check-build-status.sh`**
   - 현재 빌드 상태 조회
   - 병렬 빌드 수 표시

4. **`/home/peterchung/WBHubManager/scripts/oracle/force-unlock.sh`**
   - 모든 빌드 락 강제 해제

#### 수정 파일
5. **`/home/peterchung/WBHubManager/scripts/oracle/deploy-staging.sh`**
   - 설정 파일 및 라이브러리 로드
   - 락 획득/해제 추가

6. **`/home/peterchung/WBHubManager/scripts/oracle/promote-production.sh`**
   - 설정 파일 및 라이브러리 로드
   - 락 획득/해제 추가

7. **`/home/peterchung/WBHubManager/scripts/oracle/rollback-production.sh`**
   - 설정 파일 및 라이브러리 로드
   - 락 획득/해제 추가

### 세마포어 동작 방식
```bash
# 1. 세마포어 초기화
mkdir -p /tmp/oracle-build-locks
echo "1" > /tmp/oracle-build-locks/semaphore

# 2. 락 획득 시도
- 현재 락 파일 수 확인: find /tmp/oracle-build-locks -name "build-*.lock" | wc -l
- 슬롯 여유 있으면: build-$$.lock 파일 생성 ($$는 PID)
- 슬롯 없으면: 5초마다 대기, 10분 후 타임아웃

# 3. 락 해제
- trap으로 자동 실행: rm -f /tmp/oracle-build-locks/build-$$.lock
```

## 사용 시나리오

### 시나리오 1: 순차 빌드 (MAX_PARALLEL_BUILDS=1)
```bash
# 세션 A
$ ./scripts/oracle/deploy-staging.sh
✓ 빌드 슬롯 획득 (1/1)
✓ Staging Deployment 빌드를 시작합니다.

# 세션 B (동시 실행)
$ ./scripts/oracle/deploy-staging.sh
⏳ 대기 중 (0/600초, 남은: 600초, 빌드: 1/1)
... (세션 A 완료 후)
✓ 빌드 슬롯 획득 (1/1)
```

### 시나리오 2: 병렬 빌드 (MAX_PARALLEL_BUILDS=2)
```bash
# 세션 A
$ ./scripts/oracle/deploy-staging.sh
✓ 빌드 슬롯 획득 (1/2)

# 세션 B (동시 실행 가능)
$ ./scripts/oracle/promote-production.sh
✓ 빌드 슬롯 획득 (2/2)

# 세션 C (대기)
$ ./scripts/oracle/deploy-staging.sh
⏳ 대기 중 (0/600초, 남은: 600초, 빌드: 2/2)
```

### 시나리오 3: 타임아웃
```bash
# 10분 동안 슬롯 획득 실패
$ ./scripts/oracle/deploy-staging.sh
⏳ 대기 중 (595/600초, 남은: 5초, 빌드: 1/1)
⏳ 대기 중 (600/600초, 남은: 0초, 빌드: 1/1)
❌ 타임아웃: 600초 동안 빌드 슬롯을 획득하지 못했습니다.
   현재 빌드 상태: ./scripts/oracle/check-build-status.sh
   강제 해제: ./scripts/oracle/force-unlock.sh
```

### 시나리오 4: 데드락 해결
```bash
# 비정상 종료로 락이 남은 경우
$ ./scripts/oracle/check-build-status.sh
⏳ 진행 중인 빌드: 1/1
  - [2026-01-11 14:00:00] Staging Deployment (PID: 12345)

# PID 확인 (프로세스 없음)
$ ps aux | grep 12345
(없음)

# 강제 해제
$ ./scripts/oracle/force-unlock.sh
✓ 모든 락이 해제되었습니다.
```

## 설정 변경 방법

### 병렬 빌드 수 변경
```bash
# 1. 오라클 서버 접속
ssh oracle-cloud

# 2. 설정 파일 편집
vim /home/ubuntu/workhub/WBHubManager/scripts/oracle/build-config.sh

# 3. 병렬 빌드 수 변경
MAX_PARALLEL_BUILDS=2  # 또는 3, 4...

# 4. 저장 (서버 재시작 불필요)
# 다음 빌드부터 자동 적용
```

### 타임아웃 변경
```bash
# build-config.sh 편집
BUILD_TIMEOUT=900  # 15분 (초 단위)
```

## 장점

1. **리소스 보호**: 메모리 2-3GB만 사용하여 OOM 방지
2. **자동 순차 처리**: 여러 세션에서 빌드 요청해도 자동으로 순서대로 처리
3. **확장 가능**: 설정 파일 수정만으로 병렬 빌드 수 조절 (1→2→3→N)
4. **명확한 대기 상태**: 진행 중인 작업, 남은 시간 실시간 표시
5. **비정상 종료 대응**: trap으로 자동 락 해제
6. **빠른 타임아웃**: 10분 대기 후 자동 실패 (데드락 빠른 감지)
7. **데드락 해결**: 강제 락 해제 스크립트 제공
8. **재사용 가능**: 라이브러리 형태로 다른 스크립트에도 적용 가능
9. **PID 추적**: 빌드 중인 프로세스 PID를 기록하여 디버깅 용이
10. **세마포어 방식**: 단순 락이 아닌 세마포어로 N개 병렬 빌드 지원

## 테스트 계획

1. **정상 시나리오 (순차)**: 두 세션에서 동시 빌드 요청 → 순차 실행 확인
2. **병렬 빌드 테스트**: MAX_PARALLEL_BUILDS=2 설정 → 2개 동시 실행 확인
3. **Ctrl+C 테스트**: 빌드 중 중단 → 락 자동 해제 확인
4. **타임아웃 테스트**: 10분 대기 → 자동 실패 확인
5. **강제 해제 테스트**: 데드락 상황 → force-unlock으로 해결 확인
6. **정보 표시 테스트**: check-build-status로 현재 상태 조회
7. **PID 검증 테스트**: 빌드 중 PID가 실제 프로세스와 일치하는지 확인
8. **설정 변경 테스트**: MAX_PARALLEL_BUILDS 변경 → 즉시 적용 확인

## 배포 계획

### 1단계: 로컬 개발
- 설정 파일 및 라이브러리 작성
- 유틸리티 스크립트 작성
- 기존 배포 스크립트 수정

### 2단계: 로컬 테스트
- 두 터미널에서 동시 실행 테스트
- Ctrl+C 중단 테스트
- 타임아웃 테스트 (짧은 타임아웃으로 테스트)

### 3단계: 오라클 서버 배포
- Git push로 스크립트 배포
- 오라클 서버에서 실행 권한 부여
- 실제 환경에서 동시 빌드 테스트

## 향후 확장

### 용량 확장 시
- 메모리 32GB, CPU 4코어로 업그레이드 시
- `MAX_PARALLEL_BUILDS=2` 또는 `3`으로 설정
- 서버 재시작 없이 즉시 적용

### 모니터링
- 빌드 슬롯 사용률 모니터링
- 평균 대기 시간 측정
- 타임아웃 발생 빈도 추적

## 참고 자료
- flock(1) man page: 파일 기반 락 메커니즘
- 세마포어 패턴: N개 리소스 동시 접근 제어
- Bash trap: 비정상 종료 시 정리 작업

---

**승인자**:
**승인일**:
**구현 완료일**:
