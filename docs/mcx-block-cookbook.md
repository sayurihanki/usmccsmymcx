# MCX Block Cookbook

## Purpose

This cookbook lists the reusable MCX storefront blocks, their authoring shape, and the example file that can be copied into DA.live.

## Block Inventory

| Block | Columns | Required content | Optional content | Example |
| --- | --- | --- | --- | --- |
| `mcx-announcement-bar` | 1 or 2 | announcement rows | `dismissible` config row | `docs/mcx-examples/mcx-announcement-bar.table.txt` |
| `mcx-hero` | 2 | eyebrow, heading lines, description, image, CTAs | status badges, KPI rows | `docs/mcx-examples/mcx-hero.table.txt` |
| `mcx-ticker` | 1 | ticker items | `A|B` emphasis split per row | `docs/mcx-examples/mcx-ticker.table.txt` |
| `mcx-benefits` | 3 | icon key, title, subtitle | none | `docs/mcx-examples/mcx-benefits.table.txt` |
| `mcx-category-grid` | 4 | icon, name, count, link | leading `label` and `title` config rows | `docs/mcx-examples/mcx-category-grid.table.txt` |
| `mcx-product-cards` | 4 | image, brand/name cell, pricing cell, config cell | section label, title, view-link, tabs, default-tab | `docs/mcx-examples/mcx-product-cards.table.txt` |
| `mcx-deal-countdown` | 2 | label, title, description, end-datetime, CTA | ended state text, hide CTA toggle | `docs/mcx-examples/mcx-deal-countdown.table.txt` |
| `mcx-promo-strip` | 2 | badge, title, description, CTA | none | `docs/mcx-examples/mcx-promo-strip.table.txt` |
| `mcx-featured-collections` | 4 | image, tag, title, CTA | label, title, view-link config rows | `docs/mcx-examples/mcx-featured-collections.table.txt` |
| `mcx-brands` | 1 | brand rows | none | `docs/mcx-examples/mcx-brands.table.txt` |
| `mcx-editorial-cards` | 4 | image, index, tag, title/description | none | `docs/mcx-examples/mcx-editorial-cards.table.txt` |
| `mcx-newsletter` | 2 | label, title, description, placeholder, button-text | note | `docs/mcx-examples/mcx-newsletter.table.txt` |

## Shell Fragments

| Fragment | Shape | Example |
| --- | --- | --- |
| `mcx-header` via `/fragments/mcx-nav` | 4 columns: `type`, `parent`, `label`, `value` | `docs/mcx-examples/mcx-nav.fragment.table.txt` |
| `mcx-footer` via `/fragments/mcx-footer` | 4 columns: `type`, `group`, `label`, `value` | `docs/mcx-examples/mcx-footer.fragment.table.txt` |

## Content Rules

- Keep rows to the declared shape. Do not add a fifth column.
- For `mcx-product-cards`, the fourth column is newline-delimited config: `category`, `flags`, `emoji`, `sizes`.
- For `mcx-product-cards`, the third column is newline-delimited pricing/rating config: `rating`, `reviews`, `price`, `original`, `chip`.
- For `mcx-hero`, `primary-cta` and `secondary-cta` should be authored as links in the value cell.
- For `mcx-category-grid`, `mcx-product-cards`, and `mcx-featured-collections`, section framing is handled by section metadata, not extra wrapper blocks.
- For `mcx-header` and `mcx-footer`, edit the fragments instead of the page body.
