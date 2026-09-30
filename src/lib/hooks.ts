"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { Account } from "./types";
import { useFeedback } from "@/components/feedback";
export function useApi<T>(
  path: string | null,
  account: Account = "user",
  sessionKey = "",
) {
  const [version, setVersion] = useState(0);
  const key = JSON.stringify([path, account, version, sessionKey]);
  const [state, setState] = useState<{
    key: string;
    data?: T;
    error: string;
    loading: boolean;
  }>({ key, error: "", loading: !!path });
  // Never expose the previous resource or account while the next effect starts.
  const current =
    state.key === key
      ? state
      : { key, data: undefined, error: "", loading: !!path };
  const setData = useCallback(
    (data: T) => setState({ key, data, error: "", loading: false }),
    [key],
  );
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    if (!path) {
      setState({ key, error: "", loading: false });
      return;
    }
    const controller = new AbortController();
    setState({ key, loading: true, error: "" });
    api<T>(path, account, {}, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted)
          setState({ key, data: value, error: "", loading: false });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setState({
            key,
            error:
              e instanceof Error ? e.message : "요청을 처리하지 못했습니다.",
            loading: false,
          });
      });
    return () => controller.abort();
  }, [path, account, key]);
  return {
    data: current.data,
    error: current.error,
    loading: current.loading,
    reload,
    setData,
  };
}
export function useMutation() {
  const notify = useFeedback();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function run<T>(
    work: () => Promise<T>,
    success?: (value: T) => void,
    successMessage?: string,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await work();
      success?.(value);
      if (successMessage) notify(successMessage);
      return value;
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청을 처리하지 못했습니다.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, run, setError };
}
