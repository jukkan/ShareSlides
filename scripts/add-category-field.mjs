#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DECKS_DIR = path.join(__dirname, '..', 'src', 'content', 'decks');

// Read all JSON files in the decks directory
const files = fs.readdirSync(DECKS_DIR).filter(file => file.endsWith('.json'));

console.log(`Found ${files.length} deck files to update`);

let updated = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(DECKS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const deck = JSON.parse(content);

  // Check if category already exists
  if (deck.category) {
    console.log(`⏭️  Skipping ${file} - category already set to "${deck.category}"`);
    skipped++;
    continue;
  }

  // Add category field (default to "Organic" for all existing decks)
  deck.category = 'Organic';

  // Write back with pretty formatting
  fs.writeFileSync(filePath, JSON.stringify(deck, null, 2) + '\n');
  console.log(`✅ Updated ${file} - added category: "Organic"`);
  updated++;
}

console.log(`\n✨ Done! Updated ${updated} files, skipped ${skipped} files`);
