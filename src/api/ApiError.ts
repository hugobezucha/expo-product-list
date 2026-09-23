export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;

  constructor(kind: ApiErrorKind, message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options?.status;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new ApiError('network', message, { cause: error });
}

export function describeApiError(error: ApiError): string {
  switch (error.kind) {
    case 'network':
      return 'Nepodařilo se spojit se serverem. Zkontrolujte připojení k internetu.';
    case 'timeout':
      return 'Server neodpověděl včas.';
    case 'http':
      return error.status === 404
        ? 'Požadovaná data neexistují.'
        : `Server vrátil chybu${error.status === undefined ? '' : ` (${error.status})`}.`;
    case 'parse':
      return 'Server vrátil data v neočekávaném formátu.';
  }
}
