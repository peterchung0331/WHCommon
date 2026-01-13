# WBOnboardingHub OCR 기능 설정 보류

**작성일**: 2026-01-04
**프로젝트**: WBOnboardingHub
**상태**: 보류 (Google Cloud Vision API 키 필요)

---

## 📋 현황

### 구현 완료된 OCR 기능
- ✅ **백엔드 서비스**: `server/services/ocrService.ts`
  - Google Cloud Vision API 연동
  - 문서 텍스트 추출 (이미지, PDF)
  - 필드 자동 추출 (성명, 법인명, 사업자등록번호, 대표자, 주소, 전화번호, 이메일, 생년월일, 주민등록번호)

- ✅ **프론트엔드 컴포넌트**: `frontend/components/onboarding/OCRViewer.tsx`
  - OCR 결과 다이얼로그
  - 원본 문서 이미지 미리보기
  - 추출된 필드 표시 및 편집 기능
  - 전체 OCR 텍스트 표시

- ✅ **진입 경로**: 온보딩 상세 페이지 → 문서 목록 → "OCR" 버튼

### 필요한 작업
- ❌ **Google Cloud Vision API 키 설정**
  - 환경변수: `GOOGLE_APPLICATION_CREDENTIALS` 또는 `GOOGLE_CLOUD_PROJECT_ID`
  - 현재 미설정 상태로 OCR 기능 비활성화됨

---

## 🔧 설정 방법 (향후 작업)

### 1. Google Cloud Vision API 활성화
```bash
# Google Cloud Console에서:
# 1. 프로젝트 생성 또는 선택
# 2. Cloud Vision API 활성화
# 3. 서비스 계정 생성
# 4. JSON 키 파일 다운로드
```

### 2. 환경변수 설정
`.env` 파일에 추가:
```env
# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# 또는
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

### 3. 키 파일 저장 위치
- **로컬**: `WHCommon/env/google-vision-key.json` (Git 제외)
- **프로덕션**: Doppler에 등록

---

## 📂 관련 파일

### 백엔드
- `WBOnboardingHub/server/services/ocrService.ts` - OCR 서비스
- `WBOnboardingHub/server/routes/documentRoutes.ts` - 문서 API (OCR 엔드포인트 포함)

### 프론트엔드
- `WBOnboardingHub/frontend/components/onboarding/OCRViewer.tsx` - OCR 뷰어
- `WBOnboardingHub/frontend/app/(dashboard)/onboardings/[id]/page.tsx:420-430` - OCR 버튼

---

## 🎯 OCR 기능 흐름

```
온보딩 상세 페이지
    ↓
문서 목록에서 "OCR" 버튼 클릭
    ↓
OCRViewer 다이얼로그 열림
    ↓
GET /api/documents/:id/ocr
    ↓
ocrService.extractText(fileBuffer)
    ↓
Google Cloud Vision API 호출
    ↓
텍스트 + 구조화된 데이터 반환
    ↓
프론트엔드에 표시 (이미지 + OCR 결과)
    ↓
사용자 수정 가능 + 저장
    ↓
PUT /api/documents/:id/ocr
```

---

## 📝 추출 가능한 필드

현재 설정된 필드 패턴 (한국어 문서 기준):
- **성명**: `/성\s*명\s*[:：]?\s*([가-힣]+)/`
- **법인명**: `/법\s*인\s*명\s*[:：]?\s*([가-힣a-zA-Z0-9\s]+)/`
- **사업자등록번호**: `/사업자\s*등록\s*번호\s*[:：]?\s*([\d\-]+)/`
- **대표자**: `/대\s*표\s*자?\s*[:：]?\s*([가-힣]+)/`
- **주소**: `/주\s*소\s*[:：]?\s*(.+?)(?=\n|$)/`
- **전화번호**: `/(?:전화|연락처|TEL)\s*[:：]?\s*([\d\-\s]+)/`
- **이메일**: `/(?:이메일|E-?mail)\s*[:：]?\s*([\w\.-]+@[\w\.-]+\.\w+)/i`
- **생년월일**: `/(?:생년월일|생\s*년\s*월\s*일)\s*[:：]?\s*([\d\.\/\-]+)/`
- **주민등록번호**: `/(?:주민등록번호|주민번호)\s*[:：]?\s*([\d\-*]+)/`

---

## ⚠️ 참고사항

1. **API 비용**: Google Cloud Vision API는 월 1,000건까지 무료, 이후 유료
2. **인증 방식**: 서비스 계정 JSON 키 파일 사용 권장
3. **보안**: JSON 키 파일은 `.gitignore`에 반드시 추가
4. **대안**: OCR 없이도 수동 입력으로 온보딩 프로세스 진행 가능

---

## 다음 작업 시 체크리스트

- [ ] Google Cloud Vision API 프로젝트 생성
- [ ] 서비스 계정 및 JSON 키 생성
- [ ] 키 파일을 WHCommon/env/ 폴더에 저장
- [ ] .env 파일에 `GOOGLE_APPLICATION_CREDENTIALS` 추가
- [ ] Doppler에 프로덕션 키 등록
- [ ] 백엔드 서버 재시작
- [ ] OCR 기능 테스트 (샘플 문서 업로드)
- [ ] 추출 필드 정확도 검증
- [ ] 필요시 필드 패턴 정규식 조정

---

**마지막 업데이트**: 2026-01-04
**작성자**: Claude (AI Assistant)
