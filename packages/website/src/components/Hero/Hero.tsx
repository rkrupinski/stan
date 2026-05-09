import { useEffect, useState, type FC } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';

import styles from './Hero.module.css';

const GLYPH_QUERY = '(min-width: 721px)';

const ArrowIcon: FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const Hero: FC = () => {
  const { siteConfig } = useDocusaurusContext();
  const [showGlyph, setShowGlyph] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(GLYPH_QUERY);
    const update = () => setShowGlyph(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <section className={styles.hero}>
      <div className="container container--fluid">
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <Heading as="h1" className={styles.heroTitle}>
              {siteConfig.title}
              <span className={styles.heroTitleDot}>.</span>
            </Heading>
            <p className={styles.heroTagline}>{siteConfig.tagline}</p>
            <Link className={styles.cta} to="/docs">
              Dive into the docs
              <span className={styles.ctaArrow}>
                <ArrowIcon />
              </span>
            </Link>
          </div>

          {showGlyph && (
          <div className={styles.heroGlyph} aria-hidden="true">
            <svg viewBox="0 0 460 460">
              <defs>
                <linearGradient id="stan-line" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <line
                x1="230"
                y1="80"
                x2="80"
                y2="340"
                stroke="url(#stan-line)"
                strokeWidth="4"
                strokeDasharray="6 6"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-24"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </line>
              <line
                x1="230"
                y1="80"
                x2="380"
                y2="340"
                stroke="url(#stan-line)"
                strokeWidth="4"
                strokeDasharray="6 6"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-24"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </line>
              <circle cx="230" cy="80" r="38" fill="#fff" opacity="0.18" />
              <circle cx="230" cy="80" r="22" fill="#fff" />
              <circle cx="80" cy="340" r="34" fill="#fff" opacity="0.18" />
              <circle cx="80" cy="340" r="20" fill="#fff" />
              <circle cx="380" cy="340" r="34" fill="#fff" opacity="0.18" />
              <circle cx="380" cy="340" r="20" fill="#fff" />
            </svg>
            <div className={styles.floater} style={{ top: '4%', left: '40%' }}>
              <span className={styles.swatch} />
              state
            </div>
            <div
              className={`${styles.floater} ${styles.floaterB}`}
              style={{ top: '78%', left: '-4%' }}
            >
              <span className={styles.swatch} />
              derived state
            </div>
            <div
              className={`${styles.floater} ${styles.floaterC}`}
              style={{ top: '78%', right: '-6%' }}
            >
              <span className={styles.swatch} />
              async derived state
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
};
