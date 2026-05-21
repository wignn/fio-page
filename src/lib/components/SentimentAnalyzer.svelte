<script lang="ts">
	import { CORE_REST_URL, API_KEY } from '$lib/config';

	let text = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let result = $state<any>(null);

	async function handleAnalyze() {
		if (!text.trim()) return;
		loading = true;
		error = null;
		result = null;

		try {
			const res = await fetch(`${CORE_REST_URL}/api/v1/analyze`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': API_KEY || ''
				},
				body: JSON.stringify({ text })
			});

			if (!res.ok) {
				throw new Error(`Analisis gagal: ${res.status} ${res.statusText}`);
			}

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			result = data;
		} catch (e: any) {
			error = e.message || 'Terjadi kesalahan saat menganalisis teks.';
		} finally {
			loading = false;
		}
	}

	function handleClear() {
		text = '';
		result = null;
		error = null;
	}

	function getSentimentBadgeColor(sentiment: string) {
		const s = sentiment.toLowerCase();
		if (s === 'positive' || s === 'bullish') return 'bg-green/10 text-green border-green/20';
		if (s === 'negative' || s === 'bearish') return 'bg-red/10 text-red border-red/20';
		if (s === 'mixed') return 'bg-amber/10 text-amber border-amber/20';
		return 'bg-text-dim/10 text-text border-text-dim/20';
	}

	function getHighlightBg(sentiment: string) {
		const s = sentiment.toLowerCase();
		if (s === 'positive' || s === 'bullish') return 'bg-green/10 text-green border-l-2 border-green px-2 py-1 rounded-r';
		if (s === 'negative' || s === 'bearish') return 'bg-red/10 text-red border-l-2 border-red px-2 py-1 rounded-r';
		if (s === 'mixed') return 'bg-amber/10 text-amber border-l-2 border-amber px-2 py-1 rounded-r';
		return 'bg-surface border-l-2 border-text-dim/40 px-2 py-1 rounded-r text-text';
	}
</script>

