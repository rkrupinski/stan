import { useEffect, useState } from 'react';
import { useStanCallback, useStanValue } from '@rkrupinski/stan/react';
import { Trash2Icon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type ViewMode, storeLog, viewMode } from '@/state';
import { normalizeString } from '@/normalize';
import { LogViewer } from '@/components/LogViewer';

const DEBOUNCE_MS = 300;

export const StoreViewer = ({ storeKey }: { storeKey: string }) => {
  const mode = useStanValue(viewMode);
  const log = useStanValue(storeLog(storeKey));

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (mode !== 'log') setQuery('');
  }, [mode]);

  const handleChange = useStanCallback(
    ({ set }) =>
      (value: string) => {
        set(viewMode, value as ViewMode);
      },
  );

  const handleClearLog = useStanCallback(
    ({ set }) =>
      () => {
        set(storeLog(storeKey), []);
      },
  );

  return (
    <Tabs
      value={mode}
      onValueChange={handleChange}
      className="flex h-full flex-col px-3 py-2"
    >
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
        </TabsList>
        {mode === 'log' && (
          <div className="flex items-center gap-2.5">
            <Input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filter..."
              className="h-8 w-[120px] text-xs"
            />
            <div className="h-4 w-px bg-border dark:bg-muted-foreground/40" />
            <button
              onClick={handleClearLog}
              disabled={log.length === 0}
              title="Clear log"
              className="cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:text-muted-foreground"
              aria-label="Clear log"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <TabsContent value="explore" className="min-h-0 flex-1">
        Explore: {storeKey}
      </TabsContent>
      <TabsContent value="log" className="min-h-0 flex-1">
        <LogViewer storeKey={storeKey} query={normalizeString(debouncedQuery)} />
      </TabsContent>
    </Tabs>
  );
};
