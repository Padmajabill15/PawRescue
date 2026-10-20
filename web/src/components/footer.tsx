import { PawPrint } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <PawPrint className="h-4 w-4" />
            </span>
            PawRescue
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Connecting people who find injured animals with verified rescue NGOs nearby, fast.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/sos" className="hover:text-foreground">Report an animal</Link></li>
            <li><Link href="/ngos" className="hover:text-foreground">Join as NGO</Link></li>
            <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PawRescue. All rights reserved.
      </div>
    </footer>
  );
}
