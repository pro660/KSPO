"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchFilters } from "@/lib/use-search-filters";
import { reservationFilters } from "@/lib/search-filters";
import { ChevronLeft, ChevronRight, Check, Minus, Plus } from "lucide-react";
import {
  Badge,
  Button,
  DataState,
  Empty,
  ErrorMessage,
  Header,
  SectionTitle,
  Sheet,
  Tabs,
} from "@/components/ui";
import { api, ApiError, jsonBody } from "@/lib/api";
import { useSession } from "@/components/shell";
import {
  canCancel,
  canReserve,
  dateLabel,
  endTime,
  localDate,
  isCalendarDate,
  money,
} from "@/lib/format";
import { useApi, useMutation } from "@/lib/hooks";
import {
  listOf,
  type Availability,
  type Facility,
  type ListResponse,
  type Reservation,
  type TimeSlot,
} from "@/lib/types";
export function CalendarSheet({
  value,
  onSelect,
  onClose,
}: {
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(value);
  const [month, setMonth] = useState(() => new Date(`${value}T12:00:00`));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = localDate();
  return (
    <Sheet
      title="날짜 선택"
      onClose={onClose}
      footer={
        <Button
          disabled={selected < today}
          onClick={() => {
            onSelect(selected);
            onClose();
          }}
        >
          이 날짜로 이용 시간 확인
        </Button>
      }
    >
      <p className="muted text-xs">이용할 날짜를 선택해주세요.</p>
      <div className="calendar-month">
        <button
          aria-label="이전 달"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          <ChevronLeft size={18} />
        </button>
        <strong>
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </strong>
        <button
          aria-label="다음 달"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-grid">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <span className="weekday" key={d}>
            {d}
          </span>
        ))}
        {Array.from({ length: first.getDay() }, (_, i) => (
          <span key={`blank${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = localDate(
            new Date(month.getFullYear(), month.getMonth(), i + 1),
          );
          return (
            <button
              key={day}
              disabled={day < today}
              aria-label={dateLabel(day)}
              aria-pressed={selected === day}
              className={selected === day ? "selected" : ""}
              onClick={() => setSelected(day)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="notice blue mt-5">
        <small>선택한 날짜</small>
        <strong className="block mt-1">{dateLabel(selected)}</strong>
      </div>
    </Sheet>
  );
}
export function normalizeSlots(
  data: Availability | TimeSlot[] | string[] | undefined,
): TimeSlot[] {
  if (!data) return [];
  const raw = Array.isArray(data)
    ? data
    : (data.slots ?? data.availableTimes ?? []);
  return raw
    .map((s) => (typeof s === "string" ? { startTime: s, available: true } : s))
    .filter(
      (s) =>
        /^\d{2}:00(?::00)?$/.test(s.startTime) &&
        Number(s.startTime.slice(0, 2)) >= 6 &&
        Number(s.startTime.slice(0, 2)) <= 21,
    );
}
export function BookingScreen({ id }: { id: string }) {
  const { profile } = useSession();
  const params = useSearchParams();
  const initial = params.get("date");
  const [date, setDate] = useState(
    initial && isCalendarDate(initial) && initial >= localDate()
      ? initial
      : localDate(),
  );
  const [calendar, setCalendar] = useState(false);
  const [time, setTime] = useState("");
  const [count, setCount] = useState(1);
  const facility = useApi<Facility>(`/api/user/facilities/${id}`);
  const availability = useApi<Availability | TimeSlot[] | string[]>(
    facility.data && canReserve(facility.data, profile?.regionCode ?? null)
      ? `/api/user/reservations/availability?facilityId=${id}&date=${date}`
      : null,
  );
  const mutation = useMutation();
  const router = useRouter();
  const slots = normalizeSlots(availability.data);
  const slot = slots.find((s) => s.startTime === time);
  const available =
    availability.data && !Array.isArray(availability.data)
      ? availability.data
      : undefined;
  const capacity =
    slot?.remainingCapacity ??
    available?.maxCapacity ??
    facility.data?.maxCapacity;
  const fee = available?.pricePerPerson;
  useEffect(() => {
    setTime("");
    setCount(1);
  }, [date]);
  useEffect(() => {
    if (capacity != null && count > capacity) setCount(Math.max(1, capacity));
  }, [capacity, count]);
  const selectable =
    !!slot?.available &&
    (capacity == null || count <= capacity) &&
    new Date(`${date}T${slot.startTime}`) > new Date();
  async function reserve() {
    if (
      !selectable ||
      availability.loading ||
      !!availability.error ||
      !facility.data ||
      !canReserve(facility.data, profile?.regionCode ?? null)
    )
      return;
    await mutation.run(
      async () => {
        try {
          return await api<Reservation>("/api/user/reservations", "user", {
            method: "POST",
            body: jsonBody({
              facilityId: Number(id),
              reservationDate: date,
              startTime: time.length === 5 ? `${time}:00` : time,
              participantCount: count,
            }),
          });
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) {
            setTime("");
            availability.reload();
          }
          throw e;
        }
      },
      (r) => router.push(r?.id ? `/reservations/${r.id}` : "/reservations"),
      "예약이 완료되었습니다.",
    );
  }
  return (
    <>
      <Header title="예약하기" back={`/facilities/${id}`} />
      <div className="page-content booking-page">
        <DataState {...facility} retry={facility.reload}>
          {facility.data &&
          !canReserve(facility.data, profile?.regionCode ?? null) ? (
            <Empty
              title="현재 예약할 수 없는 시설입니다"
              description="내 지역의 운영 중인 시설만 예약할 수 있습니다. 시설 안내와 내 지역 설정을 확인해주세요."
            />
          ) : (
            facility.data && (
              <>
                <div className="booking-facility">
                  <div>
                    <strong>{facility.data.name}</strong>
                    <p>
                      {facility.data.type}
                      {fee != null && ` · 1인 ${money(fee)}`}
                    </p>
                  </div>
                  <Badge value="OPERATING">예약 가능</Badge>
                </div>
                <SectionTitle
                  detail={`${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월`}
                >
                  1. 이용 날짜
                </SectionTitle>
                <div className="week-dates">
                  {Array.from({ length: 5 }, (_, i) => {
                    const d = new Date(`${date}T12:00:00`);
                    d.setDate(d.getDate() + i);
                    const iso = localDate(d);
                    return (
                      <button
                        key={iso}
                        className={date === iso ? "selected" : ""}
                        onClick={() => setDate(iso)}
                      >
                        <strong>{d.getDate()}</strong>
                        <span>
                          {
                            ["일", "월", "화", "수", "목", "금", "토"][
                              d.getDay()
                            ]
                          }
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => setCalendar(true)}
                  className="compact mt-3"
                >
                  날짜 변경
                </Button>
                <SectionTitle detail={dateLabel(date)}>
                  2. 이용 가능 시간
                </SectionTitle>
                <DataState {...availability} retry={availability.reload}>
                  {slots.length ? (
                    <div className="time-slots">
                      {slots.map((s) => {
                        const disabled =
                          !s.available ||
                          s.remainingCapacity === 0 ||
                          new Date(`${date}T${s.startTime}`) <= new Date();
                        return (
                          <button
                            key={s.startTime}
                            disabled={disabled}
                            className={time === s.startTime ? "selected" : ""}
                            aria-pressed={time === s.startTime}
                            onClick={() => setTime(s.startTime)}
                          >
                            <strong>
                              {s.startTime.slice(0, 5)} – {endTime(s.startTime)}
                            </strong>
                            <span>
                              {disabled
                                ? "마감"
                                : s.remainingCapacity != null
                                  ? `최대 ${s.remainingCapacity}명`
                                  : "예약 가능"}
                            </span>
                            {fee != null && <b>{money(fee)}</b>}
                            {time === s.startTime && <Check size={16} />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty
                      title="예약 가능한 시간이 없어요"
                      description="다른 날짜를 선택해주세요."
                    />
                  )}
                </DataState>
                <SectionTitle>3. 이용 인원</SectionTitle>
                <p className="muted text-xs">
                  예약은 정각부터 1시간 단위로 진행됩니다.
                </p>
                <div className="participant-counter">
                  <button
                    aria-label="인원 줄이기"
                    disabled={count <= 1}
                    onClick={() => setCount((c) => c - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <strong>{count}명</strong>
                  <span>
                    {capacity != null ? `최대 ${capacity}명` : "이용 인원"}
                  </span>
                  <button
                    aria-label="인원 늘리기"
                    disabled={capacity != null && count >= capacity}
                    onClick={() => setCount((c) => c + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {fee != null ? (
                  <div className="price-summary">
                    <h3>예상 이용료</h3>
                    <p>
                      <span>1인 이용료</span>
                      <span>{money(fee)}</span>
                    </p>
                    <p>
                      <span>인원</span>
                      <span>× {count}명</span>
                    </p>
                    <p className="total">
                      <strong>총 예상 이용료</strong>
                      <strong>{money(fee * count)}</strong>
                    </p>
                    <small>결제는 시설 안내에 따라 진행됩니다.</small>
                  </div>
                ) : (
                  <p className="notice mt-4">
                    이용료와 결제 방법은 시설에 문의해주세요.
                  </p>
                )}
                <ErrorMessage message={mutation.error} />
                <Button
                  className="mt-5"
                  disabled={
                    !selectable || availability.loading || !!availability.error
                  }
                  busy={mutation.busy}
                  onClick={reserve}
                >
                  {time
                    ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일 ${time.slice(0, 5)} · ${count}명 예약하기`
                    : "이용 시간을 선택해주세요"}
                </Button>
              </>
            )
          )}
        </DataState>
      </div>
      {calendar && (
        <CalendarSheet
          value={date}
          onSelect={setDate}
          onClose={() => setCalendar(false)}
        />
      )}
    </>
  );
}
export function ReservationsScreen() {
  const resource = useApi<ListResponse<Reservation>>("/api/user/reservations");
  const {
    filters: { tab },
    setFilter,
  } = useSearchFilters(reservationFilters);
  const rows = listOf(resource.data);
  const upcoming = rows.filter(
    (r) =>
      r.status === "CONFIRMED" &&
      new Date(`${r.reservationDate}T${r.endTime ?? endTime(r.startTime)}`) >
        new Date(),
  );
  const visible =
    tab === "upcoming"
      ? upcoming
      : tab === "cancelled"
        ? rows.filter((r) => r.status === "CANCELLED")
        : rows.filter(
            (r) =>
              r.status === "COMPLETED" ||
              (r.status === "CONFIRMED" && !upcoming.includes(r)),
          );
  return (
    <>
      <Header title="예약내역" />
      <div className="page-content">
        <p className="muted text-xs mb-5">시설 예약과 이용 내역을 확인하세요</p>
        <Tabs
          value={tab}
          onChange={(value) => setFilter("tab", value)}
          items={[
            {
              value: "upcoming",
              label: `이용 예정 ${resource.data ? upcoming.length : "—"}`,
            },
            { value: "past", label: "이용 완료" },
            { value: "cancelled", label: "취소" },
          ]}
        />
        <SectionTitle>
          {tab === "upcoming"
            ? "다가오는 예약"
            : tab === "past"
              ? "최근 이용"
              : "취소한 예약"}
        </SectionTitle>
        <DataState {...resource} retry={resource.reload}>
          {visible.length ? (
            visible.map((r) => <ReservationCard key={r.id} reservation={r} />)
          ) : (
            <Empty
              title="예약 내역이 없어요"
              description="우리 동네 체육시설을 찾아 예약해보세요."
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
function ReservationCard({ reservation: r }: { reservation: Reservation }) {
  const days = Math.ceil(
    (new Date(`${r.reservationDate}T00:00:00`).getTime() -
      new Date(`${localDate()}T00:00:00`).getTime()) /
      86400000,
  );
  return (
    <article className="reservation-card">
      <div className="flex items-start gap-4">
        <Badge tone={days > 3 ? "green" : "blue"}>
          {days > 0 ? `D-${days}` : days === 0 ? "오늘" : "이용"}
        </Badge>
        <div>
          <strong>{r.facilityName}</strong>
          <p className="muted text-xs mt-1">
            {r.status === "CONFIRMED"
              ? "시설 예약"
              : r.status === "CANCELLED"
                ? "예약 취소"
                : "이용 완료"}
          </p>
        </div>
      </div>
      <p className="mt-5 text-sm">
        {dateLabel(r.reservationDate)} · {r.startTime.slice(0, 5)}–
        {(r.endTime ?? endTime(r.startTime)).slice(0, 5)}
      </p>
      <div className="flex justify-between items-center mt-2">
        <span className="muted text-xs">
          {r.participantCount}명
          {r.totalPrice != null && ` · ${money(r.totalPrice)}`}
        </span>
        <Link href={`/reservations/${r.id}`} className="small-link">
          예약 상세 보기 ›
        </Link>
      </div>
    </article>
  );
}
export function ReservationDetail({ id }: { id: string }) {
  const resource = useApi<Reservation>(`/api/user/reservations/${id}`);
  const [confirm, setConfirm] = useState(false);
  const mutation = useMutation();
  return (
    <>
      <Header title="예약 상세" back="/reservations" />
      <div className="page-content">
        <DataState {...resource} retry={resource.reload}>
          {resource.data && (
            <>
              <Badge value={resource.data.status} />
              <h2 className="text-xl font-bold mt-5">
                {resource.data.facilityName}
              </h2>
              <div className="info-list mt-5">
                <p>
                  <span>이용 날짜</span>
                  <strong>{dateLabel(resource.data.reservationDate)}</strong>
                </p>
                <p>
                  <span>이용 시간</span>
                  <strong>
                    {resource.data.startTime.slice(0, 5)}–
                    {(
                      resource.data.endTime ?? endTime(resource.data.startTime)
                    ).slice(0, 5)}
                  </strong>
                </p>
                <p>
                  <span>이용 인원</span>
                  <strong>{resource.data.participantCount}명</strong>
                </p>
                <p>
                  <span>예약 번호</span>
                  <strong>{resource.data.id}</strong>
                </p>
                {resource.data.totalPrice != null && (
                  <p>
                    <span>예상 이용료</span>
                    <strong>{money(resource.data.totalPrice)}</strong>
                  </p>
                )}
              </div>
              <Link
                href={`/facilities/${resource.data.facilityId}`}
                className="button secondary mt-6"
              >
                시설 이용 안내
              </Link>
              {canCancel(resource.data) && (
                <Button
                  variant="ghost"
                  className="mt-3"
                  onClick={() => {
                    mutation.setError("");
                    setConfirm(true);
                  }}
                >
                  예약 취소
                </Button>
              )}
            </>
          )}
        </DataState>
      </div>
      {confirm && (
        <Sheet
          title="예약을 취소할까요?"
          variant="dialog"
          busy={mutation.busy}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <Button
                variant="danger"
                className="mt-6"
                busy={mutation.busy}
                onClick={() =>
                  mutation.run(
                    () =>
                      api(`/api/user/reservations/${id}/cancel`, "user", {
                        method: "PATCH",
                      }),
                    () => {
                      setConfirm(false);
                      resource.reload();
                    },
                    "예약이 취소되었습니다.",
                  )
                }
              >
                예약 취소하기
              </Button>
              <Button
                variant="ghost"
                className="mt-2"
                disabled={mutation.busy}
                onClick={() => setConfirm(false)}
              >
                예약 유지
              </Button>
            </>
          }
        >
          <p className="muted text-sm">
            취소한 시간은 다른 이용자가 예약할 수 있습니다.
          </p>
          <ErrorMessage message={mutation.error} />
        </Sheet>
      )}
    </>
  );
}
