<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import { Moon, Sun } from 'lucide-svelte';
	import { DISCORD_INVITE } from '$lib/config';
	import {
		startWebSocket,
		stopWebSocket,
		marketStore,
		realtimeNewsStore
	} from '$lib/stores/websocket.svelte';
	import {
		forexNews,
		stockNews,
		newsLoading,
		startNewsPolling,
		stopNewsPolling
	} from '$lib/stores/news';
	import { startCalendarPolling, stopCalendarPolling } from '$lib/stores/calendar';
	import TickerStrip from '$lib/components/TickerStrip.svelte';
	import MarketGrid from '$lib/components/MarketGrid.svelte';
	import PriceChart from '$lib/components/PriceChart.svelte';
	import WhyDidItMoveCard from '$lib/components/WhyDidItMoveCard.svelte';
	import MarketHeatmap from '$lib/components/MarketHeatmap.svelte';
	import NewsFeed from '$lib/components/NewsFeed.svelte';
	import CalendarTable from '$lib/components/CalendarTable.svelte';
	import SentimentDashboard from '$lib/components/SentimentDashboard.svelte';
	import FeatureGrid from '$lib/components/FeatureGrid.svelte';
	import CommandRef from '$lib/components/CommandRef.svelte';
	import logoUrl from '$lib/assets/logo.png';

	let selectedSymbol = $state('SPX');
	let viewMode = $state('chart');

	let isDarkTheme = $state(false);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const storedTheme = localStorage.getItem('theme');
			if (
				storedTheme === 'dark' ||
				(!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
			) {
				isDarkTheme = true;
				document.documentElement.classList.add('dark');
			}
		}

		startWebSocket();
		startNewsPolling(60_000);
		startCalendarPolling(300_000);
	});

	onDestroy(() => {
		stopWebSocket();
		stopNewsPolling();
		stopCalendarPolling();
	});

	function toggleTheme() {
		isDarkTheme = !isDarkTheme;
		if (isDarkTheme) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}
</script>

