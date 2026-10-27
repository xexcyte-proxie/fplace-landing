import type { Metadata } from "next";
import Image from "next/image";
import CtaBanner from "../../components/CtaBanner";
import FeaturesScrollReveal from "../../components/FeaturesScrollReveal";
import SiteFooter from "../../components/SiteFooter";
import SiteNavbar from "../../components/SiteNavbar";

export const metadata: Metadata = {
  title: "Features | fplaces",
  description:
    "Find your way through large venues with real-time guidance, indoor maps, and live updates.",
};

const features = [
  {
    icon: "/icons/ar%20arrows.svg",
    title: "AR arrows",
    description: "Follow arrows on your phone to locate your destination",
  },
  {
    icon: "/icons/live-indoor-maps.svg",
    title: "Live indoor map",
    description:
      "See exactly where you are and which way you're facing, updated as you walk",
  },
  {
    icon: "/icons/live-update.svg",
    title: "Live updates",
    description: "See short posts from people in the same venue",
  },
  {
    icon: "/icons/work-offline.svg",
    title: "Works offline",
    description:
      "The map is saved after your first use, so it still works when venue wifi doesn't",
  },
  {
    icon: "/icons/safety.svg",
    title: "Safety & Alerts",
    description:
      "Get real time safety updates and important alerts from venues",
  },
  {
    icon: "/icons/live-indoor-maps.svg",
    title: "Community driven",
    description: "Interact with people in the same venue as you",
  },
];

export default function FeaturesPage() {
  return (
    <main className="fe-page">
      <FeaturesScrollReveal />
      <div className="fe-nav-band">
        <SiteNavbar page="features" />
      </div>

      <section className="fe-hero" aria-labelledby="fe-hero-title">
        <div className="fe-container fe-hero-inner">
          <div className="fe-hero-copy">
            <h1 id="fe-hero-title">
              Explore any <span>venue</span> with confidence
            </h1>
            <p>
              fplaces gives you real-time guidance and updates to help you find
              places, avoid crowds and enjoy a smoother experience in any large
              venue
            </p>
            <a className="fe-primary-button" href="#get-started">
              Get started
            </a>
          </div>
          <div className="fe-hero-media">
            <Image
              src="/img/features.png"
              alt="A traveler following AR directions on a phone in a busy airport concourse"
              width={1096}
              height={710}
              priority
              sizes="(max-width: 1023px) calc(100vw - 48px), 546px"
            />
          </div>
        </div>
      </section>

      <section
        className="fe-feature-section"
        aria-labelledby="fe-feature-title"
      >
        <div className="fe-feature-heading">
          <p className="fe-feature-label">KEY FEATURES</p>
          <h2 id="fe-feature-title">See features which fplace is built on</h2>
          <p className="fe-feature-subtitle">
            Everything works together in one place. No third party download
          </p>
        </div>
        <ul className="fe-feature-grid">
          {features.map((feature, index) => (
            <li
              className="fe-feature-card reveal-item"
              data-reveal-item
              key={feature.title}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <span className="fe-icon-tile" aria-hidden="true">
                <Image
                  src={feature.icon}
                  alt=""
                  width={22}
                  height={22}
                  aria-hidden="true"
                />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <CtaBanner />
      <SiteFooter page="features" />
    </main>
  );
}
