"use client";

import Image from "next/image";
import { useState } from "react";
import SiteFooter from "../../components/SiteFooter";
import SiteNavbar from "../../components/SiteNavbar";
import { trackEvent } from "../../lib/analytics";

const faqs = [
  {
    id: "what-is-fplaces",
    question: "What is fplaces?",
    answer:
      "fplaces is a real-time navigation and social companion for large venues. Use AR navigation to find your way and live crowd insight to see what is happening around you.",
  },
  {
    id: "download-app",
    question: "Do I need to download an app?",
    answer:
      "No. fplaces runs in your browser, so you can get started without downloading an app.",
  },
  {
    id: "navigate",
    question: "How does fplaces help me navigate?",
    answer:
      "fplaces uses venue maps and points of interest to guide you to places such as your seat, gate, or a nearby service.",
  },
  {
    id: "poor-connection",
    question: "What if my internet connection is poor?",
    answer:
      "Navigation can continue with the venue information already available on your device. Live updates refresh when your connection returns.",
  },
  {
    id: "connect-with-people",
    question: "Can I connect with other people?",
    answer:
      "You can read and share short live updates with other visitors at the venue, helping everyone stay in the loop.",
  },
  {
    id: "real-name",
    question: "Is my real name visible to other users?",
    answer:
      "No. Visitors post under a pseudo name, so your real name is not shown to other users.",
  },
  {
    id: "where-to-use",
    question: "Where can I use fplaces?",
    answer:
      "fplaces is designed for large venues, including stadiums, airports, train stations, malls, campuses, hospitals, concerts, and convention centers.",
  },
  {
    id: "share-updates",
    question: "Can I share updates with other people?",
    answer:
      "Yes. Share a short update with visitors at the same venue. Posts automatically disappear after two hours to help keep the feed fresh.",
  },
  {
    id: "search-places",
    question: "Can I search for places inside a venue?",
    answer:
      "Yes. Search for gates, seats, food stands, restrooms, and other points of interest inside a supported venue.",
  },
];

export default function FaqPage() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  return (
    <main className="faq-page">
      <div className="vn-nav-band">
        <SiteNavbar page="faq" />
      </div>

      {/* FAQ hero uses the supplied Figma image within the fixed desktop ratio. */}
      <section className="faq-hero" aria-labelledby="faq-hero-title">
        <Image
          className="faq-hero-image"
          src="/img/faq-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
        />
        <div className="faq-hero-copy">
          <h1 id="faq-hero-title">
            FREQUENTLY ASKED
            <br />
            QUESTIONS
          </h1>
          <p>Everything you need to know about fplaces</p>
        </div>
      </section>

      {/* One-answer-at-a-time accessible FAQ accordion. */}
      <section className="faq-list-section" aria-label="Frequently asked questions">
        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaqId === faq.id;
            const questionId = `faq-question-${faq.id}`;
            const answerId = `faq-answer-${faq.id}`;

            return (
              <article
                className={`faq-item${isOpen ? " is-open" : ""}`}
                key={faq.id}
              >
                <h3 className="faq-question-heading">
                  <button
                    className="faq-question"
                    id={questionId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => {
                      if (!isOpen) {
                        trackEvent("faq_opened", {
                          question_number: index + 1,
                        });
                      }
                      setOpenFaqId(isOpen ? null : faq.id);
                    }}
                  >
                    <span>{faq.question}</span>
                    <Image
                      className="faq-icon"
                      src="/icons/faqs%20add.svg"
                      alt=""
                      width={16}
                      height={16}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  className="faq-answer"
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                >
                  <div className="faq-answer-inner">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <SiteFooter page="faq" />
    </main>
  );
}
