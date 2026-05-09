import {
  CheckCircle2,
  ShieldX,
  Users,
} from "lucide-react";

import { AppAlert } from "@/components/shared/AppAlert";
import { EmptyState } from "@/components/shared/EmptyState";

export function UsersView({
  activeUsers,
  hasAccess,
  inactiveUsers,
  totalUsers,
}: {
  activeUsers: number;
  hasAccess: boolean;
  inactiveUsers: number;
  totalUsers: number;
}) {
  const metrics = [
    {
      description: "Trusted internal user accounts in the workspace.",
      icon: <Users className="size-4" />,
      label: "Total Users",
      value: totalUsers,
    },
    {
      description: "Users with active access to protected workspace routes.",
      icon: <CheckCircle2 className="size-4" />,
      label: "Active",
      value: activeUsers,
    },
    {
      description: "Users who are currently blocked from workspace access.",
      icon: <ShieldX className="size-4" />,
      label: "Inactive",
      value: inactiveUsers,
    },
  ];

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="grid gap-4 bg-primary px-6 py-8 text-primary-foreground md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-normal text-primary-foreground/70">
              Access Control
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Users</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              Manage trusted analysts and viewers for the threat intelligence
              workspace.
            </p>
          </div>
        </div>
      </section>

      {!hasAccess ? (
        <AppAlert
          description="Your account cannot manage trusted workspace users."
          title="Access denied"
          variant="error"
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article
            className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm"
            key={metric.label}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-primary">
                {metric.label}
              </p>
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary">
                {metric.icon}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-primary">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-primary/70">
              {metric.description}
            </p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="border-b border-primary/10 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-foreground">
            User Directory
          </h2>
          <p className="mt-1 text-sm text-primary/65">
            Internal trusted user records will appear here in the next chunk.
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <EmptyState
            className="border-none shadow-none"
            description="The users listing surface is reserved for trusted internal account management and will be connected in the next implementation step."
            icon={Users}
            title="User roster is preparing"
          />
        </div>
      </section>
    </div>
  );
}
