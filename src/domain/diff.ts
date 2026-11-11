export interface Segment {
  text: string;
  changed: boolean;
}

export interface WordDiff {
  said: Segment[];
  corrected: Segment[];
}

function tokens(s: string): string[] {
  return s.split(/(\s+)/).filter((t) => t.length > 0);
}

const comparable = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

/** Diff par mots (LCS) : segments retirés dans `said`, ajoutés dans `corrected`. */
export function diffWords(said: string, corrected: string): WordDiff {
  const a = tokens(said);
  const b = tokens(corrected);
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const row = lcs[i] as number[];
      row[j] = comparable(a[i] as string) === comparable(b[j] as string) ? (lcs[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(lcs[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  }
  const keepA = new Array<boolean>(n).fill(false);
  const keepB = new Array<boolean>(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (comparable(a[i] as string) === comparable(b[j] as string)) {
      keepA[i] = true;
      keepB[j] = true;
      i++;
      j++;
    } else if ((lcs[i + 1]?.[j] ?? 0) >= (lcs[i]?.[j + 1] ?? 0)) i++;
    else j++;
  }
  return { said: merge(a, keepA), corrected: merge(b, keepB) };
}

function merge(toks: string[], keep: boolean[]): Segment[] {
  const out: Segment[] = [];
  toks.forEach((t, idx) => {
    const isSpace = /^\s+$/.test(t);
    // Un espace prend l'état de ses voisins s'ils sont tous deux modifiés, sinon il reste neutre.
    const changed = isSpace ? !keep[idx - 1] && !keep[idx + 1] && idx > 0 && idx < toks.length - 1 : !keep[idx];
    const last = out[out.length - 1];
    if (last && last.changed === changed) last.text += t;
    else out.push({ text: t, changed });
  });
  return out;
}
