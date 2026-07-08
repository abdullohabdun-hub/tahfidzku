// src/lib/errors.ts
// Custom error classes — TIDAK pernah melempar pesan teknis ke frontend

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: Array<{ field: string; message: string }>,
  ) {
    super('VALIDATION_ERROR', 400, message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Anda harus login terlebih dahulu') {
    super('UNAUTHENTICATED', 401, message)
    this.name = 'AuthenticationError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki akses ke fitur ini') {
    super('FORBIDDEN', 403, message)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Data') {
    super('NOT_FOUND', 404, `${resource} tidak ditemukan`)
    this.name = 'NotFoundError'
  }
}

export class TenantMismatchError extends AppError {
  constructor() {
    super('TENANT_MISMATCH', 403, 'Anda tidak memiliki akses ke data lembaga ini')
    this.name = 'TenantMismatchError'
  }
}
