import type { Metadata, Viewport } from "next";
import { Kanit, Prompt } from "next/font/google";
import { SiteHeader } from "@/modules/core/SiteHeader";
import { RegisterSW } from "@/modules/notify/RegisterSW";
import "./globals.css";

const kanit = Kanit({ subsets: ["thai", "latin"], weight: ["400", "600", "700", "800"], style: ["normal", "italic"], variable: "--font-kanit" });
const prompt = Prompt({ subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-prompt" });

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
  appleWebApp: { capable: true, title: "PanPuan", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#161c1f",
};

// Dark is the default; a saved "light" choice is applied before paint to avoid a flash.
const THEME_INIT = `try{if(localStorage.getItem("pp_theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${kanit.variable} ${prompt.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <SiteHeader />
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
