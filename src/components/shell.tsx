"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { token, subscribeAuth } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { accountForPath, getNavigation } from "@/lib/navigation";
import type { Account, Profile } from "@/lib/types";
import { isPagePath, isPublicPage, isSuperPage } from "@/lib/paths";
import { Empty, ErrorMessage, Loading } from "./ui";
import { BottomNav } from "./bottom-nav";
const SessionContext = createContext<{
  profile: Profile | undefined;
  account: Account;
  refresh: () => void;
  updateProfile: (profile: Profile) => void;
}>({
  profile: undefined,
  account: "user",
  refresh: () => {},
  updateProfile: () => {},
});
export const useSession = () => useContext(SessionContext);
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const account = accountForPath(path);
  const publicPage = isPublicPage(path) || !isPagePath(path);
  const accessToken = useSyncExternalStore(
    subscribeAuth,
    () => token(account),
    () => null,
  );
  const setup = path.endsWith("/setup-region");
  const profile = useApi<Profile>(
    publicPage || !accessToken
      ? null
      : `/api/${account === "admin" ? "admins" : "users"}/me`,
    account,
    accessToken ?? "",
  );
  useEffect(() => {
    if (!publicPage && !token(account))
      router.replace(account === "admin" ? "/admin/login" : "/login");
  }, [publicPage, account, router, accessToken]);
  useEffect(() => {
    if (
      profile.data &&
      !publicPage &&
      !setup &&
      profile.data.status !== "SUSPENDED" &&
      !profile.data.regionCode &&
      profile.data.role !== "SUPER_USER"
    )
      router.replace(
        account === "admin" ? "/admin/setup-region" : "/setup-region",
      );
  }, [profile.data, publicPage, setup, account, router]);
  const needsRegion =
    !setup &&
    !!profile.data &&
    profile.data.status !== "SUSPENDED" &&
    !profile.data.regionCode &&
    profile.data.role !== "SUPER_USER";
  const forbidden =
    account === "admin" &&
    !!profile.data &&
    (profile.data.status === "SUSPENDED" ||
      !["REGIONAL_ADMIN", "SUPER_USER"].includes(profile.data.role ?? "") ||
      (isSuperPage(path) && profile.data.role !== "SUPER_USER"));
  const navigation =
    !publicPage &&
    !!profile.data &&
    !needsRegion &&
    profile.data.status !== "SUSPENDED"
      ? getNavigation(path, profile.data?.role)
      : null;
  return (
    <SessionContext.Provider
      value={{
        profile: profile.data,
        account,
        refresh: profile.reload,
        updateProfile: profile.setData,
      }}
    >
      <div className="app-shell">
        <main className={navigation ? "with-nav" : ""}>
          <div className="page-transition" key={path}>
            {!publicPage && (!accessToken || profile.loading || needsRegion) ? (
              <Loading />
            ) : !publicPage && (profile.error || !profile.data) ? (
              <div className="page-content">
                <ErrorMessage
                  message={
                    profile.error ||
                    "계정 정보를 확인할 수 없습니다. 다시 로그인해주세요."
                  }
                  retry={profile.reload}
                />
                <Link
                  className="text-link"
                  href={account === "admin" ? "/admin/login" : "/login"}
                >
                  로그인으로 이동
                </Link>
              </div>
            ) : !publicPage && forbidden ? (
              <Empty
                title={
                  profile.data?.status === "SUSPENDED"
                    ? "이용이 정지된 관리자 계정입니다"
                    : "이 화면을 사용할 권한이 없습니다"
                }
                description="관리자 계정의 권한을 확인해주세요."
              >
                <Link
                  className="button secondary mt-4"
                  href={
                    profile.data?.status === "SUSPENDED"
                      ? "/admin/login"
                      : "/admin"
                  }
                >
                  돌아가기
                </Link>
              </Empty>
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
