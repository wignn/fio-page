import { CORE_REST_URL, API_KEY } from '$lib/config';

/**
 * Centralized fetch wrapper for the core API engine.
 * Ensures X-API-Key and Content-Type headers are always present.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    const url = path.startsWith('http') ? path : `${CORE_REST_URL}${path}`;
    
    return fetch(url, {
        ...init,
        headers: {
            'X-API-Key': API_KEY || '',
            'Content-Type': 'application/json',
            ...init?.headers
        }
    });
}
