import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PlanSessionList } from "@/components/treatment-plans/treatment-plan-list";
import { TreatmentPlanArchiveToggleForm } from "@/components/treatment-plans/treatment-plan-archive-toggle-form";
import { TreatmentPlanDeleteForm } from "@/components/treatment-plans/treatment-plan-delete-form";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { getPatient } from "@/lib/patients/queries";
import { getTreatmentPlan } from "@/lib/treatment-plans/queries";

type TreatmentPlanDetailPageProps = {
  params: Promise<{ planId: string }>;
};

function formatDateTime(date: string | null) {
  if (!date) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function TreatmentPlanDetailPage({ params }: TreatmentPlanDetailPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const { planId } = await params;
  const plan = await getTreatmentPlan(planId);
  const patient = await getPatient(plan.patient_id);

  return (
    <AppShell
      title={plan.title}
      description="Treatment-plan view with grouped sessions, summaries, and a clean place to continue care over time."
      eyebrow="Treatment plan"
      breadcrumbs={[
        { label: "Patients", href: "/patients" },
        { label: `${patient.first_name} ${patient.last_name}`, href: `/patients/${patient.id}` },
        { label: plan.title },
      ]}
      profile={profile}
    >
      <div className="workspace-actions workspace-actions-spread">
        <div className="workspace-actions">
          <Link className="button button-secondary" href={`/patients/${patient.id}`}>
            Back to patient
          </Link>
          <Link className="button button-secondary" href={`/treatment-plans/${plan.id}/edit`}>
            Edit plan
          </Link>
          {!plan.is_archived && plan.status !== "completed" ? (
            <Link className="button button-primary" href={`/treatment-plans/${plan.id}/sessions/new`}>
              {plan.sessions.length ? "Add follow-up" : "Start initial assessment"}
            </Link>
          ) : null}
        </div>
        <div className="workspace-actions">
          {profile.role === "owner" || profile.role === "admin" ? (
            <TreatmentPlanArchiveToggleForm isArchived={plan.is_archived} patientId={patient.id} planId={plan.id} />
          ) : null}
          {profile.role === "owner" &&
          plan.is_archived &&
          plan.sessions.length === 0 &&
          plan.archived_sessions.length === 0 ? (
            <TreatmentPlanDeleteForm patientId={patient.id} planId={plan.id} />
          ) : null}
        </div>
      </div>

      <div className="detail-grid">
        <section className="card stack">
          <h2>Plan details</h2>
          <dl className="detail-list">
            <div>
              <dt>Patient</dt>
              <dd>
                {patient.first_name} {patient.last_name}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{plan.status.replace("_", " ")}</dd>
            </div>
            <div>
              <dt>Date of first session</dt>
              <dd>{formatDateTime(plan.first_session_at)}</dd>
            </div>
            <div>
              <dt>Completed at</dt>
              <dd>{formatDateTime(plan.completed_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="card stack">
          <h2>Summaries</h2>
          <dl className="detail-list">
            <div>
              <dt>Presenting problem summary</dt>
              <dd>{plan.presenting_problem_summary || "Blank for now. This can be AI-assisted later from the initial assessment."}</dd>
            </div>
            <div>
              <dt>Goals summary</dt>
              <dd>{plan.goals_summary || "Blank for now. This can be AI-assisted later from the initial assessment."}</dd>
            </div>
            <div>
              <dt>Progress summary</dt>
              <dd>{plan.progress_summary || "Blank for now. This can be updated across follow-up sessions later."}</dd>
            </div>
            <div>
              <dt>Overall findings</dt>
              <dd>{plan.overall_findings || "Blank for now. This can be completed at discharge."}</dd>
            </div>
          </dl>
        </section>
      </div>

      <PlanSessionList
        sessions={plan.sessions}
        title="Sessions"
        description="Sessions in this treatment plan, ordered with the most recent first."
      />
      {plan.archived_sessions.length ? (
        <details className="plan-panel">
          <summary className="plan-summary-bar">
            <div className="plan-summary-main">
              <span aria-hidden="true" className="plan-toggle-icon" />
            </div>
            <div>
              <h3>Archived sessions</h3>
              <p>{plan.archived_sessions.length} archived session{plan.archived_sessions.length === 1 ? "" : "s"} hidden from the active treatment timeline.</p>
            </div>
          </summary>
          <div className="plan-panel-body">
            <PlanSessionList
              sessions={plan.archived_sessions}
              title="Archived sessions"
              description="Archived sessions are retained for auditability and can be restored if needed."
            />
          </div>
        </details>
      ) : null}
      {profile.role === "owner" ? (
        <section className="card stack">
          <h2>Record management</h2>
          <p className="lede">
            Archived sessions can be deleted permanently from their note page. Treatment plans can only be deleted once they are archived and completely empty.
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}
