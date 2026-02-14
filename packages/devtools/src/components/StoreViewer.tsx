import { useStanValue } from '@rkrupinski/stan/react';

import { storeList } from '../state';

export const StoreViewer = ({ storeKey }: { storeKey: string }) => {
  const stores = useStanValue(storeList);
  const store = stores.find(s => s.key === storeKey);

  return (
    <div className="h-full w-full p-3">
      {store?.label}
    </div>
  );
};
