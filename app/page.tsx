"use client";

import Image from "next/image";
import { useEffect } from "react";
import CtaBanner from "../components/CtaBanner";
import PhoneLiveFeed from "../components/PhoneLiveFeed";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { trackEvent } from "../lib/analytics";

const venueCategories = [
  {
    title: "Stadiums",
    description:
      "Find your seats, gates, food stands, restrooms, and exits with ease",
    icon: "/icons/tabler-icon-building-stadium.svg",
    width: 30,
    height: 30,
  },
  {
    title: "Transport Hubs",
    description:
      "Navigate terminals, gates, services, and busy spaces without getting lost.",
    icon: "/icons/transport-hub.svg",
    width: 26,
    height: 20,
  },
  {
    title: "Convention Centres",
    description: "Locate halls, auditoriums with ease",
    icon: "/icons/convention-centres.svg",
    width: 35,
    height: 35,
  },
  {
    title: "Malls",
    description:
      "Quickly find stores, restaurants, facilities, and other points of interest.",
    icon: "/icons/tabler-icon-building-store.svg",
    width: 32,
    height: 32,
  },
];

const venueChallenges = [
  {
    title: "Where do I go?",
    description:
      "Big venues give you a map, but finding one exact place can still take some figuring out.",
  },
  {
    title: "See what is happening",
    description:
      "It shows you where things are, but not what is happening there right now.",
  },
  {
    title: "See the bigger picture",
    description:
      "Thousands of people share the same space, all seeing different things, with no way to pool what they know.",
  },
];

const approachSteps = [
  {
    title: "Start in seconds.",
    description:
      "Open fplaces and you are straight in, ready to find your way and see what's happening around you.",
  },
  {
    title: "Follow the arrows",
    description:
      "Point your camera and follow real-time AR directional arrows to your seat, gate, or destination.",
  },
  {
    title: "See what the crowd's saying",
    description:
      "Post live updates and read a real-time feed of what is happening in the venue.",
  },
];

const liveVenuePosts = [
  {
    author: "Swiftotter_21",
    initials: "SF",
    avatar: "sky",
    tag: "Crowds",
    message: "Merch line at Gate C just cleared out. Under 5 mins now",
    location: "Section 112",
    count: 80,
  },
  {
    author: "HungryHawk",
    initials: "HH",
    avatar: "blue",
    tag: "Food",
    message: "Nachos stand on the concourse has a short line.",
    location: "Concourse B",
    count: 31,
  },
  {
    author: "Blue_Linv32",
    initials: "BL",
    avatar: "magenta",
    tag: "Hype",
    message: "Atmosphere in 114 right now is absolutely unreal.",
    location: "Section 114",
    count: 214,
  },
  {
    author: "Davper_864",
    initials: "DP",
    avatar: "red",
    tag: "Queue",
    message: "We have less people at Sir Alex stand",
    location: "Sir Alex Stand",
    count: 43,
  },
];

function VenuePostCard({ post }: { post: (typeof liveVenuePosts)[number] }) {
  return (
    <article className="live-venue-card">
      <header className="live-venue-card-header">
        <span className={`live-card-avatar avatar-${post.avatar}`}>
          {post.initials}
        </span>
        <span className="live-card-author">{post.author}</span>
        <span className={`live-card-tag tag-${post.tag.toLowerCase()}`}>
          {post.tag}
        </span>
      </header>
      <p className="live-card-message">{post.message}</p>
      <footer className="live-card-footer">
        <span className="warning-triangle" aria-hidden="true" />
        <span className="live-card-count">{post.count}</span>
        <span className="live-card-location">{post.location}</span>
      </footer>
    </article>
  );
}

