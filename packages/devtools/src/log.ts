const freshEntries = new Map<string, ReturnType<typeof setTimeout>>();

const EXPIRY_MS = 500;

export const markFresh = (id: string): void => {
  clearTimeout(freshEntries.get(id));
  freshEntries.set(
    id,
    setTimeout(() => {
      freshEntries.delete(id);
    }, EXPIRY_MS),
  );
};

export const consumeFresh = (id: string): boolean => {
  const timeout = freshEntries.get(id);
  if (timeout === undefined) return false;
  clearTimeout(timeout);
  freshEntries.delete(id);
  return true;
};

export const clearAllFresh = (): void => {
  for (const timeout of freshEntries.values()) {
    clearTimeout(timeout);
  }
  freshEntries.clear();
};
