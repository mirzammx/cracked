/** The "Split" mark — one trunk cracking into branches, same visual language as the Goal Map's branch colors. Also lives standalone as app/icon.svg (browser tab favicon). */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="flex-none">
      <path d="M50 94 L50 58" stroke="#f2efe8" strokeWidth={7} strokeLinecap="round" />
      <path d="M50 58 L26 40 L14 16" stroke="oklch(0.78 0.16 250)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 40 L38 16" stroke="oklch(0.78 0.16 310)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 58 L74 40 L62 16" stroke="oklch(0.78 0.16 145)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M74 40 L86 16" stroke="oklch(0.78 0.16 25)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={50} cy={58} r={8} fill="#1c1c16" stroke="#f2efe8" strokeWidth={6} />
      <circle cx={14} cy={16} r={5.5} fill="oklch(0.78 0.16 250)" />
      <circle cx={38} cy={16} r={5.5} fill="oklch(0.78 0.16 310)" />
      <circle cx={62} cy={16} r={5.5} fill="oklch(0.78 0.16 145)" />
      <circle cx={86} cy={16} r={5.5} fill="oklch(0.78 0.16 25)" />
    </svg>
  );
}
