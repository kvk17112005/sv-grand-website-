import bcrypt from "bcryptjs";
import { config } from "../config.js";
import { pool } from "../db.js";
import { conflict, unauthorized } from "../lib/errors.js";

const PUBLIC_COLUMNS = `id, name, email, phone, role, created_at AS "createdAt"`;

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

export function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

export function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.sameSite,
  });
}

export async function registerUser({ name, email, phone, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_COLUMNS}`,
      [name, email.toLowerCase(), phone, passwordHash]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw conflict("An account already exists for that email.");
    }
    throw error;
  }
}

export async function authenticateUser(email, password) {
  const result = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash, status FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  const user = result.rows[0];
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!user || !passwordMatches) {
    throw unauthorized("Email or password is incorrect.");
  }
  if (user.status !== "active") {
    throw unauthorized("This account is not active. Please contact the hotel.");
  }

  await pool.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
  return publicUser(user);
}
