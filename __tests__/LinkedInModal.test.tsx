import 'react-native';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LinkedInModal, { logError, onLoadStart } from '../src/LinkedInModal';

test('<LinkedInModal /> render correctly', async () => {
  render(
    <LinkedInModal
      onSuccess={() => {}}
      clientID="clientID"
      clientSecret="clientSecret"
      redirectUri="https://xaviercarpentier.fr"
      authState="authState"
      areaTouchText={{ bottom: 10, left: 10, right: 10, top: 10 }}
    />,
  );
  expect(screen).toMatchSnapshot();
});

test('logError', () => {
  logError({ type: 'test_error', message: 'test error' });
});

test('onLoadStart error', async () => {
  await onLoadStart(
    'https://url.com?error=error',
    '',
    () => {},
    (error: any) => expect(error).toEqual({ type: 'error', message: '' }),
    () => {},
    () => new Promise(resolve => resolve({})),
  );
});

test('onLoadStart success', async () => {
  await onLoadStart(
    'https://url.com?access_token=access_token&expires_in=123&code=code&state=123',
    '123',
    success =>
      expect(success).toEqual({
        access_token: 'access_token',
        expires_in: 123,
      }),
    () => {},
    () => {},
    () =>
      new Promise(resolve =>
        resolve({
          access_token: 'access_token',
          expires_in: 123,
        }),
      ),
    true,
  );
});

test('onLoadStart error code', async () => {
  await onLoadStart(
    'https://url.com?access_token=access_token&expires_in=123',
    '',
    () => {},
    error =>
      expect(error).toEqual({
        type: 'missing_code',
        message: 'Authorization code missing from redirect URL',
      }),
    () => {},
    () => new Promise(resolve => resolve({})),
  );
});

test('onLoadStart error state', async () => {
  await onLoadStart(
    'https://url.com?access_token=access_token&expires_in=123&code=code&state=123',
    '456',
    () => {},
    error =>
      expect(error).toEqual({
        type: 'state_not_match',
        message: 'state is not the same 123',
      }),
    () => {},
    () => new Promise(resolve => resolve({})),
  );
});
