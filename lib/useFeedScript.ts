import { useEffect, useRef, useState } from "react";

export const MINUTE_MS = 12000;

export type FeedTag = "Lines" | "Park" | "Food" | "Crowd" | "Hype" | "Flagged";

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
};

type FeedTemplate = Pick<FeedPost, "handle" | "initials" | "message" | "tag"> &
  Partial<Pick<FeedPost, "comments" | "upvotes">>;

const STARTERS: Omit<FeedPost, "id" | "time" | "ageMinutes">[] = [
  { handle: "@Nekky_lj232", initials: "NI", avatar: "orange", message: "Line is moving slowly at Gate A, about 15 mins wait", tag: "Lines", comments: 0, upvotes: 0, flagged: false, flagCount: 0, flagReason: "" },
  { handle: "@Keith", initials: "KH", avatar: "brown", message: "Parking lot B is almost full. There are still spaces around Parking C", tag: "Park", comments: 0, upvotes: 4, flagged: false, flagCount: 0, flagReason: "" },
  { handle: "@Tom", initials: "TM", avatar: "green", message: "I just tried the Burger at Pit chops. It tastes great", tag: "Food", comments: 8, upvotes: 0, flagged: false, flagCount: 0, flagReason: "" },
  { handle: "@Jane_hys21", initials: "JH", avatar: "blue", message: "Does anyone know if the elevator on this level is working? Need to get up with a stroller", tag: "Crowd", comments: 4, upvotes: 2, flagged: false, flagCount: 0, flagReason: "" },
  { handle: "@Charles", initials: "CS", avatar: "purple", message: "People at the North Entrance should push through the barriers. Security can't stop everyone.", tag: "Flagged", comments: 0, upvotes: 0, flagged: true, flagCount: 25, flagReason: "inciting violence" },
];

const STARTER_AGES = [15, 10, 9, 9, 4];

const POOL: FeedTemplate[] = [
  { handle: "@Amara_09", initials: "AM", message: "The band just walked out, the whole south stand is on its feet", tag: "Hype", upvotes: 3, comments: 0 },
  { handle: "@Dayo_k", initials: "DK", message: "Jollof and grilled chicken at Gate C stand is worth every minute in line", tag: "Food", comments: 2, upvotes: 5 },
  { handle: "@Mia_s22", initials: "MS", message: "Gate B security line is moving fast now, under 5 mins", tag: "Lines", comments: 1, upvotes: 0 },
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

const AVATARS = ["orange", "brown", "green", "blue", "purple"];

function avatarFor(handle: string) {
  return AVATARS[(handle.charCodeAt(1) || 0) % AVATARS.length];
}

function labelForAge(ageMinutes: number) {
  return ageMinutes < 1 ? "just now" : `${ageMinutes}m ago`;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function useFeedScript(enabled: boolean, reduced = false) {
  const [posts, setPosts] = useState<FeedPost[]>(() =>
    STARTERS.map((post, index) => ({
      ...post,
      id: `starter-${index}`,
      ageMinutes: STARTER_AGES[index],
      time: `${STARTER_AGES[index]}m ago`,
    })),
  );
  const postsRef = useRef(posts);
  const poolIndex = useRef(0);
  const usedPoolIndexes = useRef(new Set<number>());
  const arrivalCount = useRef(0);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    if (!enabled) return;

    const ageTimer = window.setInterval(() => {
      setPosts((current) =>
        current.map((post) => {
          const ageMinutes = post.ageMinutes + 1;
          return { ...post, ageMinutes, time: labelForAge(ageMinutes) };
        }),
      );
    }, MINUTE_MS);

    let arrivalTimer = 0;
    let eventTimer = 0;

    const spawnPost = () => {
      let template: FeedTemplate | undefined;
      const visiblePosts = postsRef.current;
      while (!template) {
        if (usedPoolIndexes.current.size === POOL.length) {
          usedPoolIndexes.current.clear();
        }

        const index = poolIndex.current;
        poolIndex.current = (index + 1) % POOL.length;
        if (usedPoolIndexes.current.has(index)) continue;

        usedPoolIndexes.current.add(index);
        const candidate = POOL[index];
        if (
          !visiblePosts.some(
            (post) =>
              post.handle === candidate.handle &&
              post.message === candidate.message,
          )
        ) {
          template = candidate;
        }
      }

      arrivalCount.current += 1;
      const flagged = arrivalCount.current % 5 === 0;
      const post: FeedPost = {
        ...template,
        id: `post-${arrivalCount.current}`,
        avatar: avatarFor(template.handle),
        time: "just now",
        ageMinutes: 0,
        comments: template.comments ?? 0,
        upvotes: template.upvotes ?? 0,
        flagged,
        flagCount: flagged ? 25 : 0,
        flagReason: flagged ? "inciting violence" : "",
        tag: flagged ? "Flagged" : template.tag,
      };
      setPosts((current) => {
        const withoutPreviousFlag = flagged
          ? current.map((item) => ({
              ...item,
              flagged: false,
              flagCount: 0,
              flagReason: "",
              tag: item.tag === "Flagged" ? "Crowd" as const : item.tag,
            }))
          : current;
        return [post, ...withoutPreviousFlag].slice(0, 7);
      });
    };

    const scheduleArrival = () => {
      arrivalTimer = window.setTimeout(() => {
        spawnPost();
        scheduleArrival();
      }, reduced ? 15000 : randomBetween(6000, 9000));
    };

    const scheduleEvent = () => {
      eventTimer = window.setTimeout(() => {
        setPosts((current) => {
          if (!current.length) return current;
          const index = randomBetween(0, current.length - 1);
          const copy = [...current];
          const target = copy[index];
          copy[index] = Math.random() < 0.5
            ? { ...target, comments: target.comments + 1 }
            : { ...target, upvotes: target.upvotes + 1 };
          return copy;
        });
        scheduleEvent();
      }, randomBetween(3000, 6000));
    };

    scheduleArrival();
    scheduleEvent();

    return () => {
      window.clearInterval(ageTimer);
      window.clearTimeout(arrivalTimer);
      window.clearTimeout(eventTimer);
    };
  }, [enabled, reduced]);

  return posts;
}
