"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const POLL_MS = 30_000;

// Runs in the browser, so these Supabase requests show up in the Network tab.
export function NewConfessions({ latestId }: { latestId: number }) {
  const router = useRouter();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function check() {
      const { data, error } = await supabase.from("confessions").select("id").gt("id", latestId).limit(99);
      if (error) {
        console.error("Checking for new confessions failed", error);
        return;
      }
      if (!cancelled) setNewCount(data.length);
    }

    check();
    const timer = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [latestId]);

  if (newCount === 0) return null;

  return (
    <button type="button" className="btn ghost small" onClick={() => router.refresh()}>
      {newCount} new {newCount === 1 ? "secret" : "secrets"}, show me
    </button>
  );
}
