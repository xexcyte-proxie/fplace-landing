"use client";

import Image from "next/image";
import { trackEvent } from "../lib/analytics";
import Link from "next/link";
import { useState } from "react";
import { getNavigationLinks, type SitePage } from "./siteNavigation";

export default function SiteNavbar({ page }: { page: SitePage }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigationLinks = getNavigationLinks(page);
  const partnerHref =
    page === "venues"
      ? "#contact"
      : page === "faq" || page === "features"
        ? "/venues#contact"
        : "#venues";
  const actionHref =
    page === "venues"
      ? "#steps"
      : page === "faq" || page === "features"
        ? "/#our-approach"
        : "#how-it-works";
  const isVenuePage = page === "venues";
  const isFaqPage = page === "faq";
  const isFeaturesPage = page === "features";
  const brandImage =
    isVenuePage || isFaqPage || isFeaturesPage
      ? "/img/fplaces%202.png"
      : "/img/fplace.png";
  const navbarClass =
    isVenuePage || isFaqPage || isFeaturesPage
      ? ` vn-navbar${isFeaturesPage ? " fe-navbar" : ""}`
      : "";

  return (
    <header className={`site-header${navbarClass}`}>
      <Link className="brand" href="/" aria-label="Fplaces home">
        <Image
          src={brandImage}
          alt="Fplaces"
          width={196}
          height={50}
          priority
        />
      </Link>

      <nav className="navigation" aria-label="Main navigation">
        {navigationLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            aria-current={
              (isVenuePage && link.label === "For venues") ||
              (isFaqPage && link.label === "FAQ") ||
              (isFeaturesPage && link.label === "Features")
                ? "page"
                : undefined
            }
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <a
          className="header-button header-button-light"
          href={partnerHref}
          onClick={() =>
            trackEvent("cta_click", {
              label: "Partner with us",
              page: window.location.pathname,
            })
          }
        >
          Partner with us
        </a>
        <a
          className="header-button header-button-dark"
          href={actionHref}
          onClick={() =>
            trackEvent("cta_click", {
              label: "See it in action",
              page: window.location.pathname,
            })
          }
        >
          See it in action
        </a>
        <button
          className={`menu-toggle${isMobileMenuOpen ? " is-open" : ""}`}
          type="button"
          aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav
        className={`mobile-navigation${isMobileMenuOpen ? " is-open" : ""}`}
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
      >
        {navigationLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            aria-current={
              (isVenuePage && link.label === "For venues") ||
              (isFaqPage && link.label === "FAQ") ||
              (isFeaturesPage && link.label === "Features")
                ? "page"
                : undefined
            }
            onClick={() => setIsMobileMenuOpen(false)}
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            {link.label}
          </a>
        ))}
        <div className="mobile-navigation-actions">
          <a
            className="header-button header-button-light"
            href={partnerHref}
            onClick={() => setIsMobileMenuOpen(false)}
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            Partner with us
          </a>
          <a
            className="header-button header-button-dark"
            href={actionHref}
            onClick={() => setIsMobileMenuOpen(false)}
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            See it in action
          </a>
        </div>
      </nav>
    </header>
  );
}
