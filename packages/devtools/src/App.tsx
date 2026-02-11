import { Toaster } from '@/components/ui/sonner';

import { useDevtoolsBridge } from './bridge';
import { StoreSelector } from './components/StoreSelector';

export const App = () => {
  useDevtoolsBridge();

  return (
    <>
      <StoreSelector />
      <Toaster />
    </>
  );
};
