import { useStanValue } from '@rkrupinski/stan/react';
import { Toaster } from '@/components/ui/sonner';

import { useDevtoolsBridge } from './bridge';
import {
  registeredStoreKeys,
  storeList,
  effectiveSelectedStoreKey,
} from './state';

export const App = () => {
  useDevtoolsBridge();

  const keys = useStanValue(registeredStoreKeys);
  const stores = useStanValue(storeList);
  const selectedKey = useStanValue(effectiveSelectedStoreKey);

  return (
    <>
      <h1>Stan DevTools</h1>
      <pre>{JSON.stringify({ keys, stores, selectedKey }, null, 2)}</pre>
      <Toaster />
    </>
  );
};
