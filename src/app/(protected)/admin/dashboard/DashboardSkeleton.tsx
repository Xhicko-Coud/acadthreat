import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="grid gap-6 bg-primary px-6 py-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Skeleton className="h-4 w-32 bg-white/20" />
            <Skeleton className="mt-3 h-8 w-48 bg-white/20" />
            <Skeleton className="mt-3 h-4 w-[34rem] max-w-full bg-white/20" />
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-4 md:min-w-64">
            <Skeleton className="h-3 w-28 bg-white/20 md:ml-auto" />
            <Skeleton className="mt-2 h-5 w-44 bg-white/20 md:ml-auto" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm"
            key={index}
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-3 h-4 w-full" />
          </div>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
          <div className="border-b border-primary/10 px-6 py-5">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="mt-2 h-4 w-96 max-w-full" />
          </div>
          <div className="p-6">
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm"
            key={index}
          >
            <div className="border-b border-primary/10 px-6 py-5">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            </div>
            <div className="grid gap-4 p-6">
              <Skeleton className="mx-auto h-64 w-full max-w-sm rounded-lg" />
              <Skeleton className="mx-auto h-8 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
          <div className="border-b border-primary/10 px-6 py-5">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-2 h-4 w-[30rem] max-w-full" />
          </div>
          <div className="grid gap-4 p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
              <div className="rounded-lg border border-dashed border-primary/15 bg-primary/4 p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-3 h-4 w-3/4" />
              </div>
              <div className="grid gap-3 rounded-lg border border-primary/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-primary/10 bg-white p-4">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="mt-2 h-4 w-80 max-w-full" />
              <Skeleton className="mt-4 h-72 w-full rounded-lg" />
            </div>
            <div className="grid gap-3 rounded-lg border border-primary/10 bg-white p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-80 max-w-full" />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton className="h-20 rounded-lg" key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
          <div className="border-b border-primary/10 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Skeleton className="h-5 w-52" />
                <Skeleton className="mt-2 h-4 w-96 max-w-full" />
              </div>
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton className="mt-px h-14 w-full" key={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
