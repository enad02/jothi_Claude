import { album } from './manifest.js';

const pages = [{ id: 'cover', label: 'Cover' }, ...album.pages];
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const stage = document.querySelector('#book-stage');
const cover = document.querySelector('#cover-page');
const photoPage = document.querySelector('#photo-page');
const photo = document.querySelector('#photo');
const caption = document.querySelector('#photo-caption');
const leaf = document.querySelector('#turn-leaf');
const leafImage = document.querySelector('#turn-image');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const pageCount = document.querySelector('#page-count');
const drawer = document.querySelector('#thumbnail-drawer');
const thumbnails = document.querySelector('#thumbnails');
const thumbnailGrid = document.querySelector('#thumbnail-grid');
let current = 0;
let turning = false;
let turnTimer = 0;
let touchStartX = 0;

function imageFor(index) { return index > 0 && index < pages.length ? pages[index].src : null; }

function preload(index) {
  const src = imageFor(index);
  if (!src) return;
  const image = new Image();
  image.src = src;
}

function render(index) {
  current = index;
  const page = pages[index];
  const isCover = index === 0;
  cover.classList.toggle('is-hidden', !isCover);
  photoPage.classList.toggle('is-hidden', isCover);
  if (!isCover) {
    photo.src = page.src;
    photo.alt = `${page.label}'s page from the Jothi Teachers and Family Get-together`;
    caption.textContent = page.label;
  }
  previous.disabled = false;
  next.disabled = false;
  pageCount.textContent = isCover ? `Cover · 0 of ${album.pages.length} photos` : `Page ${index} of ${album.pages.length} photos`;
  thumbnailGrid.querySelectorAll('button').forEach((button, pageIndex) => button.setAttribute('aria-current', pageIndex === index ? 'page' : 'false'));
  preload(index === 0 ? pages.length - 1 : index - 1);
  preload(index === pages.length - 1 ? 0 : index + 1);
}

function finishTurn() {
  window.clearTimeout(turnTimer);
  turnTimer = 0;
  leaf.removeEventListener('animationend', finishTurn);
  leaf.removeEventListener('animationcancel', finishTurn);
  leaf.className = 'turn-leaf is-hidden';
  leafImage.removeAttribute('src');
  turning = false;
}

function turnTo(index, direction = index > current ? 'next' : 'previous') {
  if (index < 0 || index >= pages.length || index === current) return;
  // A new navigation request deliberately completes any interrupted turn first.
  if (turning) finishTurn();
  const from = current;
  if (prefersReducedMotion.matches || from === 0) {
    render(index);
    return;
  }
  turning = true;
  leafImage.src = imageFor(from);
  leaf.className = `turn-leaf is-turning-${direction}`;
  render(index);
  leaf.addEventListener('animationend', finishTurn, { once: true });
  leaf.addEventListener('animationcancel', finishTurn, { once: true });
  // Covers a hidden tab or any browser that drops the CSS animation event.
  turnTimer = window.setTimeout(finishTurn, 720);
}

function moveBy(distance) {
  const target = (current + distance + pages.length) % pages.length;
  turnTo(target, distance > 0 ? 'next' : 'previous');
}

function buildThumbnails() {
  pages.forEach((page, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumbnail';
    button.dataset.page = index;
    button.setAttribute('aria-label', `Open ${page.label}`);
    if (index === 0) {
      button.innerHTML = '<span>Cover</span>';
    } else {
      const image = document.createElement('img');
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.dataset.src = page.src;
      button.append(image);
      const label = document.createElement('span');
      label.textContent = page.label;
      button.append(label);
    }
    button.addEventListener('click', () => { turnTo(index); closeDrawer(); stage.focus(); });
    thumbnailGrid.append(button);
  });
}

function openDrawer() {
  drawer.hidden = false;
  thumbnails.setAttribute('aria-expanded', 'true');
  lazyLoadThumbnails();
}

function closeDrawer() { drawer.hidden = true; thumbnails.setAttribute('aria-expanded', 'false'); }

previous.addEventListener('click', () => moveBy(-1));
next.addEventListener('click', () => moveBy(1));
thumbnails.addEventListener('click', () => drawer.hidden ? openDrawer() : closeDrawer());
document.querySelector('#close-thumbnails').addEventListener('click', closeDrawer);
document.querySelector('#fullscreen').addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.querySelector('.album-shell').requestFullscreen();
});
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target instanceof Element && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveBy(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); moveBy(1); }
  if (event.key === 'Home') { event.preventDefault(); turnTo(0); }
  if (event.key === 'End') { event.preventDefault(); turnTo(pages.length - 1); }
});

function lazyLoadThumbnails() {
  const pending = [...thumbnailGrid.querySelectorAll('img[data-src]')];
  const load = (image) => { image.src = image.dataset.src; image.removeAttribute('data-src'); };
  if (!('IntersectionObserver' in window)) { pending.forEach(load); return; }
  const observer = new IntersectionObserver((entries, instance) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
      load(entry.target);
      instance.unobserve(entry.target);
    });
  }, { root: null, rootMargin: '160px' });
  pending.forEach((image) => observer.observe(image));
}
stage.addEventListener('pointerdown', (event) => { touchStartX = event.clientX; });
stage.addEventListener('pointerup', (event) => {
  const distance = event.clientX - touchStartX;
  if (Math.abs(distance) > 42) moveBy(distance < 0 ? 1 : -1);
});
buildThumbnails();
render(0);
