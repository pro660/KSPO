"use client";
import { notFound } from "next/navigation";
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
  return notFound();
}
