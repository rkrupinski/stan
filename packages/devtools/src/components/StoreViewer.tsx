import { useStanCallback, useStanValue } from '@rkrupinski/stan/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { type ViewMode, viewMode } from '../state';

export const StoreViewer = ({ storeKey }: { storeKey: string }) => {
  const mode = useStanValue(viewMode);

  const handleChange = useStanCallback(
    ({ set }) =>
      (value: string) => {
        set(viewMode, value as ViewMode);
      },
  );

  return (
    <Tabs
      value={mode}
      onValueChange={handleChange}
      className="flex h-full flex-col px-3 py-2"
    >
      <TabsList>
        <TabsTrigger value="explore">Explore</TabsTrigger>
        <TabsTrigger value="log">Log</TabsTrigger>
      </TabsList>
      <TabsContent value="explore" className="min-h-0 flex-1">
        Explore: {storeKey}
      </TabsContent>
      <TabsContent value="log" className="min-h-0 flex-1">
        Log: {storeKey}
      </TabsContent>
    </Tabs>
  );
};
