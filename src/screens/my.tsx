"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useSession } from "@/components/shell";
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
} from "@/components/ui";
import { api, clearLogin } from "@/lib/api";
import { RemotePhoto } from "@/components/remote-photo";
import { useApi, useMutation } from "@/lib/hooks";
import {
  listOf,
  type Facility,
  type ListResponse,
  type Reservation,
  type UserReport,
} from "@/lib/types";
import { dateLabel, label } from "@/lib/format";
import { facilityHref } from "./facilities";
export function MyScreen() {
  const { profile } = useSession();
  const router = useRouter();
  const reservations = useApi<ListResponse<Reservation>>(
    "/api/user/reservations",
  );
  const reports = useApi<ListResponse<UserReport>>("/api/user/reports");
  const [favorites, setFavorites] = useState<Facility[]>([]);
  const [sheet, setSheet] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [draftSports, setDraftSports] = useState<string[]>([]);
  const preference = useMutation();
  useEffect(() => {
    try {
      setFavorites(
        JSON.parse(
          localStorage.getItem(`checheFavorites:${profile?.userId}`) || "[]",
        ),
      );
      setSports(
        JSON.parse(
          localStorage.getItem(`checheSports:${profile?.userId}`) || "[]",
        ),
      );
    } catch {}
  }, [profile?.userId]);
  const rows = listOf(reservations.data);
  return (
    <>
      <Header title="마이" />
      <div className="page-content">
        <div className="profile-card">
          <div className="avatar">
            {profile?.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2>{profile?.username} 님</h2>
            <p>{profile?.regionName} · 일반 사용자</p>
            <Link className="text-link" href="/setup-region">
              내 지역 변경 ›
            </Link>
          </div>
        </div>
        <SectionTitle>나의 활동</SectionTitle>
        <Stats
          items={[
            {
              label: "예약",
              value: reservations.loading ? "—" : `${rows.length}회`,
              tone: "blue",
            },
            {
              label: "개선 요청",
              value: reports.loading ? "—" : `${listOf(reports.data).length}건`,
              tone: "green",
            },
            {
              label: "찜한 시설",
              value: `${favorites.length}곳`,
              tone: "amber",
            },
          ]}
        />
        <ErrorMessage message={reservations.error || reports.error} />
        <SectionTitle>찜한 시설</SectionTitle>
        {favorites.length ? (
          favorites.map((f) => (
            <Link
              className="favorite-row"
              key={f.id ?? f.externalId ?? f.name}
              href={facilityHref(f)}
            >
              <strong>♥ {f.name}</strong>
              <span>
                {f.type} · {f.regionName}
              </span>
            </Link>
          ))
        ) : (
          <p className="muted text-sm py-4">
            마음에 드는 시설의 하트를 눌러 저장해보세요.
          </p>
        )}
        <SectionTitle>설정</SectionTitle>
        <div className="settings-list">
          <button onClick={() => { setDraftSports(sports); preference.setError(""); setSheet("sports"); }}>
            <strong>운동 선호 설정</strong>
            <span>{sports.join(" · ") || "선택하기"} ›</span>
          </button>
          <Link href="/reports">
            <strong>내 개선 요청</strong>
            <span>처리 상태 확인 ›</span>
          </Link>
          <Link href="/reservations">
            <strong>예약내역</strong>
            <span>예약·취소 관리 ›</span>
          </Link>
          <button onClick={() => setSheet("account")}>
            <strong>내 정보 관리</strong>
            <span>계정 정보 ›</span>
          </button>
          <button onClick={() => setSheet("help")}>
            <strong>고객센터</strong>
            <span>이용 안내 ›</span>
          </button>
          <button
            onClick={() => {
              clearLogin("user");
              router.replace("/login");
            }}
          >
            <strong>로그아웃</strong>
            <LogOut size={16} />
          </button>
        </div>
      </div>
      {sheet && (
        <Sheet
          title={
            sheet === "sports"
              ? "운동 선호 설정"
              : sheet === "account"
                ? "내 정보 관리"
                : "이용 안내"
          }
          onClose={() => setSheet("")}
          variant={sheet === "account" ? "dialog" : "sheet"}
          busy={preference.busy}
          footer={sheet === "sports" ? (
            <Button busy={preference.busy} onClick={() => preference.run(async () => {
              localStorage.setItem(`checheSports:${profile?.userId}`, JSON.stringify(draftSports));
            }, () => { setSports(draftSports); setSheet(""); }, "운동 선호 설정이 저장되었습니다.")}>저장하기</Button>
          ) : <Button onClick={() => setSheet("")}>확인</Button>}
        >
          {sheet === "sports" ? (
            <>
              <p className="muted text-sm mb-4">
                선호 운동은 현재 브라우저에 저장됩니다.
              </p>
              <div className="district-grid">
                {["축구", "배드민턴", "수영", "농구", "헬스", "테니스"].map(
                  (s) => (
                    <button
                      key={s}
                      className={draftSports.includes(s) ? "selected" : ""}
                      aria-pressed={draftSports.includes(s)}
                      onClick={() =>
                        setDraftSports((v) =>
                          v.includes(s) ? v.filter((x) => x !== s) : [...v, s],
                        )
                      }
                    >
                      {s}
                    </button>
                  ),
                )}
              </div>
              <ErrorMessage message={preference.error} />
            </>
          ) : sheet === "account" ? (
            <div className="info-list">
              <p>
                <span>아이디</span>
                <strong>{profile?.username}</strong>
              </p>
              <p>
                <span>내 지역</span>
                <strong>{profile?.regionName}</strong>
              </p>
              <Link
                className="text-link"
                href="/setup-region"
                onClick={() => setSheet("")}
              >
                지역 변경하기
              </Link>
              <p className="muted text-xs">
                비밀번호 변경 기능은 지원 준비 중입니다.
              </p>
            </div>
          ) : (
            <div className="space-y-5 text-sm leading-6">
              <div>
                <strong>예약은 언제 취소할 수 있나요?</strong>
                <p className="muted">
                  예약 시작 전까지 예약 상세에서 취소할 수 있습니다.
                </p>
              </div>
              <div>
                <strong>외부 공공시설도 예약할 수 있나요?</strong>
                <p className="muted">
                  서울시·KSPO 공공 API 시설은 공식 이용 안내를 확인해주세요.
                </p>
              </div>
              <div>
                <strong>시설에 문제가 있나요?</strong>
                <p className="muted">
                  시설 상세의 개선·수리 요청에서 사진과 내용을 등록할 수
                  있습니다.
                </p>
              </div>
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}
export function ReportsScreen() {
  const resource = useApi<ListResponse<UserReport>>("/api/user/reports");
  const rows = listOf(resource.data);
  return (
    <>
      <Header title="내 개선 요청" back="/my" />
      <div className="page-content">
        <p className="muted text-sm mb-5">
          내가 요청한 시설 개선·수리 처리 상태입니다.
        </p>
        <DataState {...resource} retry={resource.reload}>
          {rows.length ? (
            rows.map((r) => (
              <Link className="list-card" href={`/reports/${r.id}`} key={r.id}>
                <div>
                  <strong>{r.facilityName ?? `시설 #${r.facilityId}`}</strong>
                  <p>{r.locationDescription}</p>
                  <small>{dateLabel(r.createdAt)}</small>
                </div>
                <Badge value={r.status} />
              </Link>
            ))
          ) : (
            <Empty
              title="등록한 요청이 없어요"
              description="시설 상세에서 개선·수리 요청을 등록해주세요."
            >
              <Link href="/facilities" className="button secondary mt-4">
                시설 찾아보기
              </Link>
            </Empty>
          )}
        </DataState>
      </div>
    </>
  );
}
export function NewReportScreen() {
  const params = useSearchParams();
  const facilityId = params.get("facilityId");
  const resource = useApi<Facility>(
    facilityId ? `/api/user/facilities/${facilityId}` : null,
  );
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation();
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !facilityId) return;
    const form = new FormData(e.currentTarget);
    form.set("facilityId", facilityId);
    form.set("photo", file);
    await mutation.run(
      () =>
        api<UserReport>("/api/user/reports", "user", {
          method: "POST",
          body: form,
        }),
      (r) => router.replace(r?.id ? `/reports/${r.id}` : "/reports"),
      "개선 요청이 접수되었습니다.",
    );
  }
  return (
    <>
      <Header
        title="시설 개선·수리 요청"
        back={facilityId ? `/facilities/${facilityId}` : "/facilities"}
      />
      <div className="page-content">
        <DataState {...resource} retry={resource.reload}>
          {!resource.data ? (
            <Empty
              title="시설을 먼저 선택해주세요"
              description="시설 상세에서 개선 요청을 시작할 수 있습니다."
            />
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="notice blue font-semibold">
                {resource.data.name}
              </div>
              <Field label="요청 유형">
                <select name="category" required>
                  {["DETERIORATION", "IMPROVEMENT", "REPAIR", "OTHER"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {label(c)}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="발견 위치">
                <input
                  name="locationDescription"
                  required
                  maxLength={240}
                  placeholder="예: 2층 관중석 서쪽 벽면"
                />
              </Field>
              <Field label="요청 내용">
                <textarea
                  name="comment"
                  required
                  maxLength={2000}
                  rows={5}
                  placeholder="어떤 점을 개선하면 좋을지 알려주세요."
                />
              </Field>
              <div>
                <h3 className="text-sm font-medium mb-2">시설 사진 (필수)</h3>
                <PhotoPicker file={file} onChange={setFile} />
              </div>
              <ErrorMessage message={mutation.error} />
              <Button busy={mutation.busy} disabled={!file}>
                개선 요청 등록하기
              </Button>
            </form>
          )}
        </DataState>
      </div>
    </>
  );
}
export function ReportDetail({ id }: { id: string }) {
  const resource = useApi<UserReport>(`/api/user/reports/${id}`);
  return (
    <>
      <Header title="개선 요청 상세" back="/reports" />
      <div className="page-content">
        <DataState {...resource} retry={resource.reload}>
          {resource.data && (
            <>
              <Badge value={resource.data.status} />
              <h2 className="text-xl font-bold mt-4">
                {resource.data.facilityName ??
                  `시설 #${resource.data.facilityId}`}
              </h2>
              <p className="muted text-xs mt-2">
                {dateLabel(resource.data.createdAt)}
              </p>
              <div className="info-list mt-5">
                <p>
                  <span>요청 유형</span>
                  <strong>{label(resource.data.category)}</strong>
                </p>
                <p>
                  <span>발견 위치</span>
                  <strong>{resource.data.locationDescription}</strong>
                </p>
              </div>
              {resource.data.photoUrl && (
                <RemotePhoto
                  className="mt-5"
                  path={resource.data.photoUrl}
                  account="user"
                  alt="시설 개선 요청 사진"
                />
              )}
              <SectionTitle>요청 내용</SectionTitle>
              <p className="whitespace-pre-wrap text-sm leading-7">
                {resource.data.comment}
              </p>
              <SectionTitle>처리 안내</SectionTitle>
              <p className="notice blue">
                {resource.data.actionNote ||
                  "담당자가 내용을 확인하고 있습니다. 처리 상태는 이 화면에서 확인할 수 있습니다."}
              </p>
            </>
          )}
        </DataState>
      </div>
    </>
  );
}
