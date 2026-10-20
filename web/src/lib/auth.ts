export type Role = "user" | "ngo" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: Role;
  authProvider: "google" | "otp" | "password" | "guest";
  isEmergencyUser: boolean;
}

export const AUTH_COOKIE = "token";

export const dashboardPath = (role: Role) => `/dashboard/${role}`;

export function safeNext(next: string | null | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}
