import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { fetchPhoto } from "../src/lib/photos";
import { ApiError } from "../src/lib/api";

const originalFetch = globalThis.fetch;
Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) =>
      key === "checheAdminToken" ? "test-admin-token" : "test-user-token",
  },
  configurable: true,
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("protected photos carry the correct account JWT, omit cookies and retain image bytes", async () => {
  for (const account of ["admin", "user"] as const) {
    const controller = new AbortController();
    globalThis.fetch = async (input, options) => {
      assert.equal(input, "/gateway/inspection-photos/점검 사진.png");
      const headers = new Headers(options?.headers);
      assert.equal(
        headers.get("Authorization"),
        `Bearer test-${account}-token`,
      );
      assert.equal(headers.get("Accept"), "image/*");
      assert.equal(options?.credentials, "omit");
      assert.equal(options?.cache, "no-store");
      controller.abort();
      assert.equal(options?.signal?.aborted, true);
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: { "Content-Type": "image/png" },
      });
    };
    const photo = await fetchPhoto(
      "/gateway/inspection-photos/점검 사진.png",
      account,
      controller.signal,
    );
    assert.deepEqual(
      new Uint8Array(await photo.arrayBuffer()),
      new Uint8Array([1, 2, 3]),
    );
  }
});

test("external hosts cannot receive photo credentials", async () => {
  globalThis.fetch = async () => {
    assert.fail("Must not fetch external URLs");
  };
  for (const path of [
    "https://external.test/photo.png",
    "//external.test/photo.png",
    "/gateway\\external.test/photo.png",
    "/other/photo.png",
    "/gateway/../../secret",
    "/gateway/%2e%2e/secret",
  ]) {
    await assert.rejects(
      fetchPhoto(path, "admin", new AbortController().signal),
      /사진 경로/,
    );
  }
});

test("missing, unauthorized and non-image responses produce actionable errors", async () => {
  for (const status of [404, 401, 403, 502]) {
    globalThis.fetch = async () => new Response(null, { status });
    await assert.rejects(
      fetchPhoto(
        "/gateway/inspection-photos/missing.png",
        "admin",
        new AbortController().signal,
      ),
      (error: unknown) =>
        error instanceof ApiError && error.status === status && !!error.message,
    );
  }
  globalThis.fetch = async () => Response.json({ error: "not an image" });
  await assert.rejects(
    fetchPhoto(
      "/gateway/inspection-photos/wrong.png",
      "admin",
      new AbortController().signal,
    ),
    /사진 응답/,
  );
});
