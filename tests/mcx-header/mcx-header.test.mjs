/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

async function loadDecorate() {
  return (await import('../../blocks/mcx-header/mcx-header.js')).default;
}

test('mcx-header renders the live-search scaffold on the visible search bar', async () => {
  await withFakeDom(async ({ document, fetchCalls }) => {
    const decorate = await loadDecorate();
    const block = document.createElement('div');
    block.className = 'mcx-header';
    document.body.append(block);

    await decorate(block);

    const searchForm = block.querySelector('.hdr-search');
    const searchInput = block.querySelector('[data-mcx-search-input]');
    const resultsPanel = block.querySelector('[data-mcx-live-search]');
    const liveRegion = block.querySelector('.hdr-search-status');

    assert.ok(searchForm);
    assert.ok(searchInput);
    assert.ok(resultsPanel);
    assert.ok(liveRegion);

    assert.equal(fetchCalls.length, 1);
    assert.equal(searchForm.getAttribute('action'), '/search');
    assert.equal(searchForm.dataset.searchStatus, 'idle');
    assert.equal(searchForm.getAttribute('aria-expanded'), 'false');
    assert.equal(searchInput.getAttribute('autocomplete'), 'off');
    assert.equal(searchInput.getAttribute('spellcheck'), 'false');
    assert.equal(searchInput.getAttribute('aria-expanded'), 'false');
    assert.equal(searchInput.getAttribute('aria-controls'), resultsPanel.id);
    assert.equal(resultsPanel.getAttribute('role'), 'region');
    assert.equal(resultsPanel.getAttribute('aria-hidden'), 'true');
    assert.equal(resultsPanel.getAttribute('aria-busy'), 'false');
    assert.equal(liveRegion.getAttribute('role'), 'status');
    assert.equal(liveRegion.getAttribute('aria-live'), 'polite');
  }, {
    window: {
      location: {
        href: 'https://example.com/',
        pathname: '/',
        search: '',
        hostname: 'example.com',
      },
    },
  });
});
