import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/** @type {import('rollup').RollupOptions} */
export default {
  input: {
    index: 'src/index.ts',
    react: 'src/react.tsx',
  },
  output: [
    {
      dir: 'dist',
      entryFileNames: '[name].js',
      format: 'cjs',
      exports: 'auto',
    },
    {
      dir: 'dist',
      entryFileNames: '[name].esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.STAN_VERSION': JSON.stringify(pkg.version),
    }),
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['node_modules', '**/*.test.ts?(x)'],
    }),
    resolve(),
    commonjs(),
    terser(),
  ],
  external: ['react', 'react/jsx-runtime'],
};
