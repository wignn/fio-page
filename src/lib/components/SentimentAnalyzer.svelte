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
		return 'bg-text-dim/10 text-text border-text-dim/20';
	}

	function getHighlightBg(sentiment: string) {
		const s = sentiment.toLowerCase();
		if (s === 'positive' || s === 'bullish') return 'bg-green/10 text-green border-l-2 border-green px-2 py-1 rounded-r';
		if (s === 'negative' || s === 'bearish') return 'bg-red/10 text-red border-l-2 border-red px-2 py-1 rounded-r';
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
			</div>
		{/if}
	</div>
</div>
