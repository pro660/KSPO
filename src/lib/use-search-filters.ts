"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/components/shell";
import {
  filterQuery,
  resolveFilters,
  type FilterSchema,
  type FilterValues,
} from "./search-filters";

export function useSearchFilters<S extends FilterSchema>(schema: S) {
  const path = usePathname();
  const params = useSearchParams().toString();
  const { account, profile } = useSession();
  const storageKey = `checheSearch:v1:${account}:${profile?.userId ?? "guest"}:${profile?.regionCode ?? "all"}:${path}`;
  const [state, setState] = useState<{ key: string; values: FilterValues<S> }>({
    key: "",
    values: resolveFilters(schema, new URLSearchParams(params)),
  });
  const current = useRef(state.values);
  useEffect(() => {
    let stored: unknown;
    try {
      stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    } catch {}
    const values = resolveFilters(schema, new URLSearchParams(params), stored);
    current.current = values;
    setState({ key: storageKey, values });
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {}
    const query = filterQuery(schema, values, params);
    if (query !== params)
      window.history.replaceState(
        null,
        "",
        `${path}?${query}${window.location.hash}`,
      );
  }, [schema, storageKey, path, params]);

  function setFilter(key: keyof S, value: string) {
    const values = resolveFilters(schema, new URLSearchParams(), {
      ...current.current,
      [key]: value,
    });
    current.current = values;
    setState({ key: storageKey, values });
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {}
    const query = filterQuery(schema, values, window.location.search);
    window.history.replaceState(
      null,
      "",
      `${path}?${query}${window.location.hash}`,
    );
  }
  return { filters: state.values, setFilter, ready: state.key === storageKey };
}
