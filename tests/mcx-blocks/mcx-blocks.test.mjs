/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appendMeta,
  withFakeDom,
} from '../helpers/fake-dom.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

function splitTableRow(line) {
  const cells = line.split(/\s\|\s/).map((cell) => cell.trim());
  if (/\s\|\s*$/.test(line)) cells.push('');
  return cells;
}

async function loadTable(relativePath) {
  const text = await readFile(resolve(repoRoot, relativePath), 'utf8');
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return {
    title: lines[0],
    rows: lines.slice(1).map(splitTableRow),
  };
}

function createCell(document, rawValue) {
  const value = rawValue.trim();
  const cell = document.createElement('div');
  if (!value) return cell;

  const imageMatch = value.match(/^!\[(.*?)\]\((.*?)\)$/);
  if (imageMatch) {
    const [, alt, src] = imageMatch;
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    cell.append(image);
    return cell;
  }

  const linkMatch = value.match(/^\[(.+?)\]\((.+?)\)$/);
  if (linkMatch) {
    const [, text, href] = linkMatch;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    cell.append(link);
    return cell;
  }

  cell.textContent = value.replace(/<br\s*\/?>/gi, '\n');
  return cell;
}

async function createBlockFromTable(document, relativePath) {
  const { title, rows } = await loadTable(relativePath);
  const block = document.createElement('div');
  block.className = title;

  rows.forEach((rowValues) => {
    const row = document.createElement('div');
    rowValues.forEach((cellValue) => row.append(createCell(document, cellValue)));
    block.append(row);
  });

  return block;
}

test('mcx announcement, benefits, brands, and ticker blocks render their example content', async () => {
  await withFakeDom(async ({ document }) => {
    const announcementBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-announcement-bar.table.txt');
    const benefitsBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-benefits.table.txt');
    const brandsBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-brands.table.txt');
    const tickerBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-ticker.table.txt');

    const announcementSection = document.createElement('div');
    announcementSection.className = 'section';
    announcementSection.append(announcementBlock);
    document.body.append(announcementSection, benefitsBlock, brandsBlock, tickerBlock);

    const { default: decorateAnnouncement } = await import('../../blocks/mcx-announcement-bar/mcx-announcement-bar.js');
    const { default: decorateBenefits } = await import('../../blocks/mcx-benefits/mcx-benefits.js');
    const { default: decorateBrands } = await import('../../blocks/mcx-brands/mcx-brands.js');
    const { default: decorateTicker } = await import('../../blocks/mcx-ticker/mcx-ticker.js');

    decorateAnnouncement(announcementBlock);
    decorateBenefits(benefitsBlock);
    decorateBrands(brandsBlock);
    decorateTicker(tickerBlock);

    assert.equal(announcementBlock.querySelectorAll('.ann-item').length, 10);
    assert.equal(announcementBlock.querySelector('.ann-close')?.textContent, 'X');
    announcementBlock.querySelector('.ann-close')?.dispatchEvent({ type: 'click' });
    assert.equal(document.body.querySelector('.mcx-announcement-bar'), null);

    assert.equal(benefitsBlock.querySelectorAll('.ben-item').length, 4);
    assert.equal(benefitsBlock.querySelector('.ben-title')?.textContent, 'Tax-Free Shopping');

    assert.equal(brandsBlock.querySelector('.brands-hd')?.textContent, 'Trusted Brands Available at Every MCX Location');
    assert.equal(brandsBlock.querySelectorAll('.brand-pill').length, 7);

    assert.equal(tickerBlock.querySelectorAll('.ticker-item').length, 12);
    assert.equal(tickerBlock.querySelector('.ticker-item b')?.textContent, 'Free Shipping');
  });
});

test('mcx category, featured collections, and editorial cards render cards and links from the example tables', async () => {
  await withFakeDom(async ({ document }) => {
    const categoryBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-category-grid.table.txt');
    const featuredBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-featured-collections.table.txt');
    const editorialBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-editorial-cards.table.txt');
    document.body.append(categoryBlock, featuredBlock, editorialBlock);

    const { default: decorateCategory } = await import('../../blocks/mcx-category-grid/mcx-category-grid.js');
    const { default: decorateFeatured } = await import('../../blocks/mcx-featured-collections/mcx-featured-collections.js');
    const { default: decorateEditorial } = await import('../../blocks/mcx-editorial-cards/mcx-editorial-cards.js');

    decorateCategory(categoryBlock);
    decorateFeatured(featuredBlock);
    decorateEditorial(editorialBlock);

    assert.equal(categoryBlock.querySelector('.sec-label')?.textContent, 'Browse the Exchange');
    assert.equal(categoryBlock.querySelector('.sec-title')?.textContent, 'SHOP YOUR WAY');
    assert.equal(categoryBlock.querySelectorAll('.cat-tile').length, 12);
    assert.equal(categoryBlock.querySelector('.view-link'), null);

    assert.equal(featuredBlock.querySelector('.sec-title')?.textContent, 'SHOP THE LOOK');
    assert.equal(featuredBlock.querySelectorAll('.feat-card').length, 3);
    assert.equal(featuredBlock.querySelectorAll('.feat-main').length, 1);
    assert.equal(featuredBlock.querySelector('.view-link')?.href, '/collections');
    assert.equal(featuredBlock.querySelector('.feat-link')?.href, '/collections/mens');

    assert.equal(editorialBlock.querySelectorAll('.ed-card').length, 3);
    assert.equal(editorialBlock.querySelector('.ed-title')?.textContent, 'Everything You Need for Inspection-Ready Dress Blues');
  });
});

