"use client";

import Link from "next/link";
import { LogOut, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { flushSync } from "react-dom";

import { AuthGateBackdrop } from "@/components/auth/AuthGateBackdrop";
import { useAuthBridge } from "@/components/providers/AuthBridgeProvider";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { authClient } from "@/lib/auth-client";

type AccessRestrictedStateProps = {
  dashboardHref?: string;
  description: string;
  title: string;
};

export function AccessRestrictedState({
  dashboardHref = "/admin/dashboard",
  description,
  title,
}: AccessRestrictedStateProps) {
  const router = useRouter();
  const { hideAuthBridge, showAuthBridge } = useAuthBridge();
  const { showNotification, showNotificationAfterNavigation } =
    useNotifications();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    flushSync(() => {
      showAuthBridge({
        description: "Hold on while we safely close your session.",
        title: "Signing you out",
      });
    });

    try {
      const { error } = await authClient.signOut();

      if (error) {
        hideAuthBridge();
        showNotification({
          description: "Try signing out again.",
          title: "Sign out failed",
          variant: "error",
        });
        setIsSigningOut(false);
        return;
      }

      showNotificationAfterNavigation({
        description: "You have been signed out safely.",
        title: "Signed out",
        variant: "success",
      });
      router.replace("/login");
      router.refresh();
    } catch {
      hideAuthBridge();
      showNotification({
        description: "The authentication server could not be reached. Try again.",
        title: "Sign out failed",
        variant: "error",
      });
      setIsSigningOut(false);
    }
  }

  return (
    <AuthGateBackdrop>
      <section className="grid w-full max-w-md gap-5 rounded-2xl border border-primary/10 bg-white/95 px-6 py-10 text-center shadow-xl shadow-primary/10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/8">
          <ShieldAlert aria-hidden="true" className="size-8" />
        </div>
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold text-primary">{title}</h1>
          <p className="text-sm leading-6 text-primary/70">{description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="h-11 cursor-pointer rounded-md" type="button">
            <Link href={dashboardHref}>Go to dashboard</Link>
          </Button>
          <Button
            className="h-11 cursor-pointer rounded-md"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            type="button"
            variant="outline"
          >
            <LogOut className="size-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </section>
    </AuthGateBackdrop>
  );
}
