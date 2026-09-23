import { ApiError, isAbortError } from './ApiError';

export interface RequestOptions<T> {
  signal?: AbortSignal;
  timeoutMs?: number;
  parse: (data: unknown) => T;
  headers?: Record<string, string>;
}

// fetch wrapper: failures become ApiError, the body goes through `parse`. A caller-side abort
// is re-thrown as the original AbortError so it can be told apart from a failure.
export async function request<T>(url: string, options: RequestOptions<T>): Promise<T> {
  const { signal, timeoutMs, parse, headers } = options;

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true });
  }

  let timedOut = false;
  const timer =
    timeoutMs === undefined
      ? undefined
      : setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs);

  const classifyAbort = (error: unknown): never => {
    if (timedOut) {
      throw new ApiError('timeout', `Request to ${url} timed out after ${timeoutMs} ms`, {
        cause: error,
      });
    }
    throw error;
  };

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', ...headers },
      });
    } catch (error) {
      if (isAbortError(error)) classifyAbort(error);
      throw new ApiError('network', `Network request to ${url} failed`, { cause: error });
    }

    if (!response.ok) {
      throw new ApiError('http', `${response.status} ${response.statusText} for ${url}`, {
        status: response.status,
      });
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      if (isAbortError(error)) classifyAbort(error);
      throw new ApiError('parse', `Response from ${url} is not valid JSON`, { cause: error });
    }

    try {
      return parse(body);
    } catch (error) {
      throw new ApiError('parse', `Response from ${url} has an unexpected shape`, { cause: error });
    }
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
