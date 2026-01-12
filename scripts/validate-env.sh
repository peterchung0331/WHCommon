#!/bin/bash
# validate-env.sh - .env 파일 검증 스크립트

ENV_FILE=$1

if [ -z "$ENV_FILE" ]; then
  echo "Usage: $0 <env-file-path>"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ File not found: $ENV_FILE"
  exit 1
fi

echo "=========================================="
echo "  Validating: $ENV_FILE"
echo "=========================================="
echo ""

# 1. 필수 환경변수 존재 확인
echo "1. Checking required variables..."
required_vars=(
  "APP_URL"
  "DOCKER_PORT"
  "DATABASE_URL"
  "NODE_ENV"
  "JWT_SECRET"
)

all_found=true
for var in "${required_vars[@]}"; do
  if grep -q "^${var}=" "$ENV_FILE"; then
    echo "  ✅ Found: $var"
  else
    echo "  ❌ Missing required variable: $var"
    all_found=false
  fi
done
echo ""

# 2. URL 프로토콜 검증 (HTTPS 사용 확인)
echo "2. Checking URL protocols (should be HTTPS)..."
http_urls=$(grep -E "^[A-Z_]+_URL=" "$ENV_FILE" | grep "http://" | grep -v "^#")
if [ -n "$http_urls" ]; then
  echo "  ⚠️  Found HTTP URLs (should be HTTPS):"
  echo "$http_urls" | sed 's/^/    /'
else
  echo "  ✅ All URLs use HTTPS"
fi
echo ""

# 3. 개별 포트 변수 검증 (존재하면 안 됨)
echo "3. Checking for individual hub port variables (should not exist)..."
if grep -qE "^DOCKER_(FINHUB|HUBMANAGER|ONBOARDING|SALESHUB|TESTAGENT)_PORT=" "$ENV_FILE"; then
  echo "  ⚠️  Found individual hub port variables (should use DOCKER_PORT only):"
  grep -E "^DOCKER_(FINHUB|HUBMANAGER|ONBOARDING|SALESHUB|TESTAGENT)_PORT=" "$ENV_FILE" | sed 's/^/    /'
else
  echo "  ✅ No individual hub port variables found"
fi
echo ""

# 4. DOCKER_PORT 값 확인
echo "4. Checking DOCKER_PORT value..."
docker_port=$(grep "^DOCKER_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"')
if [ "$docker_port" == "4500" ]; then
  echo "  ✅ DOCKER_PORT=4500 (production)"
elif [ "$docker_port" == "4400" ]; then
  echo "  ✅ DOCKER_PORT=4400 (staging)"
else
  echo "  ⚠️  Unexpected DOCKER_PORT value: $docker_port"
fi
echo ""

# 5. 데이터베이스 비밀번호 검증
echo "5. Checking database passwords..."
wrong_password=$(grep -E "DATABASE_URL=.*your_secure_password_here" "$ENV_FILE")
if [ -n "$wrong_password" ]; then
  echo "  ❌ Found placeholder password 'your_secure_password_here'"
  echo "$wrong_password" | sed 's/^/    /'
else
  echo "  ✅ No placeholder passwords found"
fi
echo ""

# 최종 결과
echo "=========================================="
if [ "$all_found" = true ] && [ -z "$http_urls" ] && ! grep -qE "^DOCKER_(FINHUB|HUBMANAGER|ONBOARDING|SALESHUB|TESTAGENT)_PORT=" "$ENV_FILE" && [ -z "$wrong_password" ]; then
  echo "  ✅ Validation PASSED"
  echo "=========================================="
  exit 0
else
  echo "  ⚠️  Validation completed with warnings"
  echo "=========================================="
  exit 0
fi
