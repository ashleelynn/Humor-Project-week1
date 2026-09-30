"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MAX_LENGTH, isMood } from "@/lib/confessions";
import { createClient } from "@/utils/supabase/server";

export type ConfessState = { error: string | null; postedAt: number | null };

export async function postConfession(_prev: ConfessState, formData: FormData): Promise<ConfessState> {
  const body = String(formData.get("body") ?? "").trim();
  const mood = String(formData.get("mood") ?? "");

  if (body.length < 3) return { error: "At least 3 characters. Be brave.", postedAt: null };
  if (body.length > MAX_LENGTH) return { error: `Keep it under ${MAX_LENGTH} characters. It's a confession, not a memoir.`, postedAt: null };
  if (!isMood(mood)) return { error: "Pick a vibe for your confession.", postedAt: null };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("confessions").insert({ body, mood });
  if (error) return { error: error.message, postedAt: null };

  revalidatePath("/");
  return { error: null, postedAt: Date.now() };
}

export async function toggleSame(formData: FormData) {
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "1";
  if (!Number.isInteger(id)) return;

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (active) {
    await supabase.from("confession_sames").delete().eq("confession_id", id).eq("user_id", user.id);
  } else {
    await supabase.from("confession_sames").insert({ confession_id: id });
  }
  revalidatePath("/");
}

export async function signOut() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
