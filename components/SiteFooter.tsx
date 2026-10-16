"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getFooterLinks, type SitePage } from "./siteNavigation";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: "/icons/instagram.svg",
    width: 17,
    height: 17,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: "/icons/linkedin.svg",
    width: 16,
    height: 15,
  },
  {
    label: "X",
    href: "https://x.com/",
    icon: "/icons/twitter.svg",
    width: 18,
    height: 18,
  },
];

const footerCopy = {
  tagline: "Find places. Find people. Find your way",
  copyright: "2026, Fplaces All rights reserved",
  newsletter: "Don't miss our future updates! Get Subscribed Today!",
};

function FooterLinkList({ page }: { page: SitePage }) {
  const links = getFooterLinks(page);

  return (
    <nav
      className="ft-column ft-links-column reveal-item"
      data-reveal-item
      aria-label="Footer"
    >
      <h2 className="ft-heading">Useful links</h2>
      <ul className="ft-links">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialLinks() {
  return (
    <ul className="ft-social-links">
      {socialLinks.map((link) => (
        <li key={link.label}>
          <a href={link.href} aria-label={link.label} target="_blank" rel="noreferrer">
            <Image
              src={link.icon}
              alt=""
              width={link.width}
              height={link.height}
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

function NewsletterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const submitTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (submitTimer.current !== null) {
        window.clearTimeout(submitTimer.current);
      }
    },
    [],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) {
      setFeedback("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setFeedback("");
    // TODO: Send the validated address to the newsletter subscription API.
    submitTimer.current = window.setTimeout(() => {
      form.reset();
      setIsSubmitting(false);
      setFeedback("Thanks, you're subscribed.");
      submitTimer.current = null;
    }, 600);
  };

  return (
    <form
      className="ft-newsletter-form"
      id="get-started"
      onSubmit={handleSubmit}
    >
      <label className="ft-email-label" htmlFor="ft-email">
        Email address
      </label>
      <div className="ft-form-row">
        <input
          className="ft-email-input"
          id="ft-email"
          name="email"
          type="email"
          placeholder="Enter email address"
          autoComplete="email"
          required
          disabled={isSubmitting}
          onInvalid={() => setFeedback("Enter a valid email address.")}
          onChange={() => setFeedback("")}
        />
        <button
          className="primary-button ft-submit-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending…" : "Submit"}
        </button>
      </div>
      <p className="ft-form-feedback" aria-live="polite">
        {feedback}
      </p>
    </form>
  );
}

export default function SiteFooter({ page }: { page: SitePage }) {
  return (
    <footer className="ft-footer">
      <div className="ft-container">
        <div className="ft-columns">
          <div className="ft-column ft-brand-column reveal-item" data-reveal-item>
            <Link className="ft-brand" href="/" aria-label="Fplaces home">
              <Image
                className={page === "home" ? undefined : "ft-brand-new-logo"}
                src={page === "home" ? "/img/fplace.png" : "/img/fplaces%202.png"}
                alt="Fplaces"
                width={196}
                height={50}
              />
            </Link>
            <p className="ft-tagline">{footerCopy.tagline}</p>
            <SocialLinks />
            <p className="ft-copyright">
              <span aria-hidden="true">©</span>
              <span>{footerCopy.copyright}</span>
            </p>
          </div>

          <FooterLinkList page={page} />

          <section
            className="ft-column ft-newsletter-column reveal-item"
            data-reveal-item
            aria-labelledby="ft-newsletter-title"
          >
            <h2 className="ft-heading" id="ft-newsletter-title">
              Subscribe now
            </h2>
            <p className="ft-newsletter-copy">{footerCopy.newsletter}</p>
            <NewsletterForm />
          </section>
        </div>
      </div>
    </footer>
  );
}
