import { NextResponse } from "next/server";
import { getFocusBoardSiteUrl } from "@/lib/focusboard-redirect";

function movedResponse() {
  return NextResponse.json(
    {
      error: "FocusBoard asset uploads have moved to the standalone FocusBoard app.",
      movedTo: `${getFocusBoardSiteUrl()}/`,
    },
    { status: 410 },
  );
}

export async function GET() {
  return movedResponse();
}

export async function POST() {
  return movedResponse();
}
