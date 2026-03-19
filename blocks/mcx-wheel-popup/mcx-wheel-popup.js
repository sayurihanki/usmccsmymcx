import {
  cellText,
  createLink,
  extractLink,
  parseFieldRows,
} from '../../scripts/mcx-block-utils.js';
import { isMcxLibraryPreviewPath } from '../../scripts/mcx-preview.js';

const STORAGE_PREFIX = 'mcx_wheel_popup_seen_';
const SLICE_COUNT = 8;
const SLICE_COLORS = [
  '#7a1622',
  '#9a1724',
  '#c1121f',
  '#c08f20',
  '#7f1f27',
  '#a91b28',
  '#1f3142',
  '#b78518',
];

const DEFAULTS = {
  trigger: 'time',
  triggerDelay: 3,
  triggerScroll: 50,
  spinButtonText: 'Spin the Wheel',
  noThanksText: 'No thanks',
  copyButtonText: 'Copy Code',
  resultHeadline: 'Your Reward Is Ready',
  ctaText: 'Claim Reward',
};

function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeTrigger(value) {
  const normalized = (value || '').toString().trim().toLowerCase();
  return ['time', 'scroll', 'exit', 'immediate', 'first-interaction'].includes(normalized)
    ? normalized
    : DEFAULTS.trigger;
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number.parseFloat((value || '').toString().trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('//')) return '';

  if (['#', '/', './', '../', '?'].some((token) => trimmed.startsWith(token))) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    return '';
  }

  return '';
}

function getCampaignId(fields, block) {
  const authoredId = slugify(cellText(fields['campaign-id']));
  if (authoredId) return authoredId;

  const derivedId = slugify([
    cellText(fields['heading-line-1']),
    cellText(fields['heading-line-2']),
  ].filter(Boolean).join('-'));
  if (derivedId) return derivedId;

  const blockIndex = [...document.querySelectorAll('.mcx-wheel-popup')].indexOf(block);
  return `mcx-wheel-popup-${blockIndex}`;
}

function getStorageKey(campaignId) {
  return `${STORAGE_PREFIX}${campaignId}`;
}

function hasBeenSeen(campaignId) {
  try {
    return window.sessionStorage.getItem(getStorageKey(campaignId)) === '1';
  } catch {
    return false;
  }
}

function markSeen(campaignId) {
  try {
    window.sessionStorage.setItem(getStorageKey(campaignId), '1');
  } catch {
    // Ignore storage failures.
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function cloneCellContent(cell, target) {
  if (!cell || !target) return target;

  if (cell.childNodes?.length) {
    [...cell.childNodes].forEach((node) => {
      target.append(node.cloneNode ? node.cloneNode(true) : document.createTextNode(node.textContent || ''));
    });
  } else {
    const text = cellText(cell);
    if (text) target.textContent = text;
  }

  return target;
}

function createArrowSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', 'M5 12h14');
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M12 5l7 7-7 7');
  svg.append(line, arrow);
  return svg;
}

function buildCtaLink(className, linkData, fallbackText) {
  const href = sanitizeUrl(linkData.href);
  if (!href) return null;

  const text = linkData.text || fallbackText;
  const link = createLink(className, href, text);
  const label = document.createElement('span');
  label.textContent = text;
  link.replaceChildren(label, createArrowSvg());
  return link;
}

function setCopyFeedback(button, text, state) {
  button.textContent = text;
  button.dataset.copyState = state;
}

async function copyCode(code, button, defaultText) {
  let copied = false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      copied = true;
    } else if (typeof document.execCommand === 'function') {
      const field = document.createElement('textarea');
      field.value = code;
      field.setAttribute('aria-hidden', 'true');
      document.body.append(field);
      if (typeof field.select === 'function') field.select();
      copied = document.execCommand('copy');
      field.remove();
    }
  } catch {
    copied = false;
  }

  if (copied) {
    setCopyFeedback(button, 'Copied!', 'success');
  } else {
    setCopyFeedback(button, code, 'fallback');
  }

  window.setTimeout(() => {
    setCopyFeedback(button, defaultText, '');
  }, 1800);
}

