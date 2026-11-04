"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { DAILY_DROPS, MAX_CONTEXT } from "@/lib/photo-booth";
import { CameraIcon } from "../icons";
import { dropPhoto, type DropState } from "./actions";

export function DropForm({ dropsLeft }: { dropsLeft: number }) {
  const [state, formAction, pending] = useActionState<DropState, FormData>(dropPhoto, {
    error: null,
    droppedAt: null,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Only clear the form once the drop is saved, so a failed try keeps the chosen photo.
  useEffect(() => {
    if (!state.droppedAt) return;
    formRef.current?.reset();
    setPreview(null);
  }, [state.droppedAt]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const outOfDrops = dropsLeft <= 0;

  return (
    <form
      ref={formRef}
      className="drop-form card"
      // Not action={formAction}: React resets function-action forms after every submit, failures included.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <label className={preview ? "dropzone has-photo" : "dropzone"}>
        {preview ? (
          <img src={preview} alt="The photo you picked" />
        ) : (
          <span className="dropzone-empty">
            <CameraIcon />
            <span className="dropzone-title">Choose a photo</span>
            <span className="hint">JPG, PNG or WebP, up to 5 MB</span>
          </span>
        )}
        <input
          className="dropzone-input"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={outOfDrops}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </label>

      <label className="drop-context">
        <span>
          Where was this? <span className="hint">Optional</span>
        </span>
        <input
          className="field"
          name="context"
          maxLength={MAX_CONTEXT}
          placeholder="Butler, 2am, week of midterms"
          autoComplete="off"
          disabled={outOfDrops}
        />
      </label>

      <div className="compose-foot">
        <span className={outOfDrops ? "counter warn" : "counter"}>
          {outOfDrops
            ? "No drops left today. New theme at midnight."
            : `${dropsLeft} of ${DAILY_DROPS} drops left today`}
        </span>
        <button type="submit" className="btn" disabled={pending || outOfDrops || !preview}>
          {pending ? (
            <>
              Developing <span className="spin" aria-hidden="true" />
            </>
          ) : (
            "Develop it"
          )}
        </button>
      </div>

      {pending && (
        <p className="form-msg is-ok" role="status">
          The booth is writing three confessions for your photo. Takes a few seconds.
        </p>
      )}
      {state.error && !pending && (
        <p className="form-msg is-error" role="alert">
          {state.error}
        </p>
      )}
      {state.droppedAt && !state.error && !pending && (
        <p className="form-msg is-ok" role="status">
          Developed. Your drop is first in line below.
        </p>
      )}
    </form>
  );
}
