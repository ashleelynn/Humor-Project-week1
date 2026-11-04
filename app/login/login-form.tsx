"use client";

import { useActionState } from "react";
import { authenticate, type AuthState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(authenticate, {
    error: initialError ?? null,
    message: null,
  });

  return (
    <form action={formAction} className="login-form">
      <label>
        Email
        <input
          className="field"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@secret.lair"
          // React resets the form after each attempt; this puts the email back.
          defaultValue={state.email ?? ""}
        />
      </label>
      <label>
        Password
        <input
          className="field"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          placeholder="••••••••"
        />
      </label>

      <div className="login-actions">
        <button type="submit" name="intent" value="signin" className="btn" disabled={pending}>
          {pending ? (
            <>
              Checking the guest list <span className="spin" aria-hidden="true" />
            </>
          ) : (
            "Slip inside"
          )}
        </button>
        <button type="submit" name="intent" value="signup" className="btn ghost" disabled={pending}>
          First time? Sign up
        </button>
      </div>

      {state.error && (
        <p className="form-msg is-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="form-msg is-ok" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
