# Orbit Research — 새 PC 세팅 가이드

> 다른 PC에서 Orbit Research 리포지토리를 클론하고 개발 환경을 구성하는 절차

---

## 1. 사전 요구사항

| 도구 | 최소 버전 | 설치 |
|------|----------|------|
| **Git** | 2.30+ | `sudo apt install git` |
| **Python** | 3.11+ (권장 3.12) | `sudo apt install python3.12 python3.12-venv` |
| **Docker** | 24+ | [공식 가이드](https://docs.docker.com/engine/install/) |
| **Docker Compose** | v2+ | Docker Desktop 포함 또는 `docker compose` 플러그인 |
| **Node.js** | 20+ (Lens 개발 시) | `nvm install 20` |

### WSL2 사용 시 (Windows)

```bash
# WSL2 Ubuntu 설치 후
sudo apt update && sudo apt upgrade -y
sudo apt install python3.12 python3.12-venv python3-pip git curl
```

---

## 2. 리포지토리 클론

```bash
# SSH 키가 GitHub에 등록되어 있어야 함
git clone git@github.com:peterchung0331/OrbitAlpha.git orbit-alpha
cd orbit-alpha
```

### SSH 키가 없는 경우

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub
# 출력된 공개키를 GitHub > Settings > SSH Keys에 등록
```

---

## 3. Python 가상환경 세팅

```bash
python3.12 -m venv .venv
source .venv/bin/activate

# 기본 + 모든 optional dependencies 설치
pip install -e ".[quant,data,dash,ml,ai,captain,bot,dev,bay]"
```

### 설치 오류 시 (빌드 의존성)

```bash
# WeasyPrint, psycopg2 등 빌드에 필요한 시스템 패키지
sudo apt install -y \
  build-essential \
  libpq-dev \
  libffi-dev \
  libcairo2-dev \
  libpango1.0-dev \
  libgdk-pixbuf2.0-dev \
  pkg-config
```

---

## 4. Docker 인프라 실행

```bash
# PostgreSQL (5500), Redis (6501), Qdrant (6333) 실행
docker compose up -d postgres redis qdrant
```

### 실행 확인

```bash
docker compose ps

# PostgreSQL 접속 테스트
psql "postgresql://orbit:orbit@localhost:5500/orbit_research" -c "SELECT 1"
```

---

## 5. 환경변수 설정

```bash
cp .env.template .env.local
```

`.env.local`을 편집하여 API 키를 입력:

```bash
# 필수 (기본값으로 동작)
DATABASE_URL=postgresql://orbit:orbit@localhost:5500/orbit_research
REDIS_URL=redis://localhost:6501/0

# 아래는 기존 PC의 .env.local에서 복사
ANTHROPIC_API_KEY=sk-ant-...
COINGLASS_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNELS=...
DART_API_KEY=...
KOREA_INVEST_APP_KEY=...
KOREA_INVEST_APP_SECRET=...
KOREA_INVEST_ACCOUNT_NO=...

# Deck 인증
OWNER_PASSWORD=0000
AUTH_PASSWORD=1111

# Lens
LENS_URL=https://lens-ten-tawny.vercel.app
LENS_ADMIN_EMAIL=seunghwan.chung.89@gmail.com
NEON_DATABASE_URL=postgresql://neondb_owner:...@ep-curly-lab-a1zyfd88-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> **기존 PC의 `.env.local` 파일을 통째로 복사하는 것이 가장 빠릅니다.**

---

## 6. 데이터베이스 마이그레이션

```bash
# Alembic 마이그레이션 실행 (테이블 생성)
alembic upgrade head

# 자산 시드 데이터 적재
python -m orbit_base seed
```

---

## 7. 데이터 수집 (초기 적재)

```bash
# 일간 가격 데이터 수집 (yfinance 기반, 3~5분 소요)
python -m orbit_base collect
```

---

## 8. 서비스 실행

### Orbit Base (데이터 API)

```bash
python -m orbit_base serve
# → http://localhost:8001
```

### Celery Worker + Beat (백그라운드 작업)

```bash
# 터미널 1: Worker
celery -A orbit_base.tasks.celery_app worker --loglevel=info --concurrency=2

# 터미널 2: Beat (스케줄러)
celery -A orbit_base.tasks.schedule beat --loglevel=info
```

또는 Docker로 한번에:

```bash
docker compose up -d celery-worker celery-beat
```

### Orbit Lens (리포트 플랫폼, 선택)

```bash
cd services/lens
npm install
cp .env.example .env.local
# .env.local에 NEON_DATABASE_URL, ANTHROPIC_API_KEY 등 설정
npm run dev
# → http://localhost:8100
```

---

## 9. 검증 체크리스트

```bash
# 1. DB 접속
psql "postgresql://orbit:orbit@localhost:5500/orbit_research" -c "SELECT count(*) FROM base_assets"

# 2. API 서버
curl http://localhost:8001/api/base/assets | python -m json.tool | head -20

# 3. Redis
redis-cli -p 6501 ping
# → PONG

# 4. 가상환경 패키지
python -c "import orbit_base; import orbit_lab; print('OK')"
```

---

## 10. 빠른 복사 (기존 PC → 새 PC)

기존 PC에서 복사할 파일 목록:

| 파일 | 용도 |
|------|------|
| `.env.local` | 모든 API 키와 환경변수 |
| `services/lens/.env.local` | Lens 로컬 환경변수 |
| `.kis_token_cache.json` | 한국투자증권 토큰 캐시 (선택) |

```bash
# 기존 PC에서 (SCP 예시)
scp .env.local services/lens/.env.local user@new-pc:~/orbit-alpha/
scp services/lens/.env.local user@new-pc:~/orbit-alpha/services/lens/
```

---

## 트러블슈팅

### `psycopg2` 빌드 실패

```bash
sudo apt install libpq-dev
pip install psycopg2-binary
```

### Docker 포트 충돌

```bash
# 5500, 6501, 6333 사용 중인 프로세스 확인
sudo lsof -i :5500
sudo lsof -i :6501
```

### Alembic 마이그레이션 실패

```bash
# DB가 완전히 비어있다면 head로 직행
alembic upgrade head

# 특정 버전에서 막히면
alembic current       # 현재 버전 확인
alembic history       # 히스토리 확인
```
