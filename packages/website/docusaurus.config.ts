import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Stan',
  tagline: 'Minimal, type-safe state management',
  favicon: 'img/logo.svg',

  url: 'https://stan.party',
  baseUrl: '/',

  deploymentBranch: 'gh-pages',
  organizationName: 'rkrupinski',
  projectName: 'stan',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          path: 'docs',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'GTM-T6DFWNZQ',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    navbar: {
      hideOnScroll: true,
      logo: {
        src: 'img/logo.svg',
        srcDark: 'img/logoDark.svg',
        width: 32,
        height: 32,
      },
      title: 'Stan',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/rkrupinski/stan',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting started',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'API',
              to: '/docs/api/state',
            },
            {
              label: 'Guides',
              to: '/docs/guides/type-safety',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Author',
              href: 'https://rkrupinski.com',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/rkrupinski/stan',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Rafał Krupiński. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    algolia: {
      appId: 'OCBS2ZK3UN',
      apiKey: '78ca262b92bd0af80a22a8034c1ededf',
      indexName: 'Documentation Website',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
