"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="empty-state" role="alert">
      <strong>화면을 불러오지 못했어요.</strong>
      <p>잠시 후 다시 시도해주세요.</p>
      <button onClick={reset} className="button primary mt-5">
        다시 시도
      </button>
    </div>
  );
}
