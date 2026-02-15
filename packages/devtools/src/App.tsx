import { Toaster } from '@/components/ui/sonner';

import { useDevtoolsBridge } from '@/bridge';
import { ContentArea } from '@/components/ContentArea';
import { Header } from '@/components/Header';

export const App = () => {
  useDevtoolsBridge();

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <ContentArea />
      <Toaster />
    </div>
  );
};
