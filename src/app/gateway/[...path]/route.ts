import { forwardGateway } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardGateway(request, (await context.params).path);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
