# WSL 안정성 향상 설정 가이드

> 다른 PC에서도 동일한 WSL 안정성 설정을 적용하기 위한 완벽 가이드

**작성일**: 2026-01-04
**대상**: Windows 11 + WSL2 + Docker Desktop 환경

---

## 목차

1. [문제 상황 및 진단](#문제-상황-및-진단)
2. [Windows 측 설정 (.wslconfig)](#windows-측-설정-wslconfig)
3. [WSL 내부 설정](#wsl-내부-설정)
4. [Docker 자동 정리 시스템](#docker-자동-정리-시스템)
5. [개발 환경 최적화](#개발-환경-최적화)
6. [모니터링 및 문제 해결](#모니터링-및-문제-해결)

---

## 문제 상황 및 진단

### 주요 증상
- VS Code와 WSL 연결이 끊기며 응답 없음
- 여러 개발 서버 동시 실행 시 WSL 다운
- Windows는 정상이나 WSL만 불안정

### 원인 분석
1. **Docker 리소스 낭비**: 100GB+ 디스크 낭비 (빌드 캐시, 미사용 이미지)
2. **inotify instances 부족**: 기본값 128개로 부족
3. **WSL 네트워크 에러**: VS Code 연결 끊김
4. **systemd 리소스 충돌**: 저널 로그 과다

---

## Windows 측 설정 (.wslconfig)

### 1. .wslconfig 파일 생성

**위치**: `C:\Users\<YourUsername>\.wslconfig`

**PowerShell에서 실행**:
```powershell
# 파일 생성 및 편집
notepad $env:USERPROFILE\.wslconfig
```

### 2. 설정 내용

```ini
[wsl2]
# 메모리 설정 (시스템 RAM의 50-75% 권장)
# 32GB RAM 기준 예시
memory=24GB

# CPU 코어 수 (물리 코어의 50-75% 권장)
# 6 물리 코어 (12 논리) 기준 예시
processors=10

# 스왑 메모리 (메모리의 25-50% 권장)
swap=8GB

# 네트워크 안정화 설정
localhostForwarding=true
networkingMode=nat

# 커널 파라미터 최적화
kernelCommandLine = sysctl.vm.max_map_count=262144 sysctl.fs.inotify.max_user_instances=512
```

### 3. 시스템별 권장 설정

#### 16GB RAM 시스템
```ini
[wsl2]
memory=10GB
processors=4
swap=4GB
localhostForwarding=true
networkingMode=nat
kernelCommandLine = sysctl.vm.max_map_count=262144 sysctl.fs.inotify.max_user_instances=512
```

#### 32GB RAM 시스템
```ini
[wsl2]
memory=24GB
processors=10
swap=8GB
localhostForwarding=true
networkingMode=nat
kernelCommandLine = sysctl.vm.max_map_count=262144 sysctl.fs.inotify.max_user_instances=512
```

#### 64GB RAM 시스템
```ini
[wsl2]
memory=48GB
processors=12
swap=12GB
localhostForwarding=true
networkingMode=nat
kernelCommandLine = sysctl.vm.max_map_count=262144 sysctl.fs.inotify.max_user_instances=512
```

### 4. WSL 재시작

**PowerShell (관리자 권한)에서 실행**:
```powershell
# WSL 완전 종료
wsl --shutdown

# 8초 대기 (중요!)
timeout /t 8

# WSL 재시작
wsl
```

---

## WSL 내부 설정

### 1. inotify 한계 증가

**WSL 터미널에서 실행**:
```bash
# 현재 설정 확인
cat /proc/sys/fs/inotify/max_user_instances

# /etc/sysctl.conf 수정
sudo bash -c 'cat >> /etc/sysctl.conf << EOF

# inotify 설정 (다중 프로젝트 개발 환경)
fs.inotify.max_user_instances=512
fs.inotify.max_user_watches=524288
EOF'

# 즉시 적용
sudo sysctl -p

# 확인
cat /proc/sys/fs/inotify/max_user_instances
```

### 2. systemd 저널 정리 및 제한

```bash
# 오래된 저널 로그 정리
sudo journalctl --vacuum-time=3d
sudo journalctl --vacuum-size=500M

# 저널 크기 제한 설정
sudo bash -c 'cat >> /etc/systemd/journald.conf << EOF

[Journal]
SystemMaxUse=500M
SystemMaxFileSize=50M
EOF'

# systemd-journald 재시작
sudo systemctl restart systemd-journald

# 확인
journalctl --disk-usage
```

### 3. Docker 즉시 정리 (초기 설정 시 1회)

```bash
# Exit 컨테이너 삭제
docker rm $(docker ps -aq --filter "status=exited") 2>/dev/null || true

# 미사용 리소스 전체 정리
docker system prune -af --volumes

# 정리 후 확인
docker system df
```

---

## Docker 자동 정리 시스템

### 1. 디렉토리 구조

```
프로젝트루트/
├── scripts/
│   └── docker-cleanup.sh          # 자동 정리 스크립트
├── docker-compose.yml             # cleanup 서비스 포함
├── docker-compose.prod.yml        # cleanup 서비스 포함
└── Makefile                       # 편의 명령어
```

### 2. docker-cleanup.sh 스크립트 생성

**파일**: `scripts/docker-cleanup.sh`

```bash
#!/bin/bash
# Docker 자동 리소스 정리 스크립트
# 빌드 후 자동으로 실행되어 디스크 공간 확보

set -e

echo "=== Docker 리소스 정리 시작 ==="

# 1. Exit 상태 컨테이너 즉시 삭제
echo "[1/4] Exit 상태 컨테이너 정리 중..."
EXITED_CONTAINERS=$(docker ps -aq -f status=exited 2>/dev/null || true)
if [ -n "$EXITED_CONTAINERS" ]; then
  docker rm $EXITED_CONTAINERS
  echo "  ✓ Exit 컨테이너 삭제 완료"
else
  echo "  ✓ Exit 컨테이너 없음"
fi

# 2. 30일 이상 사용하지 않은 이미지 삭제
echo "[2/4] 오래된 이미지 정리 중..."
OLD_IMAGES=$(docker images --filter "dangling=false" --format "{{.ID}} {{.CreatedAt}}" | \
  awk '$2 !~ /days?|hours?|minutes?|seconds?/ || ($2 ~ /days?/ && $3 >= 30) {print $1}' 2>/dev/null || true)
if [ -n "$OLD_IMAGES" ]; then
  echo "$OLD_IMAGES" | xargs docker rmi -f 2>/dev/null || true
  echo "  ✓ 30일 이상 된 이미지 삭제 완료"
else
  echo "  ✓ 오래된 이미지 없음"
fi

# 3. 빌드 캐시 크기 확인 및 정리 (50GB 이상 시)
echo "[3/4] 빌드 캐시 확인 중..."
BUILD_CACHE_SIZE=$(docker system df -v 2>/dev/null | grep 'Build Cache' | awk '{print $4}' | sed 's/GB//' || echo "0")
BUILD_CACHE_SIZE_INT=$(echo "$BUILD_CACHE_SIZE" | cut -d'.' -f1)

if [ "$BUILD_CACHE_SIZE_INT" -ge 50 ]; then
  echo "  ⚠ 빌드 캐시: ${BUILD_CACHE_SIZE}GB (임계값 50GB 초과)"
  docker builder prune -af --filter "until=720h" # 30일 이상 된 캐시만
  echo "  ✓ 오래된 빌드 캐시 정리 완료"
else
  echo "  ✓ 빌드 캐시: ${BUILD_CACHE_SIZE}GB (정상 범위)"
fi

# 4. Dangling 이미지 및 볼륨 정리
echo "[4/4] Dangling 리소스 정리 중..."
docker image prune -f
docker volume prune -f
echo "  ✓ Dangling 리소스 정리 완료"

# 최종 상태 출력
echo ""
echo "=== 정리 완료 ==="
docker system df

echo ""
echo "회수된 디스크 공간:"
docker system df -v | grep RECLAIMABLE || echo "  정보 없음"
```

**실행 권한 부여**:
```bash
chmod +x scripts/docker-cleanup.sh
```

### 3. docker-compose.yml에 cleanup 서비스 추가

**기존 services 섹션 아래에 추가**:

```yaml
  # Docker 리소스 정리 서비스
  docker-cleanup:
    image: docker:24-cli
    container_name: docker-cleanup
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./scripts/docker-cleanup.sh:/cleanup.sh:ro
    command: sh -c "chmod +x /cleanup.sh && /cleanup.sh"
    depends_on:
      - your-main-service-1
      - your-main-service-2
    profiles:
      - cleanup
    networks:
      - your-network-name
```

### 4. Makefile 생성

**파일**: `Makefile`

```makefile
.PHONY: build build-clean up up-clean down clean-docker help

.DEFAULT_GOAL := help

# 일반 빌드
build: ## Docker 이미지 빌드
	docker-compose build

# 빌드 + 자동 정리
build-clean: ## Docker 이미지 빌드 + 자동 리소스 정리
	docker-compose build
	docker-compose --profile cleanup up docker-cleanup
	docker-compose stop docker-cleanup

# 일반 실행
up: ## 모든 서비스 시작 (백그라운드)
	docker-compose up -d

# 실행 + 자동 정리
up-clean: ## 모든 서비스 시작 + 자동 리소스 정리
	docker-compose --profile cleanup up -d
	@echo "✓ 서비스 시작 완료. 정리 작업이 백그라운드에서 실행됩니다..."

# 전체 중단
down: ## 모든 서비스 중단 및 제거
	docker-compose down

# 수동 Docker 정리
clean-docker: ## Docker 리소스 수동 정리
	./scripts/docker-cleanup.sh

# 도움말
help: ## 사용 가능한 명령어 목록 표시
	@echo "사용 가능한 Make 명령어:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
```

**사용 예시**:
```bash
make help         # 도움말
make build-clean  # 빌드 + 자동 정리
make up-clean     # 실행 + 자동 정리
make clean-docker # 수동 정리
```

---

## 개발 환경 최적화

### 1. ~/.bashrc 편의 명령어 추가

```bash
# Docker 개발 편의 명령어
alias dc='docker-compose'
alias dcb='docker-compose build'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'

# 자동 정리 포함 명령어
alias dcbc='docker-compose build && docker-compose --profile cleanup up docker-cleanup'
alias dcuc='docker-compose --profile cleanup up -d'

# 프로젝트별 전용 명령어 (경로 수정 필요)
alias proj-build='cd /path/to/project && make build-clean'
alias proj-up='cd /path/to/project && make up-clean'
alias proj-clean='cd /path/to/project && make clean-docker'

# Docker 간편 정리
alias docker-cleanup='docker system prune -af --volumes && echo "Docker 정리 완료"'

# 시스템 상태 점검 함수
function dev-check() {
  echo "=== 시스템 상태 점검 ==="
  echo "메모리: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
  echo "Docker 디스크: $(docker system df -v 2>/dev/null | grep -E 'RECLAIMABLE' | head -1 || echo 'Docker 미실행')"
  echo "inotify 사용: $(find /proc/*/fd -lname 'anon_inode:inotify' 2>/dev/null | wc -l)/512"
}

# Node.js 메모리 최적화
export NODE_OPTIONS="--max-old-space-size=4096"
```

**적용**:
```bash
source ~/.bashrc
```

### 2. docker-compose.yml 로그 제한

**각 서비스에 추가**:
```yaml
services:
  your-service:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. .dockerignore 최적화

**프로젝트 루트에 `.dockerignore` 파일 생성**:
```
# 빌드 제외
node_modules
dist
build
.next

# 개발 파일
*.log
.env.local
.git
.vscode
.idea

# 테스트 파일
coverage
*.test.js
*.spec.js

# 문서
README.md
docs/
```

---

## 모니터링 및 문제 해결

### 1. 실시간 상태 확인

```bash
# 전체 시스템 상태
dev-check

# 메모리 실시간 모니터링
watch -n 2 'free -h'

# Docker 리소스 사용
docker stats

# inotify 사용량
watch -n 5 'echo "inotify instances: $(find /proc/*/fd -lname anon_inode:inotify 2>/dev/null | wc -l)/512"'
```

### 2. 문제 발생 시 로그 확인

```bash
# WSL 네트워크 에러
journalctl -k --since "10 minutes ago" | grep -i "wsl\|error\|fail"

# Docker 에러
journalctl -u docker --since "10 minutes ago"

# systemd 충돌
systemctl --failed

# OOM 에러
dmesg | grep -i "out of memory"
```

### 3. 정기 유지보수 명령어

**주 1회 실행 권장**:
```bash
#!/bin/bash
# wsl-maintenance.sh

echo "=== WSL 정기 유지보수 시작 ==="

# Docker 정리
echo "[1/3] Docker 정리..."
docker system prune -af --volumes

# 저널 정리
echo "[2/3] 저널 로그 정리..."
sudo journalctl --vacuum-time=3d

# 패키지 캐시 정리
echo "[3/3] 패키지 캐시 정리..."
sudo apt autoremove -y
sudo apt clean

echo "=== 유지보수 완료 ==="
docker system df
```

---

## 체크리스트

### 초기 설정 (새 PC에서)

- [ ] Windows `.wslconfig` 파일 생성 및 설정
- [ ] WSL 재시작 (`wsl --shutdown` → 8초 대기 → `wsl`)
- [ ] WSL 내부 inotify 설정 (`/etc/sysctl.conf`)
- [ ] systemd 저널 제한 설정
- [ ] Docker 초기 정리 (`docker system prune -af --volumes`)
- [ ] 프로젝트에 `scripts/docker-cleanup.sh` 생성
- [ ] `docker-compose.yml`에 cleanup 서비스 추가
- [ ] `Makefile` 생성
- [ ] `~/.bashrc`에 편의 명령어 추가
- [ ] `.dockerignore` 최적화

### 일상 작업

- [ ] 개발 시작 전: `dev-check` 실행
- [ ] 빌드 시: `make build-clean` 사용
- [ ] 서비스 시작 시: `make up-clean` 사용
- [ ] 주 1회: Docker 수동 정리 (`docker-cleanup`)

---

## 예상 효과

✅ **디스크 절약**: 평균 50-100GB 디스크 공간 확보
✅ **WSL 안정성**: 다운 빈도 대폭 감소
✅ **개발 생산성**: 자동화로 수동 관리 불필요
✅ **시스템 성능**: I/O 부하 감소로 전반적 성능 향상

---

## 문제 해결 FAQ

### Q1: WSL이 여전히 다운됩니다
```bash
# 1. 현재 리소스 확인
free -h
docker system df

# 2. 로그 확인
journalctl -k --since "1 hour ago" | grep -i error

# 3. .wslconfig 메모리 더 줄이기
# memory=16GB (24GB에서 감소)
```

### Q2: Docker cleanup이 작동하지 않습니다
```bash
# 스크립트 권한 확인
ls -l scripts/docker-cleanup.sh

# 권한 부여
chmod +x scripts/docker-cleanup.sh

# 수동 실행 테스트
./scripts/docker-cleanup.sh
```

### Q3: inotify 설정이 적용되지 않습니다
```bash
# 현재 값 확인
cat /proc/sys/fs/inotify/max_user_instances

# 즉시 적용
sudo sysctl fs.inotify.max_user_instances=512

# 영구 적용 확인
grep inotify /etc/sysctl.conf
```

---

## 참고 자료

- [Microsoft WSL 공식 문서](https://learn.microsoft.com/ko-kr/windows/wsl/)
- [Docker 공식 문서](https://docs.docker.com/)
- [WSL 고급 설정](https://learn.microsoft.com/ko-kr/windows/wsl/wsl-config)

---

**마지막 업데이트**: 2026-01-04
**문의**: 문제 발생 시 이 문서와 함께 로그 파일 공유
