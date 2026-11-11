type Props = { active: boolean };

const second = (active: boolean) => (active ? '#F2A541' : '#A9D0DF');

export function LighthouseIcon({ active }: Props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M10 5l4-3 4 3z" fill="currentColor" />
      <rect x="11" y="5" width="6" height="5" fill={second(active)} />
      <path d="M11 10h6l2 14H9z" fill="currentColor" />
      <rect x="6" y="24" width="16" height="2.5" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function SailboatIcon({ active }: Props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M13 3v14H5z" fill="currentColor" />
      <path d="M15 6l8 11h-8z" fill={active ? '#F2A541' : '#A9D0DF'} />
      <path d="M4 19h20l-3 6H7z" fill="currentColor" />
    </svg>
  );
}

export function RockWaveIcon({ active }: Props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6 18l5-12 4 5 3-7 5 14z" fill="currentColor" />
      <path d="M3 23c3-2.5 5 2.5 8 0s5 2.5 8 0 4 1.5 6 0" stroke={second(active)} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
