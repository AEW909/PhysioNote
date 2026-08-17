import type { NoteType } from "@/lib/notes/types";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asBoolean(value: unknown) {
  return value === true;
}

function toLabelCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCheckedFlags(source: Record<string, unknown>, labels: Record<string, string>) {
  return Object.entries(labels)
    .filter(([key]) => asBoolean(source[key]))
    .map(([, label]) => label);
}

function getLegacyGoalsFromModalities(source: Record<string, unknown>) {
  return {
    reduce_pain: source.reduce_pain,
    improve_function: source.improve_function,
    increase_rom: source.increase_rom,
    return_to_work: source.return_to_work,
    return_to_sport_or_hobby: source.return_to_sport_or_hobby,
  };
}

export function summarizeFollowUpContent(content: Record<string, unknown>) {
  return [
    `Subjective update: ${asString(content.subjective_update) || "Not recorded"}`,
    `Pain rating (NPRS): Best ${asString(content.nprs_best) || "not recorded"}, Current ${asString(content.nprs_current) || asString(content.nprs) || "not recorded"}, Worst ${asString(content.nprs_worst) || "not recorded"}`,
    `Response to previous treatment: ${asString(content.response_to_previous_treatment) || "Not recorded"}`,
    `Objective reassessment: ${asString(content.objective_reassessment) || "Not recorded"}`,
    `Treatment today: ${asString(content.treatment_today) || "Not recorded"}`,
    `Exercises or self-management: ${asString(content.exercises_or_self_management) || "Not recorded"}`,
    `Progress against goal: ${asString(content.progress_against_goal) || "Not recorded"}`,
    `Next plan: ${asString(content.next_plan) || "Not recorded"}`,
  ].join("\n");
}