function getFocusableElements(root) {
  return [...root.querySelectorAll('button, a[href]')].filter((node) => !node.disabled && !node.hidden);
}

function parseSliceLink(fields, index) {
  const ctaField = fields[`slice-${index}-cta`];
  if (!ctaField) return null;

  const extracted = extractLink(ctaField, DEFAULTS.ctaText);
  const href = sanitizeUrl(extracted.href);
  if (!href) return null;

  return {
    href,
    text: extracted.text || DEFAULTS.ctaText,
  };
}

function parseSlices(fields) {
  const slices = [];

  for (let index = 1; index <= SLICE_COUNT; index += 1) {
    const label = cellText(fields[`slice-${index}-label`]);
    const title = cellText(fields[`slice-${index}-title`]);
    const descriptionCell = fields[`slice-${index}-description`];

    if (!label || !title || !descriptionCell) return [];

    slices.push({
      label,
      title,
      descriptionCell,
      code: cellText(fields[`slice-${index}-code`]),
      cta: parseSliceLink(fields, index),
    });
  }

  return slices;
}

function buildWheel(slices) {
  const wheel = document.createElement('div');
  wheel.className = 'mwp-wheel';

  const degPer = 360 / slices.length;
  const stops = slices.map((_, index) => {
    const color = SLICE_COLORS[index % SLICE_COLORS.length];
    const start = (index * degPer).toFixed(4);
    const end = ((index + 1) * degPer).toFixed(4);
    return `${color} ${start}deg ${end}deg`;
  }).join(', ');
  wheel.style.background = `conic-gradient(from -90deg, ${stops})`;

  const dividers = document.createElement('div');
  dividers.className = 'mwp-dividers';

  const labelNodes = [];
  const labelOffset = 74;

  slices.forEach((slice, index) => {
    const divider = document.createElement('div');
    divider.className = 'mwp-divider';
    divider.style.transform = `rotate(${index * degPer}deg)`;
    dividers.append(divider);

    const label = document.createElement('div');
    label.className = 'mwp-label';
    label.dataset.sliceIndex = String(index + 1);
    label.textContent = slice.label;
    label.style.transform = `rotate(${(index + 0.5) * degPer}deg) translateX(${labelOffset}px)`;
    wheel.append(label);
    labelNodes.push(label);
  });

  const cap = document.createElement('div');
  cap.className = 'mwp-cap';
  cap.innerHTML = `
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="rgb(8 12 18 / 90%)"></circle>
      <path d="M16 6l2.8 6h6.5l-5.1 4 1.9 6.5-6.1-4.4-6.1 4.4 1.9-6.5-5.1-4h6.5z" fill="#c9a227"></path>
    </svg>
  `;

  wheel.append(dividers, cap);

  return { wheel, labelNodes };
}

