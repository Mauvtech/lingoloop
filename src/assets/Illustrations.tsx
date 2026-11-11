import type { CharacterId } from '../../shared/characters';

/** Illustrations portées depuis design/maquettes : formes pleines à plat, palette LingoLoop. */

type Labelled = { label?: string };
const a11y = (label?: string) => (label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const });

export function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <circle cx="15" cy="15" r="10" stroke="#F2A541" strokeWidth="8" />
      <circle cx="15" cy="15" r="10" stroke="#1F4455" strokeWidth="8" strokeDasharray="7.85 7.85" />
    </svg>
  );
}

export function AvatarSmall() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="#A9D0DF" />
      <path d="M12 25h20l-3 8H15z" fill="#F2A541" />
      <path d="M1.5 30a22 22 0 0 0 41 0z" fill="#2B6A84" />
      <rect x="21" y="9" width="2" height="16" fill="#1F4455" />
      <path d="M24 10l8 13h-8z" fill="#FFFFFF" />
    </svg>
  );
}

export function AvatarLarge() {
  return (
    <svg width="72" height="72" viewBox="0 0 44 44" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="22" cy="22" r="22" fill="#A9D0DF" />
      <circle cx="33" cy="12" r="4" fill="#FFFFFF" />
      <path d="M12 25h20l-3 8H15z" fill="#F2A541" />
      <path d="M1.5 30a22 22 0 0 0 41 0z" fill="#2B6A84" />
      <rect x="21" y="9" width="2" height="16" fill="#1F4455" />
      <path d="M24 10l8 13h-8z" fill="#FFFFFF" />
    </svg>
  );
}

export function HomeScene({ label }: Labelled) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 342 232" preserveAspectRatio="xMaxYMid slice" {...a11y(label)} style={{ position: 'absolute', inset: 0, display: 'block' }}>
      <rect width="342" height="232" fill="#A9D0DF" />
      <circle cx="222" cy="40" r="18" fill="#FFFFFF" />
      <path d="M298 26q5-5 9 0q5-5 9 0" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M310 44q4-4 7 0q4-4 7 0" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M218 124h108l-10 30h-88z" fill="#F2A541" />
      <rect x="270" y="40" width="4" height="84" fill="#1F4455" />
      <path d="M276 46l44 70h-44z" fill="#FFFFFF" />
      <path d="M268 62v54h-34z" fill="#EAF4F8" />
      <text x="291" y="109" textAnchor="middle" fontFamily="Lato, sans-serif" fontWeight="900" fontSize="30" fill="#1F4455">?</text>
      <rect y="152" width="342" height="80" fill="#2B6A84" />
      <path d="M228 152h88l-8 14h-72z" fill="#245D75" />
      <path d="M224 200h30M270 214h44" stroke="#4E88A0" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function SearchScene() {
  return (
    <svg width="390" height="320" viewBox="0 0 390 320" aria-hidden="true" style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 320 }}>
      <circle className="pulse" cx="195" cy="210" r="170" fill="#B7D9E6" />
      <circle cx="195" cy="210" r="124" fill="#C6E2EC" />
      <circle cx="195" cy="210" r="78" fill="#D8ECF3" />
      <circle cx="318" cy="60" r="22" fill="#FFFFFF" />
      <path d="M50 78q7-7 13 0q7-7 13 0" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M84 112q5-5 9 0q5-5 9 0" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M131 276h128l-12 44h-104z" fill="#F2A541" />
      <rect x="193" y="120" width="5" height="156" fill="#1F4455" />
      <path d="M201 128l66 138h-66z" fill="#FFFFFF" />
      <path d="M190 156v110h-52z" fill="#EAF4F8" />
      <text x="226" y="252" textAnchor="middle" fontFamily="Lato, sans-serif" fontWeight="900" fontSize="52" fill="#1F4455">?</text>
      <path d="M198 120h22l-6 6 6 6h-22z" fill="#F2A541" />
    </svg>
  );
}

