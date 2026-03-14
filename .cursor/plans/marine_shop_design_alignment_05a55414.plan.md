---
name: Marine Shop Design Alignment
overview: Align the existing Adobe Commerce (EDS) storefront with the Marine Shop reference design by introducing a Marine theme layer (palette, typography), restyling header/hero/footer and commerce UI (cart, search, product cards), and adding new blocks for top banner, category strip, marquee, and scroll animations.
todos: []
isProject: false
---

# Make the site more like the Marine Shop reference

The reference is a single-page “Marine Shop — Semper Fidelis” concept with a distinct military-heritage look: dark nav, marine green/gold/scarlet palette, Playfair Display + Oswald + Crimson Pro, custom cursor, full-viewport hero, category strip, marquee, product cards with hover actions, dark footer, and fullscreen search / sidebar cart. The current codebase is an **Adobe Commerce storefront** (AEM EDS + Commerce drop-ins) with neutral design tokens, a standard header (hamburger, brand, nav, search, cart, auth), simple hero, product list, and minimal footer.

The plan below keeps existing structure and behavior where possible and layers the Marine look via a **theme** plus targeted block and style changes.

---

## 1. Marine theme layer (design tokens + fonts)

- **New file:** e.g. `styles/marine-theme.css` (or `styles/themes/marine.css`) loaded after [styles/styles.css](styles/styles.css).
- **CSS variables** (mirror reference `:root`):  
`--marine-green`, `--marine-green-mid`, `--marine-green-light`, `--olive`, `--olive-light`, `--khaki`, `--khaki-light`, `--scarlet`, `--scarlet-deep`, `--scarlet-bright`, `--gold`, `--gold-light`, `--cream`, `--off-white`, `--dark`, `--dark-mid`, `--gray-warm`, `--gray-border`.
- **Override base tokens** where the theme is applied (e.g. `body` or a wrapper): set `--background-color`, link/button colors, and any `--color-brand-`* used by header/footer/buttons to Marine equivalents so existing components pick them up without rewriting every rule.
- **Fonts:** In [styles/fonts.css](styles/fonts.css) (or in the theme file), add Google Fonts: **Playfair Display** (700, 900, italic 700), **Oswald** (300–600), **Crimson Pro** (300, 400, 600, italic). Set `--type-base-font-family` (or equivalent) in the theme to Crimson Pro for body; use Playfair for display/headings and Oswald for labels/nav/buttons in Marine-specific rules.

This gives one place to toggle the Marine look and keeps existing tokens for non-themed or fallback UI.

---

## 2. Top promo banner

- **New block:** e.g. `blocks/top-banner/` (or a single “banner” block used once at the top).
- **Content:** One line of promo text (e.g. “Free Shipping on Orders Over $75 | Official MCA Store…”). Source: block text, fragment, or metadata.
- **Styling:** Full-width bar, `--marine-green` background, `--khaki-light`/`--gold-light` text, Oswald, small caps, letter-spacing. Reference: `.top-banner` in the HTML you provided.
- **Placement:** Renders above the header (e.g. first block in the page or before `<header>`). If the stack is header → main → footer, this may require a convention (e.g. “announcement” fragment or first section) so the banner appears above the existing header.

---

## 3. Header restyle (no DOM change if possible)

- **File:** [blocks/header/header.css](blocks/header/header.css) (and optionally marine-theme overrides).
- **Background:** Dark: `var(--dark)` or `--color-neutral-900` override; bottom border e.g. `3px solid var(--marine-green-light)`.
- **Logo / brand:**  
  - If the nav fragment can provide two lines (e.g. two spans or a line break), style as in reference: top line Oswald, small, `--olive-light`, letter-spacing; main line Playfair, large, white, heavy.  
  - If the brand is a single link/image, add theme overrides so the existing `.nav-brand` looks dark-compatible; optional: extend header.js or fragment to support a two-line logo from metadata/fragment content.
