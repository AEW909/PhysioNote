import { SignOutButton } from "@/components/auth/sign-out-button";

export default function NoAccessPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Access not enabled</p>
        <h1>This account cannot open PhysioNote.</h1>
        <p className="lede">
          The sign-in details are valid, but this user has not been given active access to the
          PhysioNote workspace.
        </p>
        <SignOutButton />
      </section>
    </main>
  );
}
