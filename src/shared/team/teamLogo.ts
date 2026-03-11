export const TEAM_CODES = [
  'DOOSAN',
  'HANWHA',
  'KIA',
  'KIWOOM',
  'KT',
  'LG',
  'LOTTE',
  'NC',
  'SAMSUNG',
  'SSG',
] as const

export type TeamCode = (typeof TEAM_CODES)[number]

const TEAM_LOGO_BASE_PATH = `${import.meta.env.BASE_URL}team-logos/`

export const TEAM_LOGO_BY_CODE: Record<TeamCode, string> = {
  DOOSAN: `${TEAM_LOGO_BASE_PATH}DOOSAN.svg`,
  HANWHA: `${TEAM_LOGO_BASE_PATH}HANWHA.svg`,
  KIA: `${TEAM_LOGO_BASE_PATH}KIA.svg`,
  KIWOOM: `${TEAM_LOGO_BASE_PATH}KIWOOM.svg`,
  KT: `${TEAM_LOGO_BASE_PATH}KT.svg`,
  LG: `${TEAM_LOGO_BASE_PATH}LG.svg`,
  LOTTE: `${TEAM_LOGO_BASE_PATH}LOTTE.svg`,
  NC: `${TEAM_LOGO_BASE_PATH}NC.svg`,
  SAMSUNG: `${TEAM_LOGO_BASE_PATH}SAMSUNG.svg`,
  SSG: `${TEAM_LOGO_BASE_PATH}SSG.svg`,
}

export function isTeamCode(value: string): value is TeamCode {
  return TEAM_CODES.includes(value as TeamCode)
}

export function getTeamLogoByCode(code: string): string | null {
  if (!isTeamCode(code)) {
    return null
  }

  return TEAM_LOGO_BY_CODE[code]
}
