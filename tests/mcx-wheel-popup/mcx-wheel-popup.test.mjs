/* eslint-env node */
/* global globalThis */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

function createValueCell(document, value) {
  const cell = document.createElement('div');

  if (value && typeof value === 'object' && value.type === 'html') {
    cell.innerHTML = value.html;
    return cell;
  }

  if (value && typeof value === 'object' && value.type === 'link') {
    const link = document.createElement('a');
    link.setAttribute('href', value.href);
    link.textContent = value.text;
    cell.append(link);
    return cell;
  }

  cell.textContent = value;
  return cell;
}

function createFieldRow(document, key, value) {
  const row = document.createElement('div');
  const keyCell = document.createElement('div');
  keyCell.textContent = key;
  row.append(keyCell, createValueCell(document, value));
  return row;
}

function createWheelBlock(document, overrides = {}) {
  const block = document.createElement('div');
  block.className = 'mcx-wheel-popup';

  const fields = {
    'campaign-id': 'spring-spin-2026',
    eyebrow: 'Spring Tactical Drop',
    'heading-line-1': 'Spin For',
    'heading-line-2': 'Your Reward',
    description: 'Take one tactical spin to reveal your authored MCX reward.',
    'result-headline': 'Reward Transmission',
    'slice-1-label': '15% Off',
    'slice-1-title': 'Save 15% On Field Gear',
    'slice-1-description': 'Apply <strong>FIELD15</strong> on select packs.',
    'slice-1-code': 'FIELD15',
    'slice-1-cta': { type: 'link', href: '/gear', text: 'Shop Field Gear' },
    'slice-2-label': 'Free Ship',
    'slice-2-title': 'Unlock Free Shipping',
    'slice-2-description': 'Score free standard shipping on your next online order.',
    'slice-2-code': 'SHIPMCX',
    'slice-2-cta': { type: 'link', href: '/products', text: 'Start Shopping' },
    'slice-3-label': 'Dress Blues',
    'slice-3-title': 'Extra Savings On Uniform Essentials',
    'slice-3-description': 'Refresh inspection-ready staples with an extra markdown.',
    'slice-3-cta': { type: 'link', href: '/uniforms', text: 'Browse Uniforms' },
    'slice-4-label': 'PX Bonus',
    'slice-4-title': '$10 Bonus On Orders Over $75',
    'slice-4-description': 'Reach the spend threshold and use the reward code below.',
    'slice-4-code': 'BONUS10',
    'slice-5-label': 'Nike Drop',
    'slice-5-title': 'Early Access To New Arrivals',
    'slice-5-description': 'Front-of-line access to the latest arrivals.',
    'slice-5-cta': { type: 'link', href: '/new-arrivals', text: 'View New Arrivals' },
    'slice-6-label': 'Home Setup',
    'slice-6-title': 'Save On First-Duty-Station Setup',
    'slice-6-description': 'Use this reward on select home electronics.',
    'slice-6-code': 'SETTLE20',
    'slice-6-cta': { type: 'link', href: '/home', text: 'Shop Home' },
    'slice-7-label': 'Tax-Free',
    'slice-7-title': 'Extra Tax-Free Advantage',
    'slice-7-description': 'Stack MCX tax-free pricing with shelf markdowns.',
    'slice-8-label': 'Boots',
    'slice-8-title': 'Boot Locker Flash Offer',
    'slice-8-description': 'Redeem a limited-time boot offer on select styles.',
    'slice-8-code': 'BOOTUP',
    'slice-8-cta': { type: 'link', href: '/boots', text: 'Shop Boots' },
    'fine-print': 'Rewards are static authored offers.',
    trigger: 'immediate',
    'trigger-delay': '3',
    'trigger-scroll': '50',
    ...overrides,
  };

  Object.entries(fields).forEach(([key, value]) => {
    block.append(createFieldRow(document, key, value));
  });

  return block;
}

function withNavigator(clipboardImpl, callback) {
  const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: clipboardImpl ? { clipboard: clipboardImpl } : {},
  });

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      if (previousDescriptor) {
        Object.defineProperty(globalThis, 'navigator', previousDescriptor);
      } else {
        delete globalThis.navigator;
      }
    });
}

