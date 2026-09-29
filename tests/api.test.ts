import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError, AUTH_GUARD_DISABLED, tokenKey } from "../src/lib/api";
import { canCancel, canReserve, endTime, safeUrl } from "../src/lib/format";
import type { Facility, Reservation } from "../src/lib/types";
const originalFetch = globalThis.fetch;
const memory = new Map<string, string>();
let redirect = "";
Object.defineProperty(globalThis, "window", {
  value: {
    location: {
      assign: (path: string) => {
        redirect = path;
      },
    },
  },
  configurable: true,
});
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
  },
  configurable: true,
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  memory.clear();
  redirect = "";
});
test("Gateway only, account token separation and no internal headers", async () => {
  memory.set(tokenKey("admin"), "admin-token");
  memory.set(tokenKey("user"), "user-token");
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "http://localhost:8080/api/facilities");
    const h = new Headers(init?.headers);
    assert.equal(h.get("Authorization"), "Bearer admin-token");
    assert.equal(h.get("X-User-Id"), null);
    assert.equal(h.get("X-User-Role"), null);
    assert.equal(h.get("X-User-Region"), null);
    return Response.json([]);
  };
  await api("/api/facilities", "admin", {
    headers: {
      "X-User-Id": "forbidden",
      "X-User-Role": "SUPER_USER",
      "X-User-Region": "11710",
    },
  });
});
test("multipart leaves boundary generation to the browser", async () => {
  const form = new FormData();
  form.set("facilityId", "1");
  form.set("photo", new Blob(["photo"], { type: "image/png" }), "photo.png");
  globalThis.fetch = async (_, init) => {
    assert.equal(new Headers(init?.headers).get("Content-Type"), null);
    assert.equal(init?.body, form);
    return Response.json({ id: 1 });
  };
  await api("/api/inspections", "admin", {
    method: "POST",
    body: form,
    headers: { "Content-Type": "application/json" },
  });
});
test("empty 401 clears only the affected account and respects the redirect guard", async () => {
  memory.set(tokenKey("admin"), "a");
  memory.set(tokenKey("user"), "u");
  globalThis.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(
    api("/api/admins/me", "admin"),
    (e: unknown) => e instanceof ApiError && e.status === 401,
  );
  assert.equal(memory.has(tokenKey("admin")), false);
  assert.equal(memory.get(tokenKey("user")), "u");
  assert.equal(redirect, AUTH_GUARD_DISABLED ? "" : "/admin/login");
});
test("428 respects the setup redirect guard without clearing JWT", async () => {
  memory.set(tokenKey("user"), "u");
  globalThis.fetch = async () => new Response(null, { status: 428 });
  await assert.rejects(api("/api/user/facilities/home", "user"));
  assert.equal(redirect, AUTH_GUARD_DISABLED ? "" : "/setup-region");
  assert.equal(memory.get(tokenKey("user")), "u");
});
test("empty 403,409,503 errors and 204 success are supported", async () => {
  for (const status of [403, 409, 503]) {
    globalThis.fetch = async () => new Response(null, { status });
    await assert.rejects(
      api("/api/facilities", "admin"),
      (e: unknown) =>
        e instanceof ApiError && e.status === status && !!e.message,
    );
  }
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api("/api/facilities/1", "admin"), undefined);
});
test("reports return UTF-8 text, public login has no stored bearer", async () => {
  memory.set(tokenKey("admin"), "a");
  globalThis.fetch = async (_, init) => {
    assert.equal(new Headers(init?.headers).get("Authorization"), null);
    return new Response("체육시설 점검 보고서");
  };
  assert.equal(
    await api("/auth/admin/login", "admin", {}, { public: true, text: true }),
    "체육시설 점검 보고서",
  );
});
test("reservations require internal operating facilities and cancel before start", () => {
  const f = { id: 1, status: "OPERATING", source: null } as Facility;
  assert.equal(canReserve(f), true);
  for (const source of ["SEOUL_OPEN_API", "KSPO_OPEN_API"] as const)
    assert.equal(canReserve({ ...f, source }), false);
  assert.equal(canReserve({ ...f, status: "CLOSED" }), false);
  assert.equal(canReserve({ ...f, id: undefined }), false);
  const r = {
    status: "CONFIRMED",
    reservationDate: "2026-10-01",
    startTime: "19:00:00",
  } as Reservation;
  assert.equal(canCancel(r, new Date("2026-10-01T18:59:59")), true);
  assert.equal(canCancel(r, new Date("2026-10-01T19:00:00")), false);
  assert.equal(
    canCancel({ ...r, status: "CANCELLED" }, new Date("2026-10-01T18:00:00")),
    false,
  );
  assert.equal(endTime("21:00:00"), "22:00");
  assert.equal(safeUrl("javascript:alert(1)"), undefined);
});
