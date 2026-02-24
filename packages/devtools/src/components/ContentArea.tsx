import { useStanValue } from '@rkrupinski/stan/react';

import { effectiveSelectedStoreKey, registeredStoreKeys } from '@/state';
import { EmptyState } from '@/components/EmptyState';
import { Placeholder } from '@/components/Placeholder';
import { StoreViewer } from '@/components/StoreViewer';

export const ContentArea = () => {
  const selectedKey = useStanValue(effectiveSelectedStoreKey);
  const storeKeys = useStanValue(registeredStoreKeys);

  return (
    <main className="min-h-0 flex-1">
      {storeKeys.length === 0 ? (
        <EmptyState />
      ) : selectedKey ? (
        <StoreViewer storeKey={selectedKey} />
      ) : (
        <Placeholder />
      )}
    </main>
  );
};
