import type { Deck, LegacyStats } from '../types/deck';

// Load deck JSON files
const deckModules = import.meta.glob<Deck>('../content/decks/*.json', { 
  eager: true,
  import: 'default'
});

// Load legacy stats
interface LegacyStatsFile {
  _meta?: { capturedAt?: string };
  [deckId: string]: LegacyStats | { capturedAt?: string } | undefined;
}

const legacyStatsModule = import.meta.glob<LegacyStatsFile>('../content/legacy-stats.json', {
  eager: true,
  import: 'default'
});

const legacyStatsData = Object.values(legacyStatsModule)[0] || {};
const legacyStatsMeta = legacyStatsData._meta as { capturedAt?: string } | undefined;

/**
 * Get deck ID from file path (filename stem)
 */
function getDeckIdFromPath(path: string): string {
  const match = path.match(/\/([^/]+)\.json$/);
  return match ? match[1] : '';
}

/**
 * Get all decks with legacy stats merged in, sorted by uploadedAt (newest first)
 */
export function getAllDecks(): Deck[] {
  const decks = Object.entries(deckModules).map(([path, deck]) => {
    // Determine deck ID: prefer slug from data, fallback to filename stem
    const deckId = deck.slug || getDeckIdFromPath(path);
    
    // Look up legacy stats by deck ID
    const stats = legacyStatsData[deckId] as LegacyStats | undefined;
    
    if (stats && typeof stats === 'object' && 'views' in stats) {
      return {
        ...deck,
        legacyStats: {
          ...stats,
          capturedAt: legacyStatsMeta?.capturedAt,
        },
      };
    }
    
    return deck;
  });

  // Sort by uploadedAt descending (newest first), decks without date go to the end
  return decks.sort((a, b) => {
    if (!a.uploadedAt && !b.uploadedAt) return 0;
    if (!a.uploadedAt) return 1;
    if (!b.uploadedAt) return -1;
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });
}

export function getDeckBySlug(slug: string): Deck | undefined {
  return getAllDecks().find((deck) => deck.slug === slug);
}

export function getDeckByShortId(shortId: number): Deck | undefined {
  return getAllDecks().find((deck) => deck.shortId === shortId);
}

export function getAllTags(): string[] {
  const tags = getAllDecks().flatMap((deck) => deck.tags);
  return [...new Set(tags)].sort();
}
