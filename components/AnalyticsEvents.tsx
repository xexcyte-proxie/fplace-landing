"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getConsent, trackEvent } from "../lib/analytics";

function subscribeToConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("fplaces:consent-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("fplaces:consent-change", callback);
  };
}

export default function AnalyticsEvents() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getConsent,
    () => null,
  );

  useEffect(() => {
    if (!pathname || consent !== "granted") return;

    const scrollDepths = new Set<number>();
    const checkScrollDepth = () => {
      const { scrollHeight } = document.documentElement;
      const percent = Math.floor(
        ((window.scrollY + window.innerHeight) / scrollHeight) * 100,
      );

      for (const threshold of [25, 50, 75, 100]) {
        if (percent >= threshold && !scrollDepths.has(threshold)) {
          scrollDepths.add(threshold);
          trackEvent("scroll_depth", { path: pathname, percent: threshold });
        }
      }
    };

    let activeSegmentStart =
      document.visibilityState === "visible" ? Date.now() : null;
    let accumulatedMs = 0;
    const reportTime = () => {
      if (activeSegmentStart !== null) {
        accumulatedMs += Date.now() - activeSegmentStart;
        activeSegmentStart = null;
      }

      const seconds = Math.floor(accumulatedMs / 1000);
      if (seconds > 0) trackEvent("time_on_page", { path: pathname, seconds });
      accumulatedMs = 0;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        reportTime();
      } else {
        activeSegmentStart = Date.now();
      }
    };

    checkScrollDepth();
    window.addEventListener("scroll", checkScrollDepth, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (document.visibilityState === "visible") reportTime();
      window.removeEventListener("scroll", checkScrollDepth);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [consent, pathname]);

  return null;
}
