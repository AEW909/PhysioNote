import { readdir } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const FOCUS_ASSET_BUCKET = "focus-assets";
export const FOCUS_ASSET_FOLDER = "focus";

const PUBLIC_FOCUS_DIR = path.join(process.cwd(), "public", "focus");
const IMAGE_EXTENSIONS = new Set([".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);

export type FocusAssetOption = {
  label: string;
  value: string;
  source: "bundled" | "uploaded";
};

function formatAssetLabel(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function listBundledFocusAssets(): Promise<FocusAssetOption[]> {
  try {
    const entries = await readdir(PUBLIC_FOCUS_DIR, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => ({
        label: formatAssetLabel(entry.name),
        value: `/focus/${entry.name}`,
        source: "bundled" as const,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    return [];
  }
}

async function listUploadedFocusAssets(): Promise<FocusAssetOption[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(FOCUS_ASSET_BUCKET).list(FOCUS_ASSET_FOLDER, {
    limit: 100,
    sortBy: { column: "name", order: "asc" },
  });

  if (error || !data) {
    return [];
  }

  return data
    .filter((item) => item.name && IMAGE_EXTENSIONS.has(path.extname(item.name).toLowerCase()))
    .map((item) => {
      const filePath = `${FOCUS_ASSET_FOLDER}/${item.name}`;
      const { data: publicUrl } = admin.storage.from(FOCUS_ASSET_BUCKET).getPublicUrl(filePath);

      return {
        label: formatAssetLabel(item.name),
        value: publicUrl.publicUrl,
        source: "uploaded" as const,
      };
    });
}

export async function getFocusAssetOptions() {
  const [bundled, uploaded] = await Promise.all([
    listBundledFocusAssets(),
    listUploadedFocusAssets(),
  ]);

  return [...bundled, ...uploaded];
}
