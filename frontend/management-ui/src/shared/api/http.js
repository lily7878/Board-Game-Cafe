/**
 * Thin fetch wrapper for the Core REST API (proxied by Vite at /api).
 *
 * Rules from the FE spec (§10):
 *  - Mutations are NEVER retried automatically (timeout / 5xx surface as errors).
 *  - 401 -> local identity is cleared (handled by StaffAuthContext via onUnauthorized).
 *  - 429 -> error carries `retryAfter` (seconds) so the UI can respect it.
 *  - Errors from Core are Spring ProblemDetail: { status, title, detail }.
 */

const DEFAULT_TIMEOUT_MS = 15000;

let tokenProvider = () => null;
let unauthorizedHandler = () => {};

/** Called once by StaffAuthContext so every request carries the JWT. */
export function configureHttp({ getToken, onUnauthorized }) {
  tokenProvider = getToken;
  unauthorizedHandler = onUnauthorized;
}

export class ApiError extends Error {
  /**
   * kind: 'http' (Core answered with an error status) |
   *       'timeout' (no answer in time — outcome UNKNOWN for mutations) |
   *       'network' (request never reached Core)
   */
  constructor({ kind, status = null, detail, retryAfter = null }) {
    super(detail);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
    this.retryAfter = retryAfter;
  }

  get isConflict() { return this.status === 409; }
  get isValidation() { return this.status === 400; }
  /** Outcome unknown: the server may or may not have applied the change. */
  get isUncertain() { return this.kind === 'timeout' || (this.status ?? 0) >= 500; }
}

export async function apiRequest(path, { method = 'GET', body, signal, timeoutMs = DEFAULT_TIMEOUT_MS, auth = true } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  // Caller abort (e.g. component unmounted) is forwarded to our controller.
  const onCallerAbort = () => controller.abort('caller');
  signal?.addEventListener('abort', onCallerAbort);

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? tokenProvider() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.reason === 'caller') throw err; // AbortError, ignored by hooks
    if (controller.signal.reason === 'timeout') {
      throw new ApiError({ kind: 'timeout', detail: 'Serverul nu a răspuns la timp.' });
    }
    throw new ApiError({ kind: 'network', detail: 'Nu ne-am putut conecta la server.' });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  if (response.status === 204) return null;

  const isJson = response.headers.get('content-type')?.includes('json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (response.ok) return payload;

  if (response.status === 401 && auth) unauthorizedHandler();

  throw new ApiError({
    kind: 'http',
    status: response.status,
    detail: payload?.detail || payload?.title || defaultMessage(response.status),
    retryAfter: Number(response.headers.get('retry-after')) || null,
  });
}

function defaultMessage(status) {
  if (status === 401) return 'Sesiunea a expirat. Autentifică-te din nou.';
  if (status === 403) return 'Nu ai acces la această acțiune.';
  if (status === 404) return 'Resursa nu a fost găsită.';
  if (status === 409) return 'Datele s-au schimbat între timp. Am reîncărcat starea curentă.';
  if (status === 429) return 'Prea multe cereri. Încearcă din nou în câteva secunde.';
  if (status >= 500) return 'A apărut o eroare pe server.';
  return 'Cererea nu a putut fi procesată.';
}
