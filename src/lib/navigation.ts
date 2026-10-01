import type { Account, AdminRole } from "./types";

export type NavigationKind = "user" | "manager" | "super";
export type NavigationIcon =
  | "home"
  | "search"
  | "calendar"
  | "user"
  | "check"
  | "history"
  | "clipboard"
  | "dashboard"
  | "map"
  | "users"
  | "alert";
export type NavigationItem = {
  href: string;
  label: string;
  icon: NavigationIcon;
};

export const navigationItems: Record<NavigationKind, NavigationItem[]> = {
  user: [
    { href: "/home", label: "홈", icon: "home" },
    {
      href: "/facilities",
      label: "시설찾기",
      icon: "search",
    },
    {
      href: "/reservations",
      label: "예약내역",
      icon: "calendar",
    },
    { href: "/my", label: "마이", icon: "user" },
  ],
  manager: [
    { href: "/admin", label: "홈", icon: "home" },
    { href: "/admin/actions", label: "조치", icon: "check" },
    { href: "/admin/history", label: "이력", icon: "history" },
    { href: "/admin/inspections", label: "점검", icon: "clipboard" },
  ],
  super: [
    { href: "/admin", label: "대시보드", icon: "dashboard" },
    { href: "/admin/regions", label: "지역현황", icon: "map" },
    { href: "/admin/admins", label: "관리자", icon: "users" },
    { href: "/admin/urgent", label: "긴급조치", icon: "alert" },
  ],
};

const within = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

export const accountForPath = (path: string): Account =>
  within(path, "/admin") ? "admin" : "user";

export function getNavigation(path: string, role?: AdminRole) {
  if (
    [
      "/",
      "/login",
      "/register",
      "/find-id",
      "/find-password",
      "/admin/find-id",
      "/admin/find-password",
      "/setup-region",
      "/admin/login",
      "/admin/register",
      "/admin/setup-region",
    ].includes(path)
  )
    return null;

  let kind: NavigationKind;
  let activeHref: string;
  if (accountForPath(path) === "admin") {
    const superSection = [
      "/admin/regions",
      "/admin/admins",
      "/admin/urgent",
    ].find((root) => within(path, root));
    kind =
      role === "SUPER_USER" || (!role && superSection) ? "super" : "manager";
    activeHref =
      kind === "super"
        ? (superSection ?? "/admin")
        : (["/admin/actions", "/admin/history", "/admin/inspections"].find(
            (root) => within(path, root),
          ) ?? "/admin");
  } else {
    kind = "user";
    if (path === "/home" || path === "/chat") activeHref = "/home";
    else if (
      within(path, "/reservations") ||
      /^\/facilities\/\d+\/reserve$/.test(path)
    )
      activeHref = "/reservations";
    else if (within(path, "/facilities")) activeHref = "/facilities";
    else if (within(path, "/my") || within(path, "/reports"))
      activeHref = "/my";
    else return null;
  }
  return { kind, activeHref, items: navigationItems[kind] };
}
