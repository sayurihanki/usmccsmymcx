/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { withFakeDom } from '../helpers/fake-dom.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

function appendCellText(document, cell, value) {
  value.split('\n').forEach((line, index) => {
    if (index > 0) cell.append(document.createElement('br'));
    cell.append(line);
  });
}

function createRow(document, key, value, href = '') {
  const row = document.createElement('div');
  const keyCell = document.createElement('div');
  const valueCell = document.createElement('div');
  keyCell.textContent = key;

  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = value;
    valueCell.append(link);
  } else {
    appendCellText(document, valueCell, value);
  }

  row.append(keyCell, valueCell);
  return row;
}

function createPromoStripBlock(document, {
  badge = 'Guided Selling Experience',
  title = 'PERSONALIZE YOUR MCCS EXPERIENCE',
  description = 'Tell us about your military life, interests, and preferences.',
  ctaLabel = 'Start Personalizing',
  ctaHref = '/personalize',
} = {}) {
  const block = document.createElement('div');
  block.className = 'promo-strip';
  block.append(
    createRow(document, 'badge', badge),
    createRow(document, 'title', title),
    createRow(document, 'description', description),
    createRow(document, 'cta', ctaLabel, ctaHref),
  );
  return block;
}

test('promo-strip renders author copy and CTA on a non-MCX page', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/promo-strip/promo-strip.js');
    const block = createPromoStripBlock(document);
    document.body.append(block);

    decorate(block);

    assert.equal(block.querySelector('.promo-strip__badge')?.textContent, 'Guided Selling Experience');
    assert.equal(block.querySelector('.promo-strip__title')?.textContent, 'PERSONALIZE YOUR MCCS EXPERIENCE');
    assert.match(block.querySelector('.promo-strip__description')?.textContent || '', /military life/);
    assert.equal(block.querySelector('.promo-strip__cta')?.href, '/personalize');
    assert.equal(block.querySelector('.promo-strip__cta span')?.textContent, 'Start Personalizing');
    assert.equal(block.querySelectorAll('svg').length, 1);
  });
});

test('promo-strip decorates cleanly when the page already uses the MCX shell', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/promo-strip/promo-strip.js');
    document.body.classList.add('mcx');
    const block = createPromoStripBlock(document, {
      badge: 'Preferences Saved',
      title: 'WELCOME BACK TO MCCS',
      description: 'Your tailored experience is ready whenever you return.',
      ctaLabel: 'Return Home',
      ctaHref: '/',
    });
    document.body.append(block);

    decorate(block);

    assert.equal(document.body.classList.contains('mcx'), true);
    assert.equal(block.querySelector('.promo-strip__surface') !== null, true);
    assert.equal(block.querySelector('.promo-strip__grid') !== null, true);
    assert.equal(block.querySelector('.promo-strip__title')?.textContent, 'WELCOME BACK TO MCCS');
    assert.equal(block.querySelector('.promo-strip__cta')?.href, '/');
  });
});

test('homepage and personalization content point to the new standalone flow', async () => {
  const homepage = await readFile(resolve(repoRoot, 'drafts/index.plain.html'), 'utf8');
  const personalizeDraft = await readFile(resolve(repoRoot, 'drafts/personalize.plain.html'), 'utf8');
  const thankYouDraft = await readFile(resolve(repoRoot, 'drafts/thank-you.plain.html'), 'utf8');
  const personalizePage = await readFile(resolve(repoRoot, 'personalize.html'), 'utf8');
  const thankYouPage = await readFile(resolve(repoRoot, 'thank-you.html'), 'utf8');

  assert.match(homepage, /class="promo-strip"/);
  assert.match(homepage, /href="\/personalize"/);
  assert.match(personalizeDraft, /class="form-mccs-preferences-next"/);
  assert.match(personalizeDraft, /href="\/thank-you"/);
  assert.match(thankYouDraft, /class="promo-strip"/);
  assert.match(personalizePage, /fetch\('\/drafts\/personalize\.plain\.html'\)/);
  assert.match(thankYouPage, /fetch\('\/drafts\/thank-you\.plain\.html'\)/);
});
