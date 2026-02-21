import ReactJson from 'react-json-view';
import type { RenderValue } from '@/types';

export const ValueView = ({ renderValue }: { renderValue: RenderValue }) => {
  if (renderValue.type === 'pending') {
    return <pre className="text-xs">pending</pre>;
  }

  const { value } = renderValue;

  if (typeof value === 'object' && value !== null) {
    return <ReactJson src={value as object} name={null} />;
  }

  return <pre className="text-xs">{JSON.stringify(value)}</pre>;
};
