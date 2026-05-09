"use client";

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";

export const authClient = createAuthClient({
  plugins: [convexClient(), adminClient()],
});
