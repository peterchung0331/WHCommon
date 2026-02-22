# PDF Export 가이드

마크다운(.md) 문서를 워크허브 디자인 시스템 스타일의 PDF로 변환하는 가이드.

---

## 1. 개요

### 변환 파이프라인

```
입력.md
  ↓
[1] Mermaid 전처리 — ```mermaid 블록을 SVG로 렌더링
  ↓
[2] pandoc — Markdown → HTML5 (Pretendard 폰트, 디자인 시스템 CSS)
  ↓
[3] Chrome Headless — HTML → PDF (A4, 로고 헤더 포함)
  ↓
출력.pdf
```

### PDF 출력 특징

| 항목 | 설명 |
|------|------|
| 폰트 | Pretendard Variable (본문/제목), JetBrains Mono (코드) |
| 색상 | 디자인 시스템 v1.0 — indigo-700 Primary, zinc 중성색 |
| 페이지 | A4, 상하 15mm / 좌우 12mm 여백 |
| 헤더 | 매 페이지 상단에 웨이브릿지 로고 + Confidential 문구 |
| 다이어그램 | Mermaid 코드 블록을 SVG로 자동 변환 |

---

## 2. 환경 셋업

### 2-1. 필수 설치

```bash
# pandoc (마크다운 → HTML 변환기)
sudo apt install pandoc

# Google Chrome (HTML → PDF 엔진)
# 이미 설치 확인: google-chrome --version
# Chrome 112+ 필요

# Mermaid CLI (다이어그램 렌더링)
npm install -g @mermaid-js/mermaid-cli

