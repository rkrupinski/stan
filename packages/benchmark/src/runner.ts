import { Bench } from 'tinybench';

import { LIBS, type Lib, type Scenario } from './libs/types';

type Row = {
  Scenario: string;
  Library: string;
  'ops/sec': string;
  'mean (μs)': string;
  'p99 (μs)': string;
  samples: number;
  'vs Stan': string;
};

const fmt = (n: number, digits = 0) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export async function runScenario(scenario: Scenario): Promise<Row[]> {
  const bench = new Bench({ time: 1000, warmupTime: 200 });
  const handles = new Map<Lib, { tick: () => void; assert: () => void }>();
  for (const lib of LIBS) {
    const build = scenario.adapters[lib];
    if (!build) continue;
    const handle = build();
    handles.set(lib, handle);
    bench.add(`${scenario.id}:${lib}`, handle.tick);
  }
  await bench.run();
  // post-run correctness check
  for (const [lib, h] of handles) {
    try {
      h.assert();
    } catch (e) {
      throw new Error(
        `Scenario ${scenario.id} (${lib}) failed assertion: ${
          (e as Error).message
        }`,
      );
    }
  }
  const tasks = bench.tasks;
  const stanTask = tasks.find(t => t.name.endsWith(':stan'));
  const stanHz = stanTask?.result?.throughput.mean;
  const rows: Row[] = [];
  for (const lib of LIBS) {
    const task = tasks.find(t => t.name === `${scenario.id}:${lib}`);
    if (!task) {
      rows.push({
        Scenario: scenario.name,
        Library: lib,
        'ops/sec': 'n/a',
        'mean (μs)': 'n/a',
        'p99 (μs)': 'n/a',
        samples: 0,
        'vs Stan': 'n/a',
      });
      continue;
    }
    const r = task.result;
    if (!r) {
      rows.push({
        Scenario: scenario.name,
        Library: lib,
        'ops/sec': 'error',
        'mean (μs)': 'error',
        'p99 (μs)': 'error',
        samples: 0,
        'vs Stan': 'error',
      });
      continue;
    }
    const hz = r.throughput.mean;
    const ratio =
      stanHz && stanHz > 0 ? hz / stanHz : Number.POSITIVE_INFINITY;
    rows.push({
      Scenario: scenario.name,
      Library: lib,
      'ops/sec': fmt(hz),
      'mean (μs)': fmt(r.latency.mean * 1000, 2),
      'p99 (μs)': fmt((r.latency.p99 ?? r.latency.max) * 1000, 2),
      samples: r.latency.samples.length,
      'vs Stan': lib === 'stan' ? '—' : `${fmt(ratio, 2)}×`,
    });
  }
  return rows;
}
