<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { CORE_REST_URL } from '$lib/config';
	import type { WhyMoveCause, WhyMoveResponse } from '$lib/types';

	interface Props {
		symbol: string;
	}

	let { symbol }: Props = $props();

	let data = $state<WhyMoveResponse | null>(null);
	let loading = $state(true);
	let error = $state('');
	let loadedSymbol = $state('');

	let topCauses = $derived(data?.causes.news.slice(0, 3) ?? []);
	let moveTone = $derived(
		data?.move?.direction === 'up'
			? 'text-green'
			: data?.move?.direction === 'down'
				? 'text-red'
				: 'text-text'
	);
	let confidenceClass = $derived(confidenceTone(data?.confidence));

	function confidenceTone(confidence: string | undefined) {
		if (confidence === 'high') return 'border-green/20 bg-green/10 text-green';
		if (confidence === 'medium') return 'border-amber/20 bg-amber/10 text-amber';
		return 'border-border bg-surface-2 text-text-muted';
	}

	function sentimentTone(sentiment: string | null) {
		const value = sentiment?.toLowerCase();
		if (value === 'positive' || value === 'bullish')
			return 'border-green/20 bg-green/10 text-green';
		if (value === 'negative' || value === 'bearish') return 'border-red/20 bg-red/10 text-red';
		if (value === 'mixed') return 'border-amber/20 bg-amber/10 text-amber';
		return 'border-border bg-surface-2 text-text-muted';
	}

	function formatMove(value: number | undefined) {
		if (value == null) return '—';
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	}

	function formatNumber(value: number | undefined) {
		if (value == null) return '—';
		return value.toLocaleString(undefined, { maximumFractionDigits: 5 });
	}

	function formatTime(value: string | null | undefined) {
		if (!value) return '';
		return (
			new Intl.DateTimeFormat('id-ID', {
				hour: '2-digit',
				minute: '2-digit',
				timeZone: 'Asia/Jakarta'
			}).format(new Date(value)) + ' WIB'
		);
	}

	function causeTitle(cause: WhyMoveCause) {
		return cause.title || cause.summary || 'Untitled catalyst';
	}

	async function loadWhy(sym: string) {
		const upper = sym.trim().toUpperCase();
		if (!upper || upper === loadedSymbol) return;
		loading = true;
		error = '';
		try {
			const restBaseUrl = CORE_REST_URL.replace(/^ws/, 'http');
			const res = await fetch(
				`${restBaseUrl}/api/v1/market/why/${encodeURIComponent(upper)}?window=5m`
			);
			if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
			data = (await res.json()) as WhyMoveResponse;
			loadedSymbol = upper;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load explanation.';
			data = null;
			loadedSymbol = '';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadWhy(symbol);
	});

	$effect(() => {
		void loadWhy(symbol);
	});
</script>

<section class="overflow-hidden rounded border border-border bg-surface shadow-sm">
	<div class="flex items-start justify-between gap-4 border-b border-border bg-surface-2/50 p-4">
		<div>
			<p class="text-xs font-bold tracking-[0.2em] text-text-dim uppercase">Why did it move?</p>
			<h3 class="mt-1 text-lg font-black text-text">{symbol.toUpperCase()} catalyst scan</h3>
		</div>
		{#if data}
			<span class="rounded-full border px-3 py-1 text-xs font-bold uppercase {confidenceClass}"
				>{data.confidence}</span
			>
		{/if}
	</div>

	<div class="p-4">
		{#if loading}
			<div class="space-y-3">
				<div class="h-4 w-2/3 animate-pulse rounded bg-surface-2"></div>
				<div class="h-16 animate-pulse rounded bg-surface-2"></div>
			</div>
		{:else if error}
			<div class="rounded border border-red/20 bg-red/10 p-3 text-sm text-red">
				Unable to load explanation: {error}
			</div>
		{:else if data}
			<div class="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
				<div class="rounded-lg border border-border bg-surface-2/40 p-3">
					<p class="text-xs font-semibold text-text-dim uppercase">5m move</p>
					<p class="mt-2 font-mono text-2xl font-black {moveTone}">
						{formatMove(data.move?.move_pct)}
					</p>
					<div class="mt-3 space-y-1 text-xs text-text-muted">
						<p>latest <b class="font-mono text-text">{formatNumber(data.move?.latest_price)}</b></p>
						<p>
							baseline <b class="font-mono text-text">{formatNumber(data.move?.baseline_price)}</b>
						</p>
						<p>ticks <b class="font-mono text-text">{data.move?.tick_count ?? 0}</b></p>
					</div>
				</div>
				<div>
					<p class="text-sm leading-relaxed text-text-muted">{data.summary}</p>
					{#if data.matched_terms.length > 0}
						<div class="mt-3 flex flex-wrap gap-1.5">
							{#each data.matched_terms.slice(0, 8) as term (term)}
								<span
									class="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent"
									>{term}</span
								>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="mt-4 space-y-2">
				{#each topCauses as cause (`${cause.kind}-${cause.title}`)}
					<!-- svelte-ignore no-navigation-without-resolve -->
					<a
						href={cause.url ?? resolve('/#market')}
						target={cause.url ? '_blank' : undefined}
						rel="noopener noreferrer"
						class="block rounded-lg border border-border bg-surface-2/35 p-3 transition hover:border-accent/30 hover:bg-surface-2/70"
					>
						<div class="flex flex-wrap items-center gap-2">
							<span
								class="rounded border px-2 py-0.5 text-[10px] font-bold uppercase {sentimentTone(
									cause.sentiment
								)}">{cause.sentiment ?? 'neutral'}</span
							>
							{#if cause.impact_level}
								<span class="text-[10px] font-bold tracking-wide text-text-dim uppercase"
									>{cause.impact_level} impact</span
								>
							{/if}
							<span class="text-[10px] text-text-dim"
								>{formatTime(cause.processed_at ?? cause.published_at)}</span
							>
						</div>
						<p class="mt-2 line-clamp-2 text-sm font-bold text-text">{causeTitle(cause)}</p>
						{#if cause.source_name}
							<p class="mt-1 text-xs text-text-dim">{cause.source_name} · score {cause.score}</p>
						{/if}
					</a>
				{/each}
				{#if topCauses.length === 0}
					<div
						class="rounded-lg border border-border bg-surface-2/35 p-3 text-sm font-semibold text-text-muted"
					>
						No matching catalyst found in the current lookback window.
					</div>
				{/if}
			</div>
		{/if}
	</div>
</section>
