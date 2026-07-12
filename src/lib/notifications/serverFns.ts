import { createServerFn } from "@tanstack/react-start";
import { alertTriggerInputSchema } from "@/data/notificationSchema";
import { dispatchAlert } from "@/lib/notifications/dispatcher.server";
import { listDispatchLogServer } from "@/lib/notifications/store.server";

export const listDispatchLog = createServerFn({ method: "GET" }).handler(async () => {
  return listDispatchLogServer();
});

export const triggerAlert = createServerFn({ method: "POST" })
  .validator(alertTriggerInputSchema)
  .handler(async ({ data }) => {
    return dispatchAlert(data);
  });
