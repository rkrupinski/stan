import { StoreSelector } from '@/components/StoreSelector';

export const Header = () => {
  const handleLogoClick = () => {
    chrome.tabs.create({ url: 'https://stan.party' });
  };

  return (
    <header className="flex items-center gap-3 border-b dark:border-muted-foreground/40 px-3 py-2">
      <button
        onClick={handleLogoClick}
        className="shrink-0 cursor-pointer"
        aria-label="Open Stan website"
      >
        <img
          src="/icons/icon-32.png"
          alt="Stan logo"
          className="size-5 dark:invert"
        />
      </button>
      <StoreSelector />
    </header>
  );
};
