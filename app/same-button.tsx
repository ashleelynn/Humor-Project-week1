"use client";

import Link from "next/link";
import { useOptimistic, useState } from "react";
import { toggleSame } from "./actions";

type Props = { id: number; count: number; active: boolean; signedIn: boolean };

function Label({ active, count }: { active: boolean; count: number }) {
  return (
    <>
      <span className="same-face" aria-hidden="true">
        {active ? "\\o/" : "._."}
      </span>{" "}
      <span>same</span> <span className="same-count">{count}</span>
    </>
  );
}

export function SameButton({ id, count, active, signedIn }: Props) {
  const [optimistic, setOptimistic] = useOptimistic({ count, active });
  const [popping, setPopping] = useState(false);

  if (!signedIn) {
    return (
      <Link href="/login" className="same" title="Log in to relate">
        <Label active={false} count={count} />
      </Link>
    );
  }

  return (
    <form
      action={async (formData) => {
        setOptimistic({ count: optimistic.count + (optimistic.active ? -1 : 1), active: !optimistic.active });
        await toggleSame(formData);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={optimistic.active ? "1" : "0"} />
      <button
        type="submit"
        className={popping ? "same is-popping" : "same"}
        aria-pressed={optimistic.active}
        title={optimistic.active ? "Un-relate" : "Relate"}
        // Set here, not in the action: state updates inside the action wait for the server.
        onClick={() => {
          if (!optimistic.active) setPopping(true);
        }}
        onAnimationEnd={(e) => {
          if (e.animationName === "hop") setPopping(false);
        }}
      >
        <Label active={optimistic.active} count={optimistic.count} />
      </button>
    </form>
  );
}
