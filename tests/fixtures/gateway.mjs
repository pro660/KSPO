// Local-only UI verification fixture. Never use this server for real accounts.
import { createServer } from "node:http";

const profile = {
  userId: 20,
  username: "ui_fixture",
  regionCode: "11710",
  regionName: "서울특별시 송파구",
};
const facility = {
  id: 1,
  name: "화면 검증 체육센터",
  type: "배드민턴",
  regionCode: "11710",
  regionName: profile.regionName,
  address: "서울특별시 송파구",
  phone: null,
  status: "OPERATING",
  publicNotice: null,
  maxCapacity: 8,
};
let reservation = {
  id: 1,
  facilityId: 1,
  facilityName: facility.name,
  reservationDate: "2099-10-01",
  startTime: "19:00:00",
  endTime: "20:00:00",
  participantCount: 2,
  status: "CONFIRMED",
};
let cancelAttempts = 0;
const districts = [
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
const regions = districts.map((name, i) => ({
  regionCode: name === "송파구" ? "11710" : String(11100 + i),
  regionName: `서울특별시 ${name}`,
}));
const inspection = {
  id: 1,
  facilityId: 1,
  facilityName: facility.name,
  regionCode: profile.regionCode,
  regionName: profile.regionName,
  reporterUserId: 20,
  photoUrl: "/inspection-photos/fixture.svg",
  locationDescription: "체육관 서측 벽면",
  defectType: "CRACK",
  severity: "HIGH",
  confidence: 0.91,
  checklist: ["손상 범위를 확인해주세요.", "현장 상태와 사진을 비교해주세요."],
  similarCases: [
    "동일 시설의 최근 기타 손상 기록 확인",
    "동일 지역·동일 결함 유형의 조치 완료 사례 비교",
  ],
  reportSummary: "균열 의심 부위의 현장 확인이 필요합니다.",
  actionStatus: "REPORTED",
  actionNote: null,
  createdAt: "2026-09-30T14:00:00",
};
const external = {
  ...facility,
  id: undefined,
  source: "SEOUL_OPEN_API",
  externalId: "fixture-external",
  name: "외부 공공 체육시설",
  sourceUrl: "https://www.sisul.or.kr",
};
const report = {
  id: 1,
  facilityId: 1,
  facilityName: facility.name,
  category: "REPAIR",
  locationDescription: "체육관 출입구",
  comment: "화면 검증용 수리 요청입니다.",
  status: "RECEIVED",
  createdAt: "2026-09-30T14:00:00",
  photoUrl: inspection.photoUrl,
};
const sessions = new Map();
createServer(async (req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  const reply = (body, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (path.startsWith("/inspection-photos/")) {
    if (!sessions.has(req.headers.authorization))
      return reply({ message: "Photo authentication required" }, 401);
    if (path !== "/inspection-photos/fixture.svg")
      return reply({ message: "Photo not found" }, 404);
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    return res.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#eaf3ff"/><text x="320" y="200" text-anchor="middle" fill="#1677ef" font-size="24">Authenticated photo fixture</text></svg>',
    );
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk); // Test-only payloads; never log credentials.
  if (path.endsWith("/register")) return reply({});
  if (path.endsWith("/login")) {
    const input = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const current = {
      ...profile,
      username: input.username,
      ...(path.includes("/admin/")
        ? {
            role:
              input.username === "regional" ? "REGIONAL_ADMIN" : "SUPER_USER",
            status: input.username === "suspended" ? "SUSPENDED" : "ACTIVE",
          }
        : {}),
    };
    if (input.username === "first_user")
      Object.assign(current, { regionCode: null, regionName: null });
    const accessToken = `local-fixture-${input.username}`;
    sessions.set(`Bearer ${accessToken}`, current);
    return reply({
      ...current,
      accessToken,
      tokenType: "Bearer",
      initialSetupRequired: !current.regionCode,
    });
  }
  const current = sessions.get(req.headers.authorization);
  if (!current)
    return reply({ message: "테스트 계정으로 로그인해주세요." }, 401);
  if (path.endsWith("/me")) return reply(current);
  if (path.endsWith("/regions")) return reply(regions);
  if (path.endsWith("/region")) {
    const input = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const region = regions.find((item) => item.regionCode === input.regionCode);
    if (!region) return reply({ message: "선택한 지역을 확인해주세요." }, 400);
    Object.assign(current, region);
    res.writeHead(204);
    return res.end();
  }
  if (path === "/api/admins")
    return reply([{ ...profile, role: "REGIONAL_ADMIN", status: "ACTIVE" }]);
  if (path.endsWith("/authority")) {
    res.writeHead(204);
    return res.end();
  }
  if (path.endsWith("/cancel")) {
    if (++cancelAttempts === 1)
      return reply(
        { message: "일시적으로 취소할 수 없습니다. 다시 시도해주세요." },
        503,
      );
    await new Promise((resolve) => setTimeout(resolve, 1200));
    reservation = { ...reservation, status: "CANCELLED" };
    return reply(reservation);
  }
  if (path === "/api/user/reservations/1") return reply(reservation);
  if (path === "/api/user/reservations/availability")
    return reply({
      slots: [
        { startTime: "19:00:00", available: true, remainingCapacity: 8 },
        { startTime: "20:00:00", available: false, remainingCapacity: 0 },
      ],
      pricePerPerson: 3000,
    });
  if (path === "/api/user/reservations") {
    if (req.method === "POST") {
      reservation = {
        ...reservation,
        ...JSON.parse(Buffer.concat(chunks).toString()),
        status: "CONFIRMED",
      };
      return reply(reservation);
    }
    return reply([reservation]);
  }
  if (path === "/api/user/reports/1") return reply(report);
  if (path === "/api/user/reports")
    return reply(req.method === "POST" ? report : [report]);
  if (path === "/api/user/facilities/home")
    return reply({ facilities: [facility], kspoFacilities: [external] });
  if (path === "/api/user/facilities/search")
    return reply({
      facilities: [facility, external],
      keywords: ["송파구", "배드민턴"],
      summary: "조건에 맞는 시설입니다.",
    });
  if (path === "/api/user/facilities/1" || path === "/api/facilities/1") {
    if (req.method === "PUT")
      Object.assign(facility, JSON.parse(Buffer.concat(chunks).toString()));
    return reply(facility);
  }
  if (path.endsWith("/usage-guide"))
    return reply({ description: "화면 검증용 이용 안내" });
  if (path === "/api/facilities")
    return reply(req.method === "POST" ? facility : [facility]);
  if (path === "/api/facilities/public-data/sync")
    return reply({
      ...profile,
      scannedCount: 1,
      createdCount: 0,
      updatedCount: 1,
    });
  if (path === "/api/inspections/1/report") {
    res.writeHead(200, { "Content-Type": "text/plain;charset=utf-8" });
    return res.end("시설 안전점검 보고서\n" + inspection.reportSummary);
  }
  if (path === "/api/inspections/1/action") {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    Object.assign(inspection, {
      actionStatus: input.status,
      actionNote: input.actionNote,
    });
    return reply(inspection);
  }
  if (path === "/api/inspections/public/facilities/1/status")
    return reply([
      {
        actionStatus: inspection.actionStatus,
        reportSummary: inspection.reportSummary,
      },
    ]);
  if (path === "/api/inspections/dashboard")
    return reply({
      totalInspections: 2,
      unresolvedInspections: 2,
      resolvedInspections: 0,
    });
  if (
    path === "/api/inspections" ||
    path === "/api/inspections/open" ||
    path === "/api/inspections/facilities/1/history"
  )
    return reply([
      inspection,
      {
        ...inspection,
        id: 2,
        severity: "LOW",
        photoUrl: "/inspection-photos/missing.png",
      },
    ]);
  return reply({ message: "요청한 정보를 찾을 수 없습니다." }, 404);
}).listen(9091, "127.0.0.1", () =>
  console.log("UI fixture ready on http://127.0.0.1:9091 (local mock only)"),
);
