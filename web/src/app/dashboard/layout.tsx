import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AUTH_COOKIE } from "@/lib/auth";
import { readToken } from "@/lib/jwt";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const claims = await readToken((await cookies()).get(AUTH_COOKIE)?.value);
  if (!claims) redirect("/login");

  return (
    <div className="container grid grid-cols-[minmax(0,1fr)] gap-6 py-6 md:grid-cols-[220px_minmax(0,1fr)] md:py-10">
      <aside className="min-w-0 md:sticky md:top-24 md:self-start">
        <Sidebar role={claims.role} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
