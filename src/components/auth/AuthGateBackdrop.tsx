import { LockKeyholeIcon, ShieldCheckIcon } from "lucide-react";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";

const fakeNavigationItems = [
  { label: "Dashboard", isActive: true },
  { label: "Threats" },
  { label: "Indicators" },
  { label: "Logs" },
  { label: "Settings" },
];

export function AuthGateBackdrop({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:oklch(0.98_0.01_145)] text-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-0 flex opacity-90 blur-[1.5px]"
      >
        <aside className="hidden w-72 shrink-0 border-r border-primary/20 bg-primary text-primary-foreground md:flex md:flex-col">
          <div className="p-4">
            <div className="flex h-14 items-center gap-3 rounded-xl px-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <ShieldCheckIcon className="size-5" />
              </div>
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-semibold">
                  {siteConfig.name}
                </span>
                <span className="truncate text-xs text-primary-foreground/70">
                  Protected workspace
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/20" />

          <nav className="flex-1 px-4 py-4">
            <p className="mb-3 px-2 text-xs font-medium text-primary-foreground/65">
              Navigation
            </p>
            <div className="grid gap-2">
              {fakeNavigationItems.map((item) => (
                <div
                  key={item.label}
                  className={
                    item.isActive
                      ? "flex h-10 items-center rounded-xl bg-white/15 px-3 text-sm font-medium text-primary-foreground"
                      : "flex h-10 items-center rounded-xl px-3 text-sm text-primary-foreground/75"
                  }
                >
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </nav>

          <div className="h-px bg-white/20" />
          <div className="grid gap-1 p-4 text-xs text-primary-foreground/70">
            <p>Secure admin access</p>
            <p>{siteConfig.shortName}</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center border-b border-primary/10 bg-white px-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md border border-primary/10 text-primary">
                <ShieldCheckIcon className="size-4" />
              </div>
              <div className="grid gap-1">
                <div className="h-3 w-24 rounded-full bg-primary/20" />
                <div className="h-2 w-40 rounded-full bg-primary/10" />
              </div>
            </div>
          </header>

          <div className="grid flex-1 gap-4 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="min-h-32 rounded-2xl border border-primary/10 bg-white/75 p-4 shadow-sm"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="h-3 w-24 rounded-full bg-primary/15" />
                    <div className="size-8 rounded-md bg-primary/10" />
                  </div>
                  <div className="h-8 w-20 rounded-full bg-primary/20" />
                  <div className="mt-4 h-2 w-32 rounded-full bg-primary/10" />
                </div>
              ))}
            </div>

            <div className="min-h-80 rounded-2xl border border-primary/10 bg-white/75 p-4 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="h-4 w-40 rounded-full bg-primary/15" />
                <LockKeyholeIcon className="size-5 text-primary/30" />
              </div>
              <div className="grid gap-3">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="grid grid-cols-[2rem_1fr_7rem] items-center gap-4 rounded-xl border border-primary/10 bg-[color:oklch(0.98_0.01_145/.7)] p-3"
                  >
                    <div className="size-8 rounded-md bg-primary/10" />
                    <div className="grid gap-2">
                      <div className="h-3 w-48 max-w-full rounded-full bg-primary/15" />
                      <div className="h-2 w-32 max-w-full rounded-full bg-primary/10" />
                    </div>
                    <div className="h-7 rounded-md bg-primary/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="absolute inset-0 bg-[color:oklch(0.98_0.01_145/.7)] backdrop-blur-[2px]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        {children}
      </div>
    </main>
  );
}
