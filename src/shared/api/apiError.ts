import axios from 'axios'

type FieldError = {
  field: string
  message: string
  rejectedValue?: unknown
}

type ErrorResponse = {
  code?: string
  message?: string
  errors?: FieldError[]
}

export type ApiError = {
  status?: number
  code?: string
  message: string
  errors?: FieldError[]
}

const DEFAULT_ERROR_MESSAGE = '요청 처리 중 오류가 발생했습니다.'

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return {
      status: error.response?.status,
      code: error.response?.data?.code,
      message: error.response?.data?.message ?? DEFAULT_ERROR_MESSAGE,
      errors: error.response?.data?.errors,
    }
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
  }
}

