type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

function resolveUrl(url: string): string {
    // If the URL already starts with /api/, leave it as-is.
    // Otherwise, auto-prepend /api/v1 (backwards compat with legacy api helper).
    if (url.startsWith('/api/')) return url;
    return `/api/v1${url.startsWith('/') ? '' : '/'}${url}`;
}

async function fetcher<T>(url: string, method: RequestMethod = 'GET', body?: unknown): Promise<T> {
    const res = await fetch(resolveUrl(url), {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let errorMessage = 'An error occurred';
        try {
            const errorData = await res.json();
            errorMessage = errorData.error?.message || errorData.message || res.statusText;
        } catch {
            errorMessage = res.statusText;
        }
        throw new Error(errorMessage);
    }

    const json = await res.json();
    return json.data as T; // Assuming our API returns { data: ... }
}

async function uploadFetcher<T>(url: string, formData: FormData): Promise<T> {
    const res = await fetch(resolveUrl(url), {
        method: 'POST',
        body: formData,
        // No Content-Type header — browser sets multipart/form-data boundary automatically
    });

    if (!res.ok) {
        let errorMessage = 'Upload failed';
        try {
            const errorData = await res.json();
            errorMessage = errorData.error?.message || errorData.message || res.statusText;
        } catch {
            errorMessage = res.statusText;
        }
        throw new Error(errorMessage);
    }

    const json = await res.json();
    return json.data as T;
}

export const apiClient = {
    get: <T>(url: string) => fetcher<T>(url, 'GET'),
    post: <T>(url: string, body: unknown) => fetcher<T>(url, 'POST', body),
    put: <T>(url: string, body: unknown) => fetcher<T>(url, 'PUT', body),
    patch: <T>(url: string, body: unknown) => fetcher<T>(url, 'PATCH', body),
    delete: <T>(url: string, body?: unknown) => fetcher<T>(url, 'DELETE', body),
    upload: <T>(url: string, formData: FormData) => uploadFetcher<T>(url, formData),
};

