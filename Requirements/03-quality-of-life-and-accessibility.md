# Quality of life, accessibility and compatibility requirements

## Accessibility baseline

- Target WCAG 2.2 AA: semantic landmarks, one logical H1 per page, descriptive link text, visible keyboard focus, adequate color contrast and no color-only statuses.
- A visible-on-focus skip link jumps past the fixed navigation to the main article.
- The navigation’s expand/open links and Back action have descriptive labels and remain keyboard-accessible; the current path and selected entry remain clear. Search results announce updated counts in an `aria-live` region.
- Support keyboard-only traversal of menus, filters, dialogs, image controls, video activation and downloadable files.
- The missing-route countdown is understandable without color, exposes the requested path as text, and always includes an immediate Home link in addition to the timed redirect.
- Informative images require author-supplied alt text. Decorative images use empty alt text. Do not put key instructions only in images or video.
- Captions and transcript are mandatory for author-hosted audio/video; YouTube captions must be reviewed or replaced with an accurate transcript.
- Honor browser zoom through 200% without horizontal page loss and use responsive reflow at 320 CSS px.
- Test with Windows Narrator, NVDA + Firefox, VoiceOver + Safari and keyboard-only Chromium before launch.

## Responsive and device requirements

- Support 320px mobile through 32:9 ultrawide desktop, in portrait and landscape.
- Mobile: sidebar is closed by default, search remains visible, filters stack, thumbnail rows remain understandable at 320px.
- Tablet: sidebar may be hidden by default depending on width; do not trap a 280px sidebar alongside unreadably narrow content.
- Desktop and ultrawide: persistent sidebar, constrained prose measure, and side-by-side New/Hot feeds.
- Respect `prefers-reduced-motion`, `prefers-contrast`, dark mode and operating-system font scaling.

## Translation

- Write the document in clean semantic HTML; Chrome and Google Translate will then be able to translate the page body.
- Set the accurate source `lang` attribute on every page; mark technical part numbers, code, names and data units with appropriate semantics so they are less likely to be mangled.
- Do not block browser translation with opaque canvas rendering or text embedded in images.
- Automatic browser translation is the complete translation strategy. Do not build, market or maintain a separate translation product.
- Keep headings, prose, captions, labels and tables as real DOM text so browser translation has the maximum possible material to translate. The translation result is provided by the visitor’s browser, not this site.

## Reader compatibility and progressive enhancement

- Article HTML and metadata must be useful with JavaScript disabled. Navigation should fall back to normal links.
- Use native controls before custom widgets. The global full-text enhancement can load after the page becomes readable.
- Avoid mandatory accounts, cookie walls, autoplay, interstitials, content gating and intrusive ads.
- Embed video only after user intent; use responsive images with explicit width/height and AVIF/WebP source sets.
- MVP short-form video uses one committed, low-resolution static MP4 derivative with native pause and scrub controls. Adaptive streaming is deferred; the browser must not request a higher-cost rendition.
- Target current stable Chrome, Edge, Firefox and Safari plus their last previous release. Check layout in iOS Safari and Android Chrome.

## Performance budgets

- Ship static HTML for public pages. No JavaScript framework runtime is required for the authored article path.
- Initial page should aim for less than 100 kB compressed HTML/CSS/critical JS excluding visible media, less than 200 kB of initial JS, and no third-party font dependency.
- Use responsive media and lazy-load below-the-fold images. A hero/onboard poster gets high fetch priority only when it is actually above the fold.
- Lighthouse is a regression tool, not an end in itself: keep LCP, INP and CLS healthy on a mid-range mobile device and real throttled network.
- Document any third-party script with purpose, owner, data sent, consent condition and byte cost.
