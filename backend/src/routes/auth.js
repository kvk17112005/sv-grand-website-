import { Router } from "express";
import { csrfTokenFor, requireCsrf } from "../middleware/csrf.js";
import { authenticated } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { credentialsInput, registerInput } from "../lib/schemas.js";
import {
  authenticateUser,
  clearSessionCookie,
  destroySession,
  publicUser,
  regenerateSession,
  registerUser,
  saveSession,
} from "../services/auth.js";

const router = Router();

router.get("/csrf", (req, res) => {
  res.json({ csrfToken: csrfTokenFor(req) });
});

router.get("/session", (req, res, next) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }
  return authenticated(req, res, next);
}, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post("/register", authLimiter, requireCsrf, validateBody(registerInput), async (req, res) => {
  const user = await registerUser(req.body);
  await regenerateSession(req);
  req.session.userId = user.id;
  await saveSession(req);
  res.status(201).json({ user });
});

router.post("/login", authLimiter, requireCsrf, validateBody(credentialsInput), async (req, res) => {
  const user = await authenticateUser(req.body.email, req.body.password);
  await regenerateSession(req);
  req.session.userId = user.id;
  await saveSession(req);
  res.json({ user });
});

router.post("/logout", requireCsrf, async (req, res) => {
  await destroySession(req);
  clearSessionCookie(res);
  res.status(204).end();
});

export default router;
