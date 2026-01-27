export interface LinkedInToken {
  authentication_code?: string;
  access_token?: string;
  expires_in?: number;
}

export interface LinkedInTokenResponse extends LinkedInToken {
  error?: string;
  error_description?: string;
}

export interface ErrorType {
  type?: string;
  message?: string;
}
