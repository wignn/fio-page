<script lang="ts">
	import type { NewsItem } from '$lib/types';

	interface Props {
		forexItems: NewsItem[];
		stockItems: NewsItem[];
		selectedSymbol?: string;
	}

	let { forexItems, stockItems, selectedSymbol = 'SPX' }: Props = $props();

	let activeTab = $state<'global' | 'filtered'>('global');

	const synonyms: Record<string, string[]> = {
		'SPX': ['SPX', 'S&P 500', 'S&P500', 'US500', 'STOCK', 'SAHAM', 'EQUITY', 'FED', 'FEDERAL RESERVE', 'INFLASI', 'INFLATION'],
		'XAUUSD': ['XAUUSD', 'XAU', 'GOLD', 'EMAS', 'METAL', 'COMMODITY', 'FED', 'INFLATION'],
		'BTCUSDT': ['BTCUSDT', 'BTC', 'BITCOIN', 'CRYPTO', 'KRIPTO', 'USDT'],
		'DXY': ['DXY', 'DOLLAR', 'USD', 'GREENBACK', 'FED', 'TREASURY', 'YIELD'],
		'EURUSD': ['EURUSD', 'EUR', 'EURO', 'ECB'],
		'GBPUSD': ['GBPUSD', 'GBP', 'POUND', 'BOE'],
		'USDJPY': ['USDJPY', 'JPY', 'YEN', 'BOJ'],
		'AUDUSD': ['AUDUSD', 'AUD', 'AUSSIME', 'RBA']
	};

	let filteredForex = $derived.by(() => {
		const sym = selectedSymbol.toUpperCase();
		const terms = synonyms[sym] || [sym];
		return forexItems.filter(item => {
			const textToSearch = `${item.title} ${item.summary || ''} ${item.tickers || ''} ${item.currency_pairs || ''}`.toUpperCase();
			return terms.some(term => textToSearch.includes(term));
		});
	});

	let filteredStock = $derived.by(() => {
		const sym = selectedSymbol.toUpperCase();
		const terms = synonyms[sym] || [sym];
		return stockItems.filter(item => {
			const textToSearch = `${item.title} ${item.summary || ''} ${item.tickers || ''} ${item.currency_pairs || ''}`.toUpperCase();
			return terms.some(term => textToSearch.includes(term));
		});
	});

	let hasFilteredData = $derived(filteredForex.length + filteredStock.length > 0);

	$effect(() => {
		if (selectedSymbol && hasFilteredData) {
			activeTab = 'filtered';
		} else {
			activeTab = 'global';
		}
	});

	let activeForex = $derived(activeTab === 'global' ? forexItems : filteredForex);
	let activeStock = $derived(activeTab === 'global' ? stockItems : filteredStock);
	let activeAll = $derived([...activeForex, ...activeStock]);

	function getStats(items: NewsItem[]) {
		let positive = 0;
		let negative = 0;
		let neutral = 0;
		for (const item of items) {
			const s = item.sentiment?.toLowerCase();
			if (s === 'positive' || s === 'bullish') positive++;
			else if (s === 'negative' || s === 'bearish') negative++;
			else if (s === 'neutral' || s === 'mixed') neutral++;
		}
		const total = positive + negative + neutral;
		const score = total > 0 ? (positive - negative) / total : 0;
		
		let moodLabel = 'NEUTRAL';
		let moodColor = 'text-text-dim';
		if (total > 0) {
			if (score > 0.6) {
				moodLabel = 'EXTREME GREED';
				moodColor = 'text-green font-bold';
			} else if (score > 0.15) {
				moodLabel = 'GREED';
				moodColor = 'text-green';
			} else if (score < -0.6) {
				moodLabel = 'EXTREME FEAR';
				moodColor = 'text-red font-bold';
			} else if (score < -0.15) {
				moodLabel = 'FEAR';
				moodColor = 'text-red';
			} else {
				moodLabel = 'NEUTRAL';
				moodColor = 'text-text-dim';
			}
		} else {
			moodLabel = 'NO DATA';
			moodColor = 'text-text-dim';
		}
		
		return { positive, negative, neutral, total, score, moodLabel, moodColor };
	}

	let stats = $derived(getStats(activeAll));
	let forexStats = $derived(getStats(activeForex));
	let stockStats = $derived(getStats(activeStock));

	let needleAngle = $derived(stats.total > 0 ? stats.score * 90 : 0);

	let sourceStats = $derived.by(() => {
		const map = new Map<string, { positive: number; negative: number; neutral: number; total: number }>();
		for (const item of activeAll) {
			const name = item.source_name || 'Unknown';
			if (!map.has(name)) map.set(name, { positive: 0, negative: 0, neutral: 0, total: 0 });
			const entry = map.get(name)!;
			const s = item.sentiment?.toLowerCase();
			if (s === 'positive' || s === 'bullish') { entry.positive++; entry.total++; }
			else if (s === 'negative' || s === 'bearish') { entry.negative++; entry.total++; }
			else if (s === 'neutral' || s === 'mixed') { entry.neutral++; entry.total++; }
		}
		return [...map.entries()]
			.sort((a, b) => b[1].total - a[1].total)
			.slice(0, 5);
	});

	let recentAnalyzed = $derived(
		activeAll
			.filter((item) => item.sentiment)
			.sort((a, b) => {
				const da = a.processed_at || a.published_at || '';
				const db = b.processed_at || b.published_at || '';
				return db.localeCompare(da);
			})
			.slice(0, 5)
	);
	let analyzedCount = $derived(activeAll.filter((item) => item.sentiment).length);

	function sentimentBadge(s: string | null): string {
		if (!s) return 'bg-text-dim/10 text-text-dim border-text-dim/20';
		const v = s.toLowerCase();
		if (v === 'positive' || v === 'bullish') return 'bg-green/10 text-green border-green/20';
		if (v === 'negative' || v === 'bearish') return 'bg-red/10 text-red border-red/20';
		if (v === 'mixed') return 'bg-amber/10 text-amber border-amber/20';
		return 'bg-text-dim/10 text-text border-text-dim/20';
	}

	function sentimentDot(s: string | null): string {
		if (!s) return 'bg-text-dim';
		const v = s.toLowerCase();
		if (v === 'positive' || v === 'bullish') return 'bg-green';
		if (v === 'negative' || v === 'bearish') return 'bg-red';
		if (v === 'mixed') return 'bg-amber';
		return 'bg-text-dim';
	}

	function getTitle(item: NewsItem): string {
		return item.translated_title || item.original_title || item.title || item.summary || '';
	}

	function formatTime(iso: string | null): string {
		if (!iso) return '';
		try {
			const d = new Date(iso);
			return d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
		} catch {
			return '';
		}
	}
