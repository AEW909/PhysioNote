"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createNoteTemplateContent, NOTE_TYPE_LABELS } from "@/lib/notes/templates";
import type { NoteType } from "@/lib/notes/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateAppointmentState = {
  error?: string;
};

const appointmentSchema = z.object({
  patientId: z.string().uuid("Patient ID is missing."),
  treatmentPlanId: z.string().uuid("Treatment plan ID is missing."),
  scheduledAt: z.string().trim().min(1, "Appointment date and time are required."),
  noteType: z.enum(["initial_assessment", "follow_up"]),
  location: z.string().trim().optional(),
});

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createAppointmentAction(
  _prevState: CreateAppointmentState,
  formData: FormData,
): Promise<CreateAppointmentState> {
  const parsed = appointmentSchema.safeParse({
    patientId: getValue(formData, "patientId"),
    treatmentPlanId: getValue(formData, "treatmentPlanId"),
    scheduledAt: getValue(formData, "scheduledAt"),
    noteType: getValue(formData, "noteType"),
    location: getValue(formData, "location"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter the required appointment details.",
    };
  }

  const user = await requireUser();
  const values = parsed.data;
  const supabase = await createSupabaseServerClient();
  const sessionTitle = NOTE_TYPE_LABELS[values.noteType as NoteType];

  const { data: planData, error: planError } = await supabase
    .from("treatment_plans")
    .select("id")
    .eq("id", values.treatmentPlanId)
    .eq("patient_id", values.patientId)
    .maybeSingle();

  if (planError || !planData) {
    return {
      error: planError?.message ?? "Treatment plan not found for this patient.",
    };
  }

  const { count: existingSessionCount, error: countError } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("treatment_plan_id", values.treatmentPlanId);

  if (countError) {
    return {
      error: countError.message,
    };
  }

  const hasSessions = (existingSessionCount ?? 0) > 0;

  if (!hasSessions && values.noteType !== "initial_assessment") {
    return {
      error: "Treatment plans must start with an initial assessment.",
    };
  }

  if (hasSessions && values.noteType === "initial_assessment") {
    return {
      error: "This treatment plan already has its initial assessment.",
    };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: values.patientId,
      treatment_plan_id: values.treatmentPlanId,
      scheduled_at: new Date(values.scheduledAt).toISOString(),
      appointment_type: sessionTitle,
      status: "completed",
      location: values.location || null,
      clinician_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create the session.",
    };
  }

  const { data: noteData, error: noteError } = await supabase
    .from("clinical_notes")
    .insert({
      patient_id: values.patientId,
      appointment_id: data.id,
      treatment_plan_id: values.treatmentPlanId,
      note_type: values.noteType,
      title: sessionTitle,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (noteError || !noteData) {
    return {
      error: noteError?.message ?? "Failed to create the session note.",
    };
  }

  const { data: versionData, error: versionError } = await supabase
    .from("note_versions")
    .insert({
      clinical_note_id: noteData.id,
      source_type: "clinician_template",
      content: createNoteTemplateContent(values.noteType as NoteType),
      created_by: user.id,
      is_current: true,
    })
    .select("id")
    .single();

  if (versionError || !versionData) {
    return {
      error: versionError?.message ?? "Failed to create the session content.",
    };
  }

  const { error: linkError } = await supabase
    .from("clinical_notes")
    .update({ current_version_id: versionData.id })
    .eq("id", noteData.id);

  if (linkError) {
    return {
      error: linkError.message,
    };
  }

  if (!hasSessions) {
    const { error: updatePlanError } = await supabase
      .from("treatment_plans")
      .update({
        first_session_at: new Date(values.scheduledAt).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", values.treatmentPlanId);

    if (updatePlanError) {
      return {
        error: updatePlanError.message,
      };
    }
  }

  redirect(`/notes/${noteData.id}`);
}
