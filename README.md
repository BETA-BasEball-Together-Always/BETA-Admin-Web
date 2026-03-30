<h2 align="center">BETA Admin Web</h2>

<p align="center">
  BETA 서비스 운영을 위한 내부 관리자 웹
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white" alt="Axios" />
</p>

## 📝 Introduction

**BETA Admin Web**은 BETA 서비스 운영을 위한 내부 관리자 웹입니다.<br />
운영에 필요한 정보 확인과 관리 작업을 한 사이트에서 처리할 수 있도록 구성했습니다.<br />
React, TypeScript, Vite를 기반으로 하며 관리자 API 통신은 Axios, 서버 상태 관리는 TanStack Query를 사용합니다.

BETA 앱과 동일한 도메인을 사용하여 /admin 경로로 분리해 운영하고, 운영 권한이 있는 관리자만 사용할 수 있도록 구성했습니다.<br />
서비스는 [beta-app.kr/admin](https://beta-app.kr/admin)에서 제공되며, 관리자 기능은 [BETA-Backend-Server](https://github.com/BETA-BasEball-Together-Always/BETA-Backend-Server)의 admin-server 모듈과 연동됩니다.

## 🧩 Architecture

```text
src
├─ app
│  ├─ providers
│  │  ├─ AuthProvider.tsx
│  │  └─ QueryProvider.tsx
│  └─ router
│     ├─ AppRouter.tsx
│     └─ RequireAuth.tsx
├─ features
│  ├─ auth
│  │  └─ pages
│  │     ├─ LoginPage.tsx
│  │     └─ KakaoCallbackPage.tsx
│  └─ admin
│     ├─ layouts
│     │  └─ AdminLayout.tsx
│     ├─ components
│     │  ├─ AdminPagination.tsx
│     │  └─ AdminActionReasonModal.tsx
│     └─ pages
│        ├─ DashboardPage.tsx
│        ├─ ChannelOverviewPage.tsx
│        ├─ UserManagementPage.tsx
│        ├─ PostManagementPage.tsx
│        ├─ CommentManagementPage.tsx
│        └─ AdminLogPage.tsx
└─ shared
   ├─ api
   ├─ auth
   ├─ config
   └─ query

```
app은 진입점과 라우팅, features는 관리자 기능 단위 화면, shared는 인증, API, query 설정 같은 공통 영역을 담당합니다.

## 🔀 System Flow

```mermaid
%%{init: {'theme': 'base'}}%%
flowchart TD
  U["beta-app.kr/admin"] --> N["Nginx"]
  N --> M["main.tsx"]
  M --> Q["QueryProvider"]
  Q --> A["AuthProvider"]
  A --> R["App.tsx / BrowserRouter"]
  R --> P["AppRouter"]

  P --> L["LoginPage"]
  P --> C["KakaoCallbackPage"]
  P --> G["RequireAuth"]
  G --> H["AdminLayout"]

  H --> D["DashboardPage"]
  H --> E["ChannelOverviewPage"]
  H --> F["UserManagementPage"]
  H --> J["PostManagementPage"]
  H --> K["CommentManagementPage"]
  H --> I["AdminLogPage"]

  D --> S["admin API layer"]
  E --> S
  F --> S
  J --> S
  K --> S
  I --> S
  L --> S
  C --> S

  S --> T["httpClient / Axios interceptor"]
  Q --> V["queryClient / TanStack Query"]
  A --> W["tokenStorage / auth state"]
  T --> B["BETA-Backend-Server / admin-server"]

  classDef default fill:#ffffff,stroke:#d0d7de,color:#24292f,stroke-width:1px;
```
/admin 경로로 진입한 요청은 라우팅과 인증 레이어를 거쳐 관리자 화면으로 연결되며,  
각 페이지는 공통 API 레이어를 통해 BETA-Backend-Server의 admin-server와 통신합니다.

## 🚀 CI/CD

- CI는 pull_request와 주요 브랜치 push에서 npm run lint와 npm run build를 검증합니다.
- CD는 main 브랜치에서 CI가 성공하면 빌드 결과물 dist를 운영 웹 서버 nginx에 반영하고, /var/www/admin 경로의 정적 파일을 갱신합니다.

## 📑 Pages 변경중

### Dashboard
서비스 핵심 지표, 실시간 피드, 인기 토픽을 확인할 수 있습니다.

### Channel Overview
팀별 사용자 수와 활동량을 비교하며 운영 흐름을 파악할 수 있습니다.

### Management
회원, 게시글, 댓글을 검색하고 상태를 관리할 수 있습니다.

### Admin Logs
관리자 조치 이력을 조건별로 조회할 수 있습니다.