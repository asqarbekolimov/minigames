import illustrationSideImage from '@/assets/images/illustration-side.png';
import '@/pages/home/home-page.scss';

export function createCtaSection(): HTMLElement {
  const cta = document.createElement('section');

  cta.classList.add('section__cta');

  cta.innerHTML = `
    <div class="container">
      <div class="cta__illustration">
        <img src="${illustrationSideImage}" alt="Illustration of a developer desk" />
      </div>

      <div class="cta__card">
        <h2 class="cta__title">Are You a Game Developer?</h2>
        <p class="cta__description">Want to see your game on MiniGames? We're always looking for fun,
        engaging mini games to add to our platform. Submit your game
        and reach thousands of players!</p>
        <button class="cta__button">
        <span class="cta__button-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
        </span>
        <span class="cta__button-text">
          Submit Form
        </span>
        </button>
        <p class="cta__contact">or contact us at developers@minigames.com</p>
      </div>
    
    </div>
  `;

  return cta;
}
