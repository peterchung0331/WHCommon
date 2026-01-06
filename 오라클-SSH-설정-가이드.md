# 오라클 클라우드 SSH 접속 설정 가이드

## 복사된 파일

| 파일명 | 설명 |
|--------|------|
| `oracle-cloud.key` | Private Key (접속 시 사용) |
| `oracle-cloud.key.pub` | Public Key (페어 보관용) |

## 설정 절차

### 1단계: 키 파일 복사

WSL 또는 Linux 터미널에서:

```bash
# .ssh 폴더가 없으면 생성
mkdir -p ~/.ssh

# 다운로드 폴더에서 키 파일 복사 (WSL 경로)
cp /mnt/c/Users/<사용자명>/Downloads/oracle-cloud.key ~/.ssh/
cp /mnt/c/Users/<사용자명>/Downloads/oracle-cloud.key.pub ~/.ssh/
```

### 2단계: 키 파일 권한 설정 (필수!)

```bash
chmod 600 ~/.ssh/oracle-cloud.key
chmod 644 ~/.ssh/oracle-cloud.key.pub
```

> **중요**: 권한이 잘못되면 SSH가 키를 거부합니다.

### 3단계: SSH Config 설정

```bash
# config 파일 편집
nano ~/.ssh/config
```

아래 내용 추가:

```
Host oracle-cloud
    HostName 158.180.95.246
    User ubuntu
    IdentityFile ~/.ssh/oracle-cloud.key
    IdentitiesOnly yes
```

저장 후 권한 설정:

```bash
chmod 600 ~/.ssh/config
```

### 4단계: 접속 테스트

```bash
ssh oracle-cloud
```

또는 직접 명령어:

```bash
ssh -i ~/.ssh/oracle-cloud.key ubuntu@158.180.95.246
```

## 오라클 서버 정보

| 항목 | 값 |
|------|-----|
| IP | 158.180.95.246 |
| 사용자 | ubuntu |
| 키 이름 | ssh-key-2026-01-01 |

## 배포된 서비스

| 서비스 | Frontend | Backend |
|--------|----------|---------|
| WBHubManager | :3090 | :4090 |
| WBSalesHub | :3010 | :4010 |
| WBFinHub | :3020 | :4020 |
| HWTestAgent | :3100 | :4100 |

## 문제 해결

### "Permission denied (publickey)" 오류
- 키 파일 권한 확인: `ls -la ~/.ssh/oracle-cloud.key`
- 600이 아니면: `chmod 600 ~/.ssh/oracle-cloud.key`

### "Bad owner or permissions" 오류
- .ssh 폴더 권한: `chmod 700 ~/.ssh`
- config 파일 권한: `chmod 600 ~/.ssh/config`

### 키 파일을 찾을 수 없음
- 경로 확인: `ls ~/.ssh/oracle-cloud.key`
- config의 IdentityFile 경로가 정확한지 확인
