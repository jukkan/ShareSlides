/**
 * Assign short numeric IDs to decks based on uploadedAt date
 * Oldest deck = 01, newest = highest number
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const decksDir = './src/content/decks';

async function main() {
  // Read all deck JSON files
  const files = await readdir(decksDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  // Load all decks with their data
  const decks = await Promise.all(
    jsonFiles.map(async (filename) => {
      const filePath = join(decksDir, filename);
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return { filename, filePath, data };
    })
  );
  
  // Sort by uploadedAt ascending (oldest first)
  decks.sort((a, b) => {
    const dateA = a.data.uploadedAt ? new Date(a.data.uploadedAt).getTime() : Infinity;
    const dateB = b.data.uploadedAt ? new Date(b.data.uploadedAt).getTime() : Infinity;
    return dateA - dateB;
  });
  
  // Assign short IDs starting from 1
  console.log('Assigning short IDs (oldest to newest):\n');
  
  for (let i = 0; i < decks.length; i++) {
    const deck = decks[i];
    const shortId = i + 1;
    const paddedId = String(shortId).padStart(2, '0');
    
    deck.data.shortId = shortId;
    
    // Write back to file
    await writeFile(deck.filePath, JSON.stringify(deck.data, null, 2) + '\n');
    
    console.log(`${paddedId}: ${deck.data.title}`);
    console.log(`    ${deck.data.uploadedAt || 'No date'}`);
  }
  
  console.log(`\nAssigned IDs to ${decks.length} decks.`);
}

main().catch(console.error);
