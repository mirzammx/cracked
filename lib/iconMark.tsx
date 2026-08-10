/**
 * The "Split" mark (app/icon.svg) redrawn with plain hex colors for
 * next/og's ImageResponse (Satori) — its CSS color parser doesn't reliably
 * support oklch(), which the SVG source and rest of the app use.
 */
export function iconMarkElement(size: number) {
  const glyph = size * 0.72;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1c1c17",
        borderRadius: size * 0.24,
      }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 100 100" fill="none">
        <g transform="translate(50 52) scale(0.72) translate(-50 -52)">
          <path d="M50 94 L50 58" stroke="#f5f4f0" strokeWidth="9" strokeLinecap="round" />
          <path d="M50 58 L26 40 L14 16" stroke="#7c9df0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 40 L38 16" stroke="#dd8de6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 58 L74 40 L62 16" stroke="#6dd6a0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 40 L86 16" stroke="#f2977a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}