# Python 3 (Mermaid 전처리에 사용)
# 대부분 기본 설치됨: python3 --version
```

### 2-2. Pretendard 폰트 설치

```bash
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts
curl -sL "https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip" -o pretendard.zip
unzip -o pretendard.zip -d pretendard-tmp
cp pretendard-tmp/public/static/*.otf .
cp pretendard-tmp/public/variable/PretendardVariable.ttf .
rm -rf pretendard-tmp pretendard.zip
fc-cache -f
```

설치 확인:
```bash
fc-list | grep -i pretend
# Pretendard Variable, Pretendard-Regular 등이 출력되면 성공
```

### 2-3. 템플릿 파일 확인

모든 템플릿은 `WHCommon/pandoc/` 에 위치합니다:

```
WHCommon/pandoc/
├── md2pdf.sh           # 변환 스크립트 (chmod +x 필요)
├── github-light.css    # 디자인 시스템 기반 CSS
├── template.html       # pandoc HTML 템플릿
├── mermaid-config.json # Mermaid 테마 설정
└── logo.png            # 웨이브릿지 가로 로고
```

실행 권한 부여:
```bash
chmod +x ~/WHCommon/pandoc/md2pdf.sh
```

---

## 3. 사용법

### 기본 사용

```bash
cd ~/WHCommon

# 기본 (로고 + Confidential 헤더 포함)
./pandoc/md2pdf.sh 기획/진행중/문서.md

# 출력 경로 지정
./pandoc/md2pdf.sh 기획/진행중/문서.md /tmp/결과.pdf

# 로고 없이 (깨끗한 문서)
./pandoc/md2pdf.sh --no-logo 기획/진행중/문서.md
```

### 출력 파일

- 출력 경로 미지정 시: 입력파일과 같은 위치에 `.pdf` 확장자로 생성
- 예: `기획/진행중/PRD.md` → `기획/진행중/PRD.pdf`

### 윈도우에서 열기 (WSL)

```bash
# WSL → Windows 경로로 복사
cp "출력파일.pdf" "/mnt/c/Github/WHCommon/해당경로/"
```

---

## 4. 디자인 시스템 매핑

디자인 시스템 v1.0 토큰이 PDF CSS에 어떻게 적용되는지 정리합니다.

### 4-1. 색상 체계

| 디자인 토큰 | Hex | PDF 용도 |
|------------|-----|----------|
| zinc-900 (`--text-primary`) | `#18181B` | 제목, strong, 코드 텍스트 |
| zinc-700 (`--text-secondary`) | `#3F3F46` | 본문 텍스트, 표 본문 |
| zinc-500 (`--text-tertiary`) | `#71717A` | Confidential 문구, 표 헤더, blockquote, H6 |
| indigo-700 (`--primary-700`) | `#4338CA` | 링크, 헤더 하단선, blockquote 좌측선 |
| zinc-50 (`--bg-subtle`) | `#FAFAFA` | 표 헤더 배경, 코드 블록 배경, blockquote 배경 |
| zinc-200 (`--border-default`) | `#E4E4E7` | 표/코드 테두리, H1/H2 하단선, 수평선 |
| zinc-100 | `#F4F4F5` | 인라인 코드 배경, kbd 배경 |

### 4-2. 타이포그래피

| 요소 | 폰트 | 크기 | 굵기 |
|------|------|------|------|
| 본문 | Pretendard Variable | 15px | 400 (Regular) |
| H1 | Pretendard Variable | 1.85em | 700 (Bold) |
| H2 | Pretendard Variable | 1.45em | 700 (Bold) |
| H3 | Pretendard Variable | 1.2em | 600 (SemiBold) |
| H4-H5 | Pretendard Variable | 1.05em / 1em | 600 |
| 코드 | JetBrains Mono | 0.85em | 400 |
| Confidential | Pretendard | 11px | Italic |

### 4-3. Mermaid 다이어그램 테마

| 요소 | 색상 | Hex |
|------|------|-----|
| 노드 배경 | indigo-50 | `#EEF2FF` |
| 노드 테두리 | indigo-700 | `#4338CA` |
| 노드 텍스트 | zinc-900 | `#18181B` |
| 연결선 | zinc-500 | `#71717A` |
| 클러스터 배경 | zinc-100 | `#F4F4F5` |
| 클러스터 테두리 | zinc-300 | `#D4D4D8` |
| 노트 배경 | amber-50 | `#FFFBEB` |
| 노트 테두리 | amber-700 | `#B45309` |
| 엣지 라벨 배경 | white | `#FFFFFF` |

---

## 5. 템플릿 상세

### 5-1. HTML 템플릿 (`template.html`)

매 페이지에 로고 헤더를 반복하기 위해 `<table><thead>` 기법을 사용합니다.
브라우저의 인쇄 엔진이 `thead`를 매 페이지 상단에 자동 반복합니다.

```html
<body>
  <!-- 로고가 있을 때만 래퍼 테이블 생성 -->
  <table class="print-wrapper">
    <thead>
      <tr><td class="header-cell">
        <div class="doc-header">
          <span class="confidential">
            Strictly Confidential and for Internal Purpose Only
          </span>
          <img src="logo.png" alt="Wavebridge" />
        </div>
      </td></tr>
    </thead>
    <tbody>
      <tr><td class="body-cell">
        <!-- 본문 콘텐츠 -->
      </td></tr>
    </tbody>
  </table>
</body>
```

`--no-logo` 옵션 사용 시 이 래퍼 테이블 없이 본문만 출력됩니다.

### 5-2. CSS 핵심 규칙 (`github-light.css`)

**페이지 설정**
```css
@page {
  size: A4;
  margin: 15mm 12mm;    /* 상하 15mm, 좌우 12mm */
}
```

**로고 헤더**
```css
.doc-header {
  display: flex;
  justify-content: space-between;  /* 좌: Confidential, 우: 로고 */
  border-bottom: 2px solid #4338CA;  /* indigo-700 */
}
.doc-header img { height: 40px; }
```

**표 스타일 충돌 방지**
```css
/* 콘텐츠 표에만 스타일 적용, 래퍼 테이블은 제외 */
table:not(.print-wrapper) th { ... }
table:not(.print-wrapper) td { ... }
```

**인쇄 최적화**
```css
@media print {
  h1, h2, h3 { page-break-after: avoid; }
  pre, table, img, blockquote { page-break-inside: avoid; }
}
```

### 5-3. Mermaid 설정 (`mermaid-config.json`)

Mermaid의 `base` 테마 위에 디자인 시스템 색상을 오버라이드합니다.

주요 설정:
```json
{
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#EEF2FF",        // 노드 배경
    "primaryBorderColor": "#4338CA",  // 노드 테두리
    "lineColor": "#71717A",           // 연결선
    "fontFamily": "Pretendard, NanumGothic, sans-serif"
  },
  "flowchart": {
    "nodeSpacing": 50,
    "rankSpacing": 60,
    "padding": 15
  }
}
```

---

## 6. 변환 스크립트 상세 (`md2pdf.sh`)

### Step 1: Mermaid 전처리

마크다운에서 ` ```mermaid ` 블록을 추출하여 SVG로 변환합니다.

