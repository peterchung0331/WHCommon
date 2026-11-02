#!/bin/bash
# md2pdf.sh - Markdown to PDF converter
# Pretendard 폰트, 디자인 시스템 Mermaid, 웨이브릿지 로고 헤더
# 사용법: ./pandoc/md2pdf.sh <입력.md> [출력.pdf]
#         ./pandoc/md2pdf.sh --no-logo <입력.md> [출력.pdf]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSS_FILE="$SCRIPT_DIR/github-light.css"
TEMPLATE_FILE="$SCRIPT_DIR/template.html"
MERMAID_CONFIG="$SCRIPT_DIR/mermaid-config.json"
LOGO_FILE="$SCRIPT_DIR/logo.png"

# 로고 옵션
USE_LOGO=true
if [ "${1:-}" = "--no-logo" ]; then
  USE_LOGO=false
  shift
fi

# 입력 파일 확인
if [ $# -lt 1 ]; then
  echo "사용법: $0 [--no-logo] <입력.md> [출력.pdf]"
  echo "예시:   $0 기획/진행중/문서.md"
  echo "        $0 --no-logo 기획/진행중/문서.md output.pdf"
  exit 1
fi

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
  echo "오류: 파일을 찾을 수 없습니다 - $INPUT_FILE"
  exit 1
fi

# 출력 파일명
if [ $# -ge 2 ]; then
  OUTPUT_FILE="$2"
else
  OUTPUT_FILE="${INPUT_FILE%.md}.pdf"
fi

# 임시 디렉토리
TEMP_DIR=$(mktemp -d /tmp/pandoc_XXXXXX)
TEMP_MD="$TEMP_DIR/source.md"
TEMP_HTML="$TEMP_DIR/output.html"
trap "rm -rf '$TEMP_DIR'" EXIT

echo "변환 중: $INPUT_FILE → $OUTPUT_FILE"

# Step 1: Mermaid 다이어그램 → SVG 변환
INPUT_DIR="$(cd "$(dirname "$INPUT_FILE")" && pwd)"
cp "$INPUT_FILE" "$TEMP_MD"

MERMAID_COUNT=$(grep -c '```mermaid' "$TEMP_MD" || true)
if [ "$MERMAID_COUNT" -gt 0 ]; then
  echo "  Mermaid 다이어그램 $MERMAID_COUNT개 렌더링 중..."

  COUNTER=0
  while IFS= read -r -d '' BLOCK; do
    COUNTER=$((COUNTER + 1))
    MERMAID_FILE="$TEMP_DIR/mermaid_${COUNTER}.mmd"
    SVG_FILE="$TEMP_DIR/mermaid_${COUNTER}.svg"

    echo "$BLOCK" > "$MERMAID_FILE"

    if mmdc -i "$MERMAID_FILE" -o "$SVG_FILE" -c "$MERMAID_CONFIG" -w 1200 -s 1.5 -b transparent --quiet 2>/dev/null; then
      echo "  ✓ 다이어그램 $COUNTER/$MERMAID_COUNT"
    else
      echo "  ✗ 다이어그램 $COUNTER 실패 (텍스트로 유지)"
    fi
  done < <(python3 -c "
import re, sys
content = open('$TEMP_MD', 'r').read()
blocks = re.findall(r'\`\`\`mermaid\n(.*?)\n\`\`\`', content, re.DOTALL)
for b in blocks:
    sys.stdout.write(b + '\0')
")

  python3 -c "
import re, os

temp_dir = '$TEMP_DIR'
content = open('$TEMP_MD', 'r').read()

counter = 0
def replace_mermaid(match):
    global counter
    counter += 1
    svg_file = os.path.join(temp_dir, f'mermaid_{counter}.svg')
    if os.path.exists(svg_file):
        return f'![diagram]({svg_file})'
    return match.group(0)

content = re.sub(r'\`\`\`mermaid\n.*?\n\`\`\`', replace_mermaid, content, flags=re.DOTALL)
open('$TEMP_MD', 'w').write(content)
"
fi

# Step 2: Markdown → HTML (pandoc)
PANDOC_ARGS=(
  --from=markdown+emoji+task_lists+pipe_tables+strikeout+footnotes
  --to=html5
  --template="$TEMPLATE_FILE"
  --css="$CSS_FILE"
  --embed-resources --standalone
  --highlight-style=kate
  --metadata title=""
  --resource-path="$INPUT_DIR:$TEMP_DIR:$SCRIPT_DIR/.."
)

if [ "$USE_LOGO" = true ] && [ -f "$LOGO_FILE" ]; then
  PANDOC_ARGS+=(--metadata "logo=$LOGO_FILE")
fi

pandoc "$TEMP_MD" "${PANDOC_ARGS[@]}" -o "$TEMP_HTML"

# Step 3: HTML → PDF (Chrome headless)
google-chrome \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --print-to-pdf="$OUTPUT_FILE" \
  --no-pdf-header-footer \
  --run-all-compositor-stages-before-draw \
  "$TEMP_HTML" \
  2>/dev/null

echo "완료: $OUTPUT_FILE"
echo "크기: $(du -h "$OUTPUT_FILE" | cut -f1)"
