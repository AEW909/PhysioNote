import { redirectToFocusBoard } from "@/lib/focusboard-redirect";

export const dynamic = "force-dynamic";

type LegacyFocusBoardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyFocusBoardPage({ params, searchParams }: LegacyFocusBoardPageProps) {
  const { slug } = await params;
  redirectToFocusBoard(`/focus/${slug}`, await searchParams);
}
