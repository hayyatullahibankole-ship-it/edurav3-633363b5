// Arcade sound effects (synthesised, no files) + spoken commentator.
const MUTE_KEY = "edura_arcade_muted";
let ctx: AudioContext | null = null;
const ac = () => {
  if (typeof window === "undefined") return null;
  const C = window.AudioContext || (window as any).webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};
export const isMuted = () => typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
export const setMuted = (m: boolean) => {
  localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  if (m && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
};

function tone(freq: number, start: number, dur: number, type: OscillatorType = "square", vol = 0.08) {
  const a = ac(); if (!a || isMuted()) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  const t = a.currentTime + start;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const seq = (notes: number[], step: number, type?: OscillatorType, vol?: number) =>
  notes.forEach((f, i) => tone(f, i * step, step * 1.6, type, vol));

export const sfx = {
  start: () => seq([392, 523, 659, 784], 0.12, "triangle", 0.12),
  correct: () => seq([659, 880, 1175], 0.08, "square", 0.07),
  wrong: () => { tone(196, 0, 0.35, "sawtooth", 0.08); tone(147, 0.18, 0.45, "sawtooth", 0.08); },
  tick: () => tone(1200, 0, 0.04, "square", 0.04),
  lifeline: () => seq([523, 784, 523, 784], 0.06, "triangle", 0.08),
  suspense: () => { tone(110, 0, 1.2, "sine", 0.1); tone(116, 0, 1.2, "sine", 0.06); },
  win: () => seq([523, 659, 784, 1047, 784, 1047, 1319], 0.11, "square", 0.08),
  lose: () => seq([392, 330, 262, 196], 0.18, "triangle", 0.1),
  streak: () => seq([880, 1109, 1319, 1760], 0.05, "square", 0.06),
};

export type CommentEvent = "start" | "correct" | "wrong" | "streak" | "lifeline" | "haven" | "final" | "win" | "lose" | "hurry" | "walk";
export const COMMENTARY: Record<CommentEvent, string[]> = {
  start: ["Ladies and gentlemen, welcome to the arena!", "Lights on, crowd ready. Let's play!", "The clock is set. Show us what you've got!"],
  correct: ["Correct! The crowd goes wild!", "Yes! That's the one!", "Brilliant answer!", "Spot on! Keep it coming!", "Na so! Correct!"],
  wrong: ["Oh no! That's not it.", "Ouch! So close.", "Wrong answer, the crowd gasps!"],
  streak: ["You're on fire!", "Unstoppable! What a streak!", "Multiplier up! Keep going!"],
  lifeline: ["A lifeline! Smart move.", "Using a lifeline. Let's see if it helps."],
  haven: ["Safe haven reached! Those points are locked in!"],
  final: ["This is it. The final question for one million!"],
  win: ["Champion! You've conquered the ladder!", "History made! What a performance!"],
  lose: ["And that's the end of the road. Great effort!", "Game over, but you'll be back stronger!"],
  hurry: ["Ten seconds left! Hurry!", "The clock is running out!"],
  walk: ["Walking away with the prize. A wise decision!"],
};
export const pickLine = (e: CommentEvent, rnd = Math.random) => {
  const l = COMMENTARY[e]; return l[Math.floor(rnd() * l.length)];
};

export function speak(text: string) {
  if (isMuted() || typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.08; u.pitch = 1.05; u.volume = 1;
  const v = speechSynthesis.getVoices().find((v) => /en-(NG|GB|US)/i.test(v.lang) && /male|daniel|google uk/i.test(v.name))
    ?? speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
