"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, type ProfileState } from "./actions";

export type Profile = { first_name: string | null; last_name: string | null; avatar_url: string | null };

export function ProfileForm({ email, profile }: { email: string; profile: Profile | null }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, {
    error: null,
    savedAt: null,
  });
  const [preview, setPreview] = useState<string | null>(null);

  // React resets the form after a successful save, so drop the local preview with it.
  useEffect(() => {
    if (state.savedAt) setPreview(null);
  }, [state.savedAt]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const photo = preview ?? profile?.avatar_url ?? null;
  const initial = (profile?.first_name || email || "?").charAt(0).toUpperCase();

  return (
    <form action={formAction} className="profile-form card">
      <p className="profile-email">Signed in as {email}</p>

      <div className="avatar-row">
        {photo ? (
          <img className="avatar" src={photo} alt="Your profile photo" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar avatar--empty" role="img" aria-label="No profile photo yet">
            {initial}
          </span>
        )}
        <label className="avatar-pick">
          Photo
          <input
            className="field"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          <span className="hint">JPG, PNG, WebP or GIF, up to 5 MB.</span>
        </label>
      </div>

      <label>
        First name
        <input
          className="field"
          name="first_name"
          autoComplete="given-name"
          maxLength={50}
          defaultValue={profile?.first_name ?? ""}
        />
      </label>
      <label>
        Last name
        <input
          className="field"
          name="last_name"
          autoComplete="family-name"
          maxLength={50}
          defaultValue={profile?.last_name ?? ""}
        />
      </label>

      <div className="login-actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? (
            <>
              Saving <span className="spin" aria-hidden="true" />
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>

      {state.error && (
        <p className="form-msg is-error" role="alert">
          {state.error}
        </p>
      )}
      {state.savedAt && !state.error && (
        <p className="form-msg is-ok" role="status">
          Saved. Looking good.
        </p>
      )}
    </form>
  );
}
