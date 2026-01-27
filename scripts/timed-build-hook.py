#!/usr/bin/env python3
"""
Claude Code PreToolUse Hook: 장시간 실행 명령에 자동으로 timed-build.sh 적용
"""
import json
import sys
import re

# 시간 측정이 필요한 장시간 명령 패턴
LONG_RUNNING_PATTERNS = [
    r"docker build",
    r"docker-compose.*--build",
    r"docker-compose up",
    r"docker compose.*build",
    r"docker compose up",
    r"npm run build",
    r"npm ci",
    r"npm install.*--production",
    r"npm install$",
    r"npx playwright test",
    r"npx jest",
    r"npm test",
    r"npm run test",
    r"\./deploy-",
    r"\./promote-",
]

# 제외할 패턴 (즉시 완료되는 명령)
EXCLUDE_PATTERNS = [
    r"^docker ps",
    r"^docker images",
    r"^docker logs",
    r"^npm --version",
    r"^npm list",
    r"^git ",
    r"^ls ",
    r"^cat ",
    r"^echo ",
    r"^pwd",
    r"^which ",
    r"^cd ",
]

TIMED_BUILD = "/home/peterchung/WHCommon/scripts/timed-build.sh"


def should_exclude(command: str) -> bool:
    """제외 대상인지 확인"""
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True
    return False


def is_long_running(command: str) -> bool:
    """장시간 실행 명령인지 확인"""
    for pattern in LONG_RUNNING_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True
    return False


def main():
    try:
        # stdin에서 JSON 읽기
        data = json.load(sys.stdin)

        # tool_name과 command 추출
        tool_name = data.get("tool_name", "")
        command = data.get("tool_input", {}).get("command", "")

        # Bash 도구가 아니면 패스
        if tool_name != "Bash" or not command:
            sys.exit(0)

        # 제외 패턴이면 패스
        if should_exclude(command):
            sys.exit(0)

        # 장시간 실행 패턴이면 래핑
        if is_long_running(command):
            # 명령 내 특수문자 escape
            escaped = command.replace("\\", "\\\\").replace('"', '\\"')
            wrapped = f'{TIMED_BUILD} bash -c "{escaped}"'

            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "updatedInput": {
                        "command": wrapped
                    }
                }
            }
            print(json.dumps(output))

        sys.exit(0)

    except json.JSONDecodeError:
        # JSON 파싱 실패 시 조용히 종료
        sys.exit(0)
    except Exception:
        # 기타 에러 시 조용히 종료 (Hook 실패가 명령 실행을 막지 않도록)
        sys.exit(0)


if __name__ == "__main__":
    main()
