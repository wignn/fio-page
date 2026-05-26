export interface PriceData {
	symbol: string;
	price: number;
	bid: number | null;
	ask: number | null;
	volume: number | null;
	source: string;
	asset_type: string;
	received_at: string | null;
	session?: {
		exchange: string;
		timezone: string;
		state: 'open' | 'closed' | 'break' | 'unknown' | string;
		is_open: boolean;
		reason: string;
	};
	direction: 'up' | 'down' | 'none';
	prev_price: number;
	updated_at: number; // timestamp ms
}

export interface NewsItem {
	id: string;
	title: string;
	original_title?: string;
	translated_title?: string;
	summary: string | null;
	source_name: string;
	original_url?: string;
	url?: string;
	sentiment: string | null;
	impact_level: string | null;
	published_at: string | null;
	processed_at: string | null;
	currency_pairs?: string | null;
	tickers?: string | null;
	category?: string;
}

export interface CalendarEvent {
	title: string;
	currency: string;
	date: string;
	impact: string;
	forecast: string;
	previous: string;
	actual: string;
}

export interface WhyMoveCause {
	kind: string;
	title: string;
	summary: string | null;
	source_name: string | null;
	url: string | null;
	published_at: string | null;
	processed_at: string | null;
	sentiment: string | null;
	impact_level: string | null;
	matched_terms: string[];
	score: number;
	reason: string;
}

export interface WhyMoveNarrative {
	headline: string;
	explanation: string;
	drivers: string[];
	confidence: string;
	caveats: string[];
}

export interface WhyMoveCrossAsset {
	symbol: string;
	asset_type: string;
	move_pct: number;
	direction: 'up' | 'down' | string;
	latest_price: number;
	tick_count: number;
	latest_at: string;
	relationship: string;
}

export interface WhyMoveDriver {
	name: string;
	score: number;
	evidence: string[];
}

export interface WhyMoveConfidence {
	label: 'low' | 'medium' | 'high' | string;
	score: number;
	breakdown: Record<string, number>;
}

export interface WhyMoveResponse {
	symbol: string;
	window: string;
	lookback_minutes?: number;
	move: {
		latest_price?: number | null;
		baseline_price?: number | null;
		move_pct?: number | null;
		direction: 'up' | 'down' | 'none' | string;
		severity?: 'medium' | 'high' | string | null;
		threshold_pct?: number | null;
		tick_count: number;
		latest_at?: string | null;
		is_active_spike?: boolean;
	} | null;
	headline?: string;
	explanation?: string;
	summary?: string;
	confidence: WhyMoveConfidence | 'low' | 'medium' | 'high' | string;
	matched_terms?: string[];
	drivers: WhyMoveDriver[] | string[];
	news_clusters?: Array<{ theme: string; score: number; sentiment: string; headlines: string[] }>;
	cross_assets: WhyMoveCrossAsset[];
	llm: {
		provider: string;
		model: string | null;
		status: 'generated' | 'disabled' | 'failed' | 'fallback' | string;
		narrative: WhyMoveNarrative | null;
	};
	engine?: { status: string; version: string };
	cache?: { status: string; evidence_hash?: string };
	causes: {
		news: WhyMoveCause[];
		calendar: unknown[];
	};
	evidence?: unknown;
	generated_at: string;
}

export interface Feature {
	icon: string;
	title: string;
	description: string;
	command: string;
}

export interface Command {
	name: string;
	description: string;
	permission?: string;
	category: string;
}
