type TransformResult = unknown;

const isPrimitive = (value: unknown): boolean => {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  );
};

const transformSpecial = (value: unknown): TransformResult | null => {
  if (typeof value === 'bigint') return `[BigInt: ${value.toString()}]`;
  if (typeof value === 'function')
    return `[Function: ${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol') return `[Symbol: ${value.toString()}]`;
  if (value instanceof Date) return `[Date: ${value.toISOString()}]`;
  if (value instanceof RegExp) return `[RegExp: ${value.toString()}]`;
  if (value instanceof Error) return `[Error: ${value.message}]`;
  if (value instanceof Promise) return '[Promise]';
  return null;
};

const createSanitizer = () => {
  const seen = new WeakSet<object>();

  const visit = (value: unknown): TransformResult => {
    if (isPrimitive(value)) return value;

    const special = transformSpecial(value);

    if (special !== null) return special;

    const obj = value as object;

    if (seen.has(obj)) return '[Circular]';

    seen.add(obj);

    if (Array.isArray(obj)) return obj.map(visit);

    if (obj instanceof Map)
      return Array.from(obj.entries()).map(([k, v]) => [k, visit(v)]);

    if (obj instanceof Set) return Array.from(obj).map(visit);

    const result: Record<string, unknown> = {};

    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        result[k] = visit((obj as Record<string, unknown>)[k]);
      }
    }

    return result;
  };

  return visit;
};

export const sanitize = (value: unknown): unknown => {
  const sanitizeValue = createSanitizer();

  return sanitizeValue(value);
};
