import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "./actions";

export function SiteNav({ children }: { children?: ReactNode }) {
  return (
    <nav className="nav" aria-label="Main">
      <Link href="/" className="wordmark">
        Confession Booth
      </Link>
      {children && <div className="nav-actions">{children}</div>}
    </nav>
  );
}

export function AccountActions({ signedIn }: { signedIn: boolean }) {
  if (!signedIn) {
    return (
      <Link href="/login" className="btn small">
        Log in
      </Link>
    );
  }
  return (
    <>
      <Link href="/profile" className="btn ghost small">
        Profile
      </Link>
      <form action={signOut}>
        <button type="submit" className="btn small">
          Slip out
        </button>
      </form>
    </>
  );
}

// The two rooms of the booth, as a Hinge-style segmented control.
export function BoothTabs({ current }: { current: "confessions" | "photos" }) {
  return (
    <nav className="tabs" aria-label="Booths">
      <Link href="/" className="tab" aria-current={current === "confessions" ? "page" : undefined}>
        Confessions
      </Link>
      <Link href="/photo-booth" className="tab" aria-current={current === "photos" ? "page" : undefined}>
        Photo booth
      </Link>
    </nav>
  );
}
