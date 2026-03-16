# Promo Strip

## Overview

`promo-strip` is a theme-agnostic promotional banner block for short campaign moments, guided-selling entry points, and inline conversion nudges.

It is intentionally simple:

- one badge,
- one headline,
- one short description,
- one CTA.

The default styling is neutral enough to work across page themes, while pages already using the MCX shell automatically pick up a more tactical scarlet-and-gold finish without changing the authoring contract.

## Live Example

| promo-strip | |
| --- | --- |
| badge | Guided Selling Experience |
| title | PERSONALIZE YOUR MCCS EXPERIENCE |
| description | Tell us about your military life, interests, and preferences. We will tailor shopping, events, and family programs around your world. |
| cta | [Start Personalizing](/personalize) |

## Authoring Shape

Use a 2-column table.

| Field | Required | Purpose |
| --- | --- | --- |
| `badge` | Yes | Small campaign label above the headline |
| `title` | Yes | Primary promotional headline |
| `description` | Yes | Supporting copy below the headline |
| `cta` | Yes | Primary CTA, authored as a real link |

## Rendering And Behavior

- The block renders inline in normal page flow and does not depend on homepage-specific order.
- The CTA is rendered as a single prominent link button with an arrow icon.
- Newlines in `title` or `description` are preserved.
- On MCX pages, the block keeps the same content model but swaps to a stronger MCX visual finish automatically.

## Common Gotchas

- This is not the same block as `mcx-promo-strip`. Use `promo-strip` when you want a reusable banner that works outside the MCX-only block family.
- Keep description copy concise. The layout is tuned for a short promotional message, not a long paragraph.
- Use a real anchor in the `cta` cell. If no link is authored, the CTA falls back to `#`.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/promo-strip`.

| library metadata | |
| --- | --- |
| name | promo strip |
| description | Theme-agnostic inline promo banner with badge, headline, description, and one CTA. |
| searchtags | promo, banner, strip, campaign, cta, guided selling, personalization |
