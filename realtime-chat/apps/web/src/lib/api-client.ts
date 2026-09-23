export class ApiClient {
  private baseUrl = '/api/v1';
  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  setToken(token: string | null) {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Includes httpOnly refreshToken cookie
    };

    const url = `${this.baseUrl}${endpoint}`;
    let response = await fetch(url, config);

    // If 401 Unauthorized and not already refreshing, attempt token refresh
    if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/refresh')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            const newToken = data.data.accessToken;
            this.setToken(newToken);
            this.onTokenRefreshed(newToken);
            this.isRefreshing = false;

            // Retry original request
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, { ...config, headers });
          } else {
            this.setToken(null);
            this.isRefreshing = false;
            window.dispatchEvent(new CustomEvent('auth:expired'));
          }
        } catch {
          this.setToken(null);
          this.isRefreshing = false;
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      } else {
        // Wait for token refresh to complete
        const retryPromise = new Promise<T>((resolve, reject) => {
          this.addRefreshSubscriber(async (newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            try {
              const res = await fetch(url, { ...config, headers });
              const json = await res.json();
              if (json.ok) resolve(json.data);
              else reject(new Error(json.error?.message || 'Request failed'));
            } catch (err) {
              reject(err);
            }
          });
        });
        return retryPromise;
      }
    }

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error?.message || 'An unexpected error occurred');
    }

    return data.data as T;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
