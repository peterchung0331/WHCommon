#!/bin/bash

# Doppler 환경변수 일괄 푸시 스크립트
# .env.local → Development 환경 (로컬 개발용)
# .env → Staging 환경 (Docker 스테이징용)
# .env.prd → Production 환경 (오라클 운영용)

set -e

# Doppler 토큰 파일 로드
DOPPLER_TOKEN_FILE="/home/peterchung/WHCommon/env.doppler"

if [ ! -f "$DOPPLER_TOKEN_FILE" ]; then
    echo "❌ Doppler 토큰 파일을 찾을 수 없습니다: $DOPPLER_TOKEN_FILE"
    exit 1
fi

source "$DOPPLER_TOKEN_FILE"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 목록
declare -A PROJECTS=(
    ["WBHubManager"]="HUBMANAGER"
    ["WBSalesHub"]="SALESHUB"
    ["WBFinHub"]="FINHUB"
    ["WBOnboardingHub"]="ONBOARDINGHUB"
)

# 함수: .env 파일을 Doppler에 푸시
push_to_doppler() {
    local project_name=$1
    local project_key=$2
    local env_file=$3
    local doppler_env=$4  # dev 또는 prd

    local project_path="/home/peterchung/$project_name"
    local env_file_path="$project_path/$env_file"

    if [ ! -f "$env_file_path" ]; then
        echo -e "${YELLOW}⚠ 파일 없음: $env_file_path${NC}"
        return 1
    fi

    # Doppler 토큰 설정
    local token_var="DOPPLER_TOKEN_${project_key}_${doppler_env^^}"
    local token="${!token_var}"

    if [ -z "$token" ]; then
        echo -e "${RED}❌ 토큰 없음: $token_var${NC}"
        return 1
    fi

    echo -e "${BLUE}📤 푸시 시작: $project_name/$env_file → Doppler ($doppler_env)${NC}"

    # doppler secrets upload를 사용하여 한 번에 업로드
    if DOPPLER_TOKEN="$token" doppler secrets upload "$env_file_path" 2>&1; then
        echo -e "${GREEN}✅ 완료: $env_file_path 업로드 성공${NC}"
    else
        echo -e "${RED}❌ 실패: $env_file_path 업로드 실패${NC}"
        return 1
    fi

    echo ""
}

# 메인 실행
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Doppler 환경변수 일괄 푸시${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

for project in "${!PROJECTS[@]}"; do
    project_key="${PROJECTS[$project]}"

    echo -e "${GREEN}=== $project ===${NC}"

    # Development 환경 (.env.local → dev)
    push_to_doppler "$project" "$project_key" ".env.local" "dev"

    # Staging 환경 (.env → stg)
    push_to_doppler "$project" "$project_key" ".env" "stg"

    # Production 환경 (.env.prd → prd)
    push_to_doppler "$project" "$project_key" ".env.prd" "prd"
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}모든 프로젝트 푸시 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
