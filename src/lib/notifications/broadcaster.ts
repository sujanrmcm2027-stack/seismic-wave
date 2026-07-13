/**
 * Broadcast Framework Mockup
 * 
 * Simulates a webhook listener service that receives Verified Official incidents
 * and instantly formats and dispatches JSON payloads optimized for 3rd-party
 * messaging APIs (WhatsApp Business, Viber Public Accounts).
 */

type OfficialIncident = {
  eventId: string;
  magnitude: number;
  location: string;
  time: string;
  verificationStatus: "verified" | "pending";
  alertLevel: "red" | "amber" | "green";
  safeZonesLink: string;
};

type FormattedPayload = {
  platform: "whatsapp" | "viber";
  channelId: string;
  messageType: "template" | "rich_media";
  content: any;
  priority: "high" | "normal";
};

class LiveBroadcastService {
  private channels = {
    whatsapp: "NEPAL_GOV_ALERTS_WA",
    viber: "NEPAL_GOV_ALERTS_VIBER"
  };

  /**
   * Main entrypoint for webhook listening.
   * In a real app, this would be an Express/Fastify route handler.
   */
  public handleIncomingIncident(incident: OfficialIncident) {
    console.log(`[BROADCAST] Received incident ${incident.eventId}. Status: ${incident.verificationStatus}`);
    
    if (incident.verificationStatus !== "verified") {
      console.log(`[BROADCAST] Incident not verified. Skipping broadcast.`);
      return;
    }

    if (incident.magnitude < 5.0) {
      console.log(`[BROADCAST] Incident magnitude ${incident.magnitude} below broadcast threshold (5.0). Skipping.`);
      return;
    }

    console.log(`[BROADCAST] Processing verified major incident. Generating payloads...`);

    const waPayload = this.formatForWhatsApp(incident);
    const viberPayload = this.formatForViber(incident);

    this.dispatch(waPayload);
    this.dispatch(viberPayload);
  }

  private formatForWhatsApp(incident: OfficialIncident): FormattedPayload {
    return {
      platform: "whatsapp",
      channelId: this.channels.whatsapp,
      messageType: "template",
      priority: "high",
      content: {
        template_name: "earthquake_alert_critical",
        language: { policy: "deterministic", code: "ne" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: incident.magnitude.toFixed(1) },
              { type: "text", text: incident.location },
              { type: "text", text: incident.time },
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: incident.safeZonesLink }]
          }
        ]
      }
    };
  }

  private formatForViber(incident: OfficialIncident): FormattedPayload {
    return {
      platform: "viber",
      channelId: this.channels.viber,
      messageType: "rich_media",
      priority: "high",
      content: {
        receiver: this.channels.viber,
        min_api_version: 7,
        type: "rich_media",
        rich_media: {
          Type: "rich_media",
          ButtonsGroupColumns: 6,
          ButtonsGroupRows: 4,
          BgColor: "#FFFFFF",
          Buttons: [
            {
              Columns: 6,
              Rows: 2,
              ActionType: "none",
              Text: `<font color=#323232><b>EARTHQUAKE ALERT (M${incident.magnitude})</b></font><br><font color=#777777>${incident.location}</font>`,
              TextSize: "large",
              TextVAlign: "middle",
              TextHAlign: "left"
            },
            {
              Columns: 6,
              Rows: 1,
              ActionType: "open-url",
              ActionBody: incident.safeZonesLink,
              Text: "<font color=#ffffff>View Nearest Safe Zones</font>",
              TextSize: "regular",
              BgColor: incident.alertLevel === "red" ? "#EF4444" : "#F59E0B"
            }
          ]
        }
      }
    };
  }

  private async dispatch(payload: FormattedPayload) {
    console.log(`[BROADCAST] Dispatching to ${payload.platform.toUpperCase()}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log(`[BROADCAST] ✅ Successfully dispatched to ${payload.platform}. Payload:`, JSON.stringify(payload, null, 2));
  }
}

// Export singleton instance
export const broadcaster = new LiveBroadcastService();

// Example usage to simulate an event:
/*
broadcaster.handleIncomingIncident({
  eventId: "np_2026_xYz123",
  magnitude: 6.2,
  location: "Gorkha District",
  time: new Date().toISOString(),
  verificationStatus: "verified",
  alertLevel: "red",
  safeZonesLink: "https://seismic.nepal.gov.np/safe-zones?lat=28.3&lng=84.7"
});
*/
