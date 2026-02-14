import { memo, useRef } from 'react';
import { useStanValue } from '@rkrupinski/stan/react';

import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

import { type LogEntry, storeLog } from '../state';
import type { UpdateValue } from '../types';

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

const formatValue = (value: UpdateValue): string => {
  switch (value.type) {
    case 'sync':
    case 'async-resolved':
    case 'async-rejected':
      return JSON.stringify(value.value, null, 2);
    case 'async-pending':
      return '"pending"';
  }
};

const LogEntryRow = ({ entry, odd, mountedAt }: { entry: LogEntry; odd: boolean; mountedAt: number }) => (
  <div
    className={`flex items-baseline gap-2 px-2 py-0.5 ${entry.timestamp > mountedAt ? 'animate-[log-highlight_500ms_ease-out]' : ''} ${odd ? 'bg-muted/50' : ''}`}
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
          state <span className="font-medium font-mono text-sky-600 dark:text-sky-400">{entry.label}</span> to{' '}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="cursor-pointer font-medium font-mono text-sky-600 dark:text-sky-400 underline underline-offset-2">
                value
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="max-w-sm">
              <pre className="max-h-60 overflow-auto text-xs">
                {formatValue(entry.value)}
              </pre>
              <HoverCardArrow />
            </HoverCardContent>
          </HoverCard>
        </>
      ) : (
        <>
          <Badge variant="outline" className="text-[0.625rem]">
            DELETE
          </Badge>{' '}
          state <span className="font-medium font-mono text-sky-600 dark:text-sky-400">{entry.label}</span>
        </>
      )}
    </span>
  </div>
);

type LogViewerProps = { storeKey: string };

export const LogViewer = memo<LogViewerProps>(({ storeKey }) => {
  const mountedAt = useRef(Date.now());
  const log = useStanValue(storeLog(storeKey));

  if (!log.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No log entries yet
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {log.map((entry, i) => (
        <LogEntryRow key={entry.id} entry={entry} odd={i % 2 !== 0} mountedAt={mountedAt.current} />
      ))}
    </div>
  );
});