function buildOverlay(fields, block, isPreview) {
  const campaignId = getCampaignId(fields, block);
  const headingLineOne = cellText(fields['heading-line-1']);
  const headingLineTwo = cellText(fields['heading-line-2']);
  const eyebrow = cellText(fields.eyebrow);
  const descriptionCell = fields.description;
  const resultHeadline = cellText(fields['result-headline']) || DEFAULTS.resultHeadline;
  const finePrintCell = fields['fine-print'];
  const trigger = isPreview ? 'immediate' : normalizeTrigger(cellText(fields.trigger));
  const triggerDelay = parsePositiveNumber(cellText(fields['trigger-delay']), DEFAULTS.triggerDelay);
  const triggerScroll = clamp(
    parsePositiveNumber(cellText(fields['trigger-scroll']), DEFAULTS.triggerScroll),
    0,
    100,
  );
  const spinButtonText = cellText(fields['spin-button-text']) || DEFAULTS.spinButtonText;
  const noThanksText = cellText(fields['no-thanks-text']) || DEFAULTS.noThanksText;
  const copyButtonText = cellText(fields['copy-button-text']) || DEFAULTS.copyButtonText;
  const slices = parseSlices(fields);

  if (
    !headingLineOne
    || !headingLineTwo
    || !eyebrow
    || !descriptionCell
    || !finePrintCell
    || slices.length !== SLICE_COUNT
  ) {
    return null;
  }

  const headingId = `mwp-heading-${campaignId}`;
  const descId = `mwp-description-${campaignId}`;

  const overlay = document.createElement('div');
  overlay.className = 'mwp-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', headingId);
  overlay.setAttribute('aria-describedby', descId);
  overlay.dataset.campaignId = campaignId;

  const modal = document.createElement('div');
  modal.className = 'mwp-modal';

  const close = document.createElement('button');
  close.className = 'mwp-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close spin-to-win offer');
  close.innerHTML = '<span></span>';

  const visual = document.createElement('div');
  visual.className = 'mwp-visual';
  visual.innerHTML = `
    <div class="mwp-scan"></div>
    <div class="mwp-corner mwp-corner-tl"></div>
    <div class="mwp-corner mwp-corner-tr"></div>
  `;

  const visualCopy = document.createElement('div');
  visualCopy.className = 'mwp-visual-copy';
  visualCopy.innerHTML = `
    <div class="mwp-eyebrow">${eyebrow}</div>
    <h2 id="${headingId}" class="mwp-heading">
      <span>${headingLineOne}</span>
      <span class="accent">${headingLineTwo}</span>
    </h2>
  `;
  visual.append(visualCopy);

  const visualBadge = document.createElement('div');
  visualBadge.className = 'mwp-visual-badge';
  visualBadge.innerHTML = `
    <span class="mwp-visual-badge-value">${SLICE_COUNT}</span>
    <span class="mwp-visual-badge-label">Winning Slices</span>
  `;
  visual.append(visualBadge);

  const body = document.createElement('div');
  body.className = 'mwp-body';

  const description = document.createElement('div');
  description.className = 'mwp-description';
  description.id = descId;
  cloneCellContent(descriptionCell, description);

  const stage = document.createElement('div');
  stage.className = 'mwp-stage';

  const wheelCluster = document.createElement('div');
  wheelCluster.className = 'mwp-wheel-cluster';
  const wheelWrap = document.createElement('div');
  wheelWrap.className = 'mwp-wheel-wrap';
  const pointer = document.createElement('div');
  pointer.className = 'mwp-pointer';
  pointer.innerHTML = '<span></span>';
  const wheelRing = document.createElement('div');
  wheelRing.className = 'mwp-wheel-ring';

  const { wheel, labelNodes } = buildWheel(slices);
  wheelWrap.append(pointer, wheelRing, wheel);
  wheelCluster.append(wheelWrap);

  const actionPanel = document.createElement('div');
  actionPanel.className = 'mwp-action-panel';
  actionPanel.innerHTML = `
    <div class="mwp-panel-eyebrow">Spin-to-Reveal</div>
    <div class="mwp-panel-title">Eight authored offers. One tactical spin.</div>
    <div class="mwp-panel-copy">Every slice is a win, and each outcome is chosen with equal odds across the wheel.</div>
    <div class="mwp-facts">
      <div class="mwp-fact"><span class="mwp-fact-value">8</span><span class="mwp-fact-label">Equal slices</span></div>
      <div class="mwp-fact"><span class="mwp-fact-value">1x</span><span class="mwp-fact-label">Per display</span></div>
      <div class="mwp-fact"><span class="mwp-fact-value">100%</span><span class="mwp-fact-label">Winning outcomes</span></div>
    </div>
  `;

  const actionButtons = document.createElement('div');
  actionButtons.className = 'mwp-actions';

  const spinButton = document.createElement('button');
  spinButton.className = 'mwp-btn mwp-btn-primary mwp-spin-btn';
  spinButton.type = 'button';
  const spinShine = document.createElement('span');
  spinShine.className = 'mwp-btn-shine';
  const spinLabel = document.createElement('span');
  spinLabel.className = 'mwp-btn-label';
  spinLabel.textContent = spinButtonText;
  spinButton.append(spinShine, spinLabel);

  const dismissButton = document.createElement('button');
  dismissButton.className = 'mwp-btn mwp-btn-secondary mwp-dismiss-btn';
  dismissButton.type = 'button';
  dismissButton.textContent = noThanksText;

  actionButtons.append(spinButton, dismissButton);
  actionPanel.append(actionButtons);
  stage.append(wheelCluster, actionPanel);

  const result = document.createElement('div');
  result.className = 'mwp-result';
  result.hidden = true;
  result.setAttribute('aria-live', 'polite');
  result.innerHTML = `
    <div class="mwp-result-kicker">${resultHeadline}</div>
    <div class="mwp-result-label"></div>
    <h3 class="mwp-result-title"></h3>
    <div class="mwp-result-description"></div>
    <div class="mwp-code-row" hidden>
      <div class="mwp-code-box"><span class="mwp-code-value"></span></div>
      <button class="mwp-copy-btn" type="button">${copyButtonText}</button>
    </div>
    <div class="mwp-result-cta-wrap" hidden></div>
  `;

  const finePrint = document.createElement('div');
  finePrint.className = 'mwp-fine-print';
  cloneCellContent(finePrintCell, finePrint);

  body.append(description, stage, result, finePrint);
  modal.append(close, visual, body);
  overlay.append(modal);

  return {
    campaignId,
    overlay,
    trigger,
    triggerDelay,
    triggerScroll,
    slices,
    wheel,
    labelNodes,
    spinButton,
    dismissButton,
    result,
    copyButtonText,
    spinLabel,
  };
}

