/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AuthMode = 'login' | 'signup';

export interface User {
  fullName: string;
  email: string;
  workspaceName: string;
  token?: string;
}

export interface ApiRequestItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Array<{ id: string; key: string; value: string; active: boolean; description?: string }>;
  params: Array<{ id: string; key: string; value: string; active: boolean; description?: string }>;
  bodyType: 'none' | 'json' | 'form-data' | 'graphql';
  bodyContent: string;
  authToken?: { type: 'none' | 'bearer' | 'basic'; token?: string; username?: string; password?: string };
  preRequestScript?: string;
  testScript?: string;
}

export interface CollectionFolder {
  id: string;
  name: string;
  requests: ApiRequestItem[];
}

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  active: boolean;
  isSecret: boolean;
}

export interface QueryHistory {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  timestamp: string;
  status: number;
  latency: number;
  responseBytes: number;
  responsePreview: string;
}

