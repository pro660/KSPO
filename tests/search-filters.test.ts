import { test } from "node:test";
import assert from "node:assert/strict";
import {
  facilityFilters,
  inspectionFilters,
  urgentFilters,
  historyFilters,
  reservationFilters,
  regionFilters,
  resolveFilters,
  filterQuery,
} from "../src/lib/search-filters";

test("saved filters restore on a bare list URL, explicit URLs take precedence", () => {
  const saved = { q: "체육 센터", status: "CLOSED" };
  assert.deepEqual(
    resolveFilters(facilityFilters, new URLSearchParams(), saved),
    saved,
  );
  assert.deepEqual(
    resolveFilters(facilityFilters, new URLSearchParams("q=수영"), saved),
    { q: "수영", status: "" },
  );
  assert.deepEqual(
    resolveFilters(facilityFilters, new URLSearchParams("q="), saved),
    { q: "", status: "" },
  );
});

test("corrupt storage and unsupported filters fall back without crashing", () => {
  for (const stored of [
    null,
    false,
    [],
    "invalid",
    { q: {}, status: "UNKNOWN" },
  ]) {
    assert.deepEqual(
      resolveFilters(facilityFilters, new URLSearchParams(), stored),
      { q: "", status: "" },
    );
  }
  assert.deepEqual(
    resolveFilters(facilityFilters, new URLSearchParams(), {
      q: "x".repeat(1001),
      status: "CLOSED",
    }),
    { q: "", status: "CLOSED" },
  );
  assert.equal(
    resolveFilters(urgentFilters, new URLSearchParams("filter=RESOLVED"))
      .filter,
    "all",
  );
});

test("filter URLs safely round-trip Korean and special characters, preserve view context", () => {
  const values = { q: "수영 & 테니스+#", filter: "REVIEWING", sort: "old" };
  const params = new URLSearchParams(
    filterQuery(inspectionFilters, values, "view=reports&q=old"),
  );
  assert.equal(params.get("view"), "reports");
  assert.equal(params.getAll("q").length, 1);
  assert.deepEqual(resolveFilters(inspectionFilters, params), values);
});

test("clearing filters is preserved; reservation, history and region filters round-trip", () => {
  const cleared = { q: "", status: "" };
  assert.deepEqual(
    resolveFilters(
      facilityFilters,
      new URLSearchParams(filterQuery(facilityFilters, cleared, "")),
      { q: "old", status: "CLOSED" },
    ),
    cleared,
  );
  for (const [schema, values] of [
    [reservationFilters, { tab: "cancelled" }],
    [historyFilters, { facilityId: "25", filter: "resolved" }],
    [regionFilters, { sort: "open" }],
  ] as const) {
    assert.deepEqual(
      resolveFilters(
        schema,
        new URLSearchParams(filterQuery(schema, values, "")),
      ),
      values,
    );
  }
});