export function summarizeInitialAssessmentContent(content: Record<string, unknown>) {
  const history = asRecord(content.history);
  const medicalHistory = asRecord(content.medical_history);
  const specialQuestions = asRecord(content.special_questions);
  const cervicalQuestions = asRecord(content.cervical_questions);
  const objective = asRecord(content.objective);
  const impression = asRecord(content.impression);
  const plan = asRecord(content.plan);
  const modalities = asRecord(plan.modalities);
  const goals = Object.keys(asRecord(plan.goals)).length ? asRecord(plan.goals) : getLegacyGoalsFromModalities(modalities);
  const bloodPressure = asStringArray(medicalHistory.blood_pressure).map(toLabelCase);
  const diabetes = asStringArray(medicalHistory.diabetes).map(toLabelCase);

  const redFlags = formatCheckedFlags(specialQuestions, {
    weight_loss: "Weight loss",
    night_sweats: "Night sweats",
    poor_appetite: "Poor appetite",
    headache: "Headache",
    nausea: "Nausea",
    dizziness: "Dizziness",
    pins_and_needles_intermittent: "Pins and needles intermittent",
    pins_and_needles_constant: "Pins and needles constant",
    numbness: "Numbness",
    cough_sneeze: "Cough / sneeze aggravation",
    bladder_bowel: "Bladder / bowel change",
    saddle_anaesthesia: "Saddle anaesthesia",
    bilateral_symptoms: "Bilateral symptoms",
    constant_pain: "Constant pain",
    night_pain: "Night pain",
    tsp_pain: "Thoracic spine pain",
    malaise: "Malaise",
    symptoms_worsening: "Symptoms worsening",
  });

  const cervicalFlags = formatCheckedFlags(cervicalQuestions, {
    face_lips_tongue: "Face / lips / tongue symptoms",
    dexterity: "Dexterity change",
    eye_problems: "Eye problems",
    metal_taste: "Metal taste",
    dysphagia: "Dysphagia",
    clumsiness: "Clumsiness",
    head_support: "Needs head support",
    gait_disturbance: "Gait disturbance",
    clunking: "Clunking",
  });

  const goalsChosen = formatCheckedFlags(goals, {
    reduce_pain: "Reduce pain",
    improve_function: "Improve function",
    increase_rom: "Increase ROM",
    return_to_work: "Return to work",
    return_to_sport_or_hobby: "Return to sport / hobby",
  });

  const modalitiesChosen = formatCheckedFlags(modalities, {
    manual: "Manual therapy",
    electrotherapy: "Electrotherapy",
    ultrasound: "Ultrasound",
    acupuncture: "Acupuncture",
    exercises_self_manage: "Exercises / self-management",
    advice: "Advice",
  });

  return [
    `PC: ${asString(history.pc) || "Not recorded"}`,
    `HPC: ${asString(history.hpc) || "Not recorded"}`,
    `Onset pattern: ${asStringArray(history.onset_pattern).join(", ") || "Not recorded"}`,
    `Investigations: ${asStringArray(history.investigations).join(", ") || "Not recorded"}`,
    `Symptom features: ${asStringArray(history.symptom_features).join(", ") || "Not recorded"}`,
    `Pain rating (NPRS): Best ${asString(history.nprs_best) || "not recorded"}, Current ${asString(history.nprs_current) || asString(history.nprs) || "not recorded"}, Worst ${asString(history.nprs_worst) || "not recorded"}`,
    `Social history: ${asString(history.social_history) || "Not recorded"}`,
    `Diurnal pattern: ${asString(history.diurnal_pattern) || "Not recorded"}`,
    `Aggravating factors: ${asString(history.aggravating_factors) || "Not recorded"}`,
    `Easing factors: ${asString(history.easing_factors) || "Not recorded"}`,
    `Past medical history: ${asStringArray(medicalHistory.past_medical_history).join(", ") || "Not recorded"}`,
    `Blood pressure flags: ${bloodPressure.join(", ") || "Not recorded"}`,
    `Diabetes flags: ${diabetes.join(", ") || "Not recorded"}`,
    `No significant history selected: ${asBoolean(medicalHistory.no_significant_history) ? "Yes" : "No"}`,
    `Medication history: ${asString(medicalHistory.medication_history) || "Not recorded"}`,
    `Steroids: ${asBoolean(medicalHistory.uses_steroids) ? "Yes" : "No"}`,
    `Anticoagulants: ${asBoolean(medicalHistory.uses_anticoagulants) ? "Yes" : "No"}`,
    `Past medical history details: ${asString(medicalHistory.past_medical_history_details) || "Not recorded"}`,
    `Past operations: ${asString(medicalHistory.past_operations) || "Not recorded"}`,
    `Special questions flagged: ${redFlags.join(", ") || "None recorded"}`,
    `Cervical-specific flags: ${cervicalFlags.join(", ") || "None recorded"}`,
    `Objective posture: ${asString(objective.posture) || "Not recorded"}`,
    `Objective ROM: ${asString(objective.rom) || "Not recorded"}`,
    `Associated joints ROM: ${asString(objective.associated_joints_rom) || "Not recorded"}`,
    `ULTT: ${asString(objective.ultt) || "Not recorded"}`,
    `Special tests: ${asString(objective.special_tests) || "Not recorded"}`,
    `Palpation: ${asString(objective.palpation) || "Not recorded"}`,
    `Neurological screen: ${asString(objective.neuro_screen) || "Not recorded"}`,
    `Other objective findings: ${asString(objective.other) || "Not recorded"}`,
    `Clinical opinion: ${asString(impression.opinion) || "Not recorded"}`,
    `Consent to treatment: ${asBoolean(impression.consent_to_treatment) ? "Yes" : "No / not recorded"}`,
    `Problems and goals: ${asString(plan.problems_and_goals) || "Not recorded"}`,
    `Outcome measure: ${asString(plan.measure) || "Not recorded"}`,
    `Timeframe in weeks: ${asString(plan.timeframe_weeks) || "Not recorded"}`,
    `Goals selected: ${goalsChosen.join(", ") || "None recorded"}`,
    `Modalities selected: ${modalitiesChosen.join(", ") || "None recorded"}`,
    `Actual treatment given: ${asString(plan.actual_treatment_given) || "Not recorded"}`,
  ].join("\n");
}

export function summarizeDischargeContent(content: Record<string, unknown>) {
  return [
    `Presenting problem summary: ${asString(content.presenting_problem_summary) || "Not recorded"}`,
    `Treatment course summary: ${asString(content.treatment_course_summary) || "Not recorded"}`,
    `Outcome: ${asString(content.outcome) || "Not recorded"}`,
    `Final functional status: ${asString(content.final_functional_status) || "Not recorded"}`,
    `Advice on discharge: ${asString(content.advice_on_discharge) || "Not recorded"}`,
    `Follow-up recommendations: ${asString(content.follow_up_recommendations) || "Not recorded"}`,
  ].join("\n");
}

export function summarizeCurrentNote(noteType: NoteType, content: Record<string, unknown>) {
  if (noteType === "follow_up") {
    return summarizeFollowUpContent(content);
  }

  if (noteType === "initial_assessment") {
    return summarizeInitialAssessmentContent(content);
  }

  return summarizeDischargeContent(content);
}
