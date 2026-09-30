"use client";

import { useActionState, useEffect, useState } from "react";
import { MAX_LENGTH, MOODS, type MoodId } from "@/lib/confessions";
import { postConfession, type ConfessState } from "./actions";

const PROMPTS = [
  "I have never told anyone that…",
  "Every morning I secretly…",
  "The pettiest thing I've ever done is…",
  "I pretend to know what I'm doing when…",
];

export function ComposeForm() {
  const [state, formAction, pending] = useActionState<ConfessState, FormData>(postConfession, {
    error: null,
    postedAt: null,
  });
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<MoodId>("unhinged");
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  useEffect(() => {
    if (state.postedAt) setBody("");
  }, [state.postedAt]);

  const left = MAX_LENGTH - body.length;

  return (
    <form action={formAction} className="compose">
      <label htmlFor="body" className="compose-label">
        psst. what&apos;s on your mind?
      </label>
      <textarea
        id="body"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_LENGTH}
        placeholder={prompt}
        rows={3}
        required
      />

      <fieldset className="moods">
        <legend>pick a vibe</legend>
        {MOODS.map((m) => (
          <label key={m.id} className="mood-option" style={{ "--note": m.color } as React.CSSProperties}>
            <input
              type="radio"
              name="mood"
              value={m.id}
              checked={mood === m.id}
              onChange={() => setMood(m.id)}
            />
            <span>
              {m.emoji} {m.label}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="compose-foot">
        <span className={left < 20 ? "counter warn" : "counter"}>{left} characters of courage left</span>
        <button type="submit" className="whisper" disabled={pending || body.trim().length < 3}>
          {pending ? "slipping it under the door…" : "whisper it 🤫"}
        </button>
      </div>

      {state.error && <p className="form-error">{state.error}</p>}
      {state.postedAt && !state.error && <p className="form-ok">Confession received. Your secret is safe(ish).</p>}
    </form>
  );
}
