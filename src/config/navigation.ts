import {
  ActivityIcon,
  ChartColumnIncreasingIcon,
  GaugeIcon,
  ListFilterIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  matchPaths: string[];
  disabled?: boolean;
  badge?: string;
};

export const adminNavigation: NavigationItem[] = [
  {
    href: "/admin/dashboard",
    icon: GaugeIcon,
    label: "Dashboard",
    description: "Foundation shell",
    matchPaths: ["/admin/dashboard"],
  },
  {
    href: "/admin/users",
    icon: UsersIcon,
    label: "Users",
    description: "Trusted workspace access",
    matchPaths: ["/admin/users"],
  },
  {
    href: "/admin/threat-events",
    icon: ShieldAlertIcon,
    label: "Threat Events",
    description: "Correlated detections",
    matchPaths: ["/admin/threat-events"],
  },
  {
    href: "/admin/logs",
    icon: ActivityIcon,
    label: "Logs",
    description: "Raw and normalized events",
    matchPaths: ["/admin/logs"],
  },
  {
    href: "/admin/indicators",
    icon: ListFilterIcon,
    label: "Indicators",
    description: "IoC management",
    matchPaths: ["/admin/indicators"],
  },
  {
    href: "/admin/analytics",
    icon: ChartColumnIncreasingIcon,
    label: "Analytics",
    description: "Correlations and trends",
    matchPaths: ["/admin/analytics"],
    disabled: true,
    badge: "Coming soon",
  },
  {
    href: "/admin/settings",
    icon: SlidersHorizontalIcon,
    label: "Settings",
    description: "Admin configuration",
    matchPaths: ["/admin/settings"],
    disabled: true,
    badge: "Coming soon",
  },
];
