import querystring from 'query-string';
import { applySpec, evolve, pipe, propOr, propSatisfies } from 'ramda';

const AUTHORIZATION_URL: string =
  'https://www.linkedin.com/oauth/v2/authorization';
const ACCESS_TOKEN_URL: string =
  'https://www.linkedin.com/oauth/v2/accessToken';
export const LOGOUT_URL: string = 'https://www.linkedin.com/m/logout';

// ==============================
// Types
// ==============================

export interface LinkedInToken {
  authentication_code?: string;
  access_token?: string;
  expires_in?: number;
}

export interface ErrorType {
  type?: string;
  message?: string;
}

// ==============================
// Helpers
// ==============================

export const cleanUrlString = (state: string) => state.replace('#!', '');

export const getCodeAndStateFromUrl = pipe(
  querystring.extract,
  querystring.parse,
  evolve({ state: cleanUrlString }),
);

export const getErrorFromUrl = pipe(
  querystring.extract,
  querystring.parse,
  evolve({ error_description: cleanUrlString }),
);

export const transformError = applySpec<ErrorType>({
  type: propOr('', 'error'),
  message: propOr('', 'error_description'),
});

export const isErrorUrl = pipe(
  querystring.extract,
  querystring.parse,
  propSatisfies((error: any) => typeof error !== 'undefined', 'error'),
);

// ==============================
// URL & Payload builders
// ==============================

export const getAuthorizationUrl = ({
  authState,
  clientID,
  permissions,
  redirectUri,
}: {
  authState?: string;
  clientID: string;
  permissions?: string[];
  redirectUri: string;
}) =>
  `${AUTHORIZATION_URL}?${querystring.stringify({
    response_type: 'code',
    client_id: clientID,
    scope: (permissions ?? []).join(' ').trim(),
    state: authState,
    redirect_uri: redirectUri,
  })}`;

export const getPayloadForToken = ({
  clientID,
  clientSecret,
  code,
  redirectUri,
}: {
  clientID: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
}) =>
  querystring.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientID,
    client_secret: clientSecret,
  });

// ==============================
// Fetch token
// ==============================

export const fetchToken = async (payload: any) => {
  const response = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });
  return await response.json();
};
