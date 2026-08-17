import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateAppointmentForm } from "@/components/appointments/create-appointment-form";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { getPatient } from "@/lib/patients/queries";
import { getTreatmentPlan } from "@/lib/treatment-plans/queries";
type NewPlanSessionPageProps = {
  params: Promise<{ planId: string }>;
};

export default async function NewPlanSessionPage({ params }: NewPlanSessionPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const { planId } = await params;
  const plan = await getTreatmentPlan(planId);
  const patient = await getPatient(plan.patient_id);

  if (plan.is_archived || plan.status === "completed") {
    redirect(`/treatment-plans/${plan.id}`);
  }

  const allowedNoteTypes: Array<"initial_assessment" | "follow_up"> = plan.sessions.length
    ? ["follow_up"]
    : ["initial_assessment"];

  return (
    <AppShell
      title={plan.sessions.length ? `New follow-up in ${plan.title}` : `Initial assessment for ${plan.title}`}
      description="Sessions are created from inside the treatment plan so each episode of care stays grouped together."
      profile={profile}
    >
      <div className="workspace-actions">
        <Link className="button button-secondary" href={`/treatment-plans/${plan.id}`}>
          Back to treatment plan
        </Link>
      </div>

      <section className="card stack">
        <CreateAppointmentForm
          allowedNoteTypes={allowedNoteTypes}
          patientId={patient.id}
          treatmentPlanId={plan.id}
        />
      </section>
    </AppShell>
  );
}
