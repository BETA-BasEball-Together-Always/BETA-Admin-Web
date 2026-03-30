<h1 align="center">BETA-Admin-Web</h1>
<p align="center">BETA 운영을 위한 관리자 웹 애플리케이션</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

BETA Admin Web은 운영진이 서비스 상태를 빠르게 파악하고, 사용자와 커뮤니티 데이터를 관리할 수 있도록 만든 관리자 웹입니다. `BETA-Backend-Server`의 `admin-server`와 연동되며, 운영 환경에서는 `/admin` 경로로 배포됩니다.

## 주요 기능

- 대시보드에서 핵심 지표, 실시간 피드, 인기 토픽 모니터링
- 팀별 현황 조회
- 회원 검색 및 상태 관리
- 게시글/댓글 검색과 노출 상태 관리
- 관리자 조치 이력 조회
- Kakao 기반 관리자 인증

## 시작하기

```bash
npm install
npm run dev
```

필수 환경 변수

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_KAKAO_REST_API_KEY=your_kakao_rest_api_key
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/admin/auth/kakao/callback
```

`VITE_API_BASE_URL`은 `http://localhost:8080/api/v1`처럼 지정하며, 관리자 API 경로는 앱 내부에서 `/admin` 기준으로 조합해 사용합니다.

## 빌드

```bash
npm run build
npm run preview
```

## 배포

- CI에서 lint와 build를 확인합니다.
- `main` 브랜치 기준 빌드 결과물 `dist`가 운영 서버로 배포됩니다.
- 운영 환경에서는 Nginx가 `/var/www/admin`의 정적 파일을 `/admin` 경로로 서빙합니다.
