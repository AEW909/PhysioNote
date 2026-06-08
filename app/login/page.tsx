import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeNextPath } from "@/lib/auth/redirects";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Staff Access</p>
        <h1>Sign in to Physio.</h1>
        <p className="lede">
          This workspace is for clinic staff only. Patient records, notes, and AI tools
          will sit behind authenticated access and role-aware permissions.
        </p>
        <Suspense>
          <LoginForm nextPath={nextPath} />
        </Suspense>
      </section>
    </main>
  );
}
