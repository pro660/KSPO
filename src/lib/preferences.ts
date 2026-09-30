import type { Facility } from "./types";

export function isStoredFacility(value: unknown): value is Facility {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    ["name", "type", "regionCode", "regionName", "address", "status"].every(
      (key) => typeof item[key] === "string",
    ) &&
    (item.id == null ||
      (Number.isSafeInteger(item.id) && Number(item.id) > 0)) &&
    ["OPERATING", "UNDER_INSPECTION", "CLOSED"].includes(String(item.status)) &&
    [
      "phone",
      "publicNotice",
      "sourceUrl",
      "imageUrl",
      "openingTime",
      "closingTime",
      "externalId",
      "statusLabel",
      "updatedAt",
    ].every((key) => item[key] == null || typeof item[key] === "string") &&
    (item.source == null ||
      (typeof item.source === "string" &&
        ["KSPO_NATIONAL_FACILITY", "SEOUL_OPEN_API", "KSPO_OPEN_API"].includes(
          item.source,
        ))) &&
    (item.maxCapacity == null ||
      (typeof item.maxCapacity === "number" &&
        Number.isFinite(item.maxCapacity) &&
        item.maxCapacity >= 0))
  );
}

export function readStoredArray<T>(
  key: string,
  valid: (item: unknown) => item is T,
): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter(valid) : [];
  } catch {
    return [];
  }
}
