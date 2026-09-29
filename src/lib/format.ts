import type { Facility, Reservation } from "./types";
export const labels: Record<string, string> = {
  OPERATING: "운영 중",
  UNDER_INSPECTION: "점검 중",
  CLOSED: "운영 중단",
  CRACK: "균열",
  CORROSION: "부식",
  DEFORMATION: "변형",
  SURFACE_DAMAGE: "표면 손상",
  WATER_LEAK: "누수",
  OTHER: "기타",
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  CRITICAL: "긴급",
  REPORTED: "미조치",
  REVIEWING: "검토 중",
  ACTION_SCHEDULED: "조치 예정",
  RESOLVED: "조치 완료",
  RECEIVED: "접수 완료",
  REPAIR_SCHEDULED: "수리 예정",
  COMPLETED: "완료",
  REJECTED: "반려",
  CONFIRMED: "예약 확정",
  CANCELLED: "예약 취소",
  ACTIVE: "활성",
  SUSPENDED: "정지",
  REGIONAL_ADMIN: "지역 관리자",
  SUPER_USER: "슈퍼 관리자",
  DETERIORATION: "노후화",
  IMPROVEMENT: "개선",
  REPAIR: "수리",
};
export const label = (value?: string | null) =>
  value ? (labels[value] ?? value) : "확인 중";
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dateLabel(value: string) {
  return new Date(
    value.length === 10 ? `${value}T12:00:00` : value,
  ).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
export function canReserve(f: Facility) {
  return (
    Number.isInteger(f.id) &&
    f.status === "OPERATING" &&
    f.source !== "SEOUL_OPEN_API" &&
    f.source !== "KSPO_OPEN_API"
  );
}
export function canCancel(r: Reservation, now = new Date()) {
  return (
    r.status === "CONFIRMED" &&
    new Date(`${r.reservationDate}T${r.startTime}`) > now
  );
}
export function endTime(start: string) {
  return `${String(Number(start.slice(0, 2)) + 1).padStart(2, "0")}:00`;
}
export const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
export function safeUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}
