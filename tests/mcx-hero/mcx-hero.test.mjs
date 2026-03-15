/* eslint-env node */
/* global globalThis */
/* eslint-disable max-classes-per-file, class-methods-use-this */
import test from 'node:test';
import assert from 'node:assert/strict';

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const existing = this.listeners.get(type) || [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }
}

class FakeStyle {
  setProperty(name, value) {
    this[name] = value;
  }
}

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  add(...tokens) {
    const classes = new Set(this.element.className.split(/\s+/).filter(Boolean));
    tokens.forEach((token) => classes.add(token));
    this.element.className = [...classes].join(' ');
  }

  contains(token) {
    return this.element.className.split(/\s+/).filter(Boolean).includes(token);
  }
}

function matchesSelector(element, selector) {
  const normalized = selector.trim();
  if (!normalized) return false;

  if (normalized.startsWith('.')) {
    return element.classList.contains(normalized.slice(1));
  }

  return element.tagName === normalized.toUpperCase();
}

class FakeElement extends FakeEventTarget {
  constructor(tagName, ownerDocument) {
    super();
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.className = '';
    this.dataset = {};
    this.style = new FakeStyle();
    this.attributes = new Map();
    this.classList = new FakeClassList(this);
    this._children = [];
    this._textContent = '';
    this.href = '';
    this.src = '';
    this.alt = '';
    this.loading = '';
    this.type = '';
  }

  get children() {
    return this._children.filter((child) => child instanceof FakeElement);
  }

  get childNodes() {
    return [...this._children];
  }

  get textContent() {
    if (this._children.length) {
      return this._children.map((child) => child.textContent || '').join('');
    }

    return this._textContent;
  }

  set textContent(value) {
    this._children = [];
    this._textContent = value;
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  appendChild(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }

    this._children.push(node);
    node.parentNode = this;
    return node;
  }

  removeChild(node) {
    const index = this._children.indexOf(node);
    if (index >= 0) {
      this._children.splice(index, 1);
      node.parentNode = null;
    }
    return node;
  }

  replaceChildren(...nodes) {
    this._children.forEach((child) => {
      child.parentNode = null;
    });
    this._children = [];
    this._textContent = '';
    this.append(...nodes);
  }

  setAttribute(name, value) {
    const normalized = String(value);
    this.attributes.set(name, normalized);

    if (name === 'class') this.className = normalized;
    if (name === 'href') this.href = normalized;
    if (name === 'src') this.src = normalized;
    if (name === 'alt') this.alt = normalized;
    if (name === 'type') this.type = normalized;
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = normalized;
    }
  }

  getAttribute(name) {
    if (name === 'href') return this.href || null;
    if (name === 'src') return this.src || null;
    if (name === 'alt') return this.alt || null;
    if (name === 'type') return this.type || null;
    if (name === 'class') return this.className || null;
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(',').map((entry) => entry.trim()).filter(Boolean);
    const matches = [];

    const walk = (node) => {
      node.children.forEach((child) => {
        if (selectors.some((entry) => matchesSelector(child, entry))) {
          matches.push(child);
        }
        walk(child);
      });
    };

    walk(this);
    return matches;
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (matchesSelector(current, selector)) return current;
      current = current.parentNode;
    }
    return null;
  }

  cloneNode(deep = false) {
    const clone = new FakeElement(this.tagName, this.ownerDocument);
    clone.className = this.className;
    clone.href = this.href;
    clone.src = this.src;
    clone.alt = this.alt;
    clone.loading = this.loading;
    clone.type = this.type;
    clone.dataset = { ...this.dataset };
    clone.attributes = new Map(this.attributes);
    clone._textContent = this._textContent;

    if (deep) {
      this._children.forEach((child) => {
        clone.appendChild(child.cloneNode ? child.cloneNode(true) : child);
      });
    }

    return clone;
  }
}

class FakeDocument extends FakeEventTarget {
  constructor() {
    super();
    this.body = new FakeElement('body', this);
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createElementNS(_namespace, tagName) {
    return new FakeElement(tagName, this);
  }

  querySelector(selector) {
    return this.body.querySelector(selector);
  }
}

class FakeWindow extends FakeEventTarget {
  constructor(document) {
    super();
    this.document = document;
    this.location = {
      href: 'https://example.com/',
      pathname: '/',
      search: '',
    };
  }
}

function createFieldRow(document, key, valueBuilder) {
  const row = document.createElement('div');
  const keyCell = document.createElement('div');
  keyCell.textContent = key;
  const valueCell = document.createElement('div');

  valueBuilder(valueCell);

  row.append(keyCell, valueCell);
  return row;
}

function createTextRow(document, key, value) {
  return createFieldRow(document, key, (valueCell) => {
    valueCell.textContent = value;
  });
}

function createLinkRow(document, key, href, label) {
  return createFieldRow(document, key, (valueCell) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    valueCell.append(link);
  });
}

