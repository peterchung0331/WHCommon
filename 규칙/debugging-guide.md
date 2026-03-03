# 디버깅 가이드

## 에러 패턴 DB
**URL**: http://workhub.biz/testagent/api/error-patterns

### 에러 발생 시 자동 검색 (최우선)
모든 에러 발생 시 **가장 먼저** 에러 패턴 DB 검색:
```bash
curl -s "http://workhub.biz/testagent/api/error-patterns?query=에러키워드"
```

### 적용 대상
빌드 에러, 테스트 실패, Docker 에러, API 에러, git 에러 등 **모든 CLI 에러**

### 프로세스
1. 에러 패턴 검색 → 매칭 시 솔루션 적용
2. 매칭 없으면 일반 디버깅 → 해결 후 DB에 등록

### API 엔드포인트
- 검색: `GET /api/error-patterns?query=키워드`
- 상세: `GET /api/error-patterns/:id`
- 등록: `POST /api/error-patterns/record`

## 디버깅 체크리스트
**URL**: http://workhub.biz/testagent/api/debugging-checklists

| 키워드 | 카테고리 |
|--------|----------|
| SSO, OAuth, 인증, 쿠키 | sso |
| Docker, 컨테이너, OOM | docker |
| DB, 마이그레이션 | database |
| Nginx, 프록시 | nginx |
