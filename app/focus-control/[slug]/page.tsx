import { redirectToFocusBoard } from "@/lib/focusboard-redirect";

export const dynamic = "force-dynamic";

type LegacyFocusControlPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyFocusControlPage({ params, searchParams }: LegacyFocusControlPageProps) {
  const { slug } = await params;
  redirectToFocusBoard(`/focus-control/${slug}`, await searchParams);
}
