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
  username?: string;
  name?: string;
  role?: AdminRole;
  status?: AdminStatus;
  regionCode: string | null;
  regionName: string | null;
  initialSetupRequired?: boolean;
}
export interface LoginResponse extends Profile {
  username: string;
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
  regionCode?: string;
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
  capacity?: number | null;
  usageFee?: number | string | null;
  feeInfo?: string | null;
  nextAvailableTime?: string | null;
  favorite?: boolean;
  tags?: string[];
  distanceKm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  weekdayOpeningTime?: string | null;
  weekdayClosingTime?: string | null;
  weekendOpeningTime?: string | null;
  weekendClosingTime?: string | null;
  applicationMethod?: string | null;
  closedDays?: string | null;
  availableFacilities?: string[];
  amenities?: string[];
  reservationOptionsPath?: string | null;
  reservable?: boolean;
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
  confirmed: boolean;
  confirmedAt: string | null;
  confirmedByUserId: number | null;
  confirmedDetail: string | null;
  actionRequired: boolean | null;
  actionDueDate: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface InspectionDashboard {
  totalInspections: number;
  unresolvedInspections: number;
  resolvedInspections: number;
}
export interface RegionalSafetySummary extends RegionOption {
  facilityCount: number;
  totalInspections: number;
  openInspections: number;
  resolvedInspections: number;
  highRiskOpenInspections: number;
  safetyScore: number;
}
export interface RecurringDefect extends RegionOption {
  facilityId: number;
  facilityName: string;
  defectType: DefectType;
  occurrenceCount: number;
  openCount: number;
  highestSeverity: Severity;
  lastDetectedAt: string | null;
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
  pricePerPerson?: number;
  totalFee?: number;
}
export interface TimeSlot {
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "RESERVED" | "CLOSED";
  statusLabel: string;
  pricePerPerson: number;
  capacity: number;
  reservedParticipants: number;
  remainingCapacity: number;
}
export interface Availability {
  facilityId: number;
  reservationDate: string;
  availableStartTimes: string[];
}
export interface ReservationDateOption {
  date: string;
  dayOfWeek: string;
  dayLabel: string;
  available: boolean;
}
export interface ReservationOptions {
  facilityId: number;
  facilityName: string;
  facilityType: string;
  selectedDate: string;
  pricePerPerson: number;
  minParticipants: number;
  maxParticipants: number;
  dates: ReservationDateOption[];
  timeSlots: TimeSlot[];
}
export interface ReservationCheckout {
  pricePerPerson?: number;
  reservationMode?: string;
  externalReservationAvailable?: boolean;
  externalReservationUrl?: string | null;
  paymentRequired?: boolean;
  message?: string;
  onlinePaymentAvailable: boolean;
  internalReservationAvailable?: boolean;
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
  aiExamplePrompt?: string;
  quickSports?: string[];
  recommendations?: Facility[];
  facilities?: Facility[];
  recommendedFacilities?: Facility[];
  kspoFacilities?: Facility[];
}
export interface SearchResponse {
  conditions?: {
    region?: string | null;
    sport?: string | null;
    time?: string | null;
    reservationAvailableOnly?: boolean;
  };
  assistantMessage?: string;
  recommendedFacility?: Facility | null;
  facilities?: Facility[];
  results?: Facility[];
  keywords?: string[];
  summary?: string;
}
export interface UsageGuide {
  reservable?: boolean;
  reservationChannel?: string;
  steps?: string[];
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
