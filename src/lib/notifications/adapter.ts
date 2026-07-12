import type { AlertTriggerInput, ChannelDispatchResult, NotificationChannel } from "@/data/notificationSchema";

export type AlertPayload = Omit<AlertTriggerInput, "channels">;

// Common contract every last-mile channel implements, so the dispatcher can
// fan an alert out to N channels without knowing which gateways are real.
export interface NotificationAdapter {
  channel: NotificationChannel;
  isConfigured(): boolean;
  send(payload: AlertPayload): Promise<ChannelDispatchResult>;
}
