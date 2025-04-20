import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

/** @type {import('rollup').RollupOptions} */
export default {
  input: {
    index: 'src/index.ts',
    react: 'src/react.tsx',
  },
  output: {
    dir: 'dist',
    entryFileNames: '[name].js',
    format: 'esm',
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['node_modules', '**/*.test.ts'],
    }),
    resolve(),
    commonjs(),
    terser(),
  ],
  external: ['react'],
};
