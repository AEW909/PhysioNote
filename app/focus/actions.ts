"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FOCUS_BOARD_KEY, FOCUS_BOARD_SLUG, FOCUS_BOARD_TASKS } from "@/lib/focus-board/config";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export type UpdateFocusBoardState = {
  error?: string;
};

export async function updateFocusBoardAction(
  _prevState: UpdateFocusBoardState,
  formData: FormData,
): Promise<UpdateFocusBoardState> {
  const slug = getValue(formData, "slug");
  const weekKey = getValue(formData, "weekKey");
  const monthKey = getValue(formData, "monthKey");
  const taskKey = getValue(formData, "taskKey");
  const metricKey = getValue(formData, "metricKey");
  const direction = getValue(formData, "direction");

  if (slug !== FOCUS_BOARD_SLUG) {
    return { error: "This focus board link is not valid." };
  }

  const task = FOCUS_BOARD_TASKS.find((item) => item.key === taskKey);
  const metric = task?.metrics.find((item) => item.key === metricKey);

  if (!task || !metric || !weekKey || !monthKey) {
    return { error: "The board action is missing some context." };
  }

  const admin = createSupabaseAdminClient();

  if (direction === "add") {
    const { error } = await admin.from("focus_board_events").insert({
      board_key: FOCUS_BOARD_KEY,
      month_key: monthKey,
      week_start: weekKey,
      task_key: taskKey,
      metric_key: metricKey,
      points: metric.points,
    });

    if (error) {
      return { error: error.message };
    }
  } else if (direction === "remove") {
    const { data: latest, error: fetchError } = await admin
      .from("focus_board_events")
      .select("id")
      .eq("board_key", FOCUS_BOARD_KEY)
      .eq("month_key", monthKey)
      .eq("week_start", weekKey)
      .eq("task_key", taskKey)
      .eq("metric_key", metricKey)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      return { error: fetchError.message };
    }

    if (latest) {
      const { error: deleteError } = await admin.from("focus_board_events").delete().eq("id", latest.id);

      if (deleteError) {
        return { error: deleteError.message };
      }
    }
  }

  revalidatePath(`/focus/${FOCUS_BOARD_SLUG}`);
  return {};
}
