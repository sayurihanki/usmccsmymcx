import {
  createLink,
  createPictureFromCell,
  createTextElement,
  extractLink,
  parseFieldRows,
  cellText,
} from '../../scripts/mcx-block-utils.js';

const LIBRARY_PREVIEW_PATTERN = /\/(?:\.da\/library\/blocks|library\/blocks)\/mcx-hero\/?(\?|$)/;
const STAT_KEYS = ['1', '2', '3', '4'];
const LIBRARY_PREVIEW_DEFAULTS = {
  eyebrow: 'Spring Collection - 2026 - Tax-Free',
  'heading-line-1': 'OUTFITTED',
  'heading-line-2': 'FOR THE',
  'heading-line-3': 'mission & beyond',
  description:
    'Serving Marines and their families since 1897. Premium brands, exclusive savings, and'
    + ' tax-free shopping - exclusively for those who serve.',
  image: {
    src: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80',
    alt: 'Marine Corps collection hero',
  },
  'primary-cta': {
    href: '#products',
    text: 'Shop Now',
  },
  'secondary-cta': {
    href: '#deals',
    text: 'View Deals',
  },
  'status-badge-1': 'SYS: MCX-2026',
  'status-badge-2': 'STATUS: ACTIVE',
  'status-badge-3': 'PATRON: AUTHORIZED',
  'stat-1-value': '20%+',
  'stat-1-label': 'Average Savings',
  'stat-2-value': '33M+',
  'stat-2-label': 'Yearly Transactions',
  'stat-3-value': 'Tax Free',
  'stat-3-label': 'Exclusive Benefit',
  'stat-4-value': '127+',
  'stat-4-label': 'Store Locations',
};

const isLibraryPreview = () => {
  const currentPath = window.location.pathname + (window.location.search || '?');
  return LIBRARY_PREVIEW_PATTERN.test(currentPath);
};

function createSvgArrow() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', 'M5 12h14');

  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M12 5l7 7-7 7');

  svg.append(line, arrow);
  return svg;
}

function createImageCell(src, alt) {
  const cell = document.createElement('div');
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  cell.append(image);
  return cell;
}

function createLinkCell(href, text) {
  const cell = document.createElement('div');
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  cell.append(link);
  return cell;
}

function createFieldCell(text) {
  const cell = document.createElement('div');
  cell.textContent = text;
  return cell;
}

function getDefaultLibraryFields() {
  return {
    eyebrow: createFieldCell(LIBRARY_PREVIEW_DEFAULTS.eyebrow),
    'heading-line-1': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-1']),
    'heading-line-2': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-2']),
    'heading-line-3': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-3']),
    description: createFieldCell(LIBRARY_PREVIEW_DEFAULTS.description),
    image: createImageCell(
      LIBRARY_PREVIEW_DEFAULTS.image.src,
      LIBRARY_PREVIEW_DEFAULTS.image.alt,
    ),
    'primary-cta': createLinkCell(
      LIBRARY_PREVIEW_DEFAULTS['primary-cta'].href,
      LIBRARY_PREVIEW_DEFAULTS['primary-cta'].text,
    ),
    'secondary-cta': createLinkCell(
      LIBRARY_PREVIEW_DEFAULTS['secondary-cta'].href,
      LIBRARY_PREVIEW_DEFAULTS['secondary-cta'].text,
    ),
    'status-badge-1': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['status-badge-1']),
    'status-badge-2': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['status-badge-2']),
    'status-badge-3': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['status-badge-3']),
    'stat-1-value': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-1-value']),
    'stat-1-label': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-1-label']),
    'stat-2-value': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-2-value']),
    'stat-2-label': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-2-label']),
    'stat-3-value': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-3-value']),
    'stat-3-label': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-3-label']),
    'stat-4-value': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-4-value']),
    'stat-4-label': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-4-label']),
  };
}

function createCta(linkData, className) {
  const link = createLink(className, linkData.href, linkData.text);
  const label = document.createElement('span');
  label.textContent = linkData.text;
  link.replaceChildren(label, createSvgArrow());
  return link;
}

