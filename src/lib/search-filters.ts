export type FilterSchema = Record<
  string,
  { fallback: string; options?: readonly string[] }
>;
export type FilterValues<S extends FilterSchema> = { [K in keyof S]: string };

export const searchFilters = { q: { fallback: "" } };
export const facilityFilters = {
  ...searchFilters,
  status: {
    fallback: "",
    options: ["", "OPERATING", "UNDER_INSPECTION", "CLOSED"],
  },
};
export const inspectionFilters = {
  ...searchFilters,
  filter: {
    fallback: "all",
    options: ["all", "REPORTED", "REVIEWING", "ACTION_SCHEDULED", "RESOLVED"],
  },
  sort: { fallback: "recent", options: ["recent", "old"] },
};
export const urgentFilters = {
  ...inspectionFilters,
  filter: { fallback: "all", options: ["all", "urgent", "REVIEWING"] },
};
export const historyFilters = {
  facilityId: { fallback: "" },
  filter: { fallback: "all", options: ["all", "open", "resolved"] },
};
export const reservationFilters = {
  tab: { fallback: "upcoming", options: ["upcoming", "past", "cancelled"] },
};
export const regionFilters = {
  sort: { fallback: "all", options: ["all", "safe", "open"] },
};

export function resolveFilters<S extends FilterSchema>(
  schema: S,
  params: URLSearchParams,
  stored?: unknown,
): FilterValues<S> {
  // Explicit URLs describe the whole filter state, including empty searches.
  const fromUrl = Object.keys(schema).some((key) => params.has(key));
  const saved =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    Object.entries(schema).map(([key, rule]) => {
      const value = fromUrl ? params.get(key) : saved[key];
      const valid =
        typeof value === "string" &&
        value.length <= 1000 &&
        (!rule.options || rule.options.includes(value));
      return [key, valid ? value : rule.fallback];
    }),
  ) as FilterValues<S>;
}

export function filterQuery<S extends FilterSchema>(
  schema: S,
  values: FilterValues<S>,
  current: string,
) {
  const params = new URLSearchParams(current);
  for (const key of Object.keys(schema)) params.set(key, values[key]);
  return params.toString();
}
