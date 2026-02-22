import { useState } from 'react';
import { useStanValue, useStanCallback } from '@rkrupinski/stan/react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  storeList,
  effectiveSelectedStoreKey,
  selectedStoreKey,
  viewMode,
} from '@/state';

export const StoreSelector = () => {
  const [open, setOpen] = useState(false);
  const stores = useStanValue(storeList);
  const selectedKey = useStanValue(effectiveSelectedStoreKey);
  const selectedLabel = stores.find(s => s.key === selectedKey)?.label;

  const handleSelect = useStanCallback(({ set }) => (value: string) => {
    set(selectedStoreKey, value);
    set(viewMode, 'explore');
    setOpen(false);
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!stores.length}
        className="max-w-[200px] justify-between"
      >
        <span className="truncate">{selectedLabel ?? 'Select a store'}</span>
        <ChevronsUpDownIcon className="opacity-50" />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Select store"
        description="Search for a store to inspect"
        showCloseButton={false}
      >
        <CommandInput placeholder="Search stores..." />
        <CommandList>
          <CommandEmpty>No stores found.</CommandEmpty>
          <CommandGroup>
            {stores.map(store => (
              <CommandItem
                key={store.key}
                value={store.label}
                onSelect={() => handleSelect(store.key)}
              >
                {store.label}
                {store.key === selectedKey && <CheckIcon className="ml-auto" />}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
