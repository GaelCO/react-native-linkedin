import {
  cleanUrlString,
  getCodeAndStateFromUrl,
  getErrorFromUrl,
  transformError,
  isErrorUrl,
} from '../src/helpers';

test('cleanUrlString', () => {
  expect(cleanUrlString('https://xaviercarpentier.com#!')).toBe(
    'https://xaviercarpentier.com',
  );
  expect(cleanUrlString('https://xaviercarpentier.com')).toBe(
    'https://xaviercarpentier.com',
  );
});

test('getCodeAndStateFromUrl', () => {
  expect(
    getCodeAndStateFromUrl('https://xaviercarpentier.com?code=code&state=1234'),
  ).toMatchObject({ code: 'code', state: '1234' });
});

test('isErrorUrl', () => {
  expect(
    isErrorUrl(
      'https://xaviercarpentier.com?error=error&error_description=error_description',
    ),
  ).toBe(true);
});

test('getErrorFromUrl', () => {
  expect(
    getErrorFromUrl(
      'https://xaviercarpentier.com?error=error&error_description=error_description',
    ),
  ).toMatchObject({ error: 'error', error_description: 'error_description' });
});

test('transformError', () => {
  expect(
    transformError({
      error: 'error',
      error_description: 'error_description',
    }),
  ).toMatchObject({
    type: 'error',
    message: 'error_description',
  });
});