```bash
# mmdc 옵션
mmdc -i input.mmd -o output.svg \
  -c mermaid-config.json \  # 디자인 시스템 테마
  -w 1200 \                 # 너비 1200px
  -s 1.5 \                  # 1.5x 스케일
  -b transparent            # 투명 배경
```

변환 후 마크다운의 mermaid 블록이 `![diagram](경로.svg)` 이미지 참조로 교체됩니다.

### Step 2: pandoc 변환

```bash
pandoc source.md \
  --from=markdown+emoji+task_lists+pipe_tables+strikeout+footnotes \
  --to=html5 \
  --template=template.html \
  --css=github-light.css \
  --embed-resources --standalone \   # 모든 리소스 인라인 삽입
  --highlight-style=kate \           # 코드 구문 강조
  --metadata title="" \
  --metadata logo=logo.png \         # 로고 경로 (--no-logo 시 생략)
  --resource-path="입력파일경로:임시폴더:pandoc폴더"
```

### Step 3: Chrome Headless

```bash
google-chrome \
  --headless=new \                   # 새 headless 모드
  --disable-gpu \
  --no-sandbox \
  --print-to-pdf=output.pdf \
  --no-pdf-header-footer \           # 기본 날짜/URL 머릿글 제거
  --run-all-compositor-stages-before-draw \
  output.html
```

---

## 7. 커스터마이징

### 로고 변경

`pandoc/logo.png` 파일을 교체하면 됩니다. 파일명은 `logo.png`으로 유지하세요.

### 색상 변경

`github-light.css`에서 Hex 값을 수정합니다. 주요 변경 포인트:

| 변경 대상 | 파일 | 찾을 값 |
|-----------|------|---------|
| 본문 텍스트 | github-light.css | `color: #3F3F46` |
| 제목 텍스트 | github-light.css | `color: #18181B` |
| 링크/강조색 | github-light.css | `#4338CA` (indigo-700) |
| 테두리 | github-light.css | `#E4E4E7` (zinc-200) |
| 다이어그램 | mermaid-config.json | `primaryBorderColor` 등 |

### Confidential 문구 변경

`template.html`의 `<span class="confidential">` 내용을 수정합니다.

### 페이지 여백 변경

`github-light.css`의 `@page` 규칙을 수정합니다:
```css
@page {
  size: A4;
  margin: 20mm 15mm;  /* 상하 좌우 원하는 값으로 */
}
```

---

## 8. 트러블슈팅

### Pretendard 폰트가 적용되지 않음
```bash
fc-list | grep -i pretend   # 폰트 설치 확인
fc-cache -f                 # 캐시 갱신 후 재시도
```

### Mermaid 렌더링 실패
```bash
which mmdc                  # mmdc 설치 확인
# 단일 파일 테스트
echo "graph LR; A-->B" > /tmp/test.mmd
mmdc -i /tmp/test.mmd -o /tmp/test.svg
```

### Chrome 기본 머릿글(날짜/URL)이 나타남
```bash
google-chrome --version     # Chrome 112+ 필요
# --headless=new 모드와 --no-pdf-header-footer 플래그 확인
```

### PDF가 빈 페이지로 나옴
```bash
# 중간 HTML 파일 직접 확인
# md2pdf.sh의 trap 라인을 주석처리하고 /tmp/pandoc_*/ 폴더 확인
```

### pandoc 버전 호환성
```bash
pandoc --version
# pandoc 3.x: --embed-resources --standalone (현재 설정)
# pandoc 2.x: --self-contained (구버전)
```

---

## 9. Claude Code 스킬

Claude Code에서 `/pdf-export` 명령으로 직접 사용할 수 있습니다.

```
/pdf-export 기획/진행중/문서.md          # 기본 (로고 포함)
/pdf-export --no-logo 기획/진행중/문서.md # 로고 없이
```

스킬 파일 위치: `~/.claude/skills/pdf-export.md`
