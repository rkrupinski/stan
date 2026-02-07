const KEY_RE = /^@@([a-z]+)(?:\[(.+)\])?-(\d+)$/;

type ParsedKey = {
  orig: string;
  label: string;
};

export const parseKey = (key: string): ParsedKey | null => {
  const match = key.match(KEY_RE);

  if (!match) return null;

  const [, type, tag, id] = match;

  return {
    orig: key,
    label: tag ?? `${type[0].toUpperCase()}${type.slice(1)} ${id}`,
  };
};
