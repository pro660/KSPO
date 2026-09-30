import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPagePath,
  isSuperPage,
  isResourceId,
  safeRelativePath,
} from "../src/lib/paths";
import {
  isCalendarDate,
  canReserve,
  isUrgentInspection,
} from "../src/lib/format";
import { isStoredFacility, readStoredArray } from "../src/lib/preferences";
import type { Facility, Inspection } from "../src/lib/types";

test("all user and admin routes are recognized; invalid IDs and nested routes are rejected", () => {
  for (const path of [
    "/",
    "/screens",
    "/login",
    "/register",
    "/setup-region",
    "/home",
    "/chat",
    "/my",
    "/facilities",
    "/facilities/external",
    "/facilities/1",
    "/facilities/1/reserve",
    "/reservations",
    "/reservations/1",
    "/reports",
    "/reports/new",
    "/reports/1",
    "/admin",
    "/admin/login",
    "/admin/register",
    "/admin/setup-region",
    "/admin/actions",
    "/admin/history",
    "/admin/urgent",
    "/admin/admins",
    "/admin/regions",
    "/admin/facilities",
    "/admin/facilities/new",
    "/admin/facilities/1",
    "/admin/facilities/1/edit",
    "/admin/inspections",
    "/admin/inspections/new",
    "/admin/inspections/1",
    "/admin/inspections/1/confirm",
    "/admin/inspections/1/report",
  ])
    assert.equal(isPagePath(path), true, path);
  for (const path of [
    "/facilities/0",
    "/facilities/01",
    "/facilities/-1",
    "/facilities/9007199254740992",
    "/facilities/1/edit",
    "/facilities/external/reserve",
    "/admin/facilities/new/edit",
    "/admin/inspections/new/report",
    "/other/facilities/1",
    "/reports/1/extra",
    "/missing",
  ])
    assert.equal(isPagePath(path), false, path);
  assert.equal(isSuperPage("/admin/urgent"), true);
  assert.equal(isResourceId("1?role=admin"), false);
});

test("relative paths reject literal, encoded and double-encoded traversal before URL normalization", () => {
  for (const path of [
    "/api/../../secret",
    "/api/%2e%2e/secret",
    "/api/%252e%252e/secret",
    "/gateway/uploads/a%2fb.jpg",
    "/api/users/me#fragment",
    "/api//users/me",
    "/api/users/me\u0000",
    "/api/%zz",
  ])
    assert.equal(safeRelativePath(path), false, path);
  assert.equal(
    safeRelativePath(
      "/api/user/reservations/availability?facilityId=1&date=2026-10-01",
    ),
    true,
  );
  assert.equal(safeRelativePath("/inspection-photos/점검%20사진.png"), true);
});

test("booking validates real calendar dates and the user's configured region", () => {
  for (const date of [
    "2026-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-00-00",
    "invalid",
  ])
    assert.equal(isCalendarDate(date), false);
  assert.equal(isCalendarDate("2028-02-29"), true);
  const facility = {
    id: 1,
    status: "OPERATING",
    regionCode: "11710",
  } as Facility;
  assert.equal(canReserve(facility, "11710"), true);
  assert.equal(canReserve(facility, "11680"), false);
  assert.equal(canReserve(facility, null), false);
  assert.equal(canReserve({ ...facility, id: 0 }), false);
});

test("urgent results contain only unresolved high/critical inspections", () => {
  for (const severity of ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const) {
    assert.equal(
      isUrgentInspection({ severity, actionStatus: "REVIEWING" } as Inspection),
      ["HIGH", "CRITICAL"].includes(severity),
    );
    assert.equal(
      isUrgentInspection({ severity, actionStatus: "RESOLVED" } as Inspection),
      false,
    );
  }
});

test("corrupt browser preferences cannot crash My or facility pages", () => {
  for (const payload of [
    "null",
    "{}",
    "bad-json",
    '[null, 1, {"name":"incomplete"}]',
  ]) {
    Object.defineProperty(globalThis, "localStorage", {
      value: { getItem: () => payload },
      configurable: true,
    });
    assert.deepEqual(readStoredArray("favorites", isStoredFacility), []);
  }
});
