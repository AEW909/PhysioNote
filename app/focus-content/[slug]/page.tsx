import { redirectToFocusBoard } from "@/lib/focusboard-redirect";

export const dynamic = "force-dynamic";

type LegacyFocusContentPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyFocusContentPage({ params, searchParams }: LegacyFocusContentPageProps) {
  const { slug } = await params;
  redirectToFocusBoard(`/focus-content/${slug}`, await searchParams);
}