export function HarbourScene({ label }: Labelled) {
  return (
    <svg width="100%" height="120" viewBox="0 0 342 120" preserveAspectRatio="xMidYMid slice" {...a11y(label)} style={{ display: 'block' }}>
      <rect width="342" height="120" fill="#A9D0DF" />
      <circle cx="150" cy="34" r="15" fill="#FFFFFF" />
      <path d="M176 24q5-5 9 0q5-5 9 0" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M43 20l9-8 9 8z" fill="#1F4455" />
      <rect x="45" y="20" width="14" height="10" fill="#1F4455" />
      <rect x="48" y="22" width="8" height="6" fill="#F2A541" />
      <path d="M44 30h16l4 50H40z" fill="#FFFFFF" />
      <path d="M42.7 46h18.6l.8 10H41.9z" fill="#F2A541" />
      <path d="M20 92l16-14h34l14 14z" fill="#1F4455" />
      <path d="M200 66h80l-10 24h-60z" fill="#F2A541" />
      <rect x="237" y="20" width="4" height="46" fill="#1F4455" />
      <path d="M243 24l30 38h-30z" fill="#FFFFFF" />
      <path d="M237 20h-16l5 5-5 5h16z" fill="#F2A541" />
      <rect y="84" width="342" height="36" fill="#2B6A84" />
      <path d="M208 84h64l-6 10h-52z" fill="#245D75" />
      <path d="M110 102h30M296 106h26" stroke="#4E88A0" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function RocksScene({ label }: Labelled) {
  return (
    <svg width="100%" height="96" viewBox="0 0 342 96" preserveAspectRatio="xMidYMid slice" {...a11y(label)} style={{ display: 'block' }}>
      <rect width="342" height="96" fill="#A9D0DF" />
      <circle cx="206" cy="26" r="13" fill="#FFFFFF" />
      <path d="M30 66l14-30 10 10 8-16 16 36z" fill="#FFFFFF" />
      <path d="M126 66l9-16 8 6 8-11 11 21z" fill="#FFFFFF" />
      <path d="M214 64l6-9 6 4 5-5 7 10z" fill="#FFFFFF" />
      <path d="M268 48h50l-7 18h-36z" fill="#F2A541" />
      <rect x="290" y="14" width="3" height="34" fill="#1F4455" />
      <path d="M295 17l19 28h-19z" fill="#FFFFFF" />
      <rect y="60" width="342" height="36" fill="#2B6A84" />
      <path d="M36 60h36l-8 16H46z" fill="#3D7C95" />
      <path d="M130 60h28l-6 10h-16z" fill="#3D7C95" />
      <path d="M274 60h38l-4 8h-30z" fill="#245D75" />
      <path d="M90 80h26M184 84h34" stroke="#4E88A0" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function TileSailboat() {
  return (
    <svg width="56" height="56" viewBox="0 0 28 28" aria-hidden="true" style={{ position: 'absolute', right: 10, top: 12 }}>
      <path d="M13 3v14H5z" fill="#FFFFFF" />
      <path d="M15 6l8 11h-8z" fill="#A9D0DF" />
      <path d="M4 19h20l-3 6H7z" fill="#F2A541" />
    </svg>
  );
}

export function TileHourglass() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true" style={{ position: 'absolute', right: 12, top: 14 }}>
      <path d="M6 3h12v2l-4.5 7 4.5 7v2H6v-2l4.5-7L6 5z" fill="#1F4455" />
      <path d="M8.6 18.5l3.4-5 3.4 5z" fill="#F2A541" />
    </svg>
  );
}

export function ImprovingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6 18l5-12 4 5 3-7 5 14z" fill="#A9D0DF" />
      <path d="M3 23c3-2.5 5 2.5 8 0s5 2.5 8 0 4 1.5 6 0" stroke="#1B6650" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function SailboatBadge() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M13 3v14H5z" fill="#FFFFFF" />
      <path d="M15 6l8 11h-8z" fill="#A9D0DF" />
      <path d="M4 19h20l-3 6H7z" fill="#F2A541" />
    </svg>
  );
}

