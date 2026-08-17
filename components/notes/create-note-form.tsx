"use client";

import { useActionState } from "react";
import { createNoteAction } from "@/app/notes/actions";

type CreateNoteFormProps = {
  appointmentId: string;
  patientId: string;
};

const initialState = {
  error: "",
};

export function CreateNoteForm({ appointmentId, patientId }: CreateNoteFormProps) {
  const [state, formAction, pending] = useActionState(createNoteAction, initialState);

  return (
    <form className="note-create-form" action={formAction}>
      <input name="appointmentId" type="hidden" value={appointmentId} />
      <input name="patientId" type="hidden" value={patientId} />

      <label className="field">
        <span>Note type</span>
        <select className="select-field" defaultValue="follow_up" name="noteType">
          <option value="initial_assessment">Initial assessment</option>
          <option value="follow_up">Follow-up</option>
        </select>
      </label>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Creating note..." : "Create note"}
      </button>
    </form>
  );
}
