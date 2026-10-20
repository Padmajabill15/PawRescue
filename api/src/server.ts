import app from "./app";
import { connectDb, disconnectDb } from "./config/db";
import { env } from "./config/env";
import { ensureAdmin } from "./services/auth.service";

async function main() {
  await connectDb();
  await ensureAdmin();

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
