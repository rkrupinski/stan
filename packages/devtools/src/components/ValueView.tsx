import { memo } from 'react';
import { JSONTree, type LabelRenderer } from 'react-json-tree';
import { useSystemTheme } from '@/theme';
import type { RenderValue } from '@/types';

const theme = {
  extend: 'monokai',
  base00: 'transparent',
  tree: { margin: 0, fontFamily: 'var(--font-mono)' },
} as const;

const labelRenderer: LabelRenderer = keyPath =>
  keyPath.length === 0 ? null : keyPath[0];

export const ValueView = memo<{ renderValue: RenderValue }>(
  ({ renderValue }) => {
    const invert = useSystemTheme() === 'light';

    if (renderValue.type === 'pending')
      return <pre className="text-xs">pending</pre>;

    return (
      <JSONTree
        data={renderValue.value}
        theme={theme}
        invertTheme={invert}
        labelRenderer={labelRenderer}
      />
    );
  },
);