export default function Home() {
  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(
      "[data-reveal-item]",
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("has-scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("has-scroll-reveal");
    };
  }, []);

  // Pauses the hero caption typewriter loop while it is off-screen.
  useEffect(() => {
    const caption = document.querySelector<HTMLElement>(".hero-caption-text");
    if (!caption || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        caption.classList.toggle("is-offscreen", !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    observer.observe(caption);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const section = document.querySelector<HTMLElement>(".fv-section");
    if (!section) return;

    const items = section.querySelectorAll<HTMLElement>(".fv-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fv-is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    items.forEach((item) => observer.observe(item));
    section.classList.add("fv-motion-ready");

    return () => {
      observer.disconnect();
      section.classList.remove("fv-motion-ready");
      items.forEach((item) => item.classList.remove("fv-is-visible"));
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const feedWindow = document.querySelector<HTMLElement>("[data-live-feed]");
    if (!feedWindow) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        feedWindow.classList.toggle("is-in-view", entry.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(feedWindow);

    return () => observer.disconnect();
  }, []);

  return (
    <main className="landing">
      <section className="hero" aria-labelledby="hero-title">
        <SiteNavbar page="home" />

        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Navigate. Discover. Share.</p>
            <h1 className="reveal-item" id="hero-title" data-reveal-item>
              <span>
                <strong>Find</strong> <em>places.</em>
              </span>
              <span>
                <strong>Find</strong>{" "}
                <em style={{ color: "#A1BFC3" }}>people.</em>
              </span>
              <span>
                <strong>Find your</strong> <em>way.</em>
              </span>
            </h1>
            <p className="hero-description">
              Find your way through any venue, and see what the crowd is saying.
              Right from your browser.
            </p>
            <div className="hero-actions">
              <a
                className="primary-button"
                href="#get-started"
                onClick={() =>
                  trackEvent("cta_click", { label: "Get started", page: "/" })
                }
              >
                Get started
                <Image
                  src="/icons/arrow-up-right.svg"
                  alt=""
                  width={16}
                  height={16}
                />
              </a>
              <a className="secondary-button" href="#how-it-works">
                How it works
                <Image
                  src="/icons/arrow-down.svg"
                  alt=""
                  width={16}
                  height={18}
                />
              </a>
            </div>
          </div>

          <figure className="hero-visual">
            <div className="hero-media">
              <span className="hero-glow" aria-hidden="true" />
              <div className="visual-frame">
                <Image
                  src="/img/navigation.png"
                  alt="Fplaces indoor navigation guiding visitors through an airport"
                  fill
                  priority
                  sizes="(max-width: 760px) 100vw, 50vw"
                  className="navigation-image reveal-image reveal-item"
                  data-reveal-item
                />
              </div>
            </div>
            <div className="hero-caption">
              <figcaption className="hero-caption-text">
                <span className="hero-typed">
                  Your real-time navigation and social companion for any large
                  venue.
                </span>
              </figcaption>
            </div>
          </figure>
        </div>
      </section>

      <section className="community-section" aria-label="Explore venues together">
        <Image
          className="community-image reveal-image reveal-item"
          src="/img/body.png"
          alt="Friends following Fplaces indoor navigation together at a stadium"
          width={1593}
          height={968}
          sizes="(max-width: 760px) 100vw, 80vw"
          data-reveal-item
        />
      </section>

      <section
        className="venue-section"
        id="venues"
        aria-label="Venue navigation"
        data-reveal-root
      >
        <div className="venue-section-inner venue-layout">
          <div className="venue-grid" aria-label="Types of venues">
            {venueCategories.map((category, index) => (
              <article
                className="venue-card reveal-item"
                data-reveal-item
                key={category.title}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
<span className="venue-icon-tile" aria-hidden="true">
                    <span
                      className="venue-icon"
                      style={{
                        width: category.width,
                        height: category.height,
                        maskImage: `url(${category.icon})`,
                        WebkitMaskImage: `url(${category.icon})`,
                      }}
                    />
                  </span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </article>
            ))}
          </div>

          <div className="venue-intro reveal-item reveal-after-cards" data-reveal-item>
            <h2>Navigate any venue with ease</h2>
            <p>
              From stadiums to airports, malls, and train stations, etc. fplaces
              helps you find your way faster and stay connected to what&apos;s
              happening around you.
            </p>
            <a className="explore-venues-button" href="#venue-challenges">
              Explore more venues
              <span className="venue-link-arrow" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section
        className="venue-challenges-section"
        id="venue-challenges"
        aria-labelledby="venue-challenges-title"
        data-reveal-root
      >
        <div className="venue-section-inner">
          <header
            className="venue-challenges-intro reveal-item reveal-after-cards"
            data-reveal-item
          >
            <h2 id="venue-challenges-title">
              Big venues. Easier to navigate. Less lonely inside.
            </h2>
            <p>
              Stadiums, malls, and transport hubs move enormous crowds, yet
              inside, you still can&apos;t easily find your way or see what the
              crowd already knows.
            </p>
          </header>

          <div className="venue-challenges-grid">
            {venueChallenges.map((challenge) => (
              <article
                className="venue-challenge-card reveal-item"
                data-reveal-item
                key={challenge.title}
              >
                <div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="approach-section"
        id="our-approach"
        aria-labelledby="approach-title"
        data-reveal-root
      >
        <div className="approach-inner">
          <h2
            className="approach-heading reveal-item"
            id="approach-title"
            data-reveal-item
          >
            Our Approach
          </h2>
          <div className="approach-grid">
            {approachSteps.map((step) => (
              <article
                className="approach-card reveal-item"
                data-reveal-item
                key={step.title}
              >
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="real-time-section"
        id="real-time"
        aria-labelledby="real-time-title"
        data-reveal-root
        data-live-feed
      >
        <div className="real-time-inner">
          <div
            className="real-time-left-feed reveal-item"
            data-reveal-item
            aria-label="Recent updates from people at this venue"
          >
            <div className="real-time-left-track">
              <div className="real-time-left-sequence">
                {liveVenuePosts.map((post) => (
                  <VenuePostCard post={post} key={post.author} />
                ))}
              </div>
              <div
                className="real-time-left-sequence"
                aria-hidden="true"
              >
                {liveVenuePosts.map((post) => (
                  <VenuePostCard
                    post={post}
                    key={`${post.author}-loop`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="real-time-copy">
            <p className="real-time-eyebrow reveal-item" data-reveal-item>
              REAL TIME. REAL PEOPLE.
            </p>
            <h2
              className="real-time-heading reveal-item"
              id="real-time-title"
              data-reveal-item
            >
              The crowd already knows.
              <br />
              Now so do you
            </h2>
            <p className="real-time-description reveal-item" data-reveal-item>
              From short lines to great food stops, live updates from the people
              around you make the most of every moment; before you even get
              there.
            </p>
            <ul className="real-time-benefits">
              <li className="real-time-benefit reveal-item" data-reveal-item>
                <Image
                  src="/icons/tabler-icon-pin.svg"
                  alt=""
                  width={24}
                  height={24}
                />
                <span>
                  Posts are scoped to your venue, only what matters where you
                  are
                </span>
              </li>
              <li className="real-time-benefit reveal-item" data-reveal-item>
                <Image
                  src="/icons/tabler-icon-user-x.svg"
                  alt=""
                  width={24}
                  height={24}
                />
                <span>
                  Everyone posts under a pseudo name, anonymous by design
                </span>
              </li>
              <li className="real-time-benefit reveal-item" data-reveal-item>
                <Image
                  src="/icons/tabler-icon-trash.svg"
                  alt=""
                  width={24}
                  height={24}
                />
                <span>
                  Posts auto delete after 2 hours, always fresh never cluttered
                </span>
              </li>
              <li className="real-time-benefit reveal-item" data-reveal-item>
                <Image
                  src="/icons/comment.svg"
                  alt=""
                  width={24}
                  height={24}
                />
                <span>
                  Get helpful tips from past visitors so you know what to expect
                  before you arrive.
                </span>
              </li>
            </ul>
          </div>

          <div className="real-time-phone reveal-item" data-reveal-item>
            <PhoneLiveFeed />
          </div>
        </div>
      </section>
      
      {/* For Venues */}

      <section
        className="fv-section"
        id="for-venues"
        aria-labelledby="fv-title"
      >
        <div className="fv-container">
          <div className="fv-collage" aria-label="Venues in action">
            <figure className="fv-photo fv-photo-stadium fv-reveal">
              <Image
                className="fv-photo-image reveal-image"
                src="/img/Frame 208.png"
                alt="Stadium seating and pitch"
                width={610}
                height={900}
                sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1024px) 45vw, 265px"
                data-reveal-item
                data-reveal-image
              />
            </figure>
            <figure className="fv-photo fv-photo-concourse fv-reveal">
              <Image
                className="fv-photo-image reveal-image"
                src="/img/Frame 209.png"
                alt="Crowd walking through a stadium concourse"
                width={458}
                height={324}
                sizes="(max-width: 767px) calc(50vw - 22px), (max-width: 1024px) 45vw, 265px"
                data-reveal-item
                data-reveal-image
              />
            </figure>
            <figure className="fv-photo fv-photo-transport fv-reveal">
              <Image
                className="fv-photo-image reveal-image"
                src="/img/Frame 254.png"
                alt="Passengers in a busy transport hub"
                width={458}
                height={320}
                sizes="(max-width: 767px) calc(50vw - 22px), (max-width: 1024px) 45vw, 265px"
                data-reveal-item
                data-reveal-image
              />
            </figure>
          </div>

          {/* For Venues */}

          <div className="fv-copy">
            <p className="fv-eyebrow fv-reveal">FOR VENUES</p>
            <h2 className="fv-title fv-reveal" id="fv-title">
              Give every visitor a smarter way
              <br />
              to move through your venue
            </h2>
            <p className="fv-description fv-reveal">
              fplaces adds a navigation and engagement layer to your venue, so
              your visitors find their way and stay in the loop on what&apos;s
              happening.
            </p>
            <ul className="fv-benefits">
              <li className="fv-benefit fv-reveal">
                <Image
                  className="fv-check"
                    src="/icons/checkmark.svg"
                  alt=""
                  width={31}
                  height={31}
                  aria-hidden="true"
                />
                <span>
                  Optional QR codes for your venue, ready to be placed wherever
                  you want them
                </span>
              </li>
              <li className="fv-benefit fv-reveal">
                <Image
                  className="fv-check"
                    src="/icons/checkmark.svg"
                  alt=""
                  width={31}
                  height={31}
                  aria-hidden="true"
                />
                <span>
                  Full control of your venue map, with updates that go live
                  quickly.
                </span>
              </li>
              <li className="fv-benefit fv-reveal">
                <Image
                  className="fv-check"
                    src="/icons/checkmark.svg"
                  alt=""
                  width={31}
                  height={31}
                  aria-hidden="true"
                />
                <span>
                  See how crowds move through your space and where they gather
                </span>
              </li>
              <li className="fv-benefit fv-reveal">
                <Image
                  className="fv-check"
                    src="/icons/checkmark.svg"
                  alt=""
                  width={31}
                  height={31}
                  aria-hidden="true"
                />
                <span>
                  Higher dwell time and engagement, without adding staff
                  workload
                </span>
              </li>
            </ul>
            <a
              className="fv-cta fv-reveal"
              href="/venues#contact"
              onClick={() =>
                trackEvent("cta_click", {
                  label: "Talk to our team",
                  page: "/",
                })
              }
            >
              Talk to our team
            </a>
          </div>
        </div>
      </section>

      <CtaBanner />
      <SiteFooter page="home" />
    </main>
  );
}
