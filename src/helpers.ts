import querystring from 'query-string';
import { ErrorType } from './types';

export const cleanUrlString = (state: string) => state.replace('#!', '');

export const getCodeAndStateFromUrl = (
  url: string,
): {
  code?: string;
  state?: string;
} => {
  const parsed = querystring.parse(querystring.extract(url) ?? '');
  const state =
    typeof parsed.state === 'string' ? cleanUrlString(parsed.state) : undefined;

  return {
    ...parsed,
    state,
  };
};

export const getErrorFromUrl = (
  url: string,
): {
  error?: string;
  error_description?: string;
} => {
  const parsed = querystring.parse(querystring.extract(url) ?? '');
  return {
    ...parsed,
    error_description:
      typeof parsed.error_description === 'string'
        ? cleanUrlString(parsed.error_description)
        : undefined,
  };
};

export const transformError = (input: {
  error?: string;
  error_description?: string;
}): ErrorType => {
  return {
    type: input.error ?? '',
    message: input.error_description ?? '',
  };
};

export const isErrorUrl = (url: string): boolean => {
  const parsed = querystring.parse(querystring.extract(url) ?? '');
  return typeof parsed.error !== 'undefined';
};
