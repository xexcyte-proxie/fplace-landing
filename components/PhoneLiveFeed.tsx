"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  FEED_TIMING,
  scaleFeedTiming,
  useFeedScript,
  type FeedPost,
} from "@/lib/useFeedScript";

const MOTION = {
  spring: { type: "spring" as const, stiffness: 320, damping: 28, mass: 0.9 },
  layoutSpring: { type: "spring" as const, stiffness: 260, damping: 26, mass: 0.9 },
  soft: { type: "spring" as const, stiffness: 140, damping: 22 },
  ease: [0.22, 1, 0.36, 1] as const,
  offsets: { desktop: 28, mobile: 18 },
  stagger: 0.035,
  partDuration: 0.35,
  countDuration: 0.28,
  colorDuration: 0.25,
  iconDuration: 0.35,
  flagPulseDuration: 0.45,
  iconPeakTime: 0.45,
  countRollOffset: { enter: "100%", exit: "-100%" },
  bannerDuration: FEED_TIMING.FLAG_BANNER_MS / 1000,
  bannerBarDuration: 0.5,
  bannerOffset: -6,
  entryScale: 0.975,
  entryBlur: { desktop: 6, mobile: 4 },
  exitOffset: -8,
  exitBlur: 4,
  avatarScale: 0.8,
  labelOffset: -6,
  messageOffset: 6,
  chipScale: 0.85,
  iconScale: 1.18,
  flagScale: 1.12,
  tiltSpring: { stiffness: 120, damping: 20 },
  tiltMax: { x: 3, y: 4 },
  perspective: 900,
  clearFilter: "blur(0px)",
  feedMask:
    "linear-gradient(to bottom, transparent 0%, #000 calc(var(--u) * 20), #000 100%)",
  clearDuration: scaleFeedTiming(FEED_TIMING.CLEAR_MS) / 1000,
} as const;

const ARRIVAL = {
  sweep: {
    desktopDuration: 1.1,
    mobileDuration: 0.9,
    delay: 0.15,
    width: "45%",
    fromX: "-110%",
    toX: "250%",
    alpha: 0.14,
  },
  glow: {
    fadeInDuration: 0.5,
    fadeOutDuration: 1.6,
    ringAlpha: 0.22,
    desktopAlpha: 0.1,
    mobileAlpha: 0.08,
  },
  reducedDuration: 1,
  ease: [0.22, 1, 0.36, 1] as const,
  orangeRgb: "244,119,50",
  redRgb: "255,56,60",
} as const;

const styles = new Proxy({} as Record<string, string>, {
  get: (_target, property: string | symbol) =>
    typeof property === "string" ? `plf-${property}` : undefined,
});

function CountSlot({
  value,
  className,
  reducedMotion,
}: {
  value: number;
  className: string;
  reducedMotion: boolean;
}) {
  const slotStyle = {
    position: "absolute" as const,
    left: "calc(100% + calc(var(--u) * 2.14))",
    top: "50%",
    transform: "translateY(-50%)",
    width: "max-content",
    minWidth: 0,
    flex: "none",
    fontVariantNumeric: "tabular-nums" as const,
    textAlign: "left" as const,
    display: "inline-flex",
    alignItems: "center",
    overflow: "hidden",
    height: "1.25em",
    whiteSpace: "nowrap" as const,
    opacity: value > 0 ? 1 : 0,
    pointerEvents: "none" as const,
  };

  return (
    <span className={className} style={slotStyle}>
      {value > 0 ? (
        reducedMotion ? (
          value
        ) : (
          <AnimatePresence mode="sync">
            <motion.span
              key={value}
              initial={{ y: MOTION.countRollOffset.enter, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: MOTION.countRollOffset.exit, opacity: 0 }}
              transition={{ duration: MOTION.countDuration, ease: MOTION.ease }}
            >
              {value}
            </motion.span>
          </AnimatePresence>
        )
      ) : (
        <small style={{ visibility: "hidden" }}>0</small>
      )}
    </span>
  );
}

