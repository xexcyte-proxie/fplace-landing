"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getFooterLinks, type SitePage } from "./siteNavigation";
import { isValidEmail } from "../lib/validation";

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

type ErrorResponse = {
  error?: string;
  errors?: { email?: string };
};

function NewsletterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">("");
  const [emailError, setEmailError] = useState("");

  const showEmailError = (message: string) => {
    setEmailError(message);
    setFeedback(message);
    setFeedbackType("error");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();

    if (!isValidEmail(email)) {
      showEmailError("Enter a valid email address.");
      return;
    }

    setEmailError("");
    setIsSubmitting(true);
    setFeedback("");
    setFeedbackType("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as ErrorResponse | null;
        if (data?.errors?.email) setEmailError(data.errors.email);
        setFeedback(
          data?.error ?? "Something went wrong, please try again or email us directly",
        );
        setFeedbackType("error");
        return;
      }

      form.reset();
      setFeedback("Thanks, you're subscribed.");
      setFeedbackType("success");
    } catch {
      setFeedback("Something went wrong, please try again or email us directly");
      setFeedbackType("error");
    } finally {
      setIsSubmitting(false);
    }
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
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "ft-email-error" : undefined}
          required
          disabled={isSubmitting}
          onInvalid={() => showEmailError("Enter a valid email address.")}
          onChange={() => {
            setEmailError("");
            setFeedback("");
            setFeedbackType("");
          }}
        />
        <button
          className="primary-button ft-submit-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending…" : "Submit"}
        </button>
      </div>
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="ft-website">Website</label>
        <input
          id="ft-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      {emailError ? (
        <p className="ft-field-error" id="ft-email-error">
          {emailError}
        </p>
      ) : null}
      <p
        className={`ft-form-feedback${feedbackType ? ` is-${feedbackType}` : ""}`}
        aria-live="polite"
      >
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
