import type { GameCardI } from '@/utils/type';

interface SliderSizesI {
  featured: number;
  side: number;
  peek: number;
  gap: number;
}

const AUTOPLAY_DELAY = 4000;
const INFO_MIN_WIDTH = 288;
const INFO_MAX_DISTANCE = 2;
const DESKTOP_MEDIA = '(min-width: 769px)';
const DRAG_THRESHOLD = 8;
const SNAP_FACTOR = 0.18;
const COMPACT_CLASS = 'game-card--compact';
const DRAGGING_CLASS = 'slider--dragging';
const READY_CLASS = 'slider--ready';

const starIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 20 19" fill="none" aria-hidden="true"><path d="M6.85 14.825L10 12.925L13.15 14.85L12.325 11.25L15.1 8.85L11.45 8.525L10 5.125L8.55 8.5L4.9 8.825L7.675 11.25L6.85 14.825ZM3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" fill="#FFD02B"/></svg>`;

const heartIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 20 19" fill="none" aria-hidden="true"><path d="M10 18.35L8.55 17.05C6.86667 15.5333 5.475 14.225 4.375 13.125C3.275 12.025 2.4 11.0417 1.75 10.175C1.1 9.29167 0.641667 8.48333 0.375 7.75C0.125 7.01667 0 6.26667 0 5.5C0 3.93333 0.525 2.625 1.575 1.575C2.625 0.525 3.93333 0 5.5 0C6.36667 0 7.19167 0.183333 7.975 0.55C8.75833 0.916667 9.43333 1.43333 10 2.1C10.5667 1.43333 11.2417 0.916667 12.025 0.55C12.8083 0.183333 13.6333 0 14.5 0C16.0667 0 17.375 0.525 18.425 1.575C19.475 2.625 20 3.93333 20 5.5C20 6.26667 19.8667 7.01667 19.6 7.75C19.35 8.48333 18.9 9.29167 18.25 10.175C17.6 11.0417 16.725 12.025 15.625 13.125C14.525 14.225 13.1333 15.5333 11.45 17.05L10 18.35ZM10 15.65C11.6 14.2167 12.9167 12.9917 13.95 11.975C14.9833 10.9417 15.8 10.05 16.4 9.3C17 8.53333 17.4167 7.85834 17.65 7.275C17.8833 6.675 18 6.08333 18 5.5C18 4.5 17.6667 3.66667 17 3C16.3333 2.33333 15.5 2 14.5 2C13.7167 2 12.9917 2.225 12.325 2.675C11.6583 3.10833 11.2 3.66667 10.95 4.35H9.05C8.8 3.66667 8.34167 3.10833 7.675 2.675C7.00833 2.225 6.28333 2 5.5 2C4.5 2 3.66667 2.33333 3 3C2.33333 3.66667 2 4.5 2 5.5C2 6.08333 2.11667 6.675 2.35 7.275C2.58333 7.85834 3 8.53333 3.6 9.3C4.2 10.05 5.01667 10.9417 6.05 11.975C7.08333 12.9917 8.4 14.2167 10 15.65Z" fill="#FF4B4B"/></svg>`;

const previousIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.825 9L9.425 14.6L8 16L1.19209e-07 8L8 -9.53674e-07L9.425 1.4L3.825 7H16V9H3.825Z" fill="#242145"/></svg>`;

const nextIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M12.175 9H1.19209e-07V7H12.175L6.575 1.4L8 -9.53674e-07L16 8L8 16L6.575 14.6L12.175 9Z" fill="#242145"/></svg>`;

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function widthForDistance(distance: number, sizes: SliderSizesI): number {
  if (distance <= 1) return lerp(sizes.featured, sizes.side, distance);
  if (distance <= 2) return lerp(sizes.side, sizes.peek, distance - 1);
  return sizes.peek;
}

