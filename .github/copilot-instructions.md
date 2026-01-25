# ShareSlides - GitHub Copilot Instructions

This document provides context and guidelines for AI coding assistants working with the ShareSlides repository.

## Project Overview

ShareSlides is a static slide deck archive site built with **Astro**, hosting presentation decks migrated from SlideShare. The site is deployed to **GitHub Pages** at [slides.jukkan.com](https://slides.jukkan.com).

### Tech Stack
- **Astro 5.x** - Static site generator (ESM, TypeScript)
- **PDF.js** - Embedded PDF viewer for slides
- **GitHub Pages** - Static hosting with custom domain

### Key Features
- Browse slide decks with search and tag filtering
- Two deck categories: **Organic** (human-created) and **AI** (AI-assisted)
- View slides in embedded PDF viewer
- Download PDF and original PowerPoint files
- Legacy stats preservation from SlideShare

---

## Project Structure

```
ShareSlides/
├── astro.config.mjs       # Astro configuration
├── package.json           # Dependencies and npm scripts
├── tsconfig.json          # TypeScript configuration
├── data/                  # Source data files
│   ├── slideshare-export.csv
│   └── slideshare-export.json
├── public/                # Static assets (copied as-is)
│   ├── CNAME              # Custom domain config
│   ├── decks/             # Deck assets (PDF, PPTX, cover images)
│   │   └── <slug>/
│   │       ├── deck.pdf
│   │       ├── deck.pptx  # (optional)
│   │       └── cover.webp
│   └── pdfjs/             # PDF.js viewer files
├── scripts/               # Build and import scripts (Node.js ESM)
│   ├── import-slideshare.mjs
│   ├── import-slideshare-uploadedAt.mjs
│   ├── prepare-assets.mjs
│   ├── assign-short-ids.mjs
│   └── add-category-field.mjs
└── src/
    ├── components/        # Astro components
    │   ├── DeckCard.astro
    │   ├── SearchBox.astro
    │   └── TagFilter.astro
    ├── content/           # Content data
    │   ├── legacy-stats.json
    │   └── decks/         # Individual deck JSON files
    │       └── <slug>.json
    ├── layouts/
    │   └── BaseLayout.astro
    ├── lib/
    │   └── decks.ts       # Deck data loading and utilities
    ├── pages/
    │   ├── index.astro    # Homepage with deck grid
    │   ├── [id].astro     # Short ID redirect handler
    │   ├── viewer.astro   # PDF viewer wrapper
    │   ├── about.astro    # About page
    │   ├── 404.astro      # 404 page
    │   └── deck/
    │       └── [slug].astro  # Individual deck detail page
    └── types/
        └── deck.ts        # TypeScript type definitions
```

---

## Data Model

### Deck JSON Schema (`src/content/decks/*.json`)

```typescript
interface Deck {
  slug: string;              // URL-safe identifier (required)
  shortId?: number;          // Numeric short ID for /1, /2, etc. URLs
  title: string;             // Deck title (required)
  description?: string;      // Optional description
  tags: string[];            // Array of lowercase tags
  language: string;          // Two-letter code: "en", "fi", etc.
  category?: "Organic" | "AI"; // Defaults to "Organic" if omitted
  assets: {
    pdf: string;             // Path to PDF: "/decks/<slug>/deck.pdf"
    cover: string;           // Path to cover: "/decks/<slug>/cover.webp"
    pptx?: string;           // Optional PPTX: "/decks/<slug>/deck.pptx"
  };
  source?: {
    slideshareUrl?: string;  // Original SlideShare URL
    downloadUrl?: string;    // Original download URL
  };
  legacyStats?: {            // Merged at runtime from legacy-stats.json
    likes: number;
    views: number;
    downloads: number;
    capturedAt?: string;
  };
  uploadedAt?: string;       // ISO 8601 date string
}
```

### Category System
- **Organic**: Human-created presentations (default)
- **AI**: Presentations created with AI assistance (marked with `"category": "AI"`)

---

## Common Tasks

### Adding a New Deck

1. **Create the deck folder** in `public/decks/<slug>/`
2. **Add required assets**:
   - `deck.pdf` - The presentation PDF
   - `cover.webp` - Cover image (first slide, WebP format)
   - `deck.pptx` - Original PowerPoint (optional)
3. **Create deck JSON** in `src/content/decks/<slug>.json`:
   ```json
   {
     "slug": "my-new-deck",
     "title": "My New Presentation",
     "description": "Optional description",
     "tags": ["tag1", "tag2"],
     "language": "en",
     "category": "Organic",
     "assets": {
       "pdf": "/decks/my-new-deck/deck.pdf",
       "cover": "/decks/my-new-deck/cover.webp"
     },
     "uploadedAt": "2026-01-25T00:00:00Z"
   }
   ```
4. **Assign short ID** (optional): Run `npm run assign-ids`

### Generating Cover Images and Converting PPTX

Use `prepare-assets.mjs` to automatically:
- Convert `deck.pptx` → `deck.pdf` (via LibreOffice)
- Generate `cover.webp` from PDF page 1 (via pdftoppm + cwebp)

```bash
node scripts/prepare-assets.mjs
```

**Requirements** (available via WSL on Windows):
- LibreOffice (`soffice`)
- poppler-utils (`pdftoppm`)
- libwebp (`cwebp`)

### Importing from SlideShare Export

```bash
npm run import:slideshare
```

This reads `data/slideshare-export.json` and generates deck JSON files.

---

## Development Guidelines

### File Conventions
- **Deck slugs**: Lowercase, hyphenated, max 60 chars (e.g., `my-presentation-title`)
- **Tags**: Lowercase, single words or short phrases
- **Languages**: Two-letter ISO codes (`en`, `fi`, `de`, etc.)
- **Dates**: ISO 8601 format with timezone (`2026-01-25T00:00:00Z`)

### Code Patterns

**Loading decks** (in Astro pages):
```typescript
import { getAllDecks, getDeckBySlug, getDeckByShortId } from '../lib/decks';

const decks = getAllDecks();           // Sorted by uploadedAt (newest first)
const deck = getDeckBySlug('my-deck'); // Find by slug
const deck = getDeckByShortId(5);      // Find by numeric ID
```

**Static path generation**:
```typescript
export function getStaticPaths() {
  return getAllDecks().map((deck) => ({ 
    params: { slug: deck.slug } 
  }));
}
```

### Scripts (Node.js ESM)
- All scripts use ES modules (`import`/`export`)
- Run with `node scripts/<name>.mjs`
- Windows paths are converted to WSL paths when calling Linux tools

### Astro Components
- Use `.astro` extension for components and pages
- TypeScript is supported in frontmatter (`---` blocks)
- Props defined with `interface Props { ... }`

---

## Important Notes

### Static Site Generation
- All pages are pre-rendered at build time
- No server-side runtime - everything is static HTML/CSS/JS
- Query parameters handled client-side (e.g., tag filters, search)

### PDF Viewer Security
- Only allows paths starting with `/decks/` and ending with `.pdf`
- Path traversal (`..`) is blocked
- Implemented in `viewer.astro`

### Asset Paths
- All deck assets are relative to site root (`/decks/<slug>/...`)
- Cover images must be WebP format for optimal performance
- PDF files are served directly, PPTX files trigger download

### Legacy Stats
- Historical view/download/like counts from SlideShare
- Stored separately in `src/content/legacy-stats.json`
- Merged with deck data at runtime in `lib/decks.ts`
- Not editable per-deck (preserved as historical data)

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Astro dev server |
| `npm run build` | Build static site to `dist/` |
| `npm run preview` | Preview built site |
| `npm run import:slideshare` | Import decks from SlideShare export |
| `npm run assign-ids` | Assign/reassign short numeric IDs |

---

## Code Quality Checklist

When modifying this project:

- [ ] Deck JSON files have valid `slug` matching filename
- [ ] Asset paths in JSON match actual file locations
- [ ] Tags are lowercase
- [ ] Language codes are valid two-letter codes
- [ ] `uploadedAt` dates are ISO 8601 format
- [ ] Category is either `"Organic"` or `"AI"` (or omitted for Organic)
- [ ] TypeScript types are updated if data model changes
- [ ] Scripts work on both Windows (via WSL) and Linux/macOS
