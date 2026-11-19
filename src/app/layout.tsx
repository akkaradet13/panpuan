import type { Metadata, Viewport } from "next";
import { RegisterSW } from "@/modules/notify/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://panpuan.net"),
  title: {
    default: "ปั่นป่วน ปั่นจักรยานอุบล | PanPuan",
    template: "%s | ปั่นป่วน ปั่นจักรยานอุบล",
  },
  description: "นัดปั่นของทุกกลุ่มในอุบลราชธานี เส้นทางปั่นพร้อม GPX ลงชื่อร่วมทริปและรับเตือนก่อนออกปั่น",
  applicationName: "PanPuan",
  icons: { icon: [{ url: "/favicon-48.png", sizes: "48x48" }, { url: "/icon-192.png", sizes: "192x192" }], apple: "/apple-touch-icon.png" },
  openGraph: {
    siteName: "PanPuan ปั่นป่วน",
    locale: "th_TH",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "PanPuan ปั่นป่วน Ubon Cycling Community" }],
  },
  appleWebApp: { capable: true, title: "PanPuan", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#22272d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
