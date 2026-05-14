"use client";

import { useAction, useQuery } from "convex/react";
import { Eye, Pencil, RotateCcw, ShieldX, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { api } from "@convex/_generated/api";
import type { RowAction } from "@/components/admin/DataTableRowActions";
import { useNotifications } from "@/hooks/use-notifications";

export type UserStatus = "active" | "inactive";
export type UserRole = "admin" | "analyst" | "viewer";
export type UserRecord = {
  _id: string;
  createdAt: number;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  userId: string;
};
export type UserSheetMode = "create" | "edit" | "view";
export type CreateUserFormValues = {
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
  role: "analyst" | "viewer";
};
export type EditUserFormValues = {
  confirmPassword: string;
  password: string;
  role: "analyst" | "viewer";
};

const createUserSchema = z
  .object({
    confirmPassword: z.string().trim().min(1, "Confirm password is required."),
    name: z.string().trim().min(1, "Full name is required."),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .email("Enter a valid email address."),
    password: z.string().trim().min(1, "Password is required."),
    role: z.enum(["analyst", "viewer"]),
  })
  .refine((values) => values.password.trim() === values.confirmPassword.trim(), {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const editUserSchema = z
  .object({
    confirmPassword: z.string(),
    password: z.string(),
    role: z.enum(["analyst", "viewer"]),
  })
  .superRefine((values, context) => {
    const password = values.password.trim();
    const confirmPassword = values.confirmPassword.trim();

    if (!password && !confirmPassword) {
      return;
    }

    if (!password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required when changing the password.",
        path: ["password"],
      });
    }

    if (!confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirm password is required when changing the password.",
        path: ["confirmPassword"],
      });
    }

    if (password && password.length < 8) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters.",
        path: ["password"],
      });
    }

    if (password && confirmPassword && password !== confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

const defaultCreateUserValues: CreateUserFormValues = {
  confirmPassword: "",
  email: "",
  name: "",
  password: "",
  role: "analyst",
};

const defaultEditUserValues: EditUserFormValues = {
  confirmPassword: "",
  password: "",
  role: "analyst",
};

type PendingCreateSummary = {
  email: string;
  name: string;
  role: "analyst" | "viewer";
};

type PendingEditSummary = {
  email: string;
  name: string;
  passwordChanged: boolean;
  role: "analyst" | "viewer";
};

function getStatusActionMessage(status: string) {
  const messages: Record<
    string,
    { description: string; title: string; variant: "error" | "info" | "success" }
  > = {
    already_active: {
      title: "User already active",
      description: "The selected user already has workspace access.",
      variant: "info",
    },
    already_inactive: {
      title: "User already inactive",
      description: "The selected user already cannot access the workspace.",
      variant: "info",
    },
    failed: {
      title: "Action failed",
      description: "The user status could not be updated. Try again.",
      variant: "error",
    },
    forbidden: {
      title: "Action not allowed",
      description: "You do not have permission to manage users.",
      variant: "error",
    },
    last_admin_blocked: {
      title: "Action blocked",
      description: "At least one active admin must remain.",
      variant: "error",
    },
    not_found: {
      title: "User not found",
      description: "The selected user could not be found.",
      variant: "error",
    },
    self_action_blocked: {
      title: "Action blocked",
      description: "You cannot change your own account from this screen.",
      variant: "error",
    },
    success_deactivate: {
      title: "User deactivated",
      description: "The user can no longer access the workspace.",
      variant: "success",
    },
    success_reactivate: {
      title: "User reactivated",
      description: "The user can access the workspace again.",
      variant: "success",
    },
    success_update: {
      title: "User updated",
      description: "The user's details have been updated.",
      variant: "success",
    },
    unauthenticated: {
      title: "Action not allowed",
      description: "You do not have permission to manage users.",
      variant: "error",
    },
    unchanged: {
      title: "No changes detected",
      description: "Make a role or password change before saving.",
      variant: "info",
    },
    unsupported_role_creation: {
      title: "Role not allowed",
      description: "Administrator access cannot be assigned from this screen.",
      variant: "error",
    },
  };

  return (
    messages[status] ?? {
      title: "Action failed",
      description: "The user status could not be updated. Try again.",
      variant: "error" as const,
    }
  );
}

export function formatRoleLabel(role: UserRecord["role"]) {
  const labels = {
    admin: "Administrator",
    analyst: "Analyst",
    viewer: "Viewer",
  } satisfies Record<UserRecord["role"], string>;

  return labels[role];
}

export function useUsersLogic() {
  const queryResult = useQuery(api.queries.userManagementApi.listUsers);
  const userContext = useQuery(
    api.queries.userManagementApi.getCurrentUserManagementContext,
  );
  const createTrustedUserAction = useAction(
    api.users.createTrustedUser.createTrustedUser,
  );
  const deactivateUserAction = useAction(
    api.actions.userManagementApi.deactivateUser,
  );
  const reactivateUserAction = useAction(
    api.actions.userManagementApi.reactivateUser,
  );
  const updateUserRoleAction = useAction(
    api.actions.userManagementApi.updateUserRole,
  );
  const router = useRouter();
  const { showNotification } = useNotifications();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [sheetMode, setSheetMode] = useState<UserSheetMode>("create");
  const [sheetUser, setSheetUser] = useState<UserRecord | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpenCreateSheetConfirmOpen, setIsOpenCreateSheetConfirmOpen] =
    useState(false);
  const [isSaveCreateConfirmOpen, setIsSaveCreateConfirmOpen] = useState(false);
  const [isOpenEditSheetConfirmOpen, setIsOpenEditSheetConfirmOpen] =
    useState(false);
  const [isEditSaveConfirmOpen, setIsEditSaveConfirmOpen] = useState(false);
  const [isDiscardSheetConfirmOpen, setIsDiscardSheetConfirmOpen] =
    useState(false);
  const [pendingDeactivateUser, setPendingDeactivateUser] =
    useState<UserRecord | null>(null);
  const [pendingReactivateUser, setPendingReactivateUser] =
    useState<UserRecord | null>(null);
  const [pendingRoleUser, setPendingRoleUser] = useState<UserRecord | null>(
    null,
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>("viewer");
  const [pendingCreateSummary, setPendingCreateSummary] =
    useState<PendingCreateSummary | null>(null);
  const [pendingEditUser, setPendingEditUser] = useState<UserRecord | null>(null);
  const [pendingEditSummary, setPendingEditSummary] =
    useState<PendingEditSummary | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isRoleUpdating, setIsRoleUpdating] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [lastLoadedUsers, setLastLoadedUsers] = useState<UserRecord[]>([]);
  const [lastAlertKey, setLastAlertKey] = useState<string | null>(null);

  const createUserForm = useForm<CreateUserFormValues>({
    defaultValues: defaultCreateUserValues,
    mode: "onChange",
    resolver: zodResolver(createUserSchema),
  });
  const editUserForm = useForm<EditUserFormValues>({
    defaultValues: defaultEditUserValues,
    mode: "onChange",
    resolver: zodResolver(editUserSchema),
  });

  const liveUsers = useMemo<UserRecord[]>(() => {
    if (!queryResult || queryResult.status !== "success") return [];
    return queryResult.users as UserRecord[];
  }, [queryResult]);

  useEffect(() => {
    if (queryResult !== undefined && userContext !== undefined) {
      setHasLoadedInitialData(true);
    }
  }, [queryResult, userContext]);

  useEffect(() => {
    if (queryResult?.status === "success") {
      setLastLoadedUsers(queryResult.users as UserRecord[]);
    }
  }, [queryResult]);

  useEffect(() => {
    if (userContext === undefined && queryResult === undefined) {
      return;
    }

    const contextStatus = userContext?.status;
    const listStatus = queryResult?.status;

    if (contextStatus === "forbidden" || contextStatus === "unauthenticated") {
      const alertKey = `users-access-${contextStatus}`;

      if (lastAlertKey === alertKey) {
        return;
      }

      showNotification({
        description: "Your account cannot manage trusted workspace users.",
        title: "Access denied",
        variant: "error",
      });
      setLastAlertKey(alertKey);
      return;
    }

    if (
      listStatus !== undefined &&
      listStatus !== "success" &&
      listStatus !== "forbidden" &&
      listStatus !== "unauthenticated"
    ) {
      const alertKey = `users-query-${listStatus}`;

      if (lastAlertKey === alertKey) {
        return;
      }

      showNotification({
        description: "Trusted workspace users could not be loaded. Try again.",
        title: "Load failed",
        variant: "error",
      });
      setLastAlertKey(alertKey);
      return;
    }

    if (contextStatus === "success" && listStatus === "success" && lastAlertKey) {
      setLastAlertKey(null);
    }
  }, [lastAlertKey, queryResult, showNotification, userContext]);

  const users = queryResult === undefined ? lastLoadedUsers : liveUsers;

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const byStatus =
      statusFilter === "all"
        ? users
        : users.filter((user) => user.status === statusFilter);

    if (!normalizedQuery) return byStatus;

    return byStatus.filter((user) =>
      [user.name ?? "", user.email, formatRoleLabel(user.role), user.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, statusFilter, users]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const inactiveUsers = users.filter((user) => user.status === "inactive").length;
  const isLoading = queryResult === undefined || userContext === undefined;
  const isInitialLoading = !hasLoadedInitialData && isLoading;
  const isTableLoading = hasLoadedInitialData && queryResult === undefined;
  const hasAccess = userContext?.status === "success";
  const currentUserId =
    userContext?.status === "success" ? userContext.context.userId : null;
  const isCreateMode = sheetMode === "create";
  const isViewMode = sheetMode === "view";
  const isEditMode = sheetMode === "edit";
  const isCreateSheetDirty = createUserForm.formState.isDirty;
  const isEditSheetDirty = editUserForm.formState.isDirty;

  function getUserActions(user: UserRecord): RowAction[] {
    const isCurrentUser = user.userId === currentUserId;
    const canManageAccess = !isCurrentUser && user.role !== "admin";
    const canChangeRole = !isCurrentUser;

    return [
      {
        label: "View details",
        icon: Eye,
        onClick: () => openViewSheet(user),
      },
      {
        label: "Edit details",
        icon: Pencil,
        onClick: () => requestEditUser(user),
        disabled: !canManageAccess,
      },
      {
        label: "Change role",
        icon: UserCog,
        onClick: () => requestChangeRole(user),
        disabled: !canChangeRole,
      },
      {
        label:
          user.status === "active"
            ? "Deactivate access"
            : "Reactivate access",
        icon: user.status === "active" ? ShieldX : RotateCcw,
        onClick: () =>
          user.status === "active"
            ? setPendingDeactivateUser(user)
            : setPendingReactivateUser(user),
        variant: user.status === "active" ? "destructive" : "success",
        disabled: !canManageAccess,
      },
    ];
  }

  function resetCreateForm() {
    createUserForm.reset(defaultCreateUserValues);
    setPendingCreateSummary(null);
  }

  function resetEditForm() {
    editUserForm.reset(defaultEditUserValues);
    setPendingEditSummary(null);
  }

  function resetSheetState() {
    setIsSheetOpen(false);
    setSheetMode("create");
    setSheetUser(null);
    setIsOpenCreateSheetConfirmOpen(false);
    setIsSaveCreateConfirmOpen(false);
    setIsOpenEditSheetConfirmOpen(false);
    setIsEditSaveConfirmOpen(false);
    setIsDiscardSheetConfirmOpen(false);
    setPendingEditUser(null);
    setPendingRoleUser(null);
    resetCreateForm();
    resetEditForm();
  }

  function allowOpenCreateSheet() {
    resetSheetState();
    setIsSheetOpen(true);
  }

  function openViewSheet(user: UserRecord) {
    setPendingEditSummary(null);
    setIsEditSaveConfirmOpen(false);
    setSheetMode("view");
    setSheetUser(user);
    editUserForm.reset({
      confirmPassword: "",
      password: "",
      role: user.role === "admin" ? "analyst" : user.role,
    });
    setIsSheetOpen(true);
  }

  function openEditSheet(user: UserRecord) {
    if (user.userId === currentUserId || user.role === "admin") {
      return;
    }

    setPendingEditSummary(null);
    setIsEditSaveConfirmOpen(false);
    setSheetMode("edit");
    setSheetUser(user);
    editUserForm.reset({
      confirmPassword: "",
      password: "",
      role: user.role,
    });
    setIsSheetOpen(true);
  }

  function requestEditUser(user: UserRecord) {
    if (user.userId === currentUserId || user.role === "admin") {
      return;
    }

    setPendingEditUser(user);
    setIsOpenEditSheetConfirmOpen(true);
  }

  function requestChangeRole(user: UserRecord) {
    if (user.userId === currentUserId) {
      return;
    }

    setPendingRoleUser(user);
    setSelectedRole(user.role);
  }

  function allowOpenEditSheet() {
    if (!pendingEditUser) {
      return;
    }

    setIsOpenEditSheetConfirmOpen(false);
    openEditSheet(pendingEditUser);
    setPendingEditUser(null);
  }

  function handleSheetOpenChange(open: boolean) {
    if (!open && (isCreating || isUpdating)) {
      return;
    }

    if (!open && isCreateMode && isCreateSheetDirty) {
      setIsDiscardSheetConfirmOpen(true);
      return;
    }

    if (!open && isEditMode && isEditSheetDirty) {
      setIsDiscardSheetConfirmOpen(true);
      return;
    }

    if (!open) {
      resetSheetState();
      return;
    }

    setIsSheetOpen(true);
  }

  function discardSheetChanges() {
    resetSheetState();
  }

  function requestCreateUser(values: CreateUserFormValues) {
    const normalizedValues = normalizeCreateUserValues(values);
    setPendingCreateSummary({
      email: normalizedValues.email,
      name: normalizedValues.name,
      role: normalizedValues.role,
    });
    setIsSaveCreateConfirmOpen(true);
  }

  function requestEditSave(values: EditUserFormValues) {
    if (!sheetUser) {
      return;
    }

    const normalizedPassword = values.password.trim();
    const hasRoleChange = values.role !== sheetUser.role;
    const hasPasswordChange = Boolean(normalizedPassword);

    if (!hasRoleChange && !hasPasswordChange) {
      showNotification(getStatusActionMessage("unchanged"));
      return;
    }

    setPendingEditSummary({
      email: sheetUser.email,
      name: sheetUser.name ?? "Unnamed user",
      passwordChanged: hasPasswordChange,
      role: values.role,
    });
    setIsEditSaveConfirmOpen(true);
  }

  const submitCreateForm = createUserForm.handleSubmit(requestCreateUser);
  const submitEditForm = editUserForm.handleSubmit(requestEditSave);

  async function requestSaveSheet() {
    if (isViewMode) {
      resetSheetState();
      return;
    }

    if (isCreateMode) {
      void submitCreateForm();
      return;
    }

    const isValid = await editUserForm.trigger();
    if (!isValid) {
      return;
    }

    requestEditSave(editUserForm.getValues());
  }

  async function createUser() {
    if (!pendingCreateSummary) {
      return;
    }

    const currentValues = createUserForm.getValues();
    const normalizedValues = normalizeCreateUserValues(currentValues);
    setIsCreating(true);

    try {
      const result = await createTrustedUserAction({
        email: normalizedValues.email,
        name: normalizedValues.name,
        password: normalizedValues.password,
        role: normalizedValues.role,
      });

      if (result.status === "created") {
        showNotification({
          title: "User created",
          description: "The trusted user account has been created.",
          variant: "success",
        });
        resetSheetState();
        router.refresh();
        return;
      }

      setIsSaveCreateConfirmOpen(false);

      if (result.status === "duplicate_email") {
        showNotification({
          title: "User already exists",
          description: "A user with this email already exists.",
          variant: "error",
        });
        return;
      }

      showNotification(getStatusActionMessage(result.status));
    } catch {
      setIsSaveCreateConfirmOpen(false);
      showNotification(getStatusActionMessage("failed"));
    } finally {
      setIsCreating(false);
    }
  }

  async function updateUser() {
    if (!sheetUser) {
      return;
    }

    setIsUpdating(true);

    try {
      const result = await updateUserRoleAction({
        password: editUserForm.getValues().password.trim() || undefined,
        role: editUserForm.getValues().role,
        targetUserId: sheetUser.userId,
      });

      if (result.status === "success" || result.status === "updated") {
        showNotification(getStatusActionMessage("success_update"));
        resetSheetState();
        router.refresh();
        return;
      }

      setIsEditSaveConfirmOpen(false);
      showNotification(getStatusActionMessage(result.status));
    } catch {
      setIsEditSaveConfirmOpen(false);
      showNotification(getStatusActionMessage("failed"));
    } finally {
      setIsUpdating(false);
    }
  }

  async function changeUserRole() {
    if (!pendingRoleUser) {
      return;
    }

    setIsRoleUpdating(true);

    try {
      const result = await updateUserRoleAction({
        role: selectedRole,
        targetUserId: pendingRoleUser.userId,
      });

      if (result.status === "updated") {
        showNotification({
          title: "User role updated",
          description: `User role updated to ${formatRoleLabel(result.role)}.`,
          variant: "success",
        });
        setPendingRoleUser(null);
        return;
      }

      if (result.status === "unchanged") {
        showNotification({
          title: "No changes detected",
          description: "User already has this role.",
          variant: "info",
        });
        setPendingRoleUser(null);
        return;
      }

      if (result.status === "last_admin_blocked") {
        showNotification({
          title: "Role change blocked",
          description: "At least one active admin must remain.",
          variant: "error",
        });
        return;
      }

      if (result.status === "forbidden" || result.status === "unauthenticated") {
        showNotification({
          title: "Action not allowed",
          description: "Your account cannot change user roles.",
          variant: "error",
        });
        return;
      }

      if (result.status === "not_found") {
        showNotification({
          title: "User not found",
          description: "User profile was not found.",
          variant: "error",
        });
        setPendingRoleUser(null);
        return;
      }

      showNotification({
        title: "Role update failed",
        description: "User role update failed. Please try again later.",
        variant: "error",
      });
    } catch {
      showNotification({
        title: "Role update failed",
        description: "User role update failed. Please try again later.",
        variant: "error",
      });
    } finally {
      setIsRoleUpdating(false);
    }
  }

  async function deactivateUser() {
    if (!pendingDeactivateUser) {
      return;
    }

    setIsDeactivating(true);

    try {
      const result = await deactivateUserAction({
        targetUserId: pendingDeactivateUser.userId,
      });

      if (result.status === "success") {
        showNotification(getStatusActionMessage("success_deactivate"));
        setPendingDeactivateUser(null);
        router.refresh();
        return;
      }

      showNotification(getStatusActionMessage(result.status));
      setPendingDeactivateUser(null);
    } catch {
      showNotification(getStatusActionMessage("failed"));
      setPendingDeactivateUser(null);
    } finally {
      setIsDeactivating(false);
    }
  }

  async function reactivateUser() {
    if (!pendingReactivateUser) {
      return;
    }

    setIsReactivating(true);

    try {
      const result = await reactivateUserAction({
        targetUserId: pendingReactivateUser.userId,
      });

      if (result.status === "success") {
        showNotification(getStatusActionMessage("success_reactivate"));
        setPendingReactivateUser(null);
        router.refresh();
        return;
      }

      showNotification(getStatusActionMessage(result.status));
      setPendingReactivateUser(null);
    } catch {
      showNotification(getStatusActionMessage("failed"));
      setPendingReactivateUser(null);
    } finally {
      setIsReactivating(false);
    }
  }

  return {
    activeUsers,
    allowOpenCreateSheet,
    changeUserRole,
    createUserForm,
    createUser,
    deactivateUser,
    discardSheetChanges,
    editUserForm,
    filteredUsers,
    getUserActions,
    handleSheetOpenChange,
    hasAccess,
    inactiveUsers,
    isCreating,
    isCreateMode,
    isDeactivating,
    isDiscardSheetConfirmOpen,
    isEditMode,
    isOpenEditSheetConfirmOpen,
    isEditSaveConfirmOpen,
    isInitialLoading,
    isOpenCreateSheetConfirmOpen,
    isReactivating,
    isRoleUpdating,
    isSaveCreateConfirmOpen,
    isSheetOpen,
    isTableLoading,
    isUpdating,
    isViewMode,
    openEditSheet,
    openViewSheet,
    pendingCreateSummary,
    pendingEditUser,
    pendingEditSummary,
    pendingDeactivateUser,
    pendingReactivateUser,
    pendingRoleUser,
    query,
    reactivateUser,
    requestSaveSheet,
    allowOpenEditSheet,
    requestEditUser,
    setIsDiscardSheetConfirmOpen,
    setIsOpenEditSheetConfirmOpen,
    setIsEditSaveConfirmOpen,
    setIsOpenCreateSheetConfirmOpen,
    setIsSaveCreateConfirmOpen,
    setPendingEditUser,
    setPendingDeactivateUser,
    setPendingReactivateUser,
    selectedRole,
    setPendingRoleUser,
    setQuery,
    setSelectedRole,
    setStatusFilter,
    sheetMode,
    sheetUser,
    statusFilter,
    submitCreateForm,
    submitEditForm,
    totalUsers,
    updateUser,
  };
}

function normalizeCreateUserValues(values: CreateUserFormValues) {
  return {
    confirmPassword: values.confirmPassword.trim(),
    email: values.email.trim().toLowerCase(),
    name: values.name.trim(),
    password: values.password.trim(),
    role: values.role,
  };
}
