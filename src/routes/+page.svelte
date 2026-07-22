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
	import { forexNews, newsLoading, startNewsPolling, stopNewsPolling } from '$lib/stores/news';
	import { startCalendarPolling, stopCalendarPolling } from '$lib/stores/calendar';
	import TickerStrip from '$lib/components/TickerStrip.svelte';
	import MarketGrid from '$lib/components/MarketGrid.svelte';
	import PriceChart from '$lib/components/PriceChart.svelte';
	import WhyDidItMoveCard from '$lib/components/WhyDidItMoveCard.svelte';
	import MarketHeatmap from '$lib/components/MarketHeatmap.svelte';
	import NewsFeed from '$lib/components/NewsFeed.svelte';
	import CalendarTable from '$lib/components/CalendarTable.svelte';
	import SentimentDashboard from '$lib/components/SentimentDashboard.svelte';
	import OptionsDashboard from '$lib/components/OptionsDashboard.svelte';
	import FeatureGrid from '$lib/components/FeatureGrid.svelte';
	import CommandRef from '$lib/components/CommandRef.svelte';
	import logoUrl from '$lib/assets/logo.png';
	import { reveal } from '$lib/actions/reveal';

	let selectedSymbol = $state('SPX');
	let viewMode = $state('chart');

	let isDarkTheme = $state(false);

	// Mockup message timing states to create sequential incoming message effect
	let msg1Visible = $state(false);
	let msg2Visible = $state(false);
	let msg3Visible = $state(false);

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

		// Setup Discord mockup animation sequence
		setTimeout(() => (msg1Visible = true), 500);
		setTimeout(() => (msg2Visible = true), 1800);
		setTimeout(() => (msg3Visible = true), 3400);
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
		class="sticky top-0 z-50 flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 shadow-sm backdrop-blur-md"
	>
		<div class="flex items-center gap-6">
			<a href={resolve('/')} class="group flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded bg-accent/10 transition-colors group-hover:bg-accent/20"
				>
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
					<span class="text-text-muted">{marketStore.connected ? 'Connected' : 'Disconnected'}</span
					>
				</div>
			</div>

			<button
				class="rounded-full p-1.5 text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
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
			
			<a
				href="https://github.com/wignn/atlsd"
				data-sveltekit-reload
				target="_blank"
				rel="noopener noreferrer"
				class="hidden items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-text-muted shadow-sm transition-all hover:border-text-dim/30 hover:bg-border/30 hover:text-text sm:flex"
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
				class="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(41,98,255,0.3)] transition-all hover:bg-accent-glow hover:shadow-[0_0_25px_rgba(41,98,255,0.5)] active:scale-95"
			>
				Discord
			</a>
		</div>
	</header>

	<div class="relative sticky top-[52px] z-40">
		<TickerStrip />
		<!-- Edge masks for smooth scrolling fade out -->
		<div
			class="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-bg to-transparent"
		></div>
		<div
			class="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-bg to-transparent"
		></div>
	</div>

	<!-- Hero Section: Occupies 100vh minus the height of header (52px) and ticker (32px) -->
	<section
		class="relative flex min-h-[calc(100vh-84px)] flex-col justify-between overflow-hidden bg-bg px-4 py-8 md:px-8 lg:px-16 lg:py-16"
	>
		<!-- Background grids and ambient glow effects -->
		<div
			class="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-20 transition-opacity duration-1000"
		></div>

		<div
			class="pointer-events-none absolute top-1/4 left-1/4 -z-10 h-72 w-72 animate-[glow-pulse_8s_infinite] rounded-full bg-accent/10 mix-blend-screen blur-[100px] dark:mix-blend-lighten"
		></div>
		<div
			class="pointer-events-none absolute right-1/4 bottom-1/4 -z-10 h-72 w-72 animate-[glow-pulse_8s_infinite_2s] rounded-full bg-blue-500/10 mix-blend-screen blur-[100px] dark:mix-blend-lighten"
		></div>

		<div class="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center">
			<div class="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
				<!-- Left Column: Title & CTA -->
				<div
					class="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left"
				>
					<!-- Visual Badge -->
					<div
						class="animate-fade-in-up mb-6 inline-flex cursor-default items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1.5 text-xs font-semibold text-accent opacity-0 shadow-sm transition-all hover:border-accent/30 hover:bg-accent/10"
					>
						<span class="relative flex h-2 w-2">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"
							></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
						</span>
						Real-Time Discord Ingestion
					</div>

					<h1
						class="animate-fade-in-up max-w-xl text-5xl leading-[1.05] font-black tracking-tight text-text opacity-0 delay-100 sm:text-6xl md:text-7xl"
					>
						Real-time Market
						<span
							class="bg-gradient-to-br from-accent via-blue-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm"
							>Intelligence</span
						>
					</h1>

					<p
						class="animate-fade-in-up mt-6 max-w-lg text-base leading-relaxed font-medium text-text-muted opacity-0 delay-200 sm:text-lg"
					>
						Live forex & crypto prices, breaking news, economic calendar, and volatility detection —
						streamed directly to your Discord server.
					</p>

					<div
						class="animate-fade-in-up mt-8 flex w-full flex-col items-center gap-4 opacity-0 delay-300 sm:w-auto sm:flex-row"
					>
						
						<a
							href={DISCORD_INVITE}
							data-sveltekit-reload
							target="_blank"
							rel="noopener noreferrer"
							class="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(41,98,255,0.39)] transition-all hover:-translate-y-0.5 hover:bg-accent-glow hover:shadow-[0_6px_20px_rgba(41,98,255,0.4)] active:translate-y-0 sm:w-auto"
						>
							<svg
								class="h-5 w-5 transition-transform group-hover:scale-110"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path
									d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
								/>
							</svg>
							Add to Discord
						</a>
						<a
							href="#market" /* svelte-ignore no-navigation-without-resolve */
							class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-surface/50 px-6 py-3.5 text-sm font-bold text-text shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-surface-2 hover:text-text hover:shadow sm:w-auto"
						>
							View Live Data
							<svg
								class="h-4 w-4 text-text-dim"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19 14l-7 7m0 0l-7-7m7 7V3"
								/>
							</svg>
						</a>
					</div>
				</div>

				<!-- Right Column: Discord/Alert Mockup Widget -->
				<div
					class="animate-fade-in-up perspective-1000 hidden min-w-0 flex-col opacity-0 delay-400 lg:col-span-5 lg:flex"
				>
					<div
						class="relative mx-auto flex w-full max-w-[440px] animate-[float_6s_ease-in-out_infinite] flex-col gap-4 overflow-hidden rounded-2xl border border-border/80 bg-surface/60 p-5 font-sans shadow-2xl backdrop-blur-xl transition-transform duration-700 select-none hover:-rotate-x-2 hover:rotate-y-2"
					>
						<!-- Glow Top Right -->
						<div
							class="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl"
						></div>
						<div
							class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl"
						></div>

						<!-- Discord Channel Header Mockup -->
						<div
							class="relative z-10 flex items-center justify-between border-b border-border/50 pb-3"
						>
							<div class="flex items-center gap-2.5">
								<span class="text-xl font-light text-text-dim">#</span>
								<span class="text-sm font-bold tracking-wide text-text">fio-market-alerts</span>
							</div>
							<div
								class="flex items-center gap-1.5 rounded-full border border-border/50 bg-surface-2/80 px-2 py-1"
							>
								<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green"></span>
								<span
									class="font-mono text-[10px] font-bold tracking-wider text-text-muted uppercase"
									>Live Stream</span
								>
							</div>
						</div>

						<!-- Mock Messages -->
						<div
							class="relative z-10 flex max-h-[340px] flex-col gap-4 overflow-hidden pb-2 text-xs"
						>
							<!-- Alert 1: Volatility -->
							{#if msg1Visible}
								<div
									class="flex animate-[message-pop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] items-start gap-3"
								>
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-blue-600 text-xs font-black text-white shadow-md"
									>
										F
									</div>
									<div class="flex min-w-0 flex-1 flex-col">
										<div class="flex items-center gap-2">
											<span
												class="cursor-pointer text-xs leading-none font-bold text-text hover:underline"
												>Fio Bot</span
											>
											<span
												class="flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] leading-none font-black text-accent uppercase"
											>
												<svg class="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24"
													><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg
												>
												Bot
											</span>
											<span
												class="cursor-pointer text-[10px] font-medium text-text-dim hover:underline"
												>Just now</span
											>
										</div>
										<div
											class="group mt-1.5 rounded-md border-l-[3px] border-amber bg-surface-2/80 p-3 text-text-muted shadow-sm backdrop-blur-sm transition-all hover:bg-surface-2"
										>
											<span class="flex items-center gap-1.5 font-bold text-text">
												⚠️ Volatility Spike Detected
											</span>
											<div class="mt-1.5 font-mono text-[11px] leading-relaxed">
												<span class="font-bold text-text">EURUSD</span> jumped
												<span class="rounded bg-green/10 px-1 font-bold text-green">+0.32%</span>
												in 2 mins.<br />Current: <span class="font-bold text-text">1.09241</span>
											</div>
										</div>
									</div>
								</div>
							{/if}

							<!-- Alert 2: Crypto Price Alert -->
							{#if msg2Visible}
								<div
									class="flex animate-[message-pop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] items-start gap-3"
								>
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-blue-600 text-xs font-black text-white shadow-md"
									>
										F
									</div>
									<div class="flex min-w-0 flex-1 flex-col">
										<div class="flex items-center gap-2">
											<span
												class="cursor-pointer text-xs leading-none font-bold text-text hover:underline"
												>Fio Bot</span
											>
											<span
												class="flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] leading-none font-black text-accent uppercase"
											>
												<svg class="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24"
													><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg
												>
												Bot
											</span>
											<span
												class="cursor-pointer text-[10px] font-medium text-text-dim hover:underline"
												>1m ago</span
											>
										</div>
										<div
											class="group mt-1.5 rounded-md border-l-[3px] border-green bg-surface-2/80 p-3 text-text-muted shadow-sm backdrop-blur-sm transition-all hover:bg-surface-2"
										>
											<span class="flex items-center gap-1.5 font-bold text-text">
												📈 Target Hit: Breakout
											</span>
											<div class="mt-1.5 font-mono text-[11px] leading-relaxed">
												<span class="font-bold text-text">BTCUSDT</span> surged past
												<span
													class="rounded border border-border/50 bg-surface px-1 font-bold text-text"
													>$68,500</span
												>.<br />Hourly volume: <span class="font-bold text-text">1.2K BTC</span>.
											</div>
										</div>
									</div>
								</div>
							{/if}

							<!-- Alert 3: Breaking News -->
							{#if msg3Visible}
								<div
									class="flex animate-[message-pop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] items-start gap-3"
								>
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-blue-600 text-xs font-black text-white shadow-md"
									>
										F
									</div>
									<div class="flex min-w-0 flex-1 flex-col">
										<div class="flex items-center gap-2">
											<span
												class="cursor-pointer text-xs leading-none font-bold text-text hover:underline"
												>Fio Bot</span
											>
											<span
												class="flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] leading-none font-black text-accent uppercase"
											>
												<svg class="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24"
													><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg
												>
												Bot
											</span>
											<span
												class="cursor-pointer text-[10px] font-medium text-text-dim hover:underline"
												>3m ago</span
											>
										</div>
										<div
											class="group mt-1.5 rounded-md border-l-[3px] border-blue bg-surface-2/80 p-3 text-text-muted shadow-sm backdrop-blur-sm transition-all hover:bg-surface-2"
										>
											<span class="flex items-center gap-1.5 font-bold text-text">
												📰 Global News Update
											</span>
											<p class="mt-1.5 text-[12px] leading-snug font-semibold text-text">
												US Core Durable Goods Orders MoM: 0.4% vs 0.1% forecast.
											</p>
											<div
												class="mt-2 rounded border border-border/40 bg-surface p-1.5 font-mono text-[10.5px] text-text-muted"
											>
												<span class="font-semibold text-text">Impact:</span> Positive for USD. EURUSD
												and GBPUSD dropping.
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Scroll Down Indicator -->
		<div
			class="animate-fade-in absolute bottom-6 left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 text-xs text-text-dim opacity-0 transition-colors delay-500 duration-300 hover:text-text"
		>
			<a href="#market" /* svelte-ignore no-navigation-without-resolve */ class="flex flex-col items-center gap-1.5">
				<span class="text-[10px] font-semibold tracking-wider uppercase">Scroll to explore</span>
				<div
					class="animate-bounce rounded-full border border-border/50 bg-surface/50 p-2 backdrop-blur"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
					</svg>
				</div>
			</a>
		</div>
	</section>

	<div class="h-px w-full bg-border"></div>

	<!-- Market Board Section -->
	<section
		id="market"
		class="relative overflow-hidden bg-surface-2/30 px-3 py-10 md:px-5 lg:px-6"
		use:reveal={{ y: 40 }}
	>
		<div
			class="pointer-events-none absolute top-0 right-0 -z-10 h-[800px] w-[800px] rounded-full bg-blue-500/5 blur-[120px]"
		></div>
		<div class="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col">
			<div class="mb-4 flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div class="flex items-center gap-4">
					<h2 class="text-2xl font-black tracking-tight text-text">Market Board</h2>
					<span
						class="rounded-md border border-accent/20 bg-accent/5 px-2.5 py-1 font-mono text-[11px] font-bold text-accent shadow-sm"
					>
						{selectedSymbol}
					</span>
				</div>
				<div
					class="flex items-center gap-1 self-start rounded-lg border border-border/80 bg-surface p-1 shadow-sm sm:self-auto"
				>
					<button
						onclick={() => (viewMode = 'chart')}
						class="cursor-pointer rounded-md px-4 py-1.5 text-xs font-bold transition-all
						{viewMode === 'chart'
							? 'border border-border/50 bg-surface-2 text-text shadow-sm'
							: 'text-text-dim hover:bg-surface-2/50 hover:text-text'}"
					>
						Chart
					</button>
					<button
						onclick={() => (viewMode = 'heatmap')}
						class="cursor-pointer rounded-md px-4 py-1.5 text-xs font-bold transition-all
						{viewMode === 'heatmap'
							? 'border border-border/50 bg-surface-2 text-text shadow-sm'
							: 'text-text-dim hover:bg-surface-2/50 hover:text-text'}"
					>
						Heatmap
					</button>
				</div>
			</div>

			{#if viewMode === 'chart'}
				<div
					class="animate-fade-in grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"
				>
					<div class="min-h-0 min-w-0 space-y-4">
						<div
							class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-shadow hover:shadow-md"
						>
							<PriceChart symbol={selectedSymbol} height={380} />
						</div>
						<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<WhyDidItMoveCard symbol={selectedSymbol} />
							<div class="grid grid-cols-2 gap-3">
								<div
									class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-all hover:border-border hover:shadow-md"
								>
									<PriceChart symbol="SPX" height={140} compact={true} />
								</div>
								<div
									class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-all hover:border-border hover:shadow-md"
								>
									<PriceChart symbol="XAUUSD" height={140} compact={true} />
								</div>
								<div
									class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-all hover:border-border hover:shadow-md"
								>
									<PriceChart symbol="BTCUSDT" height={140} compact={true} />
								</div>
								<div
									class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-all hover:border-border hover:shadow-md"
								>
									<PriceChart symbol="DXY" height={140} compact={true} />
								</div>
							</div>
						</div>
					</div>
					<aside
						class="min-w-0 overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm xl:sticky xl:top-[92px] xl:self-start"
					>
						<MarketGrid selected={selectedSymbol} onselect={(sym) => (selectedSymbol = sym)} />
					</aside>
				</div>
			{:else}
				<div
					class="animate-fade-in min-h-0 flex-1 overflow-hidden rounded-xl border border-border/80 bg-surface p-2 shadow-sm"
				>
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

	<section id="options" class="bg-surface-2/10 px-3 py-10 md:px-5 lg:px-6" use:reveal={{ y: 40 }}>
		<div class="mx-auto max-w-[1600px]">
			<OptionsDashboard />
		</div>
	</section>

	<div class="h-px w-full bg-border"></div>

	<section
		id="analyzer"
		class="relative bg-surface-2/10 px-3 py-10 md:px-5 lg:px-6"
		use:reveal={{ y: 40 }}
	>
		<div class="relative z-10 mx-auto max-w-[1600px]">
			<div class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
				<div>
					<div class="mb-4 flex items-center gap-2">
						<h2 class="text-2xl font-black tracking-tight text-text">Market Sentiment</h2>
						<div class="mx-2 h-5 w-px bg-border"></div>
						<span class="text-sm font-medium text-text-muted">Real-time NLP Analysis</span>
					</div>
					<div
						class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-shadow hover:shadow-md"
					>
						<SentimentDashboard
							forexItems={realtimeNewsStore.mergeForex($forexNews)}
							stockItems={[]}
							{selectedSymbol}
						/>
					</div>
				</div>

				<div>
					<div class="mb-4 flex items-center gap-2">
						<h2 class="text-2xl font-black tracking-tight text-text">Global News</h2>
						<div
							class="ml-2 flex items-center gap-1.5 rounded border border-border bg-surface px-2 py-0.5"
						>
							<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green"></span>
							<span class="text-[10px] font-bold text-text-muted uppercase">Live</span>
						</div>
					</div>
					<div
						class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-shadow hover:shadow-md"
					>
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

	<section id="calendar" class="bg-surface-2/20 px-3 py-10 md:px-5 lg:px-6" use:reveal={{ y: 40 }}>
		<div class="mx-auto max-w-[1600px]">
			<div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<h2 class="mb-1 text-2xl font-black tracking-tight text-text">Economic Calendar</h2>
					<p class="text-sm font-medium text-text-muted">High-impact macro events and releases</p>
				</div>
			</div>

			<div
				class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-shadow hover:shadow-md"
			>
				<CalendarTable />
			</div>
		</div>
	</section>

	<div class="h-px w-full bg-border"></div>

	<div use:reveal={{ y: 40 }}>
		<FeatureGrid />
	</div>

	<div class="h-px w-full bg-border"></div>

	<div use:reveal={{ y: 40 }}>
		<CommandRef />
	</div>

	<footer class="border-t border-border bg-surface px-4 py-8 md:px-8 lg:px-16">
		<div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
			<div class="flex items-center gap-3">
				<div class="flex h-6 w-6 items-center justify-center rounded bg-text text-bg">
					<img src={logoUrl} alt="Fio" class="h-4 w-4 object-contain invert dark:invert-0" />
				</div>
				<div class="flex items-center gap-2 text-sm font-medium text-text-muted">
					<span class="font-bold text-text">Fio</span>
					<span class="text-text-dim">×</span>
					<span>Core</span>
				</div>
			</div>

			<div class="flex items-center gap-6">
				<a
					href={resolve('/docs')}
					class="text-sm font-medium text-text-muted transition-colors hover:text-text"
					>Documentation</a
				>
				<a
					href={resolve('/portal')}
					class="text-sm font-medium text-text-muted transition-colors hover:text-text"
					>Admin Portal</a
				>

				<div
					class="flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text-dim"
				>
					<span
						class="inline-block h-2 w-2 rounded-full {marketStore.connected
							? 'bg-green'
							: 'bg-red'}"
					></span>
					{marketStore.connected ? 'System Operational' : 'Disconnected'}
				</div>
			</div>
		</div>
	</footer>
</div>
