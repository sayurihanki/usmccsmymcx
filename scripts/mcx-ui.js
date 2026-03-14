const CART_STORAGE_KEY = 'mcx-demo-cart';

function formatPrice(value) {
  const amount = Number.parseFloat(value);
  return Number.isNaN(amount) ? '$0.00' : `$${amount.toFixed(2)}`;
}

function getProductData(card) {
  return {
    brand: card.dataset.brand || '',
    category: card.dataset.cat || 'all',
    chip: card.dataset.chip || '',
    emoji: card.dataset.emoji || '◆',
    flags: (card.dataset.flags || '').split(',').map((entry) => entry.trim()).filter(Boolean),
    name: card.dataset.name || '',
    original: card.dataset.original || '',
    price: Number.parseFloat(card.dataset.price || '0'),
    rating: card.dataset.rating || '5',
    reviews: card.dataset.reviews || '0',
    sizes: (card.dataset.sizes || '').split(',').map((entry) => entry.trim()).filter(Boolean),
    image: card.querySelector('.prod-img img, .prod-img')?.getAttribute('src') || '',
  };
}

function getCards() {
  return [...document.querySelectorAll('.mcx-product-cards .prod-card')];
}

function readCart(cards) {
  try {
    const saved = window.sessionStorage.getItem(CART_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    // Ignore storage failures and use the seeded demo cart instead.
  }

  const seeded = cards.slice(0, 3).map((card) => {
    const product = getProductData(card);
    return { ...product, qty: 1 };
  });

  return seeded;
}

function persistCart(cart) {
  try {
    window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    // Ignore storage failures in local/demo mode.
  }
}

function createToastStack() {
  const stack = document.createElement('div');
  stack.className = 'toast-stack';
  stack.id = 'mcx-toast-stack';
  document.body.append(stack);
  return stack;
}

function showToast(title, subtitle = '', type = 'green') {
  const stack = document.getElementById('mcx-toast-stack') || createToastStack();
  const toast = document.createElement('div');
  toast.className = 'toast';

  const icon = document.createElement('div');
  icon.className = `t-ico ${type}`;
  icon.textContent = type === 'green' ? '✓' : '♥';

  const copy = document.createElement('div');
  const heading = document.createElement('div');
  heading.className = 't-title';
  heading.textContent = title;
  const sub = document.createElement('div');
  sub.className = 't-sub';
  sub.textContent = subtitle;
  copy.append(heading, sub);

  toast.append(icon, copy);
  stack.append(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function createBackToTopButton() {
  const button = document.createElement('button');
  button.className = 'b2t';
  button.type = 'button';
  button.setAttribute('aria-label', 'Back to top');
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"></path></svg>';
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.append(button);
  return button;
}

function createCursor() {
  if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  const ring = document.createElement('div');
  ring.id = 'cursor-ring';
  document.body.append(dot, ring);

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;

  document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
  });

  (function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    window.requestAnimationFrame(animateRing);
  }());

  document.addEventListener('mouseover', (event) => {
    if (event.target.closest('a, button, input, .prod-card, .cat-tile, .brand-pill, .soc')) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (event) => {
    if (event.target.closest('a, button, input, .prod-card, .cat-tile, .brand-pill, .soc')) {
      document.body.classList.remove('cursor-hover');
    }
  });

  document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
  document.addEventListener('mouseup', () => document.body.classList.remove('cursor-click'));
}

function createCartElements() {
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.setAttribute('data-mcx-drawer-overlay', 'true');

  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="drawer-head">
      <h3>Your Cart <span class="drawer-count" data-mcx-drawer-count="true">(0)</span></h3>
      <button class="drawer-close" type="button" aria-label="Close cart drawer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"></path></svg>
      </button>
    </div>
    <div class="drawer-items" data-mcx-drawer-items="true"></div>
    <div class="drawer-foot">
      <div class="cart-subtotal">
        <span>Subtotal</span>
        <strong data-mcx-drawer-total="true">$0.00</strong>
      </div>
      <button class="btn-checkout" type="button">Checkout - Tax Free</button>
      <button class="btn-continue" type="button">Continue Shopping</button>
    </div>
  `;

  document.body.append(overlay, drawer);
  return { overlay, drawer };
}

function createModalElements() {
  const modalBg = document.createElement('div');
  modalBg.className = 'modal-bg';
  modalBg.setAttribute('aria-hidden', 'true');
  modalBg.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="Quick view">
      <div class="modal-img" data-mcx-modal-image="true">
        <button class="modal-close" type="button" aria-label="Close quick view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="modal-content" data-mcx-modal-content="true"></div>
    </div>
  `;
  document.body.append(modalBg);
  return modalBg;
}

function updateCartCount(cart) {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('[data-mcx-cart-count]').forEach((node) => {
    node.textContent = String(totalQty);
    node.style.transform = 'scale(1.7)';
    window.setTimeout(() => {
      node.style.transform = '';
    }, 300);
  });

  const drawerCount = document.querySelector('[data-mcx-drawer-count]');
  if (drawerCount) drawerCount.textContent = `(${totalQty})`;
}

function renderCart(cart) {
  const items = document.querySelector('[data-mcx-drawer-items]');
  const total = document.querySelector('[data-mcx-drawer-total]');
  if (!items || !total) return;

  updateCartCount(cart);
  total.textContent = formatPrice(cart.reduce((sum, item) => sum + (item.price * item.qty), 0));

  if (!cart.length) {
    items.replaceChildren(Object.assign(document.createElement('div'), {
      className: 'mcx-empty-state',
      textContent: 'CART IS EMPTY',
    }));
    return;
  }

  const fragment = document.createDocumentFragment();
  cart.forEach((item, index) => {
    const line = document.createElement('div');
    line.className = 'cart-line';
    line.innerHTML = `
      <div class="cart-thumb"><div class="thumb-ph">${item.emoji}</div></div>
      <div class="cart-meta">
        <div class="cart-brand">${item.brand}</div>
        <div class="cart-name">${item.name}</div>
        <div class="cart-row">
          <div class="cart-qty">
            <button class="qty-btn" type="button" data-mcx-qty="${index}" data-mcx-delta="-1">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" type="button" data-mcx-qty="${index}" data-mcx-delta="1">+</button>
          </div>
          <span class="cart-price">${formatPrice(item.price * item.qty)}</span>
        </div>
      </div>
    `;
    fragment.append(line);
  });
  items.replaceChildren(fragment);
}

function initDrawer(cartRef) {
  const { overlay, drawer } = createCartElements();
  const closeButtons = [drawer.querySelector('.drawer-close'), drawer.querySelector('.btn-continue')];

  function openCart() {
    drawer.classList.add('open');
    overlay.classList.add('on');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeCart() {
    drawer.classList.remove('open');
    overlay.classList.remove('on');
    drawer.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-mcx-cart-toggle]');
    if (toggle) {
      openCart();
    }

    if (event.target.closest('.drawer-overlay')) {
      closeCart();
    }

    if (event.target.closest('.drawer-close') || event.target.closest('.btn-continue')) {
      closeCart();
    }

    const qtyButton = event.target.closest('[data-mcx-qty]');
    if (qtyButton) {
      const index = Number.parseInt(qtyButton.dataset.mcxQty, 10);
      const delta = Number.parseInt(qtyButton.dataset.mcxDelta, 10);
      cartRef.items[index].qty = Math.max(0, cartRef.items[index].qty + delta);
      if (cartRef.items[index].qty === 0) cartRef.items.splice(index, 1);
      persistCart(cartRef.items);
      renderCart(cartRef.items);
    }
  });

  closeButtons.forEach((button) => button?.addEventListener('click', closeCart));
  overlay.addEventListener('click', closeCart);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCart();
  });

  return { openCart, closeCart };
}

