import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';

import { getMetadata, toClassName } from '../../scripts/aem.js';
import {
  fetchPlaceholders,
  getProductLink,
  getSearchContext,
  rootLink,
} from '../../scripts/commerce.js';

const LIVE_SEARCH_PAGE_SIZE = 5;
const LIVE_SEARCH_MIN_QUERY_LENGTH = 2;
const LIVE_SEARCH_DEBOUNCE_MS = 90;

let liveSearchCounter = 0;

function iconMarkup(name) {
  const icons = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    stores: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  };

  return icons[name] || '';
}

function normalizePath(value = '/') {
  try {
    const url = new URL(value, window.location.origin);
    const path = url.pathname.replace(/\/+$/, '');
    return path || '/';
  } catch {
    const path = String(value).trim().replace(/\/+$/, '');
    return path || '/';
  }
}

function getSafeAemAlias(product) {
  const rawAlias = product?.urlKey || product?.sku || 'product-image';
  return encodeURIComponent(rawAlias);
}

function getUniqueLiveSearchScope() {
  if (window.crypto?.randomUUID) {
    return `mcx-header-live-${window.crypto.randomUUID()}`;
  }

  liveSearchCounter += 1;
  return `mcx-header-live-${liveSearchCounter}`;
}

function resolveActiveIndex(navItems) {
  const currentPath = normalizePath(window.location.pathname);
  const matchIndex = navItems.findIndex(({ url }) => {
    const itemPath = normalizePath(url);
    return itemPath !== '/' && currentPath.startsWith(itemPath);
  });

  return matchIndex >= 0 ? matchIndex : 0;
}

function createLogo() {
  const link = document.createElement('a');
  link.className = 'logo';
  link.href = '/';
  link.setAttribute('aria-label', 'MCX home');
  link.innerHTML = `
    <div class="logo-emblem" aria-hidden="true">
      <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="23" cy="23" r="22" fill="#C1121F" opacity="0.15"></circle>
        <circle cx="23" cy="23" r="22" stroke="#C1121F" stroke-width="1" opacity="0.4"></circle>
        <path d="M23 6L10 12V22C10 29.73 15.8 37.04 23 39C30.2 37.04 36 29.73 36 22V12L23 6Z" fill="rgba(193,18,31,0.25)" stroke="rgba(193,18,31,0.7)" stroke-width="1.2"></path>
        <path d="M23 13L17 16V21C17 24.87 19.7 28.48 23 29.5C26.3 28.48 29 24.87 29 21V16L23 13Z" fill="white" fill-opacity="0.85"></path>
        <circle cx="23" cy="21" r="4" fill="#C1121F"></circle>
        <circle cx="23" cy="21" r="1.5" fill="white"></circle>
      </svg>
    </div>
    <div class="logo-text">
      <div class="logo-mcx">MCX</div>
      <div class="logo-tagline">Marine Corps Exchange</div>
    </div>
  `;
  return link;
}

function createSearchForm(placeholder) {
  const search = document.createElement('form');
  search.className = 'hdr-search';
  search.setAttribute('role', 'search');
  search.setAttribute('action', rootLink('/search'));
  search.setAttribute('method', 'get');
  search.setAttribute('aria-expanded', 'false');
  search.dataset.searchStatus = 'idle';

  const icon = document.createElement('span');
  icon.className = 'search-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = iconMarkup('search');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.setAttribute('aria-label', 'Search products');
  input.setAttribute('data-mcx-search-input', 'true');
  input.placeholder = placeholder;

  const shortcut = document.createElement('span');
  shortcut.className = 'search-shortcut';
  shortcut.setAttribute('aria-hidden', 'true');
  shortcut.textContent = 'Ctrl K';

  const results = document.createElement('div');
  results.className = 'hdr-search-results';
  results.setAttribute('aria-hidden', 'true');
  results.setAttribute('aria-busy', 'false');
  results.setAttribute('data-mcx-live-search', 'true');
  results.setAttribute('hidden', '');

  const liveRegion = document.createElement('div');
  liveRegion.className = 'hdr-search-status';
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');

  search.append(icon, input, shortcut, results, liveRegion);
  return search;
}

