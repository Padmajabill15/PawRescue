import { jwtVerify } from "jose";
import type { Role } from "./auth";

export interface TokenClaims {
  sub: string;
  role: Role;
  name: string;
}

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "");

export async function readToken(token: string | undefined): Promise<TokenClaims | null> {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const { sub, role, name } = payload as Partial<TokenClaims>;
    if (!sub || !role) return null;
    return { sub, role, name: name ?? "" };
  } catch {
    return null;
  }
}
