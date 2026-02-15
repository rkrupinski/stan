import { useStanCallback, useStanValue } from '@rkrupinski/stan/react';
import { Trash2Icon } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { type ViewMode, storeLog, viewMode } from '@/state';
import { LogViewer } from '@/components/LogViewer';

export const StoreViewer = ({ storeKey }: { storeKey: string }) => {
  const mode = useStanValue(viewMode);
  const log = useStanValue(storeLog(storeKey));

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
        {mode === 'log' && log.length > 0 && (
          <button
            onClick={handleClearLog}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Clear log"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        )}
      </div>
      <TabsContent value="explore" className="min-h-0 flex-1">
        Explore: {storeKey}
      </TabsContent>
      <TabsContent value="log" className="min-h-0 flex-1">
        <LogViewer storeKey={storeKey} />
      </TabsContent>
    </Tabs>
  );
};
