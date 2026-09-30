"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { useSession } from "@/components/shell";
import {
  Badge,
  Button,
  DataState,
  Empty,
  ErrorMessage,
  Field,
  Header,
  Sheet,
  Stats,
  Tabs,
} from "@/components/ui";
import { api, AUTH_GUARD_DISABLED, jsonBody } from "@/lib/api";
import { useApi, useMutation } from "@/lib/hooks";
import {
  listOf,
  type Facility,
  type Inspection,
  type ListResponse,
  type Profile,
  type RegionOption,
} from "@/lib/types";
import { label } from "@/lib/format";
export function AdminManagement() {
  const { profile, refresh } = useSession();
  const allowed = AUTH_GUARD_DISABLED || profile?.role === "SUPER_USER";
  const resource = useApi<ListResponse<Profile>>(
    allowed ? "/api/admins" : null,
    "admin",
  );
  const regions = useApi<ListResponse<RegionOption>>(
    allowed ? "/api/admins/regions" : null,
    "admin",
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Profile>();
  const mutation = useMutation();
  const rows = listOf(resource.data).filter((a) =>
    `${a.username} ${a.regionName ?? ""}`.includes(query),
  );
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    const role = String(form.get("role"));
    const regionCode = String(form.get("regionCode") ?? "");
    const regionName = listOf(regions.data).find(
      (r) => r.regionCode === regionCode,
    )?.regionName;
    await mutation.run(
      () =>
        api(
          `/api/admins/${selected.userId ?? selected.id}/authority`,
          "admin",
          {
            method: "PATCH",
            body: jsonBody({
              role,
              status: form.get("status"),
              regionCode: regionCode || null,
              regionName: regionName || null,
            }),
          },
        ),
      () => {
        setSelected(undefined);
        resource.reload();
        refresh();
      },
      "관리자 권한이 변경되었습니다.",
    );
  }
  return (
    <>
      <Header title="관리자 관리" back="/admin" />
      <div className="page-content">
        {!allowed ? (
          <Empty
            title="슈퍼 관리자 전용 화면입니다"
            description="관리자 계정의 권한을 확인해주세요."
          />
        ) : (
          <>
            <p className="muted text-sm mb-5">
              지역 관리자 계정과 권한을 관리합니다.
            </p>
            <Stats
              items={[
                {
                  label: "전체",
                  value: `${listOf(resource.data).length}명`,
                  tone: "blue",
                },
                {
                  label: "활성",
                  value: `${listOf(resource.data).filter((a) => a.status === "ACTIVE").length}명`,
                  tone: "green",
                },
                {
                  label: "정지",
                  value: `${listOf(resource.data).filter((a) => a.status === "SUSPENDED").length}명`,
                  tone: "amber",
                },
              ]}
            />
            <div className="search-input my-5">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="아이디 또는 지역 검색"
                aria-label="관리자 검색"
              />
            </div>
            <DataState {...resource} retry={resource.reload}>
              {rows.length ? (
                rows.map((a) => (
                  <button
                    className="admin-person"
                    key={a.userId ?? a.id}
                    onClick={() => {
                      mutation.setError("");
                      setSelected(a);
                    }}
                  >
                    <span className="avatar small">
                      {a.username.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>{a.username}</strong>
                      <p>
                        {a.regionName || "전체 지역"} · {label(a.role)}
                      </p>
                    </div>
                    <Badge value={a.status} />
                  </button>
                ))
              ) : (
                <Empty
                  title="관리자가 없습니다"
                  description="검색 조건을 변경해주세요."
                />
              )}
            </DataState>
          </>
        )}
      </div>
      {selected && (
        <Sheet
          title="관리자 권한 변경"
          busy={mutation.busy}
          onClose={() => setSelected(undefined)}
          footer={
            <Button
              form="admin-authority-form"
              type="submit"
              busy={mutation.busy}
              disabled={regions.loading || !!regions.error}
            >
              권한 변경 저장
            </Button>
          }
        >
          <form id="admin-authority-form" onSubmit={save} className="space-y-4">
            <p className="font-bold">{selected.username}</p>
            <Field label="역할">
              <select name="role" defaultValue={selected.role} required>
                <option value="REGIONAL_ADMIN">지역 관리자</option>
                <option value="SUPER_USER">슈퍼 관리자</option>
              </select>
            </Field>
            <Field label="계정 상태">
              <select name="status" defaultValue={selected.status} required>
                <option value="ACTIVE">활성</option>
                <option value="SUSPENDED">정지</option>
              </select>
            </Field>
            <Field label="담당 지역">
              <select
                name="regionCode"
                defaultValue={selected.regionCode ?? ""}
              >
                <option value="">미설정 / 전체 지역</option>
                {listOf(regions.data).map((r) => (
                  <option key={r.regionCode} value={r.regionCode}>
                    {r.regionName}
                  </option>
                ))}
              </select>
            </Field>
            <ErrorMessage message={regions.error} retry={regions.reload} />
            <p className="notice amber">
              변경한 권한은 해당 관리자의 다음 요청부터 적용됩니다.
            </p>
            <ErrorMessage message={mutation.error} />
          </form>
        </Sheet>
      )}
    </>
  );
}
export function RegionOverview() {
  const { profile } = useSession();
  const allowed = AUTH_GUARD_DISABLED || profile?.role === "SUPER_USER";
  const regions = useApi<ListResponse<RegionOption>>(
    allowed ? "/api/admins/regions" : null,
    "admin",
  );
  const facilities = useApi<ListResponse<Facility>>(
    allowed ? "/api/facilities" : null,
    "admin",
  );
  const inspections = useApi<ListResponse<Inspection>>(
    allowed ? "/api/inspections" : null,
    "admin",
  );
  const admins = useApi<ListResponse<Profile>>(
    allowed ? "/api/admins" : null,
    "admin",
  );
  const [sort, setSort] = useState("all");
  const rows = listOf(regions.data)
    .map((region) => {
      const selected = listOf(inspections.data).filter(
        (i) => i.regionCode === region.regionCode,
      );
      const open = selected.filter((i) => i.actionStatus !== "RESOLVED").length;
      return {
        ...region,
        facilities: listOf(facilities.data).filter(
          (f) => f.regionCode === region.regionCode,
        ).length,
        admins: listOf(admins.data).filter(
          (a) => a.regionCode === region.regionCode,
        ).length,
        open,
        rate: selected.length
          ? Math.round(((selected.length - open) / selected.length) * 100)
          : null,
      };
    })
    .sort((a, b) =>
      sort === "safe"
        ? (b.rate ?? -1) - (a.rate ?? -1)
        : sort === "open"
          ? b.open - a.open
          : 0,
    );
  const error =
    regions.error || facilities.error || inspections.error || admins.error;
  return (
    <>
      <Header title="지역별 안전 현황" back="/admin" />
      <div className="page-content">
        {!allowed ? (
          <Empty title="슈퍼 관리자 전용 화면입니다" />
        ) : (
          <>
            <p className="muted text-sm mb-5">
              서울 25개 자치구 · 시설 {listOf(facilities.data).length}개
            </p>
            <Tabs
              value={sort}
              onChange={setSort}
              items={[
                { label: "전체", value: "all" },
                { label: "조치 완료율 순", value: "safe" },
                { label: "미조치 순", value: "open" },
              ]}
            />
            <p className="muted text-[11px] mt-3">
              완료율: 해당 지역 점검 중 조치 완료 비율
            </p>
            <DataState
              loading={
                regions.loading ||
                facilities.loading ||
                inspections.loading ||
                admins.loading
              }
              error={error}
              retry={() => {
                regions.reload();
                facilities.reload();
                inspections.reload();
                admins.reload();
              }}
            >
              <div className="mt-5">
                {rows.map((r) => (
                  <article className="list-card" key={r.regionCode}>
                    <div>
                      <strong>{r.regionName}</strong>
                      <p>
                        시설 {r.facilities} · 관리자 {r.admins}
                      </p>
                      <small className="text-red-500">미조치 {r.open}</small>
                    </div>
                    <Badge
                      tone={
                        r.rate === null
                          ? "gray"
                          : r.rate >= 90
                            ? "green"
                            : "amber"
                      }
                    >
                      {r.rate === null ? "점검 없음" : `${r.rate}%`}
                    </Badge>
                  </article>
                ))}
              </div>
            </DataState>
          </>
        )}
      </div>
    </>
  );
}
