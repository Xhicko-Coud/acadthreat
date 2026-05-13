"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { useState } from "react";

import { AuthBridgeProvider } from "@/components/providers/AuthBridgeProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { authClient } from "@/lib/auth-client";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthBridgeProvider>
      <NotificationProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </NotificationProvider>
    </AuthBridgeProvider>
  );
}

export function ProtectedProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [convex] = useState(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is required to initialize the Convex provider.",
      );
    }

    return new ConvexReactClient(convexUrl);
  });

  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
