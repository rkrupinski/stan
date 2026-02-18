import { normalizeString } from './normalize';
import { highlightMatch } from './highlight';

describe('highlightMatch', () => {
  it.each([
    ['empty query', 'myAtom', ''],
    ['no match', 'myAtom', 'xyz'],
    ['match at the start', 'atomCount', 'atom'],
    ['match in the middle', 'myAtomX', 'atom'],
    ['match at the end', 'myAtom', 'atom'],
    ['full label match', 'atom', 'atom'],
    ['case preserved', 'MyATOM', 'myatom'],
  ])('%s', (_desc, label, query) => {
    expect(highlightMatch(label, normalizeString(query))).toMatchSnapshot();
  });
});
