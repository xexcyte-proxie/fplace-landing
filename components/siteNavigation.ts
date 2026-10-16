export type SitePage = "home" | "venues" | "faq";

type NavigationLink = {
  label: string;
  homeHref: string;
  venuesHref: string;
  faqHref: string;
};

const navigation: NavigationLink[] = [
  {
    label: "How it works",
    homeHref: "#our-approach",
    venuesHref: "/#our-approach",
    faqHref: "/#our-approach",
  },
  {
    label: "Features",
    homeHref: "#real-time",
    venuesHref: "/#real-time",
    faqHref: "/#real-time",
  },
  {
    label: "For venues",
    homeHref: "/venues",
    venuesHref: "/venues",
    faqHref: "/venues",
  },
  {
    label: "FAQ",
    homeHref: "/faq",
    venuesHref: "/faq",
    faqHref: "/faq",
  },
];

export function getNavigationLinks(page: SitePage) {
  return navigation.map(({ label, homeHref, venuesHref, faqHref }) => ({
    label,
    href: page === "venues" ? venuesHref : page === "faq" ? faqHref : homeHref,
  }));
}

export function getFooterLinks(page: SitePage) {
  return getNavigationLinks(page).map((link) => ({
    ...link,
    label: link.label === "For venues" ? "Venues" : link.label,
  }));
}
