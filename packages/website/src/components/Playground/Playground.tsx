import type { FC } from 'react';
import clsx from 'clsx';

import styles from './Playground.module.css';

export const Playground: FC = () => (
  <section className={styles.playground}>
    <div className="container">
      <div className="row">
        <div className={clsx('col col--12')}>
          <iframe
            style={{
              width: '100%',
              height: '500px',
              border: '0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
            src="https://stackblitz.com/edit/stan-todos?embed=1&file=src%2Fstate.ts"
          />
        </div>
      </div>
    </div>
  </section>
);