function setupTrigger(config, showPopup) {
  if (config.trigger === 'immediate') {
    showPopup();
    return () => {};
  }

  if (config.trigger === 'time') {
    const timeoutId = window.setTimeout(showPopup, config.triggerDelay * 1000);
    return () => window.clearTimeout(timeoutId);
  }

  if (config.trigger === 'scroll') {
    const check = () => {
      const maxScroll = (document.body.scrollHeight || 0) - window.innerHeight;
      if (maxScroll <= 0) {
        window.removeEventListener('scroll', check);
        showPopup();
        return;
      }

      if ((window.scrollY / maxScroll) * 100 >= config.triggerScroll) {
        window.removeEventListener('scroll', check);
        showPopup();
      }
    };

    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }

  if (config.trigger === 'exit') {
    const handleExit = (event) => {
      if ((event.clientY ?? 999) <= 10) {
        document.removeEventListener('mouseout', handleExit);
        showPopup();
      }
    };

    document.addEventListener('mouseout', handleExit);
    return () => document.removeEventListener('mouseout', handleExit);
  }

  if (config.trigger === 'first-interaction') {
    const handleInteraction = () => {
      document.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      showPopup();
    };

    document.addEventListener('click', handleInteraction);
    window.addEventListener('scroll', handleInteraction, { passive: true });
    return () => {
      document.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }

  const timeoutId = window.setTimeout(showPopup, config.triggerDelay * 1000);
  return () => window.clearTimeout(timeoutId);
}

export default function decorate(block) {
  const fields = parseFieldRows(block);
  if (!Object.keys(fields).length) {
    block.hidden = true;
    return;
  }

  const isPreview = isMcxLibraryPreviewPath(window.location.pathname);
  const popup = buildOverlay(fields, block, isPreview);
  if (!popup) {
    block.replaceChildren();
    block.hidden = true;
    return;
  }

  const resultLabel = popup.result.querySelector('.mwp-result-label');
  const resultTitle = popup.result.querySelector('.mwp-result-title');
  const resultDescription = popup.result.querySelector('.mwp-result-description');
  const codeRow = popup.result.querySelector('.mwp-code-row');
  const codeValue = popup.result.querySelector('.mwp-code-value');
  const copyButton = popup.result.querySelector('.mwp-copy-btn');
  const ctaWrap = popup.result.querySelector('.mwp-result-cta-wrap');

  let hasShown = false;
  let cleanupTrigger = () => {};

  block.closest('.section')?.classList.add('mcx-wheel-popup-section');
  block.replaceChildren();
  block.hidden = true;

  function showPopup() {
    if (hasShown) return;
    if (!isPreview && hasBeenSeen(popup.campaignId)) return;

    cleanupTrigger();
    hasShown = true;
    if (!isPreview) markSeen(popup.campaignId);

    const previousActiveElement = document.activeElement;
    let spinTimeoutId = null;
    let isClosed = false;

    const focusResultAction = () => {
      const firstResultAction = getFocusableElements(popup.result)[0];
      (firstResultAction || getFocusableElements(popup.overlay)[0])?.focus();
    };

    const closePopup = () => {
      if (isClosed) return;
      isClosed = true;
      if (spinTimeoutId) window.clearTimeout(spinTimeoutId);
      document.removeEventListener('keydown', handleKeydown);
      popup.overlay.remove();
      document.body.classList.remove('mcx-wheel-popup-open');
      previousActiveElement?.focus?.();
    };

    const showResult = (selectedIndex) => {
      const slice = popup.slices[selectedIndex];
      popup.overlay.classList.add('is-result');
      popup.wheel.dataset.selectedSlice = String(selectedIndex + 1);
      popup.labelNodes.forEach((labelNode, index) => {
        labelNode.classList.toggle('is-selected', index === selectedIndex);
      });

      resultLabel.textContent = slice.label;
      resultTitle.textContent = slice.title;
      resultDescription.replaceChildren();
      cloneCellContent(slice.descriptionCell, resultDescription);

      if (slice.code) {
        codeRow.hidden = false;
        codeValue.textContent = slice.code;
        setCopyFeedback(copyButton, popup.copyButtonText, '');
      } else {
        codeRow.hidden = true;
        codeValue.textContent = '';
      }

      ctaWrap.replaceChildren();
      if (slice.cta) {
        const ctaLink = buildCtaLink('mwp-btn mwp-btn-primary mwp-result-cta', slice.cta, DEFAULTS.ctaText);
        if (ctaLink) {
          ctaLink.addEventListener('click', closePopup);
          ctaWrap.append(ctaLink);
          ctaWrap.hidden = false;
        } else {
          ctaWrap.hidden = true;
        }
      } else {
        ctaWrap.hidden = true;
      }

      popup.result.hidden = false;
      popup.spinButton.hidden = true;
      popup.dismissButton.textContent = 'Close';
      focusResultAction();
    };

    const startSpin = () => {
      if (popup.overlay.classList.contains('is-result')) return;

      popup.spinButton.disabled = true;
      popup.dismissButton.disabled = true;
      popup.spinButton.classList.add('is-spinning');
      popup.spinLabel.textContent = 'Spinning…';

      const selectedIndex = Math.floor(Math.random() * popup.slices.length);
      const degPer = 360 / popup.slices.length;
      const midpoint = (selectedIndex + 0.5) * degPer;
      const extraSpins = prefersReducedMotion() ? 360 : 2160;
      const currentRotation = Number.parseFloat(popup.wheel.dataset.rotation || '0') || 0;
      const needed = (270 - midpoint - (currentRotation % 360) + 720) % 360;
      const targetRotation = currentRotation + extraSpins + (needed === 0 ? 360 : needed);
      const spinDuration = prefersReducedMotion() ? 30 : 4200;

      popup.wheel.dataset.rotation = String(targetRotation);
      popup.wheel.style.transition = `transform ${spinDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      popup.wheel.style.transform = `rotate(${targetRotation}deg)`;

      spinTimeoutId = window.setTimeout(() => {
        spinTimeoutId = null;
        popup.dismissButton.disabled = false;
        showResult(selectedIndex);
      }, spinDuration);
    };

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        closePopup();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = getFocusableElements(popup.overlay);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    popup.overlay.querySelector('.mwp-close')?.addEventListener('click', closePopup);
    popup.overlay.addEventListener('click', (event) => {
      if (event.target === popup.overlay) closePopup();
    });
    popup.spinButton.addEventListener('click', startSpin);
    popup.dismissButton.addEventListener('click', closePopup);
    copyButton.addEventListener('click', () => {
      if (!codeValue.textContent) return;
      copyCode(codeValue.textContent, copyButton, popup.copyButtonText);
    });

    document.body.append(popup.overlay);
    document.body.classList.add('mcx-wheel-popup-open');
    document.addEventListener('keydown', handleKeydown);

    requestAnimationFrame(() => {
      popup.overlay.classList.add('is-visible');
      getFocusableElements(popup.overlay)[0]?.focus();
    });
  }

  cleanupTrigger = setupTrigger(popup, showPopup);
}
