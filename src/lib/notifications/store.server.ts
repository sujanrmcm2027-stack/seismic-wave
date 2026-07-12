import type { AlertDispatchRecord } from "@/data/notificationSchema";

// Process-memory dispatch log standing in for a real audit trail. Data
// resets on server restart — swap for a real persistence layer without
// touching callers, since dispatcher.server.ts / serverFns.ts are the only
// consumers.
const dispatchLog: AlertDispatchRecord[] = [];

export function listDispatchLogServer(): AlertDispatchRecord[] {
  return [...dispatchLog].sort(
    (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime(),
  );
}

export function addDispatchRecordServer(record: AlertDispatchRecord): AlertDispatchRecord {
  dispatchLog.unshift(record);
  return record;
}
