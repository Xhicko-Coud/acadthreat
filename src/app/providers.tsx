"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({
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
    <ConvexProvider client={convex}>
      <TooltipProvider>{children}</TooltipProvider>
    </ConvexProvider>
  );
}
