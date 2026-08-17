import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import type { NoteType } from "@/lib/notes/types";

const aiTreatmentPlanSummarySchema = z.object({
  presentingProblemSummary: z.string().trim().min(1),
  goalsSummary: z.string().trim().min(1),
  progressSummary: z.string().trim().min(1),
  overallFindings: z.string().trim().min(1),
});

type GenerateTreatmentPlanSummariesInput = {
  planTitle: string;
  sessionNotes: Array<{
    noteType: NoteType;
    createdAt?: string | null;
    summary: string;
  }>;
};

type ResponsesApiPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function extractStructuredOutputText(payload: ResponsesApiPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const contentItem of item.content ?? []) {
      if (typeof contentItem.text === "string" && contentItem.text.trim()) {
        return contentItem.text;
      }
    }
  }

  return null;
}

function buildSessionTimeline(
  sessionNotes: Array<{
    noteType: NoteType;
    createdAt?: string | null;
    summary: string;
  }>,
) {
  return sessionNotes
    .map((note, index) => {
      const ordinal = index + 1;
      const dateLabel = note.createdAt ? new Date(note.createdAt).toISOString() : "Date not recorded";
      return [
        `Session ${ordinal}`,
        `Type: ${note.noteType.replace("_", " ")}`,
        `Recorded: ${dateLabel}`,
        note.summary,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

export async function generateTreatmentPlanSummaries(input: GenerateTreatmentPlanSummariesInput) {
  const env = getServerEnv();
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      presentingProblemSummary: {
        type: "string",
        description: "An internal clinician-facing note on the presenting complaint, working diagnosis, and key clinical context.",
      },
      goalsSummary: {
        type: "string",
        description: "A clinician-facing note of treatment aims, rehabilitation priorities, and intended clinical outcomes.",
      },
      progressSummary: {
        type: "string",
        description: "An internal progress note summarising response across sessions, current trend, and any barriers or changes.",
      },
      overallFindings: {
        type: "string",
        description: "A concise medical-style internal summary of clinically relevant findings, treatment delivered, and current status.",
      },
    },
    required: ["presentingProblemSummary", "goalsSummary", "progressSummary", "overallFindings"],
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      instructions:
        "You are assisting a physiotherapy clinic with internal treatment plan summaries. Use only the supplied note content. Write in concise UK clinical English and favour medical terminology where appropriate. The output is for internal clinician use, so it can read like brief note-writing rather than patient-facing prose. Track progress across the timeline, noting improvement, plateau, regression, response to treatment, and any active management focus. Do not invent diagnoses, imaging, red flags, or objective findings that are not supported by the notes.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Treatment plan: ${input.planTitle}`,
                "",
                "Create four internal clinician-facing fields:",
                "1. Presenting problem summary",
                "2. Goals summary",
                "3. Progress summary",
                "4. Overall findings",
                "",
                "Requirements:",
                "- Use the whole note timeline, not just the first session.",
                "- Reflect how the patient has progressed over time where this is documented.",
                "- Keep each field to roughly 2-5 sentences.",
                "- Use note-like, medically literate phrasing suitable for internal records.",
                "- If progress is mixed or unclear, say so conservatively.",
                "",
                "Treatment plan note timeline:",
                buildSessionTimeline(input.sessionNotes),
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "treatment_plan_summaries",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as ResponsesApiPayload;
  const outputText = extractStructuredOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text.");
  }

  return aiTreatmentPlanSummarySchema.parse(JSON.parse(outputText));
}