function initModal(cartRef) {
  const modal = createModalElements();
  const modalContent = modal.querySelector('[data-mcx-modal-content]');
  const modalImage = modal.querySelector('[data-mcx-modal-image]');

  function closeModal() {
    modal.classList.remove('on');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function addToCart(product) {
    const existing = cartRef.items.find((item) => item.name === product.name);
    if (existing) existing.qty += 1;
    else cartRef.items.push({ ...product, qty: 1 });

    persistCart(cartRef.items);
    renderCart(cartRef.items);
    showToast('Added to Cart!', product.name);
    closeModal();
  }

  function openModal(card) {
    const product = getProductData(card);
    const { category, sizes: configuredSizes } = product;
    modalImage.querySelector('img')?.remove();

    if (product.image) {
      const image = document.createElement('img');
      image.alt = product.name;
      image.src = product.image;
      modalImage.prepend(image);
    }

    let sizes = configuredSizes;
    if (!sizes.length && ['apparel', 'footwear'].includes(category)) {
      sizes = ['XS', 'S', 'M', 'L', 'XL'];
    }

    modalContent.innerHTML = `
      <div class="modal-brand">${product.brand}</div>
      <div class="modal-name">${product.name}</div>
      <div class="modal-stars">
        <span style="color: var(--gold)">${'★'.repeat(Math.round(Number.parseFloat(product.rating) || 5))}</span>
        <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim)">${product.reviews} reviews</span>
      </div>
      <div class="modal-price">${formatPrice(product.price)}${product.original ? `<span>${formatPrice(product.original)}</span>` : ''}</div>
      ${product.chip ? `<div class="p-chip">${product.chip}</div>` : ''}
      <div class="modal-desc">Premium quality from a trusted brand - available tax-free exclusively for authorized MCX patrons. Ships in 3 to 5 business days or pick up at your nearest MCX location.</div>
      ${sizes.length ? `<div><div class="sec-label">Select Size</div><div class="modal-sizes">${sizes.map((size, index) => `<button class="size-btn${index === 2 ? ' on' : ''}" type="button">${size}</button>`).join('')}</div></div>` : ''}
      <button class="modal-atc" type="button">Add to Cart - ${formatPrice(product.price)}</button>
      <div style="font-family: var(--font-mono); font-size: 9.5px; color: var(--text-dim); text-align: center; letter-spacing: 0.12em;">TAX-FREE - FREE SHIP $50+ - EASY RETURNS</div>
    `;

    modal.querySelector('.modal-atc')?.addEventListener('click', () => addToCart(product), { once: true });
    modal.querySelectorAll('.size-btn').forEach((button) => {
      button.addEventListener('click', () => {
        modal.querySelectorAll('.size-btn').forEach((node) => node.classList.remove('on'));
        button.classList.add('on');
      });
    });

    modal.classList.add('on');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close')?.focus();
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('.modal-close')) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  return { openModal, closeModal };
}

function initScrollEffects(backToTop) {
  const header = document.querySelector('header .header');
  const heroGrid = document.querySelector('.mcx-hero .hero-grid');

  const handleScroll = () => {
    const offset = window.scrollY;
    header?.classList.toggle('scrolled', offset > 20);
    backToTop.classList.toggle('on', offset > 500);
    if (heroGrid) heroGrid.style.transform = `translateY(${offset * 0.25}px)`;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

function initRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
}

function initHeroDots() {
  const dots = [...document.querySelectorAll('.mcx-hero .h-dot')];
  if (!dots.length) return;
  let current = 0;

  const activate = (index) => {
    dots.forEach((dot, dotIndex) => dot.classList.toggle('on', dotIndex === index));
    current = index;
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => activate(index));
  });

  window.setInterval(() => activate((current + 1) % dots.length), 4500);
}

