import { useStanValue } from '@rkrupinski/stan/react';

import { effectiveSelectedStoreKey } from '@/state';
import { Placeholder } from '@/components/Placeholder';
import { StoreViewer } from '@/components/StoreViewer';

export const ContentArea = () => {
  const selectedKey = useStanValue(effectiveSelectedStoreKey);

  return (
    <main className="min-h-0 flex-1">
      {selectedKey ? (
        <StoreViewer storeKey={selectedKey} />
      ) : (
        <Placeholder />
      )}
    </main>
  );
};
