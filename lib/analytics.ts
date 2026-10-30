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
let analyticsInitialization: Promise<void> | null = null;
let claritySdk: (typeof import("@microsoft/clarity"))["default"] | undefined;
let mixpanelSdk: (typeof import("mixpanel-browser"))["default"] | undefined;

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
    if (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) claritySdk?.consent(false);
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) mixpanelSdk?.opt_out_tracking();
  }
}

export function initAnalytics(): void {
  if (getConsent() !== "granted") return;

  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

  if (analyticsInitialized) {
    if (clarityProjectId) claritySdk?.consent(true);
    if (mixpanelToken) mixpanelSdk?.opt_in_tracking();
    return;
  }

  if (analyticsInitialization) return;

  analyticsInitialization = Promise.all([
    clarityProjectId
      ? import("@microsoft/clarity")
      : Promise.resolve(null),
    mixpanelToken ? import("mixpanel-browser") : Promise.resolve(null),
  ])
    .then(([clarityModule, mixpanelModule]) => {
      claritySdk = clarityModule?.default;
      mixpanelSdk = mixpanelModule?.default;

      if (getConsent() !== "granted") {
        analyticsInitialization = null;
        return;
      }

      if (clarityProjectId && claritySdk) {
        claritySdk.init(clarityProjectId);
        claritySdk.consent();
      }

      if (mixpanelToken && mixpanelSdk) {
        mixpanelSdk.init(mixpanelToken, {
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
    })
    .catch((error: unknown) => {
      analyticsInitialization = null;
      console.error("Failed to initialize analytics after consent.", error);
    });
}

export function trackEvent(name: string, props?: AnalyticsProps): void {
  if (getConsent() !== "granted" || !process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    return;
  }

  if (mixpanelSdk && analyticsInitialized) {
    mixpanelSdk.track(name, props);
    return;
  }

  initAnalytics();
  void analyticsInitialization?.then(() => {
    if (getConsent() === "granted" && analyticsInitialized) {
      mixpanelSdk?.track(name, props);
    }
  });
}
