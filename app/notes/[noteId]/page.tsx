import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { FollowUpAiSupport } from "@/components/notes/follow-up-ai-support";
import { NoteView } from "@/components/notes/note-view";
import { SessionArchiveToggleForm } from "@/components/sessions/session-archive-toggle-form";
import { SessionDeleteForm } from "@/components/sessions/session-delete-form";
import { getAppointment } from "@/lib/appointments/queries";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { getClinicalNote } from "@/lib/notes/queries";
import { getPatient } from "@/lib/patients/queries";
import { getTreatmentPlan } from "@/lib/treatment-plans/queries";

type NoteDetailPageProps = {
  params: Promise<{ noteId: string }>;
};

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const { noteId } = await params;
  const note = await getClinicalNote(noteId);
  const patient = await getPatient(note.patient_id);
  const appointment = note.appointment_id ? await getAppointment(note.appointment_id) : null;
  const treatmentPlan = note.treatment_plan_id ? await getTreatmentPlan(note.treatment_plan_id) : null;
  const previousSessions = treatmentPlan?.sessions.filter((session) => session.note_id !== note.id) ?? [];

  return (
    <AppShell
      title={note.title}
      description="Structured session note built from the physio record-card workflow."
      eyebrow="Session note"
      breadcrumbs={[
        { label: "Patients", href: "/patients" },
        { label: `${patient.first_name} ${patient.last_name}`, href: `/patients/${patient.id}` },
        ...(treatmentPlan ? [{ label: treatmentPlan.title, href: `/treatment-plans/${treatmentPlan.id}` }] : []),
        { label: note.title },
      ]}
      profile={profile}
    >
      <div className="workspace-actions workspace-actions-spread">
        <div className="workspace-actions">
          <Link className="button button-secondary" href={`/patients/${patient.id}`}>
            Back to patient
          </Link>
          {treatmentPlan ? (
            <Link className="button button-secondary" href={`/treatment-plans/${treatmentPlan.id}`}>
              Back to treatment plan
            </Link>
          ) : null}
        </div>
        <div className="workspace-actions">
          {appointment && treatmentPlan && (profile.role === "owner" || profile.role === "admin") ? (
            <SessionArchiveToggleForm
              isArchived={appointment.is_archived}
              sessionId={appointment.id}
              treatmentPlanId={treatmentPlan.id}
            />
          ) : null}
          {appointment && treatmentPlan && profile.role === "owner" && appointment.is_archived ? (
            <SessionDeleteForm sessionId={appointment.id} treatmentPlanId={treatmentPlan.id} />
          ) : null}
        </div>
      </div>

      <div className="detail-grid">
        <section className="card stack">
          <h2>Note context</h2>
          <dl className="detail-list">
            <div>
              <dt>Patient</dt>
              <dd>
                {patient.first_name} {patient.last_name}
              </dd>
            </div>
            <div>
              <dt>Note type</dt>
              <dd>{note.note_type.replace("_", " ")}</dd>
            </div>
            {appointment ? (
              <div>
                <dt>Session date and time</dt>
                <dd>
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(appointment.scheduled_at))}
                </dd>
              </div>
            ) : null}
            {appointment ? (
              <div>
                <dt>Location</dt>
                <dd>{appointment.location || "Not recorded"}</dd>
              </div>
            ) : null}
            <div>
              <dt>Status</dt>
              <dd>{note.status}</dd>
            </div>
          </dl>
        </section>

        {treatmentPlan ? (
          <section className="card stack">
            <h2>Treatment plan context</h2>
            <dl className="detail-list">
              <div>
                <dt>Plan</dt>
                <dd>{treatmentPlan.title}</dd>
              </div>
              <div>
                <dt>Goals summary</dt>
                <dd>{treatmentPlan.goals_summary || "Blank for now. This can be AI-assisted later."}</dd>
              </div>
              <div>
                <dt>Progress summary</dt>
                <dd>{treatmentPlan.progress_summary || "Blank for now. This can be updated across follow-ups later."}</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>

      {treatmentPlan ? (
        <details className="plan-panel">
          <summary className="plan-summary-bar">
            <div>
              <h3>Previous sessions in this treatment plan</h3>
              <p>{previousSessions.length} earlier session{previousSessions.length === 1 ? "" : "s"} available for context.</p>
            </div>
          </summary>
          <div className="plan-panel-body stack">
            {previousSessions.length ? (
              <div className="patient-list">
                {previousSessions.map((session) => (
                  <Link
                    className="patient-row"
                    href={session.note_id ? `/notes/${session.note_id}` : `/sessions/${session.id}`}
                    key={session.id}
                  >
                    <div>
                      <h3>{session.note_title || session.appointment_type}</h3>
                      <p>
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(session.scheduled_at))}
                      </p>
                    </div>
                    <div className="patient-row-meta">
                      <span className="status-pill">{(session.note_type || "session").replaceAll("_", " ")}</span>
                      <span>{session.location || "No location"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="lede">This is the first session in the treatment plan.</p>
            )}
          </div>
        </details>
      ) : null}

      {note.note_type === "follow_up" ? <FollowUpAiSupport noteId={note.id} /> : null}

      <NoteView note={note} patient={patient} />
    </AppShell>
  );
}
