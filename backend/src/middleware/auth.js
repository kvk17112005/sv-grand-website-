import { pool } from "../db.js";
import { forbidden, unauthorized } from "../lib/errors.js";

const USER_COLUMNS = `id, name, email, phone, role, created_at AS "createdAt"`;

export async function loadUserById(userId) {
  const result = await pool.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 AND status = 'active'`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function authenticated(req, res, next) {
  if (!req.session.userId) {
    return next(unauthorized());
  }

  try {
    const user = await loadUserById(req.session.userId);
    if (!user) {
      return req.session.destroy(() => {
        res.clearCookie("svgrand.sid");
        return next(unauthorized("Your session is no longer valid."));
      });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function optionalAuth(req, res, next) {
  req.user = null;
  if (!req.session.userId) {
    return next();
  }
  try {
    req.user = await loadUserById(req.session.userId);
  } catch {
    req.user = null;
  }
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden("You do not have permission to view this data."));
    }
    return next();
  };
}
