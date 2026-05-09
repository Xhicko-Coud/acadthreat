"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

import { AppAlert } from "@/components/shared/AppAlert";

type NotificationVariant = "success" | "info" | "warning" | "error";

type Notification = {
  id: string;
  title: string;
  description?: string;
  variant: NotificationVariant;
};

type ShowNotificationInput = Omit<Notification, "id"> & {
  id?: string;
};

type NotificationContextValue = {
  dismissNotification: () => void;
  showNotification: (notification: ShowNotificationInput) => void;
  showNotificationAfterNavigation: (
    notification: ShowNotificationInput,
  ) => void;
};

const PENDING_NOTIFICATION_STORAGE_KEY = "acadthreat.pendingNotification";

const NotificationContext =
  React.createContext<NotificationContextValue | null>(null);

function createNotificationId() {
  return crypto.randomUUID();
}

function readPendingNotification() {
  const rawNotification = window.sessionStorage.getItem(
    PENDING_NOTIFICATION_STORAGE_KEY,
  );

  if (!rawNotification) {
    return null;
  }

  window.sessionStorage.removeItem(PENDING_NOTIFICATION_STORAGE_KEY);
  return JSON.parse(rawNotification) as ShowNotificationInput;
}

export function NotificationProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [notification, setNotification] = React.useState<Notification | null>(
    null,
  );

  const dismissNotification = React.useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = React.useCallback(
    (nextNotification: ShowNotificationInput) => {
      setNotification({
        ...nextNotification,
        id: nextNotification.id ?? createNotificationId(),
      });
    },
    [],
  );

  const showNotificationAfterNavigation = React.useCallback(
    (nextNotification: ShowNotificationInput) => {
      window.sessionStorage.setItem(
        PENDING_NOTIFICATION_STORAGE_KEY,
        JSON.stringify(nextNotification),
      );
    },
    [],
  );

  React.useEffect(() => {
    const pendingNotification = readPendingNotification();

    if (pendingNotification) {
      showNotification(pendingNotification);
    }
  }, [pathname, showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        dismissNotification,
        showNotification,
        showNotificationAfterNavigation,
      }}
    >
      {children}
      {notification ? (
        <AppAlert
          description={notification.description}
          placement="top-center"
          title={notification.title}
          variant={notification.variant}
        />
      ) : null}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = React.useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotificationContext must be used inside NotificationProvider.",
    );
  }

  return context;
}
