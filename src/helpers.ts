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
  const state = parsed.state
    ? cleanUrlString(parsed.state as string)
    : undefined;

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
    error_description: parsed.error_description
      ? cleanUrlString(parsed.error_description as string)
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
