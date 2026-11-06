import { useEffect, useRef, useState } from "react";

export const TEMPO = 0.55;

export const FEED_TIMING = {
  ARRIVAL_MS: 4500,
  JITTER: { MIN: -500, MAX: 700 },
  FIRST_POST_DELAY: 700,
  HOLD_AFTER_END_MS: 5000,
  CLEAR_MS: 500,
  RESTART_DELAY_MS: 900,
  ENTRY_FROM: "below" as "below" | "left" | "above",
  MINUTE_MS: 12000,
  FLAG_BANNER_MS: 450,
  ACTIVITY: {
    FIRST_REACTION_MS: { MIN: 2200, MAX: 3800 },
    TICK_GAP_MS: { MIN: 900, MAX: 2400, GROWTH: 1.3, MAX_GAP: 4200 },
    FLAG_GAP_MS: { MIN: 1200, MAX: 2600 },
    MIN_GLOBAL_TICK_GAP_MS: 600,
    COUNT_JUMPS: { TWO_CHANCE: 0.25, THREE_CHANCE: 0.08 },
    FLAGS: { FIRST_BANNER_DELAY_MS: 700 },
  },
} as const;

export const MINUTE_MS = scaledTiming(FEED_TIMING.MINUTE_MS);

export type FeedTag = "Lines" | "Park" | "Food" | "Crowd" | "Hype" | "Flagged";
export type FeedStory = "clean" | "upvotes" | "comments" | "flagged";
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

export type FeedScriptState = {
  posts: FeedPost[];
  isExiting: boolean;
  cycle: number;
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
})[] = [
  { handle: "@Nekky_lj232", initials: "NI", avatar: "orange", message: "Line is moving slowly at Gate A, about 15 mins wait", tag: "Lines", story: "clean" },
  { handle: "@Keith", initials: "KH", avatar: "brown", message: "Parking lot B is almost full. There are still spaces around Parking C", tag: "Park", story: "upvotes" },
  { handle: "@Tom", initials: "TM", avatar: "green", message: "I just tried the Burger at Pit chops. It tastes great", tag: "Food", story: "comments" },
  { handle: "@Charles", initials: "CS", avatar: "purple", message: "People at the North Entrance should push through the barriers. Security can't stop everyone.", tag: "Flagged", story: "flagged" },
];

function labelForAge(ageMinutes: number) {
  return ageMinutes < 1 ? "now" : `${ageMinutes}m ago`;
}

function jitterFor(index: number) {
  const { MIN, MAX } = FEED_TIMING.JITTER;
  return MIN + ((index * 7919) % (MAX - MIN + 1));
}

function scaledTiming(milliseconds: number, minimum = 0) {
  return Math.max(minimum, Math.round(milliseconds * TEMPO));
}

export function scaleFeedTiming(milliseconds: number, minimum = 0) {
  return scaledTiming(milliseconds, minimum);
}

