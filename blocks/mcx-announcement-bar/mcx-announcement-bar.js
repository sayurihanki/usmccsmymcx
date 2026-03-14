import {
  cellText,
  duplicateItems,
  getRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const rows = getRows(block);
  let dismissible = true;

  const items = rows.reduce((acc, row) => {
    const [firstCell, secondCell] = row;
    if (secondCell && cellText(firstCell).toLowerCase() === 'dismissible') {
      dismissible = cellText(secondCell).toLowerCase() !== 'false';
      return acc;
    }

    const value = cellText(firstCell);
    if (value) acc.push(value);
    return acc;
  }, []);

  const bar = document.createElement('div');
  bar.className = 'ann-bar';

  const track = document.createElement('div');
  track.className = 'ann-scroll';

  duplicateItems(items).forEach((item) => {
    const node = document.createElement('span');
    node.className = 'ann-item';
    node.textContent = item;
    track.append(node);
  });

  bar.append(track);

  if (dismissible) {
    const close = document.createElement('button');
    close.className = 'ann-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close announcement bar');
    close.textContent = 'X';
    close.addEventListener('click', () => {
      const section = block.closest('.section');
      if (section) section.remove();
    });
    bar.append(close);
  }

  block.replaceChildren(bar);
}
