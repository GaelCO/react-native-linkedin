import {
  getAuthorizationUrl,
  getPayloadForToken,
  fetchToken,
} from '../src/oauth';

global.fetch = jest.fn().mockImplementation(
  () =>
    new Promise(resolve => {
      resolve({
        ok: true,
        json: () => ({
          access_token: 'access_token',
          expires_in: 'expires_in',
        }),
      });
    }),
);

test('getAuthorizationUrl', () => {
  expect(
    getAuthorizationUrl({
      authState: 'authState',
      clientID: 'clientID',
      permissions: ['r_basicprofile', 'r_emailaddress'],
      redirectUri: 'https://xaviercarpentier.com',
    }),
  ).toBe(
    'https://www.linkedin.com/oauth/v2/authorization?' +
      'client_id=clientID&redirect_uri=https%3A%2F%2Fxaviercarpentier.com&' +
      'response_type=code&scope=r_basicprofile%20r_emailaddress&' +
      'state=authState',
  );
});

test('getPayloadForToken', () => {
  expect(
    getPayloadForToken({
      clientID: 'clientID',
      clientSecret: 'clientSecret',
      code: 'code',
      redirectUri: 'https://xaviercarpentier.com',
    }),
  ).toBe(
    'client_id=clientID&client_secret=clientSecret&' +
      'code=code&grant_type=authorization_code&' +
      'redirect_uri=https%3A%2F%2Fxaviercarpentier.com',
  );
});

test('fetchToken', async () => {
  const token = await fetchToken('payload');
  expect(token).toMatchObject({
    access_token: 'access_token',
    expires_in: 'expires_in',
  });
});
