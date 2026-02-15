// Frontend API helper
const API_BASE = '/api/v1';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string; details?: unknown };
}

async function request<T>(
    url: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });
    return res.json();
}

export const api = {
    get: <T>(url: string) => request<T>(url),
    post: <T>(url: string, data?: unknown) =>
        request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
    patch: <T>(url: string, data: unknown) =>
        request<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

    // Multipart upload
    upload: async <T>(url: string, formData: FormData): Promise<ApiResponse<T>> => {
        const res = await fetch(`${API_BASE}${url}`, {
            method: 'POST',
            body: formData,
        });
        return res.json();
    },
};
