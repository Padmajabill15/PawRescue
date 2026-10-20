import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { RealtimeProvider } from "@/components/realtime-provider";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const body = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  title: "PawRescue – Animal Rescue Platform",
  description:
    "Report injured animals with photos and GPS. The nearest verified NGOs rescue, treat, and keep you updated.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${body.variable} ${display.variable} font-sans min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <RealtimeProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster richColors closeButton position="top-right" />
            </RealtimeProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
