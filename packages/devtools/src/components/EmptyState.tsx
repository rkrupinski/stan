import { ArrowUpRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

const handleLearnMoreClick = () => {
  chrome.tabs.create({ url: 'https://stan.party' });
};

export const EmptyState = () => (
  <div className="flex h-full w-full overflow-auto">
    <Empty className="m-auto max-w-sm flex-none">
      <EmptyHeader>
        <EmptyTitle>No stores detected</EmptyTitle>
        <EmptyDescription>
          This page doesn&apos;t appear to use Stan, or no stores have been
          initialized yet.
        </EmptyDescription>
      </EmptyHeader>
      <Button
        variant="link"
        size="sm"
        className="text-muted-foreground"
        onClick={handleLearnMoreClick}
      >
        Learn more about Stan <ArrowUpRightIcon />
      </Button>
    </Empty>
  </div>
);