function initTabs() {
  document.querySelectorAll('.mcx-product-cards').forEach((block) => {
    const buttons = [...block.querySelectorAll('.ptab')];
    const cards = [...block.querySelectorAll('.prod-card')];
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((node) => node.classList.remove('on'));
        button.classList.add('on');
        const category = button.dataset.tab;
        cards.forEach((card) => {
          const match = category === 'all' || card.dataset.cat === category;
          card.style.display = match ? '' : 'none';
        });
      });
    });
  });
}

function initCountdown() {
  document.querySelectorAll('.mcx-deal-countdown .deal-strip').forEach((strip) => {
    const end = strip.dataset.countdownEnd ? new Date(strip.dataset.countdownEnd) : null;
    if (!end || Number.isNaN(end.getTime())) return;

    const targets = {
      days: strip.querySelector('[data-countdown-days]'),
      hours: strip.querySelector('[data-countdown-hours]'),
      minutes: strip.querySelector('[data-countdown-minutes]'),
      seconds: strip.querySelector('[data-countdown-seconds]'),
    };
    const cta = strip.querySelector('.btn-deal');
    const note = strip.querySelector('.deal-cta p');

    const update = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        Object.values(targets).forEach((node) => {
          if (node) node.textContent = '00';
        });
        if (note) note.textContent = strip.dataset.endedText || 'Ended';
        if (cta && strip.dataset.hideCtaWhenEnded === 'true') cta.style.display = 'none';
        return;
      }

      const values = {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };

      Object.entries(values).forEach(([key, value]) => {
        const nextValue = String(value).padStart(2, '0');
        if (targets[key] && targets[key].textContent !== nextValue) {
          targets[key].style.transform = 'translateY(-4px)';
          targets[key].style.opacity = '0.4';
          targets[key].textContent = nextValue;
          window.setTimeout(() => {
            targets[key].style.transform = '';
            targets[key].style.opacity = '';
          }, 180);
        }
      });
    };

    update();
    window.setInterval(update, 1000);
  });
}

