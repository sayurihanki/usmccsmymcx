# MCX Wheel Popup

## Overview

The `mcx-wheel-popup` block renders an MCX-only spin-to-win modal for short-term campaigns that need a more game-like reveal without leaving the tactical storefront design language. It keeps the same 2-column DA.live authoring pattern used across the MCX block library, but swaps the standard promo modal layout for a fixed 8-slice wheel, equal-odds selection, and a post-spin reward reveal panel.

The block mounts a body-level overlay, hides its authored source table after decoration, traps focus while open, and stores a session-scoped seen marker keyed by `campaign-id`. On MCX block-library preview routes, session suppression is bypassed and the popup opens immediately so authors always get a visible preview.

## Live Example

The table below is a real block instance so the block library page can render the actual spin-to-win experience.

| mcx-wheel-popup | |
| --- | --- |
| campaign-id | spring-spin-2026 |
| eyebrow | Spring Tactical Drop |
| heading-line-1 | Spin For |
| heading-line-2 | Your Reward |
| description | Take one tactical spin to reveal your authored MCX reward. Every slice is a winning offer, with <strong>equal odds</strong> across all eight positions on the wheel. |
| result-headline | Reward Transmission |
| slice-1-label | 15% Off |
| slice-1-title | Save 15% On Field Gear |
| slice-1-description | Apply <strong>FIELD15</strong> on select packs, hydration systems, and range-day essentials. |
| slice-1-code | FIELD15 |
| slice-1-cta | [Shop Field Gear](/gear) |
| slice-2-label | Free Ship |
| slice-2-title | Unlock Free Shipping |
| slice-2-description | Score free standard shipping on your next online order with no minimum basket required. |
| slice-2-code | SHIPMCX |
| slice-2-cta | [Start Shopping](/products) |
| slice-3-label | Dress Blues |
| slice-3-title | Extra Savings On Uniform Essentials |
| slice-3-description | Refresh inspection-ready staples with an extra markdown on dress blues and finishing accessories. |
| slice-3-cta | [Browse Uniforms](/uniforms) |
| slice-4-label | PX Bonus |
| slice-4-title | $10 Bonus On Orders Over $75 |
| slice-4-description | Reach the spend threshold and use the reward code below before checkout closes. |
| slice-4-code | BONUS10 |
| slice-5-label | Nike Drop |
| slice-5-title | Early Access To New Arrivals |
| slice-5-description | Your reward is front-of-line access to the latest Nike and Under Armour arrivals before the wider push. |
| slice-5-cta | [View New Arrivals](/new-arrivals) |
| slice-6-label | Home Setup |
| slice-6-title | Save On First-Duty-Station Setup |
| slice-6-description | Use this reward on select home electronics, kitchen must-haves, and barracks-ready storage. |
| slice-6-code | SETTLE20 |
| slice-6-cta | [Shop Home](/home) |
| slice-7-label | Tax-Free |
| slice-7-title | Extra Tax-Free Advantage |
| slice-7-description | Your wheel result is a reminder reward only: stack MCX tax-free pricing with current shelf markdowns while they last. |
| slice-8-label | Boots |
| slice-8-title | Boot Locker Flash Offer |
| slice-8-description | Redeem a limited-time boot offer on select tactical and duty-ready styles. |
| slice-8-code | BOOTUP |
| slice-8-cta | [Shop Boots](/boots) |
| fine-print | * Rewards are static authored offers for campaign storytelling. Availability, category exclusions, and final checkout eligibility still depend on the live storefront configuration. |
| trigger | time |
| trigger-delay | 3 |
| trigger-scroll | 50 |

## Authoring Shape

Use a 2-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Field name |
| Column 2 | Field value |

Required global fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `campaign-id` | Yes | Stable session-suppression key for the authored campaign |
| `eyebrow` | Yes | Small overline in the visual band |
| `heading-line-1` | Yes | First display headline line |
| `heading-line-2` | Yes | Second display headline line rendered in the gold accent |
| `description` | Yes | Intro copy before the spin |
| `result-headline` | Yes | Small result-state label above the selected reward |
| `fine-print` | Yes | Terms and small-print copy below the wheel experience |

Required slice fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `slice-1-label` to `slice-8-label` | Yes | Short wheel labels shown on the wheel face |
| `slice-1-title` to `slice-8-title` | Yes | Main reward title revealed after the spin |
| `slice-1-description` to `slice-8-description` | Yes | Rich reward description revealed after the spin |

Optional fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `slice-n-code` | No | Optional coupon or reward code shown with copy UI |
| `slice-n-cta` | No | Optional CTA link for the selected reward |
| `trigger` | No | Show mode: `time`, `scroll`, `exit`, `immediate`, or `first-interaction`; defaults to `time` |
| `trigger-delay` | No | Delay in seconds for `time` trigger; defaults to `3` |
| `trigger-scroll` | No | Scroll percentage for `scroll` trigger; defaults to `50` |
| `spin-button-text` | No | Primary spin CTA label; defaults to `Spin the Wheel` |
| `no-thanks-text` | No | Dismiss CTA label before the spin; defaults to `No thanks` |
| `copy-button-text` | No | Copy button label when a slice includes a code; defaults to `Copy Code` |

## Rendering And Behavior

- The block is fixed to an 8-slice wheel and expects all 8 authored slice groups to be present.
- All slices are equally likely. Duplicate slice content is allowed, but it intentionally increases the effective odds of that repeated reward.
- `description`, `fine-print`, and each `slice-n-description` preserve inline formatting and links from authored rich text.
- Slice CTAs must be authored as real links when present. If a slice omits `slice-n-cta`, the result panel hides the CTA button for that outcome.
- If a slice omits `slice-n-code`, the result panel hides the copy-code row for that outcome.
- The modal locks page scroll while open, traps focus, closes on `Escape` and backdrop click, restores focus on close, and respects `prefers-reduced-motion`.
- The campaign is marked as seen on first display using `sessionStorage`, so it will not re-open again during the same browser session for that `campaign-id`.

## Common Gotchas

- Keep `campaign-id` stable for the full life of the campaign. If the ID changes often, the once-per-session suppression will feel inconsistent.
- Author all 8 slice groups. Missing required slice rows cause the block to hide rather than render a partial wheel.
- Use real links for `slice-n-cta` rows, not plain text.
- If you intentionally repeat a slice label, title, or code, do it because you want that exact reward to appear more often.
- This v1 block is modal-only. It does not add toast notifications, top banners, analytics hooks, or per-user code generation.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-wheel-popup`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx wheel popup |
| description | Tactical MCX spin-to-win modal with a fixed 8-slice wheel, equal-odds reward reveal, optional coupon copy, and optional CTA. |
| searchtags | mcx, wheel popup, spin to win, promo modal, campaign, coupon, overlay, tactical |
