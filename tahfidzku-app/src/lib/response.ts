// src/lib/response.ts
// Standardisasi format response — konsisten di seluruh server functions

// ── Response Sukses ──────────────────────────────────
export type ApiSuccess<T> = {
  success: true
  data: T
  message: string
}

export function success<T>(data: T, message: string): ApiSuccess<T> {
  return { success: true, data, message }
}

// ── Response Error ───────────────────────────────────
export type ApiErrorDetail = {
  field: string
  message: string
}

export type ApiError = {
  success: false
  error: {
    code: string
    message: string
    details?: ApiErrorDetail[]
  }
}

export function error(
  code: string,
  message: string,
  details?: ApiErrorDetail[],
): ApiError {
  return {
    success: false,
    error: { code, message, details },
  }
}

// ── Tipe Gabungan ────────────────────────────────────
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── Helper: Tangkap error apapun, kembalikan format standar ──
export function handleError(err: unknown): ApiError {
  // Jangan pernah melempar error mentah ke frontend
  console.error('[ServerError]', err)

  if (err instanceof Error && 'code' in err) {
    const appErr = err as Error & { code: string; details?: ApiErrorDetail[] }
    return error(appErr.code, appErr.message, appErr.details)
  }

  // Fallback: error generik
  return error(
    'INTERNAL_ERROR',
    'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  )
}
