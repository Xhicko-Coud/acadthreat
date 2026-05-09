"use client";

import { CheckCircle2, Pencil, Plus, RotateCcw, ShieldX } from "lucide-react";

import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";

import { formatRoleLabel, type UserRecord } from "./UsersLogic";

type UsersDialogsProps = {
  allowOpenEditSheet: () => void;
  allowOpenCreateSheet: () => void;
  createUser: () => void;
  deactivateUser: () => void;
  discardSheetChanges: () => void;
  isCreating: boolean;
  isDeactivating: boolean;
  isDiscardSheetConfirmOpen: boolean;
  isOpenEditSheetConfirmOpen: boolean;
  isEditSaveConfirmOpen: boolean;
  isOpenCreateSheetConfirmOpen: boolean;
  isReactivating: boolean;
  isSaveCreateConfirmOpen: boolean;
  isUpdating: boolean;
  pendingCreateSummary: {
    email: string;
    name: string;
    role: UserRecord["role"];
  } | null;
  pendingEditUser: UserRecord | null;
  pendingEditSummary: {
    email: string;
    name: string;
    passwordChanged: boolean;
    role: "analyst" | "viewer";
  } | null;
  pendingDeactivateUser: UserRecord | null;
  pendingReactivateUser: UserRecord | null;
  reactivateUser: () => void;
  setIsDiscardSheetConfirmOpen: (open: boolean) => void;
  setIsOpenEditSheetConfirmOpen: (open: boolean) => void;
  setIsEditSaveConfirmOpen: (open: boolean) => void;
  setIsOpenCreateSheetConfirmOpen: (open: boolean) => void;
  setIsSaveCreateConfirmOpen: (open: boolean) => void;
  setPendingEditUser: (user: UserRecord | null) => void;
  setPendingDeactivateUser: (user: UserRecord | null) => void;
  setPendingReactivateUser: (user: UserRecord | null) => void;
  sheetUser: UserRecord | null;
  updateUser: () => void;
};

export function UsersDialogs({
  allowOpenEditSheet,
  allowOpenCreateSheet,
  createUser,
  deactivateUser,
  discardSheetChanges,
  isCreating,
  isDeactivating,
  isDiscardSheetConfirmOpen,
  isOpenEditSheetConfirmOpen,
  isEditSaveConfirmOpen,
  isOpenCreateSheetConfirmOpen,
  isReactivating,
  isSaveCreateConfirmOpen,
  isUpdating,
  pendingCreateSummary,
  pendingEditUser,
  pendingEditSummary,
  pendingDeactivateUser,
  pendingReactivateUser,
  reactivateUser,
  setIsDiscardSheetConfirmOpen,
  setIsOpenEditSheetConfirmOpen,
  setIsEditSaveConfirmOpen,
  setIsOpenCreateSheetConfirmOpen,
  setIsSaveCreateConfirmOpen,
  setPendingEditUser,
  setPendingDeactivateUser,
  setPendingReactivateUser,
  sheetUser,
  updateUser,
}: UsersDialogsProps) {
  return (
    <>
      <ConfirmationDialog
        confirmText="Open"
        description="Open the user creation form for a trusted analyst or viewer?"
        icon={<Plus className="size-7 text-primary" />}
        isOpen={isOpenCreateSheetConfirmOpen}
        onConfirm={allowOpenCreateSheet}
        onOpenChange={setIsOpenCreateSheetConfirmOpen}
        title="Create New User"
      />

      <ConfirmationDialog
        cancelText="Cancel"
        confirmText="Continue"
        description={
          pendingEditUser
            ? `Review ${pendingEditUser.name || "this user"} (${pendingEditUser.email}) before making changes. Role: ${formatRoleLabel(pendingEditUser.role)}.`
            : "Review this user's details before making changes."
        }
        icon={<Pencil className="size-7 text-primary" />}
        isOpen={isOpenEditSheetConfirmOpen}
        onConfirm={allowOpenEditSheet}
        onOpenChange={(open) => {
          setIsOpenEditSheetConfirmOpen(open);
          if (!open) {
            setPendingEditUser(null);
          }
        }}
        title="Edit user"
      />

      <ConfirmationDialog
        confirmText="Create User"
        description={`Create "${pendingCreateSummary?.name || "Untitled"}" as ${formatRoleLabel(pendingCreateSummary?.role ?? "analyst")} with ${pendingCreateSummary?.email || "the provided email"}?`}
        icon={<CheckCircle2 className="size-7 text-emerald-600" />}
        isLoading={isCreating}
        isOpen={isSaveCreateConfirmOpen}
        loadingText="Creating user..."
        onConfirm={createUser}
        onOpenChange={setIsSaveCreateConfirmOpen}
        title="Confirm User Creation"
        variant="success"
      />

      <ConfirmationDialog
        confirmText="Save changes"
        description={
          pendingEditSummary
            ? `Save updates for ${pendingEditSummary.name} (${pendingEditSummary.email})? Role: ${formatRoleLabel(pendingEditSummary.role)}. Password changed: ${pendingEditSummary.passwordChanged ? "Yes" : "No"}.`
            : ""
        }
        icon={<Pencil className="size-7 text-primary" />}
        isLoading={isUpdating}
        isOpen={isEditSaveConfirmOpen}
        loadingText="Saving changes..."
        onConfirm={updateUser}
        onOpenChange={setIsEditSaveConfirmOpen}
        title="Confirm User Update"
      />

      <ConfirmationDialog
        confirmText="Discard"
        description="Close the form and discard unsaved changes?"
        icon={<ShieldX className="size-7 text-red-600" />}
        isOpen={isDiscardSheetConfirmOpen}
        onConfirm={discardSheetChanges}
        onOpenChange={setIsDiscardSheetConfirmOpen}
        title="Discard Changes"
        variant="destructive"
      />

      <ConfirmationDialog
        confirmText="Deactivate user"
        description={
          pendingDeactivateUser
            ? `Deactivate ${pendingDeactivateUser.name || "this user"} (${pendingDeactivateUser.email})? This will prevent the user from accessing the AcadThreat workspace until reactivated. Role: ${formatRoleLabel(pendingDeactivateUser.role)}.`
            : ""
        }
        icon={<ShieldX className="size-7 text-red-600" />}
        isLoading={isDeactivating}
        isOpen={Boolean(pendingDeactivateUser)}
        loadingText="Deactivating user..."
        onConfirm={deactivateUser}
        onOpenChange={(open) => {
          if (!open) setPendingDeactivateUser(null);
        }}
        title="Deactivate user"
        variant="destructive"
      />

      <ConfirmationDialog
        confirmText="Reactivate user"
        description={
          pendingReactivateUser
            ? `Reactivate ${pendingReactivateUser.name || "this user"} (${pendingReactivateUser.email})? This will restore the user's access according to their assigned role: ${formatRoleLabel(pendingReactivateUser.role)}.`
            : ""
        }
        icon={<RotateCcw className="size-7 text-emerald-600" />}
        isLoading={isReactivating}
        isOpen={Boolean(pendingReactivateUser)}
        loadingText="Reactivating user..."
        onConfirm={reactivateUser}
        onOpenChange={(open) => {
          if (!open) setPendingReactivateUser(null);
        }}
        title="Reactivate user"
        variant="success"
      />
    </>
  );
}
