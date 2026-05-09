"use node";

import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";

import { components, internal } from "@convex/_generated/api";
import type { DataModel } from "@convex/_generated/dataModel";
import { action } from "@convex/_generated/server";
import { USER_PROFILE_ROLES } from "@convex/auth/authorization";
import { createAuth, authComponent } from "@convex/auth";

type CreateTrustedUserActionCtx = GenericActionCtx<DataModel>;

export const createTrustedUser = action({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    role: v.union(
      v.literal(USER_PROFILE_ROLES.admin),
      v.literal(USER_PROFILE_ROLES.analyst),
      v.literal(USER_PROFILE_ROLES.viewer),
    ),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.name.trim();
    const normalizedEmail = args.email.trim().toLowerCase();
    const normalizedPassword = args.password.trim();

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return { status: "invalid_input" } as const;
    }

    if (args.role === USER_PROFILE_ROLES.admin) {
      return { status: "unsupported_role_creation" } as const;
    }

    const actor = await getCurrentAuthUser(ctx);

    if (!actor) {
      return { status: "unauthenticated" } as const;
    }

    const access = await ctx.runQuery(
      internal.users.createTrustedUserInternal.getTrustedUserCreationAccess,
      { userId: actor._id },
    );

    if (access.status !== "allowed") {
      return { status: "forbidden" } as const;
    }

    const existingProfile = await ctx.runQuery(
      internal.users.createTrustedUserInternal.getUserProfileByEmail,
      { email: normalizedEmail },
    );

    if (existingProfile) {
      return { status: "duplicate_email" } as const;
    }

    const existingAuthUser = await findAuthUserByEmail(ctx, normalizedEmail);

    if (existingAuthUser) {
      return { status: "duplicate_email" } as const;
    }

    try {
      const userId = await createAuthUser(
        ctx,
        normalizedEmail,
        normalizedName,
        normalizedPassword,
      );

      const profileResult = await ctx.runMutation(
        internal.users.createTrustedUserInternal.createTrustedUserProfile,
        {
          email: normalizedEmail,
          name: normalizedName,
          role: args.role,
          userId,
        },
      );

      if (profileResult.status !== "created") {
        if (profileResult.status === "unsupported_role_creation") {
          return { status: "unsupported_role_creation" } as const;
        }

        return { status: "duplicate_email" } as const;
      }

      return { status: "created" } as const;
    } catch (error) {
      if (isDuplicateAuthError(error)) {
        return { status: "duplicate_email" } as const;
      }

      return { status: "failed" } as const;
    }
  },
});

async function getCurrentAuthUser(ctx: CreateTrustedUserActionCtx) {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
}

async function findAuthUserByEmail(
  ctx: CreateTrustedUserActionCtx,
  email: string,
) {
  return await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [
      {
        field: "email",
        operator: "eq",
        value: email,
      },
    ],
  });
}

async function createAuthUser(
  ctx: CreateTrustedUserActionCtx,
  email: string,
  name: string,
  password: string,
) {
  const auth = createAuth(ctx);
  const result = await auth.api.signUpEmail({
    body: {
      email,
      name,
      password,
    },
  });

  return result.user.id;
}

function isDuplicateAuthError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("already")
  );
}
