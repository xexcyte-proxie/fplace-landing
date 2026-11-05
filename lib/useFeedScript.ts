import { useEffect, useRef, useState } from "react";

export const FEED_TIMING = {
  ARRIVAL_MS: 4500,
  JITTER: { MIN: -500, MAX: 700 },
  FIRST_POST_DELAY: 700,
  MAX_VISIBLE: 5,
  MINUTE_MS: 12000,
  HIGHLIGHT_MS: 1400,
  ACTIVITY: {
    FIRST_REACTION_MS: { MIN: 2200, MAX: 3800 },
    TICK_GAP_MS: { MIN: 900, MAX: 2400, GROWTH: 1.3, MAX_GAP: 4200 },
    FLAG_GAP_MS: { MIN: 1200, MAX: 2600 },
    MIN_GLOBAL_TICK_GAP_MS: 600,
    COUNT_JUMPS: { TWO_CHANCE: 0.25, THREE_CHANCE: 0.08 },
    CLEAN_POST_CHANCE: 0.25,
    UPVOTES: { MIN: 3, MAX: 18 },
    COMMENTS: { MIN: 2, MAX: 9 },
    FLAGS: { MIN: 15, MAX: 25, FIRST_BANNER_DELAY_MS: 700 },
  },
  MOTION: {
    ENTRY_SPRING: { STIFFNESS: 260, DAMPING: 24, MASS: 0.9 },
    ENTRY_DELAY: 180,
    LAYOUT_SPRING: { STIFFNESS: 300, DAMPING: 32 },
    ENTRY_OPACITY: 400,
    ENTRY_FILTER: 450,
    EXIT: 350,
    COUNT: 220,
    ICON_SPRING: { STIFFNESS: 420, DAMPING: 16, MASS: 0.45 },
    ICON_COLOR: 250,
    BANNER: 450,
  },
} as const;

export const MINUTE_MS = FEED_TIMING.MINUTE_MS;

export type FeedTag = "Lines" | "Park" | "Food" | "Crowd" | "Hype" | "Flagged";
export type FeedStory = "clean" | "upvotes" | "comments" | "mixed" | "flagged";
export type FeedMetric = "upvotes" | "comments";

export type FeedPost = {
  id: string;
  handle: string;
  initials: string;
  avatar: string;
  message: string;
  time: string;
  ageMinutes: number;
  tag: FeedTag;
  comments: number;
  upvotes: number;
  flagged: boolean;
  flagCount: number;
  flagReason: string;
  story: FeedStory;
};

type FeedTemplate = Pick<FeedPost, "handle" | "initials" | "message" | "tag">;

type ScheduledTask = {
  id: number;
  owner: string | null;
  dueAt: number;
  remaining: number;
  run: () => void;
};

type FeedScheduler = {
  schedule: (delay: number, run: () => void, owner?: string) => void;
  cancelOwner: (owner: string) => void;
  setEnabled: (enabled: boolean) => void;
  now: () => number;
  dispose: () => void;
};

const STARTERS: (FeedTemplate & {
  avatar: string;
  story: FeedStory;
  ageMinutes: number;
})[] = [
  { handle: "@Nekky_lj232", initials: "NI", avatar: "orange", message: "Line is moving slowly at Gate A, about 15 mins wait", tag: "Lines", story: "clean", ageMinutes: 15 },
  { handle: "@Keith", initials: "KH", avatar: "brown", message: "Parking lot B is almost full. There are still spaces around Parking C", tag: "Park", story: "upvotes", ageMinutes: 10 },
  { handle: "@Tom", initials: "TM", avatar: "green", message: "I just tried the Burger at Pit chops. It tastes great", tag: "Food", story: "comments", ageMinutes: 9 },
  { handle: "@Jane_hys21", initials: "JH", avatar: "blue", message: "Does anyone know if the elevator on this level is working? Need to get up with a stroller", tag: "Crowd", story: "mixed", ageMinutes: 9 },
  { handle: "@Charles", initials: "CS", avatar: "purple", message: "People at the North Entrance should push through the barriers. Security can't stop everyone.", tag: "Flagged", story: "flagged", ageMinutes: 4 },
];

