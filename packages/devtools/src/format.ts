import type { RenderValue, UpdateValue } from '@/types';

export const formatValue = (updateValue: UpdateValue): RenderValue => {
  switch (updateValue.type) {
    case 'sync':
    case 'async-resolved':
    case 'async-rejected':
      return { type: 'ready', value: updateValue.value };
    case 'async-pending':
      return { type: 'pending' };
  }
};
