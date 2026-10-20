import {
  Building2,
  ClipboardList,
  FileWarning,
  HeartPulse,
  LayoutDashboard,
  Map,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

export const NAV: Record<Role, NavItem[]> = {
  user: [
    { href: "/dashboard/user", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/user/report", label: "Report a rescue", icon: PlusCircle },
    { href: "/dashboard/user/reports", label: "My reports", icon: ClipboardList },
  ],
  ngo: [
    { href: "/dashboard/ngo", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/ngo/requests", label: "Incoming requests", icon: Map },
    { href: "/dashboard/ngo/cases", label: "My cases", icon: HeartPulse },
    { href: "/dashboard/ngo/settings", label: "NGO profile", icon: Settings, soon: true },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/ngos", label: "NGO approvals", icon: ShieldCheck },
    { href: "/dashboard/admin/requests", label: "All requests", icon: FileWarning },
    { href: "/dashboard/admin/users", label: "Users", icon: Users, soon: true },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: Building2, soon: true },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { user: "Reporter", ngo: "NGO", admin: "Admin" };
