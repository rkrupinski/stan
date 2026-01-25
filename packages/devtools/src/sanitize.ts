export const sanitize = (value: unknown, seen = new WeakSet()): unknown => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  )
    return value;

  if (typeof value === 'bigint') return `[BigInt: ${value.toString()}]`;
  if (typeof value === 'function')
    return `[Function: ${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol') return `[Symbol: ${value.toString()}]`;

  if (value instanceof Date) return `[Date: ${value.toISOString()}]`;
  if (value instanceof RegExp) return `[RegExp: ${value.toString()}]`;
  if (value instanceof Error) return `[Error: ${value.message}]`;

  if (typeof value !== 'object') return value;

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) return value.map(v => sanitize(v, seen));

  if (value instanceof Map)
    return Array.from(value.entries()).map(([k, v]) => [k, sanitize(v, seen)]);

  if (value instanceof Set)
    return Array.from(value).map(v => sanitize(v, seen));

  const result: Record<string, unknown> = {};
  for (const k in value) {
    if (Object.prototype.hasOwnProperty.call(value, k)) {
      result[k] = sanitize((value as Record<string, unknown>)[k], seen);
    }
  }
  return result;
};
