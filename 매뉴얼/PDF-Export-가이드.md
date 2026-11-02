# PDF 출력 가이드

> 최종 업데이트: 2026-03-11

## 도구 체인

| 단계 | 도구 | 버전 | 역할 |
|------|------|------|------|
| 1 | Pandoc | 3.9+ | Markdown → HTML5 변환 |
| 2 | WeasyPrint | 68.1+ | HTML → PDF 렌더링 (CSS 기반 PDF 엔진) |

## 사전 요구사항 (Windows)

```
# Python 3.12
winget install Python.Python.3.12

# GTK3 런타임 (WeasyPrint 의존)
winget install tschoonj.GTKForWindows

# WeasyPrint
C:\Users\Peter\AppData\Local\Programs\Python\Python312\python.exe -m pip install weasyprint

# Pandoc
winget install JohnMacFarlane.Pandoc
```

## 실행 명령

```bash
# 1단계: Pandoc — Markdown → HTML5 (CSS 임베딩)
pandoc "docs/{문서}.md" \
  -f markdown -t html5 \
  --standalone \
  --embed-resources \
  --css="docs/_pdf-style.css" \
  --variable=lang:ko \
  -o "docs/{문서}.html"

# 2단계: WeasyPrint — HTML → PDF (GTK3 PATH 필요)
export PATH="/c/Program Files/GTK3-Runtime Win64/bin:$PATH"
/c/Users/Peter/AppData/Local/Programs/Python/Python312/Scripts/weasyprint.exe \
  "docs/{문서}.html" \
  "docs/{문서}.pdf"
```

## 디자인 스타일시트

스타일 파일: `docs/_pdf-style.css` (ReportViewer print 스타일 기반)

| 항목 | 설정 |
|------|------|
| 용지 | A4, 여백 상하 25mm / 좌우 20mm |
| 본문 서체 | Apple SD Gothic Neo → Pretendard → Malgun Gothic (폴백) |
| 본문 크기 | 10.5pt, 행간 1.7 |
| 테이블 헤더 | 파란색 배경(#2C5AA0) + 흰색 글씨 |
| 테이블 행 | 짝수 행 연회색 배경(#F7F9FC) 줄무늬 |
| 인용블록 | 파란색 좌측 보더(#2C5AA0) + 연한 파란 배경(#EEF4FB) |
| 페이지 번호 | 하단 중앙, 9pt 회색(#94A3B8) |
| h1 제목 | 18pt, 하단 2pt 실선(#191D2B), 페이지 넘김 |
| h2 절 제목 | 14pt, 하단 1pt 회색 실선(#94A3B8) |
| h3 소제목 | 12pt, 파란색(#2C5AA0) |

## 알려진 이슈

- 한글 목차 앵커 링크: WeasyPrint에서 한글 URI 인코딩 경고 발생 → PDF 내용에는 영향 없음
- Windows에서 WeasyPrint 실행 시 GTK3 런타임 PATH 필요
