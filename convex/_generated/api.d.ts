/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_userManagementApi from "../actions/userManagementApi.js";
import type * as auth from "../auth.js";
import type * as auth_authorization from "../auth/authorization.js";
import type * as auth_bootstrapFirstAdmin from "../auth/bootstrapFirstAdmin.js";
import type * as auth_bootstrapFirstAdminInternal from "../auth/bootstrapFirstAdminInternal.js";
import type * as auth_logAuthDiagnostic from "../auth/logAuthDiagnostic.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as mutations_threatIndicators from "../mutations/threatIndicators.js";
import type * as mutations_userManagement from "../mutations/userManagement.js";
import type * as queries_threatIndicators from "../queries/threatIndicators.js";
import type * as queries_userManagementApi from "../queries/userManagementApi.js";
import type * as threatIndicators_helpers from "../threatIndicators/helpers.js";
import type * as users_createTrustedUser from "../users/createTrustedUser.js";
import type * as users_createTrustedUserInternal from "../users/createTrustedUserInternal.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/userManagementApi": typeof actions_userManagementApi;
  auth: typeof auth;
  "auth/authorization": typeof auth_authorization;
  "auth/bootstrapFirstAdmin": typeof auth_bootstrapFirstAdmin;
  "auth/bootstrapFirstAdminInternal": typeof auth_bootstrapFirstAdminInternal;
  "auth/logAuthDiagnostic": typeof auth_logAuthDiagnostic;
  health: typeof health;
  http: typeof http;
  "mutations/threatIndicators": typeof mutations_threatIndicators;
  "mutations/userManagement": typeof mutations_userManagement;
  "queries/threatIndicators": typeof queries_threatIndicators;
  "queries/userManagementApi": typeof queries_userManagementApi;
  "threatIndicators/helpers": typeof threatIndicators_helpers;
  "users/createTrustedUser": typeof users_createTrustedUser;
  "users/createTrustedUserInternal": typeof users_createTrustedUserInternal;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
