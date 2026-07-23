// Reconstructed orval fetch mutator for @workspace/api-client-react.
//
// The generated React Query hooks call `customFetch<T>(url, options)` and expect
// the parsed response body back (orval config sets includeHttpResponseReturnType: false).
//
// Conventions mirrored from the app's hand-written fetch calls:
//   - API is served at `/api/...`; generated URLs already include that prefix.
//   - Auth is a Clerk session bearer token, read from `window.Clerk.session.getToken()`.
//   - JSON in / JSON out; 204 / empty bodies resolve to `undefined`.

type ClerkGlobal = {
  session?: { getToken: () => Promise<string | null> };
};

async function getAuthToken(): Promise<string | null> {
  try {
    const clerk = (globalThis as unknown as { Clerk?: ClerkGlobal }).Clerk;
    if (!clerk?.session) return null;
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, statusText: string, body: unknown) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export const customFetch = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(options.headers);

  // Only set JSON content-type when we're sending a plain (non-FormData) body.
  const hasBody = options.body != null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = await getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  const contentType = response.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("application/json");

  let payload: unknown = undefined;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      payload = isJson ? JSON.parse(text) : text;
    }
  }

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText, payload);
  }

  return payload as T;
};

export default customFetch;
