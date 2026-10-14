"use client";

import { useActionState, useEffect, useState } from "react";
import { bayard } from "@/lib/bayard";
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

  return (
    <form action={formAction} className="profile-form">
      <p className="profile-email">signed in as {email}</p>

      <div className="avatar-row">
        {photo ? (
          <img className="avatar" src={photo} alt="Your profile photo" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar ascii" aria-label="No profile photo yet">
            {"( o_o )"}
          </span>
        )}
        <label className="avatar-pick">
          photo
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
        first name
        <input
          className="field"
          name="first_name"
          autoComplete="given-name"
          maxLength={50}
          defaultValue={profile?.first_name ?? ""}
        />
      </label>
      <label>
        last name
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
              {bayard("saving...")}{" "}
              <span className="spin" aria-hidden="true">
                <span>{"|/-\\"}</span>
              </span>
            </>
          ) : (
            "save changes"
          )}
        </button>
      </div>

      {state.error && (
        <p className="form-msg is-error" role="alert">
          <span className="glyph" aria-hidden="true">
            x_x
          </span>
          <span>{state.error}</span>
        </p>
      )}
      {state.savedAt && !state.error && (
        <p className="form-msg is-ok" role="status">
          <span className="glyph" aria-hidden="true">
            {"\\o/"}
          </span>
          <span>Saved. Looking good.</span>
        </p>
      )}
    </form>
  );
}
