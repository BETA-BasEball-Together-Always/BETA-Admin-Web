const KAKAO_OAUTH_STATE_STORAGE_KEY = 'kakao_oauth_state'
let inMemoryAccessToken: string | null = null

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

export function hasAccessToken(): boolean {
  return Boolean(inMemoryAccessToken)
}

export function setAccessToken(accessToken: string): void {
  inMemoryAccessToken = accessToken
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null
}

export function createOauthState(): string {
  if (isBrowser() && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16)
    window.crypto.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function saveKakaoOauthState(state: string): void {
  if (!isBrowser()) {
    return
  }
  window.sessionStorage.setItem(KAKAO_OAUTH_STATE_STORAGE_KEY, state)
}

export function consumeKakaoOauthState(): string | null {
  if (!isBrowser()) {
    return null
  }

  const state = window.sessionStorage.getItem(KAKAO_OAUTH_STATE_STORAGE_KEY)
  window.sessionStorage.removeItem(KAKAO_OAUTH_STATE_STORAGE_KEY)
  return state
}
