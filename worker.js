export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    const isAllowed =
      origin === env.ALLOWED_ORIGIN ||
      origin.endsWith(".pages.dev") ||
      origin.startsWith("http://localhost");

    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowed ? origin : env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, corsHeaders);
    }

    const { name, email, topic, message } = body || {};

    if (!name || !email || !message) {
      return jsonResponse({ error: "Missing required fields" }, 400, corsHeaders);
    }

    if (name.length > 100 || email.length > 200 || message.length > 5000) {
      return jsonResponse({ error: "Input too long" }, 400, corsHeaders);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse({ error: "Invalid email format" }, 400, corsHeaders);
    }

    const topicLabel = topic || "general";

    const resendPayload = {
      from: "BAM Studios Contact <onboarding@resend.dev>",
      to: [env.RECIPIENT_EMAIL],
      reply_to: email,
      subject: `[Contact] ${topicLabel} — from ${name}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
          <div style="background: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e5e7eb;">
            <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #059669; margin: 0; font-size: 18px;">New Contact Message</h2>
            </div>
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">FROM</p>
            <p style="margin: 0 0 20px; font-size: 16px; color: #111827;"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">TOPIC</p>
            <p style="margin: 0 0 20px; font-size: 15px; color: #111827;"><strong>${escapeHtml(topicLabel)}</strong></p>
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">MESSAGE</p>
            <div style="background: #f9fafb; border-left: 3px solid #d97706; padding: 16px; border-radius: 6px; color: #111827; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
            <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px;">Reply directly to this email to respond.</p>
          </div>
        </div>
      `,
    };

    let resendRes;
    try {
      resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendPayload),
      });
    } catch (err) {
      console.error("Fetch to Resend failed:", err);
      return jsonResponse({ error: "Failed to reach email service" }, 500, corsHeaders);
    }

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error("Resend error status:", resendRes.status);
      console.error("Resend error body:", err);
      return jsonResponse({
        error: "Email sending failed",
        detail: `Resend ${resendRes.status}: ${err.slice(0, 200)}`
      }, 500, corsHeaders);
    }

    return jsonResponse({ ok: true, message: "Message sent successfully" }, 200, corsHeaders);
  },
};

function jsonResponse(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
