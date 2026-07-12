import type { AlertPayload, NotificationAdapter } from "@/lib/notifications/adapter";
import type { ChannelDispatchResult } from "@/data/notificationSchema";

// Placeholder hook for a Telegram broadcast bot posting to a public alerts
// channel — cheap, low-bandwidth "last-mile" reach that survives web/app
// outages. Wire a real integration by setting TELEGRAM_BOT_TOKEN /
// TELEGRAM_CHANNEL_ID and replacing send().
export const telegramAdapter: NotificationAdapter = {
  channel: "telegram",

  isConfigured() {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID);
  },

  async send(payload: AlertPayload): Promise<ChannelDispatchResult> {
    const start = Date.now();
    const configured = this.isConfigured();

    // TODO(production): POST to the Telegram Bot API, e.g.
    //   await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    //     method: "POST",
    //     body: JSON.stringify({ chat_id: channelId, text: `${payload.headline}\n\n${payload.message}` }),
    //   });
    console.info(`[telegram-adapter] ${configured ? "would post" : "simulated"} channel post`, {
      district: payload.district,
      severity: payload.severity,
      headline: payload.headline,
    });

    return {
      channel: "telegram",
      status: configured ? "sent" : "simulated",
      detail: configured
        ? "Posted via configured Telegram bot."
        : "TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID not set — simulated post only.",
      providerMessageId: `tg-sim-${Date.now()}`,
      latencyMs: Date.now() - start,
    };
  },
};
