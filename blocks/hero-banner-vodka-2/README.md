# Hero Banner Vodka 2

Skew-reveal section header and product tile grid for DA.live / EDS. Title and subtitle lines animate in with skew and translate; tiles reveal with scale, skew, and clip-path as they enter the viewport. Staggered delays are configurable per tile.

## Authoring

Add a **Hero Banner Vodka 2** block (key-value table, two columns: key | value).

### Section

| Key | Value | Notes |
| --- | --- | --- |
| `title` | The Vodka | Main heading |
| `subtitle-1` | First subtitle line | Optional if `subtitle` is used |
| `subtitle-2` | Second line | Add `subtitle-3`, … for more lines |
| `subtitle` | Multi-line text | Alternative: newline-separated subtitles |
| `header-align` | `left` or `right` | Default: `left` |

### Tiles (repeat for `tile-1` … `tile-8`)

Each tile needs a `tile-N-type` row so the block knows how many tiles to render.

| Key | Value | Notes |
| --- | --- | --- |
| `tile-N-type` | `video` or `product` | Required to register tile N |
| `tile-N-width` | `wide` or `standard` | `wide` spans two columns on large screens |
| `tile-N-gradient` | `green`, `peach`, `pink`, `neutral`, `dark` | Default: `neutral` |
| `tile-N-delay` | `0`–`500` | Reveal delay in ms after intersection |
| `tile-N-header-type` | Eyebrow text | Product tiles only |
| `tile-N-header-name` | Product name | Product tiles only |
| `tile-N-silhouette` | `bottle` or `can` | Product tiles only |
| `tile-N-image` | Image URL | Optional background for video or product |

### Defaults

If no `tile-N-type` rows are authored, the block shows a two-tile demo (wide video + wide product) matching the reference “Vodka” section.

### Limits

- Up to **8** tiles per block.
- Use **one block per section** (e.g. “The Vodka” and “The Seltzers” as two separate blocks).

## Behavior

- **IntersectionObserver** triggers text and tile reveals; elements unobserve after animation.
- **`prefers-reduced-motion: reduce`**: skew/clip animations are disabled; content appears with minimal opacity transitions.
- **Images**: URLs are restricted to safe protocols and paths; backgrounds use `createOptimizedPicture` when applicable.

## Files

- `hero-banner-vodka-2.js` — decorate, DOM build, observers
- `hero-banner-vodka-2.css` — scoped styles and motion
- `_hero-banner-vodka-2.json` — DA plugin definition
