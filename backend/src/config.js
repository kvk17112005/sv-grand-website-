const isProduction = process.env.NODE_ENV === "production";

const frontendOrigin = process.env.FRONTEND_ORIGIN;
const sessionSecret = process.env.SESSION_SECRET;
const sameSite = process.env.COOKIE_SAME_SITE || "lax";
const port = Number(process.env.PORT || 3001);

if (!frontendOrigin) {
  throw new Error("FRONTEND_ORIGIN must be set to the deployed frontend origin.");
}

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters.");
}

if (!["lax", "none"].includes(sameSite)) {
  throw new Error("COOKIE_SAME_SITE must be either lax or none.");
}

if (sameSite === "none" && !isProduction) {
  throw new Error("SameSite=None cookies require NODE_ENV=production and HTTPS.");
}

const allowedOrigins = new Set([frontendOrigin]);
if (!isProduction) {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://127.0.0.1:5173");
}

export const config = {
  isProduction,
  frontendOrigin,
  sessionSecret,
  sameSite,
  port,
  allowedOrigins,
  cookieName: "svgrand.sid",
  sessionMaxAgeMs: 14 * 24 * 60 * 60 * 1000,
  csrfHeader: "X-CSRF-Token",
};
