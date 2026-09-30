import type { Metadata, Viewport } from "next";
import "@fontsource-variable/42dot-sans";
import "@fontsource-variable/inter";
import "./globals.css";
import "./motion.css";
import { AppShell } from "@/components/shell";
import { FeedbackProvider } from "@/components/feedback";
export const metadata: Metadata = {
  title: "CheChe · 공공 체육시설",
  description: "우리 동네 체육시설 탐색과 예약, 사진 기반 안전점검",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <FeedbackProvider>
          <AppShell>{children}</AppShell>
        </FeedbackProvider>
      </body>
    </html>
  );
}
