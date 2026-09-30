// Server-side only: the upstream is configuration, never a client-supplied URL.
export function gatewayBaseUrl() {
  const value = process.env.CHECHE_API_BASE_URL || process.env.NEXT_PUBLIC_CHECHE_API_BASE_URL || "http://localhost:8080";
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Invalid Gateway URL");
  }
  return url.href.replace(/\/+$/, "");
}

export function isNgrokHost(hostname: string) {
  return ["ngrok-free.dev", "ngrok-free.app", "ngrok.app", "ngrok.io"].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

export async function forwardGateway(request: Request, segments: string[]): Promise<Response> {
  const requestId = crypto.randomUUID();
  const resultHeaders = {
    "Cache-Control": "no-store",
    "X-Cheche-Request-Id": requestId,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };
  const failure = (status: number, message: string) => Response.json({ message }, { status, headers: resultHeaders });
  if (!segments.length || segments.some((part) => !part || part === "." || part === ".." || /[/\\%\u0000-\u001f]/.test(part))) {
    return failure(400, "올바르지 않은 API 경로입니다.");
  }
  let upstream: URL;
  try {
    upstream = new URL(`${gatewayBaseUrl()}/${segments.map(encodeURIComponent).join("/")}`);
    upstream.search = new URL(request.url).search;
    if (upstream.origin === new URL(request.url).origin) throw new Error("Proxy loop");
  } catch {
    return failure(503, "서버 연결 설정을 확인해주세요.");
  }
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("X-Request-Id", requestId);
  if (isNgrokHost(upstream.hostname)) headers.set("ngrok-skip-browser-warning", "1");
  const timeout = AbortSignal.timeout(60000);
  let status = 502;
  let upstreamError = "";
  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: AbortSignal.any([request.signal, timeout]),
      cache: "no-store",
      redirect: "manual",
    });
    if (isNgrokHost(upstream.hostname) && !response.ok) {
      const type = response.headers.get("content-type") ?? "";
      if (type.includes("text/")) {
        const body = await response.clone().text();
        upstreamError = body.match(/ERR_NGROK_\d+/)?.[0] ?? "";
        if (upstreamError) {
          await response.body?.cancel();
          return failure(502, "백엔드 연결이 일시적으로 끊겼습니다. 잠시 후 다시 시도해주세요.");
        }
      }
    }
    // Never relay tunnel warning pages or follow redirects with a bearer token.
    if ((response.status >= 300 && response.status < 400) || response.headers.get("content-type")?.includes("text/html")) {
      await response.body?.cancel();
      return failure(502, "서버가 올바른 API 응답을 반환하지 않았습니다. 연결 주소를 확인해주세요.");
    }
    status = response.status;
    const outgoing = new Headers(resultHeaders);
    for (const name of ["content-type", "content-disposition", "retry-after"]) {
      const value = response.headers.get(name);
      if (value) outgoing.set(name, value);
    }
    return new Response(request.method === "HEAD" || [204, 205, 304].includes(status) ? null : response.body, {
      status,
      headers: outgoing,
    });
  } catch {
    status = timeout.aborted ? 504 : 502;
    return failure(status, timeout.aborted
      ? "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요."
      : "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    // Deliberately exclude request bodies, query strings and credentials.
    console.info(`[gateway] ${request.method} /${segments.map(encodeURIComponent).join("/")} ${status} requestId=${requestId}${upstreamError ? ` upstreamError=${upstreamError}` : ""}`);
  }
}
