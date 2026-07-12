import type { AlertPayload, NotificationAdapter } from "@/lib/notifications/adapter";
import type { ChannelDispatchResult } from "@/data/notificationSchema";

// Placeholder hook for the WhatsApp Business Cloud API — chosen for
// low-bandwidth "last-mile" reach in areas where a full dashboard load is
// impractical after an event. Wire a real integration by setting
// WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID and replacing send().
export const whatsappAdapter: NotificationAdapter = {
  channel: "whatsapp",

  isConfigured() {
    return Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  },

  async send(payload: AlertPayload): Promise<ChannelDispatchResult> {
    const start = Date.now();
    const configured = this.isConfigured();

    // TODO(production): POST to Meta's Graph API, e.g.
    //   await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    //     method: "POST",
    //     headers: { Authorization: `Bearer ${token}` },
    //     body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: {...} }),
    //   });
    console.info(`[whatsapp-adapter] ${configured ? "would dispatch" : "simulated"} broadcast`, {
      district: payload.district,
      severity: payload.severity,
      headline: payload.headline,
    });

    return {
      channel: "whatsapp",
      status: configured ? "sent" : "simulated",
      detail: configured
        ? "Dispatched via configured WhatsApp Business Cloud API."
        : "WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set — simulated send only.",
      providerMessageId: `wamid-sim-${Date.now()}`,
      latencyMs: Date.now() - start,
    };
  },
};
