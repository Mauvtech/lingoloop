import type { Blockage, Turn } from './schemas.js';

/** Normalisation utilisée pour comparer une citation aux tours utilisateur. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function userTexts(turns: readonly Turn[]): string[] {
  return turns.filter((t) => t.role === 'user').map((t) => t.text);
}

/** Vrai si `said` apparaît (après normalisation) dans au moins un tour utilisateur. */
export function isQuoteFound(said: string, turns: readonly Turn[]): boolean {
  const needle = normalizeText(said);
  if (!needle) return false;
  return userTexts(turns).some((t) => normalizeText(t).includes(needle));
}

/** Blocages dont l'exemple cite une phrase que l'utilisateur n'a pas dite. */
export function invalidQuotes(blockages: readonly Blockage[], turns: readonly Turn[]): Blockage[] {
  return blockages.filter((b) => b.said !== undefined && !isQuoteFound(b.said, turns));
}

/**
 * Règles finales (§7.2) : exemple retiré s'il est inventé ou incomplet, clés dédoublonnées,
 * tri par gravité puis occurrences, 3 blocages maximum.
 */
export function finalizeBlockages(blockages: readonly Blockage[], turns: readonly Turn[]): Blockage[] {
  const seen = new Set<string>();
  const cleaned: Blockage[] = [];
  for (const b of blockages) {
    if (seen.has(b.key)) continue;
    seen.add(b.key);
    const hasValidExample =
      b.said !== undefined && b.corrected !== undefined && isQuoteFound(b.said, turns);
    const { said, corrected, ...rest } = b;
    cleaned.push(hasValidExample ? { ...rest, said, corrected } : rest);
  }
  return cleaned
    .map((b, i) => ({ b, i }))
    .sort((x, y) => y.b.severity - x.b.severity || y.b.occurrences - x.b.occurrences || x.i - y.i)
    .slice(0, 3)
    .map(({ b }) => b);
}
