"use client";

import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginView() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(72,187,120,0.16),_transparent_32%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(240,253,244,1)_100%)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-[-4rem] top-12 flex size-40 items-center justify-center rounded-full border border-primary/10 bg-primary/5">
          <ShieldCheck className="size-16 text-primary/35" strokeWidth={1.5} />
        </div>
        <div className="absolute bottom-10 right-[-3rem] flex size-36 items-center justify-center rounded-full border border-primary/10 bg-white/50">
          <ShieldCheck className="size-14 text-primary/25" strokeWidth={1.5} />
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-md border-primary/10 bg-white/95 py-0 shadow-xl shadow-primary/10 ring-1 ring-primary/5 backdrop-blur-sm">
        <CardHeader className="gap-4 border-b border-primary/10 px-8 py-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/20 ring-8 ring-primary/8">
            <ShieldCheck className="size-8" strokeWidth={1.8} />
          </div>
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
              AcadThreat
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Admin sign in
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Secure access for the academic cyber threat intelligence
                workspace.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 py-8">
          <Alert className="border-primary/10 bg-primary/5">
            <ShieldCheck className="size-4 text-primary" />
            <AlertTitle className="text-foreground">
              Login UI placeholder
            </AlertTitle>
            <AlertDescription>
              Authentication will be connected in Module 02. This screen is
              visual-only for the current foundation setup.
            </AlertDescription>
          </Alert>

          <form className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@acadthreat.local"
                  className="h-11 rounded-md border-primary/15 bg-white pl-10 focus-visible:border-primary focus-visible:ring-primary/25"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 rounded-md border-primary/15 bg-white px-10 focus-visible:border-primary focus-visible:ring-primary/25"
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-primary/60 transition hover:text-primary"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              className="h-11 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              type="button"
            >
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
