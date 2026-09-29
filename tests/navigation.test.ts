import assert from "node:assert/strict";
import { test } from "node:test";
import { accountForPath, getNavigation } from "../src/lib/navigation";

test("user subpages retain the correct menu, including booking and chat", () => {
  for (const [path, activeHref] of [
    ["/home", "/home"],
    ["/chat", "/home"],
    ["/facilities/1", "/facilities"],
    ["/facilities/external", "/facilities"],
    ["/facilities/1/reserve", "/reservations"],
    ["/reservations/1", "/reservations"],
    ["/reports/new", "/my"],
    ["/reports/1", "/my"],
  ]) {
    const nav = getNavigation(path, "SUPER_USER");
    assert.equal(nav?.kind, "user");
    assert.equal(nav?.activeHref, activeHref);
    assert.ok(nav?.items.every((item) => !item.href.startsWith("/admin")));
  }
});

test("regional inspectors retain the inspection tab throughout the workflow", () => {
  for (const path of [
    "/admin/inspections",
    "/admin/inspections/new",
    "/admin/inspections/1",
    "/admin/inspections/1/confirm",
    "/admin/inspections/1/report",
  ]) {
    const nav = getNavigation(path, "REGIONAL_ADMIN");
    assert.equal(nav?.kind, "manager");
    assert.equal(nav?.activeHref, "/admin/inspections");
  }
  assert.equal(getNavigation("/admin/actions")?.activeHref, "/admin/actions");
  assert.equal(getNavigation("/admin/history")?.activeHref, "/admin/history");
  assert.equal(getNavigation("/admin/facilities/1/edit")?.activeHref, "/admin");
});

test("super administrators receive their own navigation on dashboard and shared pages", () => {
  for (const path of ["/admin", "/admin/facilities", "/admin/inspections/1"]) {
    const nav = getNavigation(path, "SUPER_USER");
    assert.equal(nav?.kind, "super");
    assert.deepEqual(
      nav?.items.map((item) => item.label),
      ["대시보드", "지역현황", "관리자", "긴급조치"],
    );
  }
  for (const path of ["/admin/regions", "/admin/admins", "/admin/urgent"]) {
    assert.equal(getNavigation(path)?.kind, "super");
    assert.equal(getNavigation(path)?.activeHref, path);
  }
});

test("entry and setup pages have no bottom navigation and account routes are bounded", () => {
  for (const path of [
    "/",
    "/screens",
    "/login",
    "/register",
    "/setup-region",
    "/admin/login",
    "/admin/register",
    "/admin/setup-region",
  ]) {
    assert.equal(getNavigation(path, "SUPER_USER"), null);
  }
  assert.equal(accountForPath("/admin/inspections"), "admin");
  assert.equal(accountForPath("/administrator"), "user");
  assert.equal(getNavigation("/unknown"), null);
});
