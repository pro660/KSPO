import { API_BASE_URL, ApiError, token } from "./api";
import type { Account } from "./types";
import { safeRelativePath } from "./paths";

// Only send the account token to our own Gateway, never to external image hosts.
export async function fetchPhoto(
  source: string,
  account: Account,
  signal: AbortSignal,
): Promise<Blob> {
  if (!source.startsWith(`${API_BASE_URL}/`) || !safeRelativePath(source)) {
    throw new Error("올바르지 않은 사진 경로입니다.");
  }
  const headers = new Headers({ Accept: "image/*" });
  const accessToken = token(account);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(source, {
    headers,
    credentials: "omit",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.status === 404
        ? "사진 파일을 찾을 수 없습니다. 등록한 사진을 확인해주세요."
        : response.status === 401 || response.status === 403
          ? "이 사진을 볼 수 있는 권한을 확인해주세요."
          : "잠시 후 다시 시도해주세요.",
    );
  }
  if (
    !response.headers.get("content-type")?.toLowerCase().startsWith("image/")
  ) {
    throw new ApiError(
      502,
      "사진 응답을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.",
    );
  }
  return response.blob();
}
