import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type UIEvent,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStanCallback, useStanValue } from '@rkrupinski/stan/react';
import { ArrowDownIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ValueView } from '@/components/ValueView';

import {
  type LogEntry,
  type ViewMode,
  filteredStoreLog,
  selectedStateKey,
  storeEntries,
  viewMode,
} from '@/state';
import type { NormalizedString } from '@/normalize';
import { highlightMatch } from '@/highlight';
import { formatValue } from '@/format';
import { consumeFresh, clearAllFresh } from '@/log';

const ESTIMATED_SIZE = 24;
const OVERSCAN = 5;

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

const highlight = (node: HTMLElement) => {
  const color = getComputedStyle(node).getPropertyValue('--highlight-glow');

  node.animate(
    [
      { boxShadow: `inset 0 0 0 100px ${color}` },
      { boxShadow: 'inset 0 0 0 100px transparent' },
    ],
    {
      duration: 400,
      easing: 'ease-out',
    },
  );
};

const StateLabel = ({
  label,
  exists,
  query,
  onClick,
}: {
  label: string;
  exists: boolean;
  query: NormalizedString;
  onClick?: () => void;
}) =>
  exists ? (
    <a
      className="cursor-pointer font-medium font-mono text-sky-600 dark:text-sky-600 underline underline-offset-2"
      onClick={onClick}
    >
      {highlightMatch(label, query)}
    </a>
  ) : (
    <span className="font-mono text-muted-foreground">
      {highlightMatch(label, query)}
    </span>
  );

type LogEntryRowProps = {
  entry: LogEntry;
  odd: boolean;
  stateExists: boolean;
  query: NormalizedString;
  onNavigate: (stateKey: string) => void;
};

const LogEntryRow = memo<LogEntryRowProps>(
  ({ entry, odd, stateExists, query, onNavigate }) => {
    const animRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (node && consumeFresh(entry.id)) {
          highlight(node);
        }
      },
      [entry],
    );

    return (
      <div
        ref={animRef}
        className={`flex items-baseline gap-2 px-2 py-0.5 ${
          odd ? 'bg-muted/60' : ''
        }`}
      >
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {formatTime(entry.timestamp)}
        </span>
        <span className="break-all text-xs">
          {entry.type === 'set' ? (
            <>
              <Badge variant="outline" className="text-[0.625rem]">
                SET
              </Badge>{' '}
              state{' '}
              <StateLabel
                label={entry.label}
                exists={stateExists}
                query={query}
                onClick={
                  stateExists ? () => onNavigate(entry.stateKey) : undefined
                }
              />{' '}
              to{' '}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <a className="cursor-help font-medium font-mono text-sky-600 dark:text-sky-600 underline decoration-dotted underline-offset-2">
                    value
                  </a>
                </HoverCardTrigger>
                <HoverCardContent className="max-w-sm">
                  <ValueView renderValue={formatValue(entry.value)} />
                  <HoverCardArrow />
                </HoverCardContent>
              </HoverCard>
            </>
          ) : (
            <>
              <Badge variant="outline" className="text-[0.625rem]">
                DELETE
              </Badge>{' '}
              state{' '}
              <StateLabel
                label={entry.label}
                exists={stateExists}
                query={query}
                onClick={
                  stateExists ? () => onNavigate(entry.stateKey) : undefined
                }
              />
            </>
          )}
        </span>
      </div>
    );
  },
);

type LogViewerProps = { storeKey: string; query: NormalizedString };

export const LogViewer = memo<LogViewerProps>(({ storeKey, query }) => {
  const log = useStanValue(filteredStoreLog({ storeKey, query }));
  const entries = useStanValue(storeEntries(storeKey));

  const handleNavigate = useStanCallback(({ set }) => (stateKey: string) => {
    set(viewMode, 'explore' as ViewMode);
    set(selectedStateKey, stateKey);
  });

  const mountedRef = useRef(false);
  const prevQueryRef = useRef<NormalizedString | undefined>(undefined);

  if (!mountedRef.current || prevQueryRef.current !== query) {
    clearAllFresh();
    mountedRef.current = true;
    prevQueryRef.current = query;
  }

  const parentRef = useRef<HTMLDivElement>(null);
  const stuckRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const stuck = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    stuckRef.current = stuck;
    setShowScrollBtn(!stuck);
  }, []);

  const virtualizer = useVirtualizer({
    count: log.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_SIZE,
    overscan: OVERSCAN,
  });

  useLayoutEffect(() => {
    if (stuckRef.current && log.length > 0) {
      virtualizer.scrollToIndex(log.length - 1, { align: 'end' });
    }
  }, [log.length, virtualizer]);

  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(log.length - 1, { align: 'end' });
  }, [virtualizer, log.length]);

  const virtualItems = virtualizer.getVirtualItems();

  if (!log.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground pointer-events-none">
        No log entries
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map(virtualRow => (
          <div
            key={log[virtualRow.index].id}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <LogEntryRow
              entry={log[virtualRow.index]}
              odd={virtualRow.index % 2 !== 0}
              stateExists={
                entries.findIndex(
                  e => e.key === log[virtualRow.index].stateKey,
                ) !== -1
              }
              query={query}
              onNavigate={handleNavigate}
            />
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={scrollToBottom}
        title="Scroll to bottom"
        className={`absolute bottom-4 right-6 size-9 rounded-full bg-background dark:bg-background transition-all duration-200 ${
          showScrollBtn
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    </div>
  );
});
