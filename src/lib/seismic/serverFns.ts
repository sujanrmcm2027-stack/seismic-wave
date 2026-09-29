/**
 * serverFns.ts — TanStack Start Server Functions for Multi-Source Intelligence
 * ==============================================================================
 * Exposes server functions for querying the multi-source feed, individual
 * event groups, and backend health diagnostics.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  getDiagnosticsServer,
  getEventGroupByIdServer,
  getMultiSourceFeedServer,
  syncAllSources,
} from "./seismicStore.server";

export const getMultiSourceFeed = createServerFn({ method: "GET" }).handler(async () => {
  return getMultiSourceFeedServer();
});

export const refreshMultiSourceFeed = createServerFn({ method: "POST" }).handler(async () => {
  await syncAllSources(true);
  return getMultiSourceFeedServer();
});

export const getEventGroupById = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    return getEventGroupByIdServer(data);
  });

export const getSeismicDiagnostics = createServerFn({ method: "GET" }).handler(async () => {
  return getDiagnosticsServer();
});
