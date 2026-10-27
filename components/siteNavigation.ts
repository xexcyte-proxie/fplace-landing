export type SitePage = "home" | "venues" | "faq" | "features";

type NavigationLink = {
  label: string;
  homeHref: string;
  venuesHref: string;
  faqHref: string;
  featuresHref: string;
};

const navigation: NavigationLink[] = [
  {
    label: "How it works",
    homeHref: "#our-approach",
    venuesHref: "/#our-approach",
    faqHref: "/#our-approach",
    featuresHref: "/#our-approach",
  },
  {
    label: "Features",
    homeHref: "/features",
    venuesHref: "/features",
    faqHref: "/features",
    featuresHref: "/features",
  },
  {
    label: "For venues",
    homeHref: "/venues",
    venuesHref: "/venues",
    faqHref: "/venues",
    featuresHref: "/venues",
  },
  {
    label: "FAQ",
    homeHref: "/faq",
    venuesHref: "/faq",
    faqHref: "/faq",
    featuresHref: "/faq",
  },
];

export function getNavigationLinks(page: SitePage) {
  return navigation.map(
    ({ label, homeHref, venuesHref, faqHref, featuresHref }) => ({
      label,
      href:
        page === "venues"
          ? venuesHref
          : page === "faq"
            ? faqHref
            : page === "features"
              ? featuresHref
              : homeHref,
    }),
  );
}

export function getFooterLinks(page: SitePage) {
  return getNavigationLinks(page).map((link) => ({
    ...link,
    label: link.label === "For venues" ? "Venues" : link.label,
  }));
}
