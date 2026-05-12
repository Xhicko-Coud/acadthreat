"use client";

import { useQuery } from "convex/react";

import { api } from "@convex/_generated/api";

import { LogsSkeleton } from "./LogsSkeleton";
import { LogsView } from "./LogsView";

export function LogsContainer() {
  const contextResult = useQuery(api.queries.logs.getLogIngestionContext);

  const isInitialLoading = contextResult === undefined;

  if (isInitialLoading) {
    return <LogsSkeleton />;
  }

  const hasAccess = contextResult.status === "success";
  const capabilities = hasAccess ? contextResult.capabilities : null;

  return <LogsView capabilities={capabilities} hasAccess={hasAccess} />;
}
