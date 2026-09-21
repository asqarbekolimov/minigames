export function createHeroSection(): HTMLElement {
  const hero = document.createElement('section');

  hero.classList.add('section__hero');

  hero.innerHTML = `
    <div class="container">
      <div class="hero__card">
        <h1 class="hero__title">Take a Short Break & Have Fun</h1>
        <p class="hero__text">
          <span class="hero__text-full">
            Discover hundreds of curated casual mini-games. Play instantly in your browser — puzzle, match 3, farm, and board classics.
          </span>
          <span class="hero__text-short">
            Discover hundreds of curated casual mini-games right in your browser.
          </span>
        </p>
        <button class="hero__button">Browse Library</button>
      </div>
    </div>
  `;

  return hero;
}
