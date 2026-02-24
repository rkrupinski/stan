import { normalizeString, type NormalizedString } from './normalize';

export const highlightMatch = (label: string, query: NormalizedString) => {
  if (!query) return label;
  const idx = normalizeString(label).indexOf(query);
  if (idx === -1) return label;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="bg-yellow-200/80 dark:bg-yellow-300/35 rounded-[2px] text-inherit">
        {label.slice(idx, idx + query.length)}
      </mark>
      {label.slice(idx + query.length)}
    </>
  );
};
