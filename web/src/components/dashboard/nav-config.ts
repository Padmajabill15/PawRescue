import {
  BarChart3,
  Building2,
  ClipboardList,
  FileWarning,
  HeartPulse,
  LayoutDashboard,
  Map,
  PlusCircle,
  Settings,
  ShieldCheck,
  Table2,
  UserRound,
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
    { href: "/dashboard/user/ngos", label: "Verified NGOs", icon: Building2 },
    { href: "/dashboard/user/profile", label: "My profile", icon: UserRound },
  ],
  ngo: [
    { href: "/dashboard/ngo", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/ngo/requests", label: "Incoming requests", icon: Map },
    { href: "/dashboard/ngo/cases", label: "My cases", icon: HeartPulse },
    { href: "/dashboard/ngo/settings", label: "NGO details", icon: Settings },
    { href: "/dashboard/ngo/profile", label: "My account", icon: UserRound },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/ngos", label: "NGO approvals", icon: ShieldCheck },
    { href: "/dashboard/admin/requests", label: "All requests", icon: FileWarning },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/data", label: "Data sheets", icon: Table2 },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/admin/profile", label: "My account", icon: UserRound },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { user: "Reporter", ngo: "NGO", admin: "Admin" };
