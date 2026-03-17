const SOURCE_HOSTS = new Set(['da.live', 'www.da.live', 'content.da.live']);
const ALLOWED_BADGE_TONES = new Set(['exclusive', 'sale']);
const ALLOWED_SHIPPING_ICONS = new Set(['truck', 'shield', 'returns', 'store']);

const DEFAULT_EYEBROW = 'USMC Licensed Collection';
const DEFAULT_STOCK_MESSAGE = 'In Stock - Ships in 24hrs';
const DEFAULT_TAX_MESSAGE = 'Tax-Free for authorized patrons';
const DEFAULT_PROMO = Object.freeze({
  text: 'Extra 20% off with code',
  highlight: '20% off',
  code: 'SEMPERFI20',
  copyEnabled: true,
});
const DEFAULT_SHIPPING_CARDS = Object.freeze([
  {
    icon: 'store',
    title: 'Free Ship to Store',
    subtitle: '3-5 days stateside',
  },
  {
    icon: 'shield',
    title: 'Tax-Free',
    subtitle: 'All authorized patrons',
  },
  {
    icon: 'returns',
    title: 'Easy Returns',
    subtitle: '90-day return policy',
  },
]);
const DEFAULT_ACCORDION = Object.freeze({
  shippingHtml: `
    <p><strong>Ship to Store (Free):</strong> Order online and pick up at your nearest MCX in 3-5 business days stateside.</p>
    <p><strong>Standard Shipping:</strong> Free on eligible orders over $50, otherwise flat-rate shipping applies.</p>
    <p><strong>Express:</strong> Expedited delivery options appear at checkout for qualifying addresses.</p>
  `,
  returnsHtml: `
    <p>90-day hassle-free returns. Return items in store or send them back with your packing slip for a refund after inspection.</p>
    <p>Items should be unworn with original packaging and tags attached. Gift cards and personalized items are final sale.</p>
  `,
});
const DEFAULT_REVIEW_ITEMS = Object.freeze([
  {
    name: 'SSgt. Rivera',
    initials: 'SR',
    date: 'Mar 2, 2026',
    rating: 5,
    verified: true,
    body: 'Wore this through an entire field exercise week. Warm, holds up in the wash, and the embroidery looks sharp.',
  },
  {
    name: 'Cpl. Thompson',
    initials: 'CT',
    date: 'Feb 18, 2026',
    rating: 5,
    verified: true,
    body: 'Quality is better than what you find off base for this price. The pocket is deep enough for phone, keys, and gloves.',
  },
  {
    name: 'LCpl. Nguyen',
    initials: 'LN',
    date: 'Jan 29, 2026',
    rating: 4,
    verified: true,
    body: 'Solid hoodie with a good midweight feel. The navy color reads clean and works well with PT gear and jeans.',
  },
  {
    name: 'GySgt. Davis',
    initials: 'GD',
    date: 'Jan 12, 2026',
    rating: 5,
    verified: true,
    body: 'Third one I have bought. The older two are still going strong, so this was an easy recommendation for my son.',
  },
  {
    name: 'Sgt. Morales',
    initials: 'SM',
    date: 'Dec 28, 2025',
    rating: 5,
    verified: true,
    body: 'Warm enough for winter mornings without feeling bulky. After repeated washes the embroidery still looks new.',
  },
  {
    name: 'PFC. Williams',
    initials: 'PW',
    date: 'Dec 15, 2025',
    rating: 4,
    verified: false,
    body: 'Comfortable everyday hoodie with a soft lining. Would love even more color options, but the fit is on point.',
  },
]);
const DEFAULT_REVIEWS = Object.freeze({
  rating: 4.8,
  count: 342,
  distribution: [267, 48, 17, 7, 3],
});

function getCurrentOrigin() {
  if (typeof window === 'undefined') {
    return 'http://localhost';
  }

  return window.location.origin || new URL(window.location.href).origin;
}

function toText(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return fallback;
}

function clampRating(value, fallback) {
  return Math.max(1, Math.min(5, toNumber(value, fallback)));
}

