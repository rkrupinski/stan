import { memo, useLayoutEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStanCallback, useStanValue } from '@rkrupinski/stan/react';

import { Separator } from '@/components/ui/separator';
import { ValueView } from '@/components/ValueView';
import type { NormalizedString } from '@/normalize';
import { highlightMatch } from '@/highlight';
import { formatValue } from '@/format';
import {
  effectiveSelectedStateKey,
  filteredStoreEntries,
  selectedStateKey,
  storeEntries,
} from '@/state';

const ESTIMATED_SIZE = 24;
const OVERSCAN = 5;

type ExploreViewerProps = { storeKey: string; query: NormalizedString };

export const ExploreViewer = memo<ExploreViewerProps>(({ storeKey, query }) => {
  const entries = filteredStoreEntries({ storeKey, query });
  const filteredEntries = useStanValue(entries);
  const allEntries = useStanValue(storeEntries(storeKey));
  const selectedKey = useStanValue(effectiveSelectedStateKey);

  const handleSelect = useStanCallback(({ set }) => (key: string) => {
    set(selectedStateKey, key);
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_SIZE,
    overscan: OVERSCAN,
  });

  useLayoutEffect(() => {
    if (!selectedKey) return;
    const index = filteredEntries.findIndex(e => e.key === selectedKey);
    if (index === -1) return;

    const scrollEl = parentRef.current;
    if (!scrollEl) return;

    const item = virtualizer.getVirtualItems().find(v => v.index === index);
    if (
      item &&
      item.start >= scrollEl.scrollTop &&
      item.start + item.size <= scrollEl.scrollTop + scrollEl.clientHeight
    ) {
      return;
    }

    virtualizer.scrollToIndex(index, { align: 'start' });
  }, [selectedKey, filteredEntries, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();

  const selectedEntry = selectedKey
    ? allEntries.find(e => e.key === selectedKey)
    : null;

  return (
    <div className="flex h-full gap-2">
      <div ref={parentRef} className="w-[160px] shrink-0 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground pointer-events-none">
            No state
          </div>
        ) : (
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualItems.map(virtualRow => {
              const entry = filteredEntries[virtualRow.index];
              const isSelected = entry.key === selectedKey;

              return (
                <div
                  key={entry.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="absolute left-0 top-0 w-full"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <button
                    onClick={() => handleSelect(entry.key)}
                    className={`w-full break-all px-2 py-1 text-left text-xs ${
                      isSelected
                        ? 'cursor-default bg-accent text-accent-foreground'
                        : 'cursor-pointer hover:bg-accent/30'
                    }`}
                  >
                    {highlightMatch(entry.label, query)}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Separator orientation="vertical" />
      <div className="min-w-0 flex-1 overflow-auto">
        {selectedEntry ? (
          <div className="p-2">
            <div className="mb-2 break-all text-sm font-medium">
              {selectedEntry.label}
            </div>
            <ValueView renderValue={formatValue(selectedEntry.value)} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground pointer-events-none">
            No state selected
          </div>
        )}
      </div>
    </div>
  );
});
