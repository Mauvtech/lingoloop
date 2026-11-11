import { CHARACTERS, type Character } from '../../shared/characters';

/** Tire un personnage au hasard en excluant `exclude` (s'il reste des candidats). */
export function pickCharacter(exclude: readonly string[], random: () => number = Math.random): Character {
  const pool = CHARACTERS.filter((c) => !exclude.includes(c.id));
  const candidates = pool.length > 0 ? pool : CHARACTERS;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index] as Character;
}

/** Générateur pseudo-aléatoire déterministe (tests). */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
