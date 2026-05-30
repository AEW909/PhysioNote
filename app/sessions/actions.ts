"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile, requireRole, requireUser } from "@/lib/auth/session";
import { insertAuditLog } from "@/lib/audit/insert-audit-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function archiveSessionAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = getValue(formData, "sessionId");
  const treatmentPlanId = getValue(formData, "treatmentPlanId");

  if (!sessionId || !treatmentPlanId) {
    throw new Error("Session ID or treatment plan ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: session, error: fetchError } = await supabase
    .from("appointments")
    .select("id, is_archived")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) {
    throw new Error(fetchError?.message ?? "Failed to load session before archive.");
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user.id,
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  await insertAuditLog({
    action: "archive_session",
    actorProfileId: user.id,
    beforeState: { is_archived: session.is_archived },
    afterState: { is_archived: true },
    entityId: sessionId,
    entityType: "session",
  });

  redirect(`/treatment-plans/${treatmentPlanId}`);
}

export async function restoreSessionAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = getValue(formData, "sessionId");
  const treatmentPlanId = getValue(formData, "treatmentPlanId");

  if (!sessionId || !treatmentPlanId) {
    throw new Error("Session ID or treatment plan ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: session, error: fetchError } = await supabase
    .from("appointments")
    .select("id, is_archived")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) {
    throw new Error(fetchError?.message ?? "Failed to load session before restore.");
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      is_archived: false,
      archived_at: null,
      archived_by: null,
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  await insertAuditLog({
    action: "restore_session",
    actorProfileId: user.id,
    beforeState: { is_archived: session.is_archived },
    afterState: { is_archived: false },
    entityId: sessionId,
    entityType: "session",
  });

  redirect(`/treatment-plans/${treatmentPlanId}`);
}

export async function deleteSessionAction(formData: FormData) {
  await requireRole(["owner"]);
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const sessionId = getValue(formData, "sessionId");
  const treatmentPlanId = getValue(formData, "treatmentPlanId");

  if (!sessionId || !treatmentPlanId) {
    throw new Error("Session ID or treatment plan ID is missing.");
  }

  if (!profile || profile.role !== "owner") {
    throw new Error("Only owners can permanently delete sessions.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: session, error: fetchError } = await supabase
    .from("appointments")
    .select("id, is_archived, appointment_type, scheduled_at, location")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) {
    throw new Error(fetchError?.message ?? "Failed to load session before delete.");
  }

  if (!session.is_archived) {
    throw new Error("Archive the session before deleting it permanently.");
  }

  const { data: notes, error: notesError } = await supabase
    .from("clinical_notes")
    .select("id, note_type, status")
    .eq("appointment_id", sessionId);

  if (notesError) {
    throw new Error(notesError.message);
  }

  const noteIds = (notes ?? []).map((note) => note.id);

  if (noteIds.length) {
    const { error: clearLinkError } = await supabase
      .from("clinical_notes")
      .update({ current_version_id: null })
      .in("id", noteIds);

    if (clearLinkError) {
      throw new Error(clearLinkError.message);
    }

    const { error: deleteVersionsError } = await supabase
      .from("note_versions")
      .delete()
      .in("clinical_note_id", noteIds);

    if (deleteVersionsError) {
      throw new Error(deleteVersionsError.message);
    }

    const { error: deleteNotesError } = await supabase
      .from("clinical_notes")
      .delete()
      .in("id", noteIds);

    if (deleteNotesError) {
      throw new Error(deleteNotesError.message);
    }
  }

  const { error: deleteSessionError } = await supabase
    .from("appointments")
    .delete()
    .eq("id", sessionId);

  if (deleteSessionError) {
    throw new Error(deleteSessionError.message);
  }

  await insertAuditLog({
    action: "delete_session",
    actorProfileId: user.id,
    beforeState: {
      appointment_type: session.appointment_type,
      scheduled_at: session.scheduled_at,
      location: session.location,
      is_archived: session.is_archived,
      linked_notes: notes ?? [],
    },
    afterState: {
      deleted: true,
      linked_note_count: noteIds.length,
    },
    entityId: sessionId,
    entityType: "session",
  });

  redirect(`/treatment-plans/${treatmentPlanId}`);
}
