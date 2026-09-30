import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  ApiError,
  AUTH_GUARD_DISABLED,
  photoUrl,
  saveLogin,
  tokenKey,
} from "../src/lib/api";
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
    assert.equal(input, "/gateway/api/facilities");
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
  assert.equal(
    redirect,
    AUTH_GUARD_DISABLED ? "" : "/admin/login?reason=expired",
  );
});
test("428 respects the setup redirect guard without clearing JWT", async () => {
  memory.set(tokenKey("user"), "u");
  globalThis.fetch = async () => new Response(null, { status: 428 });
  await assert.rejects(api("/api/user/facilities/home", "user"));
  assert.equal(redirect, AUTH_GUARD_DISABLED ? "" : "/setup-region");
  assert.equal(memory.get(tokenKey("user")), "u");
});
test("a late 428 from an old login cannot redirect a newer session", async () => {
  memory.set(tokenKey("user"), "old-session");
  globalThis.fetch = async () => {
    memory.set(tokenKey("user"), "new-session");
    return new Response(null, { status: 428 });
  };
  await assert.rejects(api("/api/user/facilities/home", "user"));
  assert.equal(redirect, "");
  assert.equal(memory.get(tokenKey("user")), "new-session");
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

test("public auth strips a supplied bearer and sends uncached JSON requests", async () => {
  memory.set(tokenKey("user"), "stored-token");
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "/gateway/auth/user/login");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("authorization"), null);
    assert.equal(headers.get("x-user-account"), null);
    assert.equal(headers.get("accept"), "application/json");
    assert.equal(init?.credentials, "omit");
    assert.equal(init?.cache, "no-store");
    return new Response(null, { status: 401 });
  };
  await assert.rejects(
    api(
      "/auth/user/login",
      "user",
      { headers: { Authorization: "Bearer stale", "X-User-Account": "admin" } },
      { public: true },
    ),
    /아이디 또는 비밀번호/,
  );
  assert.equal(memory.get(tokenKey("user")), "stored-token");
  assert.equal(redirect, "");
});

test("invalid login payload cannot persist an undefined token", () => {
  for (const payload of [undefined, {}, { accessToken: "" }]) {
    assert.throws(() => saveLogin("user", payload as never), ApiError);
    assert.equal(memory.has(tokenKey("user")), false);
  }
});

test("a late 401 from an old session cannot clear a newer login", async () => {
  memory.set(tokenKey("user"), "old-token");
  globalThis.fetch = async () => {
    memory.set(tokenKey("user"), "new-token");
    return new Response(null, { status: 401 });
  };
  await assert.rejects(api("/api/users/me", "user"), ApiError);
  assert.equal(memory.get(tokenKey("user")), "new-token");
  assert.equal(redirect, "");
});

test("network errors and malformed API responses remain explicit errors", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Network failure");
  };
  await assert.rejects(
    api("/api/users/me", "user"),
    (e: unknown) => e instanceof ApiError && e.status === 0,
  );
  globalThis.fetch = async () => new Response("<html>tunnel warning</html>");
  await assert.rejects(api("/api/users/me", "user"), /서버 응답 형식/);
  const abort = new DOMException("Aborted", "AbortError");
  globalThis.fetch = async () => {
    throw abort;
  };
  await assert.rejects(
    api("/api/users/me", "user"),
    (e: unknown) => e === abort,
  );
});

test("API paths cannot target another origin; relative photos use Gateway", async () => {
  for (const path of [
    "//evil.test/api",
    "https://evil.test/api",
    "/\\evil.test",
    "/api/../../secret",
    "/api/%2e%2e/secret",
    "/api/%252e%252e/secret",
  ]) {
    await assert.rejects(api(path, "user"), /API 경로/);
  }
  assert.equal(photoUrl("/uploads/photo.jpg"), "/gateway/uploads/photo.jpg");
  assert.equal(photoUrl("uploads/photo.jpg"), "/gateway/uploads/photo.jpg");
  assert.equal(
    photoUrl("/gateway/inspection-photos/photo.png"),
    "/gateway/inspection-photos/photo.png",
  );
  assert.equal(
    photoUrl("/inspection-photos/점검 사진.png"),
    "/gateway/inspection-photos/점검 사진.png",
  );
  assert.equal(
    photoUrl("https://images.example.test/photo.jpg"),
    "https://images.example.test/photo.jpg",
  );
  assert.equal(photoUrl("javascript:alert(1)"), undefined);
  assert.equal(photoUrl("//evil.test/photo.jpg"), undefined);
  assert.equal(photoUrl("/gateway/../api/admins/me"), undefined);
  assert.equal(photoUrl("/uploads/%2e%2e/secret"), undefined);
  assert.equal(
    photoUrl("https://user:password@external.test/photo.jpg"),
    undefined,
  );
});
