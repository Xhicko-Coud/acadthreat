import { query } from "@convex/_generated/server";
import { getCurrentAuthUser } from "@convex/auth/authorization";

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentAuthUser(ctx);

    if (!user) {
      return { status: "unauthenticated" } as const;
    }

    const actorProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", user._id))
      .unique();

    if (!actorProfile || actorProfile.status !== "active" || actorProfile.role !== "admin") {
      return { status: "forbidden" } as const;
    }

    const profiles = await ctx.db.query("userProfiles").collect();
    const users = profiles
      .slice()
      .sort((first, second) => second.createdAt - first.createdAt)
      .map((profile) => ({
        _id: profile._id,
        createdAt: profile.createdAt,
        email: profile.email,
        name: profile.name ?? null,
        role: profile.role,
        status: profile.status,
        userId: profile.userId,
      }));

    return {
      status: "success",
      users,
    } as const;
  },
});

export const getCurrentUserManagementContext = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentAuthUser(ctx);

    if (!user) {
      return { status: "unauthenticated" } as const;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", user._id))
      .unique();

    if (!profile || profile.status !== "active" || profile.role !== "admin") {
      return { status: "forbidden" } as const;
    }

    return {
      status: "success",
      context: {
        canCreateUsers: true,
        canDeactivateUsers: true,
        canReactivateUsers: true,
        email: profile.email,
        name: profile.name ?? null,
        role: profile.role,
        status: profile.status,
        userId: profile.userId,
      },
    } as const;
  },
});
