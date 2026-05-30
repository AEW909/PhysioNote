"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentProfile, requireRole, requireUser } from "@/lib/auth/session";
import { insertAuditLog } from "@/lib/audit/insert-audit-log";
import { generateTreatmentPlanSummaries } from "@/lib/ai/treatment-plan-summaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateTreatmentPlanState = {
  error?: string;
};

const treatmentPlanSchema = z.object({
  patientId: z.string().uuid("Patient ID is missing."),
  title: z.string().trim().min(1, "Treatment plan name is required."),
});

const updateTreatmentPlanSchema = z.object({
  planId: z.string().uuid("Treatment plan ID is missing."),
  title: z.string().trim().min(1, "Treatment plan name is required."),
  status: z.enum(["active", "completed", "on_hold"]),
  presentingProblemSummary: z.string().trim().optional(),
  goalsSummary: z.string().trim().optional(),
  progressSummary: z.string().trim().optional(),
  overallFindings: z.string().trim().optional(),
});

const generateTreatmentPlanSummariesSchema = z.object({
  noteId: z.string().uuid("Note ID is missing."),
  planId: z.string().uuid("Treatment plan ID is missing."),
});

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createTreatmentPlanAction(
  _prevState: CreateTreatmentPlanState,
  formData: FormData,
): Promise<CreateTreatmentPlanState> {
  const parsed = treatmentPlanSchema.safeParse({
    patientId: getValue(formData, "patientId"),
    title: getValue(formData, "title"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter the required treatment plan details.",
    };
  }

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatment_plans")
    .insert({
      patient_id: parsed.data.patientId,
      title: parsed.data.title,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create treatment plan.",
    };
  }

  redirect(`/treatment-plans/${data.id}/sessions/new`);
}

export async function updateTreatmentPlanAction(
  _prevState: CreateTreatmentPlanState,
  formData: FormData,
): Promise<CreateTreatmentPlanState> {
  const parsed = updateTreatmentPlanSchema.safeParse({
    planId: getValue(formData, "planId"),
    title: getValue(formData, "title"),
    status: getValue(formData, "status"),
    presentingProblemSummary: getValue(formData, "presentingProblemSummary"),
    goalsSummary: getValue(formData, "goalsSummary"),
    progressSummary: getValue(formData, "progressSummary"),
    overallFindings: getValue(formData, "overallFindings"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter the required treatment plan details.",
    };
  }

  await requireUser();
  const supabase = await createSupabaseServerClient();
  const values = parsed.data;
  const completedAt = values.status === "completed" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("treatment_plans")
    .update({
      title: values.title,
      status: values.status,
      presenting_problem_summary: values.presentingProblemSummary || null,
      goals_summary: values.goalsSummary || null,
      progress_summary: values.progressSummary || null,
      overall_findings: values.overallFindings || null,
      completed_at: completedAt,
    })
    .eq("id", values.planId);

  if (error) {
    return {
      error: error.message ?? "Failed to update treatment plan.",
    };
  }

  redirect(`/treatment-plans/${values.planId}`);
}

export async function archiveTreatmentPlanAction(formData: FormData) {
  const user = await requireUser();
  const planId = getValue(formData, "planId");
  const patientId = getValue(formData, "patientId");

  if (!planId || !patientId) {
    throw new Error("Treatment plan ID or patient ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: plan, error: fetchError } = await supabase
    .from("treatment_plans")
    .select("id, is_archived")
    .eq("id", planId)
    .single();

  if (fetchError || !plan) {
    throw new Error(fetchError?.message ?? "Failed to load treatment plan before archive.");
  }

  const { error } = await supabase
    .from("treatment_plans")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user.id,
    })
    .eq("id", planId);

  if (error) {
    throw new Error(error.message);
  }

  await insertAuditLog({
    action: "archive_treatment_plan",
    actorProfileId: user.id,
    beforeState: { is_archived: plan.is_archived },
    afterState: { is_archived: true },
    entityId: planId,
    entityType: "treatment_plan",
  });

  redirect(`/patients/${patientId}`);
}

export async function restoreTreatmentPlanAction(formData: FormData) {
  const user = await requireUser();
  const planId = getValue(formData, "planId");
  const patientId = getValue(formData, "patientId");

  if (!planId || !patientId) {
    throw new Error("Treatment plan ID or patient ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: plan, error: fetchError } = await supabase
    .from("treatment_plans")
    .select("id, is_archived")
    .eq("id", planId)
    .single();

  if (fetchError || !plan) {
    throw new Error(fetchError?.message ?? "Failed to load treatment plan before restore.");
  }

  const { error } = await supabase
    .from("treatment_plans")
    .update({
      is_archived: false,
      archived_at: null,
      archived_by: null,
    })
    .eq("id", planId);

  if (error) {
    throw new Error(error.message);
  }

  await insertAuditLog({
    action: "restore_treatment_plan",
    actorProfileId: user.id,
    beforeState: { is_archived: plan.is_archived },
    afterState: { is_archived: false },
    entityId: planId,
    entityType: "treatment_plan",
  });

  redirect(`/patients/${patientId}`);
}

export async function deleteTreatmentPlanAction(formData: FormData) {
  await requireRole(["owner"]);
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const planId = getValue(formData, "planId");
  const patientId = getValue(formData, "patientId");

  if (!planId || !patientId) {
    throw new Error("Treatment plan ID or patient ID is missing.");
  }

  if (!profile || profile.role !== "owner") {
    throw new Error("Only owners can permanently delete treatment plans.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: plan, error: planError } = await supabase
    .from("treatment_plans")
    .select("id, title, status, is_archived")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? "Failed to load treatment plan before delete.");
  }

  if (!plan.is_archived) {
    throw new Error("Archive the treatment plan before deleting it permanently.");
  }

  const { count: linkedSessionCount, error: sessionCountError } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("treatment_plan_id", planId);

  if (sessionCountError) {
    throw new Error(sessionCountError.message);
  }

  if ((linkedSessionCount ?? 0) > 0) {
    throw new Error("Only empty archived treatment plans can be deleted permanently.");
  }

  const { error: deleteError } = await supabase
    .from("treatment_plans")
    .delete()
    .eq("id", planId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await insertAuditLog({
    action: "delete_treatment_plan",
    actorProfileId: user.id,
    beforeState: {
      title: plan.title,
      status: plan.status,
      is_archived: plan.is_archived,
      linked_session_count: linkedSessionCount ?? 0,
    },
    afterState: {
      deleted: true,
    },
    entityId: planId,
    entityType: "treatment_plan",
  });

  redirect(`/patients/${patientId}`);
}

export async function generateTreatmentPlanSummariesAction(
  _prevState: CreateTreatmentPlanState,
  formData: FormData,
): Promise<CreateTreatmentPlanState> {
  const parsed = generateTreatmentPlanSummariesSchema.safeParse({
    noteId: getValue(formData, "noteId"),
    planId: getValue(formData, "planId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "The note or treatment plan context is missing.",
    };
  }

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: note, error: noteError } = await supabase
    .from("clinical_notes")
    .select("id, note_type, treatment_plan_id, current_version_id")
    .eq("id", parsed.data.noteId)
    .maybeSingle();

  if (noteError || !note) {
    return {
      error: noteError?.message ?? "Unable to load the note for AI summarisation.",
    };
  }

  if (note.note_type !== "initial_assessment") {
    return {
      error: "AI plan summaries can only be generated from an initial assessment.",
    };
  }

  if (!note.treatment_plan_id || note.treatment_plan_id !== parsed.data.planId) {
    return {
      error: "This note is not linked to the selected treatment plan.",
    };
  }

  if (!note.current_version_id) {
    return {
      error: "Save the initial assessment note first so AI has content to work from.",
    };
  }

  const { data: version, error: versionError } = await supabase
    .from("note_versions")
    .select("content")
    .eq("id", note.current_version_id)
    .maybeSingle();

  if (versionError || !version) {
    return {
      error: versionError?.message ?? "Unable to load the current note content.",
    };
  }

  const { data: plan, error: planError } = await supabase
    .from("treatment_plans")
    .select("id, title, presenting_problem_summary, goals_summary, progress_summary")
    .eq("id", parsed.data.planId)
    .maybeSingle();

  if (planError || !plan) {
    return {
      error: planError?.message ?? "Unable to load the treatment plan before generating summaries.",
    };
  }

  try {
    const summaries = await generateTreatmentPlanSummaries({
      planTitle: plan.title,
      noteContent:
        version.content && typeof version.content === "object" && !Array.isArray(version.content)
          ? (version.content as Record<string, unknown>)
          : {},
    });

    const beforeState = {
      presenting_problem_summary: plan.presenting_problem_summary,
      goals_summary: plan.goals_summary,
      progress_summary: plan.progress_summary,
    };

    const afterState = {
      presenting_problem_summary: summaries.presentingProblemSummary,
      goals_summary: summaries.goalsSummary,
      progress_summary: summaries.progressSummary,
      source_note_id: note.id,
      source: "initial_assessment_ai_summary",
    };

    const { error: updateError } = await supabase
      .from("treatment_plans")
      .update({
        presenting_problem_summary: summaries.presentingProblemSummary,
        goals_summary: summaries.goalsSummary,
        progress_summary: summaries.progressSummary,
      })
      .eq("id", parsed.data.planId);

    if (updateError) {
      return {
        error: updateError.message ?? "AI suggestions were generated but could not be saved to the treatment plan.",
      };
    }

    await insertAuditLog({
      action: "generate_treatment_plan_summaries",
      actorProfileId: user.id,
      beforeState,
      afterState,
      entityId: parsed.data.planId,
      entityType: "treatment_plan",
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to generate AI treatment plan summaries.",
    };
  }

  redirect(`/treatment-plans/${parsed.data.planId}/edit?aiGenerated=1`);
}
