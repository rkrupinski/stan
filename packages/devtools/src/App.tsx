import { Toaster } from '@/components/ui/sonner';

import { useDevtoolsBridge } from './bridge';
import { Header } from './components/Header';

export const App = () => {
  useDevtoolsBridge();

  return (
    <>
      <Header />
      <Toaster />
    </>
  );
};
