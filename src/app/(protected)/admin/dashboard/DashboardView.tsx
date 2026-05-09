export function DashboardView() {
  return (
    <main className="flex min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Protected Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Dashboard shell placeholder
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            This placeholder confirms the protected admin route structure for
            Module 01. Metrics, auth enforcement, and threat data are not
            implemented yet.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            Threat metrics pending
          </div>
          <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            Authentication pending
          </div>
          <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            Convex dashboard queries pending
          </div>
        </div>
      </section>
    </main>
  );
}
