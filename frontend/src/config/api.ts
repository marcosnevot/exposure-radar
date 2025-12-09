// frontend/src/config/api.ts
const DEFAULT_API_BASE_URL = 'http://localhost:4000';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  DEFAULT_API_BASE_URL;

export interface ApiClientOptions {
  baseUrl?: string;
}

// Extra options for requests
export interface ApiRequestOptions extends RequestInit {
  /**
   * HTTP status codes that should NOT cause the client to throw.
   * Useful for endpoints like /health that use non-2xx codes (e.g. 503)
   * while still returning a valid JSON payload.
   */
  acceptErrorStatuses?: number[];
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = (options?.baseUrl ?? API_BASE_URL).replace(/\/+$/, '');
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  async get<T>(path: string, init?: ApiRequestOptions): Promise<T> {
    const { acceptErrorStatuses, ...requestInit } = init ?? {};

    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      ...requestInit,
      headers: {
        Accept: 'application/json',
        ...(requestInit.headers ?? {}),
      },
    });

    const accepted = acceptErrorStatuses ?? [];

    if (!response.ok && !accepted.includes(response.status)) {
      console.error('[ApiClient] GET error', {
        path,
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      // No content
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

export const apiClient = new ApiClient();
