import type { CSSProperties } from "react";

import type { UserProfileRole, UserProfileStatus } from "@convex/auth/authorization";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

export function AppShell({
  children,
  profile,
}: Readonly<{
  children: React.ReactNode;
  profile: {
    email: string;
    name: string | null;
    role: UserProfileRole;
    status: UserProfileStatus;
  };
}>) {
  return (
    <SidebarProvider
      className="bg-[color:oklch(0.98_0.01_145)] text-foreground"
      defaultOpen
      style={
        {
          "--sidebar-width": "20rem",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-h-screen bg-[color:oklch(0.98_0.01_145)]">
        <AppHeader profile={profile} />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
