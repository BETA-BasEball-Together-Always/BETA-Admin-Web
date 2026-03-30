<h1 align="center">BETA-Admin-Web</h1>
<p align="center">BETA 운영을 위한 관리자 콘솔</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white" alt="Axios" />
</p>

BETA Admin Web은 BETA 서비스 운영을 위한 내부 관리자 웹입니다. 대시보드에서 핵심 지표와 실시간 흐름을 확인하고, 팀별 현황과 회원·게시글·댓글 데이터를 관리하며, 관리자 조치 이력까지 한곳에서 확인할 수 있도록 구성했습니다. 백엔드는 `BETA-Backend-Server`의 `admin-server`와 연동되며, 운영 환경에서는 `/admin` 경로로 제공됩니다.

## Pages

### Dashboard
서비스 핵심 지표, 실시간 피드, 인기 토픽을 확인할 수 있습니다.

### Channel Overview
팀별 사용자 수와 활동량을 비교하며 운영 흐름을 파악할 수 있습니다.

### Management
회원, 게시글, 댓글을 검색하고 상태를 관리할 수 있습니다.

### Admin Logs
관리자 조치 이력을 조건별로 조회할 수 있습니다.

## Tech

`React 19`, `TypeScript`, `Vite` 기반으로 구축했으며, 서버 상태 관리는 `TanStack Query`, API 통신은 `Axios`를 사용합니다.

## Workflow

- CI는 PR과 주요 브랜치 push에서 lint와 build를 검증합니다.
- CD는 `main`의 CI 성공 이후 운영 서버의 `/admin` 정적 파일을 갱신합니다.

## Current Scope

- Kakao 로그인 및 refresh 기반 인증 상태 복구
- 대시보드, 팀별 현황, 관리자 조치 이력 조회
- 회원·게시글·댓글 관리 화면 및 API 연동
- 공통 pagination과 변경 사유 modal 적용
- 신고/공지 관리 페이지는 준비 중
