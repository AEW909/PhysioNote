import { notFound } from "next/navigation";
import { FocusBoard } from "@/components/focus/focus-board";
import { FOCUS_BOARD_SLUG } from "@/lib/focus-board/config";
import { getFocusBoardData } from "@/lib/focus-board/queries";

type FocusBoardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string; week?: string; view?: string }>;
};

export default async function FocusBoardPage({ params, searchParams }: FocusBoardPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  if (slug !== FOCUS_BOARD_SLUG) {
    notFound();
  }

  const board = await getFocusBoardData({
    month: query.month,
    week: query.week,
  });
  const initialView = query.view === "month" ? "month" : "week";

  return (
    <main className="shell focus-public-page focus-public-page-neon">
      <FocusBoard board={board} initialView={initialView} />
    </main>
  );
}
