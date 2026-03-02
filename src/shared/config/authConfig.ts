export type KakaoOauthConfig = {
  restApiKey: string
  redirectUri: string
}

export function getKakaoOauthConfig(): KakaoOauthConfig | null {
  const restApiKey = (import.meta.env.VITE_KAKAO_REST_API_KEY ?? '').trim()
  const redirectUri = (import.meta.env.VITE_KAKAO_REDIRECT_URI ?? '').trim()

  if (!restApiKey || !redirectUri) {
    return null
  }

  return {
    restApiKey,
    redirectUri,
  }
}
