import type { BlockageKey } from '../../shared/schemas';

/** Pictogrammes portés depuis design/maquettes (formes pleines, palette LingoLoop). */

type SizeProps = { size?: number };

export function FlagIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3" width="2.5" height="18" rx="1.2" fill="#1F4455" />
      <path d="M7.5 4h12l-3.5 4.5 3.5 4.5h-12z" fill="#F2A541" />
    </svg>
  );
}

export function HourglassIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12v2l-4.5 7 4.5 7v2H6v-2l4.5-7L6 5z" fill="#1F4455" />
      <path d="M8.6 18.5l3.4-5 3.4 5z" fill="#F2A541" />
    </svg>
  );
}

export function BubbleIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2z" fill="#2B6A84" />
      <rect x="6" y="8" width="4" height="2.6" rx="1.3" fill="#FFFFFF" />
      <rect x="11.5" y="8" width="6.5" height="2.6" rx="1.3" fill="#F2A541" />
    </svg>
  );
}

export function ShortAnswerIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2z" fill="#A9D0DF" />
      <path d="M13 16a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2v2.5L16.5 20H15a2 2 0 0 1-2-2z" fill="#2B6A84" />
    </svg>
  );
}

export function AgreementIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="8" height="14" rx="2" fill="#2B6A84" />
      <rect x="13" y="5" width="8" height="14" rx="2" fill="#A9D0DF" />
      <path d="M9 12h6" stroke="#F2A541" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function WordOrderIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="11" height="4" rx="2" fill="#2B6A84" />
      <rect x="3" y="10" width="18" height="4" rx="2" fill="#A9D0DF" />
      <rect x="10" y="16" width="11" height="4" rx="2" fill="#F2A541" />
    </svg>
  );
}

export function QuestionIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#2B6A84" />
      <path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="17.6" r="1.5" fill="#F2A541" />
    </svg>
  );
}

export function NotebookIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" fill="#2B6A84" />
      <rect x="5" y="3" width="3.5" height="18" rx="1.5" fill="#1F4455" />
      <rect x="11" y="7" width="6" height="2.4" rx="1.2" fill="#FFFFFF" />
      <rect x="11" y="11" width="4" height="2.4" rx="1.2" fill="#F2A541" />
    </svg>
  );
}

export function LockIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#1F4455" strokeWidth="2.4" fill="none" />
      <rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="#2B6A84" />
      <circle cx="12" cy="15.7" r="1.8" fill="#F2A541" />
    </svg>
  );
}

export function BellIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0-6 6v5l-2 3.5h16L18 14V9a6 6 0 0 0-6-6z" fill="#2B6A84" />
      <circle cx="12" cy="20" r="2" fill="#F2A541" />
    </svg>
  );
}

export function DownloadIcon({ size = 24 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="16" width="16" height="4" rx="2" fill="#1F4455" />
      <path d="M12 3v9" stroke="#2B6A84" strokeWidth="3" strokeLinecap="round" />
      <path d="M7.5 9.5L12 14l4.5-4.5z" fill="#F2A541" />
    </svg>
  );
}

/** Chevron, croix et flèche retour : tracés simples en currentColor. */
export function ChevronRight({ size = 20 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function CloseIcon({ size = 20 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BackIcon({ size = 22 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function CheckIcon({ size = 22 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function SpeakerIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9h4l6-5v16l-6-5H3z" fill="currentColor" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="#F2A541" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19.2 6a8.5 8.5 0 0 1 0 12" stroke="#F2A541" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8.5" y="2" width="7" height="13" rx="3.5" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <rect x="11" y="18" width="2" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5L21 3l-6.5 18-3-7.5z" fill="currentColor" />
      <path d="M11.5 13.5L21 3" stroke="#F2A541" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function NextIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5l10 7-10 7z" fill="currentColor" />
      <rect x="16.5" y="5" width="3" height="14" rx="1.5" fill="#F2A541" />
    </svg>
  );
}

const BLOCKAGE_ICONS: Record<BlockageKey, (p: SizeProps) => React.JSX.Element> = {
  past_tense: HourglassIcon,
  vocabulary: BubbleIcon,
  short_answers: ShortAnswerIcon,
  agreement: AgreementIcon,
  word_order: WordOrderIcon,
  questions: QuestionIcon,
};

export function BlockageIcon({ blockageKey, size = 28 }: { blockageKey: BlockageKey; size?: number }) {
  const Icon = BLOCKAGE_ICONS[blockageKey];
  return <Icon size={size} />;
}
