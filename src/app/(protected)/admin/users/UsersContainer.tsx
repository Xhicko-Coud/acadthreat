"use client";

import { AccessRestrictedState } from "@/components/auth/AccessRestrictedState";

import { UsersSkeleton } from "./UsersSkeleton";
import { useUsersLogic } from "./UsersLogic";
import { UsersView } from "./UsersView";

export function UsersContainer() {
  const logic = useUsersLogic();

  if (logic.isInitialLoading) {
    return <UsersSkeleton />;
  }

  if (!logic.hasAccess) {
    return (
      <AccessRestrictedState
        description="Your account does not have permission to view this section."
        title="Access restricted"
      />
    );
  }

  return <UsersView {...logic} />;
}
