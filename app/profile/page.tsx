import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "../actions";
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
    <main className="page login-page">
      <Link href="/" className="back">
        <span className="arrow" aria-hidden="true">
          &lt;-
        </span>{" "}
        back to the wall
      </Link>
      <header className="booth-header login-head">
        <p className="badge">
          <span className="rest">members only</span>
        </p>
        <h1 className="title title--sm">
          <span>the real</span>{" "}
          <span>
            <span className="accent">you</span>
          </span>
        </h1>
        <p className="tagline">Only you can see this page. The wall still shows a random alias, never your name.</p>
      </header>

      {error && (
        <p className="form-msg is-error" role="alert">
          <span className="glyph" aria-hidden="true">
            x_x
          </span>
          <span>Couldn&apos;t load your profile: {error.message}</span>
        </p>
      )}
      <ProfileForm email={user.email ?? ""} profile={profile} />

      <hr className="px-rule" />
      <form action={signOut}>
        <button type="submit" className="btn ghost small">
          slip out
        </button>
      </form>
    </main>
  );
}
