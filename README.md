# ShareSlides

A personal slide deck archive, migrated from SlideShare. Browse, view, and download presentation decks with minimal friction.

**Live site:** [slides.jukkan.com](https://slides.jukkan.com)

## Features

- Browse slide decks with search and tag filtering
- View slides in an embedded PDF viewer
- Download PDF and original PowerPoint files
- Static site - fast and free to host

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
