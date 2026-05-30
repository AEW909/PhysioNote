import { deleteTreatmentPlanAction } from "@/app/treatment-plans/actions";

type TreatmentPlanDeleteFormProps = {
  patientId: string;
  planId: string;
};

export function TreatmentPlanDeleteForm({ patientId, planId }: TreatmentPlanDeleteFormProps) {
  return (
    <form action={deleteTreatmentPlanAction}>
      <input name="planId" type="hidden" value={planId} />
      <input name="patientId" type="hidden" value={patientId} />
      <button className="button button-danger" type="submit">
        Delete plan permanently
      </button>
    </form>
  );
}
