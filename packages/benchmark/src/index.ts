import { runScenario } from './runner';
import { s1Baseline } from './scenarios/s1-baseline';
import { s2DeepChain } from './scenarios/s2-deep-chain';
import { s3FanOut } from './scenarios/s3-fan-out';
import { s4Diamond } from './scenarios/s4-diamond';
import { s5ManyAtoms } from './scenarios/s5-many-atoms';
import { s6CacheHit } from './scenarios/s6-cache-hit';
import { s7Family } from './scenarios/s7-family';

const scenarios = [
  s1Baseline,
  s2DeepChain,
  s3FanOut,
  s4Diamond,
  s5ManyAtoms,
  s6CacheHit,
  s7Family,
];

async function main() {
  console.log(
    `\nStan vanilla benchmark — Stan vs. Jotai vs. Zustand` +
      `\nNode ${process.version} · ${process.platform}/${process.arch}` +
      `\nNODE_ENV=${process.env.NODE_ENV}\n`,
  );
  for (const scenario of scenarios) {
    console.log(`▶ ${scenario.id}: ${scenario.name}`);
    const rows = await runScenario(scenario);
    console.table(rows);
    console.log();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
