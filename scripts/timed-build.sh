#!/bin/bash
# timed-build.sh - 빌드 실행 시 경과 시간 알림 스크립트
#
# 사용법:
#   timed-build.sh [옵션] <명령>
#
# 옵션:
#   -i, --interval <초>  경과 시간 알림 간격 (기본: 30초)
#   -h, --help           도움말 표시
#
# 예시:
#   timed-build.sh docker build -t app:latest .
#   timed-build.sh -i 10 npm run build
#   timed-build.sh -i 60 npm test

# 기본 설정
INTERVAL=30
TIMER_PID=""

# 도움말 출력
show_help() {
    cat << EOF
사용법: timed-build.sh [옵션] <명령>

빌드 또는 장시간 명령 실행 시 경과 시간을 주기적으로 표시합니다.

옵션:
  -i, --interval <초>  경과 시간 알림 간격 (기본: 30초)
  -h, --help           이 도움말 표시

예시:
  timed-build.sh docker build -t app:latest .     # 30초 간격
  timed-build.sh -i 10 npm run build              # 10초 간격
  timed-build.sh -i 60 npm test                   # 60초 간격

권장 간격:
  - 짧은 작업 (1-3분): 10초
  - 일반 작업 (3-10분): 30초 (기본값)
  - 긴 작업 (10분+): 60초
EOF
    exit 0
}

# 타이머 종료 함수
stop_timer() {
    if [ -n "$TIMER_PID" ]; then
        kill $TIMER_PID 2>/dev/null || true
        wait $TIMER_PID 2>/dev/null || true
        TIMER_PID=""
    fi
}

# 종료 시 타이머 정리 (Ctrl+C 등)
cleanup() {
    stop_timer
    exit 130
}
trap cleanup INT TERM

# 옵션 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--interval)
            INTERVAL="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            break
            ;;
    esac
done

# 명령어가 없으면 에러
if [ $# -eq 0 ]; then
    echo "❌ 오류: 실행할 명령을 지정해주세요."
    echo ""
    show_help
fi

# 시작 시간 기록 (한국시간)
START_TIME=$(date +%s)
START_TIME_KST=$(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S')

echo "🚀 빌드 시작: $START_TIME_KST (KST)"
echo "📋 명령: $@"
echo "⏱️  알림 간격: ${INTERVAL}초"
echo "---"

# 백그라운드 타이머 시작
(
    while true; do
        sleep "$INTERVAL"
        CURRENT_TIME=$(date +%s)
        ELAPSED=$((CURRENT_TIME - START_TIME))
        MINUTES=$((ELAPSED / 60))
        SECS=$((ELAPSED % 60))
        echo "⏱️  경과 시간: ${MINUTES}분 ${SECS}초"
    done
) &
TIMER_PID=$!

# 실제 명령 실행
"$@"
BUILD_EXIT_CODE=$?

# 타이머 종료
stop_timer

# 최종 결과 출력 (한국시간)
END_TIME=$(date +%s)
END_TIME_KST=$(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S')
TOTAL_ELAPSED=$((END_TIME - START_TIME))
TOTAL_MINUTES=$((TOTAL_ELAPSED / 60))
TOTAL_SECONDS=$((TOTAL_ELAPSED % 60))

echo "---"
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ 빌드 완료! 총 소요 시간: ${TOTAL_MINUTES}분 ${TOTAL_SECONDS}초"
else
    echo "❌ 빌드 실패 (exit code: $BUILD_EXIT_CODE). 총 소요 시간: ${TOTAL_MINUTES}분 ${TOTAL_SECONDS}초"
fi
echo "🏁 종료 시간: $END_TIME_KST (KST)"

exit $BUILD_EXIT_CODE
