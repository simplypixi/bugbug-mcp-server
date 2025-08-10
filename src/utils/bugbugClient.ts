import { captureException, addBreadcrumb } from './sentry.js';

interface BugBugConfig {
  apiToken: string;
  baseUrl?: string;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export class BugBugApiClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(config: BugBugConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://app.bugbug.io/api/v1';
  }

  async verifyConnection(): Promise<void> {
    try {
      addBreadcrumb('Verifying BugBug API connection', 'api');
      const response = await this.getIpAddresses();
      if (response.status !== 200) {
        const error = new Error(`API verification failed: ${response.status} ${response.statusText}`);
        captureException(error, { 
          component: 'bugbug-client',
          operation: 'verifyConnection',
          status: response.status 
        });
        throw error;
      }
      addBreadcrumb('BugBug API connection verified successfully', 'api');
    } catch (error) {
      const apiError = new Error(`Failed to verify BugBug API connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      captureException(apiError, { 
        component: 'bugbug-client',
        operation: 'verifyConnection',
        originalError: error instanceof Error ? error.message : String(error)
      });
      throw apiError;
    }
  }

  private async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' = 'GET',
    body?: any
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    addBreadcrumb(`Making ${method} request to ${endpoint}`, 'api', { 
      endpoint, 
      method,
      hasBody: !!body 
    });
    
    const headers: Record<string, string> = {
      'Authorization': `Token ${this.apiToken}`,
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as any;
      }

      // Log non-2xx responses as potential issues
      if (response.status >= 400) {
        const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
        captureException(error, {
          component: 'bugbug-client',
          operation: 'makeRequest',
          endpoint,
          method,
          status: response.status,
          statusText: response.statusText,
          responseData: data
        });
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      const apiError = new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      captureException(apiError, {
        component: 'bugbug-client',
        operation: 'makeRequest',
        endpoint,
        method,
        originalError: error instanceof Error ? error.message : String(error)
      });
      throw apiError;
    }
  }

  // Config endpoints
  async getIpAddresses(): Promise<ApiResponse<string[]>> {
    return this.makeRequest<string[]>('/config/ips/');
  }

  // Profile endpoints
  async getProfiles(page?: number, pageSize?: number): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/profiles/${query}`);
  }

  async getProfile(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/profiles/${id}/`);
  }

  // Suite endpoints
  async getSuites(page?: number, pageSize?: number, query?: string, ordering?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());
    if (query) params.append('query', query);
    if (ordering) params.append('ordering', ordering);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/suites/${queryString}`);
  }

  async getSuite(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/suites/${id}/`);
  }

  // Suite run endpoints
  async createSuiteRun(data: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/suiteruns/', 'POST', data);
  }

  async getSuiteRun(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/suiteruns/${id}/`);
  }

  async getSuiteRunStatus(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/suiteruns/${id}/status/`);
  }

  async getSuiteRunScreenshots(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/suiteruns/${id}/screenshots/`);
  }

  async stopSuiteRun(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/suiteruns/${id}/stop/`, 'POST');
  }

  // Test endpoints
  async getTests(page?: number, pageSize?: number, query?: string, ordering?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());
    if (query) params.append('query', query);
    if (ordering) params.append('ordering', ordering);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/tests/${queryString}`);
  }

  async getTest(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tests/${id}/`);
  }

  async updateTest(id: string, data: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tests/${id}/`, 'PUT', data);
  }

  async partialUpdateTest(id: string, data: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tests/${id}/`, 'PATCH', data);
  }

  // Test run endpoints
  async getTestRuns(
    page?: number, 
    pageSize?: number, 
    ordering?: string,
    startedAfter?: string,
    startedBefore?: string
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());
    if (ordering) params.append('ordering', ordering);
    if (startedAfter) params.append('started_after', startedAfter);
    if (startedBefore) params.append('started_before', startedBefore);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/testruns/${queryString}`);
  }

  async createTestRun(data: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/testruns/', 'POST', data);
  }

  async getTestRun(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/testruns/${id}/`);
  }

  async getTestRunStatus(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/testruns/${id}/status/`);
  }

  async getTestRunScreenshots(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/testruns/${id}/screenshots/`);
  }

  async stopTestRun(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/testruns/${id}/stop/`, 'POST');
  }
}
