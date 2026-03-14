import {
  createLink,
  createPictureFromCell,
  createTextElement,
  extractLink,
  parseFieldRows,
  cellText,
} from '../../scripts/mcx-block-utils.js';

function createCta(linkData, className) {
  const link = createLink(className, linkData.href, linkData.text);
  link.innerHTML = `
    <span>${linkData.text}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  `;
  return link;
}

export default function decorate(block) {
  const fields = parseFieldRows(block);
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

  const rank = document.createElement('div');
  rank.className = 'hero-rank';
  ['status-badge-1', 'status-badge-2', 'status-badge-3'].forEach((key) => {
    const text = cellText(fields[key]);
    if (!text) return;
    const badge = document.createElement('span');
    badge.textContent = text;
    rank.append(badge);
  });
  hero.append(rank);

  const content = document.createElement('div');
  content.className = 'hero-content';

  const eyebrow = document.createElement('div');
  eyebrow.className = 'hero-eyebrow';
  eyebrow.innerHTML = `
    <div class="eyebrow-pip" aria-hidden="true"><span></span><span></span><span></span></div>
    <span class="hero-eyebrow-txt">${cellText(fields.eyebrow)}</span>
  `;
  content.append(eyebrow);

  const heading = document.createElement('h1');
  heading.className = 'hero-h1';
  heading.innerHTML = `
    <span class="l1">${cellText(fields['heading-line-1'])}</span>
    <span class="l2">${cellText(fields['heading-line-2'])}</span>
    <span class="l3">${cellText(fields['heading-line-3'])}</span>
  `;
  content.append(heading);

  const description = createTextElement('p', 'hero-desc', cellText(fields.description));
  content.append(description);

  const ctas = document.createElement('div');
  ctas.className = 'hero-ctas';
  const primaryCta = extractLink(fields['primary-cta'], 'Shop Now');
  const secondaryCta = extractLink(fields['secondary-cta'], 'View Deals');
  ctas.append(createCta(primaryCta, 'btn-hero'), createCta(secondaryCta, 'btn-ghost'));
  content.append(ctas);

  const stats = document.createElement('div');
  stats.className = 'hero-stats';
  ['1', '2', '3', '4'].forEach((index) => {
    const value = cellText(fields[`stat-${index}-value`]);
    const label = cellText(fields[`stat-${index}-label`]);
    if (!value || !label) return;
    const item = document.createElement('div');
    item.className = 'h-stat';
    item.innerHTML = `
      <div class="h-stat-num">${value}</div>
      <div class="h-stat-lbl">${label}</div>
    `;
    stats.append(item);
  });
  content.append(stats);
  hero.append(content);

  const scroll = document.createElement('div');
  scroll.className = 'hero-scroll';
  scroll.innerHTML = `
    <div class="scroll-line"></div>
    <span class="scroll-txt">Scroll to explore</span>
  `;
  hero.append(scroll);

  const heroNav = document.createElement('div');
  heroNav.className = 'hero-nav';
  heroNav.innerHTML = `
    <button type="button" class="h-dot on" data-hero-dot="0" aria-label="Hero slide 1"></button>
    <button type="button" class="h-dot" data-hero-dot="1" aria-label="Hero slide 2"></button>
    <button type="button" class="h-dot" data-hero-dot="2" aria-label="Hero slide 3"></button>
  `;
  hero.append(heroNav);

  block.replaceChildren(hero);
}
