<script lang="ts">
	import type { NewsItem } from '$lib/types';

	interface Props {
		title: string;
		items: NewsItem[];
		loading?: boolean;
	}

	let { title, items, loading = false }: Props = $props();

	function getTitle(item: NewsItem): string {
		return item.translated_title || item.original_title || item.title || item.summary || '';
	}

	let displayItems = $derived(items.filter(i => getTitle(i).length > 0));

	function formatTime(iso: string | null): string {
		if (!iso) return '';
		try {
			const d = new Date(iso);
			return d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
		} catch {
			return '';
		}
	}

	function sentimentColor(s: string | null): string {
		if (!s) return 'text-text-dim';
		const v = s.toLowerCase();
		if (v === 'positive' || v === 'bullish') return 'text-green';
		if (v === 'negative' || v === 'bearish') return 'text-red';
		if (v === 'mixed') return 'text-amber';
		return 'text-text-dim';
	}

	function sentimentDot(s: string | null): string {
		if (!s) return 'bg-text-dim';
		const v = s.toLowerCase();
		if (v === 'positive' || v === 'bullish') return 'bg-green';
		if (v === 'negative' || v === 'bearish') return 'bg-red';
		if (v === 'mixed') return 'bg-amber';
		return 'bg-text-dim';
	}

	// Calculate reactive aggregate sentiment statistics
	let stats = $derived.by(() => {
		let positive = 0;
		let negative = 0;
		let neutral = 0;
		let total = 0;
		for (const item of items) {
			const s = item.sentiment?.toLowerCase();
			if (s === 'positive' || s === 'bullish') {
				positive++;
				total++;
			} else if (s === 'negative' || s === 'bearish') {
				negative++;
				total++;
			} else if (s === 'neutral' || s === 'mixed') {
				neutral++;
				total++;
			}
		}
		return { positive, negative, neutral, total };
	});
</script>

<div class="flex flex-col p-4">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h3>
		{#if stats.total > 0}
			<div class="flex items-center gap-2 text-[10px] font-mono">
				<span class="text-green font-bold">▲ {((stats.positive / stats.total) * 100).toFixed(0)}%</span>
				<span class="text-text-dim font-bold">■ {((stats.neutral / stats.total) * 100).toFixed(0)}%</span>
				<span class="text-red font-bold">▼ {((stats.negative / stats.total) * 100).toFixed(0)}%</span>
			</div>
		{/if}
	</div>

	{#if stats.total > 0}
		<div class="mb-4 h-1.5 w-full bg-border rounded-full overflow-hidden flex">
			<div class="h-full bg-green transition-all duration-500" style="width: {(stats.positive / stats.total) * 100}%" title="Positive"></div>
			<div class="h-full bg-text-dim transition-all duration-500" style="width: {(stats.neutral / stats.total) * 100}%" title="Neutral"></div>
			<div class="h-full bg-red transition-all duration-500" style="width: {(stats.negative / stats.total) * 100}%" title="Negative"></div>
		</div>
	{/if}

	{#if loading && items.length === 0}
		<div class="space-y-3">
			{#each Array(4) as _}
				<div class="h-12 animate-pulse rounded bg-surface-2"></div>
			{/each}
		</div>
	{:else if items.length === 0}
		<div class="p-8 text-center text-sm text-text-muted">
			No news available
		</div>
	{:else}
		<div class="flex flex-col gap-1">
			{#each displayItems as item, i (item.id ?? i)}
				<article class="group rounded border-b border-border py-3 px-2 transition-colors hover:bg-surface-2 cursor-pointer last:border-0">
					<div class="flex flex-col gap-1.5">
						<div class="flex items-center justify-between gap-2 text-xs text-text-dim">
							<div class="flex items-center gap-2">
								<span class="inline-block h-2 w-2 shrink-0 rounded-full {sentimentDot(item.sentiment)}"></span>
								<span class="font-medium text-text-muted">{item.source_name || 'Source'}</span>
							</div>
							<span>{formatTime(item.published_at ?? item.processed_at)}</span>
						</div>
						<h4 class="text-sm leading-relaxed text-text group-hover:text-accent transition-colors line-clamp-2">
							{#if item.original_url || item.url}
								<a href={item.original_url ?? item.url} target="_blank" rel="noopener noreferrer" class="hover:underline">
									{getTitle(item)}
								</a>
							{:else}
								{item.translated_title ?? item.original_title ?? item.title}
							{/if}
						</h4>
						<div class="flex flex-wrap gap-2 mt-1">
							{#if item.currency_pairs}
								<span class="rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono text-accent border border-border">{item.currency_pairs}</span>
							{/if}
							{#if item.tickers}
								<span class="rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono text-blue border border-border">{item.tickers}</span>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
