import { notFound } from "next/navigation";
import { FocusBoard } from "@/components/focus/focus-board";
import { FOCUS_BOARD_SLUG } from "@/lib/focus-board/config";
import { getFocusBoardData } from "@/lib/focus-board/queries";

type FocusBoardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FocusBoardPage({ params }: FocusBoardPageProps) {
  const { slug } = await params;

  if (slug !== FOCUS_BOARD_SLUG) {
    notFound();
  }

  const board = await getFocusBoardData();

  return (
    <main className="shell focus-public-page">
      <FocusBoard board={board} />
    </main>
  );
}
