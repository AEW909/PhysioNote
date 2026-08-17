"use client";

import { useActionState } from "react";
import { createAppointmentAction } from "@/app/appointments/actions";
import { NOTE_TYPE_LABELS } from "@/lib/notes/templates";

type CreateAppointmentFormProps = {
  patientId: string;
  treatmentPlanId: string;
  allowedNoteTypes?: Array<"initial_assessment" | "follow_up">;
};

const initialState = {
  error: "",
};

function getDefaultDateTimeLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function CreateAppointmentForm({
  patientId,
  treatmentPlanId,
  allowedNoteTypes = ["follow_up"],
}: CreateAppointmentFormProps) {
  const [state, formAction, pending] = useActionState(createAppointmentAction, initialState);

  return (
    <form className="patient-form" action={formAction}>
      <input name="patientId" type="hidden" value={patientId} />
      <input name="treatmentPlanId" type="hidden" value={treatmentPlanId} />

      <div className="patient-form-grid">
        <label className="field">
          <span>Session type</span>
          <select className="select-field" defaultValue={allowedNoteTypes[0]} name="noteType" required>
            {allowedNoteTypes.map((noteType) => (
              <option key={noteType} value={noteType}>
                {NOTE_TYPE_LABELS[noteType]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Date and time</span>
          <input defaultValue={getDefaultDateTimeLocal()} name="scheduledAt" type="datetime-local" required />
        </label>

        <label className="field">
          <span>Location</span>
          <input defaultValue="Clinic" name="location" type="text" />
        </label>
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Creating session..." : "Create session"}
      </button>
    </form>
  );
}
