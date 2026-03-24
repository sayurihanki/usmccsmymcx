import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  parseFieldRows,
  cellText,
} from '../../scripts/mcx-block-utils.js';

const MAX_TILES = 8;

const GRADIENTS = new Set(['green', 'peach', 'pink', 'neutral', 'dark']);

/**
 * Allow same-origin paths and http(s) image URLs for tile backgrounds.
 * @param {string} url
 * @returns {string}
 */
function sanitizeImageUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return '';
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (['http:', 'https:'].includes(parsed.protocol)) return trimmed;
    if (['/', './', '../', '?', '#'].some((t) => trimmed.startsWith(t))) return trimmed;
  } catch {
    return '';
  }
  return '';
}

function normalizeGradient(raw) {
  const g = (raw || '').toString().trim().toLowerCase();
  return GRADIENTS.has(g) ? g : 'neutral';
}

function normalizeTileType(raw) {
  const t = (raw || '').toString().trim().toLowerCase();
  return t === 'video' ? 'video' : 'product';
}

function normalizeWidth(raw) {
  const w = (raw || '').toString().trim().toLowerCase();
  return w === 'standard' ? 'standard' : 'wide';
}

function normalizeHeaderAlign(raw) {
  const a = (raw || '').toString().trim().toLowerCase();
  return a === 'right' ? 'right' : 'left';
}

function normalizeSilhouette(raw) {
  const s = (raw || '').toString().trim().toLowerCase();
  return s === 'can' ? 'can' : 'bottle';
}

/**
 * @param {Record<string, HTMLElement>} fields
 * @returns {number[]}
 */
function collectTileIndices(fields) {
  const indices = new Set();
  Object.keys(fields).forEach((key) => {
    const m = key.match(/^tile-(\d+)-type$/);
    if (m) indices.add(Number(m[1], 10));
  });
  return [...indices].sort((a, b) => a - b).slice(0, MAX_TILES);
}

/**
 * @param {Record<string, HTMLElement>} fields
 * @returns {string[]}
 */
function getSubtitleLines(fields) {
  const lines = [];
  let i = 1;
  while (fields[`subtitle-${i}`]) {
    const text = cellText(fields[`subtitle-${i}`]).trim();
    if (text) lines.push(text);
    i += 1;
  }
  if (lines.length === 0 && fields.subtitle) {
    cellText(fields.subtitle)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => lines.push(line));
  }
  return lines;
}

/**
 * @param {Record<string, HTMLElement>} fields
 * @param {number} index
 * @returns {object}
 */
function parseTileFromFields(fields, index) {
  const prefix = `tile-${index}`;
  const delayRaw = fields[`${prefix}-delay`] ? cellText(fields[`${prefix}-delay`]) : '0';
  const parsedDelay = Number.parseInt(delayRaw, 10);
  return {
    type: normalizeTileType(fields[`${prefix}-type`] ? cellText(fields[`${prefix}-type`]) : ''),
    width: normalizeWidth(fields[`${prefix}-width`] ? cellText(fields[`${prefix}-width`]) : 'wide'),
    gradient: normalizeGradient(fields[`${prefix}-gradient`] ? cellText(fields[`${prefix}-gradient`]) : ''),
    delay: Number.isNaN(parsedDelay) ? 0 : Math.min(500, Math.max(0, parsedDelay)),
    headerType: fields[`${prefix}-header-type`] ? cellText(fields[`${prefix}-header-type`]) : '',
    headerName: fields[`${prefix}-header-name`] ? cellText(fields[`${prefix}-header-name`]) : '',
    silhouette: normalizeSilhouette(
      fields[`${prefix}-silhouette`] ? cellText(fields[`${prefix}-silhouette`]) : 'bottle',
    ),
    imageUrl: fields[`${prefix}-image`] ? sanitizeImageUrl(cellText(fields[`${prefix}-image`])) : '',
  };
}

const DEFAULT_TILES = [
  {
    type: 'video',
    width: 'wide',
    gradient: 'dark',
    delay: 0,
    headerType: '',
    headerName: '',
    silhouette: 'bottle',
    imageUrl: '',
  },
  {
    type: 'product',
    width: 'wide',
    gradient: 'neutral',
    delay: 150,
    headerType: 'Aupale Vodka',
    headerName: 'Original',
    silhouette: 'bottle',
    imageUrl: '',
  },
];

/**
 * @param {string} url
 * @param {string} alt
 * @returns {HTMLElement | null}
 */
function buildTilePicture(url, alt) {
  if (!url) return null;
  try {
    return createOptimizedPicture(url, alt || '', false, [
      { media: '(min-width: 600px)', width: '1400' },
      { width: '700' },
    ]);
  } catch {
    return null;
  }
}

/**
 * @param {object} tile
 * @returns {HTMLElement}
 */
