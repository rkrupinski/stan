import type { FC, ReactNode } from 'react';
import { ShieldCheck, Microscope, Home } from 'iconoir-react';
import Heading from '@theme/Heading';

import styles from './Features.module.css';

type FeatureItem = {
  num: string;
  title: string;
  icon: ReactNode;
  description: string;
};

const FeatureList: FeatureItem[] = [
  {
    num: '01',
    title: 'Type safety, baked in',
    icon: <ShieldCheck width={32} height={32} strokeWidth={1.5} />,
    description:
      'Write code and refactor with confidence. The compiler has got your back.',
  },
  {
    num: '02',
    title: 'Tiny footprint, big capabilities',
    icon: <Microscope width={32} height={32} strokeWidth={1.5} />,
    description:
      'At just two kilobytes, it still packs enough features to meet most needs.',
  },
  {
    num: '03',
    title: 'Feels like home',
    icon: <Home width={32} height={32} strokeWidth={1.5} />,
    description:
      'No helpers, wrappers, or obscure abstractions - just familiar code.',
  },
];

const Feature: FC<FeatureItem> = ({ num, title, icon, description }) => (
  <div className={styles.feature}>
    <div className={styles.featureNum}>- {num}</div>
    <div className={styles.featureIcon}>{icon}</div>
    <Heading as="h3" className={styles.featureTitle}>
      {title}
    </Heading>
    <p className={styles.featureBody}>{description}</p>
  </div>
);

export const Features: FC = () => (
  <section className={styles.features}>
    <div className="container container--fluid">
      <div className={styles.featuresInner}>
        {FeatureList.map((props, idx) => (
          <Feature key={idx} {...props} />
        ))}
      </div>
    </div>
  </section>
);
