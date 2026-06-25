import { useEffect, useState } from "react";

export type Platform = "ios" | "android" | "web";

const detect = (): Platform => {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent || "";
  // iPadOS 13+ reports as Mac with touch
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document);
  if (isIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "web";
};

/** Detects platform once on mount. Stable for the session. */
export const usePlatform = (): Platform => {
  const [platform, setPlatform] = useState<Platform>(() => detect());
  useEffect(() => {
    setPlatform(detect());
  }, []);
  return platform;
};

/** Applies the platform as a `data-platform` attribute on <html>. Call once at app root. */
export const applyPlatformAttr = () => {
  if (typeof document === "undefined") return;
  const p = detect();
  document.documentElement.setAttribute("data-platform", p);
};