function appendHeadingLine(heading, className, text) {
  if (!text) return;
  const line = document.createElement('span');
  line.className = className;
  line.textContent = text;
  heading.append(line);
}

function createEyebrow(text) {
  if (!text) return null;

  const eyebrow = document.createElement('div');
  eyebrow.className = 'hero-eyebrow';

  const pip = document.createElement('div');
  pip.className = 'eyebrow-pip';

  for (let index = 0; index < 3; index += 1) {
    pip.append(document.createElement('span'));
  }

  const label = document.createElement('span');
  label.className = 'hero-eyebrow-txt';
  label.textContent = text;

  eyebrow.append(pip, label);
  return eyebrow;
}

function createStats(fields) {
  const stats = document.createElement('div');
  stats.className = 'hero-stats';

  STAT_KEYS.forEach((index) => {
    const value = cellText(fields[`stat-${index}-value`]);
    const label = cellText(fields[`stat-${index}-label`]);
    if (!value || !label) return;

    const item = document.createElement('div');
    item.className = 'h-stat';

    item.append(
      createTextElement('div', 'h-stat-num', value),
      createTextElement('div', 'h-stat-lbl', label),
    );

    stats.append(item);
  });

  return stats.children.length ? stats : null;
}

function createHeroNavigation() {
  const heroNav = document.createElement('div');
  heroNav.className = 'hero-nav';

  for (let index = 0; index < 3; index += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = index === 0 ? 'h-dot on' : 'h-dot';
    dot.dataset.heroDot = String(index);
    dot.setAttribute('aria-label', `Hero slide ${index + 1}`);
    heroNav.append(dot);
  }

  return heroNav;
}

export default function decorate(block) {
  let fields = parseFieldRows(block);
  const hasContent = fields['heading-line-1'] && cellText(fields['heading-line-1']).trim();
  if (isLibraryPreview() && !hasContent) {
    fields = getDefaultLibraryFields();
  }
  const section = block.closest('.section');
  if (section) section.classList.add('mcx-hero-section');

  const hero = document.createElement('section');
  hero.className = 'hero';

  const canvas = document.createElement('div');
  canvas.className = 'hero-canvas';
  hero.append(canvas);

  const grid = document.createElement('div');
  grid.className = 'hero-grid';
  hero.append(grid);

  const scan = document.createElement('div');
  scan.className = 'hero-scan';
  hero.append(scan);

  const picture = createPictureFromCell(fields.image, true, [{ media: '(min-width: 900px)', width: '1600' }, { width: '900' }]);
  if (picture) {
    picture.className = 'hero-photo';
    hero.append(picture);
  }

  const fade = document.createElement('div');
  fade.className = 'hero-photo-fade';
  hero.append(fade);

  const content = document.createElement('div');
  content.className = 'hero-content';

  const eyebrow = createEyebrow(cellText(fields.eyebrow));
  if (eyebrow) content.append(eyebrow);

  const heading = document.createElement('h1');
  heading.className = 'hero-h1';
  appendHeadingLine(heading, 'l1', cellText(fields['heading-line-1']));
  appendHeadingLine(heading, 'l2', cellText(fields['heading-line-2']));
  appendHeadingLine(heading, 'l3', cellText(fields['heading-line-3']));
  if (heading.children.length) content.append(heading);

  const descriptionText = cellText(fields.description);
  if (descriptionText) {
    content.append(createTextElement('p', 'hero-desc', descriptionText));
  }

  const ctas = document.createElement('div');
  ctas.className = 'hero-ctas';
  const primaryCta = extractLink(fields['primary-cta'], 'Shop Now');
  const secondaryCta = extractLink(fields['secondary-cta'], 'View Deals');
  if (primaryCta.text || primaryCta.href) ctas.append(createCta(primaryCta, 'btn-hero'));
  if (secondaryCta.text || secondaryCta.href) ctas.append(createCta(secondaryCta, 'btn-ghost'));
  if (ctas.children.length) content.append(ctas);

  const stats = createStats(fields);
  if (stats) content.append(stats);
  hero.append(content);

  hero.append(createHeroNavigation());

  block.replaceChildren(hero);
}