function PhonePost({
  post,
  reducedMotion,
  isMobile,
}: {
  post: FeedPost;
  reducedMotion: boolean;
  isMobile: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [arrivalStarted, setArrivalStarted] = useState(false);
  const [isArrivalAnimating, setIsArrivalAnimating] = useState(false);
  const commentIconControls = useAnimationControls();
  const upvoteIconControls = useAnimationControls();
  const flagIconControls = useAnimationControls();
  const entryOffset = MOTION.offsets[isMobile ? "mobile" : "desktop"];
  const arrivalTone = post.story === "flagged" ? "red" : "orange";
  const arrivalRgb =
    arrivalTone === "red" ? ARRIVAL.redRgb : ARRIVAL.orangeRgb;
  const arrivalSweep = `rgba(${arrivalRgb},${ARRIVAL.sweep.alpha})`;
  const arrivalRing = `rgba(${arrivalRgb},${ARRIVAL.glow.ringAlpha})`;
  const glowAlpha = isMobile
    ? ARRIVAL.glow.mobileAlpha
    : ARRIVAL.glow.desktopAlpha;
  const glowDuration =
    ARRIVAL.glow.fadeInDuration + ARRIVAL.glow.fadeOutDuration;

  useEffect(() => {
    const controls = [
      [commentIconControls, post.comments, false],
      [upvoteIconControls, post.upvotes, false],
      [flagIconControls, post.flagCount, true],
    ] as const;
    controls.forEach(([iconControls, count, isFlag]) => {
      if (!reducedMotion && count > 0) {
        const transition = {
          type: "tween" as const,
          duration: isFlag ? MOTION.flagPulseDuration : MOTION.iconDuration,
          ease: "easeInOut" as const,
          times: [0, MOTION.iconPeakTime, 1],
        };
        void iconControls.start({
          scale: isFlag
            ? [1, MOTION.flagScale, 1]
            : [1, MOTION.iconScale, 1],
          transition,
        }).catch(() => {});
      } else {
        iconControls.set({ scale: 1 });
      }
    });
  }, [
    commentIconControls,
    flagIconControls,
    post.comments,
    post.flagCount,
    post.upvotes,
    reducedMotion,
    upvoteIconControls,
  ]);

  return (
    <motion.article
      className={styles.post}
      layout={reducedMotion ? false : "position"}
      initial={
        reducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: entryOffset,
              scale: MOTION.entryScale,
              filter: `blur(${MOTION.entryBlur[isMobile ? "mobile" : "desktop"]}px)`,
            }
      }
      animate={
        reducedMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: MOTION.clearFilter,
            }
      }
      transition={{
        ...MOTION.spring,
        y: MOTION.spring,
        scale: MOTION.spring,
        layout: MOTION.layoutSpring,
        opacity: { duration: MOTION.partDuration, ease: MOTION.ease },
        filter: { duration: MOTION.partDuration, ease: MOTION.ease },
      }}
      style={{
        willChange: isAnimating
          ? "transform, opacity, filter"
          : undefined,
        pointerEvents: "none",
        position: "relative",
        overflow: "visible",
        borderRadius: "inherit",
        isolation: "isolate",
      }}
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => {
        setIsAnimating(false);
        if (!arrivalStarted) {
          setArrivalStarted(true);
          setIsArrivalAnimating(true);
        }
      }}
    >
      {!reducedMotion && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            zIndex: 0,
            inset: 0,
            overflow: "hidden",
            borderRadius: "inherit",
            pointerEvents: "none",
          }}
        >
          <motion.span
            aria-hidden="true"
            initial={{ x: ARRIVAL.sweep.fromX, opacity: 0 }}
            animate={
              isArrivalAnimating
                ? { x: ARRIVAL.sweep.toX, opacity: [0, 1, 0] }
                : { x: ARRIVAL.sweep.fromX, opacity: 0 }
            }
            transition={{
              duration: ARRIVAL.sweep[isMobile ? "mobileDuration" : "desktopDuration"],
              delay: ARRIVAL.sweep.delay,
              ease: ARRIVAL.ease,
            }}
            style={{
              position: "absolute",
              zIndex: 0,
              insetBlock: 0,
              left: 0,
              width: ARRIVAL.sweep.width,
              background: `linear-gradient(105deg, transparent, ${arrivalSweep}, transparent)`,
              pointerEvents: "none",
              borderRadius: "inherit",
              willChange: isArrivalAnimating ? "transform, opacity" : undefined,
            }}
          />
        </span>
      )}
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={
          isArrivalAnimating
            ? { opacity: [0, 1, 0] }
            : { opacity: 0 }
        }
        transition={{
          duration: reducedMotion ? ARRIVAL.reducedDuration : glowDuration,
          times: reducedMotion
            ? [0, 0.5, 1]
            : [0, ARRIVAL.glow.fadeInDuration / glowDuration, 1],
          ease: reducedMotion ? "easeInOut" : "easeInOut",
        }}
        onAnimationComplete={() => {
          if (reducedMotion && isArrivalAnimating) {
            setIsArrivalAnimating(false);
          }
        }}
        style={{
          position: "absolute",
          zIndex: 0,
          inset: 0,
          border: `1px solid ${arrivalRing}`,
          borderRadius: "inherit",
          boxShadow: reducedMotion
            ? "none"
            : `0 6px 20px rgba(${arrivalRgb},${glowAlpha})`,
          pointerEvents: "none",
          willChange: isArrivalAnimating ? "opacity" : undefined,
        }}
      />
      <div className={styles.postMeta} style={{ position: "relative", zIndex: 1 }}>
        <div
          className={styles.postIdentity}
          style={{
            minWidth: 0,
            maxWidth: "calc(100% - calc(var(--u) * 65.68))",
            flex: "0 1 auto",
            gap: "0.5em",
          }}
        >
          <motion.span
            className={`${styles.postAvatar} ${styles[`avatar${post.avatar}`]}`}
            initial={reducedMotion ? false : { scale: MOTION.avatarScale }}
            animate={{ scale: 1 }}
            transition={{
              duration: MOTION.partDuration,
              ease: MOTION.ease,
              delay: MOTION.stagger,
            }}
          >
            {post.initials}
          </motion.span>
          <motion.span
            className={styles.postHandle}
            style={{
              minWidth: 0,
              flex: "0 1 auto",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.35,
              paddingBlock: "0.22em",
              marginBlock: "-0.22em",
            }}
            initial={
              reducedMotion
                ? false
                : { opacity: 0, x: MOTION.labelOffset }
            }
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: MOTION.partDuration,
              ease: MOTION.ease,
              delay: MOTION.stagger * 2,
            }}
          >
            {post.handle}
          </motion.span>
          <AnimatePresence mode="wait">
            <motion.span
              key={post.time}
              className={styles.postTime}
              style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, x: MOTION.labelOffset }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: MOTION.labelOffset }
              }
              transition={{
                duration: reducedMotion ? 0 : MOTION.partDuration,
                ease: MOTION.ease,
                delay: MOTION.stagger * 3,
              }}
            >
              {post.time}
            </motion.span>
          </AnimatePresence>
        </div>
        <motion.span
          className={styles.postActions}
          style={{
            position: "absolute",
            zIndex: 2,
            top: "50%",
            right: "calc(var(--u) * 11.24)",
            width: "calc(var(--u) * 52.44)",
            height: "calc(var(--u) * 17.55)",
            display: "block",
            flex: "none",
            margin: 0,
            gap: 0,
            transform: "translateY(-50%)",
          }}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: MOTION.partDuration,
            ease: MOTION.ease,
            delay: MOTION.stagger * 6,
          }}
        >
          <span
            className={styles.postAction}
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              width: "calc(var(--u) * 10.48)",
              height: "calc(var(--u) * 10.48)",
              display: "block",
              flex: "none",
              gap: 0,
              transform: "translateY(-50%)",
            }}
          >
            <motion.span
              className={`${styles.commentIcon} ${post.comments > 0 ? styles.iconTeal : styles.iconGrey}`}
              animate={commentIconControls}
              style={{
                width: "100%",
                height: "100%",
                transition: reducedMotion
                  ? "none"
                  : `background-color ${MOTION.colorDuration}s`,
              }}
            />
            <CountSlot
              value={post.comments}
              className={styles.countTeal}
              reducedMotion={reducedMotion}
            />
          </span>
          <span
            className={styles.postAction}
            style={{
              position: "absolute",
              left: "calc(var(--u) * 19.18)",
              top: "50%",
              width: "calc(var(--u) * 14.13)",
              height: "calc(var(--u) * 14.13)",
              display: "block",
              flex: "none",
              gap: 0,
              transform: "translateY(-50%)",
            }}
          >
            <motion.span
              className={`${styles.upvoteIcon} ${post.upvotes > 0 ? styles.iconOrange : styles.iconGrey}`}
              animate={upvoteIconControls}
              style={{
                width: "100%",
                height: "100%",
                WebkitMaskImage: `url("${post.upvotes > 0 ? "/icons/upvote-fill.svg" : "/icons/upvote-icon.svg"}")`,
                maskImage: `url("${post.upvotes > 0 ? "/icons/upvote-fill.svg" : "/icons/upvote-icon.svg"}")`,
                transition: reducedMotion
                  ? "none"
                  : `background-color ${MOTION.colorDuration}s`,
              }}
            />
            <CountSlot
              value={post.upvotes}
              className={styles.countOrange}
              reducedMotion={reducedMotion}
            />
          </span>
          <span
            className={styles.postAction}
            style={{
              position: "absolute",
              left: "calc(var(--u) * 41.96)",
              top: "50%",
              width: "calc(var(--u) * 10.48)",
              height: "calc(var(--u) * 10.48)",
              display: "block",
              flex: "none",
              gap: 0,
              transform: "translateY(-50%)",
            }}
          >
            <motion.span
              className={`${styles.flagIcon} ${post.flagCount > 0 ? styles.iconRed : styles.iconGrey}`}
              animate={flagIconControls}
              style={{
                width: "100%",
                height: "100%",
                transition: reducedMotion
                  ? "none"
                  : `background-color ${MOTION.colorDuration}s`,
              }}
            />
            <CountSlot
              value={post.flagCount}
              className={styles.countRed}
              reducedMotion={reducedMotion}
            />
          </span>
        </motion.span>
      </div>
      <div className={styles.postBody} style={{ position: "relative", zIndex: 1 }}>
        <motion.p
          className={styles.postMessage}
          initial={reducedMotion ? false : { opacity: 0, y: MOTION.messageOffset }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: MOTION.partDuration,
            ease: MOTION.ease,
            delay: MOTION.stagger * 4,
          }}
        >
          {post.message}
        </motion.p>
        <AnimatePresence mode="wait">
          <motion.span
            key={post.tag}
            className={`${styles.chip} ${styles[`chip${post.tag}`]}`}
            initial={
              reducedMotion
                ? false
                : { opacity: 0, scale: MOTION.chipScale }
            }
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: MOTION.chipScale }}
            transition={
              reducedMotion
                ? { duration: MOTION.partDuration, ease: MOTION.ease }
                : { ...MOTION.soft, delay: MOTION.stagger * 5 }
            }
          >
            {post.tag}
          </motion.span>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {post.flagged && (
          <motion.div
            className={styles.flagBanner}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0, y: MOTION.bannerOffset }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { height: "auto", opacity: 1, y: 0 }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0, y: MOTION.bannerOffset }
            }
            transition={
              reducedMotion
                ? { duration: MOTION.partDuration, ease: MOTION.ease }
                : {
                    height: MOTION.soft,
                    opacity: { duration: MOTION.partDuration, ease: MOTION.ease },
                    y: { duration: MOTION.partDuration, ease: MOTION.ease },
                  }
            }
            style={{
              overflow: "hidden",
              animation: "none",
              gridTemplateRows: "none",
              position: "relative",
              zIndex: 1,
            }}
          >
            <motion.span
              aria-hidden="true"
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: MOTION.bannerBarDuration,
                ease: MOTION.ease,
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "calc(var(--u) * 1.5)",
                backgroundColor: "#ff383c",
                transformOrigin: "left",
                pointerEvents: "none",
              }}
            />
            <span className={styles.flagBannerInner}>
              <span className={styles.flagBannerIcon} />
              This post has been flagged for {post.flagReason}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function PhoneLiveFeed() {
  const phoneRef = useRef<HTMLDivElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const rotateX = useSpring(useMotionValue(0), MOTION.tiltSpring);
  const rotateY = useSpring(useMotionValue(0), MOTION.tiltSpring);
  const [isInView, setIsInView] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { posts, isExiting, cycle } = useFeedScript(
    isInView && isDocumentVisible,
  );

  useEffect(() => {
    const phone = phoneRef.current;
    if (!phone) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.4),
      { threshold: 0.4 },
    );
    observer.observe(phone);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateMobile = () => setIsMobile(mediaQuery.matches);
    updateMobile();
    mediaQuery.addEventListener("change", updateMobile);
    return () => mediaQuery.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    const phone = phoneRef.current;
    if (!phone || reducedMotion || isMobile) return;

    const hoverQuery = window.matchMedia(
      "(min-width: 769px) and (hover: hover) and (pointer: fine)",
    );
    if (!hoverQuery.matches) return;

    let frame: number | null = null;
    let nextRotateX = 0;
    let nextRotateY = 0;

    const scheduleTilt = (event: PointerEvent) => {
      const bounds = phone.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      nextRotateX = -y * MOTION.tiltMax.x;
      nextRotateY = x * MOTION.tiltMax.y;

      if (frame === null) {
        frame = window.requestAnimationFrame(() => {
          frame = null;
          rotateX.set(nextRotateX);
          rotateY.set(nextRotateY);
        });
      }
    };

    const resetTilt = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      rotateX.set(0);
      rotateY.set(0);
    };

    phone.addEventListener("pointermove", scheduleTilt);
    phone.addEventListener("pointerleave", resetTilt);

    return () => {
      phone.removeEventListener("pointermove", scheduleTilt);
      phone.removeEventListener("pointerleave", resetTilt);
      resetTilt();
    };
  }, [isMobile, reducedMotion, rotateX, rotateY]);

  useEffect(() => {
    const updateVisibility = () => {
      const visible = document.visibilityState === "visible";
      setIsDocumentVisible(visible);
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return (
    <motion.div
      className={styles.phone}
      ref={phoneRef}
      aria-hidden="true"
      inert
      style={{
        rotateX,
        rotateY,
        transformPerspective: MOTION.perspective,
        maxWidth: "100%",
        marginInline: "auto",
      }}
    >
      <Image
        className={styles.frame}
        src="/icons/iphone.svg"
        priority
        alt="fplaces live venue feed displayed on a phone"
        fill
        sizes="(max-width: 768px) 86vw, 340px"
        unoptimized
      />
      <div className={styles.screen}>
        <div className={styles.content}>
        <div className={styles.statusBar}>
          <span className={styles.statusTime}>9:41</span>
          <span className={styles.dynamicIsland} aria-hidden="true" />
          <Image
            className={styles.statusIcons}
            src="/icons/Status bar.svg"
            alt=""
            width={62}
            height={62}
            aria-hidden="true"
          />
        </div>
        <header className={styles.appHeader}>
          <Image
            src="/img/fplace.png"
            alt=""
            width={196}
            height={50}
            className={styles.wordmark}
          />
          <div className={styles.headerActions}>
            <Image
              src="/icons/tabler-icon-search.svg"
              alt=""
              width={15}
              height={15}
            />
            <Image
              src="/icons/tabler-icon-bell.svg"
              alt=""
              width={15}
              height={15}
            />
            <Image
              src="/icons/Ellipse%2027.svg"
              alt=""
              width={24}
              height={24}
              className={styles.userAvatar}
            />
          </div>
        </header>
        <div className={styles.venueSelector}>
          <Image
            src="/icons/berver%20stadium.svg"
            alt=""
            width={28}
            height={28}
            className={styles.venueIcon}
            unoptimized
          />
          <span className={styles.venueDetails}>
            <b>Beaver Stadium</b>
            <small><i /> Live now</small>
          </span>
          <span className={styles.chevron} aria-hidden="true" />
        </div>
        <nav className={styles.tabs} aria-label="Feed categories">
          <span className={styles.activeTab}>
            <Image
              src="/icons/Frame%20279.svg"
              alt="Live Feed"
              width={64}
              height={23}
              unoptimized
            />
          </span>
          <span className={styles.categoryTab}>
            <Image
              src="/icons/Frame%20281.svg"
              alt="Food"
              width={36}
              height={24}
              unoptimized
            />
          </span>
          <span className={styles.categoryTab}>
            <Image
              src="/icons/Frame%20300.svg"
              alt="Hype"
              width={36}
              height={24}
              unoptimized
            />
          </span>
          <span className={styles.lineTab}>
            <Image
              src="/icons/Frame%20301.svg"
              alt="Lines"
              width={36}
              height={24}
              unoptimized
            />
          </span>
          <span className={styles.filter}>
            <Image src="/icons/Group.svg" alt="" width={14} height={13} style={{ width: "auto" }} />
          </span>
        </nav>
        <div
          className={styles.postArea}
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            marginTop: 0,
            paddingBottom: "calc(var(--u) * 10)",
            boxSizing: "border-box",
          }}
        >
          <AnimatePresence initial={false} mode="wait">
            {!isExiting && posts.length > 0 ? (
              <motion.div
                key={`story-${cycle}`}
                className={styles.postList}
                initial={false}
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, filter: MOTION.clearFilter }
                }
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: MOTION.exitOffset,
                        filter: `blur(${MOTION.exitBlur}px)`,
                      }
                }
                transition={{
                  duration: MOTION.clearDuration,
                  ease: MOTION.ease,
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  rowGap: "calc(var(--u) * 8)",
                  WebkitMaskImage: MOTION.feedMask,
                  maskImage: MOTION.feedMask,
                }}
              >
                {posts.map((post) => (
                <PhonePost
                  key={post.id}
                  post={post}
                  reducedMotion={reducedMotion}
                  isMobile={isMobile}
                />
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className={styles.composer}>
          <div className={styles.composerRow}>
            <span className={styles.addButton}>+</span>
            <span className={styles.input}>Write message</span>
            <span className={styles.sendButton}>
              <Image src="/icons/Group 17.svg" alt="" width={20} height={20} />
            </span>
          </div>
          <small className={styles.counter}>0 / 140</small>
        </div>
        <nav className={styles.bottomNav} aria-label="App navigation">
          <span>
            <Image
              src="/icons/ant-design_home-outlined.svg"
              alt=""
              width={15}
              height={15}
            />
            Home
          </span>
          <span>
            <Image
              src="/icons/Vector (1).svg"
              alt=""
              width={12}
              height={12}
              className={styles.navIcon}
            />
            Navigate
          </span>
          <span className={styles.selectedNav}>
            <Image
              src="/icons/ci_chat-conversation.svg"
              alt=""
              width={16}
              height={16}
              className={styles.navIcon}
            />
            Social
          </span>
          <span>
            <Image
              src="/icons/fluent_search-20-filled.svg"
              alt=""
              width={13}
              height={13}
            />
            Places
          </span>
        </nav>
        </div>
      </div>
    </motion.div>
  );
}
