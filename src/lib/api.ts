import type { Account, LoginResponse } from "./types";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_CHECHE_API_BASE_URL ?? "http://localhost:8080";
export const DEMO_MODE = process.env.NEXT_PUBLIC_CHECHE_DEMO_MODE === "true";
export const AUTH_GUARD_DISABLED =
  process.env.NEXT_PUBLIC_CHECHE_DISABLE_AUTH_GUARD === "true";
export const tokenKey = (account: Account) =>
  account === "admin" ? "checheAdminToken" : "checheUserToken";
export function token(account: Account) {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem(tokenKey(account));
}
export function saveLogin(account: Account, data: LoginResponse) {
  localStorage.setItem(tokenKey(account), data.accessToken);
}
export function clearLogin(account: Account) {
  localStorage.removeItem(tokenKey(account));
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
  428: "먼저 담당 지역을 설정해주세요.",
  503: "서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
};
export async function api<T>(
  path: string,
  account: Account,
  init: RequestInit = {},
  options: { public?: boolean; text?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  if (!path.startsWith("/")) throw new Error("올바르지 않은 API 경로입니다.");
  if (DEMO_MODE) {
    const { demoRequest } = await import("./demo");
    return demoRequest(path, account, init) as Promise<T>;
  }
  const headers = new Headers(init.headers);
  ["X-User-Id", "X-User-Role", "X-User-Region"].forEach((key) =>
    headers.delete(key),
  );
  if (!options.public && token(account))
    headers.set("Authorization", `Bearer ${token(account)}`);
  if (init.body instanceof FormData) headers.delete("Content-Type");
  else if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: options.signal ?? init.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      0,
      "서버에 연결할 수 없습니다. Gateway 실행 상태와 네트워크를 확인해주세요.",
    );
  }
  if (!response.ok) {
    if (response.status === 401 && !options.public) {
      clearLogin(account);
      if (!AUTH_GUARD_DISABLED)
        window.location.assign(account === "admin" ? "/admin/login" : "/login");
    }
    if (response.status === 428 && !options.public && !AUTH_GUARD_DISABLED)
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
    const u = new URL(path, API_BASE_URL);
    return ["http:", "https:"].includes(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}
export const jsonBody = (body: unknown) => JSON.stringify(body);
