import mongoose from "mongoose";

const DB_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export function getHealth() {
  return {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: DB_STATES[mongoose.connection.readyState] ?? "unknown",
  };
}
