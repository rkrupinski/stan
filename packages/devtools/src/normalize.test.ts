import { normalizeString } from './normalize';

describe('normalizeString', () => {
  it.each([
    ['Hello', 'hello'],
    ['  spaced  ', 'spaced'],
    ['  Mixed CASE  ', 'mixed case'],
    ['already', 'already'],
    ['', ''],
    ['ALL CAPS', 'all caps'],
  ])('normalizeString(%j) === %j', (input, expected) => {
    expect(normalizeString(input)).toBe(expected);
  });
});
