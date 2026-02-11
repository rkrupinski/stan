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
} from '../state';

export const StoreSelector = () => {
  const stores = useStanValue(storeList);
  const selectedKey = useStanValue(effectiveSelectedStoreKey);

  const handleChange = useStanCallback(
    ({ set }) =>
      (value: string) => {
        set(selectedStoreKey, value);
      },
  );

  return (
    <Select value={selectedKey ?? ''} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map(store => (
          <SelectItem key={store.key} value={store.key}>
            {store.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
