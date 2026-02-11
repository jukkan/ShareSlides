# ShareSlides

A personal slide deck archive, migrated from SlideShare. Browse, view, and download presentation decks with minimal friction.

**Live site:** [slides.jukkan.com](https://slides.jukkan.com)

## Features

- Browse slide decks with search and tag filtering
- View slides in an embedded PDF viewer
- Download PDF and original PowerPoint files
- **Embed slides on your own website** - Get iframe code with multiple size options
- Static site - fast and free to host

## Embedding Slides

ShareSlides makes it easy to embed any presentation on your own website, blog, or documentation.

### How to Embed

1. Navigate to any deck page (e.g., `/deck/my-presentation`)
2. Click the **"Embed"** button
3. Choose your preferred size:
   - **Responsive** - Adapts to container width (recommended)
   - **720p** - Fixed 1280×720 dimensions
   - **1080p** - Fixed 1920×1080 dimensions
4. Click **"Copy code"** to copy the iframe code
5. Paste the code into your HTML

### Embed Code Example

**Responsive embed** (recommended):
```html
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe src="https://slides.jukkan.com/embed/my-presentation" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
          allowfullscreen 
          title="Embedded presentation"></iframe>
</div>
```

**Fixed size embed**:
```html
<iframe src="https://slides.jukkan.com/embed/my-presentation" 
        width="1280" 
        height="720" 
        style="border: 0;" 
        allowfullscreen 
        title="Embedded presentation"></iframe>
```

### Embed Options

Add URL parameters to customize the embed:

- **Start at a specific page**: `?page=5`
- **Hide the footer**: `?hideFooter=true`

Example:
```html
<iframe src="https://slides.jukkan.com/embed/my-presentation?page=5&hideFooter=true" ...></iframe>
```

### WordPress, Astro, and Other Platforms

The embed code is standard HTML and works on:
- WordPress (use HTML block or Custom HTML widget)
- Astro (use `<div set:html={embedCode} />`)
- Static site generators (Markdown with HTML support)
- Any platform that accepts iframe embeds

The embedded viewer includes a backlink to ShareSlides (unless `hideFooter=true` is used).

## Tech Stack

- [Astro](https://astro.build) - Static site generator
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF viewer
- GitHub Pages - Hosting

## Development

```sh
npm install
npm run dev
```

## New Deck Intake

1. Open a GitHub issue with the **Add new deck** template (see [.github/ISSUE_TEMPLATE/new-deck.yml](.github/ISSUE_TEMPLATE/new-deck.yml)), fill in the slug/title/metadata, and attach the PPTX/PDF (zip is fine) so the files live alongside the request.
2. Download the issue attachments into `public/decks/<slug>/` and run `node scripts/prepare-assets.mjs --slug <slug>` to build `deck.pdf` plus `cover.webp` from the PPTX.
3. Create `src/content/decks/<slug>.json` (copy an existing file) and update title, description, tags, language, category, `uploadedAt`, and asset paths.
4. Run `npm run assign-ids` to refresh the numeric shortcuts, then `npm run dev` to preview `/deck/<slug>` and `/viewer?file=/decks/<slug>/deck.pdf`.
5. Commit the new assets + metadata, push to `main`, and close the issue once GitHub Pages confirms the deploy.

## License

Content © Jukka Niiranen. Site code available under MIT.
