import type { UpdateValue } from '@/types';
import { formatValue } from './format';

describe('formatValue', () => {
  it.each<UpdateValue>([
    { type: 'sync', value: 42 },
    { type: 'sync', value: null },
    { type: 'async-resolved', value: 'hello' },
    { type: 'async-rejected', value: 'oops' },
    { type: 'async-pending' },
  ])('%j', input => {
    expect(formatValue(input)).toMatchSnapshot();
  });
});
