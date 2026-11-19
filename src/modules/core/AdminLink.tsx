"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./client-auth";

/** Shown only to super admins (custom claim). */
export function AdminLink() {
  const user = useAuth();
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    user?.getIdTokenResult().then((t) => setAdmin(t.claims.super_admin === true), () => {});
  }, [user]);
  return admin ? (
    <Link className="btn btn-ghost btn-small" href="/admin">
      🛡 คิวยืนยัน (super admin)
    </Link>
  ) : null;
}