<div class="flex flex-col lg:flex-row gap-6 p-6">
	<!-- Input panel -->
	<div class="flex-1 flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<label for="analyzer-input" class="text-xs font-semibold uppercase tracking-wider text-text-muted">Masukkan Teks Finansial</label>
			<p class="text-xs text-text-dim">Masukkan berita, headline pasar, atau paragraf laporan keuangan untuk dianalisis oleh AI.</p>
		</div>
		<textarea
			id="analyzer-input"
			bind:value={text}
			placeholder="Ketik atau tempel berita di sini... (Contoh: 'Federal Reserve rates surged by 25 basis points exceeding expectations, driving stock gains.')"
			class="w-full h-56 p-4 rounded border border-border bg-surface-2 text-text placeholder-text-dim focus:outline-none focus:border-accent resize-none text-sm transition-colors"
			disabled={loading}
		></textarea>

		<div class="flex gap-3">
			<button
				onclick={handleAnalyze}
				disabled={loading || !text.trim()}
				class="flex-1 py-2.5 px-4 rounded font-semibold text-sm transition-colors text-white bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if loading}
					<svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Menganalisis...
				{:else}
					Mulai Analisis
				{/if}
			</button>

			{#if text || result}
				<button
					onclick={handleClear}
					class="py-2.5 px-5 rounded font-semibold text-sm transition-colors border border-border text-text hover:bg-surface-2"
				>
					Bersihkan
				</button>
			{/if}
		</div>

		{#if error}
			<div class="p-3 text-xs text-red bg-red/10 border border-red/20 rounded">
				{error}
			</div>
		{/if}
	</div>

	<!-- Results panel -->
	<div class="flex-1 flex flex-col border border-border rounded bg-surface-2 p-5 min-h-[300px] justify-center">
		{#if !result && !loading}
			<div class="text-center text-text-dim flex flex-col items-center gap-3">
				<svg class="h-12 w-12 text-text-dim/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				<p class="text-sm">Hasil analisis sentimen FinBERT Anda akan ditampilkan di sini.</p>
			</div>
		{:else if loading}
			<div class="text-center text-text-dim flex flex-col items-center gap-3">
				<div class="animate-pulse flex space-x-4 w-full px-4">
					<div class="flex-1 space-y-4 py-1">
						<div class="h-4 bg-border rounded w-3/4"></div>
						<div class="space-y-2">
							<div class="h-4 bg-border rounded"></div>
							<div class="h-4 bg-border rounded w-5/6"></div>
						</div>
					</div>
				</div>
				<p class="text-xs text-text-dim animate-pulse mt-4">Memproses dan menghitung probabilitas model...</p>
			</div>
		{:else if result}
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between border-b border-border pb-3">
					<h4 class="text-xs font-semibold uppercase tracking-wider text-text-muted">Hasil Analisis</h4>
					<span class="px-2.5 py-1 text-xs font-bold uppercase rounded border {getSentimentBadgeColor(result.sentiment)}">
						{result.sentiment}
					</span>
				</div>

				<!-- Distribution list -->
				<div class="flex flex-col gap-2">
					<div class="text-xs font-medium text-text-muted">Distribusi Sentimen:</div>
					{#if result.distribution}
						{#each Object.entries(result.distribution) as [label, prob]}
							{@const pct = ((prob as number) * 100).toFixed(1)}
							<div class="flex items-center gap-3 text-xs">
								<span class="w-16 capitalize font-medium text-text-dim">{label}</span>
								<div class="flex-1 h-2 bg-surface rounded-full overflow-hidden">
									<div
										class="h-full rounded-full transition-all duration-500"
										style="width: {pct}%; background-color: {label === 'positive' ? 'var(--color-green, #089981)' : label === 'negative' ? 'var(--color-red, #F23645)' : 'var(--color-text-dim, #787b86)'}"
									></div>
								</div>
								<span class="w-10 text-right font-mono text-text font-bold">{pct}%</span>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Highlights -->
				{#if result.highlights && result.highlights.length > 0}
					<div class="flex flex-col gap-2 mt-2">
						<div class="text-xs font-medium text-text-muted">Analisis Per Kalimat:</div>
						<div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
							{#each result.highlights as h}
								<div class="text-xs {getHighlightBg(h.sentiment)}">
									<span class="font-medium text-text">{h.sentence}</span>
									<span class="text-[10px] font-mono text-text-dim/80 ml-1">({(h.score * 100).toFixed(0)}%)</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Entities -->
				{#if result.entities && (result.entities.tickers?.length > 0 || result.entities.currencies?.length > 0)}
					<div class="flex flex-col gap-2 mt-2 border-t border-border pt-3">
						<div class="text-xs font-medium text-text-muted">Entitas Terdeteksi:</div>
						<div class="flex flex-wrap gap-2">
							{#if result.entities.tickers && result.entities.tickers.length > 0}
								{#each result.entities.tickers as ticker}
									<span class="rounded bg-surface px-2 py-0.5 text-[10px] font-mono text-blue border border-border">#{ticker}</span>
								{/each}
							{/if}
							{#if result.entities.currencies && result.entities.currencies.length > 0}
								{#each result.entities.currencies as curr}
									<span class="rounded bg-surface px-2 py-0.5 text-[10px] font-mono text-accent border border-border">${curr}</span>
								{/each}
							{/if}
						</div>
					</div>
				{/if}

				<!-- Translation layer details -->
				{#if result.translated}
					<div class="mt-4 border-t border-border pt-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-text-muted">Terjemahan Otomatis</span>
							<span class="text-[10px] font-mono bg-accent/15 text-accent px-1.5 py-0.5 rounded border border-accent/20">
								{result.language?.toUpperCase()} → {result.analysis_language?.toUpperCase()}
							</span>
						</div>
						<div class="text-xs bg-surface border border-border p-3 rounded text-text-muted leading-relaxed max-h-32 overflow-y-auto italic">
							"{result.translated_text}"
						</div>
					</div>
				{/if}

				<!-- Macro economic event info -->
				{#if result.event && result.event.type}
					<div class="mt-4 border-t border-border pt-4 flex flex-col gap-2">
						<div class="text-xs font-semibold text-text-muted">Detail Data Makroekonomi:</div>
						<div class="bg-surface border border-border rounded p-3 flex flex-col gap-2">
							<div class="flex justify-between items-center pb-2 border-b border-border/60">
								<span class="text-xs font-bold text-text truncate max-w-[180px]">{result.event.type}</span>
								<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-muted uppercase">
									{result.event.country || 'Global'}
								</span>
							</div>
							<div class="grid grid-cols-3 gap-2 text-center text-xs mt-1">
								<div class="flex flex-col p-1.5 bg-surface-2/40 rounded">
									<span class="text-[10px] text-text-dim">Actual</span>
									<span class="font-mono font-bold text-text">{result.event.actual !== null && result.event.actual !== undefined ? result.event.actual : '-'} {result.event.unit || ''}</span>
								</div>
								<div class="flex flex-col p-1.5 bg-surface-2/40 rounded">
									<span class="text-[10px] text-text-dim">Forecast</span>
									<span class="font-mono font-bold text-text-muted">{result.event.forecast !== null && result.event.forecast !== undefined ? result.event.forecast : '-'} {result.event.unit || ''}</span>
								</div>
								<div class="flex flex-col p-1.5 bg-surface-2/40 rounded">
									<span class="text-[10px] text-text-dim">Previous</span>
									<span class="font-mono font-bold text-text-muted">{result.event.previous !== null && result.event.previous !== undefined ? result.event.previous : '-'} {result.event.unit || ''}</span>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Asset market impact grid -->
				{#if result.market_impact && Object.keys(result.market_impact).length > 0}
					<div class="mt-4 border-t border-border pt-4 flex flex-col gap-2">
						<div class="text-xs font-semibold text-text-muted">Proyeksi Dampak Aset:</div>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
							{#each Object.entries(result.market_impact) as [asset, impact]}
								{@const impLower = String(impact).toLowerCase()}
								<div class="flex flex-col items-center justify-center p-2 rounded border border-border bg-surface text-center">
									<span class="text-[10px] font-bold text-text-dim uppercase tracking-wider">{asset}</span>
									<span class="text-[10px] font-black uppercase mt-1 px-1.5 py-0.5 rounded
										{impLower === 'bullish' || impLower === 'positive' ? 'bg-green/10 text-green border border-green/20' : 
										 impLower === 'bearish' || impLower === 'negative' ? 'bg-red/10 text-red border border-red/20' : 
										 'bg-text-dim/10 text-text border border-text-dim/20'}"
									>
										{impact}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- AI trading intelligence -->
				{#if result.final_signal || result.reason}
					<div class="mt-4 border-t border-border pt-4 flex flex-col gap-3">
						<div class="text-xs font-semibold text-text-muted">AI Trading Intelligence:</div>
						<div class="p-4 rounded-lg border bg-surface flex flex-col gap-3
							{result.final_signal?.toLowerCase() === 'buy' || result.final_signal?.toLowerCase() === 'bullish' ? 'border-green/20 bg-green/5' : 
							 result.final_signal?.toLowerCase() === 'sell' || result.final_signal?.toLowerCase() === 'bearish' ? 'border-red/20 bg-red/5' : 
							 'border-border'}"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="text-xs font-semibold text-text-dim">Signal:</span>
									<span class="text-sm font-black uppercase px-2.5 py-0.5 rounded border
										{result.final_signal?.toLowerCase() === 'buy' || result.final_signal?.toLowerCase() === 'bullish' ? 'bg-green/10 text-green border-green/20' : 
										 result.final_signal?.toLowerCase() === 'sell' || result.final_signal?.toLowerCase() === 'bearish' ? 'bg-red/10 text-red border-red/20' : 
										 'bg-text-dim/10 text-text border-text-dim/20'}"
									>
										{result.final_signal || 'NO_SIGNAL'}
									</span>
								</div>
								{#if result.confidence !== undefined && result.confidence !== null}
									<div class="flex items-center gap-2 text-xs">
										<span class="font-semibold text-text-dim">Confidence:</span>
										<span class="font-mono font-black text-text">{(result.confidence * 100).toFixed(0)}%</span>
									</div>
								{/if}
							</div>

							{#if result.confidence !== undefined && result.confidence !== null}
								<div class="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
									<div 
										class="h-full rounded-full transition-all duration-700
											{result.final_signal?.toLowerCase() === 'buy' || result.final_signal?.toLowerCase() === 'bullish' ? 'bg-green' : 
											 result.final_signal?.toLowerCase() === 'sell' || result.final_signal?.toLowerCase() === 'bearish' ? 'bg-red' : 
											 'bg-text-dim'}"
										style="width: {result.confidence * 100}%"
									></div>
								</div>
							{/if}

							{#if result.reason}
								<p class="text-xs text-text-muted leading-relaxed italic mt-1 bg-surface-2/40 p-2.5 rounded border border-border/50">
									"{result.reason}"
								</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
