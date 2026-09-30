// Local-only UI verification fixture. Never use this server for real accounts.
import { createServer } from "node:http";

const profile = { userId: 20, username: "ui_fixture", regionCode: "11710", regionName: "서울특별시 송파구" };
const facility = { id: 1, name: "화면 검증 체육센터", type: "배드민턴", regionCode: "11710", regionName: profile.regionName, address: "서울특별시 송파구", phone: null, status: "OPERATING", publicNotice: null, maxCapacity: 8 };
let reservation = { id: 1, facilityId: 1, facilityName: facility.name, reservationDate: "2099-10-01", startTime: "19:00:00", endTime: "20:00:00", participantCount: 2, status: "CONFIRMED" };
let cancelAttempts = 0;
const districts = ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구"];
const regions = districts.map((name, i) => ({ regionCode: name === "송파구" ? "11710" : String(11100 + i), regionName: `서울특별시 ${name}` }));
const inspection = { id: 1, facilityId: 1, facilityName: facility.name, regionCode: profile.regionCode, regionName: profile.regionName, reporterUserId: 20, photoUrl: "/inspection-photos/fixture.svg", locationDescription: "체육관 서측 벽면", defectType: "CRACK", severity: "HIGH", confidence: 0.91, checklist: ["손상 범위를 확인해주세요.", "현장 상태와 사진을 비교해주세요."], similarCases: ["동일 시설의 최근 기타 손상 기록 확인", "동일 지역·동일 결함 유형의 조치 완료 사례 비교"], reportSummary: "균열 의심 부위의 현장 확인이 필요합니다.", actionStatus: "REPORTED", actionNote: null, createdAt: "2026-09-30T14:00:00" };
createServer(async (req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  const reply = (body, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
  if (path.startsWith("/inspection-photos/")) {
    if (req.headers.authorization !== "Bearer local-fixture-token") return reply({ message: "Photo authentication required" }, 401);
    if (path !== "/inspection-photos/fixture.svg") return reply({ message: "Photo not found" }, 404);
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#eaf3ff"/><text x="320" y="200" text-anchor="middle" fill="#1677ef" font-size="24">Authenticated photo fixture</text></svg>');
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk); // Test-only payloads; never log credentials.
  if (path.endsWith("/register")) return reply({});
  if (path.endsWith("/login")) {
    const input = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    if (input.username === "first_user") Object.assign(profile, { username: "first_user", regionCode: null, regionName: null });
    return reply({ ...profile, accessToken: "local-fixture-token", tokenType: "Bearer", initialSetupRequired: !profile.regionCode });
  }
  if (path.endsWith("/me")) return reply({ ...profile, ...(path.includes("admins") ? { role: "SUPER_USER", status: "ACTIVE" } : {}) });
  if (path.endsWith("/regions")) return reply(regions);
  if (path.endsWith("/region")) {
    const input = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const region = regions.find(item => item.regionCode === input.regionCode);
    if (!region) return reply({ message: "선택한 지역을 확인해주세요." }, 400);
    Object.assign(profile, region);
    res.writeHead(204); return res.end();
  }
  if (path === "/api/admins") return reply([{ ...profile, role: "REGIONAL_ADMIN", status: "ACTIVE" }]);
  if (path.endsWith("/authority")) { res.writeHead(204); return res.end(); }
  if (path.endsWith("/cancel")) {
    if (++cancelAttempts === 1) return reply({ message: "일시적으로 취소할 수 없습니다. 다시 시도해주세요." }, 503);
    await new Promise(resolve => setTimeout(resolve, 1200));
    reservation = { ...reservation, status: "CANCELLED" };
    return reply(reservation);
  }
  if (path === "/api/user/reservations/1") return reply(reservation);
  if (path === "/api/user/reservations") return reply([reservation]);
  if (path === "/api/user/facilities/home") return reply({ facilities: [facility] });
  if (path === "/api/user/facilities/1" || path === "/api/facilities/1") return reply(facility);
  if (path.endsWith("/usage-guide")) return reply({ description: "화면 검증용 이용 안내" });
  if (path === "/api/facilities") return reply([facility]);
  if (path === "/api/inspections/dashboard") return reply({ totalInspections: 0, unresolvedInspections: 0, resolvedInspections: 0 });
  if (path === "/api/inspections" || path === "/api/inspections/open" || path === "/api/inspections/facilities/1/history") return reply([inspection, { ...inspection, id: 2, photoUrl: "/inspection-photos/missing.png" }]);
  return reply([]);
}).listen(9091, "127.0.0.1", () => console.log("UI fixture ready on http://127.0.0.1:9091 (local mock only)"));
