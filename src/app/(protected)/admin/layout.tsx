import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ProtectedProviders } from "@/app/providers";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  let accessStatus;

  try {
    accessStatus = await fetchAuthQuery(api.auth.authorization.getAccessStatus);
  } catch {
    redirect("/login?reason=session-required");
  }

  if (accessStatus.status === "unauthenticated") {
    redirect("/login?reason=session-required");
  }

  if (
    accessStatus.status === "missing_profile" ||
    accessStatus.status === "inactive"
  ) {
    redirect("/login?reason=access-denied");
  }

  return (
    <ProtectedProviders>
      <AppShell profile={accessStatus.profile}>{children}</AppShell>
    </ProtectedProviders>
  );
}
