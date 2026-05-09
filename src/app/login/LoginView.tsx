export function LoginView() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            AcadThreat
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Admin login placeholder
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Authentication is not implemented in Module 01. This route reserves
            the public login entry point for the protected admin experience.
          </p>
        </div>
      </section>
    </main>
  );
}
