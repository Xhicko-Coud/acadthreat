"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

import { AuthBridge } from "@/components/auth/AuthBridge";

type AuthBridgeState = {
  description: string;
  title: string;
} | null;

type AuthBridgeContextValue = {
  hideAuthBridge: () => void;
  showAuthBridge: (bridge: NonNullable<AuthBridgeState>) => void;
};

const AuthBridgeContext = React.createContext<AuthBridgeContextValue | null>(
  null,
);

export function AuthBridgeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [bridge, setBridge] = React.useState<AuthBridgeState>(null);

  const hideAuthBridge = React.useCallback(() => {
    setBridge(null);
  }, []);

  const showAuthBridge = React.useCallback(
    (nextBridge: NonNullable<AuthBridgeState>) => {
      setBridge(nextBridge);
    },
    [],
  );

  React.useEffect(() => {
    setBridge(null);
  }, [pathname]);

  return (
    <AuthBridgeContext.Provider value={{ hideAuthBridge, showAuthBridge }}>
      {children}
      {bridge ? (
        <AuthBridge
          description={bridge.description}
          title={bridge.title}
        />
      ) : null}
    </AuthBridgeContext.Provider>
  );
}

export function useAuthBridge() {
  const context = React.useContext(AuthBridgeContext);

  if (!context) {
    throw new Error("useAuthBridge must be used inside AuthBridgeProvider.");
  }

  return context;
}
