# WSL 안정성 설정 문서 모음

> WSL2 + Docker 환경의 안정성을 향상시키는 완벽 가이드

---

## 📚 문서 목록

### 1. [WSL-안정성-빠른설정.md](./WSL-안정성-빠른설정.md)
**5-10분 빠른 설정**
- 즉시 적용 가능한 핵심 설정만 모음
- 복사 & 붙여넣기로 빠르게 적용
- 새 PC에서 처음 설정할 때 권장

### 2. [WSL-안정성-설정-가이드.md](./WSL-안정성-설정-가이드.md)
**완벽한 상세 가이드**
- 각 설정의 이유와 원리 설명
- 시스템별 맞춤 설정 제공
- 문제 해결 FAQ 포함
- 모니터링 및 유지보수 가이드

---

## 🎯 사용 시나리오별 추천

### 시나리오 1: 새 PC에서 처음 설정
1. **빠른설정.md** 따라 5분 설정
2. 문제 없으면 완료!
3. 문제 발생 시 **설정-가이드.md** 참고

### 시나리오 2: WSL이 자주 다운됨
1. **설정-가이드.md**의 "문제 상황 및 진단" 섹션 확인
2. 해당 문제 해결 방법 적용
3. "모니터링 및 문제 해결" 섹션으로 원인 파악

### 시나리오 3: 기존 프로젝트에 Docker 자동 정리 추가
1. **빠른설정.md**의 "3단계: Docker 자동 정리" 참고
2. 스크립트 생성 및 docker-compose.yml 수정
3. Makefile 추가

### 시나리오 4: 다른 팀원에게 공유
1. 이 README 파일 공유
2. **빠른설정.md** 먼저 시도하도록 안내
3. 문제 시 **설정-가이드.md** 참고

---

## ⚡ 핵심 설정 요약

### Windows 측 (.wslconfig)
```ini
[wsl2]
memory=24GB              # RAM의 50-75%
processors=10            # CPU 코어의 50-75%
swap=8GB                 # 메모리의 25-50%
localhostForwarding=true
networkingMode=nat
```

### WSL 내부
```bash
# inotify 증가
fs.inotify.max_user_instances=512

# systemd 저널 제한
SystemMaxUse=500M

# Docker 자동 정리
매 빌드 후 자동 실행
```

---

## 📊 예상 효과

✅ **디스크 절약**: 50-100GB 확보
✅ **WSL 안정성**: 다운 빈도 90% 감소
✅ **개발 생산성**: 수동 관리 불필요
✅ **시스템 성능**: I/O 부하 감소

---

## 🔧 일상 명령어

```bash
# 상태 확인
dev-check

# Docker 정리
docker-cleanup

# 서비스 시작 (자동 정리 포함)
make up

# 서비스 중단
make down
```

---

## 🆘 긴급 문제 해결

### WSL이 응답 없을 때
**Windows PowerShell (관리자)**:
```powershell
wsl --shutdown
timeout /t 8
wsl
```

### Docker 디스크 가득 참
**WSL 터미널**:
```bash
docker system prune -af --volumes
```

### 설정 적용 안 됨
**WSL 터미널**:
```bash
sudo sysctl -p
sudo systemctl restart systemd-journald docker
```

---

## 📝 체크리스트

### 초기 설정 완료 체크
- [ ] `.wslconfig` 생성 및 WSL 재시작
- [ ] inotify 설정 (`cat /proc/sys/fs/inotify/max_user_instances` = 512)
- [ ] systemd 저널 제한 (`journalctl --disk-usage` < 500M)
- [ ] Docker 정리 스크립트 작동 (`./scripts/docker-cleanup.sh`)
- [ ] bashrc 명령어 작동 (`dev-check` 실행 확인)

### 일상 작업 체크
- [ ] 개발 시작 전 `dev-check` 실행
- [ ] 빌드 시 자동 정리 포함 (`make up`)
- [ ] 주 1회 Docker 수동 정리

---

## 🔗 관련 문서

- [claude-context.md](./claude-context.md) - 프로젝트 전체 컨텍스트
- [계획_PRD.md](./계획_PRD.md) - PRD 작성 규칙
- [계획_테스크.md](./계획_테스크.md) - 테스크 작성 규칙

---

## 📞 문의

문제 발생 시:
1. **설정-가이드.md**의 FAQ 섹션 확인
2. 로그 수집: `journalctl -k > wsl-error.log`
3. 이 문서와 로그 함께 공유

---

**마지막 업데이트**: 2026-01-04
**버전**: 1.0
