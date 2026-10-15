import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { authenticated } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { validateBody } from "../middleware/validate.js";
import { passwordChangeInput, profileInput } from "../lib/schemas.js";
import { badRequest, notFound } from "../lib/errors.js";
import { publicUser } from "../services/auth.js";

const router = Router();

router.use(requireCsrf, authenticated);

router.put("/profile", validateBody(profileInput), async (req, res) => {
  const result = await pool.query(
    `UPDATE users
        SET name = $1, phone = $2, updated_at = now()
      WHERE id = $3
      RETURNING id, name, email, phone, role, created_at AS "createdAt"`,
    [req.body.name, req.body.phone, req.user.id]
  );
  res.json({ user: publicUser(result.rows[0]) });
});

router.put("/password", validateBody(passwordChangeInput), async (req, res) => {
  const result = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
  const user = result.rows[0];
  if (!user) throw notFound("User not found.");

  const matches = await bcrypt.compare(req.body.currentPassword, user.password_hash);
  if (!matches) throw badRequest("Current password is incorrect.");

  const newHash = await bcrypt.hash(req.body.newPassword, 12);
  await pool.query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
    newHash,
    req.user.id,
  ]);
  res.json({ message: "Password updated successfully." });
});

export default router;
