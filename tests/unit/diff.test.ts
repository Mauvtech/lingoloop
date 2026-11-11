import { describe, expect, it } from 'vitest';
import { diffWords } from '../../src/domain/diff';

const changed = (segs: { text: string; changed: boolean }[]) => segs.filter((s) => s.changed).map((s) => s.text);

describe('diffWords', () => {
  it('go → went', () => {
    const d = diffWords('Yesterday I go to the museum.', 'Yesterday I went to the museum.');
    expect(changed(d.said)).toEqual(['go']);
    expect(changed(d.corrected)).toEqual(['went']);
    expect(d.said.map((s) => s.text).join('')).toBe('Yesterday I go to the museum.');
  });
  it('mot ajouté', () => {
    const d = diffWords('I like cinema.', 'I like the cinema.');
    expect(changed(d.said)).toEqual([]);
    expect(changed(d.corrected)).toEqual(['the']);
  });
  it('mot retiré', () => {
    const d = diffWords('I am agree with you.', 'I agree with you.');
    expect(changed(d.said)).toEqual(['am']);
    expect(changed(d.corrected)).toEqual([]);
  });
  it('plusieurs mots consécutifs fusionnés', () => {
    const d = diffWords('we go to a café', 'we went to a café');
    expect(changed(d.corrected)).toEqual(['went']);
    const d2 = diffWords('he have go', 'he has gone');
    expect(changed(d2.said)).toEqual(['have go']);
  });
  it('phrases identiques', () => {
    const d = diffWords('Same sentence.', 'Same sentence.');
    expect(changed(d.said)).toEqual([]);
    expect(changed(d.corrected)).toEqual([]);
  });
});
