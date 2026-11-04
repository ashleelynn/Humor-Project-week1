import Link from "next/link";
import type { ReactNode } from "react";

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
