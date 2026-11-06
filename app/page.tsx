"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import CtaBanner from "../components/CtaBanner";
import PhoneLiveFeed from "../components/PhoneLiveFeed";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { trackEvent } from "../lib/analytics";

// TEXT_MOTION: x and y are the maximum movement in px when the cursor is at
// the edge of the row. NEGATIVE = moves AWAY from the cursor (depth effect);
// POSITIVE = moves WITH the cursor; 0 = off on that axis. tiltX and tiltY are
// the 3D tilt in degrees (0 = off). stiffness and damping control how quickly
// each layer follows (lower stiffness = lazier, silkier).
// Example: x: 20, y: 0 = follows the cursor sideways only.
const TEXT_MOTION = {
  heading: { x: -18, y: -12, stiffness: 110, damping: 22 },
  paragraph: { x: -12, y: -8, stiffness: 80, damping: 20 },
  button: { x: -7, y: -5, stiffness: 60, damping: 18 },
  tiltX: 2.5,
  tiltY: 3.5,
};

// Shared venue-row cursor light; movement values are px and opacities are 0-1.
const LIGHT = {
  size: 460, // Glow diameter in px.
  strength: 0.14, // Opacity of the row glow.
  spotlight: 0.16, // Card spotlight colour alpha at full brightness.
  reach: 340, // Distance from a card edge where its light fades out.
  edge: 0.35, // Card-edge highlight alpha at full brightness.
  follow: 0.14, // Per-frame follow amount; lower is silkier and lazier.
};

type VenueLightState = {
  frame: number | null;
  pulseTimeout: number | null;
  pointerInside: boolean;
  touchPulse: boolean;
  initialized: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  intensities: WeakMap<HTMLElement, number>;
};

const venueCategories = [
  {
    title: "Stadiums",
    description:
      "Find your seats, gates, food stands, restrooms, and exits with ease.",
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

const navigateHeading = "Navigate any venue with ease";

type VenueMotionCardProps = {
  category: (typeof venueCategories)[number];
  index: number;
  desktop: boolean;
  reducedMotion: boolean;
  forceVisible: boolean;
  mx: MotionValue<number>;
  my: MotionValue<number>;
};

function VenueMotionCard({
  category,
  index,
  desktop,
  reducedMotion,
  forceVisible,
  mx,
  my,
}: VenueMotionCardProps) {
  const [entered, setEntered] = useState(false);
  const depth = [0.6, 1, 1.2, 0.8][index];
  const cardX = useTransform(mx, (value) => value * depth * 26);
  const cardY = useTransform(my, (value) => value * depth * 20);
  const rotateX = useTransform(my, (value) => value * depth * -4);
  const rotateY = useTransform(mx, (value) => value * depth * 5);
  const iconX = useTransform(mx, (value) => value * 8);
  const iconY = useTransform(my, (value) => value * 6);
  const cardVisible = reducedMotion || forceVisible;

  return (
    <motion.article
      className="venue-card reveal-item"
      initial={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.94, filter: "blur(6px)" }
      }
      variants={{
        visible: {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            opacity: { duration: 0.5 },
            scale: { type: "spring", stiffness: 200, damping: 24 },
            filter: { type: "spring", stiffness: 200, damping: 24 },
          },
        },
      }}
      animate={
        cardVisible
          ? { opacity: 1, scale: 1, filter: "blur(0px)" }
          : undefined
      }
      transition={
        reducedMotion ? { opacity: { duration: 0.3 } } : undefined
      }
      whileHover={
        desktop && !reducedMotion
          ? {
              scale: 1.03,
              transition: {
                scale: { type: "spring", stiffness: 320, damping: 22 },
              },
            }
          : undefined
      }
      whileTap={!reducedMotion ? { scale: 0.97 } : undefined}
      style={
        desktop && !reducedMotion
          ? {
              x: cardX,
              y: cardY,
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }
          : undefined
      }
    >
      {!reducedMotion ? (
        <span className="venue-card-light" aria-hidden="true" />
      ) : null}
      <motion.span
        className="venue-icon-tile"
        aria-hidden="true"
        initial={reducedMotion ? { opacity: 0 } : { scale: 0.6 }}
        whileInView={reducedMotion ? undefined : { scale: 1 }}
        animate={
          reducedMotion || forceVisible
            ? { opacity: 1, scale: 1 }
            : entered && !desktop
              ? { y: [0, -3, 0] }
              : undefined
        }
        viewport={{ once: true, amount: 0.25 }}
        transition={
          reducedMotion
            ? { opacity: { duration: 0.3 } }
            : entered && !desktop
              ? {
                  y: {
                    duration: 6 + index * 0.2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "loop",
                    delay: index * 0.4,
                  },
                }
              : {
                  type: "spring",
                  stiffness: 260,
                  damping: 15,
                  delay: index * 0.11 + 0.15,
                }
        }
        onAnimationComplete={() => setEntered(true)}
        style={
          desktop && !reducedMotion
            ? { x: iconX, y: iconY, willChange: "transform" }
            : undefined
        }
      >
        <span
          className="venue-icon"
          style={{
            width: category.width,
            height: category.height,
            maskImage: `url(${category.icon})`,
            WebkitMaskImage: `url(${category.icon})`,
          }}
        />
      </motion.span>
      <h3>{category.title}</h3>
      <p>{category.description}</p>
    </motion.article>
  );
}

