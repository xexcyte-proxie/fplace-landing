"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import CtaBanner from "../../components/CtaBanner";
import SiteFooter from "../../components/SiteFooter";
import SiteNavbar from "../../components/SiteNavbar";
import { trackEvent } from "../../lib/analytics";
import { validateContact, type ContactField, type FieldErrors } from "../../lib/validation";

type VenueType = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

const venueTypes: VenueType[] = [
  {
    title: "Stadiums",
    description:
      "Help fans find their seat, favorite food stand, or friends in a space of thousands",
    image: "stadium.webp",
    alt: "Fans in a stadium",
  },
  {
    title: "Airports",
    description:
      "Guide travelers from check-in to gate in their own language, even when the terminal is overcrowded",
    image: "airport.png",
    alt: "Travelers in an airport terminal",
  },
  {
    title: "Train stations",
    description:
      "Get commuters and tourists to the right platform on time, even in a station they don't know",
    image: "train station.webp",
    alt: "Passengers at a train station",
  },
  {
    title: "Shopping malls",
    description:
      "No more wandering floor to floor. Shoppers find the store they want fast, even at the busiest times",
    image: "Shopping mall 2.webp",
    alt: "Visitors in a shopping mall",
  },
  {
    title: "Universities & campuses",
    description:
      "Help students, staff, and visitors find the right building or lecture hall across a large campus",
    image: "universities and campus.webp",
    alt: "Students walking across a university campus",
  },
  {
    title: "Hospitals",
    description:
      "Guide patients and visitors straight to the right ward or department, even in an unfamiliar hospital",
    image: "hospitals.png",
    alt: "Visitors inside a hospital",
  },
  {
    title: "Concert",
    description:
      "Get ticket holders to their exact seat and section, without the usual scramble before it starts",
    image: "concerts.webp",
    alt: "Crowd at a live concert",
  },
  {
    title: "Convention centers",
    description:
      "Guide attendees straight to a specific booth or hall instead of wandering a massive show floor",
    image: "convention centres.webp",
    alt: "Exhibition floor at a convention center",
  },
];

const steps = [
  {
    number: "1",
    icon: "number 1.svg",
    title: "We talk",
    description:
      "Tell us about your venue and what you are hoping to solve. No commitment, just a conversation.",
  },
  {
    number: "2",
    icon: "number 2.svg",
    title: "We map it",
    description:
      "Our team loads your venue map and points of interest: seats, gates, rooms, stores, exits, all of it.",
  },
  {
    number: "3",
    icon: "number 3.svg",
    title: "You go live",
    description:
      "Visitors start navigating right away, straight from their browser.",
  },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    iconClass: "vn-social-instagram",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    iconClass: "vn-social-linkedin",
  },
  {
    label: "X",
    href: "https://x.com/",
    iconClass: "vn-social-x",
  },
];

const venueOptions = [
  "Stadium",
  "Airport",
  "Train station",
  "Shopping mall",
  "University or campus",
  "Hospital",
  "Concert venue",
  "Convention center",
];

type ContactFormValues = {
  name: string;
  email: string;
  venueName: string;
  venueType: string;
  message: string;
};

const emptyForm: ContactFormValues = {
  name: "",
  email: "",
  venueName: "",
  venueType: "Stadium",
  message: "",
};

type ErrorResponse = {
  error?: string;
  errors?: FieldErrors<ContactField>;
};

