import querystring from 'query-string';
import { LinkedInTokenResponse } from './types';

const AUTHORIZATION_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const ACCESS_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
export const LOGOUT_URL = 'https://www.linkedin.com/m/logout';

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

export const fetchToken = async (
  payload: string,
): Promise<LinkedInTokenResponse> => {
  const response = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });
  return await response.json();
};
