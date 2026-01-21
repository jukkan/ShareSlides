export interface DeckAssets {
  pdf: string;
  cover: string;
  pptx?: string;
}

export interface DeckSource {
  slideshareUrl?: string;
  downloadUrl?: string;
}

export interface LegacyStats {
  likes: number;
  views: number;
  downloads: number;
  privacy?: string;
}

export interface LegacyStatsWithMeta extends LegacyStats {
  capturedAt?: string;
}

export type DeckCategory = 'Organic' | 'AI';

export interface Deck {
  slug: string;
  shortId?: number;
  title: string;
  description?: string;
  tags: string[];
  language: string;
  category?: DeckCategory;
  assets: DeckAssets;
  source?: DeckSource;
  legacyStats?: LegacyStatsWithMeta;
  uploadedAt?: string;
}
