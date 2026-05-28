export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
	const url = path.startsWith('/api/core/')
		? path
		: `/api/core${path.startsWith('/') ? path : `/${path}`}`;
	const headers = new Headers(init?.headers);
	if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

	return fetch(url, {
		...init,
		headers
	});
}
