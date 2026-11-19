"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isIos, isStandalone } from "./client";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

/** Android/desktop: native install button. iPhone: link to the guide. Hidden once installed. */
export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const t = setTimeout(() => setIos(isIos() && !isStandalone()), 0);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(t);
    };
  }, []);

  if (evt) {
    return (
      <button className="btn btn-small" onClick={() => evt.prompt().then(() => setEvt(null))}>
        📲 ติดตั้งแอป PanPuan
      </button>
    );
  }
  if (ios) return <Link href="/install">📲 วิธีติดตั้งแอปบน iPhone</Link>;
  return null;
}