const POOL: FeedTemplate[] = [
  { handle: "@Amara_09", initials: "AM", message: "The band just walked out, the whole south stand is on its feet", tag: "Hype" },
  { handle: "@Dayo_k", initials: "DK", message: "Jollof and grilled chicken at Gate C stand is worth every minute in line", tag: "Food" },
  { handle: "@Mia_s22", initials: "MS", message: "Gate B security line is moving fast now, under 5 mins", tag: "Lines" },
  { handle: "@GateMara", initials: "GM", message: "Line at Gate C is moving quickly now", tag: "Lines" },
  { handle: "@SnackScout", initials: "SS", message: "Short queue for pretzels by section 104", tag: "Food" },
  { handle: "@LotUpdate", initials: "LU", message: "North parking still has open rows near the shuttle", tag: "Park" },
  { handle: "@BlueSection", initials: "BS", message: "Crowd is building near the east concourse", tag: "Crowd" },
  { handle: "@StadiumBeat", initials: "SB", message: "The whole section is on its feet for warmups", tag: "Hype" },
  { handle: "@NoraAtGate", initials: "NG", message: "No wait at the south entrance right now", tag: "Lines" },
  { handle: "@FoodFinder", initials: "FF", message: "Burger stand beside Gate 2 has plenty ready", tag: "Food" },
  { handle: "@GarageGuide", initials: "GG", message: "West garage has open spaces by the ramp", tag: "Park" },
  { handle: "@ConcourseCam", initials: "CC", message: "The upper walkway is clear by section 110", tag: "Crowd" },
  { handle: "@ChantCorner", initials: "CC", message: "The student section has the whole stand singing", tag: "Hype" },
  { handle: "@GateScout", initials: "GS", message: "Gate A scanners are moving steadily", tag: "Lines" },
  { handle: "@TacoTrail", initials: "TT", message: "Tacos at the west stand are fresh and fast", tag: "Food" },
  { handle: "@CarSpotter", initials: "CS", message: "Spaces available on level three of the garage", tag: "Park" },
  { handle: "@CrowdGuide", initials: "CG", message: "Less crowded route is along the south walkway", tag: "Crowd" },
  { handle: "@BigPlay", initials: "BP", message: "The band just came out and the place is loud", tag: "Hype" },
];

const POOL_STORIES: FeedStory[] = ["upvotes", "comments", "mixed", "flagged"];
const AVATARS = ["orange", "brown", "green", "blue", "purple"];

function avatarFor(handle: string) {
  return AVATARS[(handle.charCodeAt(1) || 0) % AVATARS.length];
}

function labelForAge(ageMinutes: number) {
  return ageMinutes < 1 ? "now" : `${ageMinutes}m ago`;
}

function jitterFor(index: number) {
  const { MIN, MAX } = FEED_TIMING.JITTER;
  return MIN + ((index * 7919) % (MAX - MIN + 1));
}

function createSeededRandom(postIndex: number, loopNumber: number) {
  let seed = (postIndex * 0x9e3779b1 + loopNumber * 0x85ebca6b) >>> 0;
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random: () => number, min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1));
}

function createPausableScheduler(): FeedScheduler {
  let tasks: ScheduledTask[] = [];
  let nextId = 0;
  let timeout: number | null = null;
  let enabled = false;
  let disposed = false;
  let elapsed = 0;
  let enabledAt = 0;

  const clearTimeoutHandle = () => {
    if (timeout !== null) {
      window.clearTimeout(timeout);
      timeout = null;
    }
  };

  const arm = () => {
    clearTimeoutHandle();
    if (!enabled || disposed || tasks.length === 0) return;

    const nextTask = tasks.reduce((earliest, task) =>
      task.dueAt < earliest.dueAt ? task : earliest,
    );
    timeout = window.setTimeout(() => {
      timeout = null;
      if (!enabled || disposed) return;

      const taskIndex = tasks.findIndex((task) => task.id === nextTask.id);
      if (taskIndex < 0) {
        arm();
        return;
      }

      const [task] = tasks.splice(taskIndex, 1);
      task.run();
      arm();
    }, Math.max(0, nextTask.dueAt - Date.now()));
  };

  return {
    schedule(delay, run, owner) {
      if (disposed) return;
      const remaining = Math.max(0, delay);
      tasks.push({
        id: nextId++,
        owner: owner ?? null,
        dueAt: enabled ? Date.now() + remaining : 0,
        remaining,
        run,
      });
      arm();
    },
    cancelOwner(owner) {
      tasks = tasks.filter((task) => task.owner !== owner);
      arm();
    },
    setEnabled(nextEnabled) {
      if (disposed || enabled === nextEnabled) return;
      const now = Date.now();
      if (nextEnabled) {
        enabledAt = now;
        tasks = tasks.map((task) => ({
          ...task,
          dueAt: now + task.remaining,
        }));
      } else {
        elapsed += now - enabledAt;
        tasks = tasks.map((task) => ({
          ...task,
          remaining: Math.max(0, task.dueAt - now),
        }));
      }
      enabled = nextEnabled;
      arm();
    },
    now() {
      return elapsed + (enabled ? Date.now() - enabledAt : 0);
    },
    dispose() {
      disposed = true;
      enabled = false;
      tasks = [];
      clearTimeoutHandle();
    },
  };
}

