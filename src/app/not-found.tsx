import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <strong>페이지를 찾을 수 없어요</strong>
      <p>주소를 확인하거나 시작 화면으로 이동해주세요.</p>
      <Link href="/" className="button primary mt-5">
        시작 화면
      </Link>
    </div>
  );
}
