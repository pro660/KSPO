"use client";
import { useState } from "react";
import { useSearchFilters } from "@/lib/use-search-filters";
import { searchFilters, regionFilters } from "@/lib/search-filters";
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
import { api, jsonBody } from "@/lib/api";
import { useApi, useMutation } from "@/lib/hooks";
import {
  listOf,
  type RegionalSafetySummary,
  type ListResponse,
  type Profile,
  type RegionOption,
} from "@/lib/types";
import { label, profileName } from "@/lib/format";
export function AdminManagement() {
  const { profile, refresh } = useSession();
  const allowed = profile?.role === "SUPER_USER";
  const resource = useApi<ListResponse<Profile>>(
    allowed ? "/api/admins" : null,
    "admin",
  );
  const regions = useApi<ListResponse<RegionOption>>(
    allowed ? "/api/admins/regions" : null,
    "admin",
  );
  const {
    filters: { q: query },
    setFilter,
  } = useSearchFilters(searchFilters);
  const [selected, setSelected] = useState<Profile>();
  const mutation = useMutation();
  const rows = listOf(resource.data).filter((a) =>
    `${profileName(a)} ${a.regionName ?? ""}`.includes(query),
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
              loading={resource.loading}
              items={[
                {
                  label: "전체",
                  value: resource.data
                    ? `${listOf(resource.data).length}명`
                    : "—",
                  tone: "blue",
                },
                {
                  label: "활성",
                  value: resource.data
                    ? `${listOf(resource.data).filter((a) => a.status === "ACTIVE").length}명`
                    : "—",
                  tone: "green",
                },
                {
                  label: "정지",
                  value: resource.data
                    ? `${listOf(resource.data).filter((a) => a.status === "SUSPENDED").length}명`
                    : "—",
                  tone: "amber",
                },
              ]}
            />
            <div className="search-input my-5">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setFilter("q", e.target.value)}
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
                      {profileName(a).slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>{profileName(a)}</strong>
                      <p>
                        {a.regionName ||
                          (a.role === "SUPER_USER"
                            ? "전체 지역"
                            : "지역 미설정")}{" "}
                        · {label(a.role)}
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
            <p className="font-bold">{profileName(selected)}</p>
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
  const allowed = profile?.role === "SUPER_USER";
  const safety = useApi<ListResponse<RegionalSafetySummary>>(
    allowed ? "/api/inspections/super/regions/safety" : null,
    "admin",
  );
  const admins = useApi<ListResponse<Profile>>(
    allowed ? "/api/admins" : null,
    "admin",
  );
  const {
    filters: { sort },
    setFilter,
  } = useSearchFilters(regionFilters);
  const rows = listOf(safety.data)
    .map((region) => {
      return {
        ...region,
        admins: listOf(admins.data).filter(
          (a) => a.regionCode === region.regionCode,
        ).length,
      };
    })
    .sort((a, b) =>
      sort === "safe"
        ? b.safetyScore - a.safetyScore
        : sort === "open"
          ? b.openInspections - a.openInspections
          : 0,
    );
  const error = safety.error || admins.error;
  return (
    <>
      <Header title="지역별 안전 현황" back="/admin" />
      <div className="page-content">
        {!allowed ? (
          <Empty title="슈퍼 관리자 전용 화면입니다" />
        ) : (
          <>
            <p className="muted text-sm mb-5">
              서울 25개 자치구 · 시설{" "}
              {safety.data
                ? `${rows.reduce((sum, region) => sum + region.facilityCount, 0)}개`
                : "—"}
            </p>
            <Tabs
              value={sort}
              onChange={(value) => setFilter("sort", value)}
              items={[
                { label: "전체", value: "all" },
                { label: "안전 점수 순", value: "safe" },
                { label: "미조치 순", value: "open" },
              ]}
            />
            <p className="muted text-[11px] mt-3">
              미해결 결함별 차감: 낮음 2 · 보통 5 · 높음 10 · 긴급 20점
            </p>
            <DataState
              loading={safety.loading || admins.loading}
              error={error}
              retry={() => {
                safety.reload();
                admins.reload();
              }}
            >
              <div className="mt-5">
                {rows.map((r) => (
                  <article className="list-card" key={r.regionCode}>
                    <div>
                      <strong>{r.regionName}</strong>
                      <p>
                        시설 {r.facilityCount} · 관리자 {r.admins}
                      </p>
                      <small className="text-red-500">
                        미조치 {r.openInspections} · 고위험{" "}
                        {r.highRiskOpenInspections}
                      </small>
                    </div>
                    <Badge tone={r.safetyScore >= 90 ? "green" : "amber"}>
                      {r.safetyScore}점
                    </Badge>
                  </article>
                ))}
                {!rows.length && <Empty title="지역 안전 집계가 없습니다" />}
              </div>
            </DataState>
          </>
        )}
      </div>
    </>
  );
}
