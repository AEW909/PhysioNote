"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  FOCUS_BOARD_KEY,
  getAccentClassForIndex,
  normaliseFocusKey,
  type FocusMetricKind,
} from "@/lib/focus-board/config";
import { FOCUS_ASSET_BUCKET, FOCUS_ASSET_FOLDER } from "@/lib/focus-board/assets";
import { getFocusBoardRuntimeConfigByAdminSlug } from "@/lib/focus-board/runtime";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getIntValue(formData: FormData, key: string, fallback = 0) {
  const raw = getValue(formData, key);
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

async function getAdminContext(adminSlug: string) {
  const runtime = await getFocusBoardRuntimeConfigByAdminSlug(adminSlug);

  if (!runtime) {
    throw new Error("This focus control link is not valid.");
  }

  return runtime;
}

function revalidateFocusPaths(boardSlug: string, adminSlug: string) {
  revalidatePath(`/focus/${boardSlug}`);
  revalidatePath(`/focus-control/${adminSlug}`);
}

function getFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  return file.type === "image/svg+xml" ? "svg" : "png";
}

async function ensureFocusAssetBucket() {
  const admin = createSupabaseAdminClient();
  const { data: buckets, error: listError } = await admin.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message);
  }

  if (buckets?.some((bucket) => bucket.name === FOCUS_ASSET_BUCKET)) {
    return admin;
  }

  const { error } = await admin.storage.createBucket(FOCUS_ASSET_BUCKET, {
    public: true,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"],
    fileSizeLimit: 8 * 1024 * 1024,
  });

  if (error) {
    throw new Error(error.message);
  }

  return admin;
}

export async function updateFocusBoardSettingsAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const title = getValue(formData, "title") || runtime.settings.title;
  const subtitle = getValue(formData, "subtitle") || runtime.settings.subtitle;
  const weeklyTarget = Math.max(1, getIntValue(formData, "weeklyTarget", runtime.settings.weeklyTarget));

  await admin
    .from("focus_board_settings")
    .update({
      title,
      subtitle,
      weekly_target: weeklyTarget,
    })
    .eq("board_key", FOCUS_BOARD_KEY);

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function updateFocusWeeklyRewardAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("focus_board_settings")
    .update({
      weekly_target: Math.max(1, getIntValue(formData, "weeklyTarget", runtime.settings.weeklyTarget)),
      weekly_reward_label: getValue(formData, "label") || runtime.weeklyReward.label,
      weekly_reward_description: getValue(formData, "description") || runtime.weeklyReward.description,
      weekly_reward_locked_sticker_src:
        getValue(formData, "lockedStickerSrc") || runtime.weeklyReward.lockedStickerSrc,
      weekly_reward_unlocked_sticker_src:
        getValue(formData, "unlockedStickerSrc") || runtime.weeklyReward.unlockedStickerSrc,
      weekly_reward_sticker_alt: getValue(formData, "stickerAlt") || runtime.weeklyReward.stickerAlt,
    })
    .eq("board_key", FOCUS_BOARD_KEY);

  if (error) {
    throw new Error(error.message);
  }

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
  redirect(`/focus-control/${runtime.settings.adminSlug}`);
}

