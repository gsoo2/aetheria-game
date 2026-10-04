import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "에테리아 — 별빛의 수호자",
  description: "별샘에서 시작하는 오리지널 온라인 판타지 RPG",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
