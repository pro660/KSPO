import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RouteView } from "@/components/route-view";
import { Loading } from "@/components/ui";
import { isPagePath } from "@/lib/paths";
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const segments = (await params).path ?? [];
  const path = "/" + segments.join("/");
  if (!isPagePath(path)) notFound();
  return (
    <Suspense fallback={<Loading />}>
      <RouteView segments={segments} />
    </Suspense>
  );
}
