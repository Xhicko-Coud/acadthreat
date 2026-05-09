"use client";

import {
  BadgeCheckIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import type { UserProfileRole, UserProfileStatus } from "@convex/auth/authorization";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { adminNavigation } from "@/config/navigation";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppHeader({
  profile,
}: {
  profile: {
    email: string;
    name: string | null;
    role: UserProfileRole;
    status: UserProfileStatus;
  };
}) {
  const pathname = usePathname();
  const activeItem =
    adminNavigation.find((item) =>
      item.matchPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      ),
    ) ?? adminNavigation[0];

  return (
    <header className="sticky top-0 z-20 border-b border-primary/10 bg-background/92 shadow-sm shadow-primary/5 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="cursor-pointer text-primary hover:bg-primary/5 hover:text-primary focus-visible:ring-primary/20" />
            </TooltipTrigger>
            <TooltipContent>
              <span>Toggle sidebar</span>
            </TooltipContent>
          </Tooltip>
          <Separator className="mr-2 mt-2 h-4 self-center" orientation="vertical" />
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbPage className="text-sm text-muted-foreground">
                  Admin
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-muted-foreground/70" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate text-sm font-medium text-primary">
                  {activeItem.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Open account menu"
              className="cursor-pointer rounded-full p-1 transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              type="button"
            >
              <Avatar className="bg-primary text-primary-foreground" size="lg">
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  {getUserInitials(profile.name, profile.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {profile.name || "AcadThreat User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.email}
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <BadgeCheckIcon className="size-4" />
              {getRoleLabel(profile.role)}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Profile details coming soon</DropdownMenuItem>
            <SignOutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function getRoleLabel(role: UserProfileRole) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "analyst") {
    return "Analyst";
  }

  return "Viewer";
}

function getUserInitials(name: string | null, email: string) {
  const source = name?.trim() || email.split("@")[0] || "AT";
  const parts = source.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "AT";
}
