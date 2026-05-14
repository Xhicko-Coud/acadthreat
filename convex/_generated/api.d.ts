/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_runCorrelation from "../actions/runCorrelation.js";
import type * as actions_seedDemoIndicators from "../actions/seedDemoIndicators.js";
import type * as actions_seedDemoLogs from "../actions/seedDemoLogs.js";
import type * as actions_userManagementApi from "../actions/userManagementApi.js";
import type * as auth from "../auth.js";
import type * as auth_authorization from "../auth/authorization.js";
import type * as auth_bootstrapFirstAdmin from "../auth/bootstrapFirstAdmin.js";
import type * as auth_bootstrapFirstAdminInternal from "../auth/bootstrapFirstAdminInternal.js";
import type * as auth_logAuthDiagnostic from "../auth/logAuthDiagnostic.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as http_ingestLogHttp from "../http/ingestLogHttp.js";
import type * as logs_helpers from "../logs/helpers.js";
import type * as logs_ingestLog from "../logs/ingestLog.js";
import type * as logs_normalizers from "../logs/normalizers.js";
import type * as logs_operations from "../logs/operations.js";
import type * as logs_seedDemoLogsData from "../logs/seedDemoLogsData.js";
import type * as maintenance_runSeverityScoring from "../maintenance/runSeverityScoring.js";
import type * as maintenance_runThreatFeedSync from "../maintenance/runThreatFeedSync.js";
import type * as maintenance_seedUrlhausCorrelationProof from "../maintenance/seedUrlhausCorrelationProof.js";
import type * as mutations_threatEvents from "../mutations/threatEvents.js";
import type * as mutations_threatIndicators from "../mutations/threatIndicators.js";
import type * as mutations_userManagement from "../mutations/userManagement.js";
import type * as queries_dashboard from "../queries/dashboard.js";
import type * as queries_logs from "../queries/logs.js";
import type * as queries_threatEvents from "../queries/threatEvents.js";
import type * as queries_threatIndicators from "../queries/threatIndicators.js";
import type * as queries_trendPrediction from "../queries/trendPrediction.js";
import type * as queries_userManagementApi from "../queries/userManagementApi.js";
import type * as threatEvents_correlation from "../threatEvents/correlation.js";
import type * as threatEvents_helpers from "../threatEvents/helpers.js";
import type * as threatEvents_operations from "../threatEvents/operations.js";
import type * as threatEvents_recentEvents from "../threatEvents/recentEvents.js";
import type * as threatEvents_scoring from "../threatEvents/scoring.js";
import type * as threatEvents_severityScoring from "../threatEvents/severityScoring.js";
import type * as threatFeeds_helpers from "../threatFeeds/helpers.js";
import type * as threatFeeds_operations from "../threatFeeds/operations.js";
import type * as threatFeeds_providers_urlhaus from "../threatFeeds/providers/urlhaus.js";
import type * as threatFeeds_sync from "../threatFeeds/sync.js";
import type * as threatIndicators_helpers from "../threatIndicators/helpers.js";
import type * as threatIndicators_seedDemoIndicatorsInternal from "../threatIndicators/seedDemoIndicatorsInternal.js";
import type * as users_createTrustedUser from "../users/createTrustedUser.js";
import type * as users_createTrustedUserInternal from "../users/createTrustedUserInternal.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/runCorrelation": typeof actions_runCorrelation;
  "actions/seedDemoIndicators": typeof actions_seedDemoIndicators;
  "actions/seedDemoLogs": typeof actions_seedDemoLogs;
  "actions/userManagementApi": typeof actions_userManagementApi;
  auth: typeof auth;
  "auth/authorization": typeof auth_authorization;
  "auth/bootstrapFirstAdmin": typeof auth_bootstrapFirstAdmin;
  "auth/bootstrapFirstAdminInternal": typeof auth_bootstrapFirstAdminInternal;
  "auth/logAuthDiagnostic": typeof auth_logAuthDiagnostic;
  health: typeof health;
  http: typeof http;
  "http/ingestLogHttp": typeof http_ingestLogHttp;
  "logs/helpers": typeof logs_helpers;
  "logs/ingestLog": typeof logs_ingestLog;
  "logs/normalizers": typeof logs_normalizers;
  "logs/operations": typeof logs_operations;
  "logs/seedDemoLogsData": typeof logs_seedDemoLogsData;
  "maintenance/runSeverityScoring": typeof maintenance_runSeverityScoring;
  "maintenance/runThreatFeedSync": typeof maintenance_runThreatFeedSync;
  "maintenance/seedUrlhausCorrelationProof": typeof maintenance_seedUrlhausCorrelationProof;
  "mutations/threatEvents": typeof mutations_threatEvents;
  "mutations/threatIndicators": typeof mutations_threatIndicators;
  "mutations/userManagement": typeof mutations_userManagement;
  "queries/dashboard": typeof queries_dashboard;
  "queries/logs": typeof queries_logs;
  "queries/threatEvents": typeof queries_threatEvents;
  "queries/threatIndicators": typeof queries_threatIndicators;
  "queries/trendPrediction": typeof queries_trendPrediction;
  "queries/userManagementApi": typeof queries_userManagementApi;
  "threatEvents/correlation": typeof threatEvents_correlation;
  "threatEvents/helpers": typeof threatEvents_helpers;
  "threatEvents/operations": typeof threatEvents_operations;
  "threatEvents/recentEvents": typeof threatEvents_recentEvents;
  "threatEvents/scoring": typeof threatEvents_scoring;
  "threatEvents/severityScoring": typeof threatEvents_severityScoring;
  "threatFeeds/helpers": typeof threatFeeds_helpers;
  "threatFeeds/operations": typeof threatFeeds_operations;
  "threatFeeds/providers/urlhaus": typeof threatFeeds_providers_urlhaus;
  "threatFeeds/sync": typeof threatFeeds_sync;
  "threatIndicators/helpers": typeof threatIndicators_helpers;
  "threatIndicators/seedDemoIndicatorsInternal": typeof threatIndicators_seedDemoIndicatorsInternal;
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
