import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RouteView } from "@/components/route-view";
import { Loading } from "@/components/ui";
const routePattern =
  /^\/(?:|screens|login|register|setup-region|home|chat|my|facilities(?:\/(?:external|\d+)(?:\/reserve)?)?|reservations(?:\/\d+)?|reports(?:\/(?:new|\d+))?|admin(?:\/(?:login|register|setup-region|actions|history|urgent|admins|regions|facilities(?:\/(?:new|\d+)(?:\/edit)?)?|inspections(?:\/(?:new|\d+)(?:\/(?:confirm|report))?)?))?)$/;
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const segments = (await params).path ?? [];
  const path = "/" + segments.join("/");
  if (!routePattern.test(path) || /\/(new|external)\//.test(path)) notFound();
  return (
    <Suspense fallback={<Loading />}>
      <RouteView segments={segments} />
    </Suspense>
  );
}
