export function createSliderSection(): HTMLElement {
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
          <button class="slider__button-item slider__button-item--prev" type="button" aria-label="prev" disabled="disabled">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.825 9L9.425 14.6L8 16L1.19209e-07 8L8 -9.53674e-07L9.425 1.4L3.825 7H16V9H3.825Z" fill="#242145"/></svg>
          </button>
          <button class="slider__button-item slider__button-item--next" type="button" aria-label="next" disabled="disabled">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12.175 9H1.19209e-07V7H12.175L6.575 1.4L8 -9.53674e-07L16 8L8 16L6.575 14.6L12.175 9Z" fill="#242145"/></svg>
          </button>
        </div>
      </div>
      <div class="slider__contianer">
        <div class="slider__inner">
        
        </div>
      </div>
    </div>
  `;

  return slider;
}
