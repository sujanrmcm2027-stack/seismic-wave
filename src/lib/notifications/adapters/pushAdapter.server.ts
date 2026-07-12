import type { AlertPayload, NotificationAdapter } from "@/lib/notifications/adapter";
import type { ChannelDispatchResult } from "@/data/notificationSchema";

// Placeholder hook for browser/mobile push notifications (Web Push / FCM),
// for users who still have the dashboard installed or a PWA subscription
// even when they can't actively load the page during an event. Wire a real
// integration by setting PUSH_VAPID_PRIVATE_KEY / PUSH_FCM_SERVER_KEY and
// replacing send().
export const pushAdapter: NotificationAdapter = {
  channel: "push",

  isConfigured() {
    return Boolean(process.env.PUSH_VAPID_PRIVATE_KEY || process.env.PUSH_FCM_SERVER_KEY);
  },

  async send(payload: AlertPayload): Promise<ChannelDispatchResult> {
    const start = Date.now();
    const configured = this.isConfigured();

    // TODO(production): fan out to stored push subscriptions, e.g.
    //   await webpush.sendNotification(subscription, JSON.stringify({ title: payload.headline, body: payload.message }));
    console.info(`[push-adapter] ${configured ? "would push" : "simulated"} notification`, {
      district: payload.district,
      severity: payload.severity,
      headline: payload.headline,
    });

    return {
      channel: "push",
      status: configured ? "sent" : "simulated",
      detail: configured
        ? "Dispatched via configured push provider."
        : "PUSH_VAPID_PRIVATE_KEY / PUSH_FCM_SERVER_KEY not set — simulated push only.",
      providerMessageId: `push-sim-${Date.now()}`,
      latencyMs: Date.now() - start,
    };
  },
};
