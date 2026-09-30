"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Camera,
  Wrench,
  FileText,
  History,
  RefreshCw,
  Search,
  Plus,
  LogOut,
  Building2,
} from "lucide-react";
import { useSession } from "@/components/shell";
import {
  Badge,
  Button,
  DataState,
  Empty,
  ErrorMessage,
  Field,
  Header,
  Notice,
  SectionTitle,
  Stats,
} from "@/components/ui";
import { api, clearLogin, jsonBody } from "@/lib/api";
import { dateLabel, label } from "@/lib/format";
import { useApi, useMutation } from "@/lib/hooks";
import {
  listOf,
  type Facility,
  type Inspection,
  type InspectionDashboard,
  type ListResponse,
  type Profile,
  type RegionOption,
  type SyncResult,
} from "@/lib/types";
export function InspectionRow({
  inspection: i,
  href,
}: {
  inspection: Inspection;
  href?: string;
}) {
  return (
    <Link className="list-card" href={href ?? `/admin/inspections/${i.id}`}>
      <div className="min-w-0">
        <strong>{i.facilityName}</strong>
        <p>
          {label(i.defectType)} · 위험도 {label(i.severity)}
        </p>
        <small>{dateLabel(i.createdAt)}</small>
      </div>
      <Badge value={i.actionStatus} />
    </Link>
  );
}
export function AdminHome() {
  const { profile } = useSession();
  return profile?.role === "SUPER_USER" ? (
    <SuperDashboard />
  ) : (
    <RegionalDashboard />
  );
}
function RegionalDashboard() {
  const { profile } = useSession();
  const dashboard = useApi<InspectionDashboard>(
    "/api/inspections/dashboard",
    "admin",
  );
  const facilities = useApi<ListResponse<Facility>>("/api/facilities", "admin");
  const inspections = useApi<ListResponse<Inspection>>(
    "/api/inspections",
    "admin",
  );
  const rows = listOf(inspections.data);
  const urgent = rows.filter(
    (i) =>
      i.actionStatus !== "RESOLVED" &&
      ["HIGH", "CRITICAL"].includes(i.severity),
  );
  const jobs = [
    {
      href: "/admin/inspections/new",
      title: "사진 점검 등록",
      sub: "새 점검 시작",
      icon: Camera,
      tone: "blue",
    },
    {
      href: "/admin/actions",
      title: "조치 현황",
      sub: `미조치 ${dashboard.data?.unresolvedInspections ?? "—"}건`,
      icon: Wrench,
      tone: "amber",
    },
    {
      href: "/admin/inspections?view=reports",
      title: "점검 보고서",
      sub: "보고서 확인·다운로드",
      icon: FileText,
      tone: "indigo",
    },
    {
      href: "/admin/history",
      title: "안전 이력",
      sub: "시설별 기록",
      icon: History,
      tone: "green",
    },
  ];
  return (
    <>
      <Header title="관리자 홈" />
      <div className="page-content admin-home">
        <div className="flex justify-between items-center">
          <p className="muted text-xs">{profile?.regionName} 관리자</p>
          <Badge>지역 관리자</Badge>
        </div>
        <SectionTitle
          detail={`전체 시설 ${facilities.data ? listOf(facilities.data).length : "—"}`}
        >
          오늘의 안전 현황
        </SectionTitle>
        <DataState {...dashboard} retry={dashboard.reload}>
          <Stats
            items={[
              {
                label: "조치 완료",
                value: dashboard.data?.resolvedInspections ?? 0,
                tone: "green",
              },
              {
                label: "전체 점검",
                value: dashboard.data?.totalInspections ?? 0,
                tone: "amber",
              },
              {
                label: "미조치",
                value: dashboard.data?.unresolvedInspections ?? 0,
                tone: "red",
              },
            ]}
          />
        </DataState>
        <ErrorMessage message={facilities.error} retry={facilities.reload} />
        {urgent.length > 0 && (
          <section className="priority-alert">
            <strong>우선 확인이 필요합니다</strong>
            {urgent.slice(0, 2).map((i) => (
              <Link href={`/admin/inspections/${i.id}`} key={i.id}>
                <Badge tone={i.severity === "CRITICAL" ? "red" : "amber"}>
                  {i.severity === "CRITICAL" ? "긴급" : "주의"}
                </Badge>
                <span>
                  {i.facilityName} · {label(i.defectType)}
                </span>
              </Link>
            ))}
          </section>
        )}
        <SectionTitle>주요 업무</SectionTitle>
        <div className="job-grid">
          {jobs.map((j) => (
            <Link href={j.href} key={j.href} className={j.tone}>
              <div>
                <strong>{j.title}</strong>
                <p>{j.sub}</p>
              </div>
              <j.icon size={19} />
            </Link>
          ))}
        </div>
        <SectionTitle href="/admin/inspections">최근 점검</SectionTitle>
        <DataState {...inspections} retry={inspections.reload}>
          {rows.length ? (
            <InspectionRow
              inspection={
                [...rows].sort((a, b) =>
                  b.createdAt.localeCompare(a.createdAt),
                )[0]
              }
            />
          ) : (
            <Empty
              title="등록된 점검이 없어요"
              description="시설을 선택하고 첫 사진 점검을 시작해주세요."
            />
          )}
        </DataState>
        <Link className="facility-management-link" href="/admin/facilities">
          <Building2 size={17} /> 관리 시설 · 공공데이터 동기화 <span>›</span>
        </Link>
        <AdminLogout />
      </div>
    </>
  );
}
export function SuperDashboard() {
  const dashboard = useApi<InspectionDashboard>(
    "/api/inspections/dashboard",
    "admin",
  );
  const facilities = useApi<ListResponse<Facility>>("/api/facilities", "admin");
  const admins = useApi<ListResponse<Profile>>("/api/admins", "admin");
  const inspections = useApi<ListResponse<Inspection>>(
    "/api/inspections",
    "admin",
  );
  const rows = listOf(inspections.data);
  const urgent = rows.filter(
    (i) =>
      i.actionStatus !== "RESOLVED" &&
      ["HIGH", "CRITICAL"].includes(i.severity),
  );
  const districts = Array.from(
    new Set(listOf(facilities.data).map((f) => f.regionName)),
  ).slice(0, 3);
  return (
    <>
      <Header title="슈퍼 관리자" badge={<Badge>서울 전체</Badge>} />
      <div className="page-content">
        <SectionTitle detail="서울 25개 자치구">
          서울 체육시설 현황
        </SectionTitle>
        <ErrorMessage
          message={
            dashboard.error ||
            facilities.error ||
            admins.error ||
            inspections.error
          }
          retry={() => {
            dashboard.reload();
            facilities.reload();
            admins.reload();
            inspections.reload();
          }}
        />
        <Stats
          items={[
            {
              label: "지역 관리자",
              value: admins.data
                ? `${listOf(admins.data).filter((a) => a.role === "REGIONAL_ADMIN").length}명`
                : "—",
              tone: "blue",
            },
            {
              label: "전체 시설",
              value: facilities.data
                ? `${listOf(facilities.data).length}개`
                : "—",
              tone: "indigo",
            },
            {
              label: "미조치",
              value: dashboard.data
                ? `${dashboard.data.unresolvedInspections}건`
                : "—",
              tone: "amber",
            },
            {
              label: "긴급",
              value: inspections.data ? `${urgent.length}건` : "—",
              tone: "red",
            },
          ]}
        />
        <SectionTitle href="/admin/regions">지역별 안전 현황</SectionTitle>
        {districts.map((region) => {
          const selected = rows.filter((i) => i.regionName === region);
          const done = selected.filter(
            (i) => i.actionStatus === "RESOLVED",
          ).length;
          const rate = selected.length
            ? Math.round((done / selected.length) * 100)
            : 0;
          return (
            <Link
              href="/admin/regions"
              className="region-progress"
              key={region}
            >
              <span>{region.replace("서울특별시 ", "")}</span>
              <div>
                <i style={{ width: `${rate}%` }} />
              </div>
              <strong>{selected.length ? `${rate}%` : "—"}</strong>
              <small>미조치 {selected.length - done}</small>
            </Link>
          );
        })}
        <p className="muted text-[10px] mt-2">
          비율은 전체 점검 중 조치 완료 비율입니다.
        </p>
        <SectionTitle href="/admin/admins" more="관리자 관리">
          지역 관리자 현황
        </SectionTitle>
        {listOf(admins.data)
          .slice(0, 3)
          .map((a) => (
            <Link
              key={a.userId ?? a.id}
              className="admin-summary-row"
              href="/admin/admins"
            >
              <strong>
                {a.regionName?.replace("서울특별시 ", "") ?? "전체 지역"}
              </strong>
              <span>{a.username}</span>
              <Badge value={a.status} />
            </Link>
          ))}
        <SectionTitle
          href="/admin/urgent"
          more={`${urgent.length}건 전체 보기`}
        >
          긴급 미조치
        </SectionTitle>
        {urgent.slice(0, 2).map((i) => (
          <InspectionRow key={i.id} inspection={i} />
        ))}
        {!urgent.length && !inspections.loading && !inspections.error && (
          <p className="muted text-sm">긴급 미조치 항목이 없습니다.</p>
        )}
        <Link href="/admin/facilities" className="button secondary mt-6">
          전체 시설 관리
        </Link>
        <Link href="/admin/inspections/new" className="button primary mt-3">
          사진 점검 등록
        </Link>
        <AdminLogout />
      </div>
    </>
  );
}
function AdminLogout() {
  const router = useRouter();
  return (
    <button
      className="admin-logout"
      onClick={() => {
        clearLogin("admin");
        router.replace("/admin/login");
      }}
    >
      <LogOut size={14} /> 로그아웃
    </button>
  );
}
export function AdminFacilities() {
  const resource = useApi<ListResponse<Facility>>("/api/facilities", "admin");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sync, setSync] = useState<SyncResult>();
  const mutation = useMutation();
  const rows = listOf(resource.data).filter(
    (f) =>
      (!status || f.status === status) &&
      `${f.name} ${f.address}`.includes(query),
  );
  return (
    <>
      <Header title="시설 관리" back="/admin" />
      <div className="page-content">
        <div className="flex gap-2 mb-5">
          <Button
            variant="secondary"
            className="compact flex-1"
            busy={mutation.busy}
            onClick={() => {
              setSync(undefined);
              void mutation.run(
                () =>
                  api<SyncResult>("/api/facilities/public-data/sync", "admin", {
                    method: "POST",
                  }),
                (r) => {
                  setSync(r);
                  resource.reload();
                },
              );
            }}
          >
            <RefreshCw size={15} /> 공공데이터 동기화
          </Button>
          <Link className="button primary compact" href="/admin/facilities/new">
            <Plus size={16} /> 등록
          </Link>
        </div>
        <ErrorMessage message={mutation.error} />
        {sync && (
          <Notice
            tone="success"
            className="mb-4"
            onDismiss={() => setSync(undefined)}
          >
            {sync.regionName} · {sync.scannedCount}건 조회
            <br />
            신규 {sync.createdCount}건 · 갱신 {sync.updatedCount}건
          </Notice>
        )}
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="시설 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="시설명 또는 주소 검색"
          />
        </div>
        <select
          className="mt-3"
          aria-label="운영 상태 필터"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">전체 운영 상태</option>
          {["OPERATING", "UNDER_INSPECTION", "CLOSED"].map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <SectionTitle detail={`${rows.length}개`}>관리 시설</SectionTitle>
        <DataState {...resource} retry={resource.reload}>
          {rows.length ? (
            rows.map((f) => (
              <Link
                key={f.id}
                className="list-card"
                href={`/admin/facilities/${f.id}`}
              >
                <div>
                  <strong>{f.name}</strong>
                  <p>
                    {f.type} · {f.regionName}
                  </p>
                  <small>{f.address}</small>
                </div>
                <Badge value={f.status} />
              </Link>
            ))
          ) : (
            <Empty
              title="시설이 없습니다"
              description="공공데이터를 동기화하거나 시설을 등록해주세요."
            />
          )}
        </DataState>
      </div>
    </>
  );
}
export function AdminFacilityDetail({ id }: { id: string }) {
  const resource = useApi<Facility>(`/api/facilities/${id}`, "admin");
  const history = useApi<ListResponse<Inspection>>(
    `/api/inspections/facilities/${id}/history`,
    "admin",
  );
  return (
    <>
      <Header title="시설 상세" back="/admin/facilities" />
      <div className="page-content">
        <DataState {...resource} retry={resource.reload}>
          {resource.data && (
            <>
              <Badge value={resource.data.status} />
              <h2 className="text-2xl font-bold mt-4">{resource.data.name}</h2>
              <p className="muted text-sm mt-2">
                {resource.data.type} · {resource.data.regionName}
              </p>
              <div className="info-list mt-5">
                <p>
                  <span>주소</span>
                  <strong>{resource.data.address}</strong>
                </p>
                <p>
                  <span>전화</span>
                  <strong>{resource.data.phone ?? "미등록"}</strong>
                </p>
              </div>
              <p className="notice mt-5">
                {resource.data.publicNotice || "공개 안내가 없습니다."}
              </p>
              <Link
                className="button secondary mt-5"
                href={`/admin/facilities/${id}/edit`}
              >
                시설 정보 수정
              </Link>
              <Link
                className="button primary mt-3"
                href={`/admin/inspections/new?facilityId=${id}`}
              >
                <Camera size={18} /> 사진 점검 등록
              </Link>
              <SectionTitle>시설 안전 이력</SectionTitle>
              <DataState {...history} retry={history.reload}>
                {listOf(history.data).length ? (
                  listOf(history.data).map((i) => (
                    <InspectionRow key={i.id} inspection={i} />
                  ))
                ) : (
                  <Empty
                    title="점검 이력이 없습니다"
                    description="사진 점검을 등록해 안전 이력을 시작하세요."
                  />
                )}
              </DataState>
            </>
          )}
        </DataState>
      </div>
    </>
  );
}
export function FacilityForm({ id }: { id?: string }) {
  const resource = useApi<Facility>(
    id ? `/api/facilities/${id}` : null,
    "admin",
  );
  const { profile } = useSession();
  const regions = useApi<ListResponse<RegionOption>>(
    "/api/admins/regions",
    "admin",
  );
  const mutation = useMutation();
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const regionCode =
      profile?.role === "SUPER_USER"
        ? String(f.get("regionCode"))
        : profile?.regionCode;
    const regionName =
      listOf(regions.data).find((r) => r.regionCode === regionCode)
        ?.regionName ?? profile?.regionName;
    await mutation.run(
      () =>
        api<Facility>(`/api/facilities${id ? "/" + id : ""}`, "admin", {
          method: id ? "PUT" : "POST",
          body: jsonBody({
            name: f.get("name"),
            type: f.get("type"),
            regionCode,
            regionName,
            address: f.get("address"),
            phone: f.get("phone") || null,
            status: f.get("status"),
            publicNotice: f.get("publicNotice") || null,
          }),
        }),
      (r) =>
        router.replace(
          r?.id || id
            ? `/admin/facilities/${r?.id ?? id}`
            : "/admin/facilities",
        ),
      id ? "시설 정보가 수정되었습니다." : "시설이 등록되었습니다.",
    );
  }
  return (
    <>
      <Header
        title={id ? "시설 정보 수정" : "시설 등록"}
        back={id ? `/admin/facilities/${id}` : "/admin/facilities"}
      />
      <div className="page-content">
        <DataState
          loading={resource.loading || regions.loading}
          error={resource.error || regions.error}
          retry={() => {
            resource.reload();
            regions.reload();
          }}
        >
          <form
            onSubmit={submit}
            className="space-y-5"
            key={resource.data?.id ?? "new"}
          >
            <Field label="시설명">
              <input
                name="name"
                required
                defaultValue={resource.data?.name}
                maxLength={150}
              />
            </Field>
            <Field label="시설 종류">
              <input
                name="type"
                required
                defaultValue={resource.data?.type}
                placeholder="예: 다목적체육관"
                maxLength={100}
              />
            </Field>
            <Field label="관리 지역">
              {profile?.role === "SUPER_USER" ? (
                <select
                  name="regionCode"
                  defaultValue={resource.data?.regionCode ?? ""}
                  required
                >
                  <option value="">지역 선택</option>
                  {listOf(regions.data).map((r) => (
                    <option key={r.regionCode} value={r.regionCode}>
                      {r.regionName}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={profile?.regionName ?? ""} readOnly />
              )}
            </Field>
            <ErrorMessage message={regions.error} retry={regions.reload} />
            <Field label="주소">
              <input
                name="address"
                required
                defaultValue={resource.data?.address}
                maxLength={300}
              />
            </Field>
            <Field label="전화번호">
              <input
                name="phone"
                type="tel"
                defaultValue={resource.data?.phone ?? ""}
                maxLength={40}
              />
            </Field>
            <Field label="운영 상태">
              <select
                name="status"
                defaultValue={resource.data?.status ?? "OPERATING"}
              >
                {["OPERATING", "UNDER_INSPECTION", "CLOSED"].map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="이용자 공개 안내">
              <textarea
                name="publicNotice"
                rows={4}
                maxLength={2000}
                defaultValue={resource.data?.publicNotice ?? ""}
              />
            </Field>
            <ErrorMessage message={mutation.error} />
            <Button
              busy={mutation.busy}
              disabled={
                regions.loading ||
                !!regions.error ||
                (!profile?.regionCode && profile?.role !== "SUPER_USER")
              }
            >
              시설 정보 저장
            </Button>
          </form>
        </DataState>
      </div>
    </>
  );
}
