"use client";

import Image from "next/image";
import { Fragment, useState } from "react";
import SiteFooter from "../../components/SiteFooter";
import SiteNavbar from "../../components/SiteNavbar";
import { trackEvent } from "../../lib/analytics";

const faqs = [
  {
    id: "what-is-fplaces",
    question: "What is fplaces?",
    answer:
      "fplaces is a web app that helps you find your way around large venues like stadiums and airports, and lets you see and share what's happening around you. It gives you a complete experience across your visit: tips before you go, directions when you arrive, a live feed while you're inside, and tips for the next visitor after you leave.",
  },
  {
    id: "which-venues",
    question: "Which venues does fplaces cover?",
    answer: (
      <>
        We&apos;re starting with stadiums. If your venue isn&apos;t available yet, tell us
        through the{" "}
        <a href="/venues#contact">contact form</a>.
      </>
    ),
  },
  {
    id: "download-app",
    question: "Do I need to download an app?",
    answer:
      "No. fplaces works in your phone's browser. Just visit fplaces.com or scan your venue's quick response (QR) code.",
  },
  {
    id: "account",
    question: "Do I need an account?",
    answer:
      "No. You can explore the map, search for places, and read the live feed as a guest. To post updates or use account features, you'll need a free account.",
  },
  {
    id: "navigate",
    question: "How does navigation work?",
    answer:
      "Search for a place, such as a gate, restroom, or food stand, and fplaces shows you where it is on the venue map. You can switch floors, or use augmented reality navigation to follow directions on your camera screen.",
  },
  {
    id: "before-visit",
    question: "Can I find out what a venue is like before I visit?",
    answer:
      "Live posts stay visible for about two hours, which keeps the feed focused on what's happening now. Tips in What to Expect stay available longer, so the next visitor can read them before they go.",
  },
  {
    id: "share-updates",
    question: "Can I share updates with other people?",
    answer:
      "Yes. Post short updates of up to 140 characters about queues, food, crowds, or anything useful happening around the venue, and upvote posts you find helpful. Comments and direct messages aren't available yet.",
  },
  {
    id: "post-duration",
    question: "How long do posts stay up?",
    answer:
      "Posts stay visible for about two hours, which keeps the feed focused on what's happening now.",
  },
  {
    id: "camera",
    question: "Does fplaces use my camera?",
    answer:
      "Only when you choose augmented reality navigation, which shows directions over your surroundings. Camera processing and video storage are covered in our Privacy Policy.",
  },
  {
    id: "select-venue",
    question: "Why does fplaces ask me to select a venue?",
    answer:
      "So it can show you the right map and live feed. Choose your venue and gate yourself, or scan the venue's quick response (QR) code where available.",
  },
  {
    id: "real-name",
    question: "Can other users see my real name?",
    answer:
      "No. Other users see only the display name you choose. Your real name and email address stay private.",
  },
  {
    id: "report-post",
    question: "What if someone posts something offensive?",
    answer:
      "Report it with the flag option. When three different users report the same post, it is hidden automatically. In a medical or security emergency, contact venue staff directly. fplaces is not an emergency service.",
  },
  {
    id: "delete-account",
    question: "Can I delete my account?",
    answer:
      "Yes. Request deletion in your account settings. We'll delete your account information and posts, though flagged posts may be kept for up to 30 days for review.",
  },
  {
    id: "poor-connection",
    question: "Does fplaces work without internet?",
    answer:
      "Partly. Some map and navigation data can be saved on your phone for use when your connection is weak, but you need an internet connection to load new posts.",
  },
  {
    id: "venue-contact",
    question: "How can I get my venue on fplaces?",
    answer: (
      <>
        If you manage or operate a venue, use the{" "}
        <a href="/venues#contact">contact form on our For venues page</a> and
        tell us about it. We&apos;ll get in touch to talk about adding your venue&apos;s
        map and live feed.
      </>
    ),
  },
  {
    id: "advertise",
    question: "How can my business or brand advertise on fplaces?",
    answer: (
      <>
        Tell us about your brand through the{" "}
        <a href="/venues#contact">contact form</a>, and we&apos;ll be in touch.
      </>
    ),
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
          src="/img/faq-hero.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          aria-hidden="true"
        />
        <div className="faq-hero-copy">
          <h1 id="faq-hero-title">Frequently asked questions</h1>
          <p>Everything you need to know about fplaces</p>
        </div>
      </section>

      {/* One-answer-at-a-time accessible FAQ accordion. */}
      <section className="faq-list-section" aria-labelledby="faq-hero-title">
        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaqId === faq.id;
            const questionId = `faq-question-${faq.id}`;
            const answerId = `faq-answer-${faq.id}`;

            return (
              <Fragment key={faq.id}>
                {index === 14 ? (
                  <h2 className="faq-group-title">For venues and businesses</h2>
                ) : null}
                <article
                  className={`faq-item${isOpen ? " is-open" : ""}`}
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
                      <span>
                        {index + 1}. {faq.question}
                      </span>
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
              </Fragment>
            );
          })}
        </div>
      </section>

      <SiteFooter page="faq" />
    </main>
  );
}
