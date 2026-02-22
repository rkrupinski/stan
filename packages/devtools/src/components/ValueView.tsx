import { memo } from 'react';
import { JSONTree, type LabelRenderer } from 'react-json-tree';
import { useSystemTheme } from '@/theme';
import type { RenderValue } from '@/types';

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
        theme="bright"
        invertTheme={invert}
        labelRenderer={labelRenderer}
      />
    );
  },
);