function getDefaultData() {
  return {
    configs: {
      searchPlaceholder: 'Search products, brands, gear...',
      hotLabel: 'Deals & Offers',
      hotUrl: '/deals',
      signInLabel: 'Sign In',
      signInUrl: '/account',
    },
    navItems: [
      {
        label: 'Shop All',
        url: '/shop',
        groups: [],
        features: [],
      },
      {
        label: 'Apparel & Footwear',
        url: '/apparel-footwear',
        groups: [
          { label: "Men's", links: ['Uniforms & Cammies', 'T-Shirts & Polos', 'Athletic Wear', 'Outerwear', 'Pants & Shorts', 'Dress Attire'].map((text) => ({ text, url: '/apparel-footwear' })) },
          { label: "Women's", links: ['Uniforms', 'Activewear', 'Casual Wear', 'Outerwear', 'Loungewear', 'Accessories'].map((text) => ({ text, url: '/apparel-footwear' })) },
          { label: 'Footwear', links: ['Tactical Boots', 'Athletic Shoes', 'Dress Shoes', 'Sandals & Slides', 'Work & Safety'].map((text) => ({ text, url: '/apparel-footwear' })) },
        ],
        features: [
          { text: 'Clearance Apparel', url: '/clearance' },
          { text: 'Top Rated Boots', url: '/boots' },
          { text: 'New Arrivals', url: '/new' },
        ],
      },
      {
        label: 'Electronics',
        url: '/electronics',
        groups: [
          { label: 'Computers', links: ['MacBooks & Laptops', 'Tablets & iPads', 'Monitors', 'Accessories'].map((text) => ({ text, url: '/electronics' })) },
          { label: 'Mobile & Audio', links: ['Smartphones', 'Headphones', 'Earbuds', 'Speakers', 'Smart Watches'].map((text) => ({ text, url: '/electronics' })) },
          { label: 'Gaming', links: ['Consoles', 'Games & Software', 'Controllers', 'Gaming Chairs'].map((text) => ({ text, url: '/electronics' })) },
        ],
        features: [
          { text: 'Apple Products', url: '/electronics/apple' },
          { text: 'Gaming Deals', url: '/electronics/gaming' },
        ],
      },
      {
        label: 'Home & Living',
        url: '/home',
        groups: [
          { label: 'Furniture', links: ['Bedroom', 'Living Room', 'Office', 'Outdoor Living'].map((text) => ({ text, url: '/home' })) },
          { label: 'Kitchen', links: ['Appliances', 'Cookware', 'Dining', 'Food Storage'].map((text) => ({ text, url: '/home' })) },
          { label: 'Bedding & Bath', links: ['Bed Sheets', 'Comforters', 'Pillows', 'Towels'].map((text) => ({ text, url: '/home' })) },
        ],
        features: [],
      },
      {
        label: 'Sports & Outdoors',
        url: '/sports-outdoors',
        groups: [],
        features: [],
      },
      {
        label: 'Uniforms',
        url: '/uniforms',
        groups: [],
        features: [],
      },
      {
        label: 'Kids & Toys',
        url: '/kids-toys',
        groups: [],
        features: [],
      },
    ],
  };
}

async function fetchFragmentDocument(path) {
  const response = await fetch(`${path}.plain.html`);
  if (!response.ok) throw new Error(`Unable to load fragment: ${path}`);
  const main = document.createElement('main');
  main.innerHTML = await response.text();
  return main;
}

function normalizeConfigKey(key) {
  const aliasMap = {
    'search-placeholder': 'searchPlaceholder',
    'hot-label': 'hotLabel',
    'hot-url': 'hotUrl',
    'sign-in-label': 'signInLabel',
    'sign-in-url': 'signInUrl',
  };

  return aliasMap[key] || key;
}

function upsertNavItem(items, label, url = '#') {
  let item = items.find((entry) => entry.label === label);
  if (!item) {
    item = {
      label,
      url: url || '#',
      groups: [],
      features: [],
    };
    items.push(item);
  }
  if (url) item.url = url;
  return item;
}

