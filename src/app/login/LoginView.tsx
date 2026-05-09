"use client";

import { useMutation } from "convex/react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { flushSync } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@convex/_generated/api";
import { useAuthBridge } from "@/components/providers/AuthBridgeProvider";
import { AppAlert } from "@/components/shared/AppAlert";
import { useNotifications } from "@/hooks/use-notifications";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logAuthDiagnostic = useMutation(api.auth.logAuthDiagnostic.logAuthDiagnostic);
  const { hideAuthBridge, showAuthBridge } = useAuthBridge();
  const { showNotificationAfterNavigation } = useNotifications();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [feedback, setFeedback] = useState<{
    description: string;
    title: string;
    variant: "error" | "info";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const reason = searchParams.get("reason");
    const safeFeedback = getSafeReasonFeedback(reason);

    if (!safeFeedback) {
      return;
    }

    setFeedback(safeFeedback);
  }, [searchParams]);

  async function recordAuthDiagnostic(input: {
    event: "login_failed" | "login_exception";
    errorCode?: string;
    errorStatus?: number;
    safeReasonCategory:
      | "auth_server_unreachable"
      | "invalid_credentials"
      | "unknown_auth_error";
  }) {
    try {
      await logAuthDiagnostic({
        emailDomain: getEmailDomain(email),
        errorCode: input.errorCode,
        errorStatus: input.errorStatus,
        event: input.event,
        maskedEmail: maskEmail(email),
        safeReasonCategory: input.safeReasonCategory,
        source: "login_page",
      });
    } catch {
      // Diagnostic logging must never block or change login UX.
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors = getLoginFieldErrors(email, password);

    if (nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      setFeedback(null);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFeedback(null);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        const safeError = toSafeAuthError(error);

        await recordAuthDiagnostic({
          errorCode: safeError.errorCode,
          errorStatus: safeError.errorStatus,
          event: "login_failed",
          safeReasonCategory: categorizeAuthFailure(safeError),
        });

        setFeedback({
          description: "Check your email and password and try again.",
          title: "Sign in failed",
          variant: "error",
        });
        hideAuthBridge();
        return;
      }

      showNotificationAfterNavigation({
        description: "Your session is active.",
        title: "Signed in",
        variant: "success",
      });
      flushSync(() => {
        showAuthBridge({
          description:
            "Hold on while we move you to the threat intelligence workspace.",
          title: "Securing your session",
        });
      });
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      await recordAuthDiagnostic({
        event: "login_exception",
        safeReasonCategory: "auth_server_unreachable",
      });

      hideAuthBridge();
      setFeedback({
        description: "The authentication server could not be reached. Try again.",
        title: "Connection failed",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(72,187,120,0.16),_transparent_32%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(240,253,244,1)_100%)] px-6 py-16">
      {feedback ? (
        <AppAlert
          description={feedback.description}
          placement="top-center"
          title={feedback.title}
          variant={feedback.variant}
        />
      ) : null}

      <Card className="relative z-10 w-full max-w-md gap-0 border-primary/10 bg-white/95 py-0 shadow-xl shadow-primary/10 ring-1 ring-primary/5 backdrop-blur-sm">
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

        <CardContent className="space-y-1 px-8 py-8">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
                <Input
                  aria-invalid={Boolean(fieldErrors.email)}
                  autoComplete="email"
                  id="email"
                  onChange={(event) => {
                    setEmail(event.target.value);

                    if (fieldErrors.email) {
                      setFieldErrors((currentErrors) => ({
                        ...currentErrors,
                        email: undefined,
                      }));
                    }
                  }}
                  value={email}
                  type="email"
                  placeholder="admin@acadthreat.local"
                  className="h-11 rounded-md border-primary/15 bg-white pl-10 focus-visible:border-primary focus-visible:ring-primary/25"
                />
              </div>
              {fieldErrors.email ? (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
                <Input
                  aria-invalid={Boolean(fieldErrors.password)}
                  id="password"
                  autoComplete="current-password"
                  onChange={(event) => {
                    setPassword(event.target.value);

                    if (fieldErrors.password) {
                      setFieldErrors((currentErrors) => ({
                        ...currentErrors,
                        password: undefined,
                      }));
                    }
                  }}
                  value={password}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 rounded-md border-primary/15 bg-white px-10 focus-visible:border-primary focus-visible:ring-primary/25"
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center text-primary/60 transition hover:text-primary"
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
              {fieldErrors.password ? (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              ) : null}
            </div>

            <Button
              disabled={isSubmitting}
              className="h-11 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              type="submit"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function maskEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.includes("@")) {
    return undefined;
  }

  const [localPart, domain] = normalizedEmail.split("@");

  if (!localPart || !domain) {
    return undefined;
  }

  return `${localPart.slice(0, 1)}***@${domain}`;
}

function getLoginFieldErrors(email: string, password: string) {
  const normalizedEmail = email.trim();
  const normalizedPassword = password.trim();

  return {
    email: normalizedEmail ? undefined : "Email is required.",
    password: normalizedPassword ? undefined : "Password is required.",
  };
}

function getEmailDomain(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [, domain] = normalizedEmail.split("@");

  return domain || undefined;
}

function toSafeAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      errorCode: undefined,
      errorStatus: undefined,
      message: undefined,
    };
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
  };

  return {
    errorCode: typeof candidate.code === "string" ? candidate.code : undefined,
    errorStatus:
      typeof candidate.status === "number" ? candidate.status : undefined,
    message:
      typeof candidate.message === "string" ? candidate.message : undefined,
  };
}

function categorizeAuthFailure(error: {
  errorCode?: string;
  errorStatus?: number;
  message?: string;
}): "invalid_credentials" | "unknown_auth_error" {
  if (error.errorStatus === 401 || error.errorStatus === 403) {
    return "invalid_credentials";
  }

  const normalizedCode = error.errorCode?.toLowerCase();
  const normalizedMessage = error.message?.toLowerCase();

  if (
    normalizedCode?.includes("invalid") ||
    normalizedCode?.includes("credential") ||
    normalizedMessage?.includes("invalid") ||
    normalizedMessage?.includes("password") ||
    normalizedMessage?.includes("credential")
  ) {
    return "invalid_credentials";
  }

  return "unknown_auth_error";
}

function getSafeReasonFeedback(reason: string | null) {
  if (reason === "session-required") {
    return {
      description: "Sign in again to continue.",
      title: "Sign in required",
      variant: "info",
    } as const;
  }

  if (reason === "access-denied") {
    return {
      description:
        "Your account cannot access this workspace. Contact an administrator.",
      title: "Access denied",
      variant: "error",
    } as const;
  }

  return null;
}
