// Local-only UI verification fixture. Never use this server for real accounts.
import { createServer } from "node:http";

const profile = { userId: 20, username: "ui_fixture", regionCode: "11710", regionName: "서울특별시 송파구" };
const facility = { id: 1, name: "화면 검증 체육센터", type: "배드민턴", regionCode: "11710", regionName: profile.regionName, address: "서울특별시 송파구", phone: null, status: "OPERATING", publicNotice: null, maxCapacity: 8 };
let reservation = { id: 1, facilityId: 1, facilityName: facility.name, reservationDate: "2099-10-01", startTime: "19:00:00", endTime: "20:00:00", participantCount: 2, status: "CONFIRMED" };
let cancelAttempts = 0;
const districts = ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구"];
const regions = districts.map((name, i) => ({ regionCode: name === "송파구" ? "11710" : String(11100 + i), regionName: `서울특별시 ${name}` }));
createServer(async (req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  const reply = (body, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
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
  return reply([]);
}).listen(9091, "127.0.0.1", () => console.log("UI fixture ready on http://127.0.0.1:9091 (local mock only)"));
