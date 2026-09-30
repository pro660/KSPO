"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Check, Search } from "lucide-react";
import { useSession } from "@/components/shell";
import {
  Badge,
  Button,
  DataState,
  Empty,
  ErrorMessage,
  Header,
  Sheet,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { useApi, useMutation } from "@/lib/hooks";
import {
  listOf,
  type ListResponse,
  type Profile,
  type RegionOption,
} from "@/lib/types";
export function RegionPicker({
  regions,
  value,
  onSelect,
  onClose,
}: {
  regions: RegionOption[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(value);
  const filtered = regions.filter((r) => r.regionName.includes(query.trim()));
  return (
    <Sheet title="시·군·구 선택" onClose={onClose} footer={
      <Button disabled={!regions.some((r) => r.regionCode === selected)} onClick={() => { onSelect(selected); onClose(); }}>
        {regions.find((r) => r.regionCode === selected)?.regionName.replace("서울특별시 ", "") ?? "지역"} 선택 완료
      </Button>
    }>
      <div className="search-input">
        <Search size={17} />
        <input
          aria-label="구 이름 검색"
          placeholder="구 이름을 검색하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="district-grid">
        {filtered
          .map((r) => (
            <button
              type="button"
              key={r.regionCode}
              aria-pressed={selected === r.regionCode}
              className={selected === r.regionCode ? "selected" : ""}
              onClick={() => setSelected(r.regionCode)}
            >
              {r.regionName.replace("서울특별시 ", "")}
            </button>
          ))}
      </div>
      {!filtered.length && <Empty title="검색 결과가 없어요" description="다른 지역 이름으로 검색해주세요." />}
    </Sheet>
  );
}
export function RegionScreen() {
  const { account, profile, updateProfile } = useSession();
  const router = useRouter();
  const admin = account === "admin";
  const resource = useApi<ListResponse<RegionOption>>(
    `/api/${admin ? "admins" : "users"}/regions`,
    account,
  );
  const mutation = useMutation();
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const regions = listOf(resource.data);
  const region = regions.find((r) => r.regionCode === selected);
  const locked = admin && !!profile?.regionCode;
  async function save() {
    if (!region) return;
    await mutation.run(
      async () => {
        await api(`/api/${admin ? "admins" : "users"}/me/region`, account, {
          method: "PUT",
          body: jsonBody(admin ? region : { regionCode: region.regionCode }),
        });
        return api<Profile>(`/api/${admin ? "admins" : "users"}/me`, account);
      },
      (updatedProfile) => {
        updateProfile(updatedProfile);
        router.replace(admin ? "/admin" : "/home");
      },
      "지역 설정이 저장되었습니다.",
    );
  }
  return (
    <>
      <Header
        title={admin ? "관리 지역 설정" : "내 지역 설정"}
        badge={<Badge>{admin ? "최초 1회" : "서울 지역"}</Badge>}
      />
      <div className="page-content region-page">
        <h2 className="text-xl font-bold">
          {admin ? "관리할" : "이용할"} 지역을 선택해주세요
        </h2>
        <p className="muted text-xs mt-2">
          선택한 지역의 체육시설을 {admin ? "조회·점검" : "탐색·예약"}할 수
          있습니다.
        </p>
        <DataState {...resource} retry={resource.reload}>
          <label className="field mt-5">
            <span>시·도</span>
            <div className="selected-region">
              <span>● 서울특별시</span>
              <Check size={17} />
            </div>
          </label>
          <label className="field">
            <span>시·군·구 선택</span>
            <button
              className="region-select"
              onClick={() => setOpen(true)}
              disabled={locked}
            >
              <span className="flex items-center gap-2">
                <MapPin size={15} />
                {region?.regionName.replace("서울특별시 ", "") ||
                  profile?.regionName ||
                  "자치구를 선택하세요"}
              </span>
              <span className="text-link text-xs">전체 구 보기 ›</span>
            </button>
          </label>
          <h3 className="font-semibold text-sm mt-7">
            {admin ? "관리" : "이용"} 범위 미리보기
          </h3>
          <div className="region-preview mt-3">
            <strong>{region?.regionName || "서울특별시"}</strong>
            <p className="text-link mt-2">
              {admin ? "공공 체육시설 관리" : "우리 동네 공공 체육시설"}
            </p>
            <p className="muted text-xs mt-5">
              {admin
                ? "시설 조회 · 사진 점검 · 조치 관리 · 보고서"
                : "시설 탐색 · 시간 선택 · 예약 · 개선 요청"}
            </p>
          </div>
          {admin && (
            <p className="notice amber mt-5">
              {locked
                ? "이미 관리 지역이 설정되었습니다. 지역 변경은 슈퍼 관리자가 진행합니다."
                : "담당 지역은 최초 1회만 직접 설정할 수 있습니다."}
            </p>
          )}
          <ErrorMessage message={mutation.error} />
          <Button
            className="mt-7"
            disabled={!region || locked}
            busy={mutation.busy}
            onClick={save}
          >
            {region?.regionName.replace("서울특별시 ", "") || "지역 선택 후"}{" "}
            {admin ? "관리 시작하기" : "이용 시작하기"}
          </Button>
        </DataState>
      </div>
      {open && (
        <RegionPicker
          regions={regions}
          value={selected || profile?.regionCode || ""}
          onSelect={setSelected}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
