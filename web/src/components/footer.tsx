import { PawPrint } from "lucide-react";
import Link from "next/link";

const COLS = [
  { title: "Get help", links: [["/sos", "Emergency SOS"], ["/report", "Report a case"], ["/dashboard/user/reports", "Track my reports"]] },
  { title: "For NGOs", links: [["/ngo/apply", "Apply as an NGO"], ["/login", "NGO sign in"]] },
  { title: "Project", links: [["https://github.com/Padmajabill15/PawRescue", "Source on GitHub"], ["/#how-it-works", "How it works"]] },
];

export function Footer() {
  return (
    <footer className="dark border-t bg-background text-foreground">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <PawPrint className="h-5 w-5 text-accent" /> PawRescue
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Connecting people who find injured animals with verified rescue NGOs nearby.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">If an animal is on a busy road, alert traffic first and keep a safe distance.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-foreground" {...(href.startsWith("http") && { target: "_blank", rel: "noreferrer" })}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} PawRescue</div>
    </footer>
  );
}
