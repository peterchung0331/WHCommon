#!/bin/bash
# SSH 터널링을 통한 오라클 PostgreSQL 접속
# 용도: 데이터 마이그레이션, 프로덕션 데이터 확인 등

echo "🔒 SSH 터널링 시작: 오라클 PostgreSQL → localhost:5433"
echo "   오라클 서버: 158.180.95.246"
echo "   로컬 포트: 5433 (로컬 Docker PostgreSQL과 충돌 방지)"
echo ""
echo "⚠️  이 터미널을 닫으면 터널링이 종료됩니다."
echo "   백그라운드 실행: nohup $0 > /tmp/ssh-tunnel.log 2>&1 &"
echo ""

ssh -i ~/.ssh/oracle-cloud.key \
    -L 5433:localhost:5432 \
    -N \
    ubuntu@158.180.95.246