function centerForDistance(distance: number, sizes: SliderSizesI): number {
  const near = sizes.featured / 2 + sizes.gap + sizes.side / 2;
  if (distance <= 1) return lerp(0, near, distance);

  const middle = near + sizes.side / 2 + sizes.gap + sizes.peek / 2;
  if (distance <= 2) return lerp(near, middle, distance - 1);

  const far = middle + sizes.peek + sizes.gap;
  if (distance <= 3) return lerp(middle, far, distance - 2);

  return far + (distance - 3) * (sizes.peek + sizes.gap);
}

function formatLikes(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function probeWidth(slider: HTMLElement, name: string): number {
  const probe = slider.querySelector<HTMLElement>(`.slider__probe-item--${name}`);
  return probe?.getBoundingClientRect().width ?? 0;
}

function measureSizes(slider: HTMLElement): SliderSizesI {
  return {
    featured: probeWidth(slider, 'featured'),
    side: probeWidth(slider, 'side'),
    peek: probeWidth(slider, 'peek'),
    gap: probeWidth(slider, 'gap'),
  };
}

function createCard(game: GameCardI): HTMLElement {
  const card = document.createElement('article');
  card.classList.add('game-card');
  card.innerHTML = `
    <img class="game-card__image" src="${game.cardImage}" alt="${game.name}" loading="lazy" decoding="async">
    <div class="game-card__overlay">
      <h3 class="game-card__title">${game.name}</h3>
      <div class="game-card__stats">
        <span><span class="game-card__star" aria-hidden="true">${starIcon}</span>${game.rating.toFixed(1)}</span>
        <span><span class="game-card__heart" aria-hidden="true">${heartIcon}</span>${formatLikes(game.likesCount)}</span>
      </div>
    </div>
    <button class="game-card__trigger" type="button" aria-label="View details for ${game.name}" data-open-game-details></button>
  `;

  return card;
}

export function createSliderSection(games: GameCardI[]): HTMLElement {
  const slider = document.createElement('section');
  slider.classList.add('section__slider');
  slider.innerHTML = `
    <div class="container">
      <div class="slider__header">
        <div class="subtitle">
          <div class="subtitle_accent"></div>
          <h2 class="subtitle_title">New Games</h2>
        </div>
        <div class="slider__button">
          <button class="slider__button-item slider__button-item--prev" type="button" aria-label="Show previous games">${previousIcon}</button>
          <button class="slider__button-item slider__button-item--next" type="button" aria-label="Show next games">${nextIcon}</button>
        </div>
      </div>
      <div class="slider__container">
        <div class="slider__inner"></div>
      </div>
      <div class="slider__probe" aria-hidden="true">
        <span class="slider__probe-item slider__probe-item--featured"></span>
        <span class="slider__probe-item slider__probe-item--side"></span>
        <span class="slider__probe-item slider__probe-item--peek"></span>
        <span class="slider__probe-item slider__probe-item--gap"></span>
      </div>
    </div>
  `;

  const inner = slider.querySelector<HTMLElement>('.slider__inner');
  const cards = games.map((game) => createCard(game));
  inner?.append(...cards);

  const count = cards.length;
  let sizes = measureSizes(slider);
  let isDesktop = globalThis.matchMedia(DESKTOP_MEDIA).matches;
  let position = 0;
  let target = 0;
  let isDragging = false;
  let didDrag = false;
  let activePointerId: number | undefined;
  let pointerStartX = 0;
  let pointerStartPosition = 0;
  let animationFrame = 0;
  let autoplayTimer: number | undefined;
  let autoplayDeadline = 0;
  let autoplayRemaining = AUTOPLAY_DELAY;

  function render(): void {
    for (const [index, card] of cards.entries()) {
      const wraps = Math.round((position - index) / count);
      const distance = index + wraps * count - position;
      const absolute = Math.abs(distance);
      const width = widthForDistance(absolute, sizes);
      const center = Math.sign(distance) * centerForDistance(absolute, sizes);
      const showInfo = width >= INFO_MIN_WIDTH || (isDesktop && absolute < INFO_MAX_DISTANCE);

      card.style.width = `${width}px`;
      card.style.transform = `translate(-50%, -50%) translateX(${center}px)`;
      card.classList.toggle(COMPACT_CLASS, !showInfo);
    }
  }

  function step(): void {
    animationFrame = 0;
    if (isDragging) return;

    const difference = target - position;
    if (Math.abs(difference) < 0.0005) {
      position = target;
      render();
      return;
    }

    position += difference * SNAP_FACTOR;
    render();
    animationFrame = requestAnimationFrame(step);
  }

  function startAnimation(): void {
    if (animationFrame === 0) animationFrame = requestAnimationFrame(step);
  }

  function scheduleAutoplay(delay: number): void {
    if (autoplayTimer !== undefined) clearTimeout(autoplayTimer);

    autoplayRemaining = delay;
    autoplayDeadline = performance.now() + delay;
    autoplayTimer = setTimeout(() => {
      autoplayTimer = undefined;
      autoplayRemaining = AUTOPLAY_DELAY;
      target = Math.round(target) + 1;
      startAnimation();
      scheduleAutoplay(AUTOPLAY_DELAY);
    }, delay);
  }

  function pauseAutoplay(): void {
    if (autoplayTimer === undefined) return;

    clearTimeout(autoplayTimer);
    autoplayTimer = undefined;
    autoplayRemaining = Math.max(0, autoplayDeadline - performance.now());
  }

  function resumeAutoplay(): void {
    scheduleAutoplay(Math.max(0, autoplayRemaining));
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;

    isDragging = true;
    didDrag = false;
    activePointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartPosition = position;
    slider.classList.add(DRAGGING_CLASS);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    pauseAutoplay();
  }

  function onPointerMove(event: PointerEvent): void {
    if (!isDragging || event.pointerId !== activePointerId) return;

    const movement = event.clientX - pointerStartX;
    if (Math.abs(movement) > DRAG_THRESHOLD) didDrag = true;

    const stepWidth = sizes.featured / 2 + sizes.gap + sizes.side / 2;
    position = pointerStartPosition - movement / stepWidth;
    target = position;
    render();
  }

  function onPointerUp(event: PointerEvent): void {
    if (!isDragging || event.pointerId !== activePointerId) return;

    isDragging = false;
    activePointerId = undefined;
    slider.classList.remove(DRAGGING_CLASS);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);

    target = Math.round(position);
    startAnimation();

    if (didDrag) {
      scheduleAutoplay(AUTOPLAY_DELAY);
    } else {
      resumeAutoplay();
    }
  }

  function onResize(): void {
    if (!slider.isConnected) {
      globalThis.removeEventListener('resize', onResize);
      return;
    }

    isDesktop = globalThis.matchMedia(DESKTOP_MEDIA).matches;
    sizes = measureSizes(slider);
    render();
  }

  slider.addEventListener(
    'click',
    (event) => {
      if (!didDrag) return;

      didDrag = false;
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest('[data-open-game-details]')) return;

      event.preventDefault();
      event.stopPropagation();
    },
    { capture: true },
  );

  inner?.addEventListener('pointerdown', onPointerDown);
  globalThis.addEventListener('resize', onResize);

  const previousButton = slider.querySelector<HTMLButtonElement>('.slider__button-item--prev');
  const nextButton = slider.querySelector<HTMLButtonElement>('.slider__button-item--next');

  previousButton?.addEventListener('click', () => {
    target = Math.round(target) - 1;
    startAnimation();
    scheduleAutoplay(AUTOPLAY_DELAY);
  });

  nextButton?.addEventListener('click', () => {
    target = Math.round(target) + 1;
    startAnimation();
    scheduleAutoplay(AUTOPLAY_DELAY);
  });

  requestAnimationFrame(() => {
    sizes = measureSizes(slider);
    render();
    slider.classList.add(READY_CLASS);
    scheduleAutoplay(AUTOPLAY_DELAY);
  });

  return slider;
}
