import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "../actions";
import { SiteNav } from "../site-nav";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="page page--narrow">
      <SiteNav>
        <Link href="/" className="btn ghost small">
          The wall
        </Link>
        <form action={signOut}>
          <button type="submit" className="btn small">
            Slip out
          </button>
        </form>
      </SiteNav>
      <header className="hero hero--sm">
        <p className="eyebrow">
          <span className="rest">Members only</span>
        </p>
        <h1 className="title title--sm">
          The real <span className="accent">you.</span>
        </h1>
        <p className="tagline">Only you can see this page. The wall still shows a random alias, never your name.</p>
      </header>

      {error && (
        <p className="form-msg is-error" role="alert">
          Couldn&apos;t load your profile: {error.message}
        </p>
      )}
      <ProfileForm email={user.email ?? ""} profile={profile} />
    </main>
  );
}