export async function uploadFocusAssetAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const file = getFile(formData, "asset");

  if (!file) {
    throw new Error("Choose an image to upload.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Focus assets must be image files.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Focus assets must be 8 MB or smaller.");
  }

  const admin = await ensureFocusAssetBucket();
  const baseName = normaliseFocusKey(file.name.replace(/\.[^.]+$/, ""));
  const extension = getFileExtension(file);
  const storagePath = `${FOCUS_ASSET_FOLDER}/${Date.now()}-${baseName}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(FOCUS_ASSET_BUCKET).upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function addFocusBoardTaskAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const title = getValue(formData, "title");
  const description = getValue(formData, "description");
  const metricLabel = getValue(formData, "metricLabel");

  if (!title || !description || !metricLabel) {
    throw new Error("New goals need a title, description, and metric label.");
  }

  const currentSort = runtime.tasks.length + 1;
  const taskKey = normaliseFocusKey(getValue(formData, "taskKey") || title);
  const metricKey = normaliseFocusKey(getValue(formData, "metricKey") || metricLabel);
  const icon = (getValue(formData, "icon") || title.slice(0, 4)).toUpperCase().slice(0, 6);
  const stickerSrc = getValue(formData, "stickerSrc") || "/focus/mascot-rainbow.svg";
  const stickerAlt = getValue(formData, "stickerAlt") || `${title} sticker`;
  const accentClass = getAccentClassForIndex(runtime.tasks.length);
  const target = Math.max(0, getIntValue(formData, "target", 1));
  const points = getIntValue(formData, "points", 1);
  const kind = (getValue(formData, "kind") || "count") as FocusMetricKind;

  const { data: taskRow, error: taskError } = await admin
    .from("focus_board_tasks")
    .insert({
      board_key: FOCUS_BOARD_KEY,
      task_key: taskKey,
      icon,
      sticker_src: stickerSrc,
      sticker_alt: stickerAlt,
      title,
      description,
      accent_class: accentClass,
      sort_order: currentSort,
    })
    .select("id")
    .single();

  if (taskError || !taskRow) {
    throw new Error(taskError?.message ?? "Could not create the new goal.");
  }

  const { error: metricError } = await admin.from("focus_board_task_metrics").insert({
    task_id: taskRow.id,
    metric_key: metricKey,
    label: metricLabel,
    target,
    points,
    kind,
    sort_order: 1,
  });

  if (metricError) {
    throw new Error(metricError.message);
  }

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function updateFocusBoardTaskAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const taskId = getValue(formData, "taskId");
  if (!taskId) {
    throw new Error("Task id missing.");
  }

  await admin
    .from("focus_board_tasks")
    .update({
      title: getValue(formData, "title"),
      description: getValue(formData, "description"),
      icon: (getValue(formData, "icon") || "TASK").toUpperCase().slice(0, 6),
      sticker_src: getValue(formData, "stickerSrc") || "/focus/mascot-rainbow.svg",
      sticker_alt: getValue(formData, "stickerAlt") || "Goal sticker",
    })
    .eq("id", taskId)
    .eq("board_key", FOCUS_BOARD_KEY);

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function toggleFocusBoardTaskVisibilityAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const taskId = getValue(formData, "taskId");
  const nextVisible = getValue(formData, "nextVisible");

  if (!taskId) {
    throw new Error("Task id missing.");
  }

  const shouldShow = nextVisible === "true";
  const taskUpdate = shouldShow
    ? {
        is_active: true,
        is_visible: true,
      }
    : {
        is_visible: false,
      };

  const { error: taskError } = await admin
    .from("focus_board_tasks")
    .update(taskUpdate)
    .eq("id", taskId)
    .eq("board_key", FOCUS_BOARD_KEY);

  if (taskError) {
    throw new Error(taskError.message);
  }

  if (shouldShow) {
    const { error: metricsError } = await admin.from("focus_board_task_metrics").update({ is_active: true }).eq("task_id", taskId);

    if (metricsError) {
      throw new Error(metricsError.message);
    }
  }

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function deleteFocusBoardTaskAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const taskId = getValue(formData, "taskId");
  if (!taskId) {
    throw new Error("Task id missing.");
  }

  await admin
    .from("focus_board_tasks")
    .update({
      is_active: false,
      is_visible: false,
    })
    .eq("id", taskId)
    .eq("board_key", FOCUS_BOARD_KEY);

  await admin.from("focus_board_task_metrics").update({ is_active: false }).eq("task_id", taskId);

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function addFocusBoardMetricAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const taskId = getValue(formData, "taskId");
  const metricLabel = getValue(formData, "metricLabel");

  if (!taskId || !metricLabel) {
    throw new Error("Metric details missing.");
  }

  const task = runtime.tasks.find((item) => item.id === taskId);
  if (!task) {
    throw new Error("Task not found.");
  }

  await admin.from("focus_board_task_metrics").insert({
    task_id: taskId,
    metric_key: normaliseFocusKey(getValue(formData, "metricKey") || metricLabel),
    label: metricLabel,
    target: Math.max(0, getIntValue(formData, "target", 0)),
    points: getIntValue(formData, "points", 1),
    kind: (getValue(formData, "kind") || "count") as FocusMetricKind,
    sort_order: task.metrics.length + 1,
  });

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function updateFocusBoardMetricAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const metricId = getValue(formData, "metricId");
  if (!metricId) {
    throw new Error("Metric id missing.");
  }

  await admin
    .from("focus_board_task_metrics")
    .update({
      label: getValue(formData, "label"),
      target: Math.max(0, getIntValue(formData, "target", 0)),
      points: getIntValue(formData, "points", 0),
      kind: (getValue(formData, "kind") || "count") as FocusMetricKind,
    })
    .eq("id", metricId);

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function deleteFocusBoardMetricAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const metricId = getValue(formData, "metricId");
  const taskId = getValue(formData, "taskId");

  if (!metricId || !taskId) {
    throw new Error("Metric context missing.");
  }

  const task = runtime.tasks.find((item) => item.id === taskId);
  if (!task) {
    throw new Error("Task not found.");
  }

  if (task.metrics.length <= 1) {
    throw new Error("Delete the whole challenge instead of removing its final metric.");
  }

  await admin.from("focus_board_task_metrics").update({ is_active: false }).eq("id", metricId);

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
}

export async function updateFocusRewardTierAction(formData: FormData) {
  const adminSlug = getValue(formData, "adminSlug");
  const runtime = await getAdminContext(adminSlug);
  const admin = createSupabaseAdminClient();

  const rewardId = getValue(formData, "rewardId");
  if (!rewardId) {
    throw new Error("Reward id missing.");
  }

  const { error } = await admin
    .from("focus_board_reward_tiers")
    .update({
      label: getValue(formData, "label"),
      description: getValue(formData, "description"),
      min_points: Math.max(0, getIntValue(formData, "minPoints", 0)),
      min_weeks_hit: Math.max(0, getIntValue(formData, "minWeeksHit", 0)),
      locked_sticker_src: getValue(formData, "lockedStickerSrc"),
      unlocked_sticker_src: getValue(formData, "unlockedStickerSrc"),
      sticker_alt: getValue(formData, "stickerAlt"),
    })
    .eq("id", rewardId)
    .eq("board_key", FOCUS_BOARD_KEY);

  if (error) {
    throw new Error(error.message);
  }

  revalidateFocusPaths(runtime.settings.boardSlug, runtime.settings.adminSlug);
  redirect(`/focus-control/${runtime.settings.adminSlug}`);
}