function createImageRow(document, key, src, alt) {
  return createFieldRow(document, key, (valueCell) => {
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    valueCell.append(image);
  });
}

function createAuthoredBlock(document) {
  const section = document.createElement('div');
  section.className = 'section';

  const block = document.createElement('div');
  block.className = 'mcx-hero';

  block.append(
    createTextRow(document, 'eyebrow', 'Spring Collection - 2026 - Tax-Free'),
    createTextRow(document, 'heading-line-1', 'OUTFITTED'),
    createTextRow(document, 'heading-line-2', 'FOR THE'),
    createTextRow(document, 'heading-line-3', 'mission & beyond'),
    createTextRow(
      document,
      'description',
      'Serving Marines and their families since 1897. Premium brands, exclusive savings, and tax-free shopping - exclusively for those who serve.',
    ),
    createImageRow(
      document,
      'image',
      'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80',
      'Marine Corps collection hero',
    ),
    createLinkRow(document, 'primary-cta', '#products', 'Shop Now'),
    createLinkRow(document, 'secondary-cta', '#deals', 'View Deals'),
    createTextRow(document, 'status-badge-1', 'SYS: MCX-2026'),
    createTextRow(document, 'status-badge-2', 'STATUS: ACTIVE'),
    createTextRow(document, 'status-badge-3', 'PATRON: AUTHORIZED'),
    createTextRow(document, 'stat-1-value', '20%+'),
    createTextRow(document, 'stat-1-label', 'Average Savings'),
    createTextRow(document, 'stat-2-value', '33M+'),
    createTextRow(document, 'stat-2-label', 'Yearly Transactions'),
    createTextRow(document, 'stat-3-value', 'Tax Free'),
    createTextRow(document, 'stat-3-label', 'Exclusive Benefit'),
    createTextRow(document, 'stat-4-value', '127+'),
    createTextRow(document, 'stat-4-label', 'Store Locations'),
  );

  section.append(block);
  document.body.append(section);
  return { section, block };
}

async function withFakeDom(fn) {
  const document = new FakeDocument();
  const window = new FakeWindow(document);
  const previousGlobals = {
    document: globalThis.document,
    window: globalThis.window,
  };

  globalThis.document = document;
  globalThis.window = window;

  try {
    await fn({ document, window });
  } finally {
    globalThis.document = previousGlobals.document;
    globalThis.window = previousGlobals.window;
  }
}

test('mcx-hero renders authored content', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero/mcx-hero.js');
    const { section, block } = createAuthoredBlock(document);

    decorate(block);

    assert.equal(section.classList.contains('mcx-hero-section'), true);

    const hero = block.children[0];
    assert.equal(hero.className, 'hero');
    assert.equal(hero.querySelector('.hero-eyebrow-txt')?.textContent, 'Spring Collection - 2026 - Tax-Free');
    assert.equal(hero.querySelectorAll('.h-stat').length, 4);
    assert.equal(hero.querySelectorAll('.h-dot').length, 3);
    assert.equal(hero.querySelector('.btn-hero')?.href, '#products');
    assert.equal(hero.querySelector('.btn-ghost')?.href, '#deals');
    assert.equal(hero.querySelector('.hero-photo')?.querySelector('img')?.alt, 'Marine Corps collection hero');
    assert.equal(hero.querySelector('.hero-rank'), null);
    assert.equal(hero.querySelector('.hero-scroll'), null);

    const heading = hero.querySelector('.hero-h1');
    assert.equal(heading?.children.length, 3);
    assert.equal(heading?.children[0]?.textContent, 'OUTFITTED');
    assert.equal(heading?.children[1]?.textContent, 'FOR THE');
    assert.equal(heading?.children[2]?.textContent, 'mission & beyond');
  });
});

test('mcx-hero falls back to library preview defaults', async () => {
  await withFakeDom(async ({ document, window }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero/mcx-hero.js');
    window.location.pathname = '/library/blocks/mcx-hero';
    window.location.href = 'https://example.com/library/blocks/mcx-hero';

    const section = document.createElement('div');
    section.className = 'section';
    const block = document.createElement('div');
    block.className = 'mcx-hero';
    section.append(block);
    document.body.append(section);

    decorate(block);

    const hero = block.children[0];
    assert.equal(hero.querySelector('.hero-eyebrow-txt')?.textContent, 'Spring Collection - 2026 - Tax-Free');
    assert.equal(hero.querySelector('.btn-hero')?.textContent.includes('Shop Now'), true);
    assert.equal(hero.querySelectorAll('.h-stat').length, 4);
  });
});
