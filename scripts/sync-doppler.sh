#!/bin/bash

# ============================================
# Doppler 환경변수 동기화 스크립트
# ============================================
# 사용법:
#   ./sync-doppler.sh upload dev    # .env.local → Doppler Development
#   ./sync-doppler.sh download dev  # Doppler Development → .env.local
#   ./sync-doppler.sh download prd  # Doppler Production → .env.prd

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 인자 확인
if [ $# -lt 2 ]; then
  echo "${RED}❌ Usage: $0 <upload|download> <dev|prd>${NC}"
  exit 1
fi

ACTION=$1
ENV=$2

# 프로젝트 이름 감지 (현재 디렉토리 기준)
PROJECT_DIR=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_DIR")

# Doppler 토큰 파일 경로
DOPPLER_TOKEN_FILE="$PROJECT_DIR/WHCommon/env/.env.doppler"
if [ ! -f "$DOPPLER_TOKEN_FILE" ]; then
  # 상위 디렉토리에서 찾기 (HWTestAgent 등 서브 프로젝트의 경우)
  DOPPLER_TOKEN_FILE="$PROJECT_DIR/../WHCommon/env/.env.doppler"
fi

if [ ! -f "$DOPPLER_TOKEN_FILE" ]; then
  echo "${RED}❌ Doppler token file not found: $DOPPLER_TOKEN_FILE${NC}"
  exit 1
fi

# 프로젝트별 Doppler 토큰 이름 매핑
case "$PROJECT_NAME" in
  "WBHubManager" | "wbhubmanager")
    TOKEN_PREFIX="HUBMANAGER"
    ;;
  "WBSalesHub" | "wbsaleshub")
    TOKEN_PREFIX="SALESHUB"
    ;;
  "WBFinHub" | "wbfinhub")
    TOKEN_PREFIX="FINHUB"
    ;;
  "WBOnboardingHub" | "wbonboardinghub")
    TOKEN_PREFIX="ONBOARDINGHUB"
    ;;
  "HWTestAgent" | "hwtestagent")
    TOKEN_PREFIX="WHTESTAGENT"
    ;;
  *)
    echo "${RED}❌ Unknown project: $PROJECT_NAME${NC}"
    exit 1
    ;;
esac

# 환경별 토큰 및 파일 설정
if [ "$ENV" = "dev" ]; then
  TOKEN_NAME="DOPPLER_TOKEN_${TOKEN_PREFIX}_DEV"
  ENV_FILE=".env.local"
  ENV_LABEL="Development"
elif [ "$ENV" = "prd" ]; then
  if [ "$ACTION" = "upload" ]; then
    echo "${RED}❌ Cannot upload to production. Use 'download prd' to get production secrets.${NC}"
    exit 1
  fi
  TOKEN_NAME="DOPPLER_TOKEN_${TOKEN_PREFIX}_PRD"
  ENV_FILE=".env.prd"
  ENV_LABEL="Production"
else
  echo "${RED}❌ Invalid environment: $ENV (use 'dev' or 'prd')${NC}"
  exit 1
fi

# Doppler 토큰 읽기
DOPPLER_TOKEN=$(grep "^${TOKEN_NAME}=" "$DOPPLER_TOKEN_FILE" | cut -d'=' -f2)

if [ -z "$DOPPLER_TOKEN" ]; then
  echo "${RED}❌ Token not found: $TOKEN_NAME in $DOPPLER_TOKEN_FILE${NC}"
  exit 1
fi

# 액션 수행
if [ "$ACTION" = "upload" ]; then
  echo "${YELLOW}📤 Uploading $ENV_FILE to Doppler $ENV_LABEL...${NC}"

  if [ ! -f "$ENV_FILE" ]; then
    echo "${RED}❌ File not found: $ENV_FILE${NC}"
    exit 1
  fi

  # .env 파일을 JSON 형식으로 변환
  ENV_JSON=$(cat "$ENV_FILE" | grep -v '^#' | grep -v '^$' | jq -R 'split("=") | {(.[0]): (.[1:] | join("="))}' | jq -s 'add')

  # Doppler에 업로드
  curl -s -X POST "https://api.doppler.com/v3/configs/config/secrets" \
    -H "Authorization: Bearer $DOPPLER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"secrets\": $ENV_JSON}" > /dev/null

  echo "${GREEN}✅ Successfully uploaded $ENV_FILE to Doppler $ENV_LABEL${NC}"

elif [ "$ACTION" = "download" ]; then
  echo "${YELLOW}📥 Downloading from Doppler $ENV_LABEL to $ENV_FILE...${NC}"

  # Doppler에서 환경변수 다운로드
  curl -s "https://api.doppler.com/v3/configs/config/secrets/download?format=env" \
    -H "Authorization: Bearer $DOPPLER_TOKEN" \
    -o "$ENV_FILE"

  echo "${GREEN}✅ Successfully downloaded Doppler $ENV_LABEL to $ENV_FILE${NC}"

else
  echo "${RED}❌ Invalid action: $ACTION (use 'upload' or 'download')${NC}"
  exit 1
fi
