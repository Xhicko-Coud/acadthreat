"use client";

import { UsersSkeleton } from "./UsersSkeleton";
import { useUsersLogic } from "./UsersLogic";
import { UsersView } from "./UsersView";

export function UsersContainer() {
  const logic = useUsersLogic();

  if (logic.isLoading) {
    return <UsersSkeleton />;
  }

  return <UsersView {...logic} />;
}
