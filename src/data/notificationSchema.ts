import { z } from "zod";

// EW4All Pillar 3 ("Dissemination & Communication") last-mile alerting.
// Real gateways (SMS aggregator, WhatsApp Business Cloud API, Telegram Bot
// API, web push) are not provisioned in this project, so each channel is a
// typed adapter placeholder — see src/lib/notifications/adapters/*.server.ts.
// The contract here is what a production integration would fill in.
export const NOTIFICATION_CHANNELS = ["sms", "whatsapp", "telegram", "push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  sms: "SMS Gateway",
  whatsapp: "WhatsApp Business",
  telegram: "Telegram Bot",
  push: "Web Push",
};

export const ALERT_SEVERITIES = ["advisory", "warning", "severe"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  advisory: "Advisory - informational",
  warning: "Warning - potential threat",
  severe: "Severe - immediate action required",
};

export const alertTriggerInputSchema = z.object({
  severity: z.enum(ALERT_SEVERITIES),
  district: z.string().min(2, "District / scope is required"),
  headline: z.string().min(5, "Headline is required").max(140),
  message: z.string().min(10, "Message body is required").max(480),
  channels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1, "Select at least one channel"),
});

export type AlertTriggerInput = z.infer<typeof alertTriggerInputSchema>;

export const dispatchStatuses = ["sent", "simulated", "failed", "not_configured"] as const;
export type DispatchStatus = (typeof dispatchStatuses)[number];

export type ChannelDispatchResult = {
  channel: NotificationChannel;
  status: DispatchStatus;
  detail: string;
  providerMessageId?: string;
  latencyMs: number;
};

export type AlertDispatchRecord = {
  id: string;
  triggeredAt: string;
  severity: AlertSeverity;
  district: string;
  headline: string;
  message: string;
  results: ChannelDispatchResult[];
};