</script>

<div class="flex flex-col gap-4 p-4">
	<!-- Tab Toggle Header -->
	<div class="flex items-center justify-between border-b border-border pb-4">
		<div class="flex items-center gap-2.5">
			<span class="text-xs font-bold tracking-wider uppercase text-text-muted">AI Market Sentiment</span>
			{#if activeTab === 'filtered'}
				<span class="rounded bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs font-bold text-accent uppercase tracking-wider animate-pulse">
					{selectedSymbol} Filtered
				</span>
			{/if}
		</div>
		<div class="flex gap-1.5 bg-surface-2 p-1 rounded-lg border border-border">
			<button
				onclick={() => activeTab = 'global'}
				class="px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer
				{activeTab === 'global' ? 'bg-surface text-text shadow-sm border border-border/80' : 'text-text-dim hover:text-text'}"
			>
				Global Mood
			</button>
			<button
				onclick={() => {
					if (hasFilteredData) {
						activeTab = 'filtered';
					}
				}}
				disabled={!hasFilteredData}
				class="px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
				{activeTab === 'filtered' ? 'bg-surface text-text shadow-sm border border-border/80' : 'text-text-dim hover:text-text'}"
				title={!hasFilteredData ? `No sentiment data for ${selectedSymbol}` : `Show sentiment for ${selectedSymbol}`}
			>
				{selectedSymbol} Mood
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-items-center bg-surface border border-border rounded-xl p-4 shadow-sm">
		<div class="flex flex-col items-center gap-3 w-full max-w-[220px] justify-center text-center">
			<span class="text-xs font-bold tracking-wider uppercase text-text-dim">Forex & Macro</span>
			<span class="text-sm font-extrabold uppercase tracking-tight {forexStats.moodColor}">
				{forexStats.moodLabel}
			</span>
			
			<div class="relative w-full h-3 bg-surface-2 rounded-full overflow-hidden border border-border my-1">
				<!-- Gradient sections -->
				<div class="absolute left-0 top-0 h-full w-[40%] bg-red/30"></div>
				<div class="absolute left-[40%] top-0 h-full w-[20%] bg-text-dim/20"></div>
				<div class="absolute left-[60%] top-0 h-full w-[40%] bg-green/30"></div>
				<!-- Indicator pointer pin -->
				{#if forexStats.total > 0}
					<div 
						class="absolute top-1/2 -translate-y-1/2 h-4 w-1.5 bg-text border border-surface rounded shadow-md transition-all duration-700"
						style="left: calc({(forexStats.score + 1) * 50}% - 3px);"
					></div>
				{/if}
			</div>
			
			<div class="flex justify-between w-full text-[10px] text-text-dim font-mono font-bold px-1">
				<span class="text-red">{forexStats.negative} Fear</span>
				<span class="text-text-dim">{forexStats.neutral} Neu</span>
				<span class="text-green">{forexStats.positive} Greed</span>
			</div>
		</div>

		<div class="flex flex-col items-center justify-center w-full max-w-[280px] relative md:border-l md:border-r border-border px-6">
			<div class="relative flex flex-col items-center justify-center overflow-visible">
				<svg width="220" height="120" viewBox="0 0 220 120" class="overflow-visible">
					<defs>
						<linearGradient id="tv-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stop-color="var(--color-red, #F23645)" />
							<stop offset="35%" stop-color="#FF7A85" />
							<stop offset="50%" stop-color="var(--color-text-dim, #787b86)" />
							<stop offset="65%" stop-color="#4CD2B9" />
							<stop offset="100%" stop-color="var(--color-green, #089981)" />
						</linearGradient>
					</defs>
					
					<path 
						d="M 25 110 A 85 85 0 0 1 195 110" 
						fill="none" 
						stroke="var(--color-surface-2, #f0f3fa)" 
						stroke-width="12" 
						stroke-linecap="round"
					/>
					
					<path 
						d="M 25 110 A 85 85 0 0 1 195 110" 
						fill="none" 
						stroke="url(#tv-gauge-gradient)" 
						stroke-width="12" 
						stroke-linecap="round"
						opacity="0.9"
					/>
					
					<!-- Center Pivot -->
					<circle cx="110" cy="110" r="7" fill="var(--color-text, #131722)" />
					<circle cx="110" cy="110" r="3" fill="var(--color-bg, #ffffff)" />

					<!-- Ticks around gauge -->
					<circle cx="25" cy="110" r="2" fill="var(--color-bg)" />
					<circle cx="49.88" cy="49.88" r="2" fill="var(--color-bg)" />
					<circle cx="110" cy="25" r="2" fill="var(--color-bg)" />
					<circle cx="170.12" cy="49.88" r="2" fill="var(--color-bg)" />
					<circle cx="195" cy="110" r="2" fill="var(--color-bg)" />
					
					<!-- Needle -->
					<g style="transform: rotate({needleAngle}deg); transform-origin: 110px 110px; transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);">
						<path d="M 108.5 110 L 110 18 L 111.5 110 Z" fill="var(--color-text, #131722)" />
					</g>
				</svg>

				<!-- Gauge bottom indicators -->
				<div class="absolute w-full flex justify-between px-2 top-[95px] text-[9px] font-black text-text-dim/80 uppercase tracking-wider">
					<span>Fear</span>
					<span>Neutral</span>
					<span>Greed</span>
				</div>
			</div>
			
			<!-- Mood Text & Numeric Score -->
			<div class="mt-4 flex flex-col items-center">
				<span class="text-lg font-black tracking-tight uppercase {stats.moodColor}">
					{stats.moodLabel}
				</span>
				<span class="text-[11px] font-mono font-bold text-text-dim mt-0.5">
					Score: {stats.score > 0 ? '+' : ''}{stats.score.toFixed(2)}
				</span>
			</div>
		</div>

		<!-- Right: Stocks / Equities Indicator Gauge -->
		<div class="flex flex-col items-center gap-3 w-full max-w-[220px] justify-center text-center">
			<span class="text-xs font-bold tracking-wider uppercase text-text-dim">Stocks & Equities</span>
			<span class="text-sm font-extrabold uppercase tracking-tight {stockStats.moodColor}">
				{stockStats.moodLabel}
			</span>
			
			<div class="relative w-full h-3 bg-surface-2 rounded-full overflow-hidden border border-border my-1">
				<!-- Gradient sections -->
				<div class="absolute left-0 top-0 h-full w-[40%] bg-red/30"></div>
				<div class="absolute left-[40%] top-0 h-full w-[20%] bg-text-dim/20"></div>
				<div class="absolute left-[60%] top-0 h-full w-[40%] bg-green/30"></div>
				<!-- Indicator pointer pin -->
				{#if stockStats.total > 0}
					<div 
						class="absolute top-1/2 -translate-y-1/2 h-4 w-1.5 bg-text border border-surface rounded shadow-md transition-all duration-700"
						style="left: calc({(stockStats.score + 1) * 50}% - 3px);"
					></div>
				{/if}
			</div>
			
			<div class="flex justify-between w-full text-[10px] text-text-dim font-mono font-bold px-1">
				<span class="text-red">{stockStats.negative} Fear</span>
				<span class="text-text-dim">{stockStats.neutral} Neu</span>
				<span class="text-green">{stockStats.positive} Greed</span>
			</div>
		</div>
	</div>

	<!-- Pill Summary Row -->
	<div class="flex flex-wrap items-center justify-center gap-3 bg-surface-2/40 border border-border rounded-lg py-2.5 px-4">
		<div class="flex items-center gap-1.5 rounded-md bg-red/10 border border-red/20 px-3 py-1 text-xs">
			<span class="h-2 w-2 rounded-full bg-red"></span>
			<span class="font-semibold text-text-muted">Fear:</span>
			<span class="font-bold text-red font-mono">{stats.negative}</span>
		</div>
		<div class="flex items-center gap-1.5 rounded-md bg-text-dim/10 border border-text-dim/20 px-3 py-1 text-xs">
			<span class="h-2 w-2 rounded-full bg-text-dim"></span>
			<span class="font-semibold text-text-muted">Neutral:</span>
			<span class="font-bold text-text font-mono">{stats.neutral}</span>
		</div>
		<div class="flex items-center gap-1.5 rounded-md bg-green/10 border border-green/20 px-3 py-1 text-xs">
			<span class="h-2 w-2 rounded-full bg-green"></span>
			<span class="font-semibold text-text-muted">Greed:</span>
			<span class="font-bold text-green font-mono">{stats.positive}</span>
		</div>
		<div class="h-4 w-px bg-border hidden sm:block"></div>
		<div class="text-xs text-text-muted font-medium">
			Based on <span class="font-bold text-text font-mono">{analyzedCount}</span> analyzed articles
		</div>
	</div>

	<!-- Bottom Section: Breakdown & Recent News -->
	<div class="grid grid-cols-1 gap-4">
		<!-- Source Breakdown (4 cols) -->
		<div class="flex flex-col rounded-xl border border-border bg-surface-2/20 p-4 shadow-sm">
			<div class="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border pb-2 flex justify-between items-center">
				<span>Sentiment by Source</span>
				<span class="text-[10px] text-text-dim font-mono">Top Sources</span>
			</div>
			
			{#if sourceStats.length > 0}
				<div class="flex flex-col gap-4">
					{#each sourceStats as [name, src]}
						<div class="flex flex-col gap-1.5">
							<div class="flex items-center justify-between text-xs font-medium">
								<span class="text-text truncate max-w-[150px]" title={name}>{name}</span>
								<span class="font-mono text-text-dim text-[11px]">{src.total} articles</span>
							</div>
							<div class="flex h-2.5 w-full overflow-hidden rounded-full bg-border border border-border/30">
								{#if src.total > 0}
									<div class="h-full bg-green transition-all duration-500" style="width: {(src.positive / src.total) * 100}%" title="Bullish"></div>
									<div class="h-full bg-text-dim/40 transition-all duration-500" style="width: {(src.neutral / src.total) * 100}%" title="Neutral"></div>
									<div class="h-full bg-red transition-all duration-500" style="width: {(src.negative / src.total) * 100}%" title="Bearish"></div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-1 items-center justify-center text-xs text-text-dim py-8">
					No source stats available
				</div>
			{/if}
		</div>

		<!-- Recently Analyzed (8 cols) -->
		<div class="lg:col-span-8 flex flex-col rounded-xl border border-border bg-surface-2/20 p-4 shadow-sm">
			<div class="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border pb-2 flex justify-between items-center">
				<span>Recently Analyzed Feed</span>
				<span class="text-[10px] text-text-dim font-mono">Real-time Stream</span>
			</div>
			
			{#if recentAnalyzed.length > 0}
				<div class="flex flex-col divide-y divide-border">
					{#each recentAnalyzed as item, i (item.id ?? i)}
						<div class="group flex items-start gap-3.5 py-3 px-1 transition-all rounded-lg hover:bg-surface border-none mb-1 first:pt-1">
							<span class="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full {sentimentDot(item.sentiment)}"></span>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 text-[11px] text-text-dim mb-1">
									<span class="font-bold text-text-muted">{item.source_name || 'Source'}</span>
									<span>·</span>
									<span>{formatTime(item.processed_at ?? item.published_at)}</span>
								</div>
								{#if item.original_url || item.url}
									<a href={item.original_url ?? item.url} target="_blank" rel="noopener noreferrer"
										class="text-xs font-medium leading-normal text-text group-hover:text-accent transition-colors line-clamp-2 hover:underline">
										{getTitle(item)}
									</a>
								{:else}
									<p class="text-xs font-medium leading-normal text-text line-clamp-2">{getTitle(item)}</p>
								{/if}
							</div>
							<span class="shrink-0 rounded-md border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider {sentimentBadge(item.sentiment)}">
								{item.sentiment ?? 'n/a'}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-1 items-center justify-center text-xs text-text-dim py-8">
					No recent analyzed news articles.
				</div>
			{/if}
		</div>
	</div>
</div>