function upsertGroup(item, label) {
  let group = item.groups.find((entry) => entry.label === label);
  if (!group) {
    group = {
      label,
      links: [],
    };
    item.groups.push(group);
  }
  return group;
}

function parseNavData(main) {
  const dataBlock = main.querySelector('.mcx-nav-data');
  if (!dataBlock) return getDefaultData();

  const data = {
    configs: {
      searchPlaceholder: 'Search products, brands, gear...',
      hotLabel: 'Deals & Offers',
      hotUrl: '/deals',
      signInLabel: 'Sign In',
      signInUrl: '/account',
    },
    navItems: [],
  };

  [...dataBlock.children].forEach((row) => {
    const cells = [...row.children].map((cell) => cell.textContent.trim());
    const [type, parent, label, value] = cells;
    if (!type) return;

    const normalizedType = toClassName(type);

    if (normalizedType === 'config') {
      data.configs[normalizeConfigKey(toClassName(label))] = value;
      return;
    }

    if (normalizedType === 'hot') {
      data.configs.hotLabel = label;
      data.configs.hotUrl = value;
      return;
    }

    if (normalizedType === 'item') {
      upsertNavItem(data.navItems, label, value);
      return;
    }

    if (normalizedType === 'group') {
      const item = upsertNavItem(data.navItems, parent);
      upsertGroup(item, label);
      return;
    }

    if (normalizedType === 'link') {
      const [itemLabel, groupLabel] = parent.split('>').map((entry) => entry.trim());
      const item = upsertNavItem(data.navItems, itemLabel);
      const group = upsertGroup(item, groupLabel);
      group.links.push({ text: label, url: value || '#' });
      return;
    }

    if (normalizedType === 'feature') {
      const item = upsertNavItem(data.navItems, parent);
      item.features.push({ text: label, url: value || '#' });
    }
  });

  return data.navItems.length ? data : getDefaultData();
}

function createActionButton(kind, label, href = '#') {
  const linkKinds = new Set(['stores', 'wishlist', 'cart', 'signin']);
  const isLink = linkKinds.has(kind);
  const element = document.createElement(isLink ? 'a' : 'button');
  element.className = `hdr-act${kind === 'signin' ? ' hdr-signin' : ''}`;
  if (isLink) {
    element.href = href || '#';
  } else {
    element.type = 'button';
  }

  let iconName = kind;
  if (kind === 'wishlist') iconName = 'heart';
  if (kind === 'signin') iconName = 'user';

  element.innerHTML = `${iconMarkup(iconName)}${label ? `<span>${label}</span>` : ''}`;

  if (kind === 'cart') {
    const dot = document.createElement('span');
    dot.className = 'cart-dot';
    dot.dataset.mcxCartCount = 'true';
    dot.textContent = '0';
    element.append(dot);
  }

  return element;
}

function buildMegaMenu(item) {
  if (!item.groups.length) return null;

  const mega = document.createElement('div');
  mega.className = 'mega';
  mega.setAttribute('role', 'group');
  mega.setAttribute('aria-label', `${item.label} categories`);

  const columns = document.createElement('div');
  columns.className = 'mega-cols';

  item.groups.forEach((group) => {
    const column = document.createElement('div');
    column.className = 'mega-col';

    const title = document.createElement('h4');
    title.textContent = group.label;
    column.append(title);

    const list = document.createElement('ul');
    group.links.forEach((linkData) => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = linkData.url;
      link.textContent = linkData.text;
      listItem.append(link);
      list.append(listItem);
    });

    column.append(list);
    columns.append(column);
  });

  mega.append(columns);

  if (item.features.length) {
    const featureRow = document.createElement('div');
    featureRow.className = 'mega-ft';
    item.features.forEach((feature) => {
      const link = document.createElement('a');
      link.className = 'mega-ft-tag';
      link.href = feature.url;
      link.textContent = feature.text;
      featureRow.append(link);
    });
    mega.append(featureRow);
  }

  return mega;
}

