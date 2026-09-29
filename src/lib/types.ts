export type Account = "user" | "admin";
export type AdminRole = "REGIONAL_ADMIN" | "SUPER_USER";
export type AdminStatus = "ACTIVE" | "SUSPENDED";
export type FacilityStatus = "OPERATING" | "UNDER_INSPECTION" | "CLOSED";
export type DefectType =
  | "CRACK"
  | "CORROSION"
  | "DEFORMATION"
  | "SURFACE_DAMAGE"
  | "WATER_LEAK"
  | "OTHER";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ActionStatus =
  "REPORTED" | "REVIEWING" | "ACTION_SCHEDULED" | "RESOLVED";
export type ReportStatus =
  "RECEIVED" | "REVIEWING" | "REPAIR_SCHEDULED" | "COMPLETED" | "REJECTED";
export interface RegionOption {
  regionCode: string;
  regionName: string;
}
export interface Profile {
  userId: number;
  id?: number;
  username: string;
  role?: AdminRole;
  status?: AdminStatus;
  regionCode: string | null;
  regionName: string | null;
  initialSetupRequired?: boolean;
}
export interface LoginResponse extends Profile {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  initialSetupRequired: boolean;
  accountType?: "USER" | "ADMIN";
}
export interface Facility {
  id?: number;
  name: string;
  type: string;
  regionCode: string;
  regionName: string;
  address: string;
  phone: string | null;
  status: FacilityStatus;
  publicNotice: string | null;
  managerUserId?: number;
  source?: "KSPO_NATIONAL_FACILITY" | "SEOUL_OPEN_API" | "KSPO_OPEN_API" | null;
  externalId?: string | null;
  sourceUrl?: string | null;
  imageUrl?: string;
  openingTime?: string;
  closingTime?: string;
  statusLabel?: string;
  maxCapacity?: number;
  updatedAt?: string;
}
export interface Inspection {
  id: number;
  facilityId: number;
  facilityName: string;
  regionCode: string;
  regionName: string;
  reporterUserId: number;
  photoUrl: string;
  locationDescription: string;
  note: string | null;
  defectType: DefectType;
  severity: Severity;
  confidence: number;
  checklist: string[];
  similarCases: string[];
  reportSummary: string;
  actionStatus: ActionStatus;
  actionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface InspectionDashboard {
  totalInspections: number;
  unresolvedInspections: number;
  resolvedInspections: number;
}
export interface SyncResult extends RegionOption {
  provider: string;
  scannedCount: number;
  matchedCount: number;
  createdCount: number;
  updatedCount: number;
}
export interface Reservation {
  id: number;
  facilityId: number;
  facilityName: string;
  reservationDate: string;
  startTime: string;
  endTime?: string;
  participantCount: number;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalPrice?: number;
}
export interface TimeSlot {
  startTime: string;
  endTime?: string;
  available: boolean;
  remainingCapacity?: number;
}
export interface Availability {
  slots?: TimeSlot[];
  availableTimes?: string[];
  maxCapacity?: number;
  pricePerPerson?: number;
}
export interface UserReport {
  id: number;
  facilityId: number;
  facilityName?: string;
  category: "DETERIORATION" | "IMPROVEMENT" | "REPAIR" | "OTHER";
  locationDescription: string;
  comment: string;
  photoUrl?: string;
  status: ReportStatus;
  createdAt: string;
  actionNote?: string;
}
export interface HomeResponse {
  facilities?: Facility[];
  recommendedFacilities?: Facility[];
  kspoFacilities?: Facility[];
}
export interface SearchResponse {
  facilities?: Facility[];
  results?: Facility[];
  keywords?: string[];
  summary?: string;
}
export interface UsageGuide {
  guide?: string;
  description?: string;
  reservationUrl?: string;
  openingTime?: string;
  closingTime?: string;
  pricePerPerson?: number;
  notice?: string;
}
export type ListResponse<T> =
  T[] | { content?: T[]; items?: T[]; results?: T[] };
export function listOf<T>(value: ListResponse<T> | null | undefined): T[] {
  return Array.isArray(value)
    ? value
    : (value?.content ?? value?.items ?? value?.results ?? []);
}
