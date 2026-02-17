// Frontend API helper — delegates to apiClient internally
// Maintained for backwards compatibility; new code should use apiClient directly.
import { apiClient } from './api-client';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string; details?: unknown };
}

/**
 * Wraps an apiClient call to return the legacy { success, data, error } shape.
 * apiClient throws on error, so we catch and return { success: false, error }.
 */
async function wrapCall<T>(call: () => Promise<T>): Promise<ApiResponse<T>> {
    try {
        const data = await call();
        return { success: true, data };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        return { success: false, error: { code: 'ERROR', message } };
    }
}

export const api = {
    get: <T>(url: string) => wrapCall(() => apiClient.get<T>(url)),
    post: <T>(url: string, data?: unknown) =>
        wrapCall(() => apiClient.post<T>(url, data)),
    patch: <T>(url: string, data: unknown) =>
        wrapCall(() => apiClient.patch<T>(url, data)),
    delete: <T>(url: string) =>
        wrapCall(() => apiClient.delete<T>(url)),

    // Multipart upload — delegates to apiClient.upload
    upload: <T>(url: string, formData: FormData) =>
        wrapCall(() => apiClient.upload<T>(url, formData)),
};

