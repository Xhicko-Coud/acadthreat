import { v } from "convex/values";

import type { Id } from "@convex/_generated/dataModel";
import { internalQuery } from "@convex/_generated/server";

const MAX_RECENT_EVENTS = 100;

export const listRecentNormalizedEventsInternal = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args): Promise<{ id: Id<"normalizedEvents"> }[]> => {
    const limit = Math.min(
      Math.max(Math.floor(args.limit), 0),
      MAX_RECENT_EVENTS,
    );

    if (limit === 0) {
      return [];
    }

    const events = await ctx.db
      .query("normalizedEvents")
      .withIndex("by_eventTimestamp")
      .order("desc")
      .take(limit);

    return events.map((event) => ({
      id: event._id,
    }));
  },
});
