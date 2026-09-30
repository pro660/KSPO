"use client";
import Link from "next/link";
import { AUTH_GUARD_DISABLED } from "@/lib/api";
import { AuthScreen, RecoveryScreen, Welcome } from "@/screens/auth";
import { RegionScreen } from "@/screens/region";
import { UserRegionScreen } from "@/screens/user-region";
import { FacilityDetail, HomeScreen, SearchScreen } from "@/screens/facilities";
import {
  BookingScreen,
  ReservationDetail,
  ReservationsScreen,
} from "@/screens/reservations";
import {
  MyScreen,
  NewReportScreen,
  ReportDetail,
  ReportsScreen,
} from "@/screens/my";
import {
  AdminFacilities,
  AdminFacilityDetail,
  AdminHome,
  FacilityForm,
} from "@/screens/admin";
import {
  HistoryScreen,
  InspectionConfirm,
  InspectionDetail,
  InspectionNew,
  InspectionReport,
  InspectionsList,
} from "@/screens/inspections";
import { AdminManagement, RegionOverview } from "@/screens/management";
import { Header } from "./ui";
export function RouteView({ segments }: { segments: string[] }) {
  const path = "/" + segments.join("/");
  if (path === "/") return <Welcome />;
  if (path === "/login") return <AuthScreen />;
  if (path === "/register") return <AuthScreen register />;
  if (path === "/find-id") return <RecoveryScreen />;
  if (path === "/find-password") return <RecoveryScreen password />;
  if (path === "/admin/find-id") return <RecoveryScreen account="admin" />;
  if (path === "/admin/find-password")
    return <RecoveryScreen account="admin" password />;
  if (path === "/admin/login") return <AuthScreen account="admin" />;
  if (path === "/admin/register")
    return <AuthScreen account="admin" register />;
  if (path === "/setup-region") return <UserRegionScreen />;
  if (path === "/admin/setup-region") return <RegionScreen />;
  if (path === "/home") return <HomeScreen />;
  if (path === "/chat") return <SearchScreen chat />;
  if (path === "/facilities") return <SearchScreen />;
  if (segments[0] === "facilities")
    return segments[2] === "reserve" ? (
      <BookingScreen id={segments[1]} />
    ) : (
      <FacilityDetail id={segments[1]} />
    );
  if (path === "/reservations") return <ReservationsScreen />;
  if (segments[0] === "reservations")
    return <ReservationDetail id={segments[1]} />;
  if (path === "/my") return <MyScreen />;
  if (path === "/reports/new") return <NewReportScreen />;
  if (path === "/reports") return <ReportsScreen />;
  if (segments[0] === "reports") return <ReportDetail id={segments[1]} />;
  if (path === "/admin") return <AdminHome />;
  if (path === "/admin/facilities") return <AdminFacilities />;
  if (path === "/admin/facilities/new") return <FacilityForm />;
  if (segments[1] === "facilities")
    return segments[3] === "edit" ? (
      <FacilityForm id={segments[2]} />
    ) : (
      <AdminFacilityDetail id={segments[2]} />
    );
  if (path === "/admin/inspections/new") return <InspectionNew />;
  if (path === "/admin/inspections") return <InspectionsList />;
  if (segments[1] === "inspections")
    return segments[3] === "confirm" ? (
      <InspectionConfirm id={segments[2]} />
    ) : segments[3] === "report" ? (
      <InspectionReport id={segments[2]} />
    ) : (
      <InspectionDetail id={segments[2]} />
    );
  if (path === "/admin/actions") return <InspectionsList actions />;
  if (path === "/admin/history") return <HistoryScreen />;
  if (path === "/admin/urgent") return <InspectionsList urgent />;
  if (path === "/admin/admins") return <AdminManagement />;
  if (path === "/admin/regions") return <RegionOverview />;
  return <ScreenIndex />;
}
function ScreenIndex() {
  const groups = [
    {
      name: "사용자",
      screens: [
        ["시작", "/"],
        ["로그인", "/login"],
        ["회원가입", "/register"],
        ["아이디 찾기", "/find-id"],
        ["비밀번호 찾기", "/find-password"],
        ["지역 설정", "/setup-region"],
        ["홈", "/home"],
        ["AI 대화", "/chat"],
        ["AI 시설 찾기", "/facilities"],
        ["시설 상세", "/facilities/1"],
        ["예약하기", "/facilities/1/reserve"],
        ["예약내역", "/reservations"],
        ["예약 상세", "/reservations/1"],
        ["마이페이지", "/my"],
        ["개선 요청", "/reports/new?facilityId=1"],
        ["내 요청 목록", "/reports"],
        ["개선 요청 상세", "/reports/1"],
      ],
    },
    {
      name: "관리자",
      screens: [
        ["로그인", "/admin/login"],
        ["회원가입", "/admin/register"],
        ["아이디 찾기", "/admin/find-id"],
        ["비밀번호 찾기", "/admin/find-password"],
        ["최초 지역 설정", "/admin/setup-region"],
        ["관리자 홈 · 슈퍼 대시보드", "/admin"],
        ["시설 관리", "/admin/facilities"],
        ["시설 등록", "/admin/facilities/new"],
        ["시설 상세", "/admin/facilities/1"],
        ["시설 정보 수정", "/admin/facilities/1/edit"],
        ["사진 점검 등록", "/admin/inspections/new"],
        ["AI 결함 분석", "/admin/inspections/1"],
        ["결함 확정", "/admin/inspections/1/confirm"],
        ["점검 보고서", "/admin/inspections/1/report"],
        ["조치 현황", "/admin/actions"],
        ["안전 이력", "/admin/history"],
        ["최근 점검", "/admin/inspections"],
        ["지역별 현황", "/admin/regions"],
        ["관리자 관리", "/admin/admins"],
        ["긴급 미조치", "/admin/urgent"],
      ],
    },
  ];
  return (
    <>
      <Header title="CheChe 화면 안내" back="/" />
      <div className="page-content">
        <p className="muted text-sm">
          {AUTH_GUARD_DISABLED
            ? "현재 페이지 접근 가드가 임시 해제되어 있습니다. 데이터 조회·저장은 서버 인증이 필요합니다."
            : "로그인한 계정의 권한에 따라 화면에 접근할 수 있습니다."}{" "}
          달력과 지역 선택 팝업은 해당 화면에서 열 수 있습니다.
        </p>
        {groups.map((g) => (
          <section key={g.name}>
            <h2 className="section-title font-bold">{g.name}</h2>
            <div className="settings-list">
              {g.screens.map(([name, href]) => (
                <Link key={name} href={href}>
                  <strong>{name}</strong>
                  <span>›</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
