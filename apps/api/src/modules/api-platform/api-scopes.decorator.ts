import { SetMetadata } from '@nestjs/common';

export const API_SCOPES_METADATA_KEY = 'api_scopes';

/** Required scopes when a request is authenticated with an API key. */
export const ApiScopes = (...scopes: string[]) => SetMetadata(API_SCOPES_METADATA_KEY, scopes);
