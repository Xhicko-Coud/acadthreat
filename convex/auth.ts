import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth/minimal";
import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

import { components } from "@convex/_generated/api";
import type { DataModel } from "@convex/_generated/dataModel";
import authConfig from "@convex/auth.config";

export const authComponent = createClient<DataModel>(components.betterAuth);

function getAuthBaseUrl() {
  const value = process.env.BETTER_AUTH_URL;

  if (!value) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return value;
  }
}

export function createAuthOptions(ctx: GenericCtx<DataModel>) {
  return {
    appName: "AcadThreat",
    baseURL: getAuthBaseUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailVerification: {
      sendOnSignIn: false,
      sendOnSignUp: false,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      admin({
        adminRoles: ["admin"],
        defaultRole: "viewer",
        roles: {
          admin: adminAc,
          analyst: userAc,
          viewer: userAc,
        },
      }),
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions;
}

export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth(createAuthOptions(ctx));
}

export const { getAuthUser } = authComponent.clientApi();
