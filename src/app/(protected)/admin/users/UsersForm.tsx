import type { FormEventHandler } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  formatRoleLabel,
  type CreateUserFormValues,
  type EditUserFormValues,
  type UserRecord,
  type UserSheetMode,
} from "./UsersLogic";

const AVAILABLE_ROLES = [
  { label: "Analyst", value: "analyst" },
  { label: "Viewer", value: "viewer" },
] as const;

type UsersFormProps = {
  createForm: UseFormReturn<CreateUserFormValues>;
  editForm: UseFormReturn<EditUserFormValues>;
  onCreateSubmit: FormEventHandler<HTMLFormElement>;
  onEditSubmit: FormEventHandler<HTMLFormElement>;
  sheetMode: UserSheetMode;
  sheetUser: UserRecord | null;
};

export function UsersForm({
  createForm,
  editForm,
  onCreateSubmit,
  onEditSubmit,
  sheetMode,
  sheetUser,
}: UsersFormProps) {
  const isCreateMode = sheetMode === "create";
  const isEditMode = sheetMode === "edit";
  const isViewMode = sheetMode === "view";
  const selectedUserName = sheetUser?.name ?? "";
  const selectedUserEmail = sheetUser?.email ?? "";
  const selectedUserRole =
    sheetUser?.role === "viewer" || sheetUser?.role === "analyst"
      ? sheetUser.role
      : "analyst";
  const selectedUserStatus = sheetUser?.status ?? "inactive";
  const selectedUserCreatedAt = sheetUser
    ? new Date(sheetUser.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

  if (isCreateMode) {
    const {
      control,
      formState: { errors },
      register,
    } = createForm;

    return (
      <form className="grid gap-5 py-4" id="create-user-form" onSubmit={onCreateSubmit}>
        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-primary" htmlFor="user-name">
            Full Name
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
            <Input
              aria-invalid={Boolean(errors.name)}
              className="pl-10"
              id="user-name"
              placeholder="Enter full name"
              {...register("name")}
            />
          </div>
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-primary" htmlFor="user-email">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
            <Input
              aria-invalid={Boolean(errors.email)}
              className="pl-10"
              id="user-email"
              placeholder="Enter email address"
              type="email"
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-primary" htmlFor="user-password">
            Password
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
            <Input
              aria-invalid={Boolean(errors.password)}
              className="px-10"
              id="user-password"
              placeholder="Enter a password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
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
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label
            className="text-sm font-medium text-primary"
            htmlFor="user-confirm-password"
          >
            Confirm Password
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
            <Input
              aria-invalid={Boolean(errors.confirmPassword)}
              className="px-10"
              id="user-confirm-password"
              placeholder="Confirm the password"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
            />
            <button
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center text-primary/60 transition hover:text-primary"
              onClick={() => setShowConfirmPassword((current) => !current)}
              type="button"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-primary" htmlFor="user-role">
            Role
          </Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value ?? "analyst"}
              >
                <SelectTrigger
                  aria-invalid={Boolean(errors.role)}
                  className="w-full"
                  id="user-role"
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.role ? (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          ) : null}
        </div>

        <p className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary/80">
          This screen creates trusted internal workspace users only. Analyst and
          viewer accounts are provisioned here. Administrator accounts must be
          created through the protected bootstrap path.
        </p>

        <button className="hidden" type="submit" />
      </form>
    );
  }

  const {
    control,
    formState: { errors },
    register,
  } = editForm;

  return (
    <form className="grid gap-5 py-4" id="edit-user-form" onSubmit={onEditSubmit}>
      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="edit-user-name">
          Full Name
        </Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/40" />
          <Input
            className="pl-10"
            disabled
            id="edit-user-name"
            readOnly
            value={selectedUserName}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="edit-user-email">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/40" />
          <Input
            className="pl-10"
            disabled
            id="edit-user-email"
            readOnly
            type="email"
            value={selectedUserEmail}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="edit-user-role">
          Role
        </Label>
        <>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                disabled={isViewMode}
                onValueChange={field.onChange}
                value={field.value ?? selectedUserRole}
              >
                <SelectTrigger
                  aria-invalid={Boolean(errors.role)}
                  className="w-full"
                  id="edit-user-role"
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.role ? (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          ) : null}
        </>
      </div>

      {isEditMode || isViewMode ? (
        <>
          <div className="grid gap-1.5">
            <Label className="text-sm font-medium text-primary" htmlFor="edit-user-password">
              {isViewMode ? "Password" : "New Password"}
            </Label>
            {isViewMode ? (
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
                <Input
                  className="px-10"
                  disabled
                  id="edit-user-password"
                  placeholder="Password is hidden for security"
                  readOnly
                  type="password"
                  value=""
                />
              </div>
            ) : (
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
                <Input
                  aria-invalid={Boolean(errors.password)}
                  className="px-10"
                  id="edit-user-password"
                  placeholder="Leave blank to keep the current password"
                  type={showEditPassword ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  aria-label={showEditPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center text-primary/60 transition hover:text-primary"
                  onClick={() => setShowEditPassword((current) => !current)}
                  type="button"
                >
                  {showEditPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            )}
            {isViewMode ? (
              <p className="text-sm text-primary/70">
                Password is hidden for security.
              </p>
            ) : errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          {!isViewMode ? (
            <div className="grid gap-1.5">
              <Label
                className="text-sm font-medium text-primary"
                htmlFor="edit-user-confirm-password"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/55" />
                <Input
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className="px-10"
                  id="edit-user-confirm-password"
                  placeholder="Confirm the new password"
                  type={showEditConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                />
                <button
                  aria-label={
                    showEditConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center text-primary/60 transition hover:text-primary"
                  onClick={() =>
                    setShowEditConfirmPassword((current) => !current)
                  }
                  type="button"
                >
                  {showEditConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="edit-user-status">
          Status
        </Label>
        <Input
          disabled
          id="edit-user-status"
          readOnly
          value={selectedUserStatus === "active" ? "Active" : "Inactive"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="edit-user-created-at">
          Created At
        </Label>
        <Input
          disabled
          id="edit-user-created-at"
          readOnly
          value={selectedUserCreatedAt}
        />
      </div>

      {isEditMode ? (
        <p className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary/80">
          Update the user's assigned workspace role and optionally set a new
          password. Leave the password fields blank to keep the current password.
        </p>
      ) : isViewMode ? (
        <p className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary/80">
          Safe workspace details are shown here in read-only mode.
        </p>
      ) : null}

      <button className="hidden" type="submit" />
    </form>
  );
}