test('mcx deal countdown, newsletter, and promo strip expose the authored data needed by the MCX runtime', async () => {
  await withFakeDom(async ({ document }) => {
    const countdownBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-deal-countdown.table.txt');
    const newsletterBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-newsletter.table.txt');
    const promoBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-promo-strip.table.txt');
    document.body.append(countdownBlock, newsletterBlock, promoBlock);

    const { default: decorateCountdown } = await import('../../blocks/mcx-deal-countdown/mcx-deal-countdown.js');
    const { default: decorateNewsletter } = await import('../../blocks/mcx-newsletter/mcx-newsletter.js');
    const { default: decoratePromo } = await import('../../blocks/mcx-promo-strip/mcx-promo-strip.js');

    decorateCountdown(countdownBlock);
    decorateNewsletter(newsletterBlock);
    decoratePromo(promoBlock);

    const strip = countdownBlock.querySelector('.deal-strip');
    assert.equal(strip?.dataset.countdownEnd, '2026-04-01T23:59:59-07:00');
    assert.equal(strip?.dataset.hideCtaWhenEnded, 'false');
    assert.equal(countdownBlock.querySelector('.btn-deal')?.href, '/deals');
    assert.equal(countdownBlock.querySelector('.deal-cta p')?.textContent, 'Do not miss out - deals expire when the timer hits zero.');

    assert.equal(newsletterBlock.querySelector('[data-mcx-newsletter]')?.tagName, 'FORM');
    assert.equal(newsletterBlock.querySelector('.btn-nl')?.textContent, 'Subscribe');
    assert.equal(newsletterBlock.querySelector('.nl-input')?.placeholder, 'Your military email address...');

    assert.equal(promoBlock.querySelector('.promo-title')?.textContent, 'EARN MORE, SPEND LESS');
    assert.equal(promoBlock.querySelector('.btn-promo')?.href, '/clearance');
  });
});

test('mcx product cards parse tabs, merchandising data, and pricing from the example table', async () => {
  await withFakeDom(async ({ document }) => {
    const block = await createBlockFromTable(document, 'docs/mcx-examples/mcx-product-cards.table.txt');
    document.body.append(block);

    const { default: decorate } = await import('../../blocks/mcx-product-cards/mcx-product-cards.js');
    decorate(block);

    const tabs = block.querySelectorAll('.ptab');
    const cards = block.querySelectorAll('.prod-card');
    const firstCard = cards[0];

    assert.equal(block.querySelector('.sec-title')?.textContent, 'NEW ARRIVALS');
    assert.equal(tabs.length, 6);
    assert.equal(tabs[0]?.classList.contains('on'), true);
    assert.equal(cards.length, 8);
    assert.equal(firstCard?.dataset.cat, 'footwear');
    assert.equal(firstCard?.dataset.brand, 'Danner');
    assert.equal(firstCard?.dataset.price, '189.99');
    assert.equal(firstCard?.querySelector('.p-current')?.textContent, '$189.99');
    assert.equal(firstCard?.querySelector('.p-chip')?.textContent, 'Save $50');
    assert.equal(firstCard?.querySelector('.prod-quick span')?.textContent, 'Quick View');
  });
});

test('mcx header renders the nav fragment into the shell block', async () => {
  await withFakeDom(async ({
    document,
    fetchCalls,
    setFetchImplementation,
  }) => {
    const navHtml = await readFile(resolve(repoRoot, 'fragments/mcx-nav.plain.html'), 'utf8');
    const block = document.createElement('div');
    block.className = 'mcx-header';
    document.body.append(block);
    appendMeta(document, 'nav', '/fragments/mcx-nav');

    setFetchImplementation(async () => ({
      ok: true,
      text: async () => navHtml,
    }));

    const { default: decorate } = await import('../../blocks/mcx-header/mcx-header.js');
    await decorate(block);

    assert.equal(fetchCalls[0]?.[0], '/fragments/mcx-nav.plain.html');
    assert.equal(block.querySelector('.logo-mcx')?.textContent, 'MCX');
    assert.equal(block.querySelector('.hdr-signin')?.href, '/account');
    assert.equal(block.querySelector('.nav-hot')?.textContent, 'Deals & Offers');
    assert.equal(block.querySelectorAll('.nav-item').length, 7);
    assert.equal(block.querySelectorAll('.mega-col').length >= 3, true);
    assert.equal(block.querySelector('[data-mcx-cart-toggle]')?.tagName, 'BUTTON');
  });
});

test('mcx footer renders the footer fragment into the shell block', async () => {
  await withFakeDom(async ({
    document,
    fetchCalls,
    setFetchImplementation,
  }) => {
    const footerHtml = await readFile(resolve(repoRoot, 'fragments/mcx-footer.plain.html'), 'utf8');
    const block = document.createElement('div');
    block.className = 'mcx-footer';
    document.body.append(block);
    appendMeta(document, 'footer', '/fragments/mcx-footer');

    setFetchImplementation(async () => ({
      ok: true,
      text: async () => footerHtml,
    }));

    const { default: decorate } = await import('../../blocks/mcx-footer/mcx-footer.js');
    await decorate(block);

    assert.equal(fetchCalls[0]?.[0], '/fragments/mcx-footer.plain.html');
    assert.equal(block.querySelector('.logo-mcx')?.textContent, 'MCX');
    assert.equal(block.querySelectorAll('.foot-col').length, 4);
    assert.equal(block.querySelectorAll('.soc').length, 4);
    assert.equal(block.querySelector('.foot-flag')?.textContent, 'USA Proudly Serving Since 1897');
    assert.equal(block.querySelector('.foot-legal a')?.href, '/privacy');
  });
});
