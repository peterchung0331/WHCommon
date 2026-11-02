# WSL 안정성 빠른 설정 가이드

> 5-10분 내에 핵심 설정만 빠르게 적용하기

---

## 1단계: Windows 설정 (2분)

### .wslconfig 생성

**PowerShell에서 실행**:
```powershell
# 파일 생성
notepad $env:USERPROFILE\.wslconfig
```

**내용 붙여넣기** (32GB RAM 기준):
```ini
[wsl2]
memory=24GB
processors=10
swap=8GB
localhostForwarding=true
networkingMode=nat
kernelCommandLine = sysctl.vm.max_map_count=262144 sysctl.fs.inotify.max_user_instances=512
```

**WSL 재시작**:
```powershell
wsl --shutdown
timeout /t 8
wsl
```

---

## 2단계: WSL 내부 설정 (3분)

### 한 번에 실행

**WSL 터미널에서 복사 & 붙여넣기**:
```bash
# inotify 설정
sudo bash -c 'cat >> /etc/sysctl.conf << EOF

# inotify 설정
fs.inotify.max_user_instances=512
fs.inotify.max_user_watches=524288
EOF'

# systemd 저널 제한
sudo bash -c 'cat >> /etc/systemd/journald.conf << EOF

[Journal]
SystemMaxUse=500M
EOF'

# 설정 적용
sudo sysctl -p
sudo systemctl restart systemd-journald

# Docker 정리
docker system prune -af --volumes

echo "✓ 설정 완료!"
```

---

## 3단계: 프로젝트별 Docker 자동 정리 (5분)

### 스크립트 생성

```bash
# 프로젝트 루트로 이동
cd /path/to/your/project

# scripts 디렉토리 생성
mkdir -p scripts

# cleanup 스크립트 생성
cat > scripts/docker-cleanup.sh << 'EOF'
#!/bin/bash
set -e
echo "=== Docker 정리 시작 ==="
docker ps -aq -f status=exited | xargs -r docker rm
docker system prune -af
echo "=== 정리 완료 ==="
docker system df
EOF

# 실행 권한
chmod +x scripts/docker-cleanup.sh
```

### docker-compose.yml 수정

**services 섹션 마지막에 추가**:
```yaml
  docker-cleanup:
    image: docker:24-cli
    container_name: docker-cleanup
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./scripts/docker-cleanup.sh:/cleanup.sh:ro
    command: sh -c "chmod +x /cleanup.sh && /cleanup.sh"
    profiles:
      - cleanup
```

### Makefile 생성

```bash
cat > Makefile << 'EOF'
.PHONY: build up down clean

build:
	docker-compose build

up:
	docker-compose --profile cleanup up -d

down:
	docker-compose down

clean:
	./scripts/docker-cleanup.sh
EOF
```

---

## 4단계: 편의 명령어 (1분)

```bash
# ~/.bashrc 끝에 추가
cat >> ~/.bashrc << 'EOF'

# Docker 편의 명령어
alias dc='docker-compose'
alias dcup='docker-compose --profile cleanup up -d'
alias docker-cleanup='docker system prune -af --volumes'

function dev-check() {
  echo "메모리: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
  echo "Docker: $(docker system df | grep -E 'RECLAIMABLE')"
}

export NODE_OPTIONS="--max-old-space-size=4096"
EOF

# 적용
source ~/.bashrc
```

---

## 테스트

```bash
# 설정 확인
dev-check

# Docker 정리 테스트
docker-cleanup

# 서비스 시작 테스트 (자동 정리 포함)
make up
```

---

## 일상 사용

```bash
# 개발 시작
dev-check          # 상태 확인
make up            # 서비스 시작 + 자동 정리

# 개발 종료
make down          # 서비스 중단

# 수동 정리 (필요시)
docker-cleanup     # Docker 수동 정리
```

---

## RAM별 .wslconfig 설정

### 16GB RAM
```ini
[wsl2]
memory=10GB
processors=4
swap=4GB
localhostForwarding=true
networkingMode=nat
kernelCommandLine = sysctl.vm.max_map_count=262144 sysctl.fs.inotify.max_user_instances=512
```

### 32GB RAM
```ini
[wsl2]
memory=24GB
processors=10
swap=8GB
localhostForwarding=true
networkingMode=nat
kernelCommandLine = sysctl.vm.max_map_count=262144 sysctl.fs.inotify.max_user_instances=512
```

### 64GB RAM
```ini
[wsl2]
memory=48GB
processors=12
swap=12GB
localhostForwarding=true
networkingMode=nat
kernelCommandLine = sysctl.vm.max_map_count=262144 sysctl.fs.inotify.max_user_instances=512
```

---

## 문제 발생 시

```bash
# 1. 로그 확인
journalctl -k --since "10 minutes ago" | grep -i error

# 2. WSL 재시작 (Windows PowerShell)
wsl --shutdown && timeout /t 8 && wsl

# 3. Docker 강제 정리
docker system prune -af --volumes

# 4. 설정 초기화
sudo sysctl -p
sudo systemctl restart systemd-journald docker
```

---

**완료!** 이제 WSL이 훨씬 안정적으로 작동합니다.

**상세 가이드**: `WSL-안정성-설정-가이드.md` 참고