function scaledRandomInt(
  random: () => number,
  min: number,
  max: number,
  minimum = 0,
) {
  return randomInt(
    random,
    scaledTiming(min, minimum),
    scaledTiming(max, minimum),
  );
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

export function useFeedScript(enabled: boolean): FeedScriptState {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const [cycle, setCycle] = useState(0);
  const postsRef = useRef<FeedPost[]>([]);
  const schedulerRef = useRef<FeedScheduler | null>(null);

  useEffect(() => {
    let arrivalIndex = 0;
    let storyLoop = 0;
    let lastCountTickAt = Number.NEGATIVE_INFINITY;
    const scheduler = createPausableScheduler();
    schedulerRef.current = scheduler;

    const commit = (update: (current: FeedPost[]) => FeedPost[]) => {
      const next = update(postsRef.current);
      postsRef.current = next;
      setPosts(next);
    };
    let spawnPost: () => void = () => {};

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
          scaledTiming(FEED_TIMING.ACTIVITY.MIN_GLOBAL_TICK_GAP_MS, 350) -
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
      let gap = scaledRandomInt(
        random,
        FEED_TIMING.ACTIVITY.TICK_GAP_MS.MIN,
        FEED_TIMING.ACTIVITY.TICK_GAP_MS.MAX,
        350,
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
            scaledTiming(FEED_TIMING.ACTIVITY.TICK_GAP_MS.MAX_GAP, 350),
            Math.max(
              350,
              Math.round(gap * FEED_TIMING.ACTIVITY.TICK_GAP_MS.GROWTH),
            ),
          );
        }
      }
    };

    const beginExit = () => {
      setIsExiting(true);
      postsRef.current.forEach((post) =>
        scheduler.cancelOwner(`post:${post.id}`),
      );
      scheduler.schedule(
        scaledTiming(FEED_TIMING.CLEAR_MS),
        () => {
          commit(() => []);
          scheduler.schedule(
            scaledTiming(FEED_TIMING.RESTART_DELAY_MS),
            () => {
              storyLoop += 1;
              arrivalIndex = 0;
              lastCountTickAt = Number.NEGATIVE_INFINITY;
              setCycle(storyLoop);
              setIsExiting(false);
              scheduler.schedule(0, spawnPost, "arrivals");
            },
            "restart",
          );
        },
        "clear",
      );
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
      let gap = scaledRandomInt(
        random,
        FEED_TIMING.ACTIVITY.FLAG_GAP_MS.MIN,
        FEED_TIMING.ACTIVITY.FLAG_GAP_MS.MAX,
        350,
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
              scaledTiming(FEED_TIMING.ACTIVITY.FLAGS.FIRST_BANNER_DELAY_MS),
              () => {
                updatePost(post.id, (current) => ({
                  ...current,
                  flagged: true,
                  tag: "Flagged",
                }));
                scheduler.schedule(
                  FEED_TIMING.FLAG_BANNER_MS +
                    scaledTiming(FEED_TIMING.HOLD_AFTER_END_MS, 3000),
                  beginExit,
                  `post:${post.id}`,
                );
              },
              `post:${post.id}`,
            );
          }
        });
        if (index < milestones.length - 1) {
          elapsed += gap;
          gap = Math.min(
            scaledTiming(FEED_TIMING.ACTIVITY.TICK_GAP_MS.MAX_GAP, 350),
            Math.max(
              350,
              Math.round(gap * FEED_TIMING.ACTIVITY.TICK_GAP_MS.GROWTH),
            ),
          );
        }
      });
    };

    const scheduleEngagement = (post: FeedPost, random: () => number) => {
      const firstReactionDelay = scaledRandomInt(
        random,
        FEED_TIMING.ACTIVITY.FIRST_REACTION_MS.MIN,
        FEED_TIMING.ACTIVITY.FIRST_REACTION_MS.MAX,
      );
      switch (post.story) {
        case "clean":
          return;
        case "upvotes":
          scheduleCount(
            post,
            "upvotes",
            4,
            firstReactionDelay,
            random,
          );
          return;
        case "comments":
          scheduleCount(
            post,
            "comments",
            8,
            firstReactionDelay,
            random,
          );
          return;
        case "flagged":
          scheduleFlags(post, 25, firstReactionDelay, random);
      }
    };

    spawnPost = () => {
      if (arrivalIndex >= STARTERS.length) return;
      const index = arrivalIndex;
      const starter = STARTERS[index];
      arrivalIndex += 1;
      const random = createSeededRandom(index + 1, storyLoop);
      const post: FeedPost = {
        ...starter,
        id: `story-${storyLoop}-post-${index + 1}`,
        time: labelForAge(0),
        ageMinutes: 0,
        comments: 0,
        upvotes: 0,
        flagged: false,
        flagCount: 0,
        flagReason: starter.story === "flagged" ? "inciting violence" : "",
      };

      commit((current) => [...current, post]);
      scheduleEngagement(post, random);

      const ageTick = () => {
        updatePost(post.id, (current) => {
          const ageMinutes = current.ageMinutes + 1;
          return { ...current, ageMinutes, time: labelForAge(ageMinutes) };
        });
        scheduler.schedule(
          scaledTiming(FEED_TIMING.MINUTE_MS),
          ageTick,
          `post:${post.id}`,
        );
      };
      scheduler.schedule(
        scaledTiming(FEED_TIMING.MINUTE_MS),
        ageTick,
        `post:${post.id}`,
      );

      if (arrivalIndex < STARTERS.length) {
        scheduler.schedule(
          Math.max(
            2000,
            scaledTiming(
              FEED_TIMING.ARRIVAL_MS + jitterFor(arrivalIndex),
            ),
          ),
          spawnPost,
          "arrivals",
        );
      }
    };

    scheduler.schedule(
      scaledTiming(FEED_TIMING.FIRST_POST_DELAY),
      spawnPost,
      "arrivals",
    );

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

  return { posts, isExiting, cycle };
}
