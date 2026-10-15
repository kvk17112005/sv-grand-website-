import { randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";
import { forbidden } from "../lib/errors.js";

export function csrfTokenFor(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = randomBytes(32).toString("hex");
  }
  return req.session.csrfToken;
}

export function requireCsrf(req, res, next) {
  const sentToken = req.get(config.csrfHeader) || "";
  const sessionToken = req.session.csrfToken || "";
  const sent = Buffer.from(sentToken);
  const expected = Buffer.from(sessionToken);

  if (sent.length !== expected.length || sent.length === 0 || !timingSafeEqual(sent, expected)) {
    return next(forbidden("Your security token expired. Please retry."));
  }

  return next();
}
