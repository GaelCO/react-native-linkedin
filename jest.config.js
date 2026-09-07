module.exports = {
  preset: '@react-native/jest-preset',
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!react-native)/.+',
  ],
  testMatch: ['**/*.test.ts?(x)'],
};
