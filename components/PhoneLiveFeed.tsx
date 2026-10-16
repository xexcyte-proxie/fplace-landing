"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const styles = new Proxy({} as Record<string, string>, {
  get: (_target, property: string | symbol) =>
    typeof property === "string" ? `plf-${property}` : undefined,
});

type FeedPost = {
  handle: string;
  initials: string;
  avatar: string;
  message: string;
  likes: number;
  comments: number;
  key: string;
};

const initialPosts: FeedPost[] = [
  {
    handle: "@Nekky_lj232",
    initials: "NL",
    avatar: "orange",
    message: "Line is moving slowly at Gate A, about 15 mins wait",
    likes: 12,
    comments: 0,
    key: "nekky-initial",
  },
  {
    handle: "@Keith453",
    initials: "KH",
    avatar: "gold",
    message:
      "Parking lot B is almost full. There are still spaces around Parking C",
    likes: 8,
    comments: 1,
    key: "keith-initial",
  },
  {
    handle: "@Jane_hys21",
    initials: "JH",
    avatar: "blue",
    message:
      "Large crowd at North entrance, please stay alert and follow staff instructions.",
    likes: 15,
    comments: 3,
    key: "jane-initial",
  },
  {
    handle: "@Charles013",
    initials: "CS",
    avatar: "purple",
    message:
      "People at the North Entrance should push through the barriers. Security can't stop everyone.",
    likes: 22,
    comments: 0,
    key: "charles-initial",
  },
];

const postScript: Omit<FeedPost, "key">[] = [
  {
    handle: "@Swiftotter_21",
    initials: "SF",
    avatar: "sky",
    message: "Merch line at Gate C just cleared out. Under 5 mins now",
    likes: 8,
    comments: 2,
  },
  {
    handle: "@HungryHawk",
    initials: "HH",
    avatar: "blue",
    message: "Nachos stand on the concourse has a short line.",
    likes: 5,
    comments: 1,
  },
  {
    handle: "@Blue_Linv32",
    initials: "BL",
    avatar: "magenta",
    message: "Atmosphere in Section 114 right now is absolutely unreal.",
    likes: 21,
    comments: 3,
  },
  {
    handle: "@Davper_864",
    initials: "DP",
    avatar: "red",
    message: "We have less people at Sir Alex stand",
    likes: 4,
    comments: 2,
  },
  {
    handle: "@Sarah_M88",
    initials: "SM",
    avatar: "green",
    message: "Food court by Gate D has the best pretzels. No wait right now.",
    likes: 11,
    comments: 2,
  },
  {
    handle: "@Mike_R_92",
    initials: "MR",
    avatar: "orange",
    message: "East parking lot filling fast. West lot still has plenty of space.",
    likes: 9,
    comments: 1,
  },
  {
    handle: "@Emma_C_23",
    initials: "EC",
    avatar: "magenta",
    message: "Just scored two seats in 108! View is incredible from here.",
    likes: 18,
    comments: 4,
  },
  {
    handle: "@Jake_T_45",
    initials: "JT",
    avatar: "sky",
    message: "Restrooms near Section 120 are clean and no line. Rare win.",
    likes: 6,
    comments: 0,
  },
];

