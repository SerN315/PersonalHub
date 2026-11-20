"use client";
import { memo, useId } from "react";

// A smooth glass hourglass with warm wood caps. `sand` is how full the top bulb is (1 = just turned over, 0 = run out). The surface of the
// sand dips a little while it runs, a pile builds below, and a thin stream of grains falls between them. Pressing it turns it over.
const NECK_Y = 95;
const TOP_Y = 22;
const BASE_Y = 168;
// one outline for the whole glass: two bulbs that curve into a narrow neck
const GLASS = "M30 22 H90 C90 60 66 76 66 95 C66 114 90 130 90 168 H30 C30 130 54 114 54 95 C54 76 30 60 30 22 Z";

function HourglassBase({ sand, running, turning }: { sand: number; running: boolean; turning: boolean }) {
  const id = useId().replace(/:/g, "");
  // a funnel holds its sand in a shape that narrows, so its height changes with the square root of how much there is
  const topHeight = (NECK_Y - TOP_Y) * Math.sqrt(Math.min(1, Math.max(0, sand)));
  const surface = NECK_Y - topHeight;
  const pileHeight = (BASE_Y - NECK_Y - 8) * (1 - Math.sqrt(Math.min(1, Math.max(0, sand))));
  const peak = BASE_Y - pileHeight;
  const edge = BASE_Y - pileHeight * 0.55;
  const dip = running && sand > 0 ? 3.5 : 0; // the surface sinks in the middle while sand is leaving
  const streaming = running && sand > 0 && sand < 1;
  return (
    <svg viewBox="0 0 120 190" className={`hourglass ${turning ? "is-turning" : ""} ${running ? "is-running" : ""}`} aria-hidden>
      <defs>
        <clipPath id={`${id}-glass`}>
          <path d={GLASS} />
        </clipPath>
        <linearGradient id={`${id}-sand`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="hg-sand-hi" />
          <stop offset="1" className="hg-sand-lo" />
        </linearGradient>
        <linearGradient id={`${id}-glassfill`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#cfe6ee" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="hg-wood-hi" />
          <stop offset="1" className="hg-wood-lo" />
        </linearGradient>
        <linearGradient id={`${id}-post`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className="hg-brass-lo" />
          <stop offset="0.5" className="hg-brass-hi" />
          <stop offset="1" className="hg-brass-lo" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="184" rx="38" ry="3.2" className="hg-ground" />

      {/* two slim brass posts behind the glass */}
      <rect x="15" y="16" width="3.5" height="160" rx="1.75" fill={`url(#${id}-post)`} />
      <rect x="101.5" y="16" width="3.5" height="160" rx="1.75" fill={`url(#${id}-post)`} />

      {/* the glass: a soft tint, then the sand inside it, then the bright edge on top */}
      <path d={GLASS} fill={`url(#${id}-glassfill)`} />
      <g clipPath={`url(#${id}-glass)`}>
        {/* what is left above: its surface dips in the middle while it runs */}
        <path d={`M20 ${surface} Q60 ${surface + dip} 100 ${surface} V${NECK_Y + 6} H20 Z`} fill={`url(#${id}-sand)`} />
        {/* the pile below: a gentle mound */}
        {pileHeight > 0.5 && <path d={`M20 ${BASE_Y + 4} V${edge} Q60 ${2 * peak - edge} 100 ${edge} V${BASE_Y + 4} Z`} fill={`url(#${id}-sand)`} />}
        {/* the stream of grains */}
        {streaming && (
          <>
            <line x1="60" y1={NECK_Y - 6} x2="60" y2={peak + 1} className="hg-stream-glow" />
            <line x1="60" y1={NECK_Y - 6} x2="60" y2={peak + 1} className="hg-stream" />
          </>
        )}
      </g>
      <path d={GLASS} fill="none" stroke={`url(#${id}-edge)`} strokeWidth="2" strokeLinejoin="round" />
      <path d="M36.5 30 C36.5 50 48 62 56 78" className="hg-shine" />
      <path d="M84 134 C84 142 86 150 86 160" className="hg-shine hg-shine--soft" />

      {/* the wood caps */}
      <rect x="10" y="6" width="100" height="16" rx="8" fill={`url(#${id}-wood)`} />
      <rect x="14" y="8" width="92" height="2.5" rx="1.25" className="hg-cap-light" />
      <rect x="10" y="168" width="100" height="16" rx="8" fill={`url(#${id}-wood)`} />
      <rect x="14" y="170" width="92" height="2.5" rx="1.25" className="hg-cap-light" />
    </svg>
  );
}

export default memo(HourglassBase);
