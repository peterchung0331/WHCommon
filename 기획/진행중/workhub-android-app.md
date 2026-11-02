# WorkHub Android 앱 (TWA) 구축 가이드

> 작성일: 2026-03-11
> 방식: TWA (Trusted Web Activity) — Bubblewrap CLI
> 배포: Google Play Closed Testing

---

## 전체 흐름

```
PWA 설정 완료 → Firebase 설정 → 아이콘 생성 → Bubblewrap 빌드 → Play Console 업로드
```

---

## 단계별 작업

---

### [완료] Step 1: PWA 기반 코드 작성

코드 반영 완료:
- `frontend/public/manifest.json`
- `frontend/public/sw.js`
- `frontend/public/firebase-messaging-sw.js` (Firebase 설정값 교체 필요)
- `frontend/app/sw-register.tsx`
- `frontend/lib/firebase.ts` (Firebase 설정값 교체 필요)
- `server/routes/pushRoutes.ts`
- `server/database/migrations/add_push_tokens.sql`

---

### [사용자 작업] Step 2: 앱 아이콘 생성

**WB Logo 파일** (`frontend/public/WB Logo V.png`)을 기반으로 3개 파일 생성:

| 파일 | 크기 | 용도 |
|------|------|------|
| `frontend/public/icons/icon-192.png` | 192×192 px | 앱 아이콘 (기본) |
| `frontend/public/icons/icon-512.png` | 512×512 px | 앱 아이콘 (고해상도) |
| `frontend/public/icons/icon-512-maskable.png` | 512×512 px | Android Adaptive Icon (safe zone 주의) |

**도구 추천**: [realfavicongenerator.net](https://realfavicongenerator.net) 또는 [maskable.app](https://maskable.app)

> maskable 아이콘: 전체 512×512 영역에 배경색 채우고, 로고는 중앙 409px(80%) 안에 위치

---

### [사용자 작업] Step 3: Firebase 프로젝트 생성 및 FCM 설정

1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성 (`workhub-prod`)
2. **웹 앱 추가** → SDK 설정값 복사
3. **Cloud Messaging 활성화**:
   - 프로젝트 설정 → 클라우드 메시징 탭
   - 웹 푸시 인증서 → 키 쌍 생성 (VAPID key 복사)
4. **서비스 계정 키 발급**:
   - 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 (JSON 다운로드)

#### 환경변수 추가 (.env.prd에 추가)

```bash
# Firebase FCM
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=workhub-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=workhub-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=workhub-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNt...

FIREBASE_PROJECT_ID=workhub-prod
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"workhub-prod",...}
```

#### 코드 파일에도 직접 채워넣기

- `frontend/public/firebase-messaging-sw.js` — firebaseConfig 객체 업데이트
  (서비스 워커는 환경변수 접근 불가 → 직접 입력 필요)

---

### [사용자 작업] Step 4: DB 마이그레이션 실행

```bash
# 서버에서 실행
psql $DATABASE_URL -f server/database/migrations/add_push_tokens.sql
```

---

### [사용자 작업] Step 5: Bubblewrap CLI로 Android 프로젝트 생성

#### 사전 준비 (로컬 PC)
- Node.js 18+
- Java 17+ JDK ([Adoptium](https://adoptium.net))
- Android SDK Command-line Tools (또는 Android Studio)

#### 설치 및 실행

```bash
# Bubblewrap 설치
npm install -g @bubblewrap/cli

# 초기화 (처음 한 번)
bubblewrap init --manifest https://workhub.biz/manifest.json

# 프롬프트 입력값
# - Application ID (package name): biz.workhub.app
# - Application name: WorkHub
# - Short name: WorkHub
# - Theme color: #4338CA
# - Background color: #FFFFFF
# - Display mode: standalone
# - Start URL: /
# - Icon URL: https://workhub.biz/icons/icon-512.png

bubblewrap build
```

빌드 완료 시 `app-release-signed.aab` 파일 생성됨

#### SHA-256 Fingerprint 추출

```bash
keytool -list -v -keystore ./android-keystore.jks
# 출력에서 SHA256: 값 복사 → assetlinks.json에 붙여넣기
```

---

### [사용자 작업] Step 6: assetlinks.json 업데이트

`frontend/public/.well-known/assetlinks.json` 에서 `REPLACE_WITH_YOUR_SHA256_FINGERPRINT` 를 실제 값으로 교체:

```json
"sha256_cert_fingerprints": [
  "AB:CD:EF:12:34:..."
]
```

→ 배포 후 https://workhub.biz/.well-known/assetlinks.json 접근 확인

---

### [사용자 작업] Step 7: Google Play Console 업로드

1. [Google Play Console](https://play.google.com/console) → 앱 만들기
2. **내부 테스트** 또는 **비공개 테스트** 트랙 선택
3. `app-release-signed.aab` 업로드
4. 테스터 이메일 목록 추가 (회사 직원 Google 계정)
5. 출시 검토 제출

---

## 파일 구조 요약

```
frontend/public/
├── manifest.json              ← PWA 매니페스트
├── sw.js                      ← 서비스 워커
├── firebase-messaging-sw.js   ← FCM 백그라운드 핸들러 (설정값 입력 필요)
├── .well-known/
│   └── assetlinks.json        ← TWA 도메인 인증 (SHA-256 입력 필요)
└── icons/
    ├── icon-192.png           ← 생성 필요
    ├── icon-512.png           ← 생성 필요
    └── icon-512-maskable.png  ← 생성 필요

frontend/app/
├── layout.tsx                 ← manifest 링크, meta 태그 추가됨
├── sw-register.tsx            ← 서비스 워커 등록 컴포넌트
└── lib/firebase.ts            ← FCM 클라이언트 (설정값 입력 필요)

server/
├── routes/pushRoutes.ts       ← 토큰 등록/발송 API
└── database/
    ├── schema/push_tokens.sql
    └── migrations/add_push_tokens.sql
```

---

## 체크리스트

- [ ] 앱 아이콘 3개 생성 → `frontend/public/icons/`
- [ ] Firebase 프로젝트 생성 + 환경변수 설정
- [ ] `firebase-messaging-sw.js` 에 Firebase config 직접 입력
- [ ] DB 마이그레이션 실행
- [ ] 배포 후 PWA 작동 확인 (Chrome DevTools → Application → Manifest)
- [ ] Bubblewrap CLI로 APK/AAB 빌드
- [ ] assetlinks.json SHA-256 업데이트 후 재배포
- [ ] Google Play Console Closed Testing 트랙에 업로드
