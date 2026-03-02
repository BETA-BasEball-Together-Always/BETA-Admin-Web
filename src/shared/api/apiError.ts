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

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message
    if (typeof message === 'string') {
      return {
        status: 'status' in error && typeof error.status === 'number' ? error.status : undefined,
        code: 'code' in error && typeof error.code === 'string' ? error.code : undefined,
        message,
        errors:
          'errors' in error && Array.isArray(error.errors)
            ? (error.errors as FieldError[])
            : undefined,
      }
    }
  }

  if (error instanceof Error && error.message) {
    return {
      message: error.message,
    }
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
  }
}
