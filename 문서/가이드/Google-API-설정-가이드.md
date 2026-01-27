# Google Custom Search API 설정 가이드

## 1단계: Google Cloud Console 설정

### 1.1 프로젝트 생성
1. https://console.cloud.google.com/ 접속
2. 좌측 상단 프로젝트 선택 드롭다운 클릭
3. "새 프로젝트" 클릭
4. 프로젝트 이름: "WBSalesHub-AutoClassifier" 입력
5. "만들기" 클릭

### 1.2 Custom Search API 활성화
1. 좌측 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. 검색창에 "Custom Search API" 입력
3. "Custom Search API" 클릭
4. "사용 설정" 클릭

### 1.3 API 키 생성
1. 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
2. 상단 "+ 사용자 인증 정보 만들기" 클릭
3. "API 키" 선택
4. 생성된 API 키 복사 (예: AIzaSyD...)
5. (선택) "키 제한" 클릭하여 Custom Search API만 허용

---

## 2단계: Programmable Search Engine 생성

### 2.1 검색 엔진 생성
1. https://programmablesearchengine.google.com/cse/all 접속
2. "새 검색 엔진 만들기" 또는 "추가" 클릭
3. 설정:
   - **검색할 사이트**: `*` (별표 하나, 전체 웹 검색)
   - **이름**: WBSalesHub Auto Classifier
   - **언어**: 한국어
   - **검색 엔진 ID 이름**: wbsaleshub-classifier (선택사항)
4. "만들기" 클릭

### 2.2 검색 엔진 설정
1. 생성된 검색 엔진 클릭
2. 좌측 메뉴에서 "제어판" 선택
3. **검색 엔진 ID** 복사 (예: 01234567890abcdef:ghijk...)
4. (선택) "고급" 탭에서 설정 조정:
   - 한국어 우선 검색 활성화
   - 세이프서치 설정

---

## 3단계: 환경변수 설정

### 3.1 .env.local 파일 편집
```bash
cd /home/peterchung/WBSalesHub
nano .env.local
```

### 3.2 API 키 추가
파일 끝에 다음 내용 추가:
```bash
# Google Custom Search API
GOOGLE_SEARCH_API_KEY=YOUR_API_KEY_HERE
GOOGLE_SEARCH_ENGINE_ID=YOUR_SEARCH_ENGINE_ID_HERE
```

**예시:**
```bash
GOOGLE_SEARCH_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvw
GOOGLE_SEARCH_ENGINE_ID=01234567890abcdef:ghijk1234567890
```

### 3.3 저장 및 종료
- Ctrl+O (저장)
- Enter
- Ctrl+X (종료)

---

## 4단계: 서버 재시작 및 테스트

### 4.1 서버 재시작
```bash
cd /home/peterchung/WBSalesHub
npm run dev:server
```

### 4.2 API 테스트
```bash
# 미분류 고객 조회
curl http://localhost:4020/api/categories/unclassified

# 자동 분류 실행 (5개만 테스트)
curl -X POST http://localhost:4020/api/categories/auto-classify \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

---

## 5단계: 할당량 확인

### 무료 할당량
- **일일 검색 수**: 100회
- **초당 요청 수**: 1 QPS

### 할당량 확인 방법
1. Google Cloud Console > "API 및 서비스" > "대시보드"
2. "Custom Search API" 클릭
3. "할당량" 탭에서 사용량 확인

### 할당량 초과 시
- 유료 플랜으로 업그레이드 필요
- 또는 일일 검색 수 제한 구현

---

## 문제 해결

### API 키가 작동하지 않는 경우
1. API 키가 올바르게 복사되었는지 확인
2. Custom Search API가 활성화되었는지 확인
3. 프로젝트에 결제 계정이 연결되었는지 확인 (필수)
4. API 키 제한이 올바르게 설정되었는지 확인

### 검색 결과가 없는 경우
1. 검색 엔진 ID가 올바른지 확인
2. 검색 엔진 설정에서 "*"로 전체 웹 검색이 활성화되었는지 확인
3. 한국어 검색 설정 확인

### 할당량 초과 에러 (429)
1. 일일 100회 제한 확인
2. 다음 날까지 대기 또는 유료 플랜 업그레이드
3. API 키가 없는 경우 자동으로 모의 데이터 사용

---

## 참고 자료

- Google Cloud Console: https://console.cloud.google.com/
- Programmable Search Engine: https://programmablesearchengine.google.com/
- Custom Search JSON API 문서: https://developers.google.com/custom-search/v1/overview
- 요금 정보: https://developers.google.com/custom-search/v1/overview#pricing

