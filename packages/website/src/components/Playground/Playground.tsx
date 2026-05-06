import type { FC } from 'react';

import styles from './Playground.module.css';

export const Playground: FC = () => (
  <section className={styles.playground}>
    <div className="container container--fluid">
      <div className={styles.playgroundInner}>
        <iframe
          title="Stan demo"
          className={styles.frame}
          src="https://stackblitz.com/edit/stan-todos?embed=1&file=src%2Fstate.ts"
        />
      </div>
    </div>
  </section>
);