<div class="min-h-screen bg-bg text-text">
	<header
		class="sticky top-0 z-50 flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-surface px-4 shadow-sm"
	>
		<div class="flex items-center gap-6">
			<a href={resolve('/')} class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded bg-accent/10">
					<img src={logoUrl} alt="Fio" class="h-6 w-6 object-contain" />
				</div>
				<span class="text-lg font-bold tracking-tight">Fio</span>
			</a>
		</div>

		<div class="flex items-center gap-4">
			<div class="hidden items-center gap-3 border-r border-border pr-4 text-xs md:flex">
				<div class="flex items-center gap-1.5">
					<span
						class="inline-block h-2 w-2 rounded-full {marketStore.connected
							? 'bg-green'
							: 'bg-red'} flash-green"
					></span>
					<span class="text-text-muted">{marketStore.connected ? 'Connected' : 'Disconnected'}</span>
				</div>
			</div>

			<button
				class="text-text-dim transition-colors hover:text-text"
				onclick={toggleTheme}
				title="Toggle theme"
			>
				{#if isDarkTheme}
					<Sun class="h-5 w-5" />
				{:else}
					<Moon class="h-5 w-5" />
				{/if}
			</button>
			<a
				href={resolve('/docs')}
				class="text-sm font-medium text-text-muted transition-colors hover:text-text">Docs</a
			>
			<!-- svelte-ignore no-navigation-without-resolve -->
			<a
				href="https://github.com/wignn/atlsd"
				data-sveltekit-reload
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-text-muted shadow-sm transition-all hover:border-text-dim/30 hover:bg-border/30 hover:text-text"
			>
				<svg
					class="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="currentColor"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
					/>
				</svg>
				<span>GitHub</span>
			</a>

			<a
				href={DISCORD_INVITE}
				data-sveltekit-reload
				target="_blank"
				class="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-glow"
			>
				Discord
			</a>
		</div>
	</header>

	<div class="sticky top-[52px] z-40">
		<TickerStrip />
	</div>

	<!-- Hero Section: Occupies 100vh minus the height of header (52px) and ticker (32px) -->
	<section class="relative flex min-h-[calc(100vh-84px)] flex-col justify-between overflow-hidden bg-bg px-4 py-8 md:px-8 lg:px-16 lg:py-16">
		<!-- Background grids and ambient glow effects -->
		<div class="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-20"></div>
		
		<div class="pointer-events-none absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-[100px] animate-[glow-pulse_8s_infinite]"></div>
		<div class="pointer-events-none absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[100px] animate-[glow-pulse_8s_infinite_2s]"></div>

		<div class="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center">
			<div class="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
				<!-- Left Column: Title & CTA -->
				<div class="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
					<!-- Visual Badge -->
					<div class="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1 text-xs font-semibold text-accent shadow-sm animate-fade-in">
						<span class="relative flex h-2 w-2">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
						</span>
						Real-Time Discord Ingestion
					</div>

					<h1 class="text-4xl font-black tracking-tight text-text sm:text-5xl md:text-6xl leading-[1.1] max-w-xl">
						Real-time Market
						<span class="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-500">Intelligence</span>
					</h1>

					<p class="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-text-muted">
						Live forex & crypto prices, breaking news, economic calendar, and volatility detection —
						streamed directly to your Discord server.
					</p>

					<div class="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
						<!-- svelte-ignore no-navigation-without-resolve -->
						<a
							href={DISCORD_INVITE}
							data-sveltekit-reload
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-accent-glow hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98] w-full sm:w-auto"
						>
							<svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
								/>
							</svg>
							Add to Discord
						</a>
						<a
							href="#market"
							class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-text-muted hover:text-text hover:bg-surface-2 rounded-lg border border-border/60 transition-all w-full sm:w-auto"
						>
							View Live Data ↓
						</a>
					</div>
				</div>

				<!-- Right Column: Discord/Alert Mockup Widget -->
				<div class="hidden lg:flex lg:col-span-5 flex-col min-w-0">
					<div class="relative overflow-hidden rounded-xl border border-border/60 bg-surface/50 backdrop-blur-md shadow-2xl p-4 flex flex-col gap-3 font-sans w-full max-w-[420px] mx-auto select-none">
						<!-- Glow Top Right -->
						<div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/20 blur-xl"></div>
						
						<!-- Discord Channel Header Mockup -->
						<div class="flex items-center justify-between border-b border-border/40 pb-2">
							<div class="flex items-center gap-2">
								<span class="text-text-dim text-lg">#</span>
								<span class="text-xs font-bold text-text tracking-wide">fio-market-alerts</span>
							</div>
							<div class="flex items-center gap-1.5">
								<span class="h-1.5 w-1.5 rounded-full bg-green animate-pulse"></span>
								<span class="text-[10px] font-semibold text-green font-mono uppercase">Live</span>
							</div>
						</div>

						<!-- Mock Messages -->
						<div class="flex flex-col gap-3.5 text-xs max-h-[300px] overflow-hidden">
							
							<!-- Alert 1: Volatility -->
							<div class="flex gap-2.5 items-start">
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white font-black text-[10px]">F</div>
								<div class="flex flex-col min-w-0">
									<div class="flex items-center gap-1.5">
										<span class="font-bold text-text text-[11px] leading-none">Fio Bot</span>
										<span class="rounded bg-accent/15 px-1 py-0.5 text-[8px] font-bold text-accent uppercase leading-none">Bot</span>
										<span class="text-[9px] text-text-dim">Just now</span>
									</div>
									<div class="mt-1 bg-surface-2 border-l-2 border-amber/70 p-2.5 rounded shadow-sm text-text-muted">
										<span class="font-semibold text-text flex items-center gap-1">
											⚠️ Volatility Spike
										</span>
										<div class="mt-1 font-mono text-[10px]">
											<span class="font-semibold text-text">EURUSD</span> jumped <span class="text-green font-bold">+0.32%</span> in 2 mins. Current: <span class="font-semibold text-text">1.09241</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Alert 2: Crypto Price Alert -->
							<div class="flex gap-2.5 items-start">
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white font-black text-[10px]">F</div>
								<div class="flex flex-col min-w-0">
									<div class="flex items-center gap-1.5">
										<span class="font-bold text-text text-[11px] leading-none">Fio Bot</span>
										<span class="rounded bg-accent/15 px-1 py-0.5 text-[8px] font-bold text-accent uppercase leading-none">Bot</span>
										<span class="text-[9px] text-text-dim">1m ago</span>
									</div>
									<div class="mt-1 bg-surface-2 border-l-2 border-green p-2.5 rounded shadow-sm text-text-muted">
										<span class="font-semibold text-text flex items-center gap-1">
											📈 Price Breakout
										</span>
										<div class="mt-1 font-mono text-[10px]">
											<span class="font-semibold text-text">BTCUSDT</span> surged past <span class="font-bold text-text">$68,500</span>. Hourly volume: <span class="text-text font-bold">1.2K BTC</span>.
										</div>
									</div>
								</div>
							</div>

							<!-- Alert 3: Breaking News -->
							<div class="flex gap-2.5 items-start">
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white font-black text-[10px]">F</div>
								<div class="flex flex-col min-w-0">
									<div class="flex items-center gap-1.5">
										<span class="font-bold text-text text-[11px] leading-none">Fio Bot</span>
										<span class="rounded bg-accent/15 px-1 py-0.5 text-[8px] font-bold text-accent uppercase leading-none">Bot</span>
										<span class="text-[9px] text-text-dim">3m ago</span>
									</div>
									<div class="mt-1 bg-surface-2 border-l-2 border-blue/70 p-2.5 rounded shadow-sm text-text-muted">
										<span class="font-semibold text-text flex items-center gap-1">
											📰 Global News Update
										</span>
										<p class="mt-1 text-[11px] font-semibold text-text leading-snug">
											US Core Durable Goods Orders MoM: 0.4% vs 0.1% forecast.
										</p>
										<p class="mt-0.5 text-[10px] text-text-dim font-mono">
											Impact: Positive for USD. EURUSD and GBPUSD dropping.
										</p>
									</div>
								</div>
							</div>

						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Scroll Down Indicator -->
		<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-xs text-text-dim hover:text-text cursor-pointer transition-colors duration-200">
			<a href="#market" class="flex flex-col items-center gap-1">
				<span class="font-semibold">View Live Data</span>
				<svg class="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
				</svg>
			</a>
		</div>
	</section>

	<div class="h-px w-full bg-border"></div>

	<!-- Market Board Section -->
	<section id="market" class="bg-surface-2/10 px-3 py-6 md:px-5 lg:px-6">
		<div class="mx-auto flex w-full max-w-[1600px] flex-col">
			<div class="mb-2 flex shrink-0 flex-col justify-between gap-2 sm:flex-row sm:items-center">
				<div class="flex items-center gap-3">
					<h2 class="text-lg font-black tracking-tight text-text">Market Board</h2>
					<span class="rounded-md border border-border bg-surface px-2 py-1 font-mono text-[10px] font-bold text-text-dim">
						{selectedSymbol}
					</span>
				</div>
				<div
					class="flex items-center gap-1 self-start rounded-md border border-border bg-surface-2 p-0.5 sm:self-auto"
				>
					<button
						onclick={() => (viewMode = 'chart')}
						class="cursor-pointer rounded px-3 py-1 text-[11px] font-bold transition-all
						{viewMode === 'chart'
							? 'border border-border/80 bg-surface text-text shadow-sm'
							: 'text-text-dim hover:text-text'}"
					>
						Chart
					</button>
					<button
						onclick={() => (viewMode = 'heatmap')}
						class="cursor-pointer rounded px-3 py-1 text-[11px] font-bold transition-all
						{viewMode === 'heatmap'
							? 'border border-border/80 bg-surface text-text shadow-sm'
							: 'text-text-dim hover:text-text'}"
					>
						Heatmap
					</button>
				</div>
			</div>

			{#if viewMode === 'chart'}
				<div class="animate-fade-in grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
					<div class="min-h-0 min-w-0 space-y-3">
						<PriceChart symbol={selectedSymbol} height={380} />
						<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
							<WhyDidItMoveCard symbol={selectedSymbol} />
							<div class="grid grid-cols-2 gap-3">
								<PriceChart symbol="SPX" height={140} compact={true} />
								<PriceChart symbol="XAUUSD" height={140} compact={true} />
								<PriceChart symbol="BTCUSDT" height={140} compact={true} />
								<PriceChart symbol="DXY" height={140} compact={true} />
							</div>
						</div>
					</div>
					<aside class="min-w-0 xl:sticky xl:top-[92px] xl:self-start">
						<MarketGrid selected={selectedSymbol} onselect={(sym) => (selectedSymbol = sym)} />
					</aside>
				</div>
			{:else}
				<div class="animate-fade-in min-h-0 flex-1">
					<MarketHeatmap
						onselect={(sym) => {
							selectedSymbol = sym;
							viewMode = 'chart';
						}}
					/>
				</div>
			{/if}
		</div>
	</section>

	<div class="h-px w-full bg-border"></div>

	<section id="analyzer" class="bg-surface-2/10 px-3 py-5 md:px-5 lg:px-6">
		<div class="mx-auto max-w-[1600px]">
			<div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
				<div>
					<div class="mb-3">
						<h2 class="text-xl font-bold tracking-tight text-text">Market Sentiment</h2>
					</div>
					<div class="overflow-hidden rounded border border-border bg-surface shadow-sm">
						<SentimentDashboard
							forexItems={realtimeNewsStore.mergeForex($forexNews)}
							stockItems={[]}
							{selectedSymbol}
						/>
					</div>
				</div>

				<div>
					<div class="mb-3">
						<h2 class="text-xl font-bold tracking-tight text-text">Global News</h2>
					</div>
					<div class="rounded border border-border bg-surface shadow-sm">
						<NewsFeed
							title="Forex & Global"
							items={realtimeNewsStore.mergeForex($forexNews)}
							loading={$newsLoading}
						/>
					</div>
				</div>
			</div>
		</div>
	</section>

	<div class="h-px w-full bg-border"></div>

	<section id="calendar" class="px-3 py-5 md:px-5 lg:px-6">
		<div class="mx-auto max-w-[1600px]">
			<div class="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 class="text-xl font-bold tracking-tight text-text">Economic Calendar</h2>
					<p class="text-xs text-text-muted">High-impact events</p>
				</div>
			</div>

			<div class="overflow-hidden rounded border border-border bg-surface shadow-sm">
				<CalendarTable />
			</div>
		</div>
	</section>

	<div class="h-px w-full bg-border"></div>

	<FeatureGrid />

	<div class="h-px w-full bg-border"></div>

	<CommandRef />

	<footer class="border-t border-border px-4 py-6 md:px-8 lg:px-16">
		<div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
			<div class="flex items-center gap-2 text-sm text-text-muted">
				<span class="font-semibold text-text">Fio</span>
				<span class="text-text-dim">×</span>
				<span>Core</span>
			</div>
			<div class="flex items-center gap-1.5 text-xs text-text-dim">
				<span
					class="inline-block h-1.5 w-1.5 rounded-full {marketStore.connected
						? 'bg-green'
						: 'bg-red'}"
				></span>
				{marketStore.connected ? 'Connected to Core' : 'Disconnected'}
			</div>
		</div>
	</footer>
</div>