/** Décor propre à chaque personnage (en haut à droite du portrait) et couleur de badge. */
const DECOR: Record<CharacterId, { badge: string; decor: React.JSX.Element }> = {
  nova: {
    badge: '#F2A541',
    decor: (
      <>
        <circle cx="284" cy="116" r="24" fill="#F2A541" />
        <path d="M240 126l88-20" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  },
  milo: {
    badge: '#FFFFFF',
    decor: (
      <>
        <path d="M252 112h64a32 32 0 0 1-64 0z" fill="#F2A541" />
        <path d="M270 96q-6-10 0-20M284 96q-6-10 0-20M298 96q-6-10 0-20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  iris: {
    badge: '#A9D0DF',
    decor: (
      <>
        <circle cx="278" cy="108" r="22" fill="none" stroke="#F2A541" strokeWidth="8" />
        <path d="M294 124l20 20" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
      </>
    ),
  },
  tom: {
    badge: '#F2A541',
    decor: (
      <>
        <circle cx="284" cy="86" r="8" fill="none" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M284 94v52M266 112h36" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        <path d="M258 132a26 26 0 0 0 52 0" stroke="#F2A541" strokeWidth="6" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  lea: {
    badge: '#A9D0DF',
    decor: (
      <>
        <rect x="252" y="84" width="64" height="52" rx="4" fill="#F2A541" />
        <rect x="260" y="92" width="48" height="36" fill="#A9D0DF" />
        <path d="M260 128l16-18 12 12 8-8 12 14z" fill="#FFFFFF" />
      </>
    ),
  },
  sam: {
    badge: '#FFFFFF',
    decor: (
      <>
        <path d="M276 82v44" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        <path d="M276 82l30-8v40" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="266" cy="128" r="12" fill="#F2A541" />
        <circle cx="296" cy="116" r="12" fill="#F2A541" />
      </>
    ),
  },
};

/** Portrait sur le gabarit de Nova (tête blanche, visière sombre, yeux, sourire). */
export function Portrait({ characterId, label }: { characterId: CharacterId; label: string }) {
  const { badge, decor } = DECOR[characterId];
  return (
    <svg role="img" aria-label={label} width="342" height="330" viewBox="0 0 342 330" style={{ display: 'block', width: '100%', height: '100%', maxWidth: 342 }} preserveAspectRatio="xMidYMax meet">
      <circle cx="52" cy="92" r="30" fill="#FFFFFF" />
      <circle cx="42" cy="84" r="6" fill="#EAF4F8" />
      <circle cx="62" cy="102" r="4" fill="#EAF4F8" />
      <circle cx="110" cy="34" r="2.5" fill="#FFFFFF" />
      <circle cx="306" cy="52" r="2.5" fill="#FFFFFF" />
      <circle cx="234" cy="26" r="2" fill="#FFFFFF" />
      <circle cx="24" cy="176" r="2" fill="#FFFFFF" />
      <circle cx="318" cy="186" r="2" fill="#FFFFFF" />
      {decor}
      <path d="M61 330c0-62 49-104 110-104s110 42 110 104z" fill="#FFFFFF" />
      <path d="M131 250h80v40a40 40 0 0 1-80 0z" fill="#A9D0DF" />
      <circle cx="171" cy="150" r="86" fill="#FFFFFF" />
      <rect x="103" y="104" width="136" height="96" rx="44" fill="#1F4455" />
      <path d="M124 148c4-20 18-30 36-32" stroke="#4E88A0" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="150" cy="156" r="6" fill="#FFFFFF" />
      <circle cx="192" cy="156" r="6" fill="#FFFFFF" />
      <path d="M157 176c8 8 20 8 28 0" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="171" cy="272" r="10" fill={badge} />
    </svg>
  );
}
