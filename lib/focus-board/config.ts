export const FOCUS_BOARD_SLUG = "sunburst-sprint-f3k9";
export const FOCUS_BOARD_KEY = "liona-growth-board";

export const FOCUS_BOARD_TASKS = [
  {
    key: "google_reviews",
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
    title: "Take usable clinic photos",
    description:
      "Capture three tidy, usable photos of the clinic, kit, or treatment moments. Only keep the ones she would actually be happy to post.",
    metrics: [{ key: "photo", label: "Usable photo", target: 3, points: 8, kind: "count" as const }],
    accentClass: "focus-task-sage",
  },
  {
    key: "weekly_post",
    title: "Publish the weekly post",
    description:
      "Publish one 100-word myth-vs-fact or treatment-focus post on Google, Facebook, or Instagram. Bonus if it uses one of the week’s photos.",
    metrics: [{ key: "post", label: "Posted", target: 1, points: 20, kind: "toggle" as const }],
    accentClass: "focus-task-stone",
  },
] as const;

export const FOCUS_REWARD_TIERS = [
  { minPoints: 25, label: "Tiny Treat", description: "A coffee, bakery run, or another small same-day pick-me-up." },
  { minPoints: 60, label: "Fresh Energy", description: "Flowers, lunch out, or a small personal treat for keeping momentum going." },
  { minPoints: 110, label: "Momentum Reward", description: "A nicer dinner, home treat, or an afternoon-out style reward." },
  { minPoints: 170, label: "Big Win", description: "A proper monthly reward because she really kept the business-building habit alive." },
] as const;

export type FocusBoardTask = (typeof FOCUS_BOARD_TASKS)[number];
export type FocusBoardMetric = FocusBoardTask["metrics"][number];
