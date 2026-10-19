import React from "react";

// A little illustrated corner for the sign-in screens: a window onto the evening, a plant and a warm mug.
// Drawn with the theme's CSS variables, so it re-colours itself with the accent and with light/dark mode.
export default function CozyScene() {
  return (
    <svg className="cozyScene" viewBox="0 0 480 560" role="img" aria-label="A cozy window with a plant and a cup of tea">
      <defs>
        <linearGradient id="cozy-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, var(--c-lilac) 55%, var(--surface))" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--c-peach) 60%, var(--surface))" />
        </linearGradient>
        <radialGradient id="cozy-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--c-butter)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--c-butter)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the wall */}
      <rect width="480" height="560" fill="color-mix(in srgb, var(--accent) 14%, var(--surface-2))" />
      <circle cx="240" cy="230" r="230" fill="url(#cozy-glow)" />

      {/* the window */}
      <g transform="translate(110 70)">
        <rect x="-14" y="-14" width="288" height="318" rx="22" fill="var(--ink)" opacity="0.88" />
        <rect width="260" height="290" rx="12" fill="url(#cozy-sky)" />
        <circle cx="190" cy="84" r="30" fill="var(--c-butter)" />
        <g className="cozyScene__cloud" fill="color-mix(in srgb, white 88%, var(--c-lilac))" opacity="0.92">
          <ellipse cx="70" cy="72" rx="34" ry="13" />
          <ellipse cx="94" cy="62" rx="22" ry="12" />
        </g>
        <path d="M0 230 Q70 190 130 220 T260 205 V290 H0Z" fill="color-mix(in srgb, var(--c-sage) 70%, var(--surface))" />
        <path d="M0 255 Q80 225 150 250 T260 240 V290 H0Z" fill="color-mix(in srgb, var(--c-sage) 90%, var(--ink))" opacity="0.7" />
        <rect x="126" y="0" width="8" height="290" fill="var(--ink)" opacity="0.88" />
        <rect x="0" y="136" width="260" height="8" fill="var(--ink)" opacity="0.88" />
      </g>

      {/* the sill */}
      <rect x="86" y="388" width="308" height="16" rx="8" fill="var(--ink)" opacity="0.88" />

      {/* a plant */}
      <g transform="translate(130 388)">
        <path d="M0 0 C-10 -42 -34 -58 -44 -92 C-10 -84 8 -48 0 0Z" fill="var(--c-sage)" />
        <path d="M6 0 C16 -52 44 -66 62 -96 C24 -96 4 -50 6 0Z" fill="color-mix(in srgb, var(--c-sage) 80%, var(--ink))" />
        <path d="M3 0 C0 -48 6 -78 4 -110 C22 -78 16 -36 3 0Z" fill="color-mix(in srgb, var(--c-sage) 90%, var(--surface))" />
        <path d="M-32 0 H42 L34 52 H-24Z" fill="var(--accent)" />
        <rect x="-36" y="-6" width="82" height="12" rx="6" fill="color-mix(in srgb, var(--accent) 80%, var(--ink))" />
      </g>

      {/* a warm mug with steam */}
      <g transform="translate(310 388)">
        <path className="cozyScene__steam" d="M18 -38 C8 -52 28 -60 18 -76" fill="none" stroke="var(--ink-soft)" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <path className="cozyScene__steam cozyScene__steam--late" d="M44 -34 C34 -48 54 -56 44 -72" fill="none" stroke="var(--ink-soft)" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <rect x="0" y="-32" width="64" height="32" rx="6" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
        <path d="M64 -24 q22 4 0 20" fill="none" stroke="var(--surface)" strokeWidth="7" strokeLinecap="round" />
        <rect x="6" y="-26" width="52" height="8" rx="4" fill="color-mix(in srgb, var(--c-clay) 80%, var(--ink))" opacity="0.85" />
      </g>

      {/* a table edge */}
      <rect x="0" y="470" width="480" height="90" fill="color-mix(in srgb, var(--accent) 35%, var(--ink))" opacity="0.9" />
      <rect x="0" y="470" width="480" height="8" fill="var(--ink)" opacity="0.2" />
    </svg>
  );
}
