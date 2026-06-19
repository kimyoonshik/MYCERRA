import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MYCERRA Agent OS",
  description: "Internal command center for SAVE EARTH Inc. — local-first MVP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
