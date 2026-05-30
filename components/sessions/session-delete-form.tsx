import { deleteSessionAction } from "@/app/sessions/actions";

type SessionDeleteFormProps = {
  sessionId: string;
  treatmentPlanId: string;
};

export function SessionDeleteForm({ sessionId, treatmentPlanId }: SessionDeleteFormProps) {
  return (
    <form action={deleteSessionAction}>
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="treatmentPlanId" type="hidden" value={treatmentPlanId} />
      <button className="button button-danger" type="submit">
        Delete session permanently
      </button>
    </form>
  );
}
