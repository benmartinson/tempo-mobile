import { BACKEND_BASE_URL } from "./streaming_helpers";

/**
 * Fetch wrapper for backend API requests. The personal version sends no
 * auth token; the local backend treats every request as the one user.
 */
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);

  // Don't set Content-Type for FormData — let the runtime set the multipart boundary
  if (!(init?.body instanceof FormData)) {
    headers.set(
      "Content-Type",
      headers.get("Content-Type") ?? "application/json",
    );
  }

  const url = `${BACKEND_BASE_URL}${path}`;
  const method = init?.method ?? "GET";
  const startedAt = Date.now();
  if (__DEV__) {
    console.log(`[backend] -> ${method} ${url}`);
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });
    if (__DEV__) {
      console.log(
        `[backend] <- ${response.status} ${method} ${url} (${Date.now() - startedAt}ms)`,
      );
    }
    return response;
  } catch (err) {
    if (__DEV__) {
      console.warn(
        `[backend] x  ${method} ${url} failed after ${Date.now() - startedAt}ms:`,
        err,
      );
    }
    throw err;
  }
}
