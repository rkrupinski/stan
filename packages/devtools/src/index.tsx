import { createRoot } from 'react-dom/client';
import { StanProvider } from '@rkrupinski/stan/react';
import { ThemeProvider } from 'next-themes';

import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <StanProvider>
      <App />
    </StanProvider>
  </ThemeProvider>,
);
