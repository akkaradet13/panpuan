"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./client-auth";

export function SiteHeader() {
  const user = useAuth();
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <Image src="/icon-192.png" width={36} height={36} alt="" priority />
        PanPuan
      </Link>
      <nav className="nav">
        <Link href="/rides">ทริป</Link>
        <Link href="/routes">เส้นทาง</Link>
        <Link href="/clubs">กลุ่ม</Link>
      </nav>
      {user === undefined ? <span className="avatar-slot" /> : user ? (
        <Link href="/profile" aria-label="โปรไฟล์ของฉัน">
          <Image className="avatar" src={user.photoURL || "/icon-192.png"} width={36} height={36} alt="" />
        </Link>
      ) : (
        <Link href="/login" className="btn btn-small">
          เข้าสู่ระบบ
        </Link>
      )}
    </header>
  );
}