function deriveInitials(name = '') {
  const segments = String(name)
    .split(/[\s.-]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return 'MC';
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment[0].toUpperCase())
    .join('');
}

function getAmountValue(amount) {
  if (amount == null) return 0;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'object') return toNumber(amount.value, 0);
  return toNumber(amount, 0);
}

function getAmountCurrency(amount, fallback = 'USD') {
  if (!amount || typeof amount !== 'object') {
    return fallback;
  }

  return toText(amount.currency, fallback);
}

function normalizeBadge(badge, fallback = {}) {
  const tone = toText(badge?.tone, fallback.tone || 'exclusive').toLowerCase();

  return {
    label: toText(badge?.label, fallback.label || ''),
    tone: ALLOWED_BADGE_TONES.has(tone) ? tone : 'exclusive',
  };
}

function normalizeShippingCard(card, index) {
  const fallback = DEFAULT_SHIPPING_CARDS[index] || DEFAULT_SHIPPING_CARDS.at(-1);
  const icon = toText(card?.icon, fallback.icon).toLowerCase();

  return {
    icon: ALLOWED_SHIPPING_ICONS.has(icon) ? icon : fallback.icon,
    title: toText(card?.title, fallback.title),
    subtitle: toText(card?.subtitle, fallback.subtitle),
  };
}

function normalizeDistribution(distribution) {
  if (Array.isArray(distribution)) {
    const normalized = distribution
      .slice(0, 5)
      .map((value, index) => Math.max(0, toNumber(value, DEFAULT_REVIEWS.distribution[index] || 0)));

    if (normalized.length === 5) {
      return normalized;
    }
  }

  if (distribution && typeof distribution === 'object') {
    return [5, 4, 3, 2, 1].map((rating, index) => Math.max(
      0,
      toNumber(distribution[rating], DEFAULT_REVIEWS.distribution[index] || 0),
    ));
  }

  return [...DEFAULT_REVIEWS.distribution];
}

function normalizeReviewItem(review, index) {
  const fallback = DEFAULT_REVIEW_ITEMS[index] || DEFAULT_REVIEW_ITEMS.at(-1);
  const name = toText(review?.name, fallback.name);

  return {
    name,
    initials: toText(review?.initials, deriveInitials(name) || fallback.initials),
    date: toText(review?.date, fallback.date),
    rating: clampRating(review?.rating, fallback.rating),
    verified: review?.verified == null ? fallback.verified : toBoolean(review.verified, fallback.verified),
    body: toText(review?.body, fallback.body),
  };
}

function normalizePromo(promo = {}) {
  return {
    text: toText(promo?.text, DEFAULT_PROMO.text),
    highlight: toText(promo?.highlight, DEFAULT_PROMO.highlight),
    code: toText(promo?.code, DEFAULT_PROMO.code),
    copyEnabled: promo?.copyEnabled == null
      ? DEFAULT_PROMO.copyEnabled
      : toBoolean(promo.copyEnabled, DEFAULT_PROMO.copyEnabled),
  };
}

function normalizeBreadcrumbs(breadcrumbs, productName) {
  if (Array.isArray(breadcrumbs) && breadcrumbs.length) {
    return breadcrumbs
      .map((entry) => ({
        label: toText(entry?.label),
        href: toText(entry?.href),
      }))
      .filter((entry) => entry.label);
  }

  return [
    { label: 'Home', href: '/' },
    { label: toText(productName, 'Product') },
  ];
}

function createDefaultBadges(product) {
  const badges = [
    {
      label: 'MCX Exclusive',
      tone: 'exclusive',
    },
  ];

  const { savingsPercent } = getPriceSummary(product);
  if (savingsPercent > 0) {
    badges.push({
      label: `Save ${savingsPercent}%`,
      tone: 'sale',
    });
  }

  return badges;
}