function NavigateVenueIntro({
  desktop,
  reducedMotion,
  forceVisible,
  rawPointerX,
  rawPointerY,
  introRef,
}: {
  desktop: boolean;
  reducedMotion: boolean;
  forceVisible: boolean;
  rawPointerX: MotionValue<number>;
  rawPointerY: MotionValue<number>;
  introRef: RefObject<HTMLDivElement | null>;
}) {
  const rawButtonX = useMotionValue(0);
  const rawButtonY = useMotionValue(0);
  const buttonX = useSpring(rawButtonX, { stiffness: 180, damping: 20 });
  const buttonY = useSpring(rawButtonY, { stiffness: 180, damping: 20 });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const headingX = useSpring(rawPointerX, {
    stiffness: TEXT_MOTION.heading.stiffness,
    damping: TEXT_MOTION.heading.damping,
    mass: 0.6,
  });
  const headingY = useSpring(rawPointerY, {
    stiffness: TEXT_MOTION.heading.stiffness,
    damping: TEXT_MOTION.heading.damping,
    mass: 0.6,
  });
  const paragraphX = useSpring(rawPointerX, {
    stiffness: TEXT_MOTION.paragraph.stiffness,
    damping: TEXT_MOTION.paragraph.damping,
    mass: 0.6,
  });
  const paragraphY = useSpring(rawPointerY, {
    stiffness: TEXT_MOTION.paragraph.stiffness,
    damping: TEXT_MOTION.paragraph.damping,
    mass: 0.6,
  });
  const textButtonX = useSpring(rawPointerX, {
    stiffness: TEXT_MOTION.button.stiffness,
    damping: TEXT_MOTION.button.damping,
    mass: 0.6,
  });
  const textButtonY = useSpring(rawPointerY, {
    stiffness: TEXT_MOTION.button.stiffness,
    damping: TEXT_MOTION.button.damping,
    mass: 0.6,
  });
  const rotateY = useSpring(
    useTransform(rawPointerX, (value) => value * TEXT_MOTION.tiltY),
    { stiffness: 90, damping: 20, mass: 0.6 },
  );
  const rotateX = useSpring(
    useTransform(rawPointerY, (value) => value * -TEXT_MOTION.tiltX),
    { stiffness: 90, damping: 20, mass: 0.6 },
  );

  useEffect(() => {
    if (!desktop || reducedMotion) return;

    const subscriptions: Array<() => void> = [];
    const bindLayer = (
      node: HTMLElement | null,
      x: MotionValue<number>,
      y: MotionValue<number>,
      strength: { x: number; y: number },
    ) => {
      if (!node) return;
      subscriptions.push(
        x.on("change", (value) =>
          node.style.setProperty("--px", `${value * strength.x}px`),
        ),
        y.on("change", (value) =>
          node.style.setProperty("--py", `${value * strength.y}px`),
        ),
      );
    };

    bindLayer(headingRef.current, headingX, headingY, TEXT_MOTION.heading);
    bindLayer(
      paragraphRef.current,
      paragraphX,
      paragraphY,
      TEXT_MOTION.paragraph,
    );
    bindLayer(buttonRef.current, textButtonX, textButtonY, TEXT_MOTION.button);

    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [
    desktop,
    headingX,
    headingY,
    paragraphX,
    paragraphY,
    reducedMotion,
    textButtonX,
    textButtonY,
  ]);

  const moveButton = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!desktop || reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(dx, dy);
    const strength = Math.min(1, Math.max(0, 60 - distance) / 60) * 8;
    rawButtonX.set(distance < 60 ? (dx / (distance || 1)) * strength : 0);
    rawButtonY.set(distance < 60 ? (dy / (distance || 1)) * strength : 0);
  };

  return (
    <motion.div
      className={`venue-intro reveal-item reveal-after-cards${desktop && !reducedMotion ? " nv-motion-active" : ""}`}
      ref={introRef}
      initial={reducedMotion ? { opacity: 0 } : undefined}
      animate={
        reducedMotion || forceVisible
          ? { opacity: 1 }
          : undefined
      }
      transition={{ opacity: { duration: 0.3 } }}
      style={
        desktop && !reducedMotion
          ? { rotateX, rotateY, transformStyle: "preserve-3d" }
          : undefined
      }
    >
      <motion.h2
        ref={headingRef}
        aria-label={navigateHeading}
        initial={reducedMotion ? { opacity: 0 } : undefined}
        animate={reducedMotion ? { opacity: 1 } : undefined}
        transition={{ duration: 0.3 }}
      >
        {navigateHeading.split(" ").map((word, index) => (
          <Fragment key={word}>
            <span
              style={{
                display: "inline-block",
                overflow: "hidden",
                paddingBottom: "0.12em",
                marginBottom: "-0.12em",
              }}
            >
              <motion.span
                aria-hidden="true"
                initial={reducedMotion ? { opacity: 0 } : { y: "105%" }}
                whileInView={
                  reducedMotion || forceVisible ? undefined : { y: "0%" }
                }
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : forceVisible
                      ? { y: "0%" }
                      : undefined
                }
                viewport={{ once: true, amount: 0.6 }}
                transition={
                  reducedMotion
                    ? { opacity: { duration: 0.3 } }
                    : {
                        type: "spring",
                        stiffness: 180,
                        damping: 22,
                        delay: index * 0.06,
                      }
                }
              >
                {word}
              </motion.span>
            </span>
            {index < navigateHeading.split(" ").length - 1 ? " " : null}
          </Fragment>
        ))}
      </motion.h2>
      <motion.p
        ref={paragraphRef}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        whileInView={
          reducedMotion || forceVisible
            ? undefined
            : { opacity: 1, y: 0 }
        }
        animate={
          reducedMotion || forceVisible ? { opacity: 1, y: 0 } : undefined
        }
        viewport={{ once: true, amount: 0.6 }}
        transition={
          reducedMotion
            ? { opacity: { duration: 0.3 } }
            : {
                type: "spring",
                stiffness: 180,
                damping: 22,
                delay: 0.25,
              }
        }
      >
        <span>
          From stadiums to airports, malls, and train stations, etc fplaces
        </span>
        <span className="nv-break">
          {" "}helps you find your way faster and stay connected to what&apos;s
        </span>
        <span className="nv-break"> happening around you.</span>
      </motion.p>
      <motion.a
        ref={buttonRef}
        className="explore-venues-button"
        href="/venues#venue-types"
        whileHover={desktop && !reducedMotion ? "hover" : undefined}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        whileInView={
          reducedMotion || forceVisible
            ? undefined
            : { opacity: 1, y: 0 }
        }
        animate={
          reducedMotion || forceVisible ? { opacity: 1, y: 0 } : undefined
        }
        viewport={{ once: true, amount: 0.6 }}
        transition={
          reducedMotion
            ? { opacity: { duration: 0.3 } }
            : {
                type: "spring",
                stiffness: 180,
                damping: 22,
                delay: 0.4,
              }
        }
        whileTap={!reducedMotion ? { scale: 0.97 } : undefined}
        onPointerMove={moveButton}
        onPointerLeave={() => {
          rawButtonX.set(0);
          rawButtonY.set(0);
        }}
        style={
          desktop && !reducedMotion
            ? { x: buttonX, y: buttonY, willChange: "transform" }
            : undefined
        }
      >
        Explore more venues
        <motion.span
          className="venue-link-arrow"
          aria-hidden="true"
          variants={{ hover: { x: 4, y: -4 } }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        />
      </motion.a>
    </motion.div>
  );
}

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
  const reducedMotion = Boolean(useReducedMotion());
  const [desktopMotion, setDesktopMotion] = useState(false);
  const [forceVenueVisible, setForceVenueVisible] = useState(false);
  const rawPointerX = useMotionValue(0);
  const rawPointerY = useMotionValue(0);
  const introRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const rowLightRef = useRef<HTMLSpanElement>(null);
  const lightState = useRef<VenueLightState>({
    frame: null,
    pulseTimeout: null,
    pointerInside: false,
    touchPulse: false,
    initialized: false,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    intensities: new WeakMap(),
  });
  const mx = useSpring(rawPointerX, { stiffness: 90, damping: 20, mass: 0.6 });
  const my = useSpring(rawPointerY, { stiffness: 90, damping: 20, mass: 0.6 });
  useEffect(() => {
    const desktopQuery = window.matchMedia(
      "(min-width: 1025px) and (pointer: fine)",
    );
    const updateDesktop = () =>
      setDesktopMotion(desktopQuery.matches && !reducedMotion);
    updateDesktop();
    desktopQuery.addEventListener("change", updateDesktop);
    return () => desktopQuery.removeEventListener("change", updateDesktop);
  }, [reducedMotion]);

  useEffect(() => {
    const fallback = window.setTimeout(() => setForceVenueVisible(true), 2500);
    return () => window.clearTimeout(fallback);
  }, []);

  useEffect(() => {
    const state = lightState.current;
    return () => {
      const { frame } = state;
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (state.pulseTimeout !== null) window.clearTimeout(state.pulseTimeout);
      state.frame = null;
      state.pulseTimeout = null;
    };
  }, []);

  useEffect(() => {
    if (desktopMotion && !reducedMotion) return;
    const state = lightState.current;
    if (state.frame !== null) window.cancelAnimationFrame(state.frame);
    if (state.pulseTimeout !== null) window.clearTimeout(state.pulseTimeout);
    state.frame = null;
    state.pulseTimeout = null;
    state.pointerInside = false;
    state.touchPulse = false;
    state.initialized = false;
    state.x = 0;
    state.y = 0;
    state.targetX = 0;
    state.targetY = 0;
    state.intensities = new WeakMap();
    rowRef.current?.style.setProperty("--light-opacity", "0");
    rowRef.current
      ?.querySelectorAll<HTMLElement>(".venue-card")
      .forEach((card) => {
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
        card.style.removeProperty("--g");
      });
    rawPointerX.set(0);
    rawPointerY.set(0);
  }, [desktopMotion, rawPointerX, rawPointerY, reducedMotion]);

  const animateVenueLight = () => {
    const state = lightState.current;
    state.frame = null;
    if ((!desktopMotion && !state.touchPulse) || reducedMotion) return;

    const row = rowRef.current;
    const glow = rowLightRef.current;
    if (!row || !glow) return;

    state.x += (state.targetX - state.x) * LIGHT.follow;
    state.y += (state.targetY - state.y) * LIGHT.follow;
    const rowBounds = row.getBoundingClientRect();
    const pointerX = rowBounds.left + state.x;
    const pointerY = rowBounds.top + state.y;
    const cards = Array.from(
      row.querySelectorAll<HTMLElement>(".venue-card"),
    ).map((element) => ({ element, bounds: element.getBoundingClientRect() }));

    const nextCardValues = cards.map(({ element, bounds }) => {
      const distanceX = Math.max(bounds.left - pointerX, 0, pointerX - bounds.right);
      const distanceY = Math.max(bounds.top - pointerY, 0, pointerY - bounds.bottom);
      const distance = Math.hypot(distanceX, distanceY);
      const target = state.pointerInside
        ? distance === 0
          ? 1
          : Math.max(0, 1 - distance / LIGHT.reach)
        : 0;
      const current = state.intensities.get(element) ?? 0;
      const value = current + (target - current) * LIGHT.follow;
      return {
        element,
        x: pointerX - bounds.left,
        y: pointerY - bounds.top,
        value: Math.abs(target - value) < 0.001 ? target : value,
        settled: Math.abs(target - value) < 0.001,
      };
    });

    glow.style.setProperty("--lx", `${state.x}px`);
    glow.style.setProperty("--ly", `${state.y}px`);
    nextCardValues.forEach(({ element, x, y, value }) => {
      state.intensities.set(element, value);
      element.style.setProperty("--mx", `${x}px`);
      element.style.setProperty("--my", `${y}px`);
      element.style.setProperty("--g", `${value}`);
    });

    const settled =
      Math.abs(state.targetX - state.x) < 0.1 &&
      Math.abs(state.targetY - state.y) < 0.1 &&
      nextCardValues.every(({ settled: cardSettled }) => cardSettled);
    if (!settled) {
      state.frame = window.requestAnimationFrame(animateVenueLight);
    } else if (!state.pointerInside) {
      state.touchPulse = false;
    }
  };

  const scheduleVenueLight = () => {
    const state = lightState.current;
    if (state.frame === null) {
      state.frame = window.requestAnimationFrame(animateVenueLight);
    }
  };

  const moveVenueRow = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!desktopMotion || reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    rawPointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    rawPointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    const state = lightState.current;
    state.targetX = event.clientX - bounds.left;
    state.targetY = event.clientY - bounds.top;
    if (!state.initialized) {
      state.x = state.targetX;
      state.y = state.targetY;
      state.initialized = true;
    }
    state.pointerInside = true;
    rowRef.current?.style.setProperty("--light-opacity", "1");
    scheduleVenueLight();
  };

  const leaveVenueRow = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!desktopMotion || reducedMotion || event.pointerType !== "mouse") return;
    rawPointerX.set(0);
    rawPointerY.set(0);
    lightState.current.pointerInside = false;
    rowRef.current?.style.setProperty("--light-opacity", "0");
    scheduleVenueLight();
  };

  const pulseVenueLight = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (desktopMotion || reducedMotion || event.pointerType !== "touch") return;
    const row = rowRef.current;
    if (!row || !rowLightRef.current) return;
    const bounds = row.getBoundingClientRect();
    const state = lightState.current;
    if (state.pulseTimeout !== null) window.clearTimeout(state.pulseTimeout);
    state.targetX = event.clientX - bounds.left;
    state.targetY = event.clientY - bounds.top;
    state.x = state.targetX;
    state.y = state.targetY;
    state.initialized = true;
    state.pointerInside = true;
    state.touchPulse = true;
    row.style.setProperty("--light-opacity", "1");
    scheduleVenueLight();
    state.pulseTimeout = window.setTimeout(() => {
      state.pulseTimeout = null;
      state.pointerInside = false;
      row.style.setProperty("--light-opacity", "0");
      scheduleVenueLight();
    }, 420);
  };

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(
      "[data-reveal-item]",
    );

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
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

    if (typeof IntersectionObserver === "undefined") {
      feedWindow.classList.add("is-in-view");
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
            </div>
          </div>

          <figure className="hero-visual">
            <div className="hero-media">
              <span className="hero-glow" aria-hidden="true" />
              <div className="visual-frame">
                <Image
                  src="/img/navigation.webp"
                  alt="fplaces indoor navigation guiding visitors through an airport"
                  fill
                  priority
                  sizes="(max-width: 820px) calc(100vw - clamp(48px, 10.84vw, 88px)), (max-width: 1180px) 650px, (max-width: 1800px) 50vw, 900px"
                  fetchPriority="high"
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
          src="/img/body.webp"
          alt="Friends following fplaces indoor navigation together at a stadium"
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
        <motion.div
          className="venue-section-inner venue-layout"
          ref={rowRef}
          style={
            {
              perspective: desktopMotion && !reducedMotion ? 1200 : undefined,
              "--l-size": `${LIGHT.size}px`,
              "--l-strength": LIGHT.strength,
              "--l-spot": LIGHT.spotlight,
              "--l-edge": LIGHT.edge,
              "--light-opacity": 0,
            } as CSSProperties
          }
          onPointerMove={moveVenueRow}
          onPointerDown={pulseVenueLight}
          onPointerLeave={leaveVenueRow}
        >
          <span
            ref={rowLightRef}
            className="venue-row-light"
            aria-hidden="true"
          />
          <motion.div
            className="venue-grid"
            aria-label="Types of venues"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.11 } },
            }}
          >
            {venueCategories.map((category, index) => (
              <VenueMotionCard
                key={category.title}
                category={category}
                index={index}
                desktop={desktopMotion}
                reducedMotion={reducedMotion}
                forceVisible={forceVenueVisible}
                mx={mx}
                my={my}
              />
            ))}
          </motion.div>

          <NavigateVenueIntro
            desktop={desktopMotion}
            reducedMotion={reducedMotion}
            forceVisible={forceVenueVisible}
            rawPointerX={rawPointerX}
            rawPointerY={rawPointerY}
            introRef={introRef}
          />
        </motion.div>
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
                src="/img/Frame 208.webp"
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
                src="/img/Frame 209.webp"
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
                src="/img/Frame 254.webp"
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
