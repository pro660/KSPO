import type {
  Account,
  Facility,
  Inspection,
  Profile,
  RegionOption,
  Reservation,
  UserReport,
} from "./types";
import { ApiError } from "./api";
import { canCancel, endTime } from "./format";
const districtNames = [
  "종로구",
  "중구",
  "용산구",
  "성동구",
  "광진구",
  "동대문구",
  "중랑구",
  "성북구",
  "강북구",
  "도봉구",
  "노원구",
  "은평구",
  "서대문구",
  "마포구",
  "양천구",
  "강서구",
  "구로구",
  "금천구",
  "영등포구",
  "동작구",
  "관악구",
  "서초구",
  "강남구",
  "송파구",
  "강동구",
];
const districtCodes = [
  "11110",
  "11140",
  "11170",
  "11200",
  "11215",
  "11230",
  "11260",
  "11290",
  "11305",
  "11320",
  "11350",
  "11380",
  "11410",
  "11440",
  "11470",
  "11500",
  "11530",
  "11545",
  "11560",
  "11590",
  "11620",
  "11650",
  "11680",
  "11710",
  "11740",
];
const regions: RegionOption[] = districtNames.map((name, i) => ({
  regionCode: districtCodes[i],
  regionName: `서울특별시 ${name}`,
}));
const baseFacilities: Facility[] = [
  "올림픽공원 체육센터",
  "송파체육문화회관",
  "잠실종합운동장",
  "송파구민회관",
  "문정체육센터",
].map((name, i) => ({
  id: i + 1,
  name,
  type: ["배드민턴", "수영", "다목적체육관", "헬스장", "배드민턴"][i],
  regionCode: "11710",
  regionName: "서울특별시 송파구",
  address: `서울특별시 송파구 ${i === 0 ? "올림픽로 424" : "체육관로 " + (i + 1)}`,
  phone: "02-410-1111",
  status: i === 2 ? "UNDER_INSPECTION" : "OPERATING",
  publicNotice: "시설 이용 전 운영시간을 확인해주세요.",
  openingTime: "06:00",
  closingTime: "22:00",
  source: null,
  maxCapacity: 8,
}));
const baseInspections: Inspection[] = baseFacilities
  .slice(0, 4)
  .map((f, i) => ({
    id: i + 1,
    facilityId: f.id!,
    facilityName: f.name,
    regionCode: f.regionCode,
    regionName: f.regionName,
    reporterUserId: 1,
    photoUrl: "",
    locationDescription: [
      "배드민턴장 A · 서측 벽면",
      "수영장 입구",
      "체육관 바닥",
      "2층 난간",
    ][i],
    note: "현장 확인이 필요합니다.",
    defectType: (
      ["CRACK", "WATER_LEAK", "SURFACE_DAMAGE", "CORROSION"] as const
    )[i],
    severity: (["HIGH", "MEDIUM", "CRITICAL", "LOW"] as const)[i],
    confidence: 0.91,
    checklist: [
      "손상 범위를 확인해주세요.",
      "현장 사진과 실제 상태를 비교해주세요.",
    ],
    similarCases: [],
    reportSummary:
      "의심 부위가 접수되었습니다. 담당자의 현장 확인이 필요합니다.",
    actionStatus: (
      ["REPORTED", "ACTION_SCHEDULED", "REVIEWING", "RESOLVED"] as const
    )[i],
    actionNote: i === 3 ? "보수 완료" : null,
    resolvedAt: i === 3 ? "2026-09-28T10:00:00" : null,
    createdAt: `2026-09-${28 - i}T14:30:00`,
    updatedAt: `2026-09-${28 - i}T14:30:00`,
  }));
