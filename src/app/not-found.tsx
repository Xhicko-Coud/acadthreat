import Link from "next/link";
import { CompassIcon, ShieldAlertIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(72,187,120,0.16),_transparent_32%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(240,253,244,1)_100%)] px-6 py-16">

      <Card className="relative z-10 w-full max-w-xl border-primary/10 bg-white/95 text-center shadow-xl shadow-primary/10 ring-1 ring-primary/5 backdrop-blur-sm">
        <CardHeader className="justify-items-center gap-4 border-b border-primary/10 px-8 py-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/20 ring-8 ring-primary/8">
            <ShieldAlertIcon className="size-8" strokeWidth={1.8} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
              {siteConfig.name}
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Page not found
              </h1>
              <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
                The page you are looking for does not exist or may have been
                moved.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 px-8 py-8 sm:grid-cols-2">
          <Button
            asChild
            className="h-11 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Link href="/login">Back to login</Link>
          </Button>

          <Button
            asChild
            className="h-11 rounded-md border-primary/15 bg-white text-foreground hover:bg-primary/5"
            variant="outline"
          >
            <Link href="/admin/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
