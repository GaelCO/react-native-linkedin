module.exports = {
  preset: 'jest-expo',
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  transform: {
    '\\.[jt]sx?$': 'babel-jest'
  },
  "transformIgnorePatterns": [
    "/node_modules/(?!react-native)/.+"
  ],
  testMatch: ['**/*.test.ts?(x)'],
};
