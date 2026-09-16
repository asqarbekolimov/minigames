import './home-page.scss';

export function createHomePage(): HTMLElement {
  const homePage = document.createElement('main');

  homePage.innerHTML = `
    <section>
      <h1>Hello, World!</h1>
      <button class="start-button">Start Game</button>
    </section>
  `;

  return homePage;
}