test('mcx-wheel-popup renders the tactical wheel and reveals the deterministic reward after spin', async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.02;

  try {
    await withFakeDom(async ({ document }) => withNavigator({
      writeText: async (value) => {
        globalThis.__copiedWheelCode = value;
      },
    }, async () => {
      const { default: decorate } = await import('../../blocks/mcx-wheel-popup/mcx-wheel-popup.js');
      const block = createWheelBlock(document, {
        description: {
          type: 'html',
          html: 'Take one <strong>tactical spin</strong> and <a href="/offers">see the campaign</a>.',
        },
        'slice-1-description': {
          type: 'html',
          html: 'Apply <strong>FIELD15</strong> on select packs. <a href="/terms">Terms</a> apply.',
        },
        'fine-print': {
          type: 'html',
          html: 'Review the <a href="/legal">legal details</a> before checkout.',
        },
      });

      document.body.append(block);
      decorate(block);

      const overlay = document.body.querySelector('.mwp-overlay');
      assert.ok(overlay);
      assert.equal(document.body.classList.contains('mcx-wheel-popup-open'), true);
      assert.equal(overlay.querySelectorAll('.mwp-label').length, 8);
      assert.equal(overlay.querySelector('.mwp-description strong')?.textContent, 'tactical spin');
      assert.equal(overlay.querySelector('.mwp-fine-print a')?.getAttribute('href'), '/legal');

      const spinButton = overlay.querySelector('.mwp-spin-btn');
      spinButton.dispatchEvent({ type: 'click' });

      assert.equal(overlay.classList.contains('is-result'), true);
      assert.equal(overlay.querySelector('.mwp-result-title')?.textContent, 'Save 15% On Field Gear');
      assert.equal(overlay.querySelector('.mwp-result-description strong')?.textContent, 'FIELD15');
      assert.equal(overlay.querySelector('.mwp-result-description a')?.getAttribute('href'), '/terms');
      assert.equal(overlay.querySelector('.mwp-code-value')?.textContent, 'FIELD15');
      assert.equal(overlay.querySelector('.mwp-result-cta')?.getAttribute('href'), '/gear');
      assert.match(overlay.querySelector('.mwp-wheel')?.style.transform || '', /rotate\(/);

      overlay.querySelector('.mwp-copy-btn')?.dispatchEvent({ type: 'click' });
      await Promise.resolve();
      await Promise.resolve();

      assert.equal(globalThis.__copiedWheelCode, 'FIELD15');
      delete globalThis.__copiedWheelCode;
    }));
  } finally {
    Math.random = originalRandom;
  }
});

test('mcx-wheel-popup supports scroll trigger, traps focus, and restores focus after close', async () => {
  await withFakeDom(async ({ document, window }) => withNavigator(null, async () => {
    const { default: decorate } = await import('../../blocks/mcx-wheel-popup/mcx-wheel-popup.js');
    document.body.scrollHeight = 2600;

    const launchButton = document.createElement('button');
    launchButton.textContent = 'Launch';
    document.body.append(launchButton);
    launchButton.focus();

    const block = createWheelBlock(document, {
      trigger: 'scroll',
      'campaign-id': 'scroll-spin-campaign',
    });
    document.body.append(block);

    decorate(block);
    assert.equal(document.body.querySelector('.mwp-overlay'), null);

    window.scrollY = 1100;
    window.dispatchEvent({ type: 'scroll' });

    const overlay = document.body.querySelector('.mwp-overlay');
    assert.ok(overlay);

    const focusables = overlay.querySelectorAll('button, a[href]');
    focusables[focusables.length - 1]?.focus();
    document.dispatchEvent({
      type: 'keydown',
      key: 'Tab',
      preventDefault() {},
    });

    assert.equal(document.activeElement, focusables[0]);

    document.dispatchEvent({ type: 'keydown', key: 'Escape' });

    assert.equal(document.body.querySelector('.mwp-overlay'), null);
    assert.equal(document.body.classList.contains('mcx-wheel-popup-open'), false);
    assert.equal(document.activeElement, launchButton);
  }));
});

