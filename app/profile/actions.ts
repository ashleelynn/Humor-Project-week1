"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type ProfileState = { error: string | null; savedAt: number | null };

const MAX_NAME = 50;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function nameField(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const firstName = nameField(formData, "first_name");
  const lastName = nameField(formData, "last_name");
  if ((firstName?.length ?? 0) > MAX_NAME || (lastName?.length ?? 0) > MAX_NAME) {
    return { error: `Names max out at ${MAX_NAME} characters.`, savedAt: null };
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const changes: { first_name: string | null; last_name: string | null; updated_at: string; avatar_url?: string } = {
    first_name: firstName,
    last_name: lastName,
    updated_at: new Date().toISOString(),
  };

  const photo = formData.get("avatar");
  if (photo instanceof File && photo.size > 0) {
    if (!PHOTO_TYPES.includes(photo.type)) return { error: "Photos need to be JPG, PNG, WebP or GIF.", savedAt: null };
    if (photo.size > MAX_PHOTO_BYTES) return { error: "That photo is over 5 MB. Try a smaller one.", savedAt: null };

    const path = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, photo, { contentType: photo.type, upsert: true });
    if (uploadError) return { error: uploadError.message, savedAt: null };

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // Same path on every upload, so bust the CDN cache.
    changes.avatar_url = `${data.publicUrl}?v=${Date.now()}`;
  }

  const { data: updated, error } = await supabase.from("profiles").update(changes).eq("id", user.id).select("id");
  if (error) return { error: error.message, savedAt: null };
  if (!updated?.length) return { error: "No profile row found for your account. Has supabase/profiles.sql been run?", savedAt: null };

  revalidatePath("/profile");
  return { error: null, savedAt: Date.now() };
}
