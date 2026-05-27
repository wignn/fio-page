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
	let llmNarrative = $derived(data?.llm?.status === 'generated' ? data.llm.narrative : null);
	let topCrossAssets = $derived(data?.cross_assets?.slice(0, 3) ?? []);
	let confidenceLabel = $derived(typeof data?.confidence === 'string' ? data.confidence : data?.confidence?.label);
	let driverLabels = $derived((llmNarrative?.drivers ?? data?.drivers ?? []).map((driver) => (typeof driver === 'string' ? driver : driver.name)));
	let matchedTerms = $derived(data?.matched_terms ?? [...new Set((data?.causes.news ?? []).flatMap((cause) => cause.matched_terms ?? []))]);
	let fallbackSummary = $derived(data?.explanation ?? data?.summary ?? 'No explanation available yet.');
	let moveTone = $derived(
		data?.move?.direction === 'up'
			? 'text-green'
			: data?.move?.direction === 'down'
				? 'text-red'
				: 'text-text'
	);
	let confidenceClass = $derived(confidenceTone(confidenceLabel));

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

	function formatMove(value: number | null | undefined) {
		if (value == null) return '—';
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	}

	function formatNumber(value: number | null | undefined) {
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
				>{confidenceLabel}</span
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
					{#if llmNarrative}
							<div class="rounded-lg border border-accent/20 bg-accent/5 p-3">
								<p class="text-xs font-bold tracking-wide text-accent uppercase">Gemini analyst note</p>
								<p class="mt-2 text-sm font-black text-text">{llmNarrative.headline}</p>
								<p class="mt-2 text-sm leading-relaxed text-text-muted">{llmNarrative.explanation}</p>
							</div>
						{:else}
							<p class="text-sm leading-relaxed text-text-muted">{fallbackSummary}</p>
						{/if}
						{#if driverLabels.length > 0}
							<div class="mt-3 flex flex-wrap gap-1.5">
								{#each driverLabels.slice(0, 6) as driver (driver)}
									<span class="rounded-full border border-green/20 bg-green/10 px-2 py-0.5 text-[11px] font-bold text-green">{driver}</span>
								{/each}
							</div>
						{/if}
					{#if matchedTerms.length > 0}
						<div class="mt-3 flex flex-wrap gap-1.5">
							{#each matchedTerms.slice(0, 8) as term (term)}
								<span
									class="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent"
									>{term}</span
								>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			{#if topCrossAssets.length > 0}
					<div class="mt-4 rounded-lg border border-border bg-surface-2/25 p-3">
						<p class="text-xs font-bold tracking-wide text-text-dim uppercase">Same-window cross assets</p>
						<div class="mt-2 grid gap-2 md:grid-cols-3">
							{#each topCrossAssets as asset (asset.symbol)}
								<div class="rounded border border-border bg-surface px-2 py-2">
									<div class="flex items-center justify-between gap-2">
										<span class="font-mono text-xs font-black text-text">{asset.symbol}</span>
										<span class="font-mono text-xs font-bold {asset.direction === 'up' ? 'text-green' : 'text-red'}">{formatMove(asset.move_pct)}</span>
									</div>
									<p class="mt-1 text-[11px] leading-snug text-text-dim">{asset.relationship}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="mt-2 rounded-lg border border-border bg-surface-2/35 p-3">
					<p class="text-xs font-bold tracking-wide text-text-dim uppercase">News evidence</p>
					<p class="mt-1 font-mono text-2xl font-black text-text">{data.causes.news.length}</p>
					<p class="mt-1 text-xs text-text-muted">
						{data.causes.news.length === 1
							? 'matching news catalyst found in the lookback window.'
							: 'matching news catalysts found in the lookback window.'}
					</p>
				</div>
		{/if}
	</div>
</section>
