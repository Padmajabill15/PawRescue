import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../models/User";

export interface TokenPayload {
  sub: string;
  role: Role;
  name: string;
  /** "socket" tokens are short-lived and only valid for the realtime connection */
  typ?: "session" | "socket";
}

export const AUTH_COOKIE = "token";

export function signToken(payload: TokenPayload, expiresIn = env.JWT_EXPIRES_IN): string {
  return jwt.sign({ typ: "session", ...payload }, env.JWT_SECRET, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
}

export function signSocketToken(p: Pick<TokenPayload, "sub" | "role" | "name">): string {
  return signToken({ ...p, typ: "socket" }, "5m");
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
