import { env } from '$env/dynamic/private';
import { json, type RequestEvent } from '@sveltejs/kit';
import { CORE_REST_URL } from '$lib/config';

function apiKey() {
	return env.API_KEY || env.CORE_API_KEY || '';
}

function joinUrl(base: string, path: string) {
	return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export async function proxyCore(event: RequestEvent, path: string) {
	const key = apiKey();
	if (!key) return json({ error: 'Server API key is not configured' }, { status: 500 });

	const url = new URL(joinUrl(CORE_REST_URL, path));
	url.search = event.url.search;

	const headers = new Headers(event.request.headers);
	headers.set('X-API-Key', key);
	headers.delete('host');
	headers.delete('cookie');

	const response = await fetch(url, {
		method: event.request.method,
		headers,
		body: event.request.method === 'GET' || event.request.method === 'HEAD' ? undefined : event.request.body,
		duplex: 'half'
	} as RequestInit & { duplex: 'half' });

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}

export async function createRealtimeSession() {
	const key = apiKey();
	if (!key) return null;

	const response = await fetch(joinUrl(CORE_REST_URL, '/api/v1/realtime/session'), {
		method: 'POST',
		headers: { 'X-API-Key': key }
	});
	if (!response.ok) return null;
	return response.json();
}
