"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "cracked:installPromptDismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "standard" | "ios-safari" | "ios-other";

/** Chrome/Android suppress their own install UI once a page calls
 * preventDefault() on beforeinstallprompt — this is the app's own
 * dismissible replacement. iOS never fires that event at all, and only
 * Safari there can actually install a PWA — Chrome/Firefox/Edge on iOS
 * are WebKit wrappers Apple never grants that capability to, so those
 * get told to switch browsers rather than shown instructions that would
 * just create a plain bookmark. Dismissal is remembered so it never nags
 * on repeat visits. */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("standard");
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    // Chrome/Firefox/Edge on iOS identify as CriOS/FxiOS/EdgiOS in their UA
    // (never the literal word "chrome") but their UA string still ends in
    // "...Safari/<version>" for WebKit-compatibility reasons — so those
    // have to be excluded explicitly, not just "chrome|android".
    const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
    setPlatform(iOS ? (isSafari ? "ios-safari" : "ios-other") : "standard");

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

  /** Best-effort only: x-safari-https:// is an undocumented iOS scheme
   * that hints the link should open in Safari specifically, not the
   * default browser. Apple doesn't guarantee it — it can silently stop
   * working in a future iOS version — so the manual Share-icon
   * instructions stay as the reliable fallback either way. */
  function tryOpenInSafari() {
    window.location.href = window.location.href.replace(/^https?:/, (m) => `x-safari-${m}`);
  }

  if (installed || dismissed) return null;
  if (!deferredPrompt && platform === "standard") return null;

  return (
    <div className="flex-none mx-[22px] mt-3 rounded-xl border border-border-strong bg-card px-4 py-3 flex items-center gap-3">
      <span className="text-[18px] leading-none flex-none">📲</span>
      <div className="flex-1 min-w-0 text-[12px] text-ink-dim leading-relaxed text-pretty">
        {platform === "ios-safari" ? (
          <>
            This can&apos;t be tapped from here — in <span className="text-ink">Safari&apos;s own toolbar</span>{" "}
            (not this page), tap the <span className="text-ink">Share</span> icon, then choose{" "}
            <span className="text-ink">Add to Home Screen</span> to install Cracked.
          </>
        ) : platform === "ios-other" ? (
          <>
            Chrome/Firefox/Edge can&apos;t install this on iPhone — tap{" "}
            <span className="text-ink">Open in Safari</span> to try automatically, or manually copy this
            page&apos;s link into Safari if that doesn&apos;t work.
          </>
        ) : (
          "Install Cracked for a faster, full-screen experience."
        )}
      </div>
      {platform === "standard" ? (
        <button onClick={install} className="flex-none text-xs rounded-full bg-ink-2 text-canvas px-3 py-1.5">
          Install
        </button>
      ) : platform === "ios-other" ? (
        <button onClick={tryOpenInSafari} className="flex-none text-xs rounded-full bg-ink-2 text-canvas px-3 py-1.5">
          Open in Safari
        </button>
      ) : null}
      <button onClick={dismiss} aria-label="Dismiss install prompt" className="flex-none text-ink-faint text-sm px-1">
        ✕
      </button>
    </div>
  );
}
