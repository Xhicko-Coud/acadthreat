import { query } from "@convex/_generated/server";

export const getHealthStatus = query({
  args: {},
  handler: async () => {
    return {
      ok: true,
      service: "convex",
    };
  },
});
