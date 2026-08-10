"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "cracked:installPromptDismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Chrome/Android suppress their own install UI once a page calls
 * preventDefault() on beforeinstallprompt — this is the app's own
 * dismissible replacement. iOS never fires that event at all, so it gets
 * static "Share → Add to Home Screen" instructions instead. Dismissal is
 * remembered so it never nags on repeat visits. */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    setIsIOSSafari(iOS && isSafari);

    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (installed || dismissed) return null;
  if (!deferredPrompt && !isIOSSafari) return null;

  return (
    <div className="flex-none mx-[22px] mt-3 rounded-xl border border-border-strong bg-card px-4 py-3 flex items-center gap-3">
      <span className="text-[18px] leading-none flex-none">📲</span>
      <div className="flex-1 min-w-0 text-[12px] text-ink-dim leading-relaxed text-pretty">
        {isIOSSafari ? (
          <>
            Install Cracked: tap <span className="text-ink">Share</span> →{" "}
            <span className="text-ink">Add to Home Screen</span>.
          </>
        ) : (
          "Install Cracked for a faster, full-screen experience."
        )}
      </div>
      {!isIOSSafari ? (
        <button onClick={install} className="flex-none text-xs rounded-full bg-ink-2 text-canvas px-3 py-1.5">
          Install
        </button>
      ) : null}
      <button onClick={dismiss} aria-label="Dismiss install prompt" className="flex-none text-ink-faint text-sm px-1">
        ✕
      </button>
    </div>
  );
}
