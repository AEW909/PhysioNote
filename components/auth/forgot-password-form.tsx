"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ForgotPasswordFormProps = {
  loginPath?: string;
};

export function ForgotPasswordForm({ loginPath = "/login" }: ForgotPasswordFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setError("Enter the email linked to the staff account.");
      return;
    }

    setError("");
    setSuccess("");
    setPending(true);

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setPending(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess("If that email exists in the system, a password reset link has been sent.");
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Sending reset link..." : "Send password reset link"}
      </button>

      <Link className="button button-secondary" href={loginPath}>
        Back to sign in
      </Link>
    </form>
  );
}
