"use client";

import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ShieldX,
  UserCog,
} from "lucide-react";

import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatRoleLabel, type UserRecord, type UserRole } from "./UsersLogic";

type UsersDialogsProps = {
  allowOpenEditSheet: () => void;
  allowOpenCreateSheet: () => void;
  changeUserRole: () => void;
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
  isRoleUpdating: boolean;
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
    role: "analyst" | "viewer";
  } | null;
  pendingDeactivateUser: UserRecord | null;
  pendingReactivateUser: UserRecord | null;
  pendingRoleUser: UserRecord | null;
  reactivateUser: () => void;
  selectedRole: UserRole;
  setIsDiscardSheetConfirmOpen: (open: boolean) => void;
  setIsOpenEditSheetConfirmOpen: (open: boolean) => void;
  setIsEditSaveConfirmOpen: (open: boolean) => void;
  setIsOpenCreateSheetConfirmOpen: (open: boolean) => void;
  setIsSaveCreateConfirmOpen: (open: boolean) => void;
  setPendingEditUser: (user: UserRecord | null) => void;
  setPendingDeactivateUser: (user: UserRecord | null) => void;
  setPendingReactivateUser: (user: UserRecord | null) => void;
  setPendingRoleUser: (user: UserRecord | null) => void;
  setSelectedRole: (role: UserRole) => void;
  sheetUser: UserRecord | null;
  updateUser: () => void;
};

export function UsersDialogs({
  allowOpenEditSheet,
  allowOpenCreateSheet,
  changeUserRole,
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
  isRoleUpdating,
  isSaveCreateConfirmOpen,
  isUpdating,
  pendingCreateSummary,
  pendingEditUser,
  pendingEditSummary,
  pendingDeactivateUser,
  pendingReactivateUser,
  pendingRoleUser,
  reactivateUser,
  selectedRole,
  setIsDiscardSheetConfirmOpen,
  setIsOpenEditSheetConfirmOpen,
  setIsEditSaveConfirmOpen,
  setIsOpenCreateSheetConfirmOpen,
  setIsSaveCreateConfirmOpen,
  setPendingEditUser,
  setPendingDeactivateUser,
  setPendingReactivateUser,
  setPendingRoleUser,
  setSelectedRole,
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
            ? `Save updates for ${pendingEditSummary.name} (${pendingEditSummary.email})? Role: ${formatRoleLabel(pendingEditSummary.role)}.`
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

      <AlertDialog
        open={Boolean(pendingRoleUser)}
        onOpenChange={(open) => {
          if (isRoleUpdating) {
            return;
          }

          if (!open) {
            setPendingRoleUser(null);
          }
        }}
      >
        <AlertDialogContent className="!max-w-md border-primary/10 p-6 shadow-xl sm:!max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="border border-primary/15 bg-primary/5">
              <UserCog className="size-7 text-primary" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-foreground">
              Change user role?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This updates the user's AcadThreat application role. It does not
              change their login credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4">
            <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
              <p className="text-sm font-medium text-primary">
                {pendingRoleUser?.name || "Unnamed user"}
              </p>
              <p className="mt-1 text-sm text-primary/70">
                {pendingRoleUser?.email || "No email available"}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-normal text-primary/60">
                Current role:{" "}
                {pendingRoleUser
                  ? formatRoleLabel(pendingRoleUser.role)
                  : "Unknown"}
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-primary">
                New role
              </Label>
              <Select
                disabled={isRoleUpdating}
                onValueChange={(value) => setSelectedRole(value as UserRole)}
                value={selectedRole}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AlertDialogFooter className="grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <AlertDialogCancel className="min-w-0" disabled={isRoleUpdating}>
              Cancel
            </AlertDialogCancel>
            <Button
              className="min-w-0 gap-1.5 bg-primary px-3 text-center text-primary-foreground hover:bg-primary/90"
              disabled={isRoleUpdating}
              onClick={(event) => {
                event.preventDefault();
                changeUserRole();
              }}
              type="button"
            >
              {isRoleUpdating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update role"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
