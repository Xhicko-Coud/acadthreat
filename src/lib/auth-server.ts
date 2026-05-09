import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for authentication.`);
  }

  return value;
}

export const {
  fetchAuthAction,
  fetchAuthMutation,
  fetchAuthQuery,
  getToken,
  handler: authHandler,
  isAuthenticated,
  preloadAuthQuery,
} = convexBetterAuthNextJs({
  convexSiteUrl: getRequiredEnv("NEXT_PUBLIC_CONVEX_SITE_URL"),
  convexUrl: getRequiredEnv("NEXT_PUBLIC_CONVEX_URL"),
});
