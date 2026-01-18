#!/usr/bin/env node

/**
 * Import SlideShare export data and generate deck JSON files.
 * 
 * Usage: node scripts/import-slideshare.mjs [input-file]
 * 
 * Input: data/slideshare-export.json (or custom path)
 * Output: src/content/decks/<slug>.json for each slideshow
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Paths
const DEFAULT_INPUT = join(ROOT, 'data', 'slideshare-export.json');
const OUTPUT_DIR = join(ROOT, 'src', 'content', 'decks');

/**
 * Convert a title to a URL-safe slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')         // Trim leading/trailing hyphens
    .substring(0, 60);               // Limit length
}

/**
 * Generate a unique slug from title, optionally appending an ID
 */
function generateSlug(title, id, existingSlugs) {
  let baseSlug = slugify(title);
  
  // If slug is empty or too short, use ID
  if (!baseSlug || baseSlug.length < 3) {
    baseSlug = `deck-${id}`;
  }
  
  let slug = baseSlug;
  
  // If slug already exists, append the ID
  if (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${id}`;
  }
  
  return slug;
}

/**
 * Parse tags from SlideShare format (comma-separated string or array)
 */
function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim().toLowerCase()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

/**
 * Normalize language code
 */
function normalizeLanguage(lang) {
  if (!lang) return 'en';
  const code = String(lang).toLowerCase().substring(0, 2);
  return code || 'en';
}

/**
 * Extract ID from SlideShare URL or use index
 */
function extractId(item, index) {
  // Try to extract from URL (e.g., /username/title-123456)
  if (item.url) {
    const match = item.url.match(/-(\d+)$/);
    if (match) return match[1];
  }
  // Try id field
  if (item.id) return String(item.id);
  // Fallback to index
  return String(index + 1);
}

/**
 * Process a single slideshow item
 */
function processSlideshow(item, index, existingSlugs) {
  const id = extractId(item, index);
  const title = item.title || `Untitled Deck ${id}`;
  const slug = generateSlug(title, id, existingSlugs);
  
  existingSlugs.add(slug);
  
  const deck = {
    slug,
    title,
    tags: parseTags(item.tags),
    language: normalizeLanguage(item.language),
    assets: {
      pdf: `/decks/${slug}/deck.pdf`,
      cover: `/decks/${slug}/cover.webp`,
    },
  };
  
  // Add optional description
  if (item.description && item.description.trim()) {
    deck.description = item.description.trim();
  }
  
  // Add optional PPTX (check if download URL suggests PPTX)
  if (item.download_url && /\.pptx?$/i.test(item.download_url)) {
    deck.assets.pptx = `/decks/${slug}/deck.pptx`;
  }
  
  // Add source info
  deck.source = {};
  if (item.url) {
    deck.source.slideshareUrl = item.url;
  }
  if (item.download_url) {
    deck.source.downloadUrl = item.download_url;
  }
  
  // Remove empty source object
  if (Object.keys(deck.source).length === 0) {
    delete deck.source;
  }
  
  return deck;
}

/**
 * Main import function
 */
function importSlideShare(inputPath) {
  console.log(`Reading: ${inputPath}`);
  
  // Read input file
  let data;
  try {
    const raw = readFileSync(inputPath, 'utf-8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading input file: ${err.message}`);
    process.exit(1);
  }
  
  // Extract slideshows array
  const slideshows = data.slideshows_uploaded || data.slideshows || data;
  
  if (!Array.isArray(slideshows)) {
    console.error('Error: Expected slideshows_uploaded array in input file');
    process.exit(1);
  }
  
  console.log(`Found ${slideshows.length} slideshows`);
  
  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Track existing slugs to avoid duplicates
  const existingSlugs = new Set();
  
  // Process each slideshow
  let created = 0;
  let skipped = 0;
  
  for (let i = 0; i < slideshows.length; i++) {
    const item = slideshows[i];
    const deck = processSlideshow(item, i, existingSlugs);
    
    const outputPath = join(OUTPUT_DIR, `${deck.slug}.json`);
    
    // Check if file already exists
    if (existsSync(outputPath)) {
      console.log(`  Skip: ${deck.slug} (already exists)`);
      skipped++;
      continue;
    }
    
    // Write deck JSON
    writeFileSync(outputPath, JSON.stringify(deck, null, 2) + '\n');
    console.log(`  Created: ${deck.slug}`);
    created++;
  }
  
  console.log(`\nDone! Created ${created} decks, skipped ${skipped}`);
  console.log(`\nNext steps:`);
  console.log(`1. Add PDF files to public/decks/<slug>/deck.pdf`);
  console.log(`2. Add cover images to public/decks/<slug>/cover.webp`);
  console.log(`3. Optionally add PPTX files to public/decks/<slug>/deck.pptx`);
}

// Run
const inputPath = process.argv[2] || DEFAULT_INPUT;
importSlideShare(inputPath);