function read<T>(key: string, fallback: T): T {
  const value = localStorage.getItem("checheDemo:" + key);
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  localStorage.setItem("checheDemo:" + key, JSON.stringify(value));
}
function profile(account: Account): Profile {
  return read("profile:" + account, {
    userId: account === "admin" ? 1 : 20,
    username: account === "admin" ? "seoul-admin" : "cheche_user",
    regionCode: "11710",
    regionName: "서울특별시 송파구",
    ...(account === "admin"
      ? { role: "REGIONAL_ADMIN", status: "ACTIVE" }
      : {}),
  } as Profile);
}
function check<T>(value: T | undefined): T {
  if (!value) throw new ApiError(404, "정보를 찾을 수 없습니다.");
  return value;
}
export async function demoRequest(
  path: string,
  account: Account,
  init: RequestInit = {},
): Promise<unknown> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const method = init.method ?? "GET";
  const url = new URL(path, "http://demo.local");
  const p = url.pathname;
  const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
  if (p.startsWith("/auth/")) {
    if (p.endsWith("/register")) return { message: "회원가입 완료" };
    const data = {
      ...profile(account),
      username: body.username || profile(account).username,
      role:
        account === "admin"
          ? body.username === "super-admin"
            ? "SUPER_USER"
            : "REGIONAL_ADMIN"
          : undefined,
    };
    write("profile:" + account, data);
    return {
      ...data,
      accessToken: `demo-${account}`,
      tokenType: "Bearer",
      expiresInSeconds: 3600,
      initialSetupRequired: !data.regionCode,
    };
  }
  if (p.endsWith("/regions")) return regions;
  if (p.endsWith("/me/region")) {
    const region = check(regions.find((r) => r.regionCode === body.regionCode));
    const current = profile(account);
    if (account === "admin" && current.regionCode)
      throw new ApiError(409, "관리 지역은 이미 설정되었습니다.");
    const data = { ...current, ...region, initialSetupRequired: false };
    write("profile:" + account, data);
    return data;
  }
  if (p.endsWith("/me")) return profile(account);
  let facilities = read<Facility[]>("facilities", baseFacilities);
  let inspections = read<Inspection[]>("inspections", baseInspections);
  let reservations = read<Reservation[]>("reservations", []);
  let reports = read<UserReport[]>("reports", []);
  if (p === "/api/facilities/public-data/sync")
    return {
      provider: "국민체육진흥공단",
      ...profile(account),
      scannedCount: 5,
      matchedCount: 5,
      createdCount: 0,
      updatedCount: 5,
    };
  if (p === "/api/user/facilities/home")
    return { facilities, kspoFacilities: [] };
  if (p === "/api/user/facilities/search") {
    const terms = String(body.query ?? "").split(/\s+/);
    const matched = facilities.filter((f) =>
      terms.some((t) => `${f.name} ${f.type}`.includes(t)),
    );
    return {
      facilities: matched,
      keywords: terms,
      summary: matched.length
        ? `${matched.length}개 시설을 찾았어요.`
        : "검색 조건을 바꿔보세요.",
    };
  }
  if (p === "/api/facilities" && method === "POST") {
    const f = { ...body, id: Date.now() };
    facilities.push(f);
    write("facilities", facilities);
    return f;
  }
  if (p === "/api/facilities") return facilities;
  const facilityMatch = p.match(
    /^\/api\/(?:user\/)?facilities\/(\d+)(\/usage-guide)?$/,
  );
  if (facilityMatch) {
    const f = check(facilities.find((f) => f.id === +facilityMatch[1]));
    if (facilityMatch[2])
      return {
        description:
          "운동에 적합한 복장과 실내용 운동화를 준비해주세요. 예약은 1시간 단위입니다.",
        openingTime: f.openingTime,
        closingTime: f.closingTime,
        pricePerPerson: 5000,
      };
    if (method === "PUT") {
      facilities = facilities.map((x) =>
        x.id === f.id ? { ...x, ...body } : x,
      );
      write("facilities", facilities);
      return { ...f, ...body };
    }
    return f;
  }
  if (p === "/api/inspections/dashboard")
    return {
      totalInspections: inspections.length,
      unresolvedInspections: inspections.filter(
        (i) => i.actionStatus !== "RESOLVED",
      ).length,
      resolvedInspections: inspections.filter(
        (i) => i.actionStatus === "RESOLVED",
      ).length,
    };
  if (p === "/api/inspections" && method === "POST") {
    const form = init.body as FormData;
    const f = check(
      facilities.find((f) => f.id === Number(form.get("facilityId"))),
    );
    const file = form.get("photo") as File;
    const photo = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const i: Inspection = {
      ...baseInspections[0],
      id: Date.now(),
      facilityId: f.id!,
      facilityName: f.name,
      regionCode: f.regionCode,
      regionName: f.regionName,
      photoUrl: photo,
      locationDescription: String(form.get("locationDescription")),
      note: String(form.get("note") ?? ""),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inspections.unshift(i);
    write("inspections", inspections);
    return i;
  }
  if (p === "/api/inspections") return inspections;
  if (p === "/api/inspections/open")
    return inspections.filter((i) => i.actionStatus !== "RESOLVED");
  const history = p.match(/^\/api\/inspections\/facilities\/(\d+)\/history$/);
  if (history) return inspections.filter((i) => i.facilityId === +history[1]);
  const publicStatus = p.match(
    /^\/api\/inspections\/public\/facilities\/(\d+)\/status$/,
  );
  if (publicStatus)
    return inspections
      .filter((i) => i.facilityId === +publicStatus[1])
      .map((i) => ({
        actionStatus: i.actionStatus,
        reportSummary: i.reportSummary,
      }));
  const inspectionMatch = p.match(
    /^\/api\/inspections\/(\d+)\/(action|report)$/,
  );
  if (inspectionMatch) {
    const i = check(inspections.find((i) => i.id === +inspectionMatch[1]));
    if (inspectionMatch[2] === "report")
      return `CheChe 안전점검 보고서\n시설: ${i.facilityName}\n위치: ${i.locationDescription}\n${i.reportSummary}\n조치: ${i.actionNote ?? "미등록"}`;
    inspections = inspections.map((x) =>
      x.id === i.id
        ? {
            ...x,
            actionStatus: body.status,
            actionNote: body.actionNote,
            resolvedAt:
              body.status === "RESOLVED" ? new Date().toISOString() : null,
          }
        : x,
    );
    write("inspections", inspections);
    return inspections.find((x) => x.id === i.id);
  }
  if (p === "/api/user/reservations/availability") {
    const day = url.searchParams.get("date");
    const fid = Number(url.searchParams.get("facilityId"));
    return {
      slots: Array.from({ length: 16 }, (_, i) => ({
        startTime: `${String(i + 6).padStart(2, "0")}:00:00`,
        available:
          !reservations.some(
            (r) =>
              r.facilityId === fid &&
              r.reservationDate === day &&
              r.startTime === `${String(i + 6).padStart(2, "0")}:00:00` &&
              r.status === "CONFIRMED",
          ) &&
          new Date(`${day}T${String(i + 6).padStart(2, "0")}:00:00`) >
            new Date(),
        remainingCapacity: 8,
      })),
      pricePerPerson: 5000,
      maxCapacity: 8,
    };
  }
  if (p === "/api/user/reservations" && method === "POST") {
    const f = check(facilities.find((f) => f.id === body.facilityId));
    if (
      reservations.some(
        (r) =>
          r.facilityId === body.facilityId &&
          r.reservationDate === body.reservationDate &&
          r.startTime === body.startTime &&
          r.status === "CONFIRMED",
      )
    )
      throw new ApiError(409, "이미 예약된 시간입니다.");
    const r: Reservation = {
      ...body,
      id: Date.now(),
      facilityName: f.name,
      status: "CONFIRMED",
      totalPrice: body.participantCount * 5000,
      endTime: endTime(body.startTime) + ":00",
    };
    reservations.unshift(r);
    write("reservations", reservations);
    return r;
  }
  if (p === "/api/user/reservations") return reservations;
  const reservationMatch = p.match(
    /^\/api\/user\/reservations\/(\d+)(\/cancel)?$/,
  );
  if (reservationMatch) {
    const r = check(reservations.find((r) => r.id === +reservationMatch[1]));
    if (reservationMatch[2]) {
      if (!canCancel(r)) throw new ApiError(409, "취소할 수 없는 예약입니다.");
      reservations = reservations.map((x) =>
        x.id === r.id ? { ...x, status: "CANCELLED" } : x,
      );
      write("reservations", reservations);
      return { ...r, status: "CANCELLED" };
    }
    return r;
  }
  if (p === "/api/user/reports" && method === "POST") {
    const form = init.body as FormData;
    const r = {
      id: Date.now(),
      facilityId: Number(form.get("facilityId")),
      facilityName: facilities.find(
        (f) => f.id === Number(form.get("facilityId")),
      )?.name,
      category: form.get("category"),
      locationDescription: form.get("locationDescription"),
      comment: form.get("comment"),
      status: "RECEIVED",
      createdAt: new Date().toISOString(),
    };
    reports.unshift(r as UserReport);
    write("reports", reports);
    return r;
  }
  if (p === "/api/user/reports") return reports;
  const reportMatch = p.match(/^\/api\/user\/reports\/(\d+)$/);
  if (reportMatch) return check(reports.find((r) => r.id === +reportMatch[1]));
  let admins = read<Profile[]>("admins", [
    {
      userId: 1,
      username: "seoul-admin",
      role: "REGIONAL_ADMIN",
      status: "ACTIVE",
      regionCode: "11710",
      regionName: "서울특별시 송파구",
    },
    {
      userId: 2,
      username: "gangnam-admin",
      role: "REGIONAL_ADMIN",
      status: "ACTIVE",
      regionCode: "11680",
      regionName: "서울특별시 강남구",
    },
    {
      userId: 3,
      username: "super-admin",
      role: "SUPER_USER",
      status: "ACTIVE",
      regionCode: null,
      regionName: null,
    },
  ]);
  if (p === "/api/admins") return admins;
  const adminMatch = p.match(/^\/api\/admins\/(\d+)\/authority$/);
  if (adminMatch) {
    admins = admins.map((a) =>
      a.userId === +adminMatch[1] ? { ...a, ...body } : a,
    );
    write("admins", admins);
    return check(admins.find((a) => a.userId === +adminMatch[1]));
  }
  throw new ApiError(404, "이 미리보기 기능의 데이터를 찾을 수 없습니다.");
}