test('mcx-wheel-popup suppresses repeat shows by campaign and bypasses suppression in preview', async () => {
  await withFakeDom(async ({ document, window }) => withNavigator(null, async () => {
    const { default: decorate } = await import('../../blocks/mcx-wheel-popup/mcx-wheel-popup.js');
    const first = createWheelBlock(document, {
      'campaign-id': 'shared-wheel-campaign',
    });
    document.body.append(first);

    decorate(first);
    assert.ok(document.body.querySelector('.mwp-overlay'));
    assert.equal(window.sessionStorage.getItem('mcx_wheel_popup_seen_shared-wheel-campaign'), '1');

    document.dispatchEvent({ type: 'keydown', key: 'Escape' });

    const blocked = createWheelBlock(document, {
      'campaign-id': 'shared-wheel-campaign',
    });
    document.body.append(blocked);
    decorate(blocked);
    assert.equal(document.body.querySelector('.mwp-overlay'), null);

    window.location.pathname = '/blocks/mcx-wheel-popup.plain.html';
    window.location.href = 'https://example.com/blocks/mcx-wheel-popup.plain.html';

    const previewBlock = createWheelBlock(document, {
      'campaign-id': 'shared-wheel-campaign',
      trigger: 'time',
    });
    document.body.append(previewBlock);
    decorate(previewBlock);

    assert.ok(document.body.querySelector('.mwp-overlay'));
  }));
});

test('mcx-wheel-popup supports exit intent and first-interaction triggers', async () => {
  await withFakeDom(async ({ document, window }) => withNavigator(null, async () => {
    const { default: decorate } = await import('../../blocks/mcx-wheel-popup/mcx-wheel-popup.js');

    const exitBlock = createWheelBlock(document, {
      trigger: 'exit',
      'campaign-id': 'exit-wheel-campaign',
    });
    document.body.append(exitBlock);
    decorate(exitBlock);
    assert.equal(document.body.querySelector('.mwp-overlay'), null);

    document.dispatchEvent({ type: 'mouseout', clientY: 0 });
    assert.ok(document.body.querySelector('.mwp-overlay'));

    document.dispatchEvent({ type: 'keydown', key: 'Escape' });

    const firstInteractionBlock = createWheelBlock(document, {
      trigger: 'first-interaction',
      'campaign-id': 'first-wheel-campaign',
    });
    document.body.append(firstInteractionBlock);
    decorate(firstInteractionBlock);
    assert.equal(document.body.querySelector('.mwp-overlay'), null);

    document.dispatchEvent({ type: 'click' });
    assert.ok(document.body.querySelector('.mwp-overlay'));

    window.dispatchEvent({ type: 'scroll' });
  }));
});

test('mcx-wheel-popup hides code and CTA affordances when the selected slice omits them', async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.95;

  try {
    await withFakeDom(async ({ document }) => withNavigator(null, async () => {
      const { default: decorate } = await import('../../blocks/mcx-wheel-popup/mcx-wheel-popup.js');
      const block = createWheelBlock(document, {
        'slice-7-code': '',
        'slice-8-code': '',
        'slice-8-cta': '',
      });
      document.body.append(block);

      decorate(block);

      const overlay = document.body.querySelector('.mwp-overlay');
      overlay.querySelector('.mwp-spin-btn')?.dispatchEvent({ type: 'click' });

      assert.equal(overlay.querySelector('.mwp-result-title')?.textContent, 'Boot Locker Flash Offer');
      assert.equal(overlay.querySelector('.mwp-code-row')?.hidden, true);
      assert.equal(overlay.querySelector('.mwp-result-cta-wrap')?.hidden, true);
    }));
  } finally {
    Math.random = originalRandom;
  }
});

test('mcx-wheel-popup respects reduced-motion timing for spin reveal', async () => {
  const originalRandom = Math.random;
  let scheduledDelay = null;
  Math.random = () => 0.3;

  try {
    await withFakeDom(async ({ document }) => withNavigator(null, async () => {
      const { default: decorate } = await import('../../blocks/mcx-wheel-popup/mcx-wheel-popup.js');
      const block = createWheelBlock(document);
      document.body.append(block);

      decorate(block);

      const overlay = document.body.querySelector('.mwp-overlay');
      overlay.querySelector('.mwp-spin-btn')?.dispatchEvent({ type: 'click' });

      assert.equal(scheduledDelay, 30);
      assert.equal(overlay.classList.contains('is-result'), true);
    }), {
      window: {
        matchMedia: () => ({ matches: true }),
        setTimeout: (callback, delay = 0) => {
          scheduledDelay = delay;
          callback();
          return 1;
        },
      },
    });
  } finally {
    Math.random = originalRandom;
  }
});
