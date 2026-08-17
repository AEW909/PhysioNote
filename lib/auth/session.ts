import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppKey, StaffProfile, StaffRole } from "@/lib/auth/types";

export const CURRENT_APP_KEY: AppKey = "physio";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentProfile(): Promise<StaffProfile | null> {
  const user = await getSessionUser();

  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data: membership, error: membershipError } = await supabase
    .from("app_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("app_key", CURRENT_APP_KEY)
    .eq("active", true)
    .maybeSingle();

  if (!membership) {
    if (membershipError) {
      console.error("App membership lookup failed:", membershipError);
    }

    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return {
      ...profile,
      role: membership.role,
      app_key: CURRENT_APP_KEY,
    } satisfies StaffProfile;
  }

  const admin = createSupabaseAdminClient();
  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (adminProfile) {
    return {
      ...adminProfile,
      role: membership.role,
      app_key: CURRENT_APP_KEY,
    } satisfies StaffProfile;
  }

  if (error) {
    console.error("Profile lookup failed:", error);
  }

  return null;
}

export async function requireRole(allowedRoles: StaffRole[]) {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect("/no-access");
  }

  return profile satisfies StaffProfile;
}
