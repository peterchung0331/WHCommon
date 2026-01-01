# Claude Code 컨텍스트

이 파일은 Claude Code와의 대화에서 기억해야 할 중요한 정보를 저장합니다.

## 프로젝트 정보

### 폴더 구조
- **공용폴더**: `C:\GitHub\WorkHubShared` - 프로젝트 간 공유되는 문서 및 리소스
- **테스트리포트폴더**: `C:\GitHub\WorkHubShared\TestReport` - 테스트 결과 및 리포트 저장

### 중요 문서
- **기능 리스트**: `C:\GitHub\WorkHubShared\기능-리스트.md` - 모든 WorkHub 프로젝트의 상세 기능 목록 (도입일 포함)
- **테스트리포트포맷**: `C:\GitHub\WorkHubShared\TestReport\테스트-리포트-템플릿.md` - 테스트 리포트 작성 시 사용하는 표준 템플릿

## 언어 설정
- 새 채팅이나 대화 압축 후 **한국어**를 기본 언어로 사용

## 저장소 관리 규칙

### WBHubManager 저장소 관리 항목
WBHubManager Git 저장소에서 다음 항목들을 관리합니다:
- ✅ **워크스페이스 설정 파일** (`.code-workspace` 등)
- ✅ **WorkHubShared 공용 폴더** 전체
  - Docker 테스트 가이드 (`WorkHubShared/Docker/*.md`)
  - 공용 규칙 파일 (`WorkHubShared/ppPrd.md`, `ppTask.md`, `claude-context.md` 등)
  - 기타 프로젝트 간 공유 문서 및 설정
- ✅ **WBHubManager 프로젝트 코드** (서버, 프론트엔드 등)

### 각 Hub 저장소 관리 항목 (WBFinHub, WBSalesHub 등)
- ✅ 각 Hub의 **고유 프로젝트 코드만** 관리
- ❌ 워크스페이스 설정이나 공용 폴더는 관리하지 않음

### 정리
모든 공용/공유 자원은 **WBHubManager 저장소 하나로 집중 관리**하고, 각 Hub는 자신의 코드만 관리하는 구조입니다.

---

## 기타 설정 및 규칙
(여기에 추가 컨텍스트가 누적됩니다)

---
마지막 업데이트: 2025-12-31
