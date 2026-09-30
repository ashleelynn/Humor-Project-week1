"use client";

import Link from "next/link";
import { useOptimistic } from "react";
import { toggleSame } from "./actions";

type Props = { id: number; count: number; active: boolean; signedIn: boolean };

export function SameButton({ id, count, active, signedIn }: Props) {
  const [optimistic, setOptimistic] = useOptimistic({ count, active });

  if (!signedIn) {
    return (
      <Link href="/login" className="same" title="Log in to relate">
        🫠 same · {count}
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
        className={optimistic.active ? "same active" : "same"}
        aria-pressed={optimistic.active}
        title={optimistic.active ? "Un-relate" : "Relate"}
      >
        🫠 same · {optimistic.count}
      </button>
    </form>
  );
}
