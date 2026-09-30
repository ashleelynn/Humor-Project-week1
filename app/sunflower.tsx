const HEAD = [
  "     .-'-'-.",
  "   .' \\ | / '.",
  "  / -.@@@@@.- \\",
  " | --@ o o @-- |",
  "  \\ -'@\\_/@'- /",
  "   '. / | \\ .'",
  "     '-.-.-'",
];
const STEM = ["        |", "     \\  |", "      \\ |  /", "       \\| /", "        |/"];

const shift = (rows: string[], n: number) => rows.map((r) => (n < 0 ? r.slice(-n) : " ".repeat(n) + r));
const withEyes = (eyes: string) => [...HEAD.slice(0, 3), ` | --@ ${eyes} @-- |`, ...HEAD.slice(4), ...STEM];

// Every frame is exactly 12 rows. Blank rows are " " (never ""), so no frame starts with a newline.
const FRAMES: Record<string, string[]> = {
  bud: [" ", " ", " ", " ", "        ,", "       (@)", "        |", ...STEM],
  half: [" ", " ", "      \\ | /", "    --(@@@)--", "      / | \\", "        |", "        |", ...STEM],
  c: withEyes("o o"),
  l: [...shift(HEAD, -1), "       \\", ...STEM.slice(1)],
  r: [...shift(HEAD, 1), "         /", ...STEM.slice(1)],
  wink: withEyes("o -"),
  shy: withEyes("> <"),
  happy: withEyes("^ ^"),
};
const HERO = ["bud", "half", "c", "l", "r", "wink", "shy", "happy"];
const PEEK = ["c", "wink"];

export function Sunflower({ variant }: { variant: "hero" | "peek" }) {
  return (
    <div className={`sunflower sunflower--${variant}`} aria-hidden="true">
      <div className="sf-disc" />
      {(variant === "hero" ? HERO : PEEK).map((k) => (
        <pre key={k} className={`sf-frame sf-${k}`}>
          {FRAMES[k].join("\n")}
        </pre>
      ))}
    </div>
  );
}

export function SleepyFlower() {
  return (
    <pre className="empty-art" aria-hidden="true">
      {"   .-'-'-.   "}
      <span className="z">z</span>
      {"\n  ( -   - )"}
      <span className="z">z</span>
      {"\n   '-._.-'\n      |\n    \\ |  /\n     \\| /\n      |/"}
    </pre>
  );
}

const WILT = [
  "          ___",
  "   .-'-.-'   \\",
  "  ( x  x )    |",
  "   '-.-'      |",
  "            \\ |",
  "             \\|",
  "              |",
].join("\n");

export function WiltedFlower() {
  return (
    <pre className="empty-art" aria-hidden="true">
      {WILT}
    </pre>
  );
}
