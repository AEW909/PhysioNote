"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ResetStatus = "checking" | "ready" | "done" | "error";

function getRecoveryErrorMessage(message: string) {
  if (message.toLowerCase().includes("code verifier")) {
    return "This reset link cannot be verified in this browser. Request a new reset email from this browser, then open the new link in the same browser.";
  }

  return message;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<ResetStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    const initialise = async () => {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

      const recoveryCode = searchParams.get("code");
      if (recoveryCode) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(recoveryCode);

        if (!active) return;

        if (exchangeError) {
          setError(getRecoveryErrorMessage(exchangeError.message));
          setStatus("error");
          return;
        }

        window.history.replaceState({}, "", "/reset-password");
        setStatus("ready");
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!active) return;

        if (setSessionError) {
          setError(getRecoveryErrorMessage(setSessionError.message));
          setStatus("error");
          return;
        }

        window.history.replaceState({}, "", "/reset-password");
        setStatus("ready");
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError) {
        setError(getRecoveryErrorMessage(sessionError.message));
        setStatus("error");
        return;
      }

      if (data.session) {
        setStatus("ready");
        return;
      }

      setStatus("error");
      setError("This password reset link is missing or has expired. Request a new reset email and try again.");
    };

    void initialise();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatus("ready");
        setError("");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setError("Enter and confirm the new password.");
      return;
    }

    if (password.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setPending(false);
      setError(updateError.message);
      return;
    }

    setSuccess("Password updated successfully. Redirecting you back to sign in...");
    setStatus("done");
    setPending(false);

    await supabase.auth.signOut();
    window.setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  if (status === "checking") {
    return <p className="lede">Checking your recovery link…</p>;
  }

  if (status === "error") {
    return (
      <div className="auth-form">
        <p className="form-error">{error}</p>
        <Link className="button button-primary" href="/forgot-password">
          Request a new reset link
        </Link>
        <Link className="button button-secondary" href="/login">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>New password</span>
        <input
          autoComplete="new-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Confirm new password</span>
        <input
          autoComplete="new-password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <button className="button button-primary" disabled={pending || status === "done"} type="submit">
        {pending ? "Updating password..." : "Set new password"}
      </button>

      <Link className="button button-secondary" href="/login">
        Back to sign in
      </Link>
    </form>
  );
}
