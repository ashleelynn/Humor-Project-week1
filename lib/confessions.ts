export const MAX_LENGTH = 280;

export const MOODS = [
  { id: "petty", label: "petty", emoji: "😈", color: "#ffb3c7" },
  { id: "cringe", label: "cringe", emoji: "🫣", color: "#ffe680" },
  { id: "unhinged", label: "unhinged", emoji: "🌀", color: "#b8f2c4" },
  { id: "wholesome", label: "wholesome", emoji: "🥹", color: "#bfe0ff" },
  { id: "food-crime", label: "food crime", emoji: "🍕", color: "#ffc896" },
] as const;

export type MoodId = (typeof MOODS)[number]["id"];

export type Confession = {
  id: number;
  created_at: string;
  body: string;
  mood: MoodId;
  same_count: number;
};

export function moodFor(id: string) {
  return MOODS.find((m) => m.id === id) ?? MOODS[2];
}

export function isMood(id: string): id is MoodId {
  return MOODS.some((m) => m.id === id);
}

// Deterministic per-confession randomness, so the wall looks the same on every load.
function hash(n: number, salt: number) {
  let x = Math.imul(n ^ salt, 0x9e3779b1);
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca77);
  x ^= x >>> 13;
  return x >>> 0;
}

const ADJECTIVES = [
  "sleepy", "suspicious", "caffeinated", "dramatic", "feral", "polite",
  "anxious", "sparkly", "haunted", "chaotic", "sheepish", "overdressed",
  "moist", "philosophical", "unbothered", "sneaky",
];

const NOUNS = [
  "raccoon", "croissant", "goose", "houseplant", "possum", "burrito",
  "pigeon", "cactus", "gremlin", "potato", "moth", "noodle",
  "frog", "lamp", "otter", "pickle",
];

export function pseudonymFor(id: number) {
  const adjective = ADJECTIVES[hash(id, 1) % ADJECTIVES.length];
  const noun = NOUNS[hash(id, 2) % NOUNS.length];
  return `${/^[aeiou]/.test(adjective) ? "an" : "a"} ${adjective} ${noun}`;
}

export function tiltFor(id: number) {
  return ((hash(id, 3) % 70) - 35) / 10; // -3.5deg to 3.4deg
}

export function tapeTiltFor(id: number) {
  return ((hash(id, 4) % 120) - 60) / 10;
}

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
