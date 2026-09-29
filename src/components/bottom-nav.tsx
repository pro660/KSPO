import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Home,
  Search,
  CalendarDays,
  UserRound,
  Check,
  History,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  UsersRound,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { getNavigation, type NavigationIcon } from "@/lib/navigation";

const icons: Record<NavigationIcon, LucideIcon> = {
  home: Home,
  search: Search,
  calendar: CalendarDays,
  user: UserRound,
  check: Check,
  history: History,
  clipboard: ClipboardList,
  dashboard: LayoutDashboard,
  map: MapPinned,
  users: UsersRound,
  alert: TriangleAlert,
};

export function BottomNav({
  navigation,
}: {
  navigation: NonNullable<ReturnType<typeof getNavigation>>;
}) {
  const { kind, activeHref, items } = navigation;
  const label = {
    user: "사용자 메뉴",
    manager: "관리자 메뉴",
    super: "슈퍼 관리자 메뉴",
  }[kind];
  return (
    <nav
      className={`bottom-nav bottom-nav--${kind}`}
      aria-label={label}
      style={
        {
          "--nav-active-index": items.findIndex(
            (item) => item.href === activeHref,
          ),
        } as CSSProperties
      }
    >
      {items.map((item) => {
        const active = item.href === activeHref;
        const Icon = icons[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className="bottom-nav-icon"
              size={22}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
