"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Heart, Phone, Search } from "lucide-react";
import {
  DesignGraphic,
  FluidGraphic,
  type GraphicName,
} from "@/components/design-assets";
import { useSession } from "@/components/shell";
import {
  Badge,
  DataState,
  Empty,
  ErrorMessage,
  Header,
  SectionTitle,
} from "@/components/ui";
import { api, jsonBody, photoUrl } from "@/lib/api";
import { canReserve, localDate, money, safeUrl, dateLabel } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type {
  Facility,
  HomeResponse,
  SearchResponse,
  UsageGuide,
} from "@/lib/types";
import { CalendarSheet } from "./reservations";
export function facilityHref(f: Facility) {
  if (
    f.id != null &&
    f.source !== "SEOUL_OPEN_API" &&
    f.source !== "KSPO_OPEN_API"
  )
    return `/facilities/${f.id}`;
  const key = encodeURIComponent(`${f.source}:${f.externalId ?? f.name}`);
  if (typeof window !== "undefined")
    sessionStorage.setItem(`checheExternal:${key}`, JSON.stringify(f));
  return `/facilities/external?key=${encodeURIComponent(key)}`;
}
export function Favorite({ facility }: { facility: Facility }) {
  const { profile } = useSession();
  const key = `checheFavorites:${profile?.userId ?? "guest"}`;
  const [saved, setSaved] = useState(false);
  const identity = (f: Facility) =>
    `${f.source}:${f.id ?? f.externalId ?? f.name}`;
  useEffect(() => {
    try {
      const rows: Facility[] = JSON.parse(localStorage.getItem(key) || "[]");
      setSaved(rows.some((f) => identity(f) === identity(facility)));
    } catch {}
  }, [key, facility]);
  return (
    <button
      type="button"
      className={`favorite ${saved ? "saved" : ""}`}
      aria-label={saved ? "찜 해제" : "시설 찜하기"}
      aria-pressed={saved}
      onClick={() => {
        let rows: Facility[] = [];
        try {
          rows = JSON.parse(localStorage.getItem(key) || "[]");
        } catch {}
        rows = rows.filter((f) => identity(f) !== identity(facility));
        if (!saved) rows.push(facility);
        localStorage.setItem(key, JSON.stringify(rows));
        setSaved(!saved);
      }}
    >
      {saved ? (
        <Heart size={20} fill="currentColor" />
      ) : (
        <img src="/figma/ed91f.svg" alt="" />
      )}
    </button>
  );
}
export function FacilityCard({
  facility: f,
  featured = false,
}: {
  facility: Facility;
  featured?: boolean;
}) {
  return (
    <article className={featured ? "featured-facility" : "facility-card"}>
      <Link
        href={facilityHref(f)}
        className="facility-visual"
        aria-label={`${f.name} 상세 보기`}
      >
        {f.imageUrl ? (
          <img
            src={photoUrl(f.imageUrl)}
            alt={f.name}
            className="facility-photo"
          />
        ) : featured ? (
          <FluidGraphic name="facility" label="체육시설 일러스트" />
        ) : (
          <DesignGraphic name="building" label="체육시설 일러스트" />
        )}
      </Link>
      <div className="facility-card-body">
        <Link href={facilityHref(f)} className="facility-name">
          {f.name}
        </Link>
        <p className="muted text-xs mt-1">
          {f.regionName} {f.closingTime && `· ${f.closingTime.slice(0, 5)}까지`}
        </p>
        <div className="flex items-center flex-wrap gap-2 mt-3">
          <Badge tone="gray">{f.type}</Badge>
          <Badge value={f.status} />
          {f.source === "KSPO_OPEN_API" && <Badge>KSPO 공식 시설</Badge>}
          {f.source === "SEOUL_OPEN_API" && <Badge>서울시 공공시설</Badge>}
        </div>
      </div>
      {!featured && <Favorite facility={f} />}
    </article>
  );
}
export function HomeScreen() {
  const resource = useApi<HomeResponse | Facility[]>(
    "/api/user/facilities/home",
  );
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { profile } = useSession();
  const data = resource.data;
  const facilities = Array.isArray(data)
    ? data
    : (data?.recommendedFacilities ?? data?.facilities ?? []);
  const kspo = Array.isArray(data) ? [] : (data?.kspoFacilities ?? []);
  const sports: { label: string; name: GraphicName }[] = [
    { label: "축구", name: "football" },
    { label: "배드민턴", name: "badminton" },
    { label: "수영", name: "swim" },
    { label: "농구", name: "basketball" },
    { label: "더보기", name: "more" },
  ];
  return (
    <div className="home-page">
      <div className="home-wordmark">
        <DesignGraphic name="wordmark" label="KSPO" />
      </div>
      <div className="home-greeting">
        <h1>
          안녕하세요
          <br />
          어떤 운동을 찾으세요?
        </h1>
        <p>AI가 조건에 맞는 공공 체육시설을 찾아드려요.</p>
      </div>
      <section className="home-search">
        <div className="home-search-bg">
          <FluidGraphic name="searchBackground" />
        </div>
        <h2>AI에게 물어보세요</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(
              `/chat?q=${encodeURIComponent(query || "오늘 저녁 7시 이후 가능한 배드민턴장을 찾아줘")}`,
            );
          }}
        >
          <input
            aria-label="운동 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="오늘 저녁 7시 이후 가능한 배드민턴장을 찾아줘"
          />
          <button type="submit">검색</button>
        </form>
      </section>
      <div className="sports-shortcuts">
        {sports.map((s) => (
          <Link
            key={s.name}
            href={
              s.name === "more"
                ? "/facilities"
                : `/facilities?q=${encodeURIComponent(s.label)}`
            }
          >
            <DesignGraphic name={s.name} />
            <span>{s.label}</span>
          </Link>
        ))}
      </div>
      <h2 className="recommend-title">내 주변 추천 시설</h2>
      <DataState {...resource} retry={resource.reload}>
        {facilities.length ? (
          facilities
            .slice(0, 3)
            .map((f) => (
              <FacilityCard
                key={f.id ?? f.externalId ?? f.name}
                facility={f}
                featured
              />
            ))
        ) : (
          <Empty
            title="추천 시설이 아직 없어요"
            description={`${profile?.regionName ?? "선택한 지역"}의 다른 시설을 검색해보세요.`}
          />
        )}{" "}
        {kspo.length > 0 && (
          <>
            <SectionTitle>KSPO 공식 시설</SectionTitle>
            {kspo.map((f) => (
              <FacilityCard key={f.externalId ?? f.name} facility={f} />
            ))}
          </>
        )}
      </DataState>
    </div>
  );
}
export function SearchScreen({ chat = false }: { chat?: boolean }) {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState<SearchResponse | Facility[]>();
  const controller = useRef<AbortController | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const { profile } = useSession();
  async function search(text: string) {
    if (!text.trim()) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setSubmitted(text);
    setResult(undefined);
    setSearching(true);
    setSearchError("");
    try {
      const data = await api<SearchResponse | Facility[]>(
        "/api/user/facilities/search",
        "user",
        { method: "POST", body: jsonBody({ query: text.trim() }) },
        { signal: request.signal },
      );
      if (!request.signal.aborted) setResult(data);
    } catch (error) {
      if (!request.signal.aborted)
        setSearchError(
          error instanceof Error ? error.message : "검색하지 못했습니다.",
        );
    } finally {
      if (!request.signal.aborted) setSearching(false);
    }
  }
  useEffect(() => {
    setQuery(initial);
    if (initial) void search(initial);
    return () => controller.current?.abort();
  }, [initial]);
  const facilities = Array.isArray(result)
    ? result
    : (result?.facilities ?? result?.results ?? []);
  const keywords = Array.isArray(result) ? [] : (result?.keywords ?? []);
  return (
    <>
      <Header
        title={chat ? "AI 운동 도우미" : "AI 시설 찾기"}
        back="/home"
        badge={chat ? <Badge>서울 시설 연동</Badge> : undefined}
      />
      <div className="page-content search-page">
        {chat && (
          <div className="chat-row">
            <span className="ai-avatar">
              <DesignGraphic name="sparkles" />
            </span>
            <div className="chat-bubble">
              <strong>안녕하세요!</strong>
              <p>
                원하는 운동, 지역, 시간대를 알려주시면 이용 가능한 공공
                체육시설을 찾아드릴게요.
              </p>
            </div>
          </div>
        )}
        {submitted && chat && <div className="chat-user">{submitted}</div>}
        <form
          className={chat ? "chat-input" : "search-input"}
          onSubmit={(e) => {
            e.preventDefault();
            void search(query);
          }}
        >
          {!chat && <Search size={17} />}
          <input
            aria-label="시설 검색 조건"
            placeholder={
              chat
                ? "운동이나 시설 조건을 입력하세요"
                : "시설명 또는 원하는 운동을 입력하세요"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
          <button aria-label="검색하기" disabled={searching}>
            <DesignGraphic name="send" />
          </button>
        </form>
        {!submitted && (
          <>
            <div className="notice blue mt-4">
              {profile?.regionName ?? "내 지역"}에서 원하는 운동을 찾아보세요.
            </div>
            <SectionTitle>이렇게 물어보세요</SectionTitle>
            <div className="suggestion-grid">
              {[
                "지금 이용 가능한 수영장",
                "주차 가능한 헬스장",
                "1만원 이하 농구장",
                "내 주변 시설 추천",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setQuery(t);
                    void search(t);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}
        <ErrorMessage message={searchError} />
        {searching && (
          <p className="notice blue mt-3" role="status">
            조건에 맞는 시설을 찾고 있어요…
          </p>
        )}
        {result && (
          <>
            <section className="search-summary">
              <h2>조건을 이렇게 이해했어요</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {(keywords.length
                  ? keywords
                  : [profile?.regionName ?? "내 지역", submitted]
                ).map((k, i) => (
                  <Badge key={i} tone="gray">
                    {k}
                  </Badge>
                ))}
              </div>
              {facilities[0] && (
                <Link
                  href={facilityHref(facilities[0])}
                  className="recommended-result"
                >
                  <small>추천 시설</small>
                  <strong>{facilities[0].name}</strong>
                  <Badge value={facilities[0].status} />
                </Link>
              )}
            </section>
            <section className="keyword-box">
              <h3>AI 정리 키워드</h3>
              <p>{keywords.length ? keywords.join(" · ") : submitted}</p>
            </section>
            <SectionTitle detail={`${facilities.length}곳`}>
              조건에 맞는 시설
            </SectionTitle>
            {facilities.length ? (
              facilities.map((f) => (
                <FacilityCard
                  key={f.id ?? f.externalId ?? f.name}
                  facility={f}
                />
              ))
            ) : (
              <Empty
                title="조건에 맞는 시설이 없어요"
                description="운동명이나 지역 조건을 바꿔 다시 검색해주세요."
              />
            )}
            {chat && (
              <Link
                href={`/facilities?q=${encodeURIComponent(submitted)}`}
                className="button primary mt-4"
              >
                조건으로 시설 목록 보기
              </Link>
            )}
          </>
        )}
        {chat && (
          <p className="chat-disclaimer">
            AI 추천 결과는 실제 시설 운영 정보에 따라 달라질 수 있어요.
          </p>
        )}
      </div>
    </>
  );
}
export function FacilityDetail({ id }: { id: string }) {
  const params = useSearchParams();
  const [external, setExternal] = useState<Facility>();
  const isExternal = id === "external";
  const resource = useApi<Facility>(
    isExternal ? null : `/api/user/facilities/${id}`,
  );
  const guide = useApi<UsageGuide>(
    isExternal ? null : `/api/user/facilities/${id}/usage-guide`,
  );
  const safety = useApi<
    | { actionStatus?: string; reportSummary?: string }[]
    | { actionStatus?: string; reportSummary?: string }
  >(isExternal ? null : `/api/inspections/public/facilities/${id}/status`);
  const [date, setDate] = useState(localDate());
  const [calendar, setCalendar] = useState(false);
  useEffect(() => {
    if (isExternal)
      try {
        setExternal(
          JSON.parse(
            sessionStorage.getItem(`checheExternal:${params.get("key")}`) ||
              "null",
          ) ?? undefined,
        );
      } catch {}
  }, [isExternal, params]);
  const f = external ?? resource.data;
  const safetyRows = Array.isArray(safety.data)
    ? safety.data
    : safety.data
      ? [safety.data]
      : [];
  return (
    <DataState {...resource} retry={resource.reload}>
      {!f ? (
        <>
          <Header title="시설 상세" back="/facilities" />
          <Empty
            title="시설 정보를 찾을 수 없어요"
            description="시설 검색에서 다시 선택해주세요."
          />
        </>
      ) : (
        <>
          <section className="facility-hero">
            <div className="hero-controls">
              <Link
                href="/facilities"
                className="icon-button"
                aria-label="시설 목록"
              >
                ‹
              </Link>
              <Favorite facility={f} />
            </div>
            {f.imageUrl ? (
              <img
                src={photoUrl(f.imageUrl)}
                alt={f.name}
                className="facility-photo"
              />
            ) : (
              <FluidGraphic name="facilityHero" label="체육시설 일러스트" />
            )}
          </section>
          <div className="facility-detail">
            <div className="flex items-center justify-between gap-2">
              <h1>{f.name}</h1>
              <Badge value={f.status} />
            </div>
            <p className="detail-meta">
              <img src="/figma/7a737.svg" alt="" />
              {f.address}
            </p>
            <p className="detail-meta">
              <Phone size={15} />
              {f.phone ? (
                <a href={`tel:${f.phone}`}>{f.phone}</a>
              ) : (
                "전화번호 정보 없음"
              )}
            </p>
            <div className="flex gap-2 mt-3">
              <Badge tone="gray">{f.type}</Badge>
              {f.source === "KSPO_OPEN_API" && <Badge>KSPO 공식 시설</Badge>}
            </div>
            <div className="facility-info-grid">
              {[
                {
                  graphic: "clock",
                  title: "운영시간",
                  value:
                    guide.data?.openingTime || f.openingTime
                      ? `${(guide.data?.openingTime || f.openingTime)?.slice(0, 5)}–${(guide.data?.closingTime || f.closingTime)?.slice(0, 5) ?? ""}`
                      : "시설 문의",
                },
                {
                  graphic: "fee",
                  title: "이용요금",
                  value:
                    guide.data?.pricePerPerson != null
                      ? money(guide.data.pricePerPerson)
                      : "시설 문의",
                },
                {
                  graphic: "calendar",
                  title: "예약",
                  value: canReserve(f) ? "예약 가능" : "이용 안내",
                },
              ].map((i) => (
                <div key={i.title}>
                  <DesignGraphic name={i.graphic as GraphicName} />
                  <span>{i.title}</span>
                  <strong>{i.value}</strong>
                </div>
              ))}
            </div>
            <SectionTitle>이용 가능한 시설</SectionTitle>
            <div className="amenities">
              <div>
                <DesignGraphic
                  name={
                    f.type.includes("수영")
                      ? "swim"
                      : f.type.includes("헬스")
                        ? "gym"
                        : "badminton"
                  }
                />
                <span>{f.type}</span>
              </div>
            </div>
            <SectionTitle>이용 날</SectionTitle>
            <div className="date-select">
              <span>{dateLabel(date)}</span>
              <button onClick={() => setCalendar(true)}>다른 날짜 선택</button>
            </div>
            <section className="location-card">
              <strong>위치</strong>
              <p>{f.address}</p>
              <a
                className="text-link"
                href={`https://map.naver.com/p/search/${encodeURIComponent(f.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                지도에서 보기 <ArrowUpRight size={12} />
              </a>
            </section>
            <SectionTitle>예약·이용 안내</SectionTitle>
            <ErrorMessage message={guide.error} retry={guide.reload} />
            <p className="muted leading-6 text-sm">
              {guide.data?.description ||
                guide.data?.guide ||
                f.publicNotice ||
                "자세한 이용 조건은 시설에 문의해주세요."}
            </p>
            {(safeUrl(guide.data?.reservationUrl) || safeUrl(f.sourceUrl)) && (
              <a
                href={
                  safeUrl(guide.data?.reservationUrl) || safeUrl(f.sourceUrl)
                }
                target="_blank"
                rel="noreferrer"
                className="button secondary mt-4"
              >
                공식 이용 안내 열기 <ArrowUpRight size={16} />
              </a>
            )}
            {!isExternal && (
              <>
                <SectionTitle>안전점검 현황</SectionTitle>
                <ErrorMessage message={safety.error} retry={safety.reload} />
                {!safety.error &&
                  !safety.loading &&
                  (safetyRows.length ? (
                    safetyRows.map((s, i) => (
                      <div className="notice mt-2" key={i}>
                        <Badge value={s.actionStatus} />
                        <p className="mt-2">
                          {s.reportSummary || "시설에 문의해주세요."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="muted text-sm">
                      등록된 공개 점검 정보가 없습니다.
                    </p>
                  ))}
                <Link
                  className="text-link mt-5 block"
                  href={`/reports/new?facilityId=${f.id}`}
                >
                  시설 개선·수리 요청하기 ›
                </Link>
              </>
            )}
            <div className="detail-cta">
              {canReserve(f) ? (
                <Link
                  className="button primary"
                  href={`/facilities/${f.id}/reserve?date=${date}`}
                >
                  예약·이용하기
                </Link>
              ) : (
                <p className="notice blue">
                  {isExternal
                    ? "공공 API 시설은 현재 검색·이용 안내를 지원합니다."
                    : "현재 운영 상태에서는 예약할 수 없습니다."}
                </p>
              )}
            </div>
          </div>
          {calendar && (
            <CalendarSheet
              value={date}
              onSelect={setDate}
              onClose={() => setCalendar(false)}
            />
          )}
        </>
      )}
    </DataState>
  );
}
