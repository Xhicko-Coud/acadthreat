import { Skeleton } from "@/components/ui/skeleton";

export function LogsSkeleton() {
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="bg-primary px-6 py-8">
          <Skeleton className="h-4 w-32 bg-white/20" />
          <Skeleton className="mt-3 h-8 w-44 bg-white/20" />
          <Skeleton className="mt-3 h-4 w-[30rem] bg-white/20" />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Skeleton className="h-10 w-full lg:w-44" />
            <Skeleton className="h-10 w-full lg:w-52" />
            <Skeleton className="h-10 w-full lg:w-44" />
            <Skeleton className="h-10 w-full lg:w-44" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-primary/10 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1.5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[160px] rounded-lg" />
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
