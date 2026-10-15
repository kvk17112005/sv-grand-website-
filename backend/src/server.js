import { createApp } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

const app = createApp();

try {
  await pool.query("SELECT 1");
  app.listen(config.port, () => {
    console.info(`SV Grand API listening on port ${config.port}.`);
  });
} catch (error) {
  console.error("Could not connect to the database:", error.message);
  process.exitCode = 1;
}
