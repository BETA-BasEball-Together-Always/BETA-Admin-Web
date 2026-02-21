# BETA-Admin-Web

BETA 관리자용 웹 프론트엔드 레포지토리 입니다.

## Tech Stack
- React 19
- TypeScript (strict)
- Vite 7
- React Router DOM
- Axios
- TanStack Query (React Query)
- Tailwind CSS v4
- ESLint

## Context
- 백엔드 레포지토리: `BETA-Backend-Server`
- 백엔드 멀티모듈에 `admin-server`가 `user-server`처럼 추가되는 구조를 고려해 API 계층을 분리해 개발합니다.


## Current Setup
- 라우팅
  - `/`: `RootRedirect` (토큰 유무에 따라 분기)
  - `/login`: `LoginPage`
  - `/admin`: `RequireAuth`로 보호된 `DashboardPage`
- 임시 인증 가드
  - `localStorage`의 `accessToken` 기준으로 접근 제어
- API 인프라
  - `src/shared/api/httpClient.ts`: axios 공통 인스턴스/토큰 주입/timeout
  - `src/shared/api/apiError.ts`: 백엔드 에러 응답 공통 변환
- 서버 상태 관리
  - `src/shared/query/queryClient.ts`
  - `src/app/providers/QueryProvider.tsx`
- 경로 alias
  - `@app/*`, `@features/*`, `@shared/*`

## Environment
- `VITE_API_BASE_URL`
- 로컬 개발 기준 예시:
  - `VITE_API_BASE_URL=http://localhost:8080/api/v1`

## CI
- GitHub Actions: `.github/workflows/ci.yml`
- 실행 항목:
  - `npm ci`
  - `npm run lint`
  - `npm run build`
