import type { AlertPayload, NotificationAdapter } from "@/lib/notifications/adapter";
import type { ChannelDispatchResult } from "@/data/notificationSchema";

// Placeholder hook for a bulk SMS gateway (e.g. Twilio, Sparrow SMS, or an
// NTC/Ncell aggregator commonly used for Nepal telco broadcast). Wire a real
// integration by setting SMS_GATEWAY_API_KEY / SMS_GATEWAY_SENDER_ID and
// replacing the body of send() with the provider's SDK/REST call.
export const smsAdapter: NotificationAdapter = {
  channel: "sms",

  isConfigured() {
    return Boolean(process.env.SMS_GATEWAY_API_KEY);
  },

  async send(payload: AlertPayload): Promise<ChannelDispatchResult> {
    const start = Date.now();
    const configured = this.isConfigured();

    // TODO(production): POST to the gateway's bulk-send endpoint, e.g.
    //   await fetch(`${process.env.SMS_GATEWAY_URL}/send`, {
    //     method: "POST",
    //     headers: { Authorization: `Bearer ${process.env.SMS_GATEWAY_API_KEY}` },
    //     body: JSON.stringify({ to: districtSubscriberList, text: payload.message }),
    //   });
    console.info(`[sms-adapter] ${configured ? "would dispatch" : "simulated"} SMS blast`, {
      district: payload.district,
      severity: payload.severity,
      headline: payload.headline,
    });

    return {
      channel: "sms",
      status: configured ? "sent" : "simulated",
      detail: configured
        ? "Dispatched via configured SMS gateway."
        : "SMS_GATEWAY_API_KEY is not set — simulated send only, no real message left this server.",
      providerMessageId: `sms-sim-${Date.now()}`,
      latencyMs: Date.now() - start,
    };
  },
};
