"use client";
import { memo } from "react";

// A wooden hourglass drawn in crisp pixel-style shapes. `sand` is how full the top bulb is (1 = just turned over, 0 = run out). Sand
// leaves the top and builds a pile below, and a thin stream falls while it runs. Pressing it turns it over and starts the timer.
const TOP = "28,16 92,16 92,30 64,88 56,88 28,30";
const BOTTOM = "56,102 64,102 92,160 92,174 28,174 28,160";
const NECK_Y = 88;
const BASE_Y = 174;

function HourglassBase({ sand, running, turning }: { sand: number; running: boolean; turning: boolean }) {
  // sand fills a triangle-ish bulb, so its height changes with the square root of how much there is
  const topHeight = (NECK_Y - 16) * Math.sqrt(sand);
  const pileHeight = (BASE_Y - 102) * (1 - Math.sqrt(sand));
  const pileTop = BASE_Y - pileHeight;
  return (
    <svg viewBox="0 0 120 190" className={`hourglass ${turning ? "is-turning" : ""}`} shapeRendering="crispEdges" aria-hidden>
      <defs>
        <clipPath id="hg-top"><polygon points={TOP} /></clipPath>
        <clipPath id="hg-bottom"><polygon points={BOTTOM} /></clipPath>
      </defs>
      {/* the posts, behind the glass */}
      <rect x="14" y="14" width="5" height="164" className="hg-brass" />
      <rect x="101" y="14" width="5" height="164" className="hg-brass" />
      {/* sand: what is left above, the pile below, and the thin stream between */}
      <g clipPath="url(#hg-top)"><rect x="20" y={NECK_Y - topHeight} width="80" height={topHeight + 1} className="hg-sand" /></g>
      <g clipPath="url(#hg-bottom)"><rect x="20" y={pileTop} width="80" height={pileHeight + 1} className="hg-sand" /></g>
      {running && sand > 0 && <rect x="59" y={NECK_Y} width="2" height={Math.max(0, pileTop - NECK_Y)} className="hg-stream" />}
      {/* the glass */}
      <polygon points={TOP} className="hg-glass" />
      <polygon points={BOTTOM} className="hg-glass" />
      <rect x="56" y="88" width="8" height="14" className="hg-glass" />
      <polyline points="34,22 34,30 58,78" className="hg-shine" />
      {/* the wooden caps */}
      <rect x="8" y="4" width="104" height="12" className="hg-wood" />
      <rect x="8" y="4" width="104" height="3" className="hg-wood-hi" />
      <rect x="8" y="174" width="104" height="12" className="hg-wood" />
      <rect x="8" y="183" width="104" height="3" className="hg-wood-lo" />
    </svg>
  );
}

export default memo(HourglassBase);
