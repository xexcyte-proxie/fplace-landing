"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useFeedScript, type FeedPost } from "@/lib/useFeedScript";

const styles = new Proxy({} as Record<string, string>, {
  get: (_target, property: string | symbol) =>
    typeof property === "string" ? `plf-${property}` : undefined,
});

function PhonePost({ post, reducedMotion }: { post: FeedPost; reducedMotion: boolean }) {
  return (
    <motion.article
      className={styles.post}
      layout={!reducedMotion}
      initial={{ opacity: 0, x: reducedMotion ? 0 : -48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        x: reducedMotion ? 0 : 24,
        y: reducedMotion ? 0 : "100%",
        transition: { duration: 0.4, ease: "easeOut" },
      }}
      transition={{
        duration: reducedMotion ? 0.25 : 0.6,
        ease: reducedMotion ? "easeOut" : [0.22, 1, 0.36, 1],
      }}
    >
      <div className={styles.postMeta}>
        <div className={styles.postIdentity}>
          <span className={`${styles.postAvatar} ${styles[`avatar${post.avatar}`]}`}>
            {post.initials}
          </span>
          <span className={styles.postHandle}>{post.handle}</span>
          <span className={styles.postTime}>{post.time}</span>
        </div>
        <span className={styles.postActions}>
          <span className={styles.postAction}>
            <span className={`${styles.commentIcon} ${post.comments > 0 ? styles.iconTeal : styles.iconGrey}`} />
            {post.comments > 0 && (
              <motion.small
                key={`${post.id}-comments-${post.comments}`}
                className={styles.countTeal}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
              >
                {post.comments}
              </motion.small>
            )}
          </span>
          <span className={styles.postAction}>
            <span className={`${styles.upvoteIcon} ${post.upvotes > 0 ? styles.iconOrange : styles.iconGrey}`} />
            {post.upvotes > 0 && (
              <motion.small
                key={`${post.id}-upvotes-${post.upvotes}`}
                className={styles.countOrange}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
              >
                {post.upvotes}
              </motion.small>
            )}
          </span>
          <span className={styles.postAction}>
            <span className={`${styles.flagIcon} ${post.flagged ? styles.iconRed : styles.iconGrey}`} />
            {post.flagged && <small className={styles.countRed}>{post.flagCount}</small>}
          </span>
        </span>
      </div>
      <div className={styles.postBody}>
        <p className={styles.postMessage}>{post.message}</p>
        <span className={`${styles.chip} ${styles[`chip${post.tag}`]}`}>
          {post.tag}
        </span>
      </div>
      {post.flagged && (
        <div className={styles.flagBanner}>
          <span className={styles.flagBannerInner}>
            <span className={styles.flagBannerIcon} />
            This post has been flagged for {post.flagReason}
          </span>
        </div>
      )}
    </motion.article>
  );
}

export default function PhoneLiveFeed() {
  const phoneRef = useRef<HTMLDivElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const [isInView, setIsInView] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const posts = useFeedScript(isInView && isDocumentVisible, reducedMotion);

  useEffect(() => {
    const phone = phoneRef.current;
    if (!phone) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(phone);
    return () => observer.disconnect();
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
        alt="Fplaces live venue feed displayed on a phone"
        fill
        sizes="(max-width: 767px) 280px, 250px"
        unoptimized
        priority
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
              priority
            />
          </span>
          <span className={styles.categoryTab}>
            <Image
              src="/icons/Frame%20281.svg"
              alt="Food"
              width={36}
              height={24}
              unoptimized
              priority
            />
          </span>
          <span className={styles.categoryTab}>
            <Image
              src="/icons/Frame%20300.svg"
              alt="Hype"
              width={36}
              height={24}
              unoptimized
              priority
            />
          </span>
          <span className={styles.lineTab}>
            <Image
              src="/icons/Frame%20301.svg"
              alt="Lines"
              width={36}
              height={24}
              unoptimized
              priority
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
