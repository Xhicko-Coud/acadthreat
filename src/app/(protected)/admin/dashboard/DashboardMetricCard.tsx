import type { LucideIcon } from "lucide-react";

type DashboardMetricCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

export function DashboardMetricCard({
  description,
  icon: Icon,
  label,
  value,
}: DashboardMetricCardProps) {
  return (
    <article className="min-w-0 rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold text-primary">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-3 break-words text-2xl font-semibold text-primary sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-primary/70">{description}</p>
    </article>
  );
}
