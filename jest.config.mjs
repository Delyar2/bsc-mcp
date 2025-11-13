export default {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.mjs$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx', 'mjs'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};