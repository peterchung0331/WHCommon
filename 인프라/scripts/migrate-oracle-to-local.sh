#!/bin/bash
# 오라클 DB 데이터를 로컬 Docker PostgreSQL로 마이그레이션

set -e

ORACLE_HOST="158.180.95.246"
SSH_KEY="$HOME/.ssh/oracle-cloud.key"
LOCAL_POSTGRES="localhost:5432"
LOCAL_USER="postgres"
LOCAL_PASSWORD="postgres"

echo "🔄 오라클 DB → 로컬 DB 마이그레이션 시작"
echo ""

# 허브 선택
PS3="마이그레이션할 허브를 선택하세요: "
options=("HubManager" "SalesHub" "FinHub" "OnboardingHub" "모두" "취소")
select opt in "${options[@]}"
do
    case $opt in
        "HubManager")
            HUBS=("hubmanager")
            break
            ;;
        "SalesHub")
            HUBS=("saleshub")
            break
            ;;
        "FinHub")
            HUBS=("finhub")
            break
            ;;
        "OnboardingHub")
            HUBS=("onboardinghub")
            break
            ;;
        "모두")
            HUBS=("hubmanager" "saleshub" "finhub" "onboardinghub")
            break
            ;;
        "취소")
            echo "취소되었습니다."
            exit 0
            ;;
        *) echo "잘못된 선택입니다.";;
    esac
done

# 각 허브별 마이그레이션
for hub in "${HUBS[@]}"; do
    echo "📦 $hub 마이그레이션 중..."

    # 1. SSH 터널링 시작 (임시)
    echo "  🔒 SSH 터널링 시작..."
    ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
        -i "$SSH_KEY" -L 5433:localhost:5432 -N -f ubuntu@$ORACLE_HOST
    sleep 2

    # 2. 오라클 DB에서 덤프
    echo "  📥 오라클 DB에서 덤프 생성..."
    PGPASSWORD=Wnsgh22dml2026 pg_dump \
        -h localhost -p 5433 -U postgres \
        -d "dev-$hub" \
        --no-owner --no-acl \
        -f "/tmp/oracle-$hub.sql"

    # 3. SSH 터널링 종료
    pkill -f "ssh.*5433.*$ORACLE_HOST"

    # 4. 로컬 DB에 복원
    echo "  📤 로컬 DB로 복원..."
    PGPASSWORD=$LOCAL_PASSWORD psql \
        -h localhost -p 5432 -U $LOCAL_USER \
        -d "wb$hub" \
        -f "/tmp/oracle-$hub.sql" 2>&1 | grep -v "ERROR.*already exists" || true

    # 5. 덤프 파일 삭제
    rm "/tmp/oracle-$hub.sql"

    echo "  ✅ $hub 마이그레이션 완료"
    echo ""
done

echo "✅ 모든 마이그레이션 완료"