function buildTileEl(tile) {
  const isVideo = tile.type === 'video';
  const tileEl = document.createElement('div');
  tileEl.className = [
    'hbv-tile',
    'tile',
    tile.width === 'wide' ? 'tile-wide' : 'tile-standard',
    isVideo ? 'tile-video' : 'tile-product',
  ].join(' ');
  tileEl.dataset.tileDelay = String(tile.delay);

  const grad = document.createElement('div');
  grad.className = `gradient-bg grad-${tile.gradient}`;
  grad.setAttribute('aria-hidden', 'true');

  if (isVideo) {
    const tileBg = document.createElement('div');
    tileBg.className = 'tile-bg';
    if (tile.imageUrl) {
      const pic = buildTilePicture(tile.imageUrl, '');
      if (pic) {
        const img = pic.querySelector('img');
        if (img) {
          tileBg.append(pic);
        }
      }
    }
    tileBg.append(grad);
    tileEl.append(tileBg);
  } else {
    if (tile.imageUrl) {
      const tileBg = document.createElement('div');
      tileBg.className = 'tile-bg';
      const pic = buildTilePicture(tile.imageUrl, tile.headerName || '');
      if (pic) {
        tileBg.append(pic);
      }
      tileBg.append(grad);
      tileEl.append(tileBg);
    } else {
      tileEl.append(grad);
    }

    const imgWrap = document.createElement('div');
    imgWrap.className = 'tile-product-img';
    const silhouette = document.createElement('div');
    silhouette.className = tile.silhouette === 'can' ? 'can-silhouette' : 'bottle-silhouette';
    silhouette.setAttribute('aria-hidden', 'true');
    imgWrap.append(silhouette);
    tileEl.append(imgWrap);

    const header = document.createElement('div');
    header.className = 'tile-header';
    const typeSpan = document.createElement('span');
    typeSpan.className = 'tile-header-type';
    typeSpan.textContent = tile.headerType || '';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'tile-header-name';
    nameSpan.textContent = tile.headerName || '';
    header.append(typeSpan, nameSpan);
    tileEl.append(header);
  }

  return tileEl;
}

/**
 * @param {string} title
 * @param {string[]} subtitleLines
 * @param {'left'|'right'} align
 * @returns {HTMLElement}
 */
function buildHeader(title, subtitleLines, align) {
  const header = document.createElement('div');
  header.className = `hbv-section-header section-header hbv-header-align-${align}`;

  const titleWrap = document.createElement('div');
  titleWrap.className = 'section-title';
  const titleInner = document.createElement('span');
  titleInner.className = 'title-inner';
  titleInner.dataset.revealDelay = '0';
  titleInner.textContent = title;
  titleWrap.append(titleInner);

  const sub = document.createElement('div');
  sub.className = 'section-subtitle';
  subtitleLines.forEach((line, i) => {
    const subLine = document.createElement('span');
    subLine.className = 'sub-line';
    const subInner = document.createElement('span');
    subInner.className = 'sub-inner';
    subInner.dataset.revealDelay = String((i + 1) * 100);
    subInner.textContent = line;
    subLine.append(subInner);
    sub.append(subLine);
  });

  header.append(titleWrap, sub);
  return header;
}

/**
 * @param {HTMLElement} root
 */
function setupReveal(root) {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const addVisible = (el) => {
    el.classList.add('visible');
  };

  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    root.querySelectorAll('.hbv-tile').forEach(addVisible);
    root.querySelectorAll('[data-reveal-delay]').forEach(addVisible);
    return;
  }

  const tileObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Number.parseInt(entry.target.dataset.tileDelay || '0', 10);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        tileObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

  root.querySelectorAll('.hbv-tile').forEach((tile) => tileObserver.observe(tile));

  const textObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const items = entry.target.querySelectorAll('[data-reveal-delay]');
        items.forEach((item) => {
          const delay = Number.parseInt(item.dataset.revealDelay || '0', 10);
          setTimeout(() => item.classList.add('visible'), delay);
        });
        textObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  root.querySelectorAll('.hbv-section-header').forEach((h) => textObserver.observe(h));
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const fields = parseFieldRows(block);

  let title = fields.title ? cellText(fields.title).trim() : '';
  const subtitleLines = getSubtitleLines(fields);
  const align = normalizeHeaderAlign(
    fields['header-align'] ? cellText(fields['header-align']) : '',
  );

  const indices = collectTileIndices(fields);
  let tiles = indices.map((i) => parseTileFromFields(fields, i));

  if (!tiles.length) {
    tiles = DEFAULT_TILES;
  }
  if (!title) {
    title = 'The Vodka';
  }
  if (!subtitleLines.length) {
    subtitleLines.push('Clean Profile. Sweet Notes.', 'Mineral Finish.');
  }

  const root = document.createElement('div');
  root.className = 'hero-banner-vodka-2';

  const noise = document.createElement('div');
  noise.className = 'hbv-noise';
  noise.setAttribute('aria-hidden', 'true');

  root.append(noise, buildHeader(title, subtitleLines, align));

  const grid = document.createElement('div');
  grid.className = 'hbv-product-grid product-grid';
  root.append(grid);

  tiles.forEach((t) => grid.append(buildTileEl(t)));

  block.textContent = '';
  block.append(root);
  setupReveal(root);
}
