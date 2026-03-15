/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

test('header resolution always returns mcx-header while footer resolution keeps shell-specific behavior', async () => {
  await withFakeDom(async ({ document }) => {
    const {
      resolveFooterBlockName,
      resolveHeaderBlockName,
    } = await import('../../scripts/aem.js');

    assert.equal(resolveHeaderBlockName(), 'mcx-header');
    assert.equal(resolveFooterBlockName(), 'footer');

    document.body.matches = (selector) => selector === '.mcx, .mcx-preview';

    assert.equal(resolveHeaderBlockName(), 'mcx-header');
    assert.equal(resolveFooterBlockName(), 'mcx-footer');
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

test('moveMcxAnnouncementBarToHeader promotes the authored MCX announcement section above the header block', async () => {
  await withFakeDom(async ({ document }) => {
    const header = document.createElement('header');
    const main = document.createElement('main');
    const announcementSection = document.createElement('div');
    const wrapper = document.createElement('div');
    const block = document.createElement('div');

    announcementSection.className = 'section mcx-announcement-bar-container';
    announcementSection.dataset.sectionStatus = 'initialized';
    block.className = 'mcx-announcement-bar block';
    wrapper.append(block);
    announcementSection.append(wrapper);
    main.append(announcementSection);
    document.body.append(header, main);
    document.body.matches = (selector) => selector === '.mcx, .mcx-preview';

    const { moveMcxAnnouncementBarToHeader } = await import('../../scripts/aem.js');
    const movedSection = moveMcxAnnouncementBarToHeader(header);

    assert.equal(movedSection, announcementSection);
    assert.equal(header.children[0], announcementSection);
    assert.equal(main.querySelector('.mcx-announcement-bar-container'), null);
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
