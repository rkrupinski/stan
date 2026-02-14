import { createRoot } from 'react-dom/client';
import { StanProvider } from '@rkrupinski/stan/react';

import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StanProvider>
    <App />
  </StanProvider>,
);
