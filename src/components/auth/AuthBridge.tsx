import { Loader2, ShieldCheck } from "lucide-react";

import { AuthGateBackdrop } from "@/components/auth/AuthGateBackdrop";

type AuthBridgeProps = {
  title: string;
  description: string;
};

export function AuthBridge({ title, description }: AuthBridgeProps) {
  return (
    <div aria-live="polite" className="fixed inset-0 z-[1000]" role="status">
      <AuthGateBackdrop>
        <div className="grid w-full max-w-md justify-items-center gap-5 rounded-2xl border border-primary/10 bg-white/95 px-6 py-10 text-center shadow-xl shadow-primary/10">
          <div className="relative flex size-24 items-center justify-center">
            <Loader2
              aria-hidden="true"
              className="absolute inset-0 size-24 animate-spin text-primary"
              strokeWidth={1.5}
            />
            <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/8">
              <ShieldCheck aria-hidden="true" className="size-8" />
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-base font-semibold text-primary">{title}</p>
            <p className="text-sm leading-6 text-primary/70">{description}</p>
          </div>
        </div>
      </AuthGateBackdrop>
    </div>
  );
}
