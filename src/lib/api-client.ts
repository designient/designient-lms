type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function fetcher<T>(url: string, method: RequestMethod = 'GET', body?: unknown): Promise<T> {
    const res = await fetch(url, {
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

export const apiClient = {
    get: <T>(url: string) => fetcher<T>(url, 'GET'),
    post: <T>(url: string, body: unknown) => fetcher<T>(url, 'POST', body),
    put: <T>(url: string, body: unknown) => fetcher<T>(url, 'PUT', body),
    delete: <T>(url: string) => fetcher<T>(url, 'DELETE'),
};
