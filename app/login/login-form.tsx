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
        email
        <input name="email" type="email" autoComplete="email" required placeholder="you@secret.lair" />
      </label>
      <label>
        password
        <input name="password" type="password" autoComplete="current-password" required minLength={6} placeholder="••••••••" />
      </label>

      <div className="login-actions">
        <button type="submit" name="intent" value="signin" className="whisper" disabled={pending}>
          {pending ? "checking the guest list…" : "slip inside"}
        </button>
        <button type="submit" name="intent" value="signup" className="ghost" disabled={pending}>
          first time? sign up
        </button>
      </div>

      {state.error && <p className="form-error">{state.error}</p>}
      {state.message && <p className="form-ok">{state.message}</p>}
    </form>
  );
}