function ContactForm() {
  const hasStarted = useRef(false);
  const [values, setValues] = useState(emptyForm);
  const [honeypot, setHoneypot] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">("");
  const [errors, setErrors] = useState<FieldErrors<ContactField>>({});

  const updateValue = (field: keyof ContactFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFeedback("");
    setFeedbackType("");
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    const validation = validateContact(values);

    if (!validation.ok) {
      setErrors(validation.errors);
      setFeedback("Please check the highlighted fields.");
      setFeedbackType("error");
      trackEvent("form_error", {
        form_name: "contact",
        error_type: "validation",
      });
      return;
    }

    setErrors({});
    setIsSending(true);
    setFeedback("");
    setFeedbackType("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as ErrorResponse | null;
        if (data?.errors) setErrors(data.errors);
        setFeedback(
          data?.error ?? "Something went wrong, please try again or email us directly",
        );
        setFeedbackType("error");
        trackEvent("form_error", {
          form_name: "contact",
          error_type: "server",
        });
        return;
      }

      setValues(emptyForm);
      setHoneypot("");
      setFeedback("Thanks, we'll be in touch");
      setFeedbackType("success");
      trackEvent(
        "contact_form_submitted",
        values.venueType ? { venue_type: values.venueType } : undefined,
      );
    } catch {
      setFeedback("Something went wrong, please try again or email us directly");
      setFeedbackType("error");
      trackEvent("form_error", {
        form_name: "contact",
        error_type: "network",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      className="vn-form"
      onSubmit={handleSubmit}
      onInvalidCapture={() =>
        trackEvent("form_error", {
          form_name: "contact",
          error_type: "validation",
        })
      }
      onFocusCapture={() => {
        if (hasStarted.current) return;
        hasStarted.current = true;
        trackEvent("form_started", { form_name: "contact" });
      }}
    >
      <div className="vn-fields">
        <div className="vn-field">
          <label htmlFor="vn-name">Full name</label>
          <input
            id="vn-name"
            data-clarity-mask="True"
            name="name"
            type="text"
            placeholder="Paul Doe"
            autoComplete="name"
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "vn-name-error" : undefined}
            required
            disabled={isSending}
          />
          {errors.name ? (
            <p className="vn-field-error" id="vn-name-error">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div className="vn-field">
          <label htmlFor="vn-email">Work email</label>
          <input
            id="vn-email"
            data-clarity-mask="True"
            name="email"
            type="email"
            placeholder="paul@cheerstadium.com"
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "vn-email-error" : undefined}
            required
            disabled={isSending}
          />
          {errors.email ? (
            <p className="vn-field-error" id="vn-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>
        <div className="vn-field">
          <label htmlFor="vn-venue-name">Venue name</label>
          <input
            id="vn-venue-name"
            data-clarity-mask="True"
            name="venueName"
            type="text"
            placeholder="Rivers Stadium"
            value={values.venueName}
            onChange={(event) => updateValue("venueName", event.target.value)}
            aria-invalid={errors.venueName ? true : undefined}
            aria-describedby={errors.venueName ? "vn-venue-name-error" : undefined}
            required
            disabled={isSending}
          />
          {errors.venueName ? (
            <p className="vn-field-error" id="vn-venue-name-error">
              {errors.venueName}
            </p>
          ) : null}
        </div>
        <div className="vn-field">
          <label htmlFor="vn-venue-type">Venue type</label>
          <div className="vn-select-wrap">
            <select
              id="vn-venue-type"
              data-clarity-mask="True"
              name="venueType"
              value={values.venueType}
              onChange={(event) => updateValue("venueType", event.target.value)}
              aria-invalid={errors.venueType ? true : undefined}
              aria-describedby={errors.venueType ? "vn-venue-type-error" : undefined}
              disabled={isSending}
            >
              {venueOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <Image
              className="vn-select-chevron"
              src="/icons/fe_drop-down.svg"
              alt=""
              width={18}
              height={18}
              aria-hidden="true"
            />
          </div>
          {errors.venueType ? (
            <p className="vn-field-error" id="vn-venue-type-error">
              {errors.venueType}
            </p>
          ) : null}
        </div>
      </div>
      <div className="vn-field vn-message-field">
        <label htmlFor="vn-message">Message</label>
        <textarea
          id="vn-message"
          data-clarity-mask="True"
          name="message"
          placeholder="Tell us a little about your venue"
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "vn-message-error" : undefined}
          required
          disabled={isSending}
          rows={3}
        />
        {errors.message ? (
          <p className="vn-field-error" id="vn-message-error">
            {errors.message}
          </p>
        ) : null}
      </div>
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="vn-website">Website</label>
        <input
          id="vn-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>
      <div className="vn-form-footer">
        <p
          className={`vn-form-feedback${feedbackType ? ` is-${feedbackType}` : ""}`}
          aria-live="polite"
        >
          {feedback}
        </p>
        <button className="vn-submit" type="submit" disabled={isSending}>
          {isSending ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}

export default function VenuesPage() {
  return (
    <main className="vn-page">
      <div className="vn-nav-band">
        <SiteNavbar page="venues" />
      </div>

      <section className="vn-hero" aria-labelledby="vn-hero-title">
        <div className="vn-hero-inner">
          <div className="vn-hero-copy vn-reveal">
            <h1 id="vn-hero-title">
              Help every visitor move through your{" "}
              <strong>venue</strong> with <strong>ease</strong>
            </h1>
            <p>
              fplaces adds AR navigation and live crowd insight on top of the
              venue you already run — no rebuild, no new hardware, no app for
              visitors to download
            </p>
            <a
              className="vn-primary-button"
              href="#contact"
              onClick={() =>
                trackEvent("cta_click", {
                  label: "Get in touch",
                  page: "/venues",
                })
              }
            >
              Get in touch
            </a>
          </div>
          <div className="vn-hero-photo vn-reveal">
            <Image
              src="/img/Venue.webp"
              alt="Venue manager using a tablet in a stadium"
              width={1200}
              height={800}
              priority
              fetchPriority="high"
              sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1024px) 48vw, 560px"
            />
          </div>
        </div>
      </section>

      <section
        className="vn-types"
        id="venue-types"
        aria-labelledby="vn-types-title"
      >
        <div className="vn-section-inner">
          <p className="vn-eyebrow vn-reveal">Where fplaces work</p>
          <h2 className="vn-section-title vn-reveal" id="vn-types-title">
            From stadiums and airports to malls, campuses, and hospitals,
            fplaces works across any large venue.
          </h2>
          <p className="vn-section-intro vn-reveal">
            If your venue has entrances, a crowd, and people trying to find
            something, fplaces fits.
          </p>
          <div className="vn-type-grid">
            {venueTypes.map((venue) => (
              <article
                className="vn-type-card vn-reveal"
                key={venue.title}
              >
                <div className="vn-type-photo">
                  <Image
                    src={`/img/${encodeURIComponent(venue.image)}`}
                    alt={venue.alt}
                    width={800}
                    height={500}
                    sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1024px) 45vw, 265px"
                  />
                </div>
                <div className="vn-type-copy">
                  <h3>{venue.title}</h3>
                  <p>{venue.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="vn-steps"
        id="steps"
        aria-labelledby="vn-steps-title"
      >
        <div className="vn-section-inner">
          <p className="vn-steps-eyebrow vn-reveal">
            How it works for venue operators
          </p>
          <h2 className="vn-steps-title vn-reveal" id="vn-steps-title">
            Get started in 3 steps
          </h2>
          <div className="vn-step-grid">
            <Image
              className="vn-mobile-step-line"
              src="/icons/Line.svg"
              alt=""
              width={785}
              height={1}
              aria-hidden="true"
            />
            {steps.map((step) => (
              <article className="vn-step vn-reveal" key={step.number}>
                <Image
                  className="vn-step-icon"
                  src={`/icons/${encodeURIComponent(step.icon)}`}
                  alt=""
                  width={33}
                  height={38}
                  aria-hidden="true"
                />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="vn-contact"
        id="contact"
        aria-labelledby="vn-contact-title"
      >
        <div className="vn-contact-inner">
          <aside className="vn-contact-card vn-reveal">
            <p className="vn-contact-eyebrow">Contact us</p>
            <h2 id="vn-contact-title">Let&apos;s talk about your venue</h2>
            <p className="vn-contact-copy">
              Fill out the form and a member of our team will get back to you as
              soon as possible.
            </p>
            <div className="vn-contact-methods">
              <div className="vn-contact-method">
                <span className="vn-contact-icon vn-mail-icon" aria-hidden="true" />
                <span>Email</span>
              </div>
              <div className="vn-contact-method">
                <span className="vn-contact-icon vn-phone-icon" aria-hidden="true" />
                <span>Phone</span>
              </div>
            </div>
            <ul className="vn-social-list" aria-label="Social media">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    className="vn-social-link"
                    href={link.href}
                    aria-label={link.label}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span
                      className={`vn-social-icon ${link.iconClass}`}
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </aside>
          <div className="vn-contact-form-panel vn-reveal">
            <h2>Send us a message</h2>
            <p>Tell us a little about your venue, and we&apos;ll take it from there.</p>
            <ContactForm />
          </div>
        </div>
      </section>

      <CtaBanner />
      <SiteFooter page="venues" />
    </main>
  );
}