function buildHeaderDom(data) {
  const shell = document.createElement('div');
  shell.className = 'header';
  const activeIndex = resolveActiveIndex(data.navItems);

  const mainBar = document.createElement('div');
  mainBar.className = 'hdr-main';
  mainBar.append(createLogo());

  const search = createSearchForm(data.configs.searchPlaceholder);
  mainBar.append(search);

  const actions = document.createElement('div');
  actions.className = 'hdr-actions';
  actions.append(
    createActionButton('stores', 'Stores', '/stores'),
    createActionButton('wishlist', '', '/wishlist'),
    createActionButton('cart', '', '/cart'),
    createActionButton('signin', data.configs.signInLabel, data.configs.signInUrl),
  );
  mainBar.append(actions);
  shell.append(mainBar);

  const nav = document.createElement('nav');
  nav.className = 'nav-bar';
  const navInner = document.createElement('div');
  navInner.className = 'nav-inner';

  data.navItems.forEach((item, index) => {
    const navItem = document.createElement('div');
    navItem.className = 'nav-item';

    const link = document.createElement('a');
    const isActive = index === activeIndex;
    link.className = `nav-link${isActive ? ' on' : ''}`;
    link.href = item.url;
    link.innerHTML = `${item.label}${item.groups.length ? iconMarkup('chevron') : ''}`;
    if (isActive) link.setAttribute('aria-current', 'page');
    if (item.groups.length) {
      navItem.classList.add('has-mega');
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
    }
    navItem.append(link);

    const mega = buildMegaMenu(item);
    if (mega) navItem.append(mega);

    navInner.append(navItem);
  });

  const spacer = document.createElement('div');
  spacer.className = 'nav-spacer';
  navInner.append(spacer);

  const hotLink = document.createElement('a');
  hotLink.className = 'nav-hot';
  hotLink.href = data.configs.hotUrl;
  hotLink.textContent = data.configs.hotLabel;
  navInner.append(hotLink);

  nav.append(navInner);
  shell.append(nav);

  return shell;
}

function syncMegaOffsets(block) {
  const navInner = block.querySelector('.nav-inner');
  if (!navInner) return;

  navInner.querySelectorAll('.nav-item.has-mega').forEach((item) => {
    item.style.setProperty('--mega-shift', `${item.offsetLeft}px`);
  });
}

function bindMegaState(block) {
  const navItems = [...block.querySelectorAll('.nav-item.has-mega')];

  const setItemOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.nav-link')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  navItems.forEach((item) => {
    item.addEventListener('mouseenter', () => setItemOpen(item, true));
    item.addEventListener('mouseleave', () => setItemOpen(item, false));
    item.addEventListener('focusin', () => setItemOpen(item, true));
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) {
        setItemOpen(item, false);
      }
    });
  });
}

function setOpenState(searchForm, resultsPanel, isOpen) {
  searchForm.classList.toggle('is-open', isOpen);
  if (isOpen) {
    searchForm.classList.add('expanded');
    searchForm.setAttribute('aria-expanded', 'true');
    resultsPanel.classList.add('is-open');
    resultsPanel.removeAttribute('hidden');
    resultsPanel.setAttribute('aria-hidden', 'false');
    return;
  }

  searchForm.classList.remove('expanded');
  searchForm.setAttribute('aria-expanded', 'false');
  resultsPanel.classList.remove('is-open');
  resultsPanel.setAttribute('hidden', '');
  resultsPanel.setAttribute('aria-hidden', 'true');
}

