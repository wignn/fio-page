export interface PriceData {
	symbol: string;
	price: number;
	bid: number | null;
	ask: number | null;
	volume: number | null;
	source: string;
	asset_type: string;
	received_at: string | null;
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

export interface WhyMoveResponse {
	symbol: string;
	window: string;
	lookback_minutes: number;
	move: {
		latest_price: number;
		baseline_price: number;
		move_pct: number;
		direction: 'up' | 'down' | 'none' | string;
		severity: 'medium' | 'high' | string | null;
		threshold_pct: number | null;
		tick_count: number;
		latest_at: string;
		is_active_spike: boolean;
	} | null;
	summary: string;
	confidence: 'low' | 'medium' | 'high' | string;
	matched_terms: string[];
	causes: {
		news: WhyMoveCause[];
		calendar: unknown[];
	};
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
