import type { AnalyticsSummary, DynamicQRServerRecord } from '../types/qr';

export interface BackendHealth {
  ok: boolean;
  dynamicEnabled: boolean;
  imageHostingEnabled: boolean;
}

export interface UploadedImageResponse {
  id: string;
  url: string;
  mimeType: string;
  size: number;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const apiService = {
  async checkHealth(): Promise<BackendHealth> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeout);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return { ok: false, dynamicEnabled: false, imageHostingEnabled: false };
      }
      const data = (await res.json()) as Partial<BackendHealth>;
      if (typeof data?.ok !== 'boolean') {
        return { ok: false, dynamicEnabled: false, imageHostingEnabled: false };
      }
      return {
        ok: data.ok,
        dynamicEnabled: Boolean(data.dynamicEnabled),
        imageHostingEnabled: Boolean(data.imageHostingEnabled),
      };
    } catch {
      return { ok: false, dynamicEnabled: false, imageHostingEnabled: false };
    }
  },

  async listDynamicQRs(): Promise<DynamicQRServerRecord[]> {
    return fetchJson<DynamicQRServerRecord[]>('/api/dynamic-qrs');
  },

  async createDynamicQR(payload: {
    name: string;
    destinationUrl: string;
    expiresAt?: string | null;
  }): Promise<DynamicQRServerRecord> {
    return fetchJson<DynamicQRServerRecord>('/api/dynamic-qrs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateDynamicQR(
    id: string,
    updates: {
      name?: string;
      destinationUrl?: string;
      active?: boolean;
      expiresAt?: string | null;
    }
  ): Promise<DynamicQRServerRecord> {
    return fetchJson<DynamicQRServerRecord>(`/api/dynamic-qrs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteDynamicQR(id: string): Promise<void> {
    await fetchJson<{ deleted: boolean }>(`/api/dynamic-qrs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getAnalytics(): Promise<AnalyticsSummary> {
    return fetchJson<AnalyticsSummary>('/api/analytics');
  },

  async uploadImage(payload: {
    fileName: string;
    mimeType: string;
    dataBase64: string;
  }): Promise<UploadedImageResponse> {
    return fetchJson<UploadedImageResponse>('/api/images', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
