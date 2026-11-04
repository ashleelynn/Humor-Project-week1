"use client";

import Link from "next/link";
import { useOptimistic } from "react";
import { VoteIcon } from "../icons";
import { castVote } from "./actions";

type Vote = -1 | 0 | 1;
type Props = { captionId: number; score: number; vote: Vote; signedIn: boolean };

export function VoteButtons({ captionId, score, vote, signedIn }: Props) {
  const [optimistic, setOptimistic] = useOptimistic({ score, vote });

  if (!signedIn) {
    return (
      <div className="votes">
        <Link href="/login" className="vote" aria-label="Log in to upvote">
          <VoteIcon direction="up" />
        </Link>
        <span className="vote-score">
          {score}
          <span className="sr-only"> points</span>
        </span>
        <Link href="/login" className="vote" aria-label="Log in to downvote">
          <VoteIcon direction="down" />
        </Link>
      </div>
    );
  }

  // Pressing the vote you already gave takes it back.
  const next = (direction: 1 | -1): Vote => (optimistic.vote === direction ? 0 : direction);

  return (
    <form
      className="votes"
      action={async (formData) => {
        const value = Number(formData.get("vote")) as Vote;
        setOptimistic({ score: optimistic.score - optimistic.vote + value, vote: value });
        await castVote(formData);
      }}
    >
      <input type="hidden" name="caption_id" value={captionId} />
      <button
        type="submit"
        name="vote"
        value={next(1)}
        className="vote vote--up"
        aria-label="Upvote"
        aria-pressed={optimistic.vote === 1}
      >
        <VoteIcon direction="up" />
      </button>
      <span className="vote-score">
        {optimistic.score}
        <span className="sr-only"> points</span>
      </span>
      <button
        type="submit"
        name="vote"
        value={next(-1)}
        className="vote vote--down"
        aria-label="Downvote"
        aria-pressed={optimistic.vote === -1}
      >
        <VoteIcon direction="down" />
      </button>
    </form>
  );
}
