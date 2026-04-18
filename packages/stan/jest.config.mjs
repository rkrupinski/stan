/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node'],
  },
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
};
