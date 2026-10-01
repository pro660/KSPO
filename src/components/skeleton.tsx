export type SkeletonVariant = "list" | "facility" | "detail" | "stats";

export function Skeleton({
  variant = "list",
  label = "불러오는 중…",
  count = 3,
}: {
  variant?: SkeletonVariant;
  label?: string;
  count?: number;
}) {
  return (
    <div
      className={`skeleton-state skeleton-${variant} ${count === 4 ? "skeleton-four" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="skeleton-content">
        {variant === "detail" && (
          <div className="skeleton-block skeleton-hero" />
        )}
        {Array.from({ length: count }, (_, index) => (
          <div className="skeleton-row" key={index}>
            {variant === "facility" && (
              <div className="skeleton-block skeleton-image" />
            )}
            <div className="skeleton-lines">
              <div className="skeleton-block skeleton-title" />
              <div className="skeleton-block skeleton-text" />
              {variant !== "stats" && (
                <div className="skeleton-block skeleton-short" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
