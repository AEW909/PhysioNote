import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FOCUS_BOARD_KEY, FOCUS_BOARD_TASKS, FOCUS_REWARD_TIERS } from "@/lib/focus-board/config";

type FocusBoardEventRow = {
  id: string;
  board_key: string;
  month_key: string;
  week_start: string;
  task_key: string;
  metric_key: string;
  points: number;
  created_at: string;
};

function getMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getWeekStart(date = new Date()) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy;
}

function listMonthWeeks(monthStart: Date) {
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0));
  const firstWeekStart = getWeekStart(monthStart);
  const weeks: string[] = [];
  const cursor = new Date(firstWeekStart);

  while (cursor <= monthEnd) {
    weeks.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return weeks;
}

export async function getFocusBoardData() {
  const admin = createSupabaseAdminClient();
  const monthStart = getMonthStart();
  const monthKey = toIsoDate(monthStart);
  const currentWeekKey = toIsoDate(getWeekStart());
  const weekKeys = listMonthWeeks(monthStart);

  const { data, error } = await admin
    .from("focus_board_events")
    .select("id, board_key, month_key, week_start, task_key, metric_key, points, created_at")
    .eq("board_key", FOCUS_BOARD_KEY)
    .eq("month_key", monthKey)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load focus board: ${error.message}`);
  }

  const events = (data ?? []) as FocusBoardEventRow[];
  const counts = new Map<string, number>();
  let monthPoints = 0;

  events.forEach((event) => {
    const key = `${event.week_start}:${event.task_key}:${event.metric_key}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    monthPoints += event.points;
  });

  const weeks = weekKeys.map((weekKey) => {
    let weekPoints = 0;
    const tasks = FOCUS_BOARD_TASKS.map((task) => {
      const metrics = task.metrics.map((metric) => {
        const count = counts.get(`${weekKey}:${task.key}:${metric.key}`) ?? 0;
        weekPoints += count * metric.points;
        return {
          ...metric,
          count,
        };
      });

      return {
        ...task,
        metrics,
      };
    });

    return {
      weekKey,
      weekPoints,
      isCurrent: weekKey === currentWeekKey,
      tasks,
    };
  });

  const currentReward =
    [...FOCUS_REWARD_TIERS].reverse().find((tier) => monthPoints >= tier.minPoints) ?? null;

  const nextReward = FOCUS_REWARD_TIERS.find((tier) => monthPoints < tier.minPoints) ?? null;

  return {
    boardKey: FOCUS_BOARD_KEY,
    monthKey,
    currentWeekKey,
    monthPoints,
    weeks,
    currentReward,
    nextReward,
  };
}

export type FocusBoardData = Awaited<ReturnType<typeof getFocusBoardData>>;
