import { sanitize } from './sanitize';

describe('sanitize', () => {
  describe('primitives', () => {
    it('passes through null', () => {
      expect(sanitize(null)).toBe(null);
    });

    it('passes through undefined', () => {
      expect(sanitize(undefined)).toBe(undefined);
    });

    it('passes through booleans', () => {
      expect(sanitize(true)).toBe(true);
      expect(sanitize(false)).toBe(false);
    });

    it('passes through numbers', () => {
      expect(sanitize(123)).toBe(123);
      expect(sanitize(0)).toBe(0);
      expect(sanitize(-1.5)).toBe(-1.5);
    });

    it('passes through strings', () => {
      expect(sanitize('hello')).toBe('hello');
      expect(sanitize('')).toBe('');
    });
  });

  describe('special types', () => {
    it('converts BigInt to string representation', () => {
      expect(sanitize(BigInt(123))).toBe('[BigInt: 123]');
    });

    it('converts Function to string representation', () => {
      function testFunc() {}
      expect(sanitize(testFunc)).toBe('[Function: testFunc]');
      expect(sanitize(() => {})).toBe('[Function: anonymous]');
    });

    it('converts Symbol to string representation', () => {
      expect(sanitize(Symbol('test'))).toBe('[Symbol: Symbol(test)]');
    });

    it('converts Date to string representation', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(sanitize(date)).toBe('[Date: 2023-01-01T00:00:00.000Z]');
    });

    it('converts RegExp to string representation', () => {
      expect(sanitize(/abc/gi)).toBe('[RegExp: /abc/gi]');
    });

    it('converts Error to string representation', () => {
      expect(sanitize(new Error('oops'))).toBe('[Error: oops]');
    });

    it('replaces Promise with placeholder', () => {
      expect(sanitize(Promise.resolve())).toBe('[Promise]');
    });
  });

  describe('collections', () => {
    it('recursively sanitizes arrays', () => {
      const input = [1, Promise.resolve(), { a: 2 }];

      expect(sanitize(input)).toMatchInlineSnapshot(`
        [
          1,
          "[Promise]",
          {
            "a": 2,
          },
        ]
      `);
    });

    it('converts Map to array of entries', () => {
      const map = new Map<unknown, unknown>();

      map.set('a', 1);
      map.set('b', Promise.resolve());

      expect(sanitize(map)).toMatchInlineSnapshot(`
        [
          [
            "a",
            1,
          ],
          [
            "b",
            "[Promise]",
          ],
        ]
      `);
    });

    it('converts Set to array of values', () => {
      const set = new Set<unknown>();

      set.add(1);
      set.add(Promise.resolve());

      expect(sanitize(set)).toMatchInlineSnapshot(`
        [
          1,
          "[Promise]",
        ]
      `);
    });

    it('recursively sanitizes plain objects', () => {
      const input = {
        a: 1,
        b: Promise.resolve(),
        c: {
          d: /regex/,
        },
      };

      expect(sanitize(input)).toMatchInlineSnapshot(`
        {
          "a": 1,
          "b": "[Promise]",
          "c": {
            "d": "[RegExp: /regex/]",
          },
        }
      `);
    });
  });

  describe('circular references', () => {
    it('handles circular objects', () => {
      type CircularObj = {
        name: string;
        self?: CircularObj;
      };

      const obj: CircularObj = { name: 'obj' };

      obj.self = obj;

      expect(sanitize(obj)).toMatchInlineSnapshot(`
        {
          "name": "obj",
          "self": "[Circular]",
        }
      `);
    });

    it('handles circular arrays', () => {
      type CircularArr = (number | CircularArr)[];

      const arr: CircularArr = [1];

      arr.push(arr);

      expect(sanitize(arr)).toMatchInlineSnapshot(`
        [
          1,
          "[Circular]",
        ]
      `);
    });

    it('handles complex circular structures', () => {
      type Root = {
        name: string;
        child?: Child;
      };

      type Child = {
        name: string;
        parent: Root;
      };

      const root: Root = { name: 'root' };
      const child: Child = { name: 'child', parent: root };

      root.child = child;

      expect(sanitize(root)).toMatchInlineSnapshot(`
        {
          "child": {
            "name": "child",
            "parent": "[Circular]",
          },
          "name": "root",
        }
      `);
    });

    it('handles shared references that are not circular', () => {
      const leaf = { name: 'leaf' };
      const tree = {
        left: leaf,
        right: leaf,
      };

      expect(sanitize(tree)).toMatchInlineSnapshot(`
        {
          "left": {
            "name": "leaf",
          },
          "right": "[Circular]",
        }
      `);
    });
  });
});
