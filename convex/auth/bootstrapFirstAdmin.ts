"use node";

import { timingSafeEqual } from "node:crypto";

import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";

import { components, internal } from "@convex/_generated/api";
import type { DataModel } from "@convex/_generated/dataModel";
import { action } from "@convex/_generated/server";
import { createAuth } from "@convex/auth";

type BootstrapActionCtx = GenericActionCtx<DataModel>;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error("Required bootstrap configuration is missing.");
  }

  return value;
}

function isValidSeedKey(inputSeedKey: string, expectedSeedKey: string) {
  const inputBuffer = Buffer.from(inputSeedKey, "utf8");
  const expectedBuffer = Buffer.from(expectedSeedKey, "utf8");

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}

async function findAuthUserByEmail(ctx: BootstrapActionCtx, email: string) {
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

async function findCredentialAccountByUserId(
  ctx: BootstrapActionCtx,
  userId: string,
) {
  return await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "account",
    where: [
      {
        field: "providerId",
        operator: "eq",
        value: "credential",
      },
      {
        connector: "AND",
        field: "userId",
        operator: "eq",
        value: userId,
      },
    ],
  });
}

export const bootstrapFirstAdmin = action({
  args: {
    seedKey: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedSeedKey = args.seedKey.trim();

    if (!normalizedSeedKey) {
      return { status: "invalid_seed_key" } as const;
    }

    const expectedSeedKey = getRequiredEnv("ADMIN_SEED_KEY");

    if (!isValidSeedKey(normalizedSeedKey, expectedSeedKey)) {
      return { status: "invalid_seed_key" } as const;
    }

    const name = getRequiredEnv("ADMIN_NAME");
    const email = getRequiredEnv("ADMIN_EMAIL");
    const password = getRequiredEnv("ADMIN_PASSWORD");
    const existingProfile = await ctx.runQuery(
      internal.auth.bootstrapFirstAdminInternal.getAdminProfileByEmail,
      { email },
    );
    const hasAnyAdmin = await ctx.runQuery(
      internal.auth.bootstrapFirstAdminInternal.hasAdminProfile,
    );

    const existingAuthUser = await findAuthUserByEmail(ctx, email);
    const credentialAccount = existingAuthUser
      ? await findCredentialAccountByUserId(ctx, existingAuthUser._id)
      : null;

    if (hasAnyAdmin && !existingProfile) {
      return { status: "already_exists" } as const;
    }

    if (existingAuthUser && existingProfile) {
      if (!credentialAccount?.password) {
        return { status: "blocked_repair_needed" } as const;
      }

      if (existingProfile.userId === existingAuthUser._id) {
        return { status: "already_exists" } as const;
      }

      await ctx.runMutation(
        internal.auth.bootstrapFirstAdminInternal.updateAdminProfileUserId,
        {
          profileId: existingProfile._id,
          userId: existingAuthUser._id,
        },
      );

      return {
        status: "profile_repaired_existing_auth_user",
        authUserCreated: false,
        profileCreated: false,
      } as const;
    }

    if (existingAuthUser && !existingProfile) {
      const profileResult = await ctx.runMutation(
        internal.auth.bootstrapFirstAdminInternal.createAdminProfile,
        {
          email,
          name,
          userId: existingAuthUser._id,
        },
      );

      if (profileResult.status === "profile_exists") {
        return { status: "already_exists" } as const;
      }

      return {
        status: "profile_created_existing_auth_user",
        authUserCreated: false,
        profileCreated: true,
      } as const;
    }

    const userId = await createAuthUser(ctx, email, name, password);

    if (existingProfile) {
      await ctx.runMutation(
        internal.auth.bootstrapFirstAdminInternal.updateAdminProfileUserId,
        {
          profileId: existingProfile._id,
          userId,
        },
      );

      return {
        status: "auth_user_created_existing_profile",
        authUserCreated: true,
        profileCreated: false,
      } as const;
    }

    const profileResult = await ctx.runMutation(
      internal.auth.bootstrapFirstAdminInternal.createAdminProfile,
      {
        email,
        name,
        userId,
      },
    );

    if (profileResult.status === "profile_exists") {
      return { status: "already_exists" } as const;
    }

    return {
      status: "created",
      authUserCreated: true,
      profileCreated: true,
    } as const;
  },
});

async function createAuthUser(
  ctx: BootstrapActionCtx,
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
