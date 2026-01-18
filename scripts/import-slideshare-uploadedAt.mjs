#!/usr/bin/env node

/**
 * Import uploadedAt dates from SlideShare CSV export into deck JSON files.
 * 
 * Usage: node scripts/import-slideshare-uploadedAt.mjs
 * 
 * Input: data/slideshare-export.csv
 * Updates: src/content/decks/*.json (adds uploadedAt field based on legacy.slideshareUrl)
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Paths
const CSV_PATH = join(ROOT, 'data', 'slideshare-export.csv');
const DECKS_DIR = join(ROOT, 'src', 'content', 'decks');

/**
 * Parse CSV without external dependencies.
 * Handles quoted fields with commas and escaped quotes.
 */
function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return [];

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        // End of row
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r') i++; // Skip \n in \r\n
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  // Handle last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Convert SlideShare date format (2010-10-12 13:16:21 UTC) to ISO format.
 */
function toISO(dateStr) {
  if (!dateStr) return null;
  
  // Format: "2010-10-12 13:16:21 UTC"
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*(?:UTC)?$/);
  if (!match) return null;
  
  const [, datePart, timePart] = match;
  return `${datePart}T${timePart}Z`;
}

/**
 * Build a map from document_url to uploadedAtISO.
 */
function buildUrlToDateMap(csvRows) {
  if (csvRows.length < 2) return new Map();

  const headers = csvRows[0].map(h => h.toLowerCase().trim());
  const urlIndex = headers.indexOf('document_url');
  const dateIndex = headers.indexOf('date_uploaded');

  if (urlIndex === -1 || dateIndex === -1) {
    console.error('CSV missing required columns: document_url and/or date_uploaded');
    console.error('Found headers:', headers);
    return new Map();
  }

  const map = new Map();
  for (let i = 1; i < csvRows.length; i++) {
    const row = csvRows[i];
    const url = row[urlIndex];
    const dateStr = row[dateIndex];
    
    if (url && dateStr) {
      const isoDate = toISO(dateStr);
      if (isoDate) {
        map.set(url, isoDate);
      }
    }
  }

  return map;
}

/**
 * Main function.
 */
function main() {
  // Read and parse CSV
  let csvContent;
  try {
    csvContent = readFileSync(CSV_PATH, 'utf-8');
  } catch (err) {
    console.error(`Failed to read CSV file: ${CSV_PATH}`);
    console.error(err.message);
    process.exit(1);
  }

  const csvRows = parseCSV(csvContent);
  const urlToDate = buildUrlToDateMap(csvRows);

  console.log(`Loaded ${urlToDate.size} URLs from CSV\n`);

  // Get all deck JSON files
  const deckFiles = readdirSync(DECKS_DIR).filter(f => f.endsWith('.json'));

  let updatedCount = 0;
  let missingUrlCount = 0;
  let missingCsvMatchCount = 0;

  for (const filename of deckFiles) {
    const filePath = join(DECKS_DIR, filename);
    let deck;
    
    try {
      deck = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.warn(`Failed to parse ${filename}: ${err.message}`);
      continue;
    }

    // Check both source.slideshareUrl and legacy.slideshareUrl
    const slideshareUrl = deck.source?.slideshareUrl || deck.legacy?.slideshareUrl;
    
    if (!slideshareUrl) {
      missingUrlCount++;
      continue;
    }

    const uploadedAtISO = urlToDate.get(slideshareUrl);
    
    if (!uploadedAtISO) {
      missingCsvMatchCount++;
      console.warn(`No CSV match for: ${slideshareUrl}`);
      continue;
    }

    // Update the deck with uploadedAt
    deck.uploadedAt = uploadedAtISO;
    
    // Write back to file, preserving formatting
    writeFileSync(filePath, JSON.stringify(deck, null, 2) + '\n', 'utf-8');
    updatedCount++;
  }

  // Print summary
  console.log('\n--- Summary ---');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Missing slideshareUrl: ${missingUrlCount}`);
  console.log(`Missing CSV match: ${missingCsvMatchCount}`);
}

main();