- **Nav links:** Uppercase, Oswald, letter-spacing, color `rgba(255,255,255,.6)`; hover white; **gold underline on hover/active** (pseudo-element `::after` width 0 → 100%); active state `--gold-light`.
- **Tools:**  
  - Search: icon only, stroke gold on hover.  
  - Cart: button with `--marine-green` background, white text, badge in `--gold` (existing cart count can keep current markup, restyle only).  
  - Auth: keep behavior; style to fit (e.g. ghost or same as nav).
- **Mobile:** Keep hamburger and drawer behavior; apply same Marine colors and typography so the drawer feels on-brand.

Avoid changing header.js behavior (panels, events, fragments); only CSS and minimal markup tweaks if needed for the two-line logo.

---

## 4. Hero restyle and optional structure

- **File:** [blocks/hero/hero.css](blocks/hero/hero.css); optionally extend hero block or add a “hero-marine” variant.
- **Layout:** Full-viewport height (e.g. `92vh`, `min-height: 600px`), content at bottom-left. Use existing hero wrapper; ensure image (if any) is still behind content.
- **Background:** If no image, or as overlay: dark gradient (`--dark` → `--dark-mid`), plus radial gradients for marine-green and subtle scarlet like reference `.hero-bg`. Optional grid overlay (subtle lines) and vertical “slash” accent.
- **Content:**  
  - **Eyebrow:** Small Oswald, uppercase, `--olive-light`, optional left line accent.  
  - **Title:** Playfair, large, white; allow one `<em>` for scarlet accent (reference: “Honor the *Corps.*”).  
  - **Subtitle:** Crimson Pro (or body font), italic, muted white.  
  - **CTAs:** Primary (e.g. scarlet) and ghost (outline) buttons; reuse or map to existing button classes.
- **Stats strip (optional):** Bottom-right strip with e.g. “248 Years Strong”, “5K+ Products”, “100% Authenticated”. Can be hard-coded in hero or driven by block config/fragment.  
- **Hero block content model:** [blocks/hero/_hero.json](blocks/hero/_hero.json) already has image, alt, text. Add fields if needed for eyebrow, subtitle, CTA labels, or stats; otherwise author them in the block content and style via classes.

---

## 5. Category strip (new block)

- **New block:** `blocks/category-strip/` (or `blocks/cat-strip/`).
- **Content:** Horizontal list of categories: each item = optional icon (emoji or icon name) + label. Source: block table, fragment, or metadata.
- **Layout:** Flex row, scroll horizontally, hide scrollbar; items have min-width, padding, border-right.
- **Style:** Background `--dark-mid`, bottom border; item text Oswald, small caps, muted white; hover/active `--gold-light`, active bottom border gold.
- **Behavior:** Links to anchors or category URLs; optional JS to set `.active` from scroll or URL.

---

## 6. Marquee / promo strip

- **New block:** `blocks/marquee/` (or `blocks/promo-strip/`).
- **Content:** Repeating list of short phrases (e.g. “248th Marine Corps Birthday Ball”, “Free Shipping Over $75”, …). Source: block lines or config.
- **Layout:** Single row, `display: flex`, `animation: marquee 28s linear infinite`, duplicate content for seamless loop (`transform: translateX(-50%)`).
- **Style:** Background `--marine-green`, text `--khaki-light`, Oswald, uppercase, separators in gold.

---

## 7. Section header pattern

- **Reusable classes** in theme or [styles/styles.css](styles/styles.css):  
`.section-label` (Oswald, small, uppercase, `--marine-green-light`),  
`.section-title` (Playfair, large, dark; `em` in scarlet),  
`.section-link` (Oswald, “View All →”, with border).  
- Use these on existing sections (e.g. product list page title, recommendations) and on any new “featured products” or “uniforms” sections so they match the reference.

---

## 8. Product cards (dropin overrides)

- **Scope:** Product list page and any product grids (e.g. recommendations, search results). Cards are likely from Commerce dropins (e.g. `dropin-product-item-card` in [styles/styles.css](styles/styles.css)).
- **Theme overrides:**  
  - Card: white background, aspect-ratio image area (e.g. 3/4), subtle border/grid gap.  
  - Image area: if no image, gradient placeholder per category (reuse reference `.pv-uniform`, `.pv-tshirt`, etc.).  
  - Badge: optional “New” / “Sale” / “Best Seller” from product data or config; position top-left, small Oswald tags.  
  - Hover: slight scale, shadow; **reveal bottom bar** with “Add to Cart” (marine green) and wishlist (icon).  
  - Below image: category (Oswald, small), name (Crimson Pro), price row, star rating (gold).
