export function notFoundHandler(_req, res) {
  res.status(404).json({ message: "Not found." });
}

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;

  const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;

  if (status >= 500) {
    console.error("API request failed:", error.message);
  }

  const body = { message: status >= 500 ? "The server could not complete that request." : error.message };
  if (error.details) body.details = error.details;
  return res.status(status).json(body);
}
