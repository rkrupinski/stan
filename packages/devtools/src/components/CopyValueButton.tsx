import { CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export const CopyValueButton = ({ value }: { value: unknown }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    toast.info('Copied to clipboard');
  };

  return (
    <Button
      variant="outline"
      size="icon-xs"
      onClick={handleCopy}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      <CopyIcon />
    </Button>
  );
};
