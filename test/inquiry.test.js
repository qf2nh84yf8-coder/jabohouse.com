import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { onRequestGet, onRequestPost } from "../functions/api/inquiry.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function validForm(overrides = {}) {
  const values = {
    firstName: "Troy",
    lastName: "Chiappone",
    email: "buyer@example.com",
    phone: "941-555-0101",
    zip: "33980",
    preference: "Delivery",
    message: "Is the specimen still available?",
    ...overrides,
  };
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => form.set(key, value));
  return form;
}

function requestWith(form, origin = "https://jabohouse.com") {
  return new Request("https://jabohouse.com/api/inquiry", {
    method: "POST",
    headers: { Origin: origin },
    body: form,
  });
}

test("GET returns public Turnstile configuration without caching", async () => {
  const response = await onRequestGet({ env: { TURNSTILE_SITE_KEY: "site-key" } });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(payload.turnstileSiteKey, "site-key");
});

test("rejects cross-origin submissions", async () => {
  const response = await onRequestPost({
    request: requestWith(validForm(), "https://malicious.example"),
    env: {},
  });

  assert.equal(response.status, 403);
});

test("accepts Cloudflare local preview ports", async () => {
  const response = await onRequestPost({
    request: requestWith(validForm(), "http://127.0.0.1:8847"),
    env: {},
  });

  assert.equal(response.status, 503);
});

test("silently accepts honeypot submissions without sending mail", async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not run");
  };

  const response = await onRequestPost({
    request: requestWith(validForm({ website: "spam.example" })),
    env: { CLOUDFLARE_EMAIL_API_TOKEN: "token" },
  });

  assert.equal(response.status, 200);
  assert.equal(fetchCalled, false);
});

test("returns a helpful validation error", async () => {
  const response = await onRequestPost({
    request: requestWith(validForm({ zip: "not-a-zip" })),
    env: {},
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.message, /ZIP code/);
});

test("requires Turnstile when the production secret is configured", async () => {
  const response = await onRequestPost({
    request: requestWith(validForm()),
    env: { TURNSTILE_SECRET_KEY: "secret" },
  });

  assert.equal(response.status, 400);
});

test("sends a validated inquiry through Cloudflare Email Service", async () => {
  let emailRequest;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("/turnstile/v0/siteverify")) {
      assert.equal(options.body.get("secret"), "turnstile-secret");
      assert.equal(options.body.get("response"), "turnstile-token");
      return Response.json({ success: true, action: "jabohouse-inquiry" });
    }

    emailRequest = { url: String(url), options };
    return Response.json({ success: true, result: { delivered: ["troy@JaboHouse.com"] } });
  };

  const response = await onRequestPost({
    request: requestWith(validForm({ "cf-turnstile-response": "turnstile-token" })),
    env: {
      CLOUDFLARE_EMAIL_API_TOKEN: "secret-email-token",
      TURNSTILE_SECRET_KEY: "turnstile-secret",
    },
  });
  const payload = await response.json();
  const emailPayload = JSON.parse(emailRequest.options.body);

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.match(emailRequest.url, /\/email\/sending\/send$/);
  assert.equal(emailRequest.options.headers.Authorization, "Bearer secret-email-token");
  assert.equal(emailPayload.to, "troy@JaboHouse.com");
  assert.equal(emailPayload.reply_to.address, "buyer@example.com");
  assert.match(emailPayload.subject, /Delivery/);
  assert.match(emailPayload.text, /33980/);
});

test("fails safely until the Cloudflare email token is configured", async () => {
  const response = await onRequestPost({
    request: requestWith(validForm()),
    env: {},
  });
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.match(payload.message, /email troy@JaboHouse.com/);
});
