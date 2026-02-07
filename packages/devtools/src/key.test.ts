import { parseKey } from './key';

describe('parseKey', () => {
  describe('valid keys without tags', () => {
    it.each(['@@atom-1', '@@selector-42', '@@store-0', '@@atom-9999'])(
      '%s',
      input => {
        expect(parseKey(input)).toMatchSnapshot();
      },
    );
  });

  describe('valid keys with tags', () => {
    it.each([
      '@@atom[Foo]-1',
      '@@store[My store]-3',
      '@@selector[filteredTodos]-2',
      '@@store[Default]-0',
      '@@atom[user-count]-5',
    ])('%s', input => {
      expect(parseKey(input)).toMatchSnapshot();
    });
  });

  describe('invalid keys', () => {
    it.each([
      '',
      'foo',
      'atom-1',
      '@atom-1',
      '@@atom[]-1',
      '@@atom',
      '@@atom-abc',
      '@@atom1',
      '@@Atom-1',
      '@@atom-1-extra',
      'prefix@@atom-1',
      '@@atom[tag-1',
    ])('%s', input => {
      expect(parseKey(input)).toBe(null);
    });
  });
});
