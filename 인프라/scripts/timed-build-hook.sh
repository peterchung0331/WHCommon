#!/bin/bash
# Claude Code Hook: 장시간 실행 명령에 자동으로 timed-build.sh 적용

# 인자로 전달된 명령어 받기
COMMAND="$@"

# timed-build.sh 경로
TIMED_BUILD="/home/peterchung/WHCommon/scripts/timed-build.sh"

# 장시간 실행 명령어 패턴 (정규식)
LONG_RUNNING_PATTERNS=(
  "docker build"
  "docker-compose.*--build"
  "docker-compose up"
  "npm run build"
  "npm ci"
  "npm install.*--production"
  "npx playwright test"
  "npx jest"
  "npm test"
  "\.\/deploy-"
  "\.\/promote-"
)

# 제외할 패턴 (즉시 완료되는 명령)
EXCLUDE_PATTERNS=(
  "docker ps"
  "docker images"
  "docker logs"
  "npm --version"
  "npm list"
  "git "
  "ls "
  "cat "
  "echo "
)

# 제외 패턴 체크
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    # 제외 대상이면 그대로 실행
    exec bash -c "$COMMAND"
    exit $?
  fi
done

# 장시간 실행 패턴 체크
for pattern in "${LONG_RUNNING_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    # 매칭되면 timed-build.sh 적용
    exec "$TIMED_BUILD" bash -c "$COMMAND"
    exit $?
  fi
done

# 매칭되지 않으면 그대로 실행
exec bash -c "$COMMAND"
