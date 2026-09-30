// VTC Bayard (trial) has real glyphs ONLY for these characters; anything else renders as a placeholder "=".
const BAYARD_SAFE = /^[A-Za-z0-9 !,.?’“”]*$/;

export function bayard(text: string): string {
  if (process.env.NODE_ENV !== "production" && !BAYARD_SAFE.test(text)) {
    throw new Error(`Not Bayard-safe (use ’ not ', "..." not …, no \` - / : ( ) ->): ${JSON.stringify(text)}`);
  }
  return text;
}
