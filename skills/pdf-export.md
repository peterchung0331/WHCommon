---
name: pdf-export
description: 마크다운 문서를 워크허브 디자인 시스템 기반 PDF로 변환. Pretendard 폰트, Mermaid 다이어그램 렌더링, 웨이브릿지 로고 헤더 포함.
---

# PDF Export 스킬

## 개요
마크다운(.md) 문서를 워크허브 디자인 시스템 스타일의 PDF로 변환합니다.

## 실행 조건
- `/pdf-export [파일경로]` 호출 시
- `/pdf-export --no-logo [파일경로]` — 로고 없이
- `/pdf-export --help` — 도움말

## 기능
| 기능 | 설명 |
|------|------|
| **Pretendard 폰트** | 디자인 시스템 v1.0 기본 폰트 적용 |
| **Mermaid 렌더링** | mermaid 코드 블록을 SVG 이미지로 자동 변환 |
| **웨이브릿지 로고** | 매 페이지 상단에 로고 + Confidential 문구 반복 |
| **디자인 시스템 색상** | indigo-700 Primary, zinc 중성색 체계 |
| **윈도우 복사** | WSL 환경에서 자동으로 C:\Github 경로에 복사 |

## 사전 요구사항

### 필수 설치
```bash
# 1. pandoc
sudo apt install pandoc

# 2. Google Chrome (headless PDF 엔진)
# 이미 설치 확인: google-chrome --version

# 3. Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# 4. Pretendard 폰트
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts
curl -sL "https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip" -o pretendard.zip
unzip -o pretendard.zip -d pretendard-tmp
cp pretendard-tmp/public/static/*.otf .
cp pretendard-tmp/public/variable/PretendardVariable.ttf .
fc-cache -f
```

### 템플릿 파일 위치
모든 템플릿은 `WHCommon/pandoc/` 에 있어야 합니다:
```
WHCommon/pandoc/
├── md2pdf.sh           # 변환 스크립트 (실행 권한 필요)
├── github-light.css    # 디자인 시스템 기반 CSS
├── template.html       # pandoc HTML 템플릿
├── mermaid-config.json # Mermaid 테마 설정
└── logo.png            # 웨이브릿지 가로 로고
```

## 실행 프로세스

### 1단계: 인자 파싱
```
입력: /pdf-export [옵션] [파일경로] [출력경로]

옵션:
  --no-logo    로고/Confidential 문구 제거
  --help       도움말 표시

파일경로:
  - 절대경로: /home/peterchung/WHCommon/기획/문서.md
  - 상대경로: 기획/진행중/문서.md (WHCommon 기준)
  - IDE 선택: 현재 열린 파일 자동 감지

출력경로:
  - 미지정 시: 입력파일.pdf (같은 위치)
  - 지정 시: 해당 경로에 저장
```

### 2단계: 변환 실행
```bash
# WHCommon 디렉토리에서 실행
cd /home/peterchung/WHCommon

# 기본 (로고 포함)
./pandoc/md2pdf.sh "입력파일.md" "출력파일.pdf"

# 로고 없이
./pandoc/md2pdf.sh --no-logo "입력파일.md" "출력파일.pdf"
```

### 3단계: 결과 보고
변환 완료 후 반드시 다음 정보를 사용자에게 표시:
- 출력 파일 경로 (WSL 경로)
- 파일 크기
- Mermaid 다이어그램 변환 수
- 윈도우 경로 (해당 시)

### 4단계: 윈도우 복사 (선택)
WSL 환경에서 사용자가 윈도우에서 열고 싶은 경우:
```bash
# C:\Github\ 미러 경로로 복사
cp "출력파일.pdf" "/mnt/c/Github/WHCommon/해당경로/"
```

## 변환 파이프라인 상세

```
입력.md
  │
  ▼
[Step 1] Mermaid 전처리
  - ```mermaid 블록 추출
  - mmdc로 SVG 렌더링 (디자인 시스템 테마)
  - 마크다운에서 이미지 참조로 교체
  │
  ▼
[Step 2] pandoc 변환
  - Markdown → HTML5
  - Pretendard 폰트, 디자인 시스템 CSS 적용
  - 로고 헤더 삽입 (thead 반복)
  - 리소스 임베딩 (self-contained)
  │
  ▼
[Step 3] Chrome Headless
  - HTML → PDF (A4)
  - --no-pdf-header-footer (Chrome 기본 머릿글 제거)
  │
  ▼
출력.pdf
```

## 디자인 시스템 매핑

### 색상 (디자인 시스템 v1.0 → PDF CSS)
| 디자인 토큰 | Hex | PDF 용도 |
|------------|-----|----------|
| `--text-primary` (zinc-900) | #18181B | 제목, strong |
| `--text-secondary` (zinc-700) | #3F3F46 | 본문 텍스트 |
| `--text-tertiary` (zinc-500) | #71717A | 보조 텍스트, 테이블 헤더 |
| `--primary-700` (indigo-700) | #4338CA | 링크, 헤더 보더, blockquote |
| `--bg-subtle` (zinc-50) | #FAFAFA | 테이블 헤더 배경, 코드 블록 |
| `--border-default` (zinc-200) | #E4E4E7 | 테이블/코드 보더 |

### 폰트
| 용도 | 폰트 |
|------|------|
| 본문/제목 | Pretendard Variable, Pretendard |
| 코드 | JetBrains Mono, NanumGothicCoding |

### Mermaid 다이어그램 테마
| 요소 | 색상 |
|------|------|
| 노드 배경 | indigo-50 (#EEF2FF) |
| 노드 보더 | indigo-700 (#4338CA) |
| 텍스트 | zinc-900 (#18181B) |
| 연결선 | zinc-500 (#71717A) |
| 클러스터 배경 | zinc-100 (#F4F4F5) |

## 트러블슈팅

### Pretendard 폰트가 적용되지 않음
```bash
# 폰트 설치 확인
fc-list | grep -i pretend

# 캐시 갱신
fc-cache -f
```

### Mermaid 렌더링 실패
```bash
# mmdc 설치 확인
which mmdc

# 단일 파일 테스트
echo "graph LR; A-->B" > /tmp/test.mmd
mmdc -i /tmp/test.mmd -o /tmp/test.svg
```

### Chrome 기본 머릿글이 나타남
```bash
# Chrome 버전 확인 (112+ 필요)
google-chrome --version

# --headless=new 모드와 --no-pdf-header-footer 사용 확인
```

### PDF가 빈 페이지로 나옴
```bash
# 중간 HTML 확인 (임시 파일 유지)
# md2pdf.sh의 trap 라인을 주석처리하고 /tmp/pandoc_*/ 확인
```

## 사용 예시

```
# 기본 사용
/pdf-export 별도 기획/BC카드 협력 아젠다/문서.md

# 로고 없이
/pdf-export --no-logo 기획/진행중/PRD.md

# 출력 경로 지정
/pdf-export 기획/진행중/PRD.md /tmp/결과.pdf

# 현재 열린 파일 (IDE에서)
/pdf-export
```
