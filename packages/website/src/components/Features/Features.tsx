import type { FC } from 'react';
import { ShieldCheck, Microscope, Home } from 'iconoir-react';
import clsx from 'clsx';
import Heading from '@theme/Heading';

import styles from './Features.module.css';

type FeatureItem = {
  title: string;
  icon: typeof ShieldCheck;
  description: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Type safety, baked in',
    icon: ShieldCheck,
    description:
      'Write code and refactor with confidence. The compiler has got your back.',
  },
  {
    title: 'Tiny footprint, big capabilities',
    icon: Microscope,
    description:
      'At just two kilobytes, it still packs enough features to meet most needs.',
  },
  {
    title: 'Feels like home',
    icon: Home,
    description:
      'No helpers, wrappers, or obscure abstractions - just familiar code.',
  },
];

const Feature: FC<FeatureItem> = ({
  title,
  icon: FeatureIcon,
  description,
}) => (
  <div className={clsx('col col--4')}>
    <div className="text--center">
      <FeatureIcon width="100px" height="100px" />
    </div>
    <div className="text--center padding-horiz--md">
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </div>
  </div>
);

export const Features: FC = () => (
  <section className={styles.features}>
    <div className="container">
      <div className="row">
        {FeatureList.map((props, idx) => (
          <Feature key={idx} {...props} />
        ))}
      </div>
    </div>
  </section>
);
