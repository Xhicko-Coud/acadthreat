import { Skeleton } from "@/components/ui/skeleton";

export function UsersSkeleton() {
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="bg-primary px-6 py-8">
          <Skeleton className="h-4 w-28 bg-white/20" />
          <Skeleton className="mt-3 h-8 w-40 bg-white/20" />
          <Skeleton className="mt-3 h-4 w-96 bg-white/20" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <article
            className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm"
            key={index}
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-44" />
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-primary/10 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1.5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[200px] rounded-lg" />
            <Skeleton className="h-10 w-[120px] rounded-lg" />
            <Skeleton className="h-10 w-[140px] rounded-lg" />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton className="mt-px h-14 w-full" key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