- Implement via **CSS overrides** in marine-theme or in [blocks/product-list-page/product-list-page.css](blocks/product-list-page/product-list-page.css) targeting dropin classes; avoid editing dropin source. If structure differs (e.g. no wrapper for “product-actions”), add minimal wrapper in block JS or use a decorator only where necessary.

---

## 9. Footer restyle

- **File:** [blocks/footer/footer.css](blocks/footer/footer.css) and theme.
- **Background:** `var(--dark)`; text/links muted white.  
- **Layout:** Multi-column (e.g. 2fr 1fr 1fr 1fr) for brand, Shop, Support, About/Contact.  
- **Brand:** Playfair logo line, Oswald tagline, short paragraph, badge pills (“MCA Official”, “USMC Certified”).  
- **Columns:** Oswald column titles, link list; links hover to `--gold-light`.  
- **Bottom:** Copyright and legal links in one row; gold accent on “The Marine Shop” (or site name).  
- Footer content (links, tagline) should stay fragment-driven; theme only adjusts layout and typography/colors.

---

## 10. Mini cart (sidebar look)

- **Scope:** Mini cart is likely rendered by Commerce mini-cart block/fragment; styling in [blocks/header/header.css](blocks/header/header.css) (e.g. `.cart-mini-cart`, `.minicart-panel`).
- **Overrides:**  
  - Panel: white background, border-left or shadow; header with small label “The Marine Shop” / “Your Cart”, Playfair title, close button.  
  - Empty state: icon, “Your cart is empty”, short subtitle.  
  - Items: image placeholder (or product image), name, category, price, remove.  
  - Footer: total line (Playfair for amount), primary “Proceed to Checkout” (marine green), optional “Free shipping on orders over $75”.
- Keep existing open/close and cart data behavior; only CSS (and optional small class names on fragment if you control it).

---

## 11. Search modal (fullscreen)

- **Scope:** Search is in header; panel currently inline/dropdown.  
- **Overrides:**  
  - When open: fullscreen overlay (dark, high z-index), centered search box.  
  - Label: “Search The Marine Shop”, Oswald, gold.  
  - Input: large Playfair, white text, no border except bottom; placeholder muted.  
  - Optional “hint” chips below (e.g. “Green Service Uniform”, “Mameluke Sword”) that fill the input on click.
- Prefer **CSS-only** changes to the existing search panel (position fixed, full width/height, center content); if the current panel is too constrained, a small JS change in header or search initializer to add a class or wrapper for “fullscreen” mode is acceptable.

---

## 12. Custom cursor (optional)

- **Where:** Global: body or a wrapper that has the Marine theme.
- **CSS:** `cursor: none` on `body` when theme is active (e.g. `body.marine-theme`).  
- **Elements:** Two fixed divs: dot (small circle, scarlet) and ring (circle outline, gold); `pointer-events: none`; smooth transition.  
- **JS:** Mousemove updates dot position; requestAnimationFrame lerp for ring; hover on links/buttons/cards scales dot and ring and changes ring color.  
- **Accessibility:** Enable only for `(pointer: fine)` and optionally when `prefers-reduced-motion: no-preference`; on touch devices or when reduced-motion, keep default cursor.

---

## 13. Scroll-triggered fade-up

- **CSS:** Class `.fade-up`: initial `opacity: 0; transform: translateY(28px)`; transition; class `.visible` sets `opacity: 1; transform: translateY(0)`. Optional stagger delay for children.  
- **JS:** Single IntersectionObserver (e.g. in theme script or [scripts/scripts.js](scripts/scripts.js)) that adds `.visible` when elements enter viewport (threshold ~0.1, rootMargin bottom).  
- **Usage:** Add `.fade-up` to section wrappers or product cards where you want the effect (hero, product grid, testimonials, etc.).