export function resolveExperienceDataSourceUrl(rawSource, origin = getCurrentOrigin()) {
  const source = toText(rawSource);
  if (!source) {
    throw new Error('Product details experience data source requires a JSON path.');
  }

  const url = new URL(source, origin);
  if (!/\.json($|\?)/i.test(url.pathname)) {
    throw new Error('Product details experience data source must point to a JSON file.');
  }

  if (url.origin === origin || SOURCE_HOSTS.has(url.hostname)) {
    return url.toString();
  }

  throw new Error('Product details experience data source must be repo-relative or hosted on da.live.');
}

export async function fetchExperienceOverrides(rawSource) {
  const source = toText(rawSource);
  if (!source) {
    return {};
  }

  const url = resolveExperienceDataSourceUrl(source);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to load product details experience data (${response.status}).`);
  }

  return response.json();
}

export function getPriceSummary(product = {}) {
  const prices = product?.prices || {};
  const final = prices.final || {};
  const regular = prices.regular || {};

  const minimumAmount = getAmountValue(final.amount ?? final.minimumAmount);
  const maximumAmount = getAmountValue(final.maximumAmount ?? final.amount ?? final.minimumAmount);
  const currentAmount = minimumAmount || maximumAmount;
  const regularAmount = getAmountValue(regular.amount);
  const currency = getAmountCurrency(
    final.amount ?? final.minimumAmount ?? final.maximumAmount,
    toText(final.currency, toText(regular.currency, 'USD')),
  );
  const savingsAmount = regularAmount > currentAmount ? regularAmount - currentAmount : 0;
  const savingsPercent = savingsAmount > 0 && regularAmount > 0
    ? Math.round((savingsAmount / regularAmount) * 100)
    : 0;

  return {
    currency,
    currentAmount,
    minimumAmount: minimumAmount || currentAmount,
    maximumAmount: maximumAmount || currentAmount,
    regularAmount,
    savingsAmount,
    savingsPercent,
    isRange: maximumAmount > minimumAmount,
  };
}

export function buildExperienceModel(product = {}, overrides = {}) {
  const priceSummary = getPriceSummary(product);
  const breadcrumbs = normalizeBreadcrumbs(overrides?.breadcrumbs, product?.name);
  const badgesSource = Array.isArray(overrides?.badges) && overrides.badges.length
    ? overrides.badges
    : createDefaultBadges(product);
  const shippingCardsSource = Array.isArray(overrides?.shippingCards) && overrides.shippingCards.length
    ? overrides.shippingCards
    : DEFAULT_SHIPPING_CARDS;
  const distribution = normalizeDistribution(overrides?.reviews?.distribution);
  const reviewCount = toNumber(
    overrides?.reviews?.count,
    distribution.reduce((sum, count) => sum + count, 0) || DEFAULT_REVIEWS.count,
  );
  const reviewItemsSource = Array.isArray(overrides?.reviews?.items) && overrides.reviews.items.length
    ? overrides.reviews.items
    : DEFAULT_REVIEW_ITEMS;

  return {
    breadcrumbs,
    eyebrow: toText(overrides?.eyebrow, DEFAULT_EYEBROW),
    badges: badgesSource.map((badge, index) => normalizeBadge(
      badge,
      createDefaultBadges(product)[index] || createDefaultBadges(product).at(-1),
    )),
    promo: normalizePromo(overrides?.promo),
    shippingCards: shippingCardsSource.map(normalizeShippingCard),
    accordion: {
      shippingHtml: toText(overrides?.accordion?.shippingHtml, DEFAULT_ACCORDION.shippingHtml),
      returnsHtml: toText(overrides?.accordion?.returnsHtml, DEFAULT_ACCORDION.returnsHtml),
    },
    reviews: {
      rating: clampRating(overrides?.reviews?.rating, DEFAULT_REVIEWS.rating),
      count: reviewCount,
      distribution,
      items: reviewItemsSource.map(normalizeReviewItem),
    },
    stockMessage: toText(overrides?.stockMessage, DEFAULT_STOCK_MESSAGE),
    stickyName: toText(overrides?.stickyName, product?.name || 'MCX Product'),
    taxMessage: toText(overrides?.taxMessage, DEFAULT_TAX_MESSAGE),
    priceSummary,
  };
}
