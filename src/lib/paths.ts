export const isResourceId = (
  value: string | null | undefined,
): value is string =>
  !!value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));

// Validate before URL parsing, which would silently normalize dot segments.
export function safeRelativePath(value: string) {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\#\u0000-\u001f\u007f]/.test(value)
  )
    return false;
  try {
    return value
      .split("?")[0]
      .slice(1)
      .split("/")
      .every((part) => {
        const decoded = decodeURIComponent(part);
        return (
          !!decoded &&
          decoded !== "." &&
          decoded !== ".." &&
          !/[/\\%?#\u0000-\u001f\u007f]/.test(decoded)
        );
      });
  } catch {
    return false;
  }
}

const publicRoutes = [
  "/",
  "/screens",
  "/login",
  "/register",
  "/admin/login",
  "/admin/register",
];
const fixedRoutes = [
  ...publicRoutes,
  "/setup-region",
  "/home",
  "/chat",
  "/my",
  "/facilities",
  "/facilities/external",
  "/reservations",
  "/reports",
  "/reports/new",
  "/admin",
  "/admin/setup-region",
  "/admin/actions",
  "/admin/history",
  "/admin/urgent",
  "/admin/admins",
  "/admin/regions",
  "/admin/facilities",
  "/admin/facilities/new",
  "/admin/inspections",
  "/admin/inspections/new",
];
export const isPublicPage = (path: string) => publicRoutes.includes(path);
export const isSuperPage = (path: string) =>
  ["/admin/admins", "/admin/regions", "/admin/urgent"].includes(path);
export function isPagePath(path: string) {
  if (fixedRoutes.includes(path)) return true;
  const match = path.match(
    /^\/(?:facilities\/([1-9]\d*)(?:\/reserve)?|reservations\/([1-9]\d*)|reports\/([1-9]\d*)|admin\/facilities\/([1-9]\d*)(?:\/edit)?|admin\/inspections\/([1-9]\d*)(?:\/(?:confirm|report))?)$/,
  );
  return !!match && isResourceId(match.slice(1).find(Boolean));
}

// The proxy is limited to the frontend API contract, including uploaded photos.
export function gatewayMethods(path: string): string[] {
  const id = "[1-9]\\d*";
  const routes: [RegExp, string[]][] = [
    [/^\/auth\/(?:user|admin)\/(?:login|register)$/, ["POST"]],
    [/^\/api\/(?:users|admins)\/(?:me|regions)$/, ["GET"]],
    [/^\/api\/(?:users|admins)\/me\/region$/, ["PUT"]],
    [/^\/api\/admins$/, ["GET"]],
    [new RegExp(`^/api/admins/${id}/authority$`), ["PATCH"]],
    [/^\/api\/user\/facilities\/home$/, ["GET"]],
    [/^\/api\/user\/facilities\/search$/, ["POST"]],
    [new RegExp(`^/api/user/facilities/${id}(?:/usage-guide)?$`), ["GET"]],
    [/^\/api\/user\/reservations\/availability$/, ["GET"]],
    [/^\/api\/user\/(?:reservations|reports)$/, ["GET", "POST"]],
    [new RegExp(`^/api/user/(?:reservations|reports)/${id}$`), ["GET"]],
    [new RegExp(`^/api/user/reservations/${id}/cancel$`), ["PATCH"]],
    [/^\/api\/facilities$/, ["GET", "POST"]],
    [new RegExp(`^/api/facilities/${id}$`), ["GET", "PUT"]],
    [/^\/api\/facilities\/public-data\/sync$/, ["POST"]],
    [/^\/api\/inspections$/, ["GET", "POST"]],
    [/^\/api\/inspections\/(?:open|dashboard)$/, ["GET"]],
    [new RegExp(`^/api/inspections/facilities/${id}/history$`), ["GET"]],
    [new RegExp(`^/api/inspections/public/facilities/${id}/status$`), ["GET"]],
    [new RegExp(`^/api/inspections/${id}/report$`), ["GET"]],
    [new RegExp(`^/api/inspections/${id}/action$`), ["PATCH"]],
    [/^\/(?:inspection-photos|report-photos|uploads)\/[^/]+$/, ["GET"]],
  ];
  const methods = routes.find(([pattern]) => pattern.test(path))?.[1] ?? [];
  return methods.includes("GET") ? [...methods, "HEAD"] : methods;
}