---

## 14. Additional sections (optional, content-dependent)

- **Banner CTA:** Full-width dark section with eyebrow, title (with italic), body copy, and EGA-style visual (e.g. circle + icon/emoji); two CTAs. Can be a generic “banner” or “cta” block.  
- **Uniforms / Birthday Ball:** Sidebar + product grid or card grid; reuse section-header and product-card styles; content from fragments or metadata.  
- **Testimonials:** 3-column card grid, cream background, quote mark, italic text, avatar + name/rank. New block or reuse cards block with Marine styling.  
- **Newsletter:** Marine green section, centered form (email + subscribe button), eyebrow + title + short copy; form posts to existing backend or placeholder.

These depend on whether you author such content in EDS (sheets, fragments, blocks). If you do, reusing the same section-header and card patterns keeps the look consistent.

---

## Implementation order (suggested)

1. **Theme + fonts** — Marine variables and font loading so later steps can use them.
2. **Header + footer** — Immediate visual impact; no new blocks.
3. **Hero** — Restyle and optionally extend content model.
4. **Top banner** — New block; place above header.
5. **Category strip + marquee** — New blocks; place below hero or in first section.
6. **Section header** — Classes and use on existing sections.
7. **Product card overrides** — Theme/dropin overrides for list and recommendation grids.
8. **Mini cart + search** — Panel/modal restyle.
9. **Scroll fade-up** — One observer + CSS class.
10. **Custom cursor** — Optional; enable only when theme is on.
11. **Optional sections** — Banner, testimonials, newsletter as needed.

---

## Files to add or touch (summary)


| Area           | Files                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme          | New `styles/marine-theme.css`; [styles/fonts.css](styles/fonts.css) (add Google Fonts); optionally [styles/styles.css](styles/styles.css) (load theme).             |
| Top banner     | New `blocks/top-banner/` (JS, CSS, optional config).                                                                                                                |
| Category strip | New `blocks/category-strip/` (JS, CSS, content model).                                                                                                              |
| Marquee        | New `blocks/marquee/` (JS, CSS).                                                                                                                                    |
| Header         | [blocks/header/header.css](blocks/header/header.css); optional [blocks/header/header.js](blocks/header/header.js) for two-line logo if fragment doesn’t support it. |
| Hero           | [blocks/hero/hero.css](blocks/hero/hero.css); optional [blocks/hero/_hero.json](blocks/hero/_hero.json) and hero DOM for eyebrow/subtitle/CTAs/stats.               |
| Footer         | [blocks/footer/footer.css](blocks/footer/footer.css).                                                                                                               |
| Product cards  | Marine theme overrides or [blocks/product-list-page/product-list-page.css](blocks/product-list-page/product-list-page.css); product-recommendations if used.        |
| Cart / Search  | [blocks/header/header.css](blocks/header/header.css) (mini-cart, search panel).                                                                                     |
| Animations     | Theme CSS (`.fade-up`); [scripts/scripts.js](scripts/scripts.js) or theme JS (IntersectionObserver).                                                                |
| Cursor         | Theme CSS + small script (e.g. in theme or scripts).                                                                                                                |


---

## Risks and notes

- **Dropin structure:** Product cards and mini-cart HTML come from Commerce dropins/fragments. If class names or DOM differ from the reference, overrides may need to target different selectors or add thin wrappers.  
- **Content ownership:** Two-line logo, promo copy, category labels, and CTA text should be editable (fragments, metadata, or block tables). The plan assumes you can add a top banner block and category/marquee content; exact source (Google Sheet, fragment, block table) is flexible.  
- **Accessibility:** Custom cursor and heavy animation should respect `prefers-reduced-motion` and not break keyboard or screen reader use.  
- **Mobile:** Reference media queries suggest hiding nav links (hamburger), stacking footer, single-column product grid, and hiding hero stats. Keep responsive behavior in header and new blocks.

This gets the current site to a Marine Shop–style look while preserving EDS block conventions and Commerce behavior; you can then refine copy, add or remove sections, and tune tokens per brand.