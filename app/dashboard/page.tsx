import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AcupunctureConsentQueue } from "@/components/dashboard/acupuncture-consent-queue";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard/queries";

function formatDate(dateString: string | null) {
  if (!dateString) {
    return "Not started yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;

  return `Updated ${formatDate(dateString)}`;
}

export default async function DashboardPage() {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found. Seed the profiles table before continuing.");
  }

  const dashboard = await getDashboardData(profile.id);
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <AppShell
      title="Dashboard"
      description="A clearer view of active records, draft work, and the next clinical actions worth taking today."
      profile={profile}
    >
      <section className="dashboard-hero-grid">
        <article className="card dashboard-hero-card">
          <p className="eyebrow">Ready for clinic use</p>
          <h2>Welcome back, {firstName}.</h2>
          <p className="lede">
            Start from the patient record, continue active treatment plans, and keep draft notes
            moving without digging through the system.
          </p>
          <div className="dashboard-hero-actions">
            <Link className="button button-primary" href="/patients">
              Open patient directory
            </Link>
            <Link className="button button-secondary" href="/patients/new">
              Register new patient
            </Link>
          </div>
        </article>
      </section>

      <section className="dashboard-metric-grid">
        <article className="card dashboard-metric-card">
          <p className="dashboard-metric-label">Active patients</p>
          <p className="dashboard-metric-value">{dashboard.caseload.activePatients}</p>
          <p className="dashboard-metric-note">Patients in your current active caseload.</p>
        </article>
        <article className="card dashboard-metric-card">
          <p className="dashboard-metric-label">Active plans</p>
          <p className="dashboard-metric-value">{dashboard.caseload.activeTreatmentPlans}</p>
          <p className="dashboard-metric-note">Treatment plans you are currently managing.</p>
        </article>
        <article className="card dashboard-metric-card">
          <p className="dashboard-metric-label">Draft notes</p>
          <p className="dashboard-metric-value">{dashboard.caseload.draftNotes}</p>
          <p className="dashboard-metric-note">Your notes that still need clinician completion.</p>
        </article>
      </section>

      <section className="dashboard-detail-grid">
        <article className="card dashboard-list-card">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">Recently updated</p>
              <h2>Patient records</h2>
            </div>
            <Link className="button button-secondary button-small" href="/patients">
              View all patients
            </Link>
          </div>

          {dashboard.recentPatients.length ? (
            <div className="dashboard-list">
              {dashboard.recentPatients.map((patient) => (
                <Link className="dashboard-list-row" href={`/patients/${patient.id}`} key={patient.id}>
                  <div>
                    <h3>
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <p>{formatRelativeDate(patient.updated_at)}</p>
                  </div>
                  <span className="dashboard-list-link">Open</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty-state">
              No patient records yet. Add the first patient to start building the live directory.
            </p>
          )}
        </article>

        <article className="card dashboard-list-card">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">In progress</p>
              <h2>Active treatment plans</h2>
              <p className="dashboard-section-note">Showing the most recently updated active plans.</p>
            </div>
          </div>

          {dashboard.activePlans.length ? (
            <div className="dashboard-list">
              {dashboard.activePlans.map((plan) => (
                <Link className="dashboard-list-row" href={`/treatment-plans/${plan.id}`} key={plan.id}>
                  <div>
                    <h3>{plan.title}</h3>
                    <p>
                      {plan.patient ? `${plan.patient.first_name} ${plan.patient.last_name}` : "Patient unavailable"}
                    </p>
                  </div>
                  <div className="dashboard-row-meta">
                    <span className="status-pill">{plan.status.replace("_", " ")}</span>
                    <p>Started {formatDate(plan.first_session_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty-state">
              No active treatment plans yet. New plans will appear here once they are created from a
              patient record.
            </p>
          )}
        </article>

        <article className="card dashboard-list-card dashboard-list-card-wide">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">Needs finishing</p>
              <h2>Your draft notes</h2>
              <p className="dashboard-section-note">
                Showing the latest {dashboard.draftNotes.length} of {dashboard.caseload.draftNotes}.
              </p>
            </div>
          </div>

          {dashboard.draftNotes.length ? (
            <div className="dashboard-list">
              {dashboard.draftNotes.map((note) => (
                <Link className="dashboard-list-row" href={`/notes/${note.id}`} key={note.id}>
                  <div>
                    <h3>{note.title}</h3>
                    <p>
                      {note.patient ? `${note.patient.first_name} ${note.patient.last_name}` : "Patient unavailable"}
                    </p>
                  </div>
                  <div className="dashboard-row-meta">
                    <span className="status-pill">{note.note_type.replace("_", " ")}</span>
                    <p>{formatRelativeDate(note.updated_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty-state">
              No draft notes at the moment. Finished records should stay out of the way and leave this
              list clear.
            </p>
          )}
        </article>

        <AcupunctureConsentQueue items={dashboard.outstandingAcupunctureConsents} />
      </section>
    </AppShell>
  );
}
