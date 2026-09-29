"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { AUTH_GUARD_DISABLED, DEMO_MODE, token } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { accountForPath, getNavigation } from "@/lib/navigation";
import type { Account, Profile } from "@/lib/types";
import { ErrorMessage, Loading } from "./ui";
import { BottomNav } from "./bottom-nav";
const SessionContext = createContext<{
  profile: Profile | undefined;
  account: Account;
  refresh: () => void;
}>({ profile: undefined, account: "user", refresh: () => {} });
export const useSession = () => useContext(SessionContext);
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const account = accountForPath(path);
  const publicPage = [
    "/",
    "/login",
    "/register",
    "/admin/login",
    "/admin/register",
    "/screens",
  ].includes(path);
  const setup = path.endsWith("/setup-region");
  const profile = useApi<Profile>(
    publicPage ? null : `/api/${account === "admin" ? "admins" : "users"}/me`,
    account,
  );
  useEffect(() => {
    if (AUTH_GUARD_DISABLED) return;
    if (!publicPage && !token(account))
      router.replace(account === "admin" ? "/admin/login" : "/login");
  }, [publicPage, account, router]);
  useEffect(() => {
    if (AUTH_GUARD_DISABLED) return;
    if (
      profile.data &&
      !publicPage &&
      !setup &&
      !profile.data.regionCode &&
      profile.data.role !== "SUPER_USER"
    )
      router.replace(
        account === "admin" ? "/admin/setup-region" : "/setup-region",
      );
  }, [profile.data, publicPage, setup, account, router]);
  const navigation = getNavigation(path, profile.data?.role);
  return (
    <SessionContext.Provider
      value={{ profile: profile.data, account, refresh: profile.reload }}
    >
      <div className="app-shell">
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <i />
          <span>● 5G 100%</span>
        </div>
        {(DEMO_MODE || AUTH_GUARD_DISABLED) && (
          <Link href="/screens" className="demo-tag">
            {DEMO_MODE ? "샘플 미리보기" : "가드 임시 해제"}
          </Link>
        )}
        <main className={navigation ? "with-nav" : ""}>
          <div className="page-transition" key={path}>
            {!AUTH_GUARD_DISABLED && !publicPage && profile.loading ? (
              <Loading />
            ) : !AUTH_GUARD_DISABLED && !publicPage && profile.error ? (
              <div className="page-content">
                <ErrorMessage message={profile.error} retry={profile.reload} />
                <Link
                  className="text-link"
                  href={account === "admin" ? "/admin/login" : "/login"}
                >
                  로그인으로 이동
                </Link>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
        {navigation && <BottomNav navigation={navigation} />}
      </div>
    </SessionContext.Provider>
  );
}
