import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { forwardGateway, gatewayBaseUrl } from "../src/lib/gateway";

const originalFetch = globalThis.fetch;
const originalBase = process.env.CHECHE_API_BASE_URL;
const originalLegacy = process.env.NEXT_PUBLIC_CHECHE_API_BASE_URL;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalBase === undefined) delete process.env.CHECHE_API_BASE_URL;
  else process.env.CHECHE_API_BASE_URL = originalBase;
  if (originalLegacy === undefined) delete process.env.NEXT_PUBLIC_CHECHE_API_BASE_URL;
  else process.env.NEXT_PUBLIC_CHECHE_API_BASE_URL = originalLegacy;
});

test("Gateway uses configured server URL, trims slash, and preserves legacy env", () => {
  process.env.NEXT_PUBLIC_CHECHE_API_BASE_URL = "https://legacy.example.test/";
  delete process.env.CHECHE_API_BASE_URL;
  assert.equal(gatewayBaseUrl(), "https://legacy.example.test");
  process.env.CHECHE_API_BASE_URL = "https://backend.example.test/prefix/";
  assert.equal(gatewayBaseUrl(), "https://backend.example.test/prefix");
});

test("login dry run preserves JSON and ngrok header, excludes browser cookies and internal headers", async () => {
  process.env.CHECHE_API_BASE_URL = "https://fixture.ngrok-free.dev/";
  const body = JSON.stringify({ username: "fixture", password: "fixture-only" });
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://fixture.ngrok-free.dev/auth/user/login");
    assert.equal(init?.method, "POST");
    assert.equal(new TextDecoder().decode(init?.body as ArrayBuffer), body);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("ngrok-skip-browser-warning"), "1");
    assert.equal(headers.get("content-type"), "application/json");
    assert.equal(headers.get("cookie"), null);
    assert.equal(headers.get("origin"), null);
    assert.equal(headers.get("x-user-id"), null);
    assert.ok(headers.get("x-request-id"));
    assert.equal(init?.redirect, "manual");
    assert.equal(init?.cache, "no-store");
    return Response.json({ accessToken: "fixture-token" });
  };
  const response = await forwardGateway(new Request("http://localhost/gateway/auth/user/login", {
    method: "POST", body,
    headers: { "Content-Type": "application/json", Cookie: "private-cookie", Origin: "http://localhost", "X-User-Id": "spoofed" },
  }), ["auth", "user", "login"]);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).accessToken, "fixture-token");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok(response.headers.get("x-cheche-request-id"));
});

test("multipart bytes and boundary, JWT, query and error status survive forwarding", async () => {
  process.env.CHECHE_API_BASE_URL = "https://backend.example.test";
  const form = new FormData();
  form.set("photo", new Blob(["image-bytes"], { type: "image/png" }), "test.png");
  form.set("facilityId", "1");
  const request = new Request("http://localhost/gateway/api/inspections?regionCode=11710", { method: "POST", body: form, headers: { Authorization: "Bearer fixture-admin" } });
  const bytes = await request.clone().arrayBuffer();
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://backend.example.test/api/inspections?regionCode=11710");
    assert.deepEqual(init?.body, bytes);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("content-type"), request.headers.get("content-type"));
    assert.equal(headers.get("authorization"), "Bearer fixture-admin");
    assert.equal(headers.get("ngrok-skip-browser-warning"), null);
    return Response.json({ message: "already exists" }, { status: 409 });
  };
  const response = await forwardGateway(request, ["api", "inspections"]);
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { message: "already exists" });
});

test("204, text downloads and image bodies retain their content type", async () => {
  process.env.CHECHE_API_BASE_URL = "https://backend.example.test";
  for (const source of [new Response(null, { status: 204 }), new Response("점검 보고서", { headers: { "Content-Type": "text/plain;charset=utf-8", "Content-Disposition": "attachment; filename=report.txt" } }), new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "image/png" } })]) {
    const expected = await source.clone().arrayBuffer();
    globalThis.fetch = async () => source;
    const response = await forwardGateway(new Request("http://localhost/gateway/api/report"), ["api", "report"]);
    assert.equal(response.status, source.status);
    assert.equal(response.headers.get("content-type"), source.headers.get("content-type"));
    assert.deepEqual(await response.arrayBuffer(), expected);
  }
});

test("upstream redirects, tunnel HTML and connection failures become JSON errors", async () => {
  process.env.CHECHE_API_BASE_URL = "https://backend.example.test";
  for (const stub of [
    async () => new Response(null, { status: 302, headers: { Location: "https://elsewhere.test" } }),
    async () => new Response("ngrok warning", { headers: { "Content-Type": "text/html" } }),
    async () => { throw new TypeError("unreachable"); },
  ]) {
    globalThis.fetch = stub;
    const response = await forwardGateway(new Request("http://localhost/gateway/api/users/me"), ["api", "users", "me"]);
    assert.equal(response.status, 502);
    assert.ok((await response.json()).message);
  }
});

test("invalid paths, URL credentials and proxy loops are rejected before fetch", async () => {
  globalThis.fetch = async () => { assert.fail("must not fetch"); };
  process.env.CHECHE_API_BASE_URL = "https://backend.example.test";
  for (const segments of [[], [".."], ["api", "../secret"], ["api", "%2e%2e"], ["api", "\\evil"]]) {
    assert.equal((await forwardGateway(new Request("http://localhost/gateway/api"), segments)).status, 400);
  }
  for (const base of ["http://localhost", "https://user:secret@backend.example.test", "file:///etc", "invalid"]) {
    process.env.CHECHE_API_BASE_URL = base;
    assert.equal((await forwardGateway(new Request("http://localhost/gateway/api"), ["api"])).status, 503);
  }
});

test("offline ngrok tunnel is reported as a connection error, not a missing API route", async () => {
  process.env.CHECHE_API_BASE_URL = "https://fixture.ngrok-free.dev";
  globalThis.fetch = async () => new Response("The endpoint is offline. ERR_NGROK_3200", { status: 404, headers: { "Content-Type": "text/plain" } });
  const response = await forwardGateway(new Request("http://localhost/gateway/auth/user/login", { method: "POST", body: "{}" }), ["auth", "user", "login"]);
  assert.equal(response.status, 502);
  assert.match((await response.json()).message, /백엔드 연결/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("content-security-policy"), "default-src 'none'; sandbox");
});
