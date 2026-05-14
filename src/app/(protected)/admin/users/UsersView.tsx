import {
  CheckCircle2,
  Filter,
  Plus,
  Users,
  ShieldX,
} from "lucide-react";

import { AdminActionSheet } from "@/components/admin/AdminActionSheet";
import { FilterDropdownMenu } from "@/components/admin/FilterDropdownMenu";
import { tableHeaderButtonClassName } from "@/components/admin/tableHeaderButtonStyles";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UsersDialogs } from "./UsersDialogs";
import { UsersForm } from "./UsersForm";
import { UsersTable } from "./UsersTable";
import type { useUsersLogic } from "./UsersLogic";

type UsersViewProps = ReturnType<typeof useUsersLogic>;

export function UsersView({
  activeUsers,
  allowOpenEditSheet,
  allowOpenCreateSheet,
  changeUserRole,
  createUser,
  createUserForm,
  deactivateUser,
  discardSheetChanges,
  editUserForm,
  filteredUsers,
  getUserActions,
  handleSheetOpenChange,
  inactiveUsers,
  isCreating,
  isCreateMode,
  isDeactivating,
  isDiscardSheetConfirmOpen,
  isOpenEditSheetConfirmOpen,
  isEditMode,
  isEditSaveConfirmOpen,
  isOpenCreateSheetConfirmOpen,
  isReactivating,
  isRoleUpdating,
  isSaveCreateConfirmOpen,
  isSheetOpen,
  isTableLoading,
  isUpdating,
  isViewMode,
  pendingCreateSummary,
  pendingEditUser,
  pendingEditSummary,
  pendingDeactivateUser,
  pendingReactivateUser,
  pendingRoleUser,
  query,
  reactivateUser,
  requestSaveSheet,
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
}: UsersViewProps) {
  const statusFilterLabel =
    statusFilter === "all"
      ? "All statuses"
      : statusFilter === "active"
        ? "Active"
        : "Inactive";

  const metrics = [
    {
      description: "Trusted internal user accounts in the workspace.",
      icon: <Users className="size-4" />,
      label: "Total Users",
      value: totalUsers,
    },
    {
      description: "Users with active access to protected workspace routes.",
      icon: <CheckCircle2 className="size-4" />,
      label: "Active",
      value: activeUsers,
    },
    {
      description: "Users who are currently blocked from workspace access.",
      icon: <ShieldX className="size-4" />,
      label: "Inactive",
      value: inactiveUsers,
    },
  ];

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="grid gap-4 bg-primary px-6 py-8 text-primary-foreground md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-normal text-primary-foreground/70">
              Access Control
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Users</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              Manage trusted analysts and viewers for the threat intelligence
              workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article
            className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm"
            key={metric.label}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-primary">
                {metric.label}
              </p>
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary">
                {metric.icon}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-primary">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-primary/70">
              {metric.description}
            </p>
          </article>
        ))}
      </section>

      <UsersTable
        actions={
          <>
            <div className="hidden lg:block">
              <Select
                onValueChange={(value) =>
                  setStatusFilter(value as "active" | "inactive" | "all")
                }
                value={statusFilter}
              >
                <SelectTrigger className="h-10 w-full rounded-lg border-primary/20 bg-primary/[0.04] text-primary shadow-sm hover:border-primary/35 hover:bg-primary/[0.08] focus-visible:border-primary sm:w-52">
                  <Filter className="size-4 text-primary/70" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-primary/10 shadow-xl">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="inactive">Inactive only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:hidden">
              <FilterDropdownMenu
                groups={[
                  {
                    key: "status",
                    label: "Status",
                    onSelect: (value) =>
                      setStatusFilter(value as "active" | "inactive" | "all"),
                    options: [
                      { label: "All statuses", value: "all" },
                      { label: "Active only", value: "active" },
                      { label: "Inactive only", value: "inactive" },
                    ],
                    value: statusFilter,
                    valueLabel: statusFilterLabel,
                  },
                ]}
              />
            </div>
            <Button
              className={tableHeaderButtonClassName}
              onClick={() => setIsOpenCreateSheetConfirmOpen(true)}
              size="lg"
              type="button"
            >
              <Plus className="size-4" />
              Create User
            </Button>
          </>
        }
        data={filteredUsers}
        description="All trusted internal users and their current workspace access status."
        getUserActions={getUserActions}
        isLoading={isTableLoading}
        title="User Directory"
      />

      <AdminActionSheet
        cancelText={isViewMode ? "Close" : "Cancel"}
        confirmText={isCreateMode ? "Create User" : "Save Changes"}
        description={
          isCreateMode
            ? "Add a trusted analyst or viewer to the AcadThreat workspace."
            : isViewMode
              ? "Review this user's safe workspace details."
              : "Update this user's role assignment."
        }
        isLoading={isCreateMode ? isCreating : isUpdating}
        loadingText={isCreateMode ? "Creating user..." : "Saving changes..."}
        onCancel={() => handleSheetOpenChange(false)}
        onConfirm={requestSaveSheet}
        onOpenChange={handleSheetOpenChange}
        open={isSheetOpen}
        showConfirmButton={!isViewMode}
        title={
          isCreateMode ? "Create user" : isViewMode ? "View user" : "Edit user"
        }
      >
        <UsersForm
          createForm={createUserForm}
          editForm={editUserForm}
          onCreateSubmit={submitCreateForm}
          onEditSubmit={submitEditForm}
          sheetMode={sheetMode}
          sheetUser={sheetUser}
        />
      </AdminActionSheet>

      <UsersDialogs
        allowOpenEditSheet={allowOpenEditSheet}
        allowOpenCreateSheet={allowOpenCreateSheet}
        createUser={createUser}
        changeUserRole={changeUserRole}
        deactivateUser={deactivateUser}
        discardSheetChanges={discardSheetChanges}
        isCreating={isCreating}
        isDeactivating={isDeactivating}
        isDiscardSheetConfirmOpen={isDiscardSheetConfirmOpen}
        isOpenEditSheetConfirmOpen={isOpenEditSheetConfirmOpen}
        isEditSaveConfirmOpen={isEditSaveConfirmOpen}
        isOpenCreateSheetConfirmOpen={isOpenCreateSheetConfirmOpen}
        isReactivating={isReactivating}
        isRoleUpdating={isRoleUpdating}
        isSaveCreateConfirmOpen={isSaveCreateConfirmOpen}
        isUpdating={isUpdating}
        pendingCreateSummary={pendingCreateSummary}
        pendingEditUser={pendingEditUser}
        pendingEditSummary={pendingEditSummary}
        pendingDeactivateUser={pendingDeactivateUser}
        pendingReactivateUser={pendingReactivateUser}
        pendingRoleUser={pendingRoleUser}
        reactivateUser={reactivateUser}
        selectedRole={selectedRole}
        setIsDiscardSheetConfirmOpen={setIsDiscardSheetConfirmOpen}
        setIsOpenEditSheetConfirmOpen={setIsOpenEditSheetConfirmOpen}
        setIsEditSaveConfirmOpen={setIsEditSaveConfirmOpen}
        setIsOpenCreateSheetConfirmOpen={setIsOpenCreateSheetConfirmOpen}
        setIsSaveCreateConfirmOpen={setIsSaveCreateConfirmOpen}
        setPendingEditUser={setPendingEditUser}
        setPendingDeactivateUser={setPendingDeactivateUser}
        setPendingReactivateUser={setPendingReactivateUser}
        setPendingRoleUser={setPendingRoleUser}
        setSelectedRole={setSelectedRole}
        sheetUser={sheetUser}
        updateUser={updateUser}
      />
    </div>
  );
}
