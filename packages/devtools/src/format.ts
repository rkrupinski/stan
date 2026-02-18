import type { UpdateValue } from '@/types';

export const formatValue = (value: UpdateValue): string => {
  switch (value.type) {
    case 'sync':
    case 'async-resolved':
    case 'async-rejected':
      return JSON.stringify(value.value, null, 2);
    case 'async-pending':
      return '"pending"';
  }
};
