"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Notice } from "./ui";

const FeedbackContext = createContext<
  (message: string, tone?: "success" | "error") => void
>(() => {});
export const useFeedback = () => useContext(FeedbackContext);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const notify = useCallback(
    (message: string, tone: "success" | "error" = "success") =>
      setNotice({ message, tone }),
    [],
  );
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return (
    <FeedbackContext.Provider value={notify}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {notice && (
          <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Notice>
        )}
      </div>
    </FeedbackContext.Provider>
  );
}
