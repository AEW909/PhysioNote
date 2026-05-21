export const FOCUS_BOARD_SLUG = "sunburst-sprint-f3k9";
export const FOCUS_BOARD_KEY = "liona-growth-board";
export const FOCUS_WEEKLY_TARGET = 50;

export const FOCUS_BOARD_TASKS = [
  {
    key: "google_reviews",
    icon: "STAR",
    stickerSrc: "/focus/review-star.svg",
    stickerAlt: "Smiling star review sticker",
    title: "Ask for Google reviews",
    description:
      "Ask three happy patients each week for a Google review. Actual reviews earned score bonus points because they move the business fastest.",
    metrics: [
      { key: "ask", label: "Asked", target: 3, points: 4, kind: "count" as const },
      { key: "review", label: "Review landed", target: 0, points: 10, kind: "count" as const },
    ],
    accentClass: "focus-task-teal",
  },
  {
    key: "clinic_photos",
    icon: "SNAP",
    stickerSrc: "/focus/camera-zap.svg",
    stickerAlt: "Camera sticker with neon spark",
    title: "Take usable clinic photos",
    description:
      "Capture three tidy, usable photos of the clinic, kit, or treatment moments. Only keep the ones she would actually be happy to post.",
    metrics: [{ key: "photo", label: "Usable photo", target: 3, points: 8, kind: "count" as const }],
    accentClass: "focus-task-sage",
  },
  {
    key: "weekly_post",
    icon: "POST",
    stickerSrc: "/focus/post-rocket.svg",
    stickerAlt: "Rocket social post sticker",
    title: "Publish the weekly post",
    description:
      "Publish one 100-word myth-vs-fact or treatment-focus post on Google, Facebook, or Instagram. Bonus if it uses one of the week's photos.",
    metrics: [{ key: "post", label: "Posted", target: 1, points: 20, kind: "toggle" as const }],
    accentClass: "focus-task-stone",
  },
] as const;

export const FOCUS_REWARD_TIERS = [
  {
    minPoints: 40,
    minWeeksHit: 1,
    label: "Spark Starter",
    stickerSrc: "/focus/reward-spark.svg",
    stickerAlt: "Spark reward sticker",
    description: "Tiny happy thing. Coffee, pastry, flowers, or ten guilt-free minutes spent on pure nonsense.",
  },
  {
    minPoints: 95,
    minWeeksHit: 2,
    label: "Glow Up",
    stickerSrc: "/focus/reward-glow.svg",
    stickerAlt: "Glow reward sticker",
    description: "Something she genuinely likes: lunch out, a book, a beauty treat, or a home comfort upgrade.",
  },
  {
    minPoints: 150,
    minWeeksHit: 3,
    label: "Boss Energy",
    stickerSrc: "/focus/reward-boss.svg",
    stickerAlt: "Boss reward sticker",
    description: "A bigger reward because she kept showing up for the business even when the tasks felt annoying.",
  },
  {
    minPoints: 220,
    minWeeksHit: 4,
    label: "Chaos Queen Jackpot",
    stickerSrc: "/focus/reward-jackpot.svg",
    stickerAlt: "Jackpot reward sticker",
    description: "Top-tier monthly reward. Dinner out, something fun, or a proper experience-level treat.",
  },
] as const;

export type FocusBoardTask = (typeof FOCUS_BOARD_TASKS)[number];
export type FocusBoardMetric = FocusBoardTask["metrics"][number];
