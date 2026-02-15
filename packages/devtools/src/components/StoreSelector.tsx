import { useStanValue, useStanCallback } from '@rkrupinski/stan/react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  storeList,
  effectiveSelectedStoreKey,
  selectedStoreKey,
  viewMode,
} from '@/state';

export const StoreSelector = () => {
  const stores = useStanValue(storeList);
  const selectedKey = useStanValue(effectiveSelectedStoreKey);

  const handleChange = useStanCallback(
    ({ set }) =>
      (value: string) => {
        set(selectedStoreKey, value);
        set(viewMode, 'explore');
      },
  );

  return (
    <Select value={selectedKey ?? ''} onValueChange={handleChange}>
      <SelectTrigger size="sm" className="w-[200px]">
        <SelectValue placeholder="Select a store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map(store => (
          <SelectItem key={store.key} value={store.key} className="max-w-[200px] truncate">
            {store.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
