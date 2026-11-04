"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { MAX_LENGTH, MOODS, type MoodId } from "@/lib/confessions";
import { postConfession, type ConfessState } from "./actions";

const PROMPTS = [
  "I have never told anyone that...",
  "Every morning I secretly...",
  "The pettiest thing I've ever done is...",
  "I pretend to know what I'm doing when...",
];

export function ComposeForm() {
  const [state, formAction, pending] = useActionState<ConfessState, FormData>(postConfession, {
    error: null,
    postedAt: null,
  });
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<MoodId>("unhinged");
  const [picked, setPicked] = useState(false);
  // Start with a fixed prompt so server and client HTML match, then shuffle after hydration.
  const [prompt, setPrompt] = useState(PROMPTS[0]);

  useEffect(() => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  useEffect(() => {
    if (state.postedAt) setBody("");
  }, [state.postedAt]);

  const left = MAX_LENGTH - body.length;

  return (
    <form
      className="compose card"
      // Not action={formAction}: React resets function-action forms after every submit, which would
      // re-check the default mood radio (out of sync with state) whenever a post fails.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <label htmlFor="body" className="compose-label">
        Psst. What’s on your mind?
      </label>
      <textarea
        id="body"
        name="body"
        className="field field--serif"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_LENGTH}
        placeholder={prompt}
        rows={3}
        required
      />

      <fieldset className={picked ? "moods is-picked" : "moods"}>
        <legend>Pick a vibe</legend>
        {MOODS.map((m) => (
          <label key={m.id} className="mood-option">
            <input type="radio" name="mood" value={m.id} checked={mood === m.id} onChange={() => {
                setMood(m.id);
                setPicked(true);
              }}
            />
            <span className="chip">
              <span className="face" aria-hidden="true">
                {m.face}
              </span>
              {m.label}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="compose-foot">
        <span className={left < 20 ? "counter warn" : "counter"}>{left} characters of courage left</span>
        <button type="submit" className="btn" disabled={pending || body.trim().length < 3}>
          {pending ? (
            <>
              Slipping it in <span className="spin" aria-hidden="true" />
            </>
          ) : (
            "Whisper it"
          )}
        </button>
      </div>

      {state.error && (
        <p className="form-msg is-error" role="alert">
          {state.error}
        </p>
      )}
      {state.postedAt && !state.error && (
        <p className="form-msg is-ok" role="status">
          Confession received. Your secret is safe(ish).
        </p>
      )}
    </form>
  );
}