function initSearchShortcut() {
  const input = document.querySelector('[data-mcx-search-input]');
  if (!input) return;

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input.focus();
    }
  });
}

function initNewsletter() {
  document.querySelectorAll('[data-mcx-newsletter]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      showToast('Subscribed!', 'You are now on the MCX insider list.', 'green');
      form.reset();
    });
  });
}

function initProductInteractions(modalApi, cartRef) {
  const cards = getCards();

  document.addEventListener('click', (event) => {
    const quickButton = event.target.closest('.prod-quick');
    if (quickButton) {
      const card = quickButton.closest('.prod-card');
      if (card) modalApi.openModal(card);
      return;
    }

    const loveButton = event.target.closest('.prod-love');
    if (loveButton) {
      loveButton.classList.toggle('loved');
      const card = loveButton.closest('.prod-card');
      showToast(
        loveButton.classList.contains('loved') ? 'Saved to Wishlist' : 'Removed from Wishlist',
        card?.dataset.name || '',
        loveButton.classList.contains('loved') ? 'red' : 'green',
      );
      return;
    }

    const card = event.target.closest('.prod-card');
    if (card && !event.target.closest('.prod-love')) {
      modalApi.openModal(card);
    }
  });

  cartRef.items = readCart(cards);
  persistCart(cartRef.items);
}

export default function initMcxUi() {
  if (!document.body.classList.contains('mcx')) return;

  const cartRef = { items: [] };
  const backToTop = createBackToTopButton();
  createToastStack();
  createCursor();

  initDrawer(cartRef);
  const modalApi = initModal(cartRef);

  initRevealObserver();
  initScrollEffects(backToTop);
  initHeroDots();
  initTabs();
  initCountdown();
  initSearchShortcut();
  initNewsletter();
  initProductInteractions(modalApi, cartRef);
  renderCart(cartRef.items);
}