export function useFeedScript(enabled: boolean) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const postsRef = useRef<FeedPost[]>([]);
  const schedulerRef = useRef<FeedScheduler | null>(null);

  useEffect(() => {
    let arrivalIndex = 0;
    let poolCursor = 0;
    const scheduler = createPausableScheduler();
    schedulerRef.current = scheduler;
    let lastCountTickAt = Number.NEGATIVE_INFINITY;

    const commit = (update: (current: FeedPost[]) => FeedPost[]) => {
      const next = update(postsRef.current);
      postsRef.current = next;
      setPosts(next);
    };

    const updatePost = (id: string, update: (post: FeedPost) => FeedPost) => {
      commit((current) =>
        current.map((post) => (post.id === id ? update(post) : post)),
      );
    };

    const scheduleCountTick = (
      post: FeedPost,
      delay: number,
      run: () => void,
    ) => {
      const owner = `post:${post.id}`;
      const fireWhenAllowed = () => {
        const remaining =
          lastCountTickAt +
          FEED_TIMING.ACTIVITY.MIN_GLOBAL_TICK_GAP_MS -
          scheduler.now();
        if (remaining > 0) {
          scheduler.schedule(remaining, fireWhenAllowed, owner);
          return;
        }
        lastCountTickAt = scheduler.now();
        run();
      };
      scheduler.schedule(delay, fireWhenAllowed, owner);
    };

    const scheduleCount = (
      post: FeedPost,
      metric: FeedMetric,
      target: number,
      firstDelay: number,
      random: () => number,
    ) => {
      let currentValue = 0;
      let elapsed = firstDelay;
      let gap = randomInt(
        random,
        FEED_TIMING.ACTIVITY.TICK_GAP_MS.MIN,
        FEED_TIMING.ACTIVITY.TICK_GAP_MS.MAX,
      );
      while (currentValue < target) {
        const chance = random();
        const increment =
          chance < FEED_TIMING.ACTIVITY.COUNT_JUMPS.THREE_CHANCE
            ? 3
            : chance <
                FEED_TIMING.ACTIVITY.COUNT_JUMPS.THREE_CHANCE +
                  FEED_TIMING.ACTIVITY.COUNT_JUMPS.TWO_CHANCE
              ? 2
              : 1;
        currentValue = Math.min(target, currentValue + increment);
        const nextValue = currentValue;
        const tickDelay = elapsed;
        scheduleCountTick(post, tickDelay, () =>
          updatePost(post.id, (current) => ({
            ...current,
            [metric]: nextValue,
          })),
        );
        if (currentValue < target) {
          elapsed += gap;
          gap = Math.min(
            FEED_TIMING.ACTIVITY.TICK_GAP_MS.MAX_GAP,
            Math.round(gap * FEED_TIMING.ACTIVITY.TICK_GAP_MS.GROWTH),
          );
        }
      }
    };

    const scheduleFlags = (
      post: FeedPost,
      target: number,
      firstDelay: number,
      random: () => number,
    ) => {
      const milestones = [
        Math.max(1, Math.floor(target * (0.1 + random() * 0.06))),
        Math.floor(target * (0.25 + random() * 0.08)),
        Math.floor(target * (0.44 + random() * 0.1)),
        Math.floor(target * (0.68 + random() * 0.1)),
      ]
        .filter((value) => value > 0 && value < target)
        .sort((left, right) => left - right)
        .filter((value, index, values) => index === 0 || value > values[index - 1]);
      milestones.push(target);
      let elapsed = firstDelay;
      let gap = randomInt(
        random,
        FEED_TIMING.ACTIVITY.FLAG_GAP_MS.MIN,
        FEED_TIMING.ACTIVITY.FLAG_GAP_MS.MAX,
      );
      milestones.forEach((value, index) => {
        const tickDelay = elapsed;
        scheduleCountTick(post, tickDelay, () => {
          updatePost(post.id, (current) => ({
            ...current,
            flagCount: value,
          }));
          if (index === milestones.length - 1) {
            scheduler.schedule(
              FEED_TIMING.ACTIVITY.FLAGS.FIRST_BANNER_DELAY_MS,
              () =>
                updatePost(post.id, (current) => ({
                  ...current,
                  flagged: true,
                  tag: "Flagged",
                })),
              `post:${post.id}`,
            );
          }
        });
        if (index < milestones.length - 1) {
          elapsed += gap;
          gap = Math.min(
            FEED_TIMING.ACTIVITY.TICK_GAP_MS.MAX_GAP,
            Math.round(gap * FEED_TIMING.ACTIVITY.TICK_GAP_MS.GROWTH),
          );
        }
      });
    };

    const scheduleEngagement = (
      post: FeedPost,
      random: () => number,
      isStarter: boolean,
    ) => {
      const firstReactionDelay = () =>
        randomInt(
          random,
          FEED_TIMING.ACTIVITY.FIRST_REACTION_MS.MIN,
          FEED_TIMING.ACTIVITY.FIRST_REACTION_MS.MAX,
        );
      const upvoteTarget = () =>
        post.handle === "@Keith"
          ? 4
          : randomInt(
              random,
              FEED_TIMING.ACTIVITY.UPVOTES.MIN,
              FEED_TIMING.ACTIVITY.UPVOTES.MAX,
            );
      const commentTarget = () =>
        post.handle === "@Tom"
          ? 8
          : randomInt(
              random,
              FEED_TIMING.ACTIVITY.COMMENTS.MIN,
              FEED_TIMING.ACTIVITY.COMMENTS.MAX,
            );

      switch (post.story) {
        case "clean":
          return;
        case "upvotes": {
          const target = upvoteTarget();
          scheduleCount(
            post,
            "upvotes",
            target,
            firstReactionDelay(),
            random,
          );
          return;
        }
        case "comments": {
          const target = commentTarget();
          scheduleCount(
            post,
            "comments",
            target,
            firstReactionDelay(),
            random,
          );
          return;
        }
        case "mixed": {
          const upvotes = isStarter ? 2 : upvoteTarget();
          const comments = isStarter ? 4 : commentTarget();
          scheduleCount(post, "upvotes", upvotes, firstReactionDelay(), random);
          scheduleCount(post, "comments", comments, firstReactionDelay(), random);
          return;
        }
        case "flagged": {
          const target =
            post.handle === "@Charles"
              ? 25
              : randomInt(
                  random,
                  FEED_TIMING.ACTIVITY.FLAGS.MIN,
                  FEED_TIMING.ACTIVITY.FLAGS.MAX,
                );
          scheduleFlags(post, target, firstReactionDelay(), random);
        }
      }
    };

    const spawnPost = () => {
      arrivalIndex += 1;
      const currentVisible = postsRef.current;
      const isStarter = arrivalIndex <= STARTERS.length;
      let template: FeedTemplate;
      let story: FeedStory;
      let avatar: string;
      let ageMinutes = 0;
      let activityRandom = createSeededRandom(arrivalIndex, 0);
      let poolIndex = -1;

      if (isStarter) {
        const starter = STARTERS[arrivalIndex - 1];
        template = starter;
        story = starter.story;
        avatar = starter.avatar;
        ageMinutes = starter.ageMinutes;
      } else {
        let attempts = 0;
        do {
          poolIndex = poolCursor % POOL.length;
          poolCursor += 1;
          attempts += 1;
          if (attempts > POOL.length) {
            throw new Error("Unable to find a unique phone-feed post");
          }
        } while (
          currentVisible.some((post) => post.handle === POOL[poolIndex].handle)
        );
        template = POOL[poolIndex];
        const loopNumber = Math.floor(
          (arrivalIndex - STARTERS.length - 1) / POOL.length,
        );
        activityRandom = createSeededRandom(arrivalIndex, loopNumber);
        story =
          activityRandom() < FEED_TIMING.ACTIVITY.CLEAN_POST_CHANCE
            ? "clean"
            : POOL_STORIES[
                randomInt(activityRandom, 0, POOL_STORIES.length - 1)
              ];
        avatar = avatarFor(template.handle);
      }

      const post: FeedPost = {
        ...template,
        id: `post-${arrivalIndex}`,
        avatar,
        time: labelForAge(ageMinutes),
        ageMinutes,
        comments: 0,
        upvotes: 0,
        flagged: false,
        flagCount: 0,
        flagReason: story === "flagged" ? "inciting violence" : "",
        story,
      };

      const nextPosts = [post, ...currentVisible].slice(
        0,
        FEED_TIMING.MAX_VISIBLE,
      );
      const evicted = currentVisible.find(
        (visiblePost) => !nextPosts.some((nextPost) => nextPost.id === visiblePost.id),
      );
      if (evicted) scheduler.cancelOwner(`post:${evicted.id}`);
      commit(() => nextPosts);
      scheduleEngagement(post, activityRandom, isStarter);

      const ageTick = () => {
        updatePost(post.id, (current) => {
          const ageMinutes = current.ageMinutes + 1;
          return { ...current, ageMinutes, time: labelForAge(ageMinutes) };
        });
        scheduler.schedule(FEED_TIMING.MINUTE_MS, ageTick, `post:${post.id}`);
      };
      scheduler.schedule(FEED_TIMING.MINUTE_MS, ageTick, `post:${post.id}`);

      scheduler.schedule(
        FEED_TIMING.ARRIVAL_MS + jitterFor(arrivalIndex),
        spawnPost,
        "arrivals",
      );
    };

    scheduler.schedule(FEED_TIMING.FIRST_POST_DELAY, spawnPost, "arrivals");

    return () => {
      scheduler.dispose();
      if (schedulerRef.current === scheduler) {
        schedulerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    schedulerRef.current?.setEnabled(enabled);
  }, [enabled]);

  return posts;
}
