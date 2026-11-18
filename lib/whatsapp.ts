import type { CollectorInterest } from "@/lib/interests";

/**
 * Sends a collector request to the team's WhatsApp. Needs, in the server environment:
 *   WHATSAPP_NOTIFY_NUMBER  the number that receives alerts, e.g. +2348000000000
 * and one of:
 *   TEXTMEBOT_API_KEY       TextMeBot (https://textmebot.com): free 2-day demo, then about $1/month
 *   CALLMEBOT_API_KEY       CallMeBot (https://www.callmebot.com): free, personal use only
 * TextMeBot is used when both are set. Without a number and a key, nothing is sent;
 * requests are still saved and listed on the admin page.
 */
export async function sendCollectorWhatsApp(interest: CollectorInterest) {
  const phone = process.env.WHATSAPP_NOTIFY_NUMBER?.replace(/[^\d+]/g, "");
  const textMeBot = process.env.TEXTMEBOT_API_KEY;
  const callMeBot = process.env.CALLMEBOT_API_KEY;
  if (!phone || (!textMeBot && !callMeBot)) return false;

  const text = [
    `🎨 *New collector request*`,
    "",
    `Painting: *${interest.workTitle}*`,
    `Room: ${interest.room}`,
    "",
    `Name: ${interest.fullName}`,
    `WhatsApp: ${interest.phone}`,
    `Payment: ${interest.payment}`,
    `Deliver to: ${interest.address}`,
    `When: ${interest.delivery}`,
  ].join("\n");

  const url = textMeBot ? new URL("https://api.textmebot.com/send.php") : new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set(textMeBot ? "recipient" : "phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", (textMeBot ?? callMeBot) as string);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return response.ok;
  } catch {
    return false;
  }
}
