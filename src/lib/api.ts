import type { Account, LoginResponse } from "./types";
import { safeRelativePath } from "./paths";
export const API_BASE_URL = "/gateway";
export const tokenKey = (account: Account) =>
  account === "admin" ? "checheAdminToken" : "checheUserToken";
export function token(account: Account) {
  try {
    return typeof window === "undefined"
      ? null
      : localStorage.getItem(tokenKey(account));
  } catch {
    return null;
  }
}
export function subscribeAuth(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("cheche-session", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("cheche-session", onChange);
  };
}
export function saveLogin(account: Account, data: LoginResponse) {
  if (
    !data ||
    typeof data.accessToken !== "string" ||
    !data.accessToken.trim()
  ) {
    throw new ApiError(
      502,
      "로그인 응답을 확인할 수 없습니다. 다시 시도해주세요.",
    );
  }
  localStorage.setItem(tokenKey(account), data.accessToken);
  window.dispatchEvent?.(new Event("cheche-session"));
}
export function clearLogin(account: Account) {
  localStorage.removeItem(tokenKey(account));
  window.dispatchEvent?.(new Event("cheche-session"));
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export const statusMessages: Record<number, string> = {
  400: "입력 내용을 확인해주세요.",
  401: "로그인이 만료되었습니다. 다시 로그인해주세요.",
  403: "이 기능을 사용할 권한이 없습니다.",
  404: "요청한 정보를 찾을 수 없습니다.",
  409: "이미 처리되었거나 다른 요청과 중복됩니다. 최신 상태를 확인해주세요.",
  413: "첨부 파일이나 입력 내용이 너무 큽니다. 사진은 15MB 이하로 선택해주세요.",
  428: "먼저 담당 지역을 설정해주세요.",
  502: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
  503: "서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
  504: "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
};
export async function api<T>(
  path: string,
  account: Account,
  init: RequestInit = {},
  options: { public?: boolean; text?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  if (!/^\/(api|auth)\//.test(path) || !safeRelativePath(path))
    throw new Error("올바르지 않은 API 경로입니다.");
  const headers = new Headers(init.headers);
  for (const key of [...headers.keys()]) {
    if (key.toLowerCase().startsWith("x-user-")) headers.delete(key);
  }
  headers.delete("Authorization");
  const requestToken = options.public ? null : token(account);
  if (requestToken) headers.set("Authorization", `Bearer ${requestToken}`);
  if (init.body instanceof FormData) headers.delete("Content-Type");
  else if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (!headers.has("Accept"))
    headers.set("Accept", options.text ? "text/plain" : "application/json");
  const timeout = AbortSignal.timeout(65000);
  const callerSignal = options.signal ?? init.signal;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      timeout.aborted ? 504 : 0,
      timeout.aborted
        ? statusMessages[504]
        : "서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해주세요.",
    );
  }
  if (!response.ok) {
    if (
      response.status === 401 &&
      !options.public &&
      token(account) === requestToken
    ) {
      clearLogin(account);
      window.location.assign(
        account === "admin"
          ? "/admin/login?reason=expired"
          : "/login?reason=expired",
      );
    }
    if (
      response.status === 428 &&
      !options.public &&
      token(account) === requestToken &&
      window.location.pathname !==
        (account === "admin" ? "/admin/setup-region" : "/setup-region")
    )
      window.location.assign(
        account === "admin" ? "/admin/setup-region" : "/setup-region",
      );
    let detail = "";
    try {
      const body = await response.json();
      if (typeof body.message === "string") detail = body.message;
    } catch {}
    throw new ApiError(
      response.status,
      detail ||
        (options.public && response.status === 401
          ? "아이디 또는 비밀번호를 확인해주세요."
          : options.public && path.endsWith("/login") && response.status === 403
            ? "아이디·비밀번호 또는 계정 상태를 확인해주세요."
            : options.public &&
                path.endsWith("/register") &&
                response.status === 403
              ? "회원가입을 처리할 수 없습니다. 아이디 중복 여부와 입력 내용을 확인해주세요."
              : "") ||
        statusMessages[response.status] ||
        `요청에 실패했습니다. (${response.status})`,
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  if (options.text) return body as T;
  if (!body.trim()) return undefined as T;
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ApiError(response.status, "서버 응답 형식을 확인할 수 없습니다.");
  }
}
export function photoUrl(path?: string | null) {
  if (!path) return undefined;
  try {
    if (path.startsWith("//") || path.includes("\\")) return undefined;
    if (!/^[a-z][a-z\d+.-]*:/i.test(path)) {
      const relative = `/${path.replace(/^\/+/, "")}`;
      if (!safeRelativePath(relative)) return undefined;
      return relative.startsWith(`${API_BASE_URL}/`)
        ? relative
        : `${API_BASE_URL}${relative}`;
    }
    const u = new URL(path);
    if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
      return undefined;
    const legacyBase = process.env.NEXT_PUBLIC_CHECHE_API_BASE_URL;
    if (legacyBase && u.origin === new URL(legacyBase).origin) {
      const basePath = new URL(legacyBase).pathname.replace(/\/+$/, "");
      if (u.pathname.startsWith(`${basePath}/`))
        return `${API_BASE_URL}${u.pathname.slice(basePath.length)}${u.search}`;
    }
    return u.href;
  } catch {
    return undefined;
  }
}
export const jsonBody = (body: unknown) => JSON.stringify(body);
