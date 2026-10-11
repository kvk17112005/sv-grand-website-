function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  if (!configuredUrl) return "";

  const apiUrl = new URL(configuredUrl);
  const localHosts = ["localhost", "127.0.0.1"];
  if (
    import.meta.env.DEV &&
    localHosts.includes(apiUrl.hostname) &&
    localHosts.includes(window.location.hostname)
  ) {
    apiUrl.hostname = window.location.hostname;
  }

  return apiUrl.toString().replace(/\/+$/, "");
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new ApiError(
      "The account service is not configured. Set VITE_API_BASE_URL to your backend URL."
    );
  }

  const method = (options.method || "GET").toUpperCase();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    let csrfResponse;

    try {
      csrfResponse = await fetch(`${apiBaseUrl}/api/auth/csrf`, {
        credentials: "include",
      });
    } catch {
      throw new ApiError("Could not connect to the account service.");
    }

    const csrfPayload = await csrfResponse.json().catch(() => null);
    if (!csrfResponse.ok || !csrfPayload?.csrfToken) {
      throw new ApiError(
        csrfPayload?.message || "Could not start a secure account request.",
        csrfResponse.status
      );
    }

    headers["X-CSRF-Token"] = csrfPayload.csrfToken;
  }

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError("Could not connect to the account service.");
  }

  const payload =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message || `The request failed (${response.status}).`,
      response.status
    );
  }

  return payload;
}
