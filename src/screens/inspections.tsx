"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchFilters } from "@/lib/use-search-filters";
import {
  inspectionFilters,
  urgentFilters,
  historyFilters,
} from "@/lib/search-filters";
import { Check, Download, Search } from "lucide-react";
import { RemotePhoto } from "@/components/remote-photo";
import {
  Badge,
  Button,
  DataState,
  Empty,
  ErrorMessage,
  Field,
  Header,
  PhotoPicker,
  SectionTitle,
  Sheet,
  Stats,
  Tabs,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import {
  dateLabel,
  label,
  isUrgentInspection,
  localDate,
  isCalendarDate,
} from "@/lib/format";
import { isResourceId } from "@/lib/paths";
import { useApi, useMutation } from "@/lib/hooks";
import {
  listOf,
  type Facility,
  type Inspection,
  type ListResponse,
  type Severity,
} from "@/lib/types";
import { InspectionRow } from "./admin";
export function InspectionNew() {
  const params = useSearchParams();
  const facilities = useApi<ListResponse<Facility>>("/api/facilities", "admin");
  const [selected, setSelected] = useState(params.get("facilityId") ?? "");
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation();
  const router = useRouter();
  const facility = listOf(facilities.data).find(
    (f) => String(f.id) === selected,
  );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!facility || !file) return;
    if (!facility.regionCode || !facility.regionName) {
      mutation.setError(
        "시설의 관리 지역을 확인할 수 없습니다. 시설 정보를 다시 불러와주세요.",
      );
      return;
    }
    const form = new FormData(e.currentTarget);
    form.set("facilityId", String(facility.id));
    form.set("facilityName", facility.name);
    form.set("facilityRegionCode", facility.regionCode);
    form.set("facilityRegionName", facility.regionName);
    form.set("photo", file);
    await mutation.run(
      () =>
        api<Inspection>("/api/inspections", "admin", {
          method: "POST",
          body: form,
        }),
      (i) =>
        router.replace(
          i?.id ? `/admin/inspections/${i.id}` : "/admin/inspections",
        ),
      "사진 점검이 등록되었습니다.",
    );
  }
  return (
    <>
      <Header title="사진 점검 등록" back="/admin" />
      <div className="page-content">
        <DataState {...facilities} retry={facilities.reload}>
          {!listOf(facilities.data).length ? (
            <Empty
              title="점검할 시설이 없습니다"
              description="먼저 관리 시설을 등록하거나 동기화해주세요."
            >
              <Link href="/admin/facilities" className="button primary mt-5">
                시설 관리
              </Link>
            </Empty>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <Field label="점검 시설">
                <select
                  required
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">시설을 선택해주세요</option>
                  {listOf(facilities.data).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>
              {facility && (
                <div className="notice indigo">
                  <strong>{facility.name}</strong>
                  <p className="text-xs mt-1">
                    {facility.regionName} · {facility.type}
                  </p>
                </div>
              )}
              <h2 className="font-semibold text-lg">
                손상 부위를 촬영해주세요
              </h2>
              <PhotoPicker file={file} onChange={setFile} />
              <div className="photo-tips">
                <strong>촬영 TIP</strong>
                <p>
                  ✓ 손상 부위를 가까이 촬영해주세요.
                  <br />✓ 흔들리지 않게 촬영해주세요.
                  <br />✓ 위치를 알 수 있도록 주변도 담아주세요.
                </p>
              </div>
              <Field label="발견 위치">
                <input
                  name="locationDescription"
                  required
                  maxLength={240}
                  placeholder="예: 2층 관중석 서쪽 벽면"
                />
              </Field>
              <Field label="의심 결함">
                <input
                  name="suspectedDefect"
                  maxLength={100}
                  placeholder="예: 균열"
                />
              </Field>
              <Field label="점검 메모">
                <textarea
                  name="note"
                  rows={3}
                  maxLength={2000}
                  placeholder="현장에서 확인한 내용을 입력해주세요."
                />
              </Field>
              <p className="muted text-xs">점검 1건에 사진 1장을 등록합니다.</p>
              <ErrorMessage message={mutation.error} />
              <Button busy={mutation.busy} disabled={!file || !facility}>
                {mutation.busy
                  ? "사진을 등록하고 분석 중입니다"
                  : "AI 결함 분석하기"}
              </Button>
            </form>
          )}
        </DataState>
      </div>
    </>
  );
}
function useInspection(id: string) {
  const resource = useApi<ListResponse<Inspection>>(
    "/api/inspections",
    "admin",
  );
  return {
    ...resource,
    inspection: listOf(resource.data).find((i) => String(i.id) === id),
  };
}
function InspectionPhoto({ inspection: i }: { inspection: Inspection }) {
  return (
    <RemotePhoto
      path={i.photoUrl}
      account="admin"
      alt={`${i.facilityName} 점검 사진`}
    />
  );
}
export function InspectionDetail({ id }: { id: string }) {
  const resource = useInspection(id);
  const i = resource.inspection;
  return (
    <>
      <Header title="AI 결함 분석" back="/admin/inspections" />
      <div className="page-content">
        <DataState {...resource} retry={resource.reload} skeleton="detail">
          {!i ? (
            <Empty
              title="점검 정보를 찾을 수 없습니다"
              description="점검 목록에서 다시 선택해주세요."
            />
          ) : (
            <>
              <InspectionPhoto inspection={i} />
              <section className="analysis-result">
                <div className="flex justify-between items-center">
                  <h2>{label(i.defectType)} 의심</h2>
                  <Badge tone="green">
                    {i.confirmed ? "최종 확정" : "분석 완료"}
                  </Badge>
                </div>
                <div className="flex justify-end mt-2">
                  <Badge value={i.severity}>위험도 {label(i.severity)}</Badge>
                </div>
                <div className="confidence">
                  <span>AI 신뢰도</span>
                  <div>
                    <i
                      style={{
                        width: `${Math.max(0, Math.min(100, i.confidence * 100))}%`,
                      }}
                    />
                  </div>
                  <strong>{Math.round(i.confidence * 100)}%</strong>
                </div>
                <dl>
                  <dt>탐지 위치</dt>
                  <dd>{i.locationDescription}</dd>
                  <dt>점검 시설</dt>
                  <dd>{i.facilityName}</dd>
                </dl>
                <p className="text-xs text-red-500 mt-3">{i.reportSummary}</p>
              </section>
              <SectionTitle>현장 확인 체크리스트</SectionTitle>
              <ul className="checklist">
                {i.checklist?.length ? (
                  i.checklist.map((text, index) => (
                    <li key={index}>
                      <Check size={14} />
                      {text}
                    </li>
                  ))
                ) : (
                  <li>담당자의 현장 확인이 필요합니다.</li>
                )}
              </ul>
              <SectionTitle>유사 사례</SectionTitle>
              {i.similarCases?.length ? (
                <div className="similar-cases">
                  {i.similarCases.map((text, index) => (
                    <div key={index}>{text}</div>
                  ))}
                </div>
              ) : (
                <p className="notice">제공된 유사 사례가 없습니다.</p>
              )}
              <p className="notice blue mt-3">
                AI 분석은 참고 정보이며 최종 판정은 담당자가 확인합니다.
              </p>
              <div className="flex gap-3 mt-5">
                <Link
                  href={`/admin/inspections/new?facilityId=${i.facilityId}`}
                  className="button secondary compact"
                >
                  새 사진 점검
                </Link>
                <Link
                  href={`/admin/inspections/${id}/confirm`}
                  className="button primary flex-1"
                >
                  {i.confirmed ? "확정 내용 수정" : "담당자 검토 후 확정"}
                </Link>
              </div>
              <Link
                href={`/admin/inspections/${id}/report`}
                className="text-link block text-center mt-5"
              >
                점검 보고서 보기 ›
              </Link>
            </>
          )}
        </DataState>
      </div>
    </>
  );
}
export function InspectionConfirm({ id }: { id: string }) {
  const resource = useInspection(id);
  const i = resource.inspection;
  const mutation = useMutation();
  const router = useRouter();
  const [severity, setSeverity] = useState<Severity>("LOW");
  const [actionRequired, setActionRequired] = useState(true);
  useEffect(() => {
    if (i) {
      setSeverity(i.severity);
      setActionRequired(i.actionRequired ?? true);
    }
  }, [i]);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const due = String(form.get("actionDueDate") ?? "");
    if (actionRequired && (!isCalendarDate(due) || due <= localDate())) {
      mutation.setError("조치가 필요하면 오늘 이후의 예정일을 선택해주세요.");
      return;
    }
    await mutation.run(
      () =>
        api<Inspection>(`/api/inspections/${id}/confirmation`, "admin", {
          method: "PATCH",
          body: jsonBody({
            defectType: form.get("defectType"),
            severity,
            locationDescription: String(
              form.get("locationDescription") ?? "",
            ).trim(),
            detail: String(form.get("detail") ?? "").trim(),
            actionRequired,
            actionDueDate: actionRequired ? due : null,
          }),
        }),
      () => router.replace(`/admin/inspections/${id}/report`),
      "결함 분석이 최종 확정되었습니다.",
    );
  }
  return (
    <>
      <Header title="결함 확정" back={`/admin/inspections/${id}`} />
      <div className="page-content">
        <DataState {...resource} retry={resource.reload} skeleton="detail">
          {i ? (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="font-semibold text-lg">최종 결함 정보</h2>
              <Field label="결함 유형">
                <select name="defectType" defaultValue={i.defectType} required>
                  {[
                    "CRACK",
                    "CORROSION",
                    "DEFORMATION",
                    "SURFACE_DAMAGE",
                    "WATER_LEAK",
                    "OTHER",
                  ].map((type) => (
                    <option key={type} value={type}>
                      {label(type)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="결함 위치">
                <input
                  name="locationDescription"
                  required
                  maxLength={240}
                  defaultValue={i.locationDescription}
                />
              </Field>
              <Field label="분석 내용">
                <textarea
                  name="detail"
                  required
                  maxLength={2000}
                  defaultValue={i.confirmedDetail ?? i.reportSummary}
                  rows={3}
                />
              </Field>
              <div>
                <p className="text-sm font-medium mb-3">위험도</p>
                <div className="risk-options">
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={severity === s ? "selected" : ""}
                      aria-pressed={severity === s}
                      onClick={() => setSeverity(s as Severity)}
                    >
                      {label(s)}
                    </button>
                  ))}
                </div>
                <p className="muted text-[11px] mt-2">
                  현장 확인 결과에 맞춰 결함 유형과 위험도를 수정해주세요.
                </p>
              </div>
              <Field label="조치 필요 여부">
                <select
                  value={String(actionRequired)}
                  onChange={(event) =>
                    setActionRequired(event.target.value === "true")
                  }
                >
                  <option value="true">조치 필요</option>
                  <option value="false">조치 불필요 (완료 처리)</option>
                </select>
              </Field>
              <Field
                label={actionRequired ? "조치 예정일 (필수)" : "조치 예정일"}
                hint="조치가 필요하면 오늘 이후 날짜를 선택해주세요."
              >
                <input
                  type="date"
                  name="actionDueDate"
                  min={localDate(tomorrow)}
                  required={actionRequired}
                  disabled={!actionRequired}
                  defaultValue={i.actionDueDate ?? ""}
                />
              </Field>
              <ErrorMessage message={mutation.error} />
              <Button busy={mutation.busy}>결함 최종 확정</Button>
              <Link
                href={`/admin/inspections/${id}/report`}
                className="text-link block text-center"
              >
                점검 보고서 보기 ›
              </Link>
            </form>
          ) : (
            <Empty title="점검 정보를 찾을 수 없습니다" />
          )}
        </DataState>
      </div>
    </>
  );
}
export function InspectionReport({ id }: { id: string }) {
  const resource = useInspection(id);
  const i = resource.inspection;
  const mutation = useMutation();
  const action = useMutation();
  const [editingAction, setEditingAction] = useState(false);
  async function saveAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await action.run(
      () =>
        api(`/api/inspections/${id}/action`, "admin", {
          method: "PATCH",
          body: jsonBody({
            status: form.get("status"),
            actionNote: form.get("actionNote"),
          }),
        }),
      () => {
        setEditingAction(false);
        resource.reload();
      },
      "조치 상태가 저장되었습니다.",
    );
  }
  async function download() {
    await mutation.run(
      () =>
        api<string>(
          `/api/inspections/${id}/report`,
          "admin",
          {},
          { text: true },
        ),
      (content) => {
        const url = URL.createObjectURL(
          new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `체육시설_안전점검보고서_${id}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      "보고서 다운로드를 시작했습니다.",
    );
  }
  return (
    <>
      <Header title="점검 보고서" back={`/admin/inspections/${id}`} />
      <div className="page-content report-page">
        <DataState {...resource} retry={resource.reload} skeleton="detail">
          {i ? (
            <>
              <SectionTitle>기본 정보</SectionTitle>
              <div className="info-list report-info">
                <p>
                  <span>시설명</span>
                  <strong>{i.facilityName}</strong>
                </p>
                <p>
                  <span>점검일</span>
                  <strong>{dateLabel(i.createdAt)}</strong>
                </p>
                <p>
                  <span>등록자 ID</span>
                  <strong>{i.reporterUserId}</strong>
                </p>
                <p>
                  <span>결함</span>
                  <strong>
                    {label(i.defectType)} / 위험도 {label(i.severity)}
                  </strong>
                </p>
                <p>
                  <span>위치</span>
                  <strong>{i.locationDescription}</strong>
                </p>
              </div>
              <SectionTitle>점검 사진</SectionTitle>
              <InspectionPhoto inspection={i} />
              <SectionTitle>조치 내용</SectionTitle>
              <Badge value={i.actionStatus} />
              <p className="report-note">
                {i.actionNote || "등록된 조치 내용이 없습니다."}
              </p>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  action.setError("");
                  setEditingAction(true);
                }}
              >
                조치 내용 변경 ›
              </button>
              {i.confirmed && (
                <>
                  <SectionTitle>담당자 최종 확정</SectionTitle>
                  <p className="notice indigo">
                    {i.confirmedDetail || "최종 확정되었습니다."}
                  </p>
                  <p className="muted text-xs mt-2">
                    {i.confirmedAt && `확정: ${dateLabel(i.confirmedAt)} · `}
                    {i.actionRequired
                      ? `조치 예정일: ${i.actionDueDate ?? "미등록"}`
                      : "조치 불필요"}
                  </p>
                </>
              )}
              <SectionTitle>분석 요약</SectionTitle>
              <p className="notice indigo">{i.reportSummary}</p>
              <div className="report-file">
                <FileTextIcon /> 체육시설 안전점검보고서.txt
              </div>
              <ErrorMessage message={mutation.error} />
              <Button className="mt-5" busy={mutation.busy} onClick={download}>
                <Download size={17} /> 보고서 다운로드
              </Button>
            </>
          ) : (
            <Empty title="점검 정보를 찾을 수 없습니다" />
          )}
        </DataState>
      </div>
      {editingAction && i && (
        <Sheet
          title="조치 상태 변경"
          busy={action.busy}
          onClose={() => setEditingAction(false)}
          footer={
            <Button type="submit" form="inspection-action" busy={action.busy}>
              조치 저장
            </Button>
          }
        >
          <form
            id="inspection-action"
            onSubmit={saveAction}
            className="space-y-5"
          >
            <Field label="조치 상태">
              <select name="status" defaultValue={i.actionStatus} required>
                {["REPORTED", "REVIEWING", "ACTION_SCHEDULED", "RESOLVED"].map(
                  (status) => (
                    <option key={status} value={status}>
                      {label(status)}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="조치 내용">
              <textarea
                name="actionNote"
                maxLength={2000}
                rows={4}
                defaultValue={i.actionNote ?? ""}
              />
            </Field>
            <ErrorMessage message={action.error} />
          </form>
        </Sheet>
      )}
    </>
  );
}
function FileTextIcon() {
  return <span aria-hidden="true">▤</span>;
}
export function InspectionsList({
  actions = false,
  urgent = false,
}: {
  actions?: boolean;
  urgent?: boolean;
}) {
  const params = useSearchParams();
  const resource = useApi<ListResponse<Inspection>>(
    actions || urgent ? "/api/inspections/open" : "/api/inspections",
    "admin",
  );
  const all = useApi<ListResponse<Inspection>>(
    actions ? "/api/inspections" : null,
    "admin",
  );
  const {
    filters: { q: query, filter, sort },
    setFilter,
  } = useSearchFilters(urgent ? urgentFilters : inspectionFilters);
  const source =
    actions && filter === "RESOLVED" ? listOf(all.data) : listOf(resource.data);
  const rows = source
    .filter(
      (i) =>
        (!urgent || isUrgentInspection(i)) &&
        (filter === "all" ||
          (filter === "urgent"
            ? ["HIGH", "CRITICAL"].includes(i.severity)
            : i.actionStatus === filter)) &&
        `${i.facilityName} ${i.locationDescription} ${label(i.defectType)}`.includes(
          query,
        ),
    )
    .sort((a, b) =>
      sort === "recent"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  const allRows = actions ? listOf(all.data) : source;
  return (
    <>
      <Header
        title={
          urgent ? "긴급 미조치" : actions ? "조치 현황" : "최근 점검 전체보기"
        }
        back="/admin"
      />
      <div className="page-content">
        {actions && (
          <>
            <SectionTitle>조치 진행 현황</SectionTitle>
            <Stats
              loading={all.loading}
              items={[
                {
                  label: "미조치",
                  value: all.data
                    ? allRows.filter((i) => i.actionStatus === "REPORTED")
                        .length
                    : "—",
                  tone: "red",
                },
                {
                  label: "진행 중",
                  value: all.data
                    ? allRows.filter((i) =>
                        ["REVIEWING", "ACTION_SCHEDULED"].includes(
                          i.actionStatus,
                        ),
                      ).length
                    : "—",
                  tone: "amber",
                },
                {
                  label: "완료",
                  value: all.data
                    ? allRows.filter((i) => i.actionStatus === "RESOLVED")
                        .length
                    : "—",
                  tone: "green",
                },
              ]}
            />
            <ErrorMessage
              message={
                filter !== "RESOLVED" && all.error !== resource.error
                  ? all.error
                  : ""
              }
              retry={all.reload}
            />
          </>
        )}
        {urgent && (
          <p className="muted text-sm mb-4">
            긴급·높음 위험도의 미조치{" "}
            {resource.data
              ? `${source.filter(isUrgentInspection).length}건`
              : "—"}
          </p>
        )}
        <div className="search-input my-4">
          <Search size={16} />
          <input
            placeholder="시설명 또는 점검 내용 검색"
            aria-label="점검 검색"
            value={query}
            onChange={(e) => setFilter("q", e.target.value)}
          />
        </div>
        <Tabs
          value={filter}
          onChange={(value) => setFilter("filter", value)}
          items={
            urgent
              ? [
                  { label: "전체", value: "all" },
                  { label: "긴급·높음", value: "urgent" },
                  { label: "검토 중", value: "REVIEWING" },
                ]
              : [
                  { label: "전체", value: "all" },
                  { label: "조치 필요", value: "REPORTED" },
                  { label: "검토 중", value: "REVIEWING" },
                  { label: "조치 예정", value: "ACTION_SCHEDULED" },
                  { label: "완료", value: "RESOLVED" },
                ]
          }
        />
        <SectionTitle
          detail={
            <select
              className="sort-select"
              aria-label="점검 정렬"
              value={sort}
              onChange={(e) => setFilter("sort", e.target.value)}
            >
              <option value="recent">최신순</option>
              <option value="old">오래된 순</option>
            </select>
          }
        >
          점검{" "}
          {(actions && filter === "RESOLVED" ? all.data : resource.data)
            ? `${rows.length}건`
            : "—"}
        </SectionTitle>
        <DataState
          loading={
            filter === "RESOLVED" && actions ? all.loading : resource.loading
          }
          error={filter === "RESOLVED" && actions ? all.error : resource.error}
          retry={() => {
            resource.reload();
            all.reload();
          }}
        >
          {rows.length ? (
            rows.map((i) => (
              <InspectionRow
                key={i.id}
                inspection={i}
                href={
                  params.get("view") === "reports"
                    ? `/admin/inspections/${i.id}/report`
                    : actions
                      ? `/admin/inspections/${i.id}/report`
                      : undefined
                }
              />
            ))
          ) : (
            <Empty
              title="해당 점검이 없습니다"
              description="다른 검색어나 필터를 선택해주세요."
            />
          )}
        </DataState>
        <Link href="/admin/inspections/new" className="button primary mt-5">
          사진 점검 등록
        </Link>
      </div>
    </>
  );
}
export function HistoryScreen() {
  const facilities = useApi<ListResponse<Facility>>("/api/facilities", "admin");
  const {
    filters: { facilityId: selected, filter },
    setFilter,
    ready,
  } = useSearchFilters(historyFilters);
  useEffect(() => {
    if (
      ready &&
      facilities.data &&
      !listOf(facilities.data).some((f) => String(f.id) === selected) &&
      listOf(facilities.data)[0]
    )
      setFilter("facilityId", String(listOf(facilities.data)[0].id));
  }, [facilities.data, selected, ready]);
  const history = useApi<ListResponse<Inspection>>(
    isResourceId(selected)
      ? `/api/inspections/facilities/${selected}/history`
      : null,
    "admin",
  );
  const rows = listOf(history.data).filter(
    (i) =>
      filter === "all" ||
      (filter === "resolved"
        ? i.actionStatus === "RESOLVED"
        : i.actionStatus !== "RESOLVED"),
  );
  return (
    <>
      <Header
        title="안전 이력"
        back="/admin"
        badge={<Badge>시설별 기록</Badge>}
      />
      <div className="page-content">
        <Field label="점검 시설">
          <select
            value={selected}
            onChange={(e) => setFilter("facilityId", e.target.value)}
          >
            <option value="">시설을 선택하세요</option>
            {listOf(facilities.data).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Stats
          loading={facilities.loading || history.loading}
          items={[
            {
              label: "점검",
              value: history.data ? `${listOf(history.data).length}회` : "—",
              tone: "blue",
            },
            {
              label: "미조치",
              value: history.data
                ? `${listOf(history.data).filter((i) => i.actionStatus !== "RESOLVED").length}건`
                : "—",
              tone: "amber",
            },
            {
              label: "조치 완료",
              value: history.data
                ? `${listOf(history.data).filter((i) => i.actionStatus === "RESOLVED").length}건`
                : "—",
              tone: "green",
            },
          ]}
        />
        <div className="mt-5">
          <Tabs
            value={filter}
            onChange={(value) => setFilter("filter", value)}
            items={[
              { label: "전체", value: "all" },
              { label: "미조치", value: "open" },
              { label: "조치 완료", value: "resolved" },
            ]}
          />
        </div>
        <DataState
          loading={facilities.loading || history.loading}
          error={facilities.error || history.error}
          retry={() => {
            facilities.reload();
            history.reload();
          }}
        >
          {rows.length ? (
            <ol className="timeline">
              {[...rows]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((i) => (
                  <li key={i.id}>
                    <time>{i.createdAt.slice(5, 10).replace("-", ".")}</time>
                    <Link href={`/admin/inspections/${i.id}`}>
                      <strong>{label(i.defectType)} 점검</strong>
                      <p>{i.locationDescription}</p>
                      <p>위험도 {label(i.severity)}</p>
                      <Badge value={i.actionStatus} />
                      {i.resolvedAt && (
                        <small className="block mt-2">
                          완료: {dateLabel(i.resolvedAt)}
                        </small>
                      )}
                    </Link>
                  </li>
                ))}
            </ol>
          ) : (
            <Empty
              title="점검 이력이 없습니다"
              description="선택한 시설의 점검 기록이 여기에 표시됩니다."
            />
          )}
        </DataState>
      </div>
    </>
  );
}
