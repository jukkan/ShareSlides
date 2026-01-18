#!/usr/bin/env node
/**
 * prepare-assets.mjs
 * 
 * Processes public/decks/* to ensure each deck has:
 * - deck.pdf (converted from deck.pptx if missing)
 * - cover.webp (generated from deck.pdf page 1 if missing)
 * 
 * Requires: LibreOffice (soffice), pdftoppm (poppler-utils), cwebp (libwebp)
 * On Windows, these are expected to be available via WSL.
 */

import { readdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DECKS_DIR = join(PROJECT_ROOT, 'public', 'decks');

const isWindows = process.platform === 'win32';

// Track results
const results = {
  pdfConverted: [],
  pdfFailed: [],
  coverGenerated: [],
  coverFailed: [],
  skipped: [],
};

/**
 * Check if a command exists
 */
function commandExists(cmd) {
  try {
    if (isWindows) {
      // Check if command exists in WSL
      execSync(`wsl which ${cmd}`, { stdio: 'pipe' });
    } else {
      execSync(`which ${cmd}`, { stdio: 'pipe' });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command, optionally via WSL on Windows
 */
function runCommand(cmd, args = [], options = {}) {
  const { cwd } = options;
  
  if (isWindows) {
    // Convert Windows path to WSL path
    const wslCwd = cwd ? toWslPath(cwd) : undefined;
    const fullCmd = wslCwd 
      ? `cd "${wslCwd}" && ${cmd} ${args.join(' ')}`
      : `${cmd} ${args.join(' ')}`;
    
    const result = spawnSync('wsl', ['bash', '-c', fullCmd], {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    
    return {
      success: result.status === 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } else {
    const result = spawnSync(cmd, args, {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd,
    });
    
    return {
      success: result.status === 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
}

/**
 * Convert Windows path to WSL path
 */
function toWslPath(windowsPath) {
  // E:\Dev\jukkan -> /mnt/e/Dev/jukkan
  const normalized = windowsPath.replace(/\\/g, '/');
  const match = normalized.match(/^([A-Za-z]):(.*)/);
  if (match) {
    return `/mnt/${match[1].toLowerCase()}${match[2]}`;
  }
  return normalized;
}

/**
 * Convert PPTX to PDF using LibreOffice
 */
function convertPptxToPdf(deckDir, slug) {
  const pptxPath = join(deckDir, 'deck.pptx');
  const pdfPath = join(deckDir, 'deck.pdf');
  
  console.log(`  📄 Converting deck.pptx to deck.pdf...`);
  
  if (isWindows) {
    const wslPptxPath = toWslPath(pptxPath);
    const wslDeckDir = toWslPath(deckDir);
    
    // LibreOffice outputs to current directory with original filename
    const result = runCommand('soffice', [
      '--headless',
      '--convert-to', 'pdf',
      '--outdir', `"${wslDeckDir}"`,
      `"${wslPptxPath}"`
    ]);
    
    if (result.success && existsSync(pdfPath)) {
      return true;
    }
    
    // Sometimes LibreOffice names output differently, check for any new PDF
    const files = execSync(`wsl ls "${wslDeckDir}"/*.pdf 2>/dev/null || true`, { encoding: 'utf-8' });
    if (files.includes('.pdf')) {
      return true;
    }
    
    console.error(`    ❌ LibreOffice conversion failed: ${result.stderr}`);
    return false;
  } else {
    const result = runCommand('soffice', [
      '--headless',
      '--convert-to', 'pdf',
      '--outdir', deckDir,
      pptxPath
    ]);
    
    if (result.success && existsSync(pdfPath)) {
      return true;
    }
    
    console.error(`    ❌ LibreOffice conversion failed: ${result.stderr}`);
    return false;
  }
}

/**
 * Generate cover.webp from deck.pdf page 1
 */
async function generateCover(deckDir, slug) {
  const pdfPath = join(deckDir, 'deck.pdf');
  const coverPath = join(deckDir, 'cover.webp');
  
  console.log(`  🖼️  Generating cover.webp from deck.pdf...`);
  
  // Step 1: Run pdftoppm with cwd set to deck directory
  // Output prefix is just "cover" (no path) to avoid path issues
  if (isWindows) {
    const wslDeckDir = toWslPath(deckDir);
    
    // Generate PNG from first page, running inside the deck directory
    const ppmResult = runCommand('pdftoppm', [
      '-png',
      '-f', '1',
      '-l', '1',
      '-singlefile',
      'deck.pdf',
      'cover'
    ], { cwd: deckDir });
    
    if (!ppmResult.success) {
      // Try without -singlefile (generates cover-1.png instead of cover.png)
      const ppmResult2 = runCommand('pdftoppm', [
        '-png',
        '-f', '1',
        '-l', '1',
        'deck.pdf',
        'cover'
      ], { cwd: deckDir });
      
      if (!ppmResult2.success) {
        console.error(`    ❌ pdftoppm failed: ${ppmResult2.stderr}`);
        return false;
      }
    }
  } else {
    const ppmResult = runCommand('pdftoppm', [
      '-png',
      '-f', '1',
      '-l', '1',
      '-singlefile',
      'deck.pdf',
      'cover'
    ], { cwd: deckDir });
    
    if (!ppmResult.success) {
      const ppmResult2 = runCommand('pdftoppm', [
        '-png',
        '-f', '1',
        '-l', '1',
        'deck.pdf',
        'cover'
      ], { cwd: deckDir });
      
      if (!ppmResult2.success) {
        console.error(`    ❌ pdftoppm failed: ${ppmResult2.stderr}`);
        return false;
      }
    }
  }
  
  // Step 2: Find the generated PNG file (could be cover.png, cover-1.png, cover-01.png, etc.)
  let pngFile = null;
  try {
    const files = await readdir(deckDir);
    const pngFiles = files.filter(f => f.match(/^cover(-\d+)?\.png$/i));
    
    if (pngFiles.length === 0) {
      console.error(`    ❌ No cover-*.png file found after pdftoppm`);
      return false;
    }
    
    // Use the first match
    pngFile = pngFiles[0];
    console.log(`    Found: ${pngFile}`);
  } catch (err) {
    console.error(`    ❌ Error reading directory: ${err.message}`);
    return false;
  }
  
  // Step 3: Convert PNG to WebP using cwebp
  const cwebpResult = runCommand('cwebp', [
    '-q', '80',
    pngFile,
    '-o', 'cover.webp'
  ], { cwd: deckDir });
  
  if (!cwebpResult.success) {
    console.error(`    ❌ cwebp failed: ${cwebpResult.stderr}`);
    // Cleanup PNG even on failure
    await cleanupPngFiles(deckDir);
    return false;
  }
  
  // Step 4: Cleanup stray cover-*.png files
  await cleanupPngFiles(deckDir);
  
  // Verify the webp was created
  if (existsSync(coverPath)) {
    return true;
  }
  
  console.error(`    ❌ cover.webp not found after conversion`);
  return false;
}

/**
 * Clean up stray cover-*.png files
 */
async function cleanupPngFiles(deckDir) {
  try {
    const files = await readdir(deckDir);
    const pngFiles = files.filter(f => f.match(/^cover(-\d+)?\.png$/i));
    
    for (const pngFile of pngFiles) {
      const pngPath = join(deckDir, pngFile);
      await unlink(pngPath);
      console.log(`    🗑️  Cleaned up: ${pngFile}`);
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}

/**
 * Process a single deck directory
 */
async function processDeck(deckDir, slug) {
  console.log(`\n📁 Processing: ${slug}`);
  
  const hasPdf = existsSync(join(deckDir, 'deck.pdf'));
  const hasPptx = existsSync(join(deckDir, 'deck.pptx'));
  const hasCover = existsSync(join(deckDir, 'cover.webp'));
  
  let pdfReady = hasPdf;
  
  // Convert PPTX to PDF if needed
  if (!hasPdf && hasPptx) {
    const success = convertPptxToPdf(deckDir, slug);
    if (success) {
      results.pdfConverted.push(slug);
      pdfReady = true;
    } else {
      results.pdfFailed.push(slug);
    }
  } else if (!hasPdf && !hasPptx) {
    console.log(`  ⚠️  No deck.pdf or deck.pptx found`);
  }
  
  // Generate cover if needed
  if (!hasCover && pdfReady) {
    const success = await generateCover(deckDir, slug);
    if (success) {
      results.coverGenerated.push(slug);
    } else {
      results.coverFailed.push(slug);
    }
  } else if (!hasCover && !pdfReady) {
    console.log(`  ⚠️  Cannot generate cover without deck.pdf`);
    results.skipped.push(slug);
  } else if (hasCover) {
    console.log(`  ✓ cover.webp already exists`);
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  if (results.pdfConverted.length > 0) {
    console.log(`\n✅ PDF Conversions (${results.pdfConverted.length}):`);
    results.pdfConverted.forEach(s => console.log(`   • ${s}`));
  }
  
  if (results.pdfFailed.length > 0) {
    console.log(`\n❌ PDF Conversion Failures (${results.pdfFailed.length}):`);
    results.pdfFailed.forEach(s => console.log(`   • ${s}`));
  }
  
  if (results.coverGenerated.length > 0) {
    console.log(`\n✅ Covers Generated (${results.coverGenerated.length}):`);
    results.coverGenerated.forEach(s => console.log(`   • ${s}`));
  }
  
  if (results.coverFailed.length > 0) {
    console.log(`\n❌ Cover Generation Failures (${results.coverFailed.length}):`);
    results.coverFailed.forEach(s => console.log(`   • ${s}`));
  }
  
  if (results.skipped.length > 0) {
    console.log(`\n⏭️  Skipped (no source files) (${results.skipped.length}):`);
    results.skipped.forEach(s => console.log(`   • ${s}`));
  }
  
  const totalSuccess = results.pdfConverted.length + results.coverGenerated.length;
  const totalFailed = results.pdfFailed.length + results.coverFailed.length;
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${totalSuccess} successful, ${totalFailed} failed, ${results.skipped.length} skipped`);
  console.log('='.repeat(60));
}

/**
 * Print instructions for missing tools
 */
function printInstructions(missingTools) {
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  MISSING TOOLS');
  console.log('='.repeat(60));
  console.log('\nThe following tools are required but not found:\n');
  
  missingTools.forEach(tool => {
    console.log(`  ❌ ${tool}`);
  });
  
  if (isWindows) {
    console.log('\n📋 Installation instructions for WSL (Ubuntu/Debian):');
    console.log('\n  Open WSL and run:');
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │ sudo apt update                                         │');
    console.log('  │ sudo apt install -y libreoffice poppler-utils webp      │');
    console.log('  └─────────────────────────────────────────────────────────┘');
  } else {
    console.log('\n📋 Installation instructions:');
    console.log('\n  Ubuntu/Debian:');
    console.log('    sudo apt install -y libreoffice poppler-utils webp');
    console.log('\n  macOS (Homebrew):');
    console.log('    brew install libreoffice poppler webp');
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 ShareSlides Asset Preparation Script');
  console.log('='.repeat(60));
  
  // Check for required tools
  const requiredTools = ['soffice', 'pdftoppm', 'cwebp'];
  const missingTools = requiredTools.filter(tool => !commandExists(tool));
  
  if (missingTools.length > 0) {
    printInstructions(missingTools);
    process.exit(1);
  }
  
  console.log('✓ All required tools found');
  
  // Check if decks directory exists
  if (!existsSync(DECKS_DIR)) {
    console.error(`\n❌ Decks directory not found: ${DECKS_DIR}`);
    process.exit(1);
  }
  
  // Get all deck directories
  const entries = await readdir(DECKS_DIR, { withFileTypes: true });
  const deckDirs = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
  
  console.log(`\nFound ${deckDirs.length} deck directories`);
  
  // Process each deck
  for (const slug of deckDirs) {
    const deckDir = join(DECKS_DIR, slug);
    await processDeck(deckDir, slug);
  }
  
  // Print summary
  printSummary();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
