// A soft two-note "ting" for a new notification (the Focus timer's three-note chime stays its own). Browsers only allow sound after the
// person has touched the page, so the first tap or key press prepares it; a notification that arrives before that is silent, never an error.

let context: AudioContext | null = null;
let armed = false;

function prepare() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    context ??= new Ctor();
    if (context.state === "suspended") void context.resume();
  } catch {
    /* no audio: the card and the bell still tell you */
  }
}

export function armSound() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const once = () => {
    prepare();
    window.removeEventListener("pointerdown", once, true);
    window.removeEventListener("keydown", once, true);
  };
  window.addEventListener("pointerdown", once, true);
  window.addEventListener("keydown", once, true);
}

export function playCue() {
  prepare();
  if (!context || context.state !== "running") return;
  const begin = context.currentTime + 0.02;
  [987.77, 1318.51].forEach((hz, i) => {
    const osc = context!.createOscillator();
    const gain = context!.createGain();
    osc.type = "sine";
    osc.frequency.value = hz;
    const at = begin + i * 0.13;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.11, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.75);
    osc.connect(gain).connect(context!.destination);
    osc.start(at);
    osc.stop(at + 0.8);
  });
}
