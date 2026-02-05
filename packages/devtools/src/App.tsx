import { Toaster } from '@/components/ui/sonner';
import { useConnection } from './connection';

export const App = () => {
  const { stores } = useConnection();

  return (
    <>
      <h1>Stan</h1>
      <pre>{JSON.stringify(stores, null, 2)}</pre>
      <Toaster />
    </>
  );
};
