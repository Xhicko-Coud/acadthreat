import {
  ActivityIcon,
  ChartColumnIncreasingIcon,
  GaugeIcon,
  ListFilterIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
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
    href: "/admin/threats",
    icon: ShieldAlertIcon,
    label: "Threats",
    description: "Investigation workspace",
    matchPaths: ["/admin/threats"],
    disabled: true,
    badge: "Coming soon",
  },
  {
    href: "/admin/logs",
    icon: ActivityIcon,
    label: "Logs",
    description: "Raw and normalized events",
    matchPaths: ["/admin/logs"],
    disabled: true,
    badge: "Coming soon",
  },
  {
    href: "/admin/indicators",
    icon: ListFilterIcon,
    label: "Indicators",
    description: "IoC management",
    matchPaths: ["/admin/indicators"],
    disabled: true,
    badge: "Coming soon",
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
