/**
 * Monitoring and Instant Alerting Utility.
 *
 * Dispatches high-priority notifications to:
 * 1. Telegram Bot (via Bot API sendMessage)
 * 2. Discord Webhook (via Discord Webhook payload)
 *
 * Triggered on:
 * - Unhandled 5xx server exceptions
 * - Healthcheck connectivity failures (Database/Redis down)
 * - Rate limit thresholds or security violation spikes
 */

export interface AlertPayload {
  level: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error | unknown;
}

/**
 * Sends a Telegram alert if TELEGRAM_BOT_TOKEN and TELEGRAM_ALERT_CHAT_ID are configured.
 */
async function sendTelegramAlert(payload: AlertPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

  if (!token || !chatId) return;

  const emoji = payload.level === "CRITICAL" ? "🚨" : payload.level === "WARNING" ? "⚠️" : "ℹ️";

  let text = `${emoji} *[${payload.level}] ${payload.title}*\n\n${payload.message}\n`;

  if (payload.context) {
    text += `\n*Context:*\n\`\`\`json\n${JSON.stringify(payload.context, null, 2)}\n\`\`\``;
  }

  if (payload.error instanceof Error) {
    text += `\n*Stack:*\n\`\`\`\n${payload.error.stack?.slice(0, 500) ?? payload.error.message}\n\`\`\``;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      console.error("Failed to send Telegram alert:", await res.text());
    }
  } catch (err) {
    console.error("Telegram alert network exception:", err);
  }
}

/**
 * Sends a Discord webhook alert if DISCORD_WEBHOOK_URL is configured.
 */
async function sendDiscordAlert(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const color =
    payload.level === "CRITICAL"
      ? 0xe11d48 // Danger Red
      : payload.level === "WARNING"
        ? 0xf59e0b // Amber
        : 0x3b82f6; // Blue

  const fields = [];
  if (payload.context) {
    for (const [k, v] of Object.entries(payload.context)) {
      fields.push({
        name: k,
        value: typeof v === "object" ? JSON.stringify(v) : String(v),
        inline: true,
      });
    }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `[${payload.level}] ${payload.title}`,
            description: payload.message,
            color,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("Failed to send Discord alert:", await res.text());
    }
  } catch (err) {
    console.error("Discord alert network exception:", err);
  }
}

/**
 * Dispatches an alert asynchronously across all configured channels.
 * Safe to fire-and-forget; catches any internal exceptions.
 */
export async function dispatchAlert(payload: AlertPayload): Promise<void> {
  console.error(
    `[SYSTEM ALERT] [${payload.level}] ${payload.title}: ${payload.message}`,
    payload.context ?? "",
  );

  await Promise.allSettled([sendTelegramAlert(payload), sendDiscordAlert(payload)]);
}
