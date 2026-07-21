const DEFAULT_ACCOUNT_ID = "2e2273c381020d207a8fe45612e1f92d";
const DEFAULT_RECIPIENT = "troy@JaboHouse.com";
const DEFAULT_SENDER = "website@jabohouse.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^\d{5}(?:-\d{4})?$/;
const ALLOWED_PREFERENCES = new Set(["Pickup", "Delivery"]);
const ALLOWED_ORIGINS = new Set([
  "https://jabohouse.com",
  "https://www.jabohouse.com",
]);

function json(payload, status = 200, additionalHeaders = {}) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...additionalHeaders,
    },
  });
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function originIsAllowed(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;

  try {
    const url = new URL(origin);
    const isLocalPreview =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    return isLocalPreview || url.hostname.endsWith(".jabohouse-com.pages.dev");
  } catch {
    return false;
  }
}

function parseFields(formData) {
  return {
    firstName: clean(formData.get("firstName"), 80),
    lastName: clean(formData.get("lastName"), 80),
    email: clean(formData.get("email"), 254).toLowerCase(),
    phone: clean(formData.get("phone"), 40),
    zip: clean(formData.get("zip"), 10),
    preference: clean(formData.get("preference"), 20),
    message: clean(formData.get("message"), 3000),
    website: clean(formData.get("website"), 200),
    startedAt: clean(formData.get("startedAt"), 30),
    turnstileToken: clean(formData.get("cf-turnstile-response"), 2048),
  };
}

function validationMessage(fields) {
  if (!fields.firstName || !fields.lastName) return "Please enter your full name.";
  if (!EMAIL_PATTERN.test(fields.email)) return "Please enter a valid email address.";
  if (!ZIP_PATTERN.test(fields.zip)) return "Please enter a valid delivery ZIP code.";
  if (!ALLOWED_PREFERENCES.has(fields.preference)) {
    return "Please choose pickup or delivery.";
  }
  return "";
}

function looksAutomated(fields) {
  if (fields.website) return true;
  if (!fields.startedAt) return false;

  const startedAt = Number(fields.startedAt);
  return Number.isFinite(startedAt) && Date.now() - startedAt < 1500;
}

async function verifyTurnstile(request, token, secret) {
  if (!secret) return true;
  if (!token) return false;

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);
  formData.set("remoteip", request.headers.get("CF-Connecting-IP") || "");
  formData.set("idempotency_key", crypto.randomUUID());

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData }
    );
    const result = await response.json();
    const actionMatches = !result.action || result.action === "jabohouse-inquiry";
    return response.ok && result.success === true && actionMatches;
  } catch {
    return false;
  }
}

function buildEmail(fields, inquiryId) {
  const fullName = `${fields.firstName} ${fields.lastName}`;
  const message = fields.message || "No additional message was provided.";
  const phone = fields.phone || "Not provided";
  const subject = `New JaboHouse inquiry: ${fields.preference} — ${fields.zip}`;
  const text = [
    "New JaboHouse reservation inquiry",
    "",
    `Name: ${fullName}`,
    `Email: ${fields.email}`,
    `Phone: ${phone}`,
    `Delivery ZIP: ${fields.zip}`,
    `Preference: ${fields.preference}`,
    "",
    "Message:",
    message,
    "",
    `Inquiry ID: ${inquiryId}`,
  ].join("\n");

  const html = `
    <h1>New JaboHouse reservation inquiry</h1>
    <table cellpadding="6" cellspacing="0" border="0">
      <tr><th align="left">Name</th><td>${escapeHtml(fullName)}</td></tr>
      <tr><th align="left">Email</th><td>${escapeHtml(fields.email)}</td></tr>
      <tr><th align="left">Phone</th><td>${escapeHtml(phone)}</td></tr>
      <tr><th align="left">Delivery ZIP</th><td>${escapeHtml(fields.zip)}</td></tr>
      <tr><th align="left">Preference</th><td>${escapeHtml(fields.preference)}</td></tr>
    </table>
    <h2>Message</h2>
    <p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>
    <p><small>Inquiry ID: ${inquiryId}</small></p>
  `;

  return { fullName, subject, text, html };
}

async function sendInquiryEmail(env, fields) {
  const apiToken = env.CLOUDFLARE_EMAIL_API_TOKEN;
  if (!apiToken) {
    return { ok: false, configurationMissing: true };
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
  const recipient = env.INQUIRY_RECIPIENT || DEFAULT_RECIPIENT;
  const sender = env.INQUIRY_SENDER || DEFAULT_SENDER;
  const inquiryId = crypto.randomUUID();
  const email = buildEmail(fields, inquiryId);
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: recipient,
        from: { address: sender, name: "JaboHouse Website" },
        reply_to: { address: fields.email, name: email.fullName },
        subject: email.subject,
        text: email.text,
        html: email.html,
        headers: { "X-JaboHouse-Inquiry-ID": inquiryId },
      }),
    }
  );
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.success !== true) {
    console.error("Cloudflare Email Service rejected an inquiry", {
      status: response.status,
      errors: result?.errors || [],
      inquiryId,
    });
    return { ok: false, configurationMissing: false };
  }

  return { ok: true };
}

export async function onRequestGet({ env }) {
  return json({
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || "",
  });
}

export async function onRequestPost({ request, env }) {
  if (!originIsAllowed(request)) {
    return json({ success: false, message: "This submission was not accepted." }, 403);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 64_000) {
    return json({ success: false, message: "This inquiry is too large." }, 413);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (
    !contentType.includes("multipart/form-data") &&
    !contentType.includes("application/x-www-form-urlencoded")
  ) {
    return json({ success: false, message: "This submission format is not supported." }, 415);
  }

  let fields;
  try {
    fields = parseFields(await request.formData());
  } catch {
    return json({ success: false, message: "This inquiry could not be read." }, 400);
  }

  if (looksAutomated(fields)) {
    return json({ success: true });
  }

  const invalidMessage = validationMessage(fields);
  if (invalidMessage) {
    return json({ success: false, message: invalidMessage }, 400);
  }

  const human = await verifyTurnstile(
    request,
    fields.turnstileToken,
    env.TURNSTILE_SECRET_KEY
  );
  if (!human) {
    return json(
      { success: false, message: "Please complete the security check and try again." },
      400
    );
  }

  try {
    const delivery = await sendInquiryEmail(env, fields);
    if (delivery.configurationMissing) {
      return json(
        {
          success: false,
          message: "Online inquiries are being connected. Please email troy@JaboHouse.com.",
        },
        503
      );
    }
    if (!delivery.ok) throw new Error("Email delivery failed");
  } catch (error) {
    console.error("JaboHouse inquiry delivery failed", error);
    return json(
      {
        success: false,
        message: "Your inquiry could not be sent. Please email troy@JaboHouse.com.",
      },
      502
    );
  }

  return json({ success: true });
}
