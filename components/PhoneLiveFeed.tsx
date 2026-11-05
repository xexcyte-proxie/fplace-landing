"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  FEED_TIMING,
  useFeedScript,
  type FeedPost,
} from "@/lib/useFeedScript";

const styles = new Proxy({} as Record<string, string>, {
  get: (_target, property: string | symbol) =>
    typeof property === "string" ? `plf-${property}` : undefined,
});

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
  const commentIconControls = useAnimationControls();
  const upvoteIconControls = useAnimationControls();
  const flagIconControls = useAnimationControls();
  const countStyle = {
    width: "2ch",
    minWidth: "2ch",
    flex: "0 0 2ch",
    marginLeft: "0.25em",
    fontVariantNumeric: "tabular-nums" as const,
    textAlign: "left" as const,
  };

  useEffect(() => {
    const controls = [
      [commentIconControls, post.comments],
      [upvoteIconControls, post.upvotes],
      [flagIconControls, post.flagCount],
    ] as const;
    controls.forEach(([iconControls, count]) => {
      if (!reducedMotion && count > 0) {
        const spring = {
          transition: {
            type: "spring" as const,
            stiffness: FEED_TIMING.MOTION.ICON_SPRING.STIFFNESS,
            damping: FEED_TIMING.MOTION.ICON_SPRING.DAMPING,
            mass: FEED_TIMING.MOTION.ICON_SPRING.MASS,
          },
        };
        void iconControls
          .start({ scale: 1.28, ...spring })
          .then(() => iconControls.start({ scale: 1, ...spring }));
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
              y: isMobile ? -20 : -28,
              scale: 0.96,
              ...(isMobile ? {} : { filter: "blur(6px)" }),
              boxShadow: "0 0 0 2px rgba(244,119,50,0.35)",
            }
      }
      animate={
        reducedMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              ...(isMobile ? {} : { filter: "blur(0px)" }),
              boxShadow: "0 0 0 0px rgba(244,119,50,0)",
            }
      }
      exit={{
        opacity: 0,
        ...(reducedMotion
          ? {}
          : { scale: 0.96, ...(!isMobile ? { filter: "blur(4px)" } : {}) }),
        transition: { duration: FEED_TIMING.MOTION.EXIT / 1000, ease: "easeOut" },
      }}
      transition={{
        y: {
          type: "spring",
          stiffness: FEED_TIMING.MOTION.ENTRY_SPRING.STIFFNESS,
          damping: FEED_TIMING.MOTION.ENTRY_SPRING.DAMPING,
          mass: FEED_TIMING.MOTION.ENTRY_SPRING.MASS,
          delay: reducedMotion ? 0 : FEED_TIMING.MOTION.ENTRY_DELAY / 1000,
        },
        scale: {
          type: "spring",
          stiffness: FEED_TIMING.MOTION.ENTRY_SPRING.STIFFNESS,
          damping: FEED_TIMING.MOTION.ENTRY_SPRING.DAMPING,
          mass: FEED_TIMING.MOTION.ENTRY_SPRING.MASS,
          delay: reducedMotion ? 0 : FEED_TIMING.MOTION.ENTRY_DELAY / 1000,
        },
        opacity: {
          duration: FEED_TIMING.MOTION.ENTRY_OPACITY / 1000,
          delay: reducedMotion ? 0 : FEED_TIMING.MOTION.ENTRY_DELAY / 1000,
        },
        filter: {
          duration: FEED_TIMING.MOTION.ENTRY_FILTER / 1000,
          delay: reducedMotion ? 0 : FEED_TIMING.MOTION.ENTRY_DELAY / 1000,
        },
        boxShadow: {
          duration: FEED_TIMING.HIGHLIGHT_MS / 1000,
          delay:
            (FEED_TIMING.MOTION.ENTRY_DELAY +
              FEED_TIMING.MOTION.ENTRY_FILTER) /
            1000,
        },
        layout: {
          type: "spring",
          stiffness: FEED_TIMING.MOTION.LAYOUT_SPRING.STIFFNESS,
          damping: FEED_TIMING.MOTION.LAYOUT_SPRING.DAMPING,
        },
      }}
      style={{ willChange: isAnimating ? "transform, opacity, filter" : undefined }}
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => setIsAnimating(false)}
    >
      <div className={styles.postMeta}>
        <div
          className={styles.postIdentity}
          style={{
            minWidth: 0,
            flex: "0 1 auto",
            gap: "0.5em",
          }}
        >
          <span className={`${styles.postAvatar} ${styles[`avatar${post.avatar}`]}`}>
            {post.initials}
          </span>
          <span
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
          >
            {post.handle}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={post.time}
              className={styles.postTime}
              style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reducedMotion ? 0 : FEED_TIMING.MOTION.COUNT / 1000,
              }}
            >
              {post.time}
            </motion.span>
          </AnimatePresence>
        </div>
        <span
          className={styles.postActions}
          style={{
            flex: "0 0 auto",
            marginLeft: "auto",
            gap: "0.3em",
          }}
        >
          <span
            className={styles.postAction}
            style={{ flex: "0 0 auto", gap: 0 }}
          >
            <motion.span
              className={`${styles.commentIcon} ${post.comments > 0 ? styles.iconTeal : styles.iconGrey}`}
              animate={commentIconControls}
              style={{
                transition: reducedMotion
                  ? "none"
                  : `background-color ${FEED_TIMING.MOTION.ICON_COLOR / 1000}s`,
              }}
            />
            <AnimatePresence mode="wait">
              {post.comments > 0 ? (
                reducedMotion ? (
                  <small className={styles.countTeal} style={countStyle}>
                    {post.comments}
                  </small>
                ) : (
                  <motion.small
                    key={`${post.id}-comments-${post.comments}`}
                    className={styles.countTeal}
                    style={countStyle}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: FEED_TIMING.MOTION.COUNT / 1000 }}
                  >
                    {post.comments}
                  </motion.small>
                )
              ) : (
                <small className={styles.countTeal} style={{ ...countStyle, visibility: "hidden" }}>
                  0
                </small>
              )}
            </AnimatePresence>
          </span>
          <span
            className={styles.postAction}
            style={{ flex: "0 0 auto", gap: 0 }}
          >
            <motion.span
              className={`${styles.upvoteIcon} ${post.upvotes > 0 ? styles.iconOrange : styles.iconGrey}`}
              animate={upvoteIconControls}
              style={{
                WebkitMaskImage: `url("${post.upvotes > 0 ? "/icons/upvote-fill.svg" : "/icons/upvote-icon.svg"}")`,
                maskImage: `url("${post.upvotes > 0 ? "/icons/upvote-fill.svg" : "/icons/upvote-icon.svg"}")`,
                transition: reducedMotion
                  ? "none"
                  : `background-color ${FEED_TIMING.MOTION.ICON_COLOR / 1000}s`,
              }}
            />
            <AnimatePresence mode="wait">
              {post.upvotes > 0 ? (
                reducedMotion ? (
                  <small className={styles.countOrange} style={countStyle}>
                    {post.upvotes}
                  </small>
                ) : (
                  <motion.small
                    key={`${post.id}-upvotes-${post.upvotes}`}
                    className={styles.countOrange}
                    style={countStyle}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: FEED_TIMING.MOTION.COUNT / 1000 }}
                  >
                    {post.upvotes}
                  </motion.small>
                )
              ) : (
                <small className={styles.countOrange} style={{ ...countStyle, visibility: "hidden" }}>
                  0
                </small>
              )}
            </AnimatePresence>
          </span>
          <span
            className={styles.postAction}
            style={{ flex: "0 0 auto", gap: 0 }}
          >
            <motion.span
              className={`${styles.flagIcon} ${post.flagged ? styles.iconRed : styles.iconGrey}`}
              animate={flagIconControls}
              style={{
                transition: reducedMotion
                  ? "none"
                  : `background-color ${FEED_TIMING.MOTION.ICON_COLOR / 1000}s`,
              }}
            />
            {post.flagCount > 0 ? (
              reducedMotion ? (
                <small className={styles.countRed} style={countStyle}>
                  {post.flagCount}
                </small>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.small
                    key={`${post.id}-flags-${post.flagCount}`}
                    className={styles.countRed}
                    style={countStyle}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: FEED_TIMING.MOTION.COUNT / 1000 }}
                  >
                    {post.flagCount}
                  </motion.small>
                </AnimatePresence>
              )
            ) : (
              <small className={styles.countRed} style={{ ...countStyle, visibility: "hidden" }}>
                0
              </small>
            )}
          </span>
        </span>
      </div>
      <div className={styles.postBody}>
        <p className={styles.postMessage}>{post.message}</p>
        <span
          className={`${styles.chip} ${styles[`chip${post.tag}`]}`}
          style={{ transition: reducedMotion ? "none" : "background-color 0.3s" }}
        >
          {post.tag}
        </span>
      </div>
      <AnimatePresence>
        {post.flagged && (
          <motion.div
            className={styles.flagBanner}
            initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.01 }
                : {
                    height: {
                      duration: FEED_TIMING.MOTION.BANNER / 1000,
                      ease: [0.22, 1, 0.36, 1],
                    },
                    opacity: {
                      duration: FEED_TIMING.MOTION.BANNER / 1000,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }
            }
            style={{ overflow: "hidden", animation: "none", gridTemplateRows: "none" }}
          >
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
  const [isInView, setIsInView] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const posts = useFeedScript(isInView && isDocumentVisible);

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
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setIsMobile(mediaQuery.matches);
    updateMobile();
    mediaQuery.addEventListener("change", updateMobile);
    return () => mediaQuery.removeEventListener("change", updateMobile);
  }, []);

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
    <div className={styles.phone} ref={phoneRef} aria-hidden="true" inert>
      <Image
        className={styles.frame}
        src="/icons/iphone.svg"
        alt="fplaces live venue feed displayed on a phone"
        fill
        sizes="(max-width: 767px) 280px, 250px"
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
            <Image src="/icons/Group.svg" alt="" width={14} height={13} />
          </span>
        </nav>
        <div className={styles.postArea}>
          <div className={styles.postList}>
            <AnimatePresence mode="popLayout" initial={false}>
              {posts.map((post) => (
                <PhonePost
                  key={post.id}
                  post={post}
                  reducedMotion={reducedMotion}
                  isMobile={isMobile}
                />
              ))}
            </AnimatePresence>
          </div>
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
    </div>
  );
}
