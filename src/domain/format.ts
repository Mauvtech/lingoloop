export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function frDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** « 1 blocage » / « 2 blocages ». */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n > 1 ? pluralForm : singular}`;
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