async function enhanceLiveSearch(block) {
  const searchForm = block.querySelector('.hdr-search');
  const searchInput = searchForm?.querySelector('[data-mcx-search-input]');
  const resultsPanel = searchForm?.querySelector('[data-mcx-live-search]');
  const liveRegion = searchForm?.querySelector('.hdr-search-status');

  if (!searchForm || !searchInput || !resultsPanel || !liveRegion) {
    return;
  }

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery && !searchInput.value) {
    searchInput.value = initialQuery;
  }

  const searchScope = getUniqueLiveSearchScope();
  const resultsId = `${searchScope}-results`;
  resultsPanel.id = resultsId;
  resultsPanel.setAttribute('role', 'region');
  resultsPanel.setAttribute('aria-label', 'Live search results');
  searchInput.setAttribute('aria-controls', resultsId);
  searchInput.setAttribute('aria-expanded', 'false');
  searchInput.setAttribute('autocomplete', 'off');
  searchInput.setAttribute('spellcheck', 'false');

  let announceTimer;
  let debounceTimer;
  let latestTypedPhrase = '';
  let dispatchedPhrase = '';
  let latestResultCount = 0;
  let viewAllWrapper;
  let searchApi;
  let initializePromise;

  const announce = (message = '') => {
    if (announceTimer) {
      window.clearTimeout(announceTimer);
    }

    liveRegion.textContent = message;

    if (!message) {
      return;
    }

    announceTimer = window.setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  };

  const syncViewAllVisibility = () => {
    if (!viewAllWrapper) {
      return;
    }

    if (latestResultCount > 0) {
      viewAllWrapper.removeAttribute('hidden');
      return;
    }

    viewAllWrapper.setAttribute('hidden', '');
  };

  const closeResults = (message = '') => {
    resultsPanel.setAttribute('aria-busy', 'false');
    setOpenState(searchForm, resultsPanel, false);
    searchInput.setAttribute('aria-expanded', 'false');

    if (message) {
      announce(message);
    }
  };

  const ensureLiveSearch = async () => {
    if (searchApi) {
      return;
    }

    if (initializePromise) {
      await initializePromise;
      return;
    }

    initializePromise = (async () => {
      searchForm.dataset.searchStatus = 'loading';

      await import('../../scripts/initializers/search.js');

      const [
        { search },
        { render },
        { SearchResults },
        { events },
        labels,
      ] = await Promise.all([
        import('@dropins/storefront-product-discovery/api.js'),
        import('@dropins/storefront-product-discovery/render.js'),
        import('@dropins/storefront-product-discovery/containers/SearchResults.js'),
        import('@dropins/tools/event-bus.js'),
        fetchPlaceholders().catch(() => ({})),
      ]);

      searchApi = search;

      const uiText = {
        searchViewAll: labels.Global?.SearchViewAll || 'View all results',
        resultFound: labels.Global?.SearchResultFound || 'result found',
        resultsFound: labels.Global?.SearchResultsFound || 'results found',
        searchError: labels.Global?.SearchError || 'Search is temporarily unavailable',
        noResults: labels.Global?.SearchNoResults || 'No results found',
        resultsClosed: labels.Global?.SearchResultsClosed || 'Search results closed',
      };

      render.render(SearchResults, {
        scope: searchScope,
        skeletonCount: LIVE_SEARCH_PAGE_SIZE,
        imageWidth: 112,
        imageHeight: 112,
        routeProduct: ({ urlKey, sku }) => getProductLink(urlKey, sku),
        onSearchResult: (results) => {
          if (latestTypedPhrase !== dispatchedPhrase) {
            return;
          }

          latestResultCount = Array.isArray(results) ? results.length : 0;
          resultsPanel.setAttribute('aria-busy', 'false');
          setOpenState(searchForm, resultsPanel, true);
          searchInput.setAttribute('aria-expanded', 'true');
          syncViewAllVisibility();

          if (latestResultCount > 0) {
            announce(`${latestResultCount} ${latestResultCount === 1 ? uiText.resultFound : uiText.resultsFound}`);
            return;
          }

          announce(uiText.noResults);
        },
        slots: {
          ProductImage: (ctx) => {
            const { product, defaultImageProps } = ctx;
            const anchorWrapper = document.createElement('a');
            anchorWrapper.href = getProductLink(product.urlKey, product.sku);

            if (!defaultImageProps?.src) {
              ctx.replaceWith(anchorWrapper);
              return;
            }

            tryRenderAemAssetsImage(ctx, {
              alias: getSafeAemAlias(product),
              imageProps: defaultImageProps,
              wrapper: anchorWrapper,
              params: {
                width: defaultImageProps.width,
                height: defaultImageProps.height,
              },
            });
          },
          Footer: (ctx) => {
            viewAllWrapper = document.createElement('div');
            viewAllWrapper.className = 'hdr-search-footer';

            const viewAllLink = document.createElement('a');
            viewAllLink.className = 'hdr-search-view-all';
            viewAllLink.href = rootLink('/search');
            viewAllLink.textContent = uiText.searchViewAll;

            viewAllWrapper.append(viewAllLink);
            viewAllWrapper.setAttribute('hidden', '');
            ctx.appendChild(viewAllWrapper);

            ctx.onChange((next) => {
              viewAllLink.href = `${rootLink('/search')}?q=${encodeURIComponent(next.variables?.phrase || '')}`;
            });

            syncViewAllVisibility();
          },
        },
      })(resultsPanel);

      events.on('search/error', () => {
        if (!latestTypedPhrase || latestTypedPhrase.length < LIVE_SEARCH_MIN_QUERY_LENGTH) {
          return;
        }

        resultsPanel.setAttribute('aria-busy', 'false');
        setOpenState(searchForm, resultsPanel, true);
        searchInput.setAttribute('aria-expanded', 'true');
        latestResultCount = 0;
        syncViewAllVisibility();
        announce(uiText.searchError);
      }, { scope: searchScope });

      searchForm.dataset.searchStatus = 'ready';
    })().catch((error) => {
      searchForm.dataset.searchStatus = 'fallback';
      closeResults();
      // eslint-disable-next-line no-console
      console.error('mcx-header: live search unavailable. Falling back to submit-only mode.', error);
      throw error;
    });

    await initializePromise;
  };

  const scheduleSearch = async (rawPhrase) => {
    latestTypedPhrase = rawPhrase.trim();

    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }

    if (!latestTypedPhrase) {
      latestResultCount = 0;
      syncViewAllVisibility();
      if (searchApi) {
        searchApi(null, { scope: searchScope });
      }
      closeResults();
      return;
    }

    if (latestTypedPhrase.length < LIVE_SEARCH_MIN_QUERY_LENGTH) {
      closeResults();
      return;
    }

    try {
      await ensureLiveSearch();
    } catch {
      return;
    }

    debounceTimer = window.setTimeout(() => {
      if (!searchApi) {
        return;
      }

      dispatchedPhrase = latestTypedPhrase;
      latestResultCount = 0;
      syncViewAllVisibility();
      resultsPanel.setAttribute('aria-busy', 'true');
      setOpenState(searchForm, resultsPanel, true);
      searchInput.setAttribute('aria-expanded', 'true');

      searchApi({
        phrase: dispatchedPhrase,
        pageSize: LIVE_SEARCH_PAGE_SIZE,
        filter: [
          { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
        ],
        context: getSearchContext(),
      }, { scope: searchScope });
    }, LIVE_SEARCH_DEBOUNCE_MS);
  };

  searchForm.addEventListener('submit', () => {
    closeResults();
  });

  searchInput.addEventListener('input', (event) => {
    scheduleSearch(event.target.value || '');
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= LIVE_SEARCH_MIN_QUERY_LENGTH) {
      scheduleSearch(searchInput.value);
      return;
    }

    searchForm.classList.add('expanded');
  });

  searchInput.addEventListener('blur', () => {
    if (!searchForm.classList.contains('is-open')) {
      searchForm.classList.remove('expanded');
    }
  });

  document.addEventListener('click', (event) => {
    const targetSearchForm = event.target?.closest?.('.hdr-search');
    if (targetSearchForm === searchForm) {
      return;
    }

    closeResults();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !searchForm.classList.contains('is-open')) {
      return;
    }

    closeResults('Search results closed');
    searchInput.blur();
  });
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/fragments/mcx-nav';

  let data = getDefaultData();
  try {
    const fragment = await fetchFragmentDocument(navPath);
    data = parseNavData(fragment);
  } catch (error) {
    // Fall back to the bundled demo data when the authored fragment is unavailable.
  }

  block.replaceChildren(buildHeaderDom(data));
  bindMegaState(block);
  await enhanceLiveSearch(block);
  syncMegaOffsets(block);
  window.addEventListener('resize', () => syncMegaOffsets(block), { passive: true });
}
