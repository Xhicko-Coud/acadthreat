"use client";

import { useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { UsersSkeleton } from "./UsersSkeleton";
import { UsersView } from "./UsersView";

export function UsersContainer() {
  const usersResult = useQuery(api.queries.userManagementApi.listUsers);
  const contextResult = useQuery(
    api.queries.userManagementApi.getCurrentUserManagementContext,
  );

  if (usersResult === undefined || contextResult === undefined) {
    return <UsersSkeleton />;
  }

  if (usersResult.status !== "success" || contextResult.status !== "success") {
    return (
      <UsersView
        activeUsers={0}
        hasAccess={false}
        inactiveUsers={0}
        totalUsers={0}
      />
    );
  }

  const totalUsers = usersResult.users.length;
  const activeUsers = usersResult.users.filter(
    (user) => user.status === "active",
  ).length;
  const inactiveUsers = usersResult.users.filter(
    (user) => user.status === "inactive",
  ).length;

  return (
    <UsersView
      activeUsers={activeUsers}
      hasAccess={contextResult.context.canCreateUsers}
      inactiveUsers={inactiveUsers}
      totalUsers={totalUsers}
    />
  );
}
