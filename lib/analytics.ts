import Clarity from "@microsoft/clarity";
import mixpanel from "mixpanel-browser";

export type ConsentChoice = "granted" | "denied";

type AnalyticsProps = {
  label?: string;
  page?: string;
  pathname?: string;
  path?: string;
  percent?: number;
  seconds?: number;
  form_name?: string;
  error_type?: "validation" | "server" | "network";
  question_number?: number;
  venue_type?: string;
};

let analyticsInitialized = false;

export function getConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;

  try {
    const consent = window.localStorage.getItem("fplaces-analytics-consent");
    return consent === "granted" || consent === "denied" ? consent : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem("fplaces-analytics-consent", choice);
  } catch {
    return;
  }

  window.dispatchEvent(new Event("fplaces:consent-change"));

  if (analyticsInitialized && choice === "denied") {
    if (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) Clarity.consent(false);
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) mixpanel.opt_out_tracking();
  }
}

export function initAnalytics(): void {
  if (getConsent() !== "granted") return;

  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

  if (analyticsInitialized) {
    if (clarityProjectId) Clarity.consent(true);
    if (mixpanelToken) mixpanel.opt_in_tracking();
    return;
  }

  if (clarityProjectId) {
    Clarity.init(clarityProjectId);
    Clarity.consent();
  }

  if (mixpanelToken) {
    mixpanel.init(mixpanelToken, {
      persistence: "localStorage",
      ip: true,
      autocapture: true,
      track_pageview: "full-url",
      api_host:
        process.env.NEXT_PUBLIC_MIXPANEL_REGION === "eu"
          ? "https://api-eu.mixpanel.com"
          : undefined,
    });
  }

  analyticsInitialized = true;
}

export function trackEvent(name: string, props?: AnalyticsProps): void {
  if (getConsent() !== "granted" || !process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    return;
  }

  mixpanel.track(name, props);
}