const simulation = {
  visiblePostCount: 5,
  idleMinMs: 1500,
  idleMaxMs: 2500,
  typingMinMs: 40,
  typingMaxMs: 70,
  typingIndicatorMs: 900,
  postTransitionMs: 350,
  flagVisibleMs: 2200,
  flagEveryPosts: 4,
  reactionMinMs: 1200,
  reactionMaxMs: 3000,
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function PhonePost({
  post,
  liked,
  reacting,
  entering,
}: {
  post: FeedPost;
  liked: boolean;
  reacting: boolean;
  entering: boolean;
}) {
  return (
    <article
      className={`${styles.post}${entering ? ` ${styles.entering}` : ""}`}
      data-post-key={post.key}
    >
      <div className={styles.postMeta}>
        <span className={`${styles.postAvatar} ${styles[`avatar${post.avatar}`]}`}>
          {post.initials}
        </span>
        <span className={styles.postHandle}>{post.handle}</span>
        <span className={styles.postActions}>
          <span
            className={`${styles.commentIcon}${post.comments > 0 ? ` ${styles.commented}` : ""}`}
          />
          {post.comments > 0 && (
            <small className={styles.commentCount}>{post.comments}</small>
          )}
          <span className={`${styles.reaction}${reacting ? ` ${styles.reacting}` : ""}`}>
            <span className={`${styles.heartIcon}${liked ? ` ${styles.liked}` : ""}`} />
          </span>
          <small>{post.likes}</small>
          <Image
            className={styles.flagIcon}
            src="/icons/bi_flag-fill.svg"
            alt=""
            width={12}
            height={12}
          />
        </span>
      </div>
      <p className={styles.postMessage}>{post.message}</p>
    </article>
  );
}

export default function PhoneLiveFeed() {
  const phoneRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef(initialPosts);
  const previousTops = useRef(new Map<string, number>());
  const frameRef = useRef<number | null>(null);
  const timers = useRef(new Set<number>());
  const postIndex = useRef(0);
  const postSequence = useRef(0);
  const postCount = useRef(0);

  const [isInView, setIsInView] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [posts, setPosts] = useState(initialPosts);
  const [likedKeys, setLikedKeys] = useState<Set<string>>(
    () => new Set(initialPosts.filter((post) => post.likes > 10).map((post) => post.key)),
  );
  const [draft, setDraft] = useState("");
  const [typingHandle, setTypingHandle] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [newPostKey, setNewPostKey] = useState<string | null>(null);
  const [reactingKey, setReactingKey] = useState<string | null>(null);
  const [flagVisible, setFlagVisible] = useState(false);
  const [flagFading, setFlagFading] = useState(false);
  const [exitingPost, setExitingPost] = useState<FeedPost | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const elements = Array.from(
      list.querySelectorAll<HTMLElement>("[data-post-key]"),
    );
    const moved: HTMLElement[] = [];

    elements.forEach((element) => {
      const key = element.dataset.postKey;
      const previousTop = key ? previousTops.current.get(key) : undefined;
      if (!key || previousTop === undefined) return;

      const delta = previousTop - element.getBoundingClientRect().top;
      if (Math.abs(delta) < 1) return;
      element.style.transition = "none";
      element.style.transform = `translate3d(0, ${delta}px, 0)`;
      void element.offsetHeight;
      element.style.transition = "";
      moved.push(element);
    });

    if (moved.length) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = window.requestAnimationFrame(() => {
        moved.forEach((element) => {
          element.style.transform = "";
        });
      });
    }

    previousTops.current = new Map(
      elements.flatMap((element) => {
        const key = element.dataset.postKey;
        return key
          ? [[key, element.getBoundingClientRect().top] as [string, number]]
          : [];
      }),
    );
  });

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
      if (!visible) {
        setTypingHandle("");
        setIsTyping(false);
        setDraft("");
      }
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const timerIds = timers.current;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!isInView || !isDocumentVisible || reducedMotion) return;

    let active = true;
    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timerIds.delete(timer);
        if (active) callback();
      }, delay);
      timerIds.add(timer);
      return timer;
    };

    const scheduleReaction = () => {
      later(() => {
        const currentPosts = postsRef.current;
        if (!currentPosts.length) return;
        const target = Math.floor(Math.random() * currentPosts.length);
        const post = currentPosts[target];
        const nextPosts = [...currentPosts];
        nextPosts[target] = { ...post, likes: post.likes + 1 };
        postsRef.current = nextPosts;
        setPosts(nextPosts);
        setLikedKeys((keys) => new Set(keys).add(post.key));
        setReactingKey(post.key);
        later(() => setReactingKey(null), 320);
        scheduleReaction();
      }, randomBetween(simulation.reactionMinMs, simulation.reactionMaxMs));
    };

    const schedulePost = () => {
      later(() => {
        const post = postScript[postIndex.current % postScript.length];
        postIndex.current += 1;
        setTypingHandle(post.handle);
        setIsTyping(false);
        setDraft("");

        later(() => {
          setIsTyping(true);
          let characterIndex = 0;

          const typeNextCharacter = () => {
            characterIndex += 1;
            setDraft(post.message.slice(0, characterIndex));

            if (characterIndex >= post.message.length) {
              later(() => {
                const newKey = `script-${postSequence.current++}`;
                const nextPost = { ...post, key: newKey };
                const currentPosts = postsRef.current;
                let nextPosts: FeedPost[];
                if (currentPosts.length < simulation.visiblePostCount) {
                  nextPosts = [nextPost, ...currentPosts];
                } else {
                  setExitingPost(currentPosts[currentPosts.length - 1]);
                  later(() => setExitingPost(null), simulation.postTransitionMs);
                  nextPosts = [nextPost, ...currentPosts.slice(0, -1)];
                }
                postsRef.current = nextPosts;
                setPosts(nextPosts);
                setTypingHandle("");
                setIsTyping(false);
                setDraft("");
                setNewPostKey(newKey);
                setLikedKeys((keys) => new Set(keys).add(newKey));
                later(() => setNewPostKey(null), simulation.postTransitionMs);
                postCount.current += 1;

                if (postCount.current % simulation.flagEveryPosts === 0) {
                  setFlagVisible(true);
                  setFlagFading(false);
                  later(() => setFlagFading(true), simulation.flagVisibleMs - 300);
                  later(() => setFlagVisible(false), simulation.flagVisibleMs);
                }
                schedulePost();
              }, 450);
              return;
            }

            later(
              typeNextCharacter,
              randomBetween(simulation.typingMinMs, simulation.typingMaxMs),
            );
          };

          later(typeNextCharacter, randomBetween(simulation.typingMinMs, simulation.typingMaxMs));
        }, simulation.typingIndicatorMs);
      }, randomBetween(simulation.idleMinMs, simulation.idleMaxMs));
    };

    schedulePost();
    scheduleReaction();

    return () => {
      active = false;
      timerIds.forEach((timer) => window.clearTimeout(timer));
      timerIds.clear();
    };
  }, [isDocumentVisible, isInView]);

  return (
    <div className={styles.phone} ref={phoneRef} aria-hidden="true">
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
          <div
            className={`${styles.typingIndicator}${typingHandle ? ` ${styles.typingVisible}` : ""}`}
          >
            {typingHandle && (
              <>
                <span>{typingHandle} is typing</span>
                <i /><i /><i />
              </>
            )}
          </div>
          <div className={styles.postList} ref={listRef}>
            {posts.map((post) => (
              <PhonePost
                key={post.key}
                post={post}
                liked={likedKeys.has(post.key)}
                reacting={reactingKey === post.key}
                entering={newPostKey === post.key}
              />
            ))}
            {exitingPost && (
              <div className={styles.exitingPost}>
                <PhonePost
                  post={exitingPost}
                  liked={likedKeys.has(exitingPost.key)}
                  reacting={false}
                  entering={false}
                />
              </div>
            )}
            {flagVisible && (
              <div
                className={`${styles.flagNotice}${flagFading ? ` ${styles.flagFading}` : ""}`}
              >
                <Image
                  src="/icons/bi_flag-fill.svg"
                  alt=""
                  width={12}
                  height={12}
                />
                This post has been flagged for inciting violence
              </div>
            )}
          </div>
        </div>
        <div className={styles.composer}>
          <span className={styles.addButton}>+</span>
          <span className={`${styles.input}${isTyping ? ` ${styles.inputTyping}` : ""}`}>
            <span className={styles.inputText}>
              {isTyping ? draft : "Write message"}
            </span>
            {isTyping && <i className={styles.caret} />}
          </span>
          <span className={styles.sendButton}>
            <Image src="/icons/Group 17.svg" alt="" width={20} height={20} />
          </span>
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
