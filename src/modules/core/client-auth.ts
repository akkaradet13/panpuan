"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./firebase/client";

/** undefined = still loading, null = signed out */
export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    // Some in-app browsers (LINE, Facebook) block popups.
    if ((e as { code?: string }).code === "auth/popup-blocked") return signInWithRedirect(auth, provider);
    throw e;
  }
}

export const logout = () => signOut(auth);

/** fetch() to our API with the Firebase ID token attached. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(token && { authorization: `Bearer ${token}` }), ...init.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
  return body as T;
}
