export function createClient(baseUrl) {
  const cookies = new Map();

  function cookieHeader() {
    return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  function storeCookies(response) {
    const setCookies = response.headers.getSetCookie?.() || [];
    for (const cookie of setCookies) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      if (index > 0) {
        cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
      }
    }
  }

  async function request(method, path, { body, csrf = false, headers = {} } = {}) {
    const finalHeaders = { ...headers };
    if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
    if (cookies.size > 0) finalHeaders.Cookie = cookieHeader();

    if (csrf) {
      const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
        headers: cookies.size > 0 ? { Cookie: cookieHeader() } : {},
      });
      storeCookies(csrfRes);
      const payload = await csrfRes.json();
      finalHeaders["X-CSRF-Token"] = payload.csrfToken;
      if (cookies.size > 0) finalHeaders.Cookie = cookieHeader();
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    storeCookies(response);

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return { status: response.status, data };
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, body, opts) => request("POST", path, { ...opts, body }),
    put: (path, body, opts) => request("PUT", path, { ...opts, body }),
    patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
    del: (path, opts) => request("DELETE", path, opts),
    cookies,
  };
}
