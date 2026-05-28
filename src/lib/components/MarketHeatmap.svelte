<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-svelte';
	import { marketStore } from '$lib/stores/websocket.svelte';
	import type { PriceData } from '$lib/types';
	import { apiFetch } from '$lib/api';
	import { getLocalLogo } from '$lib/logo';

	interface Props {
		onselect: (symbol: string) => void;
	}
	let { onselect }: Props = $props();

	let allPrices: PriceData[] = $derived(marketStore.prices);
	let activeCategory = $state('all');
	let searchQuery = $state('');
	let sortBy = $state('change-desc');
	let containerWidth = $state(800);
	let containerHeight = $state(520);

	let initialPrices = $state<Map<string, number>>(new Map());
	let sparklines = $state<Record<string, number[]>>({});
	let sparklineLoading = $state<Record<string, boolean>>({});

	// Categories Definition
	const categories = [
		{ id: 'all', name: 'All Markets' },
		{ id: 'stocks', name: 'Stocks' },
		{ id: 'forex', name: 'Forex' },
		{ id: 'indices', name: 'Indices' },
		{ id: 'crypto', name: 'Crypto' },
		{ id: 'commodities', name: 'Commodities' }
	];
	const marketCategoryIds = categories.filter((cat) => cat.id !== 'all').map((cat) => cat.id);

	function getAssetCategory(item: PriceData): string {
		const assetType = (item.asset_type ?? '').toLowerCase();
		if (['stock', 'stocks', 'equity', 'saham'].includes(assetType)) return 'stocks';
		if (['forex', 'fx', 'currency'].includes(assetType)) return 'forex';
		if (['index', 'indices', 'global_index'].includes(assetType)) return 'indices';
		if (['crypto', 'cryptocurrency'].includes(assetType)) return 'crypto';
		if (['commodity', 'commodities', 'metal', 'energy'].includes(assetType)) return 'commodities';

		const sym = item.symbol.toUpperCase();
		if (sym.endsWith('USDT')) return 'crypto';
		if (sym === 'XAUUSD' || sym.startsWith('XAU')) return 'commodities';
		if (/^[A-Z]{6}$/.test(sym)) return 'forex';
		return 'stocks';
	}

	function getCategoryName(cat: string): string {
		if (cat === 'stocks') return 'Stocks & Bursa';
		if (cat === 'crypto') return 'Cryptocurrency';
		if (cat === 'forex') return 'Forex (Currencies)';
		if (cat === 'indices') return 'Global Indices';
		if (cat === 'commodities') return 'Commodities & Metals';
		return 'Other Markets';
	}

	// Ticker Metadata and Details
	function getSymbolDetails(itemOrSymbol: PriceData | string) {
		const symbol = typeof itemOrSymbol === 'string' ? itemOrSymbol : itemOrSymbol.symbol;
		const category = typeof itemOrSymbol === 'string' ? getAssetCategory({ symbol, asset_type: '', price: 0 } as PriceData) : getAssetCategory(itemOrSymbol);
		const sym = symbol.toUpperCase();
		let name = sym;
		let badge = sym.substring(0, 4);
		let badgeColor = 'bg-accent/10 text-accent border border-accent/20';
		let unit = category === 'forex' ? 'RATE' : category === 'stocks' ? 'EQTY' : category === 'indices' ? 'IDX' : 'USD';
		let format = (val: number) => formatPrice(val, category, sym);
		let logo = { type: 'svg', url: '' };
		let displaySymbol = sym;

		if (sym === 'BTCUSDT') {
			name = 'Bitcoin';
			badge = 'BTC';
			badgeColor = 'bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/20';
			unit = 'USD';
			format = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
			logo = { type: 'img', url: 'https://assets.coincap.io/assets/icons/btc@2x.png' };
		} else if (sym === 'ETHUSDT') {
			name = 'Ethereum';
			badge = 'ETH';
			badgeColor = 'bg-[#627EEA]/10 text-[#627EEA] border border-[#627EEA]/20';
			unit = 'USD';
			format = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
			logo = { type: 'img', url: 'https://assets.coincap.io/assets/icons/eth@2x.png' };
		} else if (sym === 'SOLUSDT') {
			name = 'Solana';
			badge = 'SOL';
			badgeColor = 'bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20';
			unit = 'USD';
			format = (val: number) => val.toFixed(2);
			logo = { type: 'img', url: 'https://assets.coincap.io/assets/icons/sol@2x.png' };
		} else if (sym === 'BNBUSDT') {
			name = 'BNB';
			badge = 'BNB';
			badgeColor = 'bg-[#F3BA2F]/10 text-[#F3BA2F] border border-[#F3BA2F]/20';
			unit = 'USD';
			format = (val: number) => val.toFixed(1);
			logo = { type: 'img', url: 'https://assets.coincap.io/assets/icons/bnb@2x.png' };
		} else if (sym === 'PAXGUSDT') {
			name = 'PAX Gold';
			badge = 'PAXG';
			displaySymbol = 'PAXG';
			badgeColor = 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20';
			unit = 'USD';
			format = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
			logo = { type: 'svg', url: '' };
		} else if (sym === 'EURUSD') {
			name = 'Euro / USD';
			badge = 'EUR';
			badgeColor = 'bg-[#003399]/10 text-[#003399] border border-[#003399]/20';
			unit = 'RATE';
			format = (val: number) => val.toFixed(5);
			logo = { type: 'img', url: 'https://flagcdn.com/w80/eu.png' };
		} else if (sym === 'GBPUSD') {
			name = 'GBP / USD';
			badge = 'GBP';
			badgeColor = 'bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20';
			unit = 'RATE';
			format = (val: number) => val.toFixed(5);
			logo = { type: 'img', url: 'https://flagcdn.com/w80/gb.png' };
		} else if (sym === 'USDJPY') {
			name = 'USD / Yen';
			badge = 'JPY';
			badgeColor = 'bg-[#BC002D]/10 text-[#BC002D] border border-[#BC002D]/20';
			unit = 'JPY';
			format = (val: number) => val.toFixed(3);
			logo = { type: 'img', url: 'https://flagcdn.com/w80/jp.png' };
		} else if (sym === 'XAUUSD') {
			name = 'Gold Spot';
			badge = 'GOLD';
			badgeColor = 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20';
			unit = 'USD';
			format = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
		} else if (sym === 'SPX') {
			name = 'S&P 500';
			badge = 'SPX';
			badgeColor = 'bg-blue-600/10 text-blue-600 border border-blue-600/20';
			unit = 'USD';
			format = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		} else if (sym === 'DXY') {
			name = 'US Dollar Index';
			badge = 'DXY';
			badgeColor = 'bg-emerald-600/10 text-emerald-600 border border-[#10B981]/20';
			unit = 'RATE';
			format = (val: number) => val.toFixed(3);
		} else if (category === 'stocks') {
			name = `${sym} Equity`;
			badge = sym.slice(0, 4);
			badgeColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
			unit = 'USD';
		} else if (category === 'indices') {
			name = `${sym} Index`;
			badge = sym.slice(0, 5);
			badgeColor = 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
			unit = 'INDEX';
		} else if (category === 'forex') {
			name = sym.length === 6 ? `${sym.slice(0, 3)} / ${sym.slice(3)}` : sym;
			badge = sym.slice(0, 3);
			badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
			unit = 'RATE';
		}

		// Prioritize local logo over any fallback URL defined above
		const localLogoUrl = getLocalLogo(sym);
		if (localLogoUrl) {
			logo = { type: 'img', url: localLogoUrl };
		}

		return { name, badge, badgeColor, unit, format, logo, displaySymbol };
	}

	function formatPrice(val: number, category: string, symbol: string): string {
		if (category === 'crypto') {
			return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
		}
		if (category === 'stocks' || category === 'indices') {
			return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
		}
		if (category === 'forex') {
			if (symbol.includes('JPY')) return val.toFixed(3);
			if (symbol.includes('IDR')) return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
			return val.toFixed(5);
		}
		return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
	}

	// Capture initial prices for performance tracking
	$effect(() => {
		for (const p of allPrices) {
			if (!initialPrices.has(p.symbol) && p.price > 0) {
				initialPrices.set(p.symbol, p.price);
			}
		}
	});

	// Percent Change helper
	function getPercentChange(p: PriceData): { value: number; string: string } {
		const base = initialPrices.get(p.symbol) ?? p.price;
		if (base === 0) return { value: 0, string: '0.00%' };
		const pct = ((p.price - base) / base) * 100;
		const sign = pct >= 0 ? '+' : '';
		return {
			value: pct,
			string: `${sign}${pct.toFixed(2)}%`
		};
	}

	// Flash Map for real-time WebSocket ticks
	let flashMap = $state<Map<string, 'up' | 'down'>>(new Map());
	const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

	$effect(() => {
		const now = Date.now();
		for (const p of allPrices) {
			if (p.direction !== 'none' && now - p.updated_at < 1000) {
				if (activeTimeouts.has(p.symbol) && flashMap.get(p.symbol) === p.direction) {
					continue;
				}

				if (activeTimeouts.has(p.symbol)) {
					clearTimeout(activeTimeouts.get(p.symbol));
				}

				flashMap.set(p.symbol, p.direction);

				const timeout = setTimeout(() => {
					flashMap.delete(p.symbol);
					activeTimeouts.delete(p.symbol);
				}, 600);

				activeTimeouts.set(p.symbol, timeout);
			}
		}

		return () => {
			for (const timeout of activeTimeouts.values()) {
				clearTimeout(timeout);
			}
			activeTimeouts.clear();
		};
	});

	// Sparkline data loading
	async function loadHistoricalData(sym: string, initialPrice: number): Promise<number[]> {
		const upperSym = sym.toUpperCase();
		const limit = 20;

		try {
			const res = await apiFetch(`/api/v1/market/history/${upperSym}`);
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data) && data.length > 0) {
					// Use recent history data points
					const sliceData = data.slice(-limit);
					if (sliceData.length > 0) {
						// Store the first historical price as the base price for more accurate % change calculations
						if (sliceData[0].value > 0) {
							initialPrices.set(upperSym, sliceData[0].value);
						}
						return sliceData.map((item: any) => item.value);
					}
				}
			}
		} catch (e) {
			console.warn(`[Heatmap] Proxy history fetch failed for ${upperSym}`, e);
		}

		// Fallback generated points
		const fallbackData = [];
		let price = initialPrice > 0 ? initialPrice : 1.0;
		if (upperSym.includes('JPY')) price = 150.0;
		if (upperSym === 'XAUUSD') price = 4500.0;
		if (upperSym === 'SPX') price = 5200.0;
		if (upperSym === 'DXY') price = 104.50;
		if (upperSym.endsWith('USDT')) price = upperSym.startsWith('BTC') ? 95000.0 : 3000.0;

		initialPrices.set(upperSym, price * 0.995); // offset base so we have a nice change
		for (let i = 0; i < limit; i++) {
			const change = (Math.random() - 0.5) * (price * 0.001);
			price = price + change;
			fallbackData.push(price);
		}
		return fallbackData;
	}

	$effect(() => {
		for (const p of allPrices) {
			const sym = p.symbol;
			if (!sparklines[sym] && !sparklineLoading[sym]) {
				sparklineLoading[sym] = true;
				loadHistoricalData(sym, p.price).then((hist) => {
					sparklines[sym] = hist;
					sparklineLoading[sym] = false;
				});
			}
		}
	});

	// Append websocket price updates to sparklines in real-time
	$effect(() => {
		for (const p of allPrices) {
			const sym = p.symbol;
			const currentSpark = sparklines[sym];
			if (currentSpark && currentSpark.length > 0) {
				const lastVal = currentSpark[currentSpark.length - 1];
				if (p.price !== lastVal) {
					// Shift and push
					sparklines[sym] = [...currentSpark.slice(1), p.price];
				}
			}
		}
	});

	// SVG Sparkline Math Helper
	function getSparklinePath(values: number[], width = 100, height = 30): string {
		if (!values || values.length < 2) return '';
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min === 0 ? 1 : max - min;

		const points = values.map((val, index) => {
			const x = (index / (values.length - 1)) * width;
			const y = height - ((val - min) / range) * height;
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		});

		return `M ${points.join(' L ')}`;
	}

	function getSparklineFillPath(values: number[], width = 100, height = 30): string {
		if (!values || values.length < 2) return '';
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min === 0 ? 1 : max - min;

		const points = values.map((val, index) => {
			const x = (index / (values.length - 1)) * width;
			const y = height - ((val - min) / range) * height;
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		});

		return `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
	}

	// Filter and Sort Processing
	let processedPrices = $derived.by(() => {
		let list = allPrices.map((p) => {
			const category = getAssetCategory(p);
			const pct = getPercentChange(p);
			const details = getSymbolDetails(p);
			return {
				...p,
				category,
				pct,
				details
			};
		});

		// Apply Search
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter(
				(item) =>
					item.symbol.toLowerCase().includes(q) ||
					item.details.name.toLowerCase().includes(q)
			);
		}

		// Apply Category Tab (If not 'all')
		if (activeCategory !== 'all') {
			list = list.filter((item) => item.category === activeCategory);
		}

		// Apply Sorting
		list.sort((a, b) => {
			if (sortBy === 'symbol') {
				return a.symbol.localeCompare(b.symbol);
			} else if (sortBy === 'change-desc') {
				return b.pct.value - a.pct.value;
			} else if (sortBy === 'change-asc') {
				return a.pct.value - b.pct.value;
			} else if (sortBy === 'price-desc') {
				return b.price - a.price;
			} else if (sortBy === 'price-asc') {
				return a.price - b.price;
			}
			return 0;
		});

		return list;
	});

	// Hardcoded weights corresponding to relative market sizes/relevance for realistic sizing
	const symbolWeights: Record<string, number> = {
		BTCUSDT: 1400,
		ETHUSDT: 500,
		SOLUSDT: 140,
		BNBUSDT: 120,
		PAXGUSDT: 40,
		EURUSD: 800,
		GBPUSD: 400,
		USDJPY: 500,
		SPX: 1600,
		DXY: 500,
		XAUUSD: 700
	};

	function getSymbolWeight(symbol: string): number {
		return symbolWeights[symbol.toUpperCase()] ?? 60;
	}

	interface TreeMapNode {
		id: string;
		weight: number;
		x: number;
		y: number;
		w: number;
		h: number;
		data: any;
	}

	// Squarified Treemap Algorithm implementation
	function worst(row: { weight: number }[], w: number, h: number, totalWeight: number): number {
		if (row.length === 0) return Infinity;
		const rowWeight = row.reduce((sum, n) => sum + n.weight, 0);
		const s = Math.min(w, h);
		if (s <= 0 || rowWeight <= 0) return Infinity;
		
		const scale = (w * h) / totalWeight;
		const minW = Math.min(...row.map(n => n.weight)) * scale;
		const maxW = Math.max(...row.map(n => n.weight)) * scale;
		const sumW = rowWeight * scale;
		
		return Math.max(
			(s * s * maxW) / (sumW * sumW),
			(sumW * sumW) / (s * s * minW)
		);
	}

	function layoutRow(
		row: TreeMapNode[],
		w: number,
		h: number,
		x: number,
		y: number,
		totalWeight: number,
		result: TreeMapNode[]
	) {
		const rowWeight = row.reduce((sum, n) => sum + n.weight, 0);
		if (totalWeight <= 0 || rowWeight <= 0) return;
		
		const scale = (w * h) / totalWeight;
		const thickness = (rowWeight * scale) / Math.min(w, h);
		
		let offset = 0;
		for (const node of row) {
			const nodeArea = node.weight * scale;
			const nodeLength = nodeArea / thickness;
			
			if (w >= h) {
				node.x = x;
				node.y = y + offset;
				node.w = thickness;
				node.h = nodeLength;
			} else {
				node.x = x + offset;
				node.y = y;
				node.w = nodeLength;
				node.h = thickness;
			}
			offset += nodeLength;
			result.push(node);
		}
	}

	function squarify(
		remaining: TreeMapNode[],
		row: TreeMapNode[],
		w: number,
		h: number,
		x: number,
		y: number,
		totalWeight: number,
		result: TreeMapNode[]
	) {
		if (remaining.length === 0) {
			if (row.length > 0) {
				layoutRow(row, w, h, x, y, totalWeight, result);
			}
			return;
		}
		
		const nextNode = remaining[0];
		const newRow = [...row, nextNode];
		
		const currentWorst = worst(row, w, h, totalWeight);
		const newWorst = worst(newRow, w, h, totalWeight);
		
		if (row.length === 0 || newWorst <= currentWorst) {
			squarify(remaining.slice(1), newRow, w, h, x, y, totalWeight, result);
		} else {
			const rowWeight = row.reduce((sum, n) => sum + n.weight, 0);
			if (totalWeight <= 0) return;
			const ratio = rowWeight / totalWeight;
			
			let newX = x;
			let newY = y;
			let newW = w;
			let newH = h;
			
			if (w >= h) {
				newX += w * ratio;
				newW -= w * ratio;
			} else {
				newY += h * ratio;
				newH -= h * ratio;
			}
			
			layoutRow(row, w, h, x, y, totalWeight, result);
			squarify(remaining, [], newW, newH, newX, newY, totalWeight - rowWeight, result);
		}
	}

	function computeTreeMap(
		nodes: { id: string; weight: number; data?: any }[],
		x: number,
		y: number,
		w: number,
		h: number
	): TreeMapNode[] {
		if (nodes.length === 0) return [];
		if (w <= 0 || h <= 0) return [];
		
		const sorted = nodes
			.map(n => ({ id: n.id, weight: Math.max(n.weight, 1), x: 0, y: 0, w: 0, h: 0, data: n.data }))
			.sort((a, b) => b.weight - a.weight);
			
		const totalWeight = sorted.reduce((sum, n) => sum + n.weight, 0);
		const result: TreeMapNode[] = [];
		squarify(sorted, [], w, h, x, y, totalWeight, result);
		return result;
	}

	// Compute flat treemap based on current processed prices, scaled to pixel size and snapped to integers
	let computedTreeMap = $derived.by(() => {
		const rawNodes = computeTreeMap(
			processedPrices.map(p => ({ id: p.symbol, weight: getSymbolWeight(p.symbol), data: p })),
			0,
			0,
			containerWidth,
			containerHeight
		);

		// Snap nodes to integer pixel grid to prevent sub-pixel rendering gaps
		return rawNodes.map(node => {
			const x = Math.round(node.x);
			const y = Math.round(node.y);
			const w = Math.round(node.x + node.w) - x;
			const h = Math.round(node.y + node.h) - y;
			return {
				...node,
				x,
				y,
				w,
				h
			};
		});
	});

	interface CellStyle {
		background: string;
		borderColor: string;
		boxShadow: string;
		textColor: string;
	}

	function getCellStyles(pctVal: number, isSelected: boolean): CellStyle {
		let bg = '';
		let border = '';
		let shadow = '';
		let text = 'text-white';

		// TradingView Heatmap Colors (Solid flat colors matching the TV scale exactly)
		if (pctVal > 0) {
			if (pctVal >= 3.0) {
				bg = '#0a5c36'; // Strongly Positive (Dark Forest Green)
			} else if (pctVal >= 1.0) {
				bg = '#089981'; // Moderately Positive (TradingView Emerald Green)
			} else if (pctVal >= 0.25) {
				bg = '#2ca880'; // Slightly Positive (Medium Green)
			} else {
				bg = '#4ca885'; // Very Slightly Positive (Soft Green)
			}
		} else if (pctVal < 0) {
			if (pctVal <= -3.0) {
				bg = '#781212'; // Strongly Negative (Dark Maroon Red)
			} else if (pctVal <= -1.5) {
				bg = '#f23645'; // Moderately Negative (TradingView Crimson Red)
			} else if (pctVal <= -0.5) {
				bg = '#e03c4c'; // Slightly Negative (Medium Red)
			} else {
				bg = '#b05c68'; // Very Slightly Negative (Soft Pinkish Red)
			}
		} else {
			bg = '#787b86'; // Flat/Neutral (TradingView Slate Grey)
			text = 'text-white/80';
		}

		if (isSelected) {
			border = '#3b82f6';
			shadow = '0 0 15px rgba(59, 130, 246, 0.5)';
		}

		return { background: bg, borderColor: border, boxShadow: shadow, textColor: text };
	}
</script>

<div class="flex flex-col bg-surface border border-border rounded-xl shadow-lg overflow-hidden h-full">
	<!-- Control Bar: Search, Filters, and Sorting -->
	<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border bg-surface/50 backdrop-blur-md px-5 py-3.5 shrink-0 z-20">
		<div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
			{#each categories as cat}
				<button
					onclick={() => activeCategory = cat.id}
					class="px-4 py-2 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer
					{activeCategory === cat.id
						? 'bg-accent text-white border-accent shadow-md shadow-accent/20 scale-[1.02]'
						: 'bg-surface-2/60 border-border/60 text-text-dim hover:text-text hover:border-text-dim/40 hover:scale-[1.01]'}"
				>
					{cat.name}
				</button>
			{/each}
		</div>

		<div class="flex items-center gap-3 justify-between sm:justify-end">
			<!-- Search -->
			<div class="relative flex-1 sm:flex-none sm:w-52 group">
				<Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-dim group-focus-within:text-accent transition-colors" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search symbol..."
					class="w-full rounded-lg border border-border/80 bg-surface-2/50 pl-9 pr-3.5 py-1.8 text-xs font-semibold text-text placeholder-text-dim focus:outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15 transition-all"
				/>
			</div>

			<!-- Sort Info -->
			<div class="text-[11px] font-bold text-text-dim bg-surface-2/70 border border-border/70 px-3.5 py-1.8 rounded-lg select-none">
				Size: Market Weight
			</div>
		</div>
	</div>

	<!-- Heatmap Container -->
	<div class="p-4 bg-gradient-to-b from-surface/20 to-surface-2/5 flex-1 min-h-[550px] relative">
		{#if allPrices.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center absolute inset-0">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
				<p class="text-xs text-text-muted mt-3 font-semibold">Connecting to market websocket...</p>
			</div>
		{:else if processedPrices.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center text-text-dim absolute inset-0">
				<p class="text-sm font-semibold">No assets found</p>
				<p class="text-xs mt-1">Try modifying your filter or search query</p>
			</div>
		{:else}
			<div 
				bind:clientWidth={containerWidth} 
				bind:clientHeight={containerHeight} 
				class="w-full h-full min-h-[500px] absolute inset-0 select-none overflow-hidden bg-white dark:bg-[#131722] border-t border-l border-white dark:border-[#1e222d]"
			>
				{#each computedTreeMap as node (node.id)}
					{@const flash = flashMap.get(node.id)}
					{@const cellStyle = getCellStyles(node.data.pct.value, false)}
					<button
						onclick={() => onselect(node.id)}
						class="absolute heatmap-cell transition-all duration-300 hover:z-30 cursor-pointer overflow-hidden p-2 flex flex-col justify-center items-center text-center border-r border-b border-white dark:border-[#1e222d]
						{flash === 'up' ? 'cell-flash-green' : flash === 'down' ? 'cell-flash-red' : ''}"
						style="left: {node.x}px; top: {node.y}px; width: {node.w}px; height: {node.h}px; background: {cellStyle.background}; box-shadow: {cellStyle.boxShadow};"
					>
						{#if node.w >= 110 && node.h >= 75}
							<!-- Large Cell -->
							{#if node.h < 90 && node.w >= 120}
								<!-- Horizontal Large Cell -->
								<div class="flex flex-row items-center justify-center gap-2.5 w-full h-full p-2 select-none">
									{#if node.data.details.logo.type === 'img'}
										<div class="h-9 w-9 shrink-0 rounded-full bg-white p-0.5 border border-black/10 flex items-center justify-center shadow-sm">
											<img src={node.data.details.logo.url} alt={node.data.details.displaySymbol} class="h-full w-full rounded-full object-contain" />
										</div>
									{:else}
										<div class="h-9 w-9 shrink-0 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm">
											<span class="text-[10px] font-black text-black/60">{node.data.details.displaySymbol.substring(0, 4)}</span>
										</div>
									{/if}
									<div class="flex flex-col items-start justify-center">
										<div class="font-extrabold text-sm tracking-wide text-white uppercase leading-tight">{node.data.details.displaySymbol}</div>
										<div class="text-[11px] font-semibold text-white/90 leading-tight">
											{node.data.pct.string}
										</div>
									</div>
								</div>
							{:else}
								<!-- Vertical Large Cell -->
								<div class="flex flex-col items-center justify-center gap-1.5 w-full h-full select-none">
									{#if node.data.details.logo.type === 'img'}
										<div class="h-10 w-10 rounded-full bg-white p-0.5 border border-black/10 flex items-center justify-center shadow-sm">
											<img src={node.data.details.logo.url} alt={node.data.details.displaySymbol} class="h-full w-full rounded-full object-contain" />
										</div>
									{:else}
										<div class="h-10 w-10 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm">
											<span class="text-[10px] font-black text-black/60">{node.data.details.displaySymbol.substring(0, 4)}</span>
										</div>
									{/if}
									<div class="font-extrabold text-sm tracking-wide text-white mt-1.5 uppercase leading-none">{node.data.details.displaySymbol}</div>
									<div class="text-[11px] font-semibold mt-1 text-white/90 leading-none">
										{node.data.pct.string}
									</div>
								</div>
							{/if}
						{:else if node.w >= 70 && node.h >= 45}
							<!-- Medium Cell -->
							{#if node.h < 65}
								{#if node.w >= 85}
									<!-- Horizontal Medium Cell -->
									<div class="flex flex-row items-center justify-center gap-2 w-full h-full p-1.5 select-none">
										{#if node.data.details.logo.type === 'img'}
											<div class="h-7 w-7 shrink-0 rounded-full bg-white p-0.5 border border-black/10 flex items-center justify-center shadow-sm">
												<img src={node.data.details.logo.url} alt={node.data.details.displaySymbol} class="h-full w-full rounded-full object-contain" />
											</div>
										{/if}
										<div class="flex flex-col items-start justify-center">
											<div class="font-bold text-xs tracking-wide text-white uppercase leading-tight">{node.data.details.displaySymbol}</div>
											<div class="text-[9.5px] font-medium text-white/90 leading-tight">
												{node.data.pct.string}
											</div>
										</div>
									</div>
								{:else}
									<!-- Short & Narrow: Hide Logo to prevent overlap -->
									<div class="flex flex-col items-center justify-center gap-0.5 w-full h-full select-none">
										<div class="font-bold text-xs tracking-wide text-white uppercase leading-none">{node.data.details.displaySymbol}</div>
										<div class="text-[10px] font-medium mt-0.5 text-white/90 leading-none">
											{node.data.pct.string}
										</div>
									</div>
								{/if}
							{:else}
								<!-- Vertical Medium Cell -->
								<div class="flex flex-col items-center justify-center gap-1 w-full h-full select-none">
									{#if node.data.details.logo.type === 'img'}
										<div class="h-7 w-7 rounded-full bg-white p-0.5 border border-black/10 flex items-center justify-center shadow-sm">
											<img src={node.data.details.logo.url} alt={node.data.details.displaySymbol} class="h-full w-full rounded-full object-contain" />
										</div>
									{/if}
									<div class="font-bold text-xs tracking-wide text-white uppercase leading-none mt-0.5">{node.data.details.displaySymbol}</div>
									<div class="text-[10px] font-medium mt-0.5 text-white/90 leading-none">
										{node.data.pct.string}
									</div>
								</div>
							{/if}
						{:else if node.w >= 40 && node.h >= 25}
							<!-- Small Cell -->
							<div class="flex flex-col items-center justify-center gap-0.5 w-full h-full select-none">
								<div class="font-bold text-[11px] tracking-wide text-white uppercase leading-none">{node.data.details.displaySymbol}</div>
								<div class="text-[9px] font-medium text-white/85 leading-none">
									{node.data.pct.string}
								</div>
							</div>
						{:else}
							<!-- Very Small Cell -->
							<div class="flex items-center justify-center w-full h-full select-none">
								<div class="font-bold text-[9px] tracking-wide text-white uppercase leading-none">{node.data.details.displaySymbol}</div>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Hide scrollbars for overflow tabs */
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.heatmap-cell {
		border-radius: 0px;
		transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), filter 0.2s ease, box-shadow 0.2s ease;
		outline: none !important;
	}
	
	.heatmap-cell:hover {
		transform: scale(1.015);
		filter: brightness(1.15);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35) !important;
		z-index: 50 !important;
	}

	/* Flashing outlines and brightness scaling on WebSocket updates */
	@keyframes local-pulse-green {
		0% { outline: 3px solid #089981; outline-offset: -3px; filter: brightness(1.25); }
		100% { outline: 0px solid transparent; outline-offset: -3px; filter: brightness(1); }
	}
	@keyframes local-pulse-red {
		0% { outline: 3px solid #f23645; outline-offset: -3px; filter: brightness(1.25); }
		100% { outline: 0px solid transparent; outline-offset: -3px; filter: brightness(1); }
	}
	.cell-flash-green {
		animation: local-pulse-green 0.7s cubic-bezier(0.25, 1, 0.5, 1);
		z-index: 40 !important;
	}
	.cell-flash-red {
		animation: local-pulse-red 0.7s cubic-bezier(0.25, 1, 0.5, 1);
		z-index: 40 !important;
	}
</style>
