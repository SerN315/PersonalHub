import type { PartySong } from "@/app/apis/party";

// The decisions behind keeping a party's YouTube window in step, as plain functions so they can be tested without a player.

export const SEEK_JUMP_S = 1.5; // the host's playhead moved by more than it should have: that was a seek
export const DRIFT_S = 2; // a playing guest this far from the host jumps
const PAUSED_DRIFT_S = 0.7; // a paused guest is lined up more exactly
export const FRESH_MS = 20_000; // a report older than this is not trusted while the host is playing (they may have left)

// where the host is right now, in seconds (a paused host stays where they stopped)
export const hostPlace = (song: PartySong, serverMs: number) => (song.posAtMs === null ? 0 : (song.posMs + (song.playing ? Math.max(0, serverMs - song.posAtMs) : 0)) / 1000);

export const isFresh = (song: PartySong, serverMs: number) => !song.playing || (song.posAtMs !== null && serverMs - song.posAtMs < FRESH_MS);

// What this page has already done about the host's pause and track. Only a CHANGE of those is acted on, so a guest who pauses alone
// is not forced to play again.
export interface Seen {
  playing: boolean;
  index: number;
}
// the guest's own player: YouTube's state (1 playing, 2 paused, 3 buffering), the playhead and the track
export interface Live {
  state: number;
  time: number;
  index: number;
}
export interface Plan {
  seen: Seen;
  goToTrack?: number;
  play?: true;
  pause?: true;
  seekTo?: number;
}

export function planFollow(song: PartySong, serverMs: number, seen: Seen, live: Live): Plan {
  const plan: Plan = { seen: { ...seen } };
  let changedTrack = false;
  if (song.kind === "playlist" && song.index !== seen.index) {
    plan.seen.index = song.index;
    plan.goToTrack = song.index;
    changedTrack = true;
  }
  if (song.playing !== seen.playing) {
    plan.seen.playing = song.playing;
    if (song.playing) plan.play = true;
    else plan.pause = true;
  }
  // after a track change the next report puts the place right, once the new track is up; and a stale report is not followed
  if (changedTrack || !isFresh(song, serverMs)) return plan;
  if (song.kind === "playlist" && live.index !== song.index) return plan;

  const target = hostPlace(song, serverMs);
  const off = Math.abs(live.time - target);
  const follows = song.playing ? (live.state === 1 || live.state === 3) && off > DRIFT_S : off > PAUSED_DRIFT_S; // a guest who paused alone is left alone
  if (follows) plan.seekTo = target;
  return plan;
}

// Is what the host's player just did worth telling everyone about right away? `expected` is where the playhead would be if nothing had happened.
export function hostMoved(before: { time: number; playing: boolean; index: number }, now: { time: number; playing: boolean; index: number }, elapsedS: number): boolean {
  const expected = before.playing ? before.time + elapsedS : before.time;
  const jumped = Math.abs(now.time - expected) > (before.playing ? SEEK_JUMP_S : 0.5);
  return jumped || now.playing !== before.playing || now.index !== before.index;
}
