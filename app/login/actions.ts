"use server";

import { redirect } from "next/navigation";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { CURRENT_APP_KEY } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/site-url";

type ActionState = {
  error?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const nextPath = getSafeNextPath(readString(formData, "next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!user) {
    await supabase.auth.signOut();
    redirect("/no-access");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("app_memberships")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("app_key", CURRENT_APP_KEY)
    .eq("active", true)
    .maybeSingle();

  if (membershipError || !membership) {
    await supabase.auth.signOut();
    redirect("/no-access");
  }

  redirect(nextPath);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState & { success?: string }> {
  const email = readString(formData, "email");

  if (!email) {
    return { error: "Enter the email linked to the staff account." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "If that email exists in the system, a password reset link has been sent.",
  };
}
