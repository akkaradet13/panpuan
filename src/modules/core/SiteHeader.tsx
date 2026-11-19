"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./client-auth";
import { GoogleG, Icon, type IconName } from "./Icon";

const NAV: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: "/", label: "หน้าแรก & ทริป", short: "หน้าแรก", icon: "compass" },
  { href: "/routes", label: "คลังเส้นทาง (GPX)", short: "เส้นทาง", icon: "pin" },
  { href: "/clubs", label: "กลุ่มปั่นในอุบล", short: "กลุ่มปั่น", icon: "users" },
  { href: "/rides", label: "ปฏิทินรวม", short: "ปฏิทิน", icon: "calendar" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try {
    localStorage.setItem("pp_theme", next);
  } catch {}
}

export function SiteHeader() {
  const user = useAuth();
  const path = usePathname();
  return (
    <>
      <header className="site-header">
        <div className="site-header-in">
          <Link href="/" className="brand" aria-label="PanPuan หน้าแรก">
            <Image className="brand-mark" src="/icon-192.png" width={44} height={44} alt="" priority />
            <span className="brand-text">
              <span className="brand-name">
                <span className="o">ปั่น</span>
                <span className="l">ป่วน</span>
                <em>PANPUAN</em>
              </span>
              <span className="brand-sub">Ubon Cycling Community</span>
            </span>
          </Link>

          <nav className="desk-nav" aria-label="เมนูหลัก">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={isActive(path, n.href) ? "active" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <button className="icon-btn" onClick={toggleTheme} title="สลับโหมดสี มืด / สว่าง" aria-label="สลับโหมดสี">
              <Icon name="sun" className="show-dark" />
              <Icon name="moon" className="show-light" />
            </button>
            {user === undefined ? (
              <span className="login-pill placeholder" />
            ) : user ? (
              <Link href="/profile" className="login-pill" aria-label="โปรไฟล์ของฉัน">
                <Image className="avatar" src={user.photoURL || "/icon-192.png"} width={24} height={24} alt="" />
                <span className="hide-sm">{user.displayName?.split(" ")[0] ?? "โปรไฟล์"}</span>
              </Link>
            ) : (
              <Link href="/login" className="login-pill">
                <GoogleG />
                <span>เข้าสู่ระบบ</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="bottom-nav" aria-label="เมนูหลัก">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={isActive(path, n.href) ? "active" : undefined}>
            <Icon name={n.icon} size={20} />
            <span>{n.short}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
