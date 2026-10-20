import app from "./app";
import { connectDb, disconnectDb } from "./config/db";
import { env } from "./config/env";
import { User } from "./models/User";
import { ensureAdmin } from "./services/auth.service";
import { startEscalationJob } from "./services/escalation.service";
import { initRealtime } from "./services/realtime";

async function main() {
  await connectDb();
  await User.syncIndexes(); // apply index changes (e.g. phone no longer unique)
  await ensureAdmin();

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
  initRealtime(server);
  startEscalationJob();

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
