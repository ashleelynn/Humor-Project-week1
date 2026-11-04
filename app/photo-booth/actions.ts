"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BoothAIError, writeCaptions } from "@/lib/gemini";
import {
  DAILY_DROPS,
  MAX_CONTEXT,
  MAX_PHOTO_BYTES,
  PHOTO_BUCKET,
  PHOTO_TYPES,
  captionPrompt,
  themeFor,
} from "@/lib/photo-booth";
import { createClient } from "@/utils/supabase/server";

export type DropState = { error: string | null; droppedAt: number | null };

const fail = (error: string): DropState => ({ error, droppedAt: null });

export async function dropPhoto(_prev: DropState, formData: FormData): Promise<DropState> {
  const photo = formData.get("photo");
  const context = String(formData.get("context") ?? "").replace(/\s+/g, " ").trim();

  if (!(photo instanceof File) || photo.size === 0) return fail("Pick a photo first.");
  const extension = PHOTO_TYPES[photo.type];
  if (!extension) return fail("Photos need to be JPG, PNG or WebP.");
  if (photo.size > MAX_PHOTO_BYTES) return fail("That photo is over 5 MB. Try a smaller one.");
  if (context.length > MAX_CONTEXT) return fail(`Keep the context under ${MAX_CONTEXT} characters.`);

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The database enforces this too; checking first saves a Gemini call that couldn't be saved.
  const { data: used, error: countError } = await supabase.rpc("generations_today");
  if (countError) return fail(countError.message);
  if ((used as number) >= DAILY_DROPS) return fail(`That’s all ${DAILY_DROPS} drops for today. New theme at midnight.`);

  const theme = themeFor();
  const prompt = captionPrompt({ theme, context });

  let result: Awaited<ReturnType<typeof writeCaptions>>;
  try {
    result = await writeCaptions({ image: await photo.arrayBuffer(), mimeType: photo.type, prompt });
  } catch (e) {
    if (e instanceof BoothAIError) return fail(e.message);
    console.error("Writing captions failed", e);
    return fail("The booth's AI tripped. Try again.");
  }

  // Random names, not user ids, so a photo's URL can't be traced back to whoever dropped it.
  const imagePath = `${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(imagePath, photo, { contentType: photo.type });
  if (uploadError) return fail(uploadError.message);

  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .insert({
      image_path: imagePath,
      theme,
      alt_text: result.altText,
      context: context || null,
      model: result.model,
      prompt,
    })
    .select("id")
    .single();
  if (generationError) return fail(generationError.message);

  const { error: captionsError } = await supabase.from("captions").insert(
    result.captions.map((c, i) => ({ generation_id: generation.id, position: i + 1, mood: c.mood, body: c.body })),
  );
  if (captionsError) return fail(captionsError.message);

  revalidatePath("/photo-booth");
  return { error: null, droppedAt: Date.now() };
}

// vote is 1 (up), -1 (down) or 0 (take it back).
export async function castVote(formData: FormData) {
  const captionId = Number(formData.get("caption_id"));
  const vote = Number(formData.get("vote"));
  if (!Number.isInteger(captionId) || ![1, -1, 0].includes(vote)) return;

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (vote === 0) {
    const { error } = await supabase.from("caption_votes").delete().eq("caption_id", captionId).eq("user_id", user.id);
    if (error) console.error("Taking back a vote failed", error);
  } else {
    const { data: changed, error } = await supabase
      .from("caption_votes")
      .update({ vote })
      .eq("caption_id", captionId)
      .eq("user_id", user.id)
      .select("caption_id");
    if (error) console.error("Changing a vote failed", error);
    // First vote on this caption: a new row in caption_votes.
    else if (!changed.length) {
      const { error: insertError } = await supabase.from("caption_votes").insert({ caption_id: captionId, vote });
      if (insertError) console.error("Voting failed", insertError);
    }
  }

  revalidatePath("/photo-booth");
}
