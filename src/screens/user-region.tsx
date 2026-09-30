"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, MapPin } from "lucide-react";
import { useSession } from "@/components/shell";
import {
  Badge,
  Button,
  DataState,
  Empty,
  ErrorMessage,
  Header,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { useApi, useMutation } from "@/lib/hooks";
import {
  listOf,
  type ListResponse,
  type Profile,
  type RegionOption,
} from "@/lib/types";
import { RegionPicker } from "./region";

export function UserRegionScreen() {
  const { profile, updateProfile } = useSession();
  const router = useRouter();
  const resource = useApi<ListResponse<RegionOption>>("/api/users/regions");
  const mutation = useMutation();
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const regions = listOf(resource.data);
  const selectedCode = selected ?? profile?.regionCode ?? "";
  const region = regions.find((item) => item.regionCode === selectedCode);
  const district = region?.regionName.replace("서울특별시 ", "");
  const hasRegion = !!profile?.regionCode;
  const unchanged = hasRegion && region?.regionCode === profile.regionCode;

  async function save() {
    if (!region || mutation.busy) return;
    if (unchanged) {
      router.replace("/home");
      return;
    }
    await mutation.run(
      async () => {
        await api("/api/users/me/region", "user", {
          method: "PUT",
          body: jsonBody({ regionCode: region.regionCode }),
        });
        return api<Profile>("/api/users/me", "user");
      },
      (updatedProfile) => {
        updateProfile(updatedProfile);
        router.replace("/home");
      },
      "내 지역이 저장되었습니다.",
    );
  }

  return (
    <>
      <Header
        title="내 지역 설정"
        back={hasRegion ? "/my" : undefined}
        badge={<Badge>사용자</Badge>}
      />
      <div className="page-content user-region-page">
        <div className="user-region-intro">
          <span className="user-region-icon">
            <MapPin size={25} aria-hidden="true" />
          </span>
          <h2>어디에서 운동할까요?</h2>
          <p>
            자주 이용할 지역을 선택하고
            <br />
            우리 동네 체육시설을 만나보세요.
          </p>
        </div>
        <DataState {...resource} retry={resource.reload}>
          {regions.length ? (
            <>
              <div className="field">
                <span>시·도</span>
                <div className="selected-region">
                  <span>서울특별시</span>
                  <Check size={17} aria-hidden="true" />
                </div>
              </div>
              <div className="field">
                <span id="user-district-label">시·군·구</span>
                <button
                  type="button"
                  className={`region-select user-region-select ${region ? "has-region" : ""}`}
                  aria-labelledby="user-district-label user-district-value"
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  disabled={mutation.busy}
                  onClick={() => setOpen(true)}
                >
                  <span id="user-district-value">
                    {district || "자치구를 선택하세요"}
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="user-region-preview" aria-live="polite">
                <MapPin size={20} aria-hidden="true" />
                <div>
                  <p className="user-region-caption">
                    {unchanged ? "현재 이용 지역" : "이용할 지역"}
                  </p>
                  <strong>
                    {region?.regionName || "내 지역을 선택해주세요"}
                  </strong>
                  <p className="user-region-services">
                    체육시설 탐색 · 예약 · 개선 요청
                  </p>
                </div>
              </div>
              <p className="user-region-hint">
                선택한 지역은 마이에서 언제든 변경할 수 있어요.
              </p>
              <ErrorMessage message={mutation.error} />
              <Button disabled={!region} busy={mutation.busy} onClick={save}>
                {unchanged
                  ? "이 지역으로 이용하기"
                  : hasRegion
                    ? "변경한 지역 저장하기"
                    : "이 지역으로 시작하기"}
              </Button>
            </>
          ) : (
            <Empty
              title="선택할 수 있는 지역이 없어요"
              description="잠시 후 다시 시도해주세요."
            >
              <Button variant="secondary" onClick={resource.reload}>
                다시 불러오기
              </Button>
            </Empty>
          )}
        </DataState>
      </div>
      {open && (
        <RegionPicker
          regions={regions}
          value={selectedCode}
          onSelect={(value) => {
            setSelected(value);
            mutation.setError("");
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
