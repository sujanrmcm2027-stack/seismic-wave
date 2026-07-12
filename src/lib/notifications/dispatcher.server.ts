import type { AlertDispatchRecord, AlertTriggerInput } from "@/data/notificationSchema";
import type { NotificationAdapter } from "@/lib/notifications/adapter";
import { pushAdapter } from "@/lib/notifications/adapters/pushAdapter.server";
import { smsAdapter } from "@/lib/notifications/adapters/smsAdapter.server";
import { telegramAdapter } from "@/lib/notifications/adapters/telegramAdapter.server";
import { whatsappAdapter } from "@/lib/notifications/adapters/whatsappAdapter.server";
import { addDispatchRecordServer } from "@/lib/notifications/store.server";

const ADAPTERS: Record<string, NotificationAdapter> = {
  sms: smsAdapter,
  whatsapp: whatsappAdapter,
  telegram: telegramAdapter,
  push: pushAdapter,
};

// Fans a verified alert out to every requested last-mile channel in
// parallel, so a slow/failing gateway never blocks the others, then records
// the full delivery outcome for audit.
export async function dispatchAlert(input: AlertTriggerInput): Promise<AlertDispatchRecord> {
  const { channels, ...payload } = input;

  const results = await Promise.all(
    channels.map((channel) => ADAPTERS[channel].send(payload)),
  );

  return addDispatchRecordServer({
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    triggeredAt: new Date().toISOString(),
    severity: input.severity,
    district: input.district,
    headline: input.headline,
    message: input.message,
    results,
  });
}
