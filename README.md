# BETA-Admin-Web

BETA 관리자 웹 프론트엔드 레포지토리입니다.

운영진이 서비스 현황을 확인하고 회원, 게시글, 댓글, 관리자 조치 이력을 관리할 수 있는 웹 애플리케이션입니다. `BETA-Backend-Server`의 `admin-server`와 연동되며, 운영 환경에서는 빌드된 `dist`가 Nginx를 통해 `/admin` 경로로 서빙됩니다.

## Stack
- React 19
- TypeScript
- Vite 7
- React Router
- TanStack Query
- Axios
- Tailwind CSS v4

## Features
- Kakao 기반 관리자 로그인
- 대시보드
- 팀별 현황
- 회원 관리
- 게시글 관리
- 댓글 관리
- 조치 이력 조회
- 신고/공지 관리 페이지는 준비 중

## Local Development

```bash
npm install
npm run dev
```

환경 변수:
- `VITE_API_BASE_URL`
- `VITE_KAKAO_REST_API_KEY`
- `VITE_KAKAO_REDIRECT_URI`

예시:
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_KAKAO_REST_API_KEY=your_kakao_rest_api_key
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/admin/auth/kakao/callback
```

`VITE_API_BASE_URL`은 `/api/v1/admin` 또는 `http://localhost:8080/api/v1` 형태로 사용할 수 있습니다. 관리자 API 경로는 앱 내부에서 `/admin` 기준으로 정리됩니다.

## Build

```bash
npm run build
npm run preview
```

## Deployment

- CI는 `pull_request`와 `push`에서 lint와 build를 확인합니다.
- CD는 `main` 기준 빌드 결과물 `dist`를 서버로 배포합니다.
- 운영 환경에서는 Nginx가 `/var/www/admin`의 정적 파일을 `/admin` 경로로 서빙합니다.
