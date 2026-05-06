import type { ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { Hero } from '@site/src/components/Hero';
import { Features } from '@site/src/components/Features';
import { Playground } from '@site/src/components/Playground';

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Hero />
      <main>
        <Features />
        <Playground />
      </main>
    </Layout>
  );
}
