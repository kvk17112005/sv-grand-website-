// Runs the Node test runner with DATABASE_URL forced to the isolated test DB.
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL_TEST) {
  console.error("DATABASE_URL_TEST must be set in backend/.env to run tests.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--test", "--test-concurrency=1", "test/**/*.test.js"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL_TEST,
      NODE_ENV: "test",
    },
  }
);

process.exit(result.status ?? 1);
