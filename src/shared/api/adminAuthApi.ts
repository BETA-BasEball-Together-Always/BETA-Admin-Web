import axios from 'axios'
import { httpClient } from '@shared/api/httpClient'
import type { KakaoOauthConfig } from '@shared/config/authConfig'

const KAKAO_AUTHORIZE_ENDPOINT = 'https://kauth.kakao.com/oauth/authorize'
const KAKAO_TOKEN_ENDPOINT = 'https://kauth.kakao.com/oauth/token'

type KakaoTokenResponse = {
  access_token?: string
}

export type AdminLoginResponse = {
  accessToken: string
  user: {
    userId: number
    email: string
    nickname: string
    role: string
  }
}

type AdminRefreshResponse = {
  accessToken?: string
}

function resolveAdminPath(path: string): string {
  const baseUrl = (httpClient.defaults.baseURL ?? '').replace(/\/+$/, '')
  return baseUrl.endsWith('/admin') ? path : `/admin${path}`
}

export function createKakaoAuthorizeUrl(config: KakaoOauthConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.restApiKey,
    redirect_uri: config.redirectUri,
    state,
  })

  return `${KAKAO_AUTHORIZE_ENDPOINT}?${params.toString()}`
}

export async function exchangeKakaoCodeForAccessToken(
  config: KakaoOauthConfig,
  code: string,
): Promise<string> {
  const payload = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.restApiKey,
    redirect_uri: config.redirectUri,
    code,
  })

  const { data } = await axios.post<KakaoTokenResponse>(KAKAO_TOKEN_ENDPOINT, payload.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  })

  if (!data.access_token) {
    throw new Error('카카오 액세스 토큰을 받지 못했습니다.')
  }

  return data.access_token
}

export async function loginAdminWithKakao(accessToken: string): Promise<AdminLoginResponse> {
  const loginPath = resolveAdminPath('/auth/login/kakao')
  const { data } = await httpClient.post<AdminLoginResponse>(
    loginPath,
    {
      token: accessToken,
    },
    {
      withCredentials: true,
    },
  )

  return data
}

export async function refreshAdminAccessToken(): Promise<string> {
  const refreshPath = resolveAdminPath('/auth/refresh')
  const { data } = await httpClient.post<AdminRefreshResponse>(
    refreshPath,
    {},
    {
      withCredentials: true,
    },
  )

  if (!data.accessToken) {
    throw new Error('관리자 액세스 토큰 재발급에 실패했습니다.')
  }

  return data.accessToken
}
