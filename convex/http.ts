import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "@convex/auth";
import { ingestLogHttp } from "./http/ingestLogHttp";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);
http.route({
  handler: ingestLogHttp,
  method: "POST",
  path: "/api/ingest/logs",
});

export default http;
