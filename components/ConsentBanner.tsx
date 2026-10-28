"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getConsent, initAnalytics, setConsent } from "../lib/analytics";

function subscribeToConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("fplaces:consent-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("fplaces:consent-change", callback);
  };
}

export default function ConsentBanner() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getConsent,
    () => "denied",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (consent === "granted") initAnalytics();
  }, [consent]);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener("fplaces:open-consent", openSettings);
    return () => window.removeEventListener("fplaces:open-consent", openSettings);
  }, []);

  if (pathname !== "/" || (consent !== null && !settingsOpen)) return null;

  return (
    <aside className="cb-banner" aria-label="Cookie consent">
      <p className="cb-copy">
        We use cookies and analytics to improve Fplaces. You can accept or
        decline.
      </p>
      <div className="cb-actions">
        <button
          className="cb-accept"
          type="button"
          onClick={() => {
            setConsent("granted");
            initAnalytics();
            setSettingsOpen(false);
          }}
        >
          Accept
        </button>
        <button
          className="cb-decline"
          type="button"
          onClick={() => {
            setConsent("denied");
            setSettingsOpen(false);
          }}
        >
          Decline
        </button>
      </div>
    </aside>
  );
}
