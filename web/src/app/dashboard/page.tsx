import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, dashboardPath } from "@/lib/auth";
import { readToken } from "@/lib/jwt";

export default async function DashboardIndex() {
  const claims = await readToken((await cookies()).get(AUTH_COOKIE)?.value);
  redirect(claims ? dashboardPath(claims.role) : "/login");
}
