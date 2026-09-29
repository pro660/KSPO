"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  LoaderCircle,
  ImagePlus,
  AlertCircle,
} from "lucide-react";
import { label } from "@/lib/format";
export function Button({
  children,
  variant = "primary",
  busy = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`button ${variant} ${className}`}
    >
      {busy && <LoaderCircle size={17} className="animate-spin" />}
      {children}
    </button>
  );
}
export function Header({
  title,
  back,
  badge,
}: {
  title: string;
  back?: string | boolean;
  badge?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className={`page-header ${back ? "with-back" : ""}`}>
      {back && (
        <button
          className="icon-button"
          aria-label="뒤로가기"
          onClick={() =>
            typeof back === "string" ? router.push(back) : router.back()
          }
        >
          <ChevronLeft size={23} />
        </button>
      )}
      <h1>{title}</h1>
      {badge && <span className="header-badge">{badge}</span>}
    </header>
  );
}
export function SectionTitle({
  children,
  href,
  more = "전체 보기",
  detail,
}: {
  children: ReactNode;
  href?: string;
  more?: string;
  detail?: ReactNode;
}) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {href ? (
        <Link href={href}>
          {more} <ChevronRight size={12} />
        </Link>
      ) : (
        detail && <span className="muted text-xs">{detail}</span>
      )}
    </div>
  );
}
export function Badge({
  value,
  children,
  tone,
}: {
  value?: string;
  children?: ReactNode;
  tone?: string;
}) {
  const inferred =
    value &&
    (["RESOLVED", "OPERATING", "COMPLETED", "ACTIVE", "LOW"].includes(value)
      ? "green"
      : [
            "CRITICAL",
            "HIGH",
            "REPORTED",
            "SUSPENDED",
            "CLOSED",
            "REJECTED",
          ].includes(value)
        ? "red"
        : [
              "MEDIUM",
              "ACTION_SCHEDULED",
              "UNDER_INSPECTION",
              "REPAIR_SCHEDULED",
            ].includes(value)
          ? "amber"
          : "blue");
  return (
    <span className={`badge ${tone || inferred || "blue"}`}>
      {children ?? label(value)}
    </span>
  );
}
export function Stats({
  items,
}: {
  items: { label: string; value: ReactNode; tone: string }[];
}) {
  return (
    <div
      className={`stats grid ${items.length === 4 ? "grid-cols-2" : "grid-cols-3"} gap-2`}
    >
      {items.map((i) => (
        <div className={`stat ${i.tone}`} key={i.label}>
          <span>{i.label}</span>
          <strong>{i.value}</strong>
        </div>
      ))}
    </div>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((i) => (
        <button
          key={i.value}
          type="button"
          role="tab"
          aria-selected={value === i.value}
          className={value === i.value ? "active" : ""}
          onClick={() => onChange(i.value)}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
export function ErrorMessage({
  message,
  retry,
}: {
  message?: string;
  retry?: () => void;
}) {
  return message ? (
    <div className="error-box" role="alert">
      <AlertCircle size={17} />
      <div>
        {message}
        {retry && (
          <button onClick={retry} className="text-link block mt-2">
            다시 시도
          </button>
        )}
      </div>
    </div>
  ) : null;
}
export function Empty({
  title = "아직 내역이 없어요",
  description = "새로운 활동을 시작해보세요.",
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-symbol">○</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div role="status" className="loading-state">
      <LoaderCircle className="animate-spin" size={22} />
      <span>불러오는 중…</span>
    </div>
  );
}
export function DataState({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error: string;
  retry?: () => void;
  children: ReactNode;
}) {
  return loading ? (
    <Loading />
  ) : error ? (
    <ErrorMessage message={error} retry={retry} />
  ) : (
    <>{children}</>
  );
}
export function Field({
  label: name,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{name}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      dialog?.close();
    };
  }, []);
  function requestClose() {
    if (closeTimer.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(onClose, 180);
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="sheet"
      data-closing={closing || undefined}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div className="sheet-inner">
        <span className="sheet-handle" />
        <div className="flex items-center justify-between mb-5">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            className="icon-button"
            aria-label="닫기"
            onClick={requestClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function PhotoPicker({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div>
      <label className={`photo-picker ${file ? "has-photo" : ""}`}>
        {preview ? (
          <img src={preview} alt="선택한 사진 미리보기" />
        ) : (
          <>
            <ImagePlus size={38} />
            <strong>사진 선택하기</strong>
            <span>갤러리에서 선택 · 최대 15MB</span>
          </>
        )}
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          aria-label="점검 사진 선택"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (!selected) return;
            if (
              !selected.type.startsWith("image/") ||
              selected.size > 15 * 1024 * 1024
            ) {
              setError("15MB 이하 이미지 파일을 선택해주세요.");
              e.target.value = "";
              return;
            }
            setError("");
            onChange(selected);
          }}
        />
      </label>
      {file && (
        <div className="flex justify-between mt-2 text-xs">
          <span className="truncate">{file.name}</span>
          <button
            className="text-link"
            onClick={() => onChange(null)}
            type="button"
          >
            삭제
          </button>
        </div>
      )}
      <ErrorMessage message={error} />
    </div>
  );
}
